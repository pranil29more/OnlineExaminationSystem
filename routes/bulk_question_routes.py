import uuid
import math
import traceback

import pandas as pd

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from extensions import mysql
from utils.decorators import role_required


bulk_question_bp = Blueprint(
    "bulk_question",
    __name__
)


# ==========================================================
# EXCEL COLUMN DEFINITIONS
# ==========================================================

MCQ_COLUMNS = [
    "Question Difficulty",
    "Question",
    "Option A",
    "Option B",
    "Option C",
    "Option D",
    "Correct Answer",
]


CODING_QUESTION_COLUMNS = [
    "Question Key",
    "Language",
    "Question Difficulty",
    "Question",
    "Marks",
    "Starter Code",
]


CODING_TEST_CASE_COLUMNS = [
    "Question Key",
    "Language",
    "Test Case Order",
    "Input Data",
    "Expected Output",
    "Hidden",
]


# ==========================================================
# DIFFICULTY VALUES
# ==========================================================

DIFFICULTIES = {
    "easy": "Easy",
    "medium": "Medium",
    "hard": "Hard",
}


# ==========================================================
# HELPER: TEXT
# ==========================================================

def text(value):

    if value is None:
        return ""

    try:

        if pd.isna(value):
            return ""

    except Exception:
        pass

    return str(value).strip()


# ==========================================================
# HELPER: REQUIRED COLUMNS
# ==========================================================

def required_columns(
    df,
    expected,
    description
):

    actual = [
        str(column).strip()
        for column in df.columns
    ]

    df.columns = actual

    if actual != expected:

        raise ValueError(
            f"Invalid {description} format. "
            f"Required columns are: {expected}"
        )


# ==========================================================
# HELPER: BOOLEAN
# ==========================================================

def as_bool(
    value,
    row
):

    value = text(value).lower()

    if value in {
        "true",
        "yes",
        "1"
    }:

        return True

    if value in {
        "false",
        "no",
        "0"
    }:

        return False

    raise ValueError(
        f"Row {row}: Hidden must be "
        "TRUE/FALSE, YES/NO, or 1/0."
    )


# ==========================================================
# HELPER: MARKS
# ==========================================================

def parse_marks(
    value,
    field_name="Marks"
):

    raw = text(value)

    if raw == "":

        raise ValueError(
            f"{field_name} is required."
        )

    try:

        marks = float(raw)

    except (
        TypeError,
        ValueError
    ):

        raise ValueError(
            f"{field_name} must be a valid number."
        )

    if not math.isfinite(marks):

        raise ValueError(
            f"{field_name} must be a valid finite number."
        )

    if marks <= 0:

        raise ValueError(
            f"{field_name} must be greater than zero."
        )

    return marks


# ==========================================================
# HELPER: TEST CASE ORDER
# ==========================================================

def parse_test_case_order(
    value,
    row
):

    raw = text(value)

    if raw == "":

        raise ValueError(
            f"Test Case Order is required in row {row}."
        )

    try:

        numeric = float(raw)

    except (
        TypeError,
        ValueError
    ):

        raise ValueError(
            f"Invalid Test Case Order in row {row}."
        )

    if not math.isfinite(numeric):

        raise ValueError(
            f"Invalid Test Case Order in row {row}."
        )

    if not numeric.is_integer():

        raise ValueError(
            f"Test Case Order must be a whole number "
            f"in row {row}."
        )

    order = int(numeric)

    if order <= 0:

        raise ValueError(
            f"Test Case Order must be greater than zero "
            f"in row {row}."
        )

    return order


# ==========================================================
# HELPER: VERIFY EXAM
# ==========================================================

def verify_exam(
    cur,
    exam_id
):

    cur.execute(
        """
        SELECT
            exam_id
        FROM exams
        WHERE exam_id = %s
        """,
        (exam_id,)
    )

    return cur.fetchone() is not None


# ==========================================================
# HELPER: GENERATE MCQ QUESTION KEY
#
# MCQ Excel does NOT require a Question Key column.
#
# questions.question_key is required by the database,
# therefore it is generated automatically.
# ==========================================================

def generate_mcq_question_key(
    exam_id
):

    return (
        f"MCQ-{exam_id}-"
        f"{uuid.uuid4().hex[:12]}"
    )


# ==========================================================
# HELPER: CHECK QUESTION KEY ALREADY EXISTS
# ==========================================================

def question_key_exists(
    cur,
    question_key
):

    cur.execute(
        """
        SELECT
            question_id
        FROM questions
        WHERE question_key = %s
        LIMIT 1
        """,
        (question_key,)
    )

    return cur.fetchone() is not None


# ==========================================================
# BACKWARD-COMPATIBLE BULK UPLOAD
# ==========================================================

@bulk_question_bp.route(
    "/bulk-upload-questions",
    methods=["POST"]
)
@jwt_required()
@role_required(
    "Admin",
    "Examiner"
)
def bulk_upload_questions():

    return bulk_upload_mcq_questions()


# ==========================================================
# BULK UPLOAD MCQ QUESTIONS
# ==========================================================

@bulk_question_bp.route(
    "/bulk-upload-mcq-questions",
    methods=["POST"]
)
@jwt_required()
@role_required(
    "Admin",
    "Examiner"
)
def bulk_upload_mcq_questions():

    cur = mysql.connection.cursor()

    exam_id = None
    uploaded = None

    try:

        # ==================================================
        # GET EXAM ID
        # ==================================================

        exam_id = request.form.get(
            "exam_id"
        )

        # ==================================================
        # GET UPLOADED FILE
        # ==================================================

        uploaded = (
            request.files.get("file")
            or
            request.files.get("questions_file")
        )

        # ==================================================
        # VALIDATE EXAM ID
        # ==================================================

        if not exam_id:

            return jsonify({
                "message":
                    "Exam ID is required."
            }), 400

        try:

            exam_id = int(
                exam_id
            )

        except (
            TypeError,
            ValueError
        ):

            return jsonify({
                "message":
                    "Exam ID must be a valid integer."
            }), 400

        # ==================================================
        # VALIDATE FILE
        # ==================================================

        if not uploaded:

            return jsonify({
                "message":
                    "MCQ Questions Excel file is required."
            }), 400

        # ==================================================
        # VERIFY EXAM
        # ==================================================

        if not verify_exam(
            cur,
            exam_id
        ):

            return jsonify({
                "message":
                    "Exam not found."
            }), 404

        # ==================================================
        # VALIDATE FILE EXTENSION
        # ==================================================

        filename = (
            uploaded.filename
            or ""
        )

        if not filename.lower().endswith(
            ".xlsx"
        ):

            return jsonify({
                "message":
                    "MCQ file must be an .xlsx Excel file."
            }), 400

        # ==================================================
        # READ EXCEL
        # ==================================================

        try:

            df = pd.read_excel(
                uploaded,
                engine="openpyxl",
                dtype=object
            )

        except Exception as error:

            return jsonify({
                "message":
                    f"Unable to read Excel file: {str(error)}"
            }), 400

        # ==================================================
        # VALIDATE EXCEL COLUMNS
        # ==================================================

        required_columns(
            df,
            MCQ_COLUMNS,
            "MCQ Questions Excel file"
        )

        # ==================================================
        # EMPTY FILE CHECK
        # ==================================================

        if df.empty:

            return jsonify({
                "message":
                    "The uploaded MCQ file contains no questions."
            }), 400

        # ==================================================
        # VALIDATE MARKS
        #
        # Marks are supplied once for the complete upload.
        # ==================================================

        marks = request.form.get(
            "marks"
        )

        if (
            marks is None
            or
            text(marks) == ""
        ):

            return jsonify({
                "message":
                    "Marks per question are required."
            }), 400

        try:

            marks = parse_marks(
                marks,
                "Marks per question"
            )

        except ValueError as error:

            return jsonify({
                "message":
                    str(error)
            }), 400

        # ==================================================
        # VALIDATED QUESTIONS
        # ==================================================

        validated = []

        seen = set()

        # ==================================================
        # VALIDATE EVERY EXCEL ROW
        # ==================================================

        for idx, row in df.iterrows():

            excel_row = idx + 2

            # --------------------------------------------------
            # READ VALUES
            # --------------------------------------------------

            difficulty = text(
                row[
                    "Question Difficulty"
                ]
            )

            question = text(
                row[
                    "Question"
                ]
            )

            options = [
                text(
                    row[
                        f"Option {letter}"
                    ]
                )
                for letter in "ABCD"
            ]

            correct = text(
                row[
                    "Correct Answer"
                ]
            )

            # --------------------------------------------------
            # REQUIRED FIELD VALIDATION
            # --------------------------------------------------

            if (
                not difficulty
                or
                not question
                or
                not all(options)
                or
                not correct
            ):

                return jsonify({
                    "message":
                        (
                            f"Row {excel_row} contains "
                            "empty required fields."
                        )
                }), 400

            # --------------------------------------------------
            # DIFFICULTY VALIDATION
            # --------------------------------------------------

            difficulty = DIFFICULTIES.get(
                difficulty.lower()
            )

            if not difficulty:

                return jsonify({
                    "message":
                        (
                            f"Invalid difficulty in row "
                            f"{excel_row}. Use Easy, "
                            "Medium, or Hard."
                        )
                }), 400

            # --------------------------------------------------
            # OPTION DUPLICATE VALIDATION
            #
            # CASE-SENSITIVE
            # --------------------------------------------------

            if len(
                set(options)
            ) != 4:

                return jsonify({
                    "message":
                        (
                            f"Row {excel_row} contains "
                            "duplicate options."
                        )
                }), 400

            # --------------------------------------------------
            # CORRECT ANSWER VALIDATION
            #
            # Must exactly match an option.
            # --------------------------------------------------

            matches = [
                option
                for option in options
                if option == correct
            ]

            if not matches:

                return jsonify({
                    "message":
                        (
                            f"Correct Answer in row "
                            f"{excel_row} must exactly "
                            "match one of Option A, "
                            "Option B, Option C, or "
                            "Option D."
                        )
                }), 400

            # --------------------------------------------------
            # DUPLICATE MCQ VALIDATION
            #
            # CASE-SENSITIVE
            # --------------------------------------------------

            fingerprint = (
                question,
                *options
            )

            if fingerprint in seen:

                return jsonify({
                    "message":
                        (
                            f"Duplicate MCQ found "
                            f"in row {excel_row}."
                        )
                }), 400

            seen.add(
                fingerprint
            )

            # --------------------------------------------------
            # STORE VALIDATED QUESTION
            # --------------------------------------------------

            validated.append(
                (
                    question,
                    difficulty,
                    options,
                    matches[0]
                )
            )

        # ==================================================
        # DATABASE INSERT QUERIES
        # ==================================================

        question_sql = """
            INSERT INTO questions
            (
                question_key,
                exam_id,
                type,
                question_text,
                difficulty,
                marks
            )
            VALUES
            (
                %s,
                %s,
                'MCQ',
                %s,
                %s,
                %s
            )
        """

        option_sql = """
            INSERT INTO options
            (
                question_id,
                option_text,
                is_correct
            )
            VALUES
            (
                %s,
                %s,
                %s
            )
        """

        # ==================================================
        # INSERT QUESTIONS + OPTIONS
        # ==================================================

        questions_added = 0

        for (
            question,
            difficulty,
            options,
            correct
        ) in validated:

            # --------------------------------------------------
            # GENERATE REQUIRED QUESTION KEY
            # --------------------------------------------------

            question_key = generate_mcq_question_key(
                exam_id
            )

            # --------------------------------------------------
            # INSERT PARENT QUESTION
            # --------------------------------------------------

            cur.execute(
                question_sql,
                (
                    question_key,
                    exam_id,
                    question,
                    difficulty,
                    marks
                )
            )

            question_id = (
                cur.lastrowid
            )

            if not question_id:

                raise RuntimeError(
                    "Database did not return "
                    "a question ID for MCQ."
                )

            # --------------------------------------------------
            # INSERT OPTIONS
            # --------------------------------------------------

            for option in options:

                cur.execute(
                    option_sql,
                    (
                        question_id,
                        option,
                        option == correct
                    )
                )

            questions_added += 1

        # ==================================================
        # COMMIT
        # ==================================================

        mysql.connection.commit()

        # ==================================================
        # SUCCESS
        # ==================================================

        return jsonify({
            "message":
                (
                    f"{questions_added} MCQ "
                    "question(s) uploaded successfully."
                ),

            "questions_added":
                questions_added
        }), 201

    # ======================================================
    # VALIDATION ERROR
    # ======================================================

    except ValueError as error:

        try:
            mysql.connection.rollback()
        except Exception:
            pass

        print(
            "\n"
            "==================================================\n"
            "MCQ BULK UPLOAD VALIDATION ERROR\n"
            "==================================================\n"
            f"Error Type: {type(error).__name__}\n"
            f"Error Message: {error}\n"
            "==================================================\n"
        )

        return jsonify({
            "message":
                str(error)
        }), 400

    # ======================================================
    # DATABASE / UNEXPECTED ERROR
    # ======================================================

    except Exception as error:

        try:
            mysql.connection.rollback()
        except Exception:
            pass

        print(
            "\n"
            "==================================================\n"
            "MCQ BULK UPLOAD ERROR\n"
            "==================================================\n"
            f"Error Type: {type(error).__name__}\n"
            f"Error Message: {error}\n"
            f"Exam ID: {exam_id}\n"
            f"Uploaded File: "
            f"{getattr(uploaded, 'filename', None)}\n"
            "--------------------------------------------------\n"
        )

        traceback.print_exc()

        print(
            "==================================================\n"
        )

        return jsonify({
            "message":
                "Unable to upload MCQ questions.",
            "error":
                str(error),
            "error_type":
                type(error).__name__,
        }), 500

    # ======================================================
    # CLOSE CURSOR
    # ======================================================

    finally:

        cur.close()


# ==========================================================
# BULK UPLOAD CODING QUESTIONS
# ==========================================================

@bulk_question_bp.route(
    "/bulk-upload-coding-questions",
    methods=["POST"]
)
@jwt_required()
@role_required(
    "Admin",
    "Examiner"
)
def bulk_upload_coding_questions():

    cur = mysql.connection.cursor()

    exam_id = None
    questions_file = None
    test_cases_file = None

    try:

        # ==================================================
        # GET FORM DATA
        # ==================================================

        exam_id = request.form.get(
            "exam_id"
        )

        questions_file = request.files.get(
            "questions_file"
        )

        test_cases_file = request.files.get(
            "test_cases_file"
        )

        # ==================================================
        # BASIC VALIDATION
        # ==================================================

        if not exam_id:

            return jsonify({
                "message":
                    "Exam ID is required."
            }), 400

        if (
            not questions_file
            or not test_cases_file
        ):

            return jsonify({
                "message":
                    (
                        "Both Questions and Test Cases "
                        "Excel files are required."
                    )
            }), 400

        # ==================================================
        # EXAM ID
        # ==================================================

        try:

            exam_id = int(
                exam_id
            )

        except (
            TypeError,
            ValueError
        ):

            return jsonify({
                "message":
                    "Exam ID must be a valid integer."
            }), 400

        # ==================================================
        # VERIFY EXAM
        # ==================================================

        if not verify_exam(
            cur,
            exam_id
        ):

            return jsonify({
                "message":
                    "Exam not found."
            }), 404

        # ==================================================
        # FILE VALIDATION
        # ==================================================

        for uploaded_file, label in (
            (
                questions_file,
                "Questions"
            ),
            (
                test_cases_file,
                "Test Cases"
            ),
        ):

            filename = (
                uploaded_file.filename
                or ""
            ).strip()

            if not filename:

                return jsonify({
                    "message":
                        f"{label} Excel file has no filename."
                }), 400

            if not filename.lower().endswith(
                ".xlsx"
            ):

                return jsonify({
                    "message":
                        (
                            f"{label} file must be "
                            ".xlsx Excel file."
                        )
                }), 400

        # ==================================================
        # READ EXCEL FILES
        # ==================================================

        try:

            qdf = pd.read_excel(
                questions_file,
                engine="openpyxl",
                dtype=object
            )

            tdf = pd.read_excel(
                test_cases_file,
                engine="openpyxl",
                dtype=object
            )

        except Exception as error:

            print(
                "\n"
                "==================================================\n"
                "CODING EXCEL READ ERROR\n"
                "=================================================="
            )

            print(
                f"Error Type: {type(error).__name__}"
            )

            print(
                f"Error Message: {error}"
            )

            traceback.print_exc()

            print(
                "==================================================\n"
            )

            return jsonify({
                "message":
                    "Unable to read coding Excel files.",
                "error":
                    str(error),
            }), 400

        # ==================================================
        # COLUMN VALIDATION
        # ==================================================

        required_columns(
            qdf,
            CODING_QUESTION_COLUMNS,
            "Coding Questions Excel file"
        )

        required_columns(
            tdf,
            CODING_TEST_CASE_COLUMNS,
            "Coding Test Cases Excel file"
        )

        # ==================================================
        # EMPTY FILE VALIDATION
        # ==================================================

        if qdf.empty:

            return jsonify({
                "message":
                    (
                        "The coding Questions file "
                        "contains no questions."
                    )
            }), 400

        if tdf.empty:

            return jsonify({
                "message":
                    (
                        "The coding Test Cases file "
                        "contains no test cases."
                    )
            }), 400

        # ==================================================
        # VALIDATE CODING QUESTIONS
        # ==================================================

        questions = {}

        for idx, row in qdf.iterrows():

            excel_row = idx + 2

            # --------------------------------------------------
            # READ VALUES
            # --------------------------------------------------

            key = text(
                row["Question Key"]
            )

            language = text(
                row["Language"]
            ).lower()

            difficulty_raw = text(
                row["Question Difficulty"]
            )

            question = text(
                row["Question"]
            )

            starter = text(
                row["Starter Code"]
            )

            raw_marks = row["Marks"]

            # --------------------------------------------------
            # REQUIRED FIELDS
            # --------------------------------------------------

            if (
                not key
                or not language
                or not difficulty_raw
                or not question
                or not starter
                or text(raw_marks) == ""
            ):

                return jsonify({
                    "message":
                        (
                            f"Row {excel_row} contains "
                            "empty required fields."
                        )
                }), 400

            # --------------------------------------------------
            # DUPLICATE KEY IN EXCEL
            # --------------------------------------------------

            if key in questions:

                return jsonify({
                    "message":
                        (
                            f"Duplicate Question Key "
                            f"'{key}' in row {excel_row}."
                        )
                }), 400

            # --------------------------------------------------
            # LANGUAGE
            # --------------------------------------------------

            if language != "python":

                return jsonify({
                    "message":
                        (
                            f"Row {excel_row}: only Python "
                            "is currently supported."
                        )
                }), 400

            # --------------------------------------------------
            # DIFFICULTY
            # --------------------------------------------------

            difficulty = DIFFICULTIES.get(
                difficulty_raw.lower()
            )

            if not difficulty:

                return jsonify({
                    "message":
                        (
                            f"Invalid difficulty in row "
                            f"{excel_row}. Use Easy, "
                            "Medium, or Hard."
                        )
                }), 400

            # --------------------------------------------------
            # MARKS
            # --------------------------------------------------

            try:

                marks = parse_marks(
                    raw_marks,
                    f"Marks in row {excel_row}"
                )

            except ValueError as error:

                return jsonify({
                    "message":
                        str(error)
                }), 400

            # --------------------------------------------------
            # STORE VALIDATED QUESTION
            # --------------------------------------------------

            questions[key] = {
                "language":
                    language,

                "difficulty":
                    difficulty,

                "question":
                    question,

                "marks":
                    marks,

                "starter":
                    starter,
            }

        # ==================================================
        # CHECK CODING QUESTION KEYS AGAINST DATABASE
        #
        # Question Key is stored in questions.question_key.
        # ==================================================

        for key in questions:

            if question_key_exists(
                cur,
                key
            ):

                return jsonify({
                    "message":
                        (
                            f"Question Key '{key}' "
                            "already exists in the database."
                        )
                }), 400

        # ==================================================
        # VALIDATE TEST CASES
        # ==================================================

        test_cases = []

        seen_cases = set()

        keys_with_cases = set()

        for idx, row in tdf.iterrows():

            excel_row = idx + 2

            # --------------------------------------------------
            # READ VALUES
            # --------------------------------------------------

            key = text(
                row["Question Key"]
            )

            language = text(
                row["Language"]
            ).lower()

            order_value = row[
                "Test Case Order"
            ]

            input_data = text(
                row["Input Data"]
            )

            expected = text(
                row["Expected Output"]
            )

            # --------------------------------------------------
            # REQUIRED FIELDS
            #
            # Input Data is intentionally allowed to be empty.
            # This supports programs that require no input.
            # --------------------------------------------------

            if (
                not key
                or not language
                or text(order_value) == ""
                or expected == ""
            ):

                return jsonify({
                    "message":
                        (
                            f"Test case row {excel_row} "
                            "contains empty required fields."
                        )
                }), 400

            # --------------------------------------------------
            # QUESTION KEY
            # --------------------------------------------------

            if key not in questions:

                return jsonify({
                    "message":
                        (
                            f"Test case row {excel_row} "
                            f"references unknown Question Key "
                            f"'{key}'."
                        )
                }), 400

            # --------------------------------------------------
            # LANGUAGE
            # --------------------------------------------------

            if language != "python":

                return jsonify({
                    "message":
                        (
                            f"Test case row {excel_row}: "
                            "only Python is currently "
                            "supported."
                        )
                }), 400

            if language != questions[key]["language"]:

                return jsonify({
                    "message":
                        (
                            f"Test case row {excel_row}: "
                            "Language does not match "
                            f"Question Key '{key}'."
                        )
                }), 400

            # --------------------------------------------------
            # TEST CASE ORDER
            # --------------------------------------------------

            try:

                order = parse_test_case_order(
                    order_value,
                    excel_row
                )

            except ValueError as error:

                return jsonify({
                    "message":
                        str(error)
                }), 400

            # --------------------------------------------------
            # HIDDEN
            # --------------------------------------------------

            try:

                hidden = as_bool(
                    row["Hidden"],
                    excel_row
                )

            except ValueError as error:

                return jsonify({
                    "message":
                        str(error)
                }), 400

            # --------------------------------------------------
            # DUPLICATE ORDER
            # --------------------------------------------------

            fingerprint = (
                key,
                order
            )

            if fingerprint in seen_cases:

                return jsonify({
                    "message":
                        (
                            f"Duplicate Test Case Order "
                            f"for Question Key '{key}' "
                            f"in row {excel_row}."
                        )
                }), 400

            seen_cases.add(
                fingerprint
            )

            keys_with_cases.add(
                key
            )

            # --------------------------------------------------
            # STORE TEST CASE
            # --------------------------------------------------

            test_cases.append(
                (
                    key,
                    order,
                    input_data,
                    expected,
                    hidden,
                )
            )

        # ==================================================
        # ENSURE EVERY QUESTION HAS TEST CASES
        # ==================================================

        missing = [
            key
            for key in questions
            if key not in keys_with_cases
        ]

        if missing:

            return jsonify({
                "message":
                    (
                        "Coding question(s) without "
                        "test cases: "
                        + ", ".join(missing)
                    )
            }), 400

        # ==================================================
        # DATABASE INSERT QUERIES
        #
        # IMPORTANT:
        # questions.question_key is now included.
        # ==================================================

        parent_sql = """
            INSERT INTO questions
            (
                question_key,
                exam_id,
                type,
                question_text,
                difficulty,
                marks
            )
            VALUES
            (
                %s,
                %s,
                'CODING',
                %s,
                %s,
                %s
            )
        """

        coding_sql = """
            INSERT INTO coding_questions
            (
                exam_id,
                question_id,
                question_text,
                difficulty,
                marks,
                starter_code,
                language
            )
            VALUES
            (
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s
            )
        """

        test_sql = """
            INSERT INTO test_cases
            (
                coding_question_id,
                input_data,
                expected_output,
                is_hidden
            )
            VALUES
            (
                %s,
                %s,
                %s,
                %s
            )
        """

        # ==================================================
        # CREATE PARENT + CODING QUESTIONS
        # ==================================================

        mapping = {}

        for key, data in questions.items():

            # --------------------------------------------------
            # PARENT QUESTIONS ROW
            #
            # Question Key from Excel is stored here.
            # --------------------------------------------------

            cur.execute(
                parent_sql,
                (
                    key,
                    exam_id,
                    data["question"],
                    data["difficulty"],
                    data["marks"],
                )
            )

            question_id = (
                cur.lastrowid
            )

            if not question_id:

                raise RuntimeError(
                    (
                        "Database did not return a "
                        f"question ID for coding question "
                        f"'{key}'."
                    )
                )

            # --------------------------------------------------
            # CODING QUESTIONS ROW
            # --------------------------------------------------

            cur.execute(
                coding_sql,
                (
                    exam_id,
                    question_id,
                    data["question"],
                    data["difficulty"],
                    data["marks"],
                    data["starter"],
                    data["language"],
                )
            )

            coding_question_id = (
                cur.lastrowid
            )

            if not coding_question_id:

                raise RuntimeError(
                    (
                        "Database did not return a "
                        "coding question ID for "
                        f"'{key}'."
                    )
                )

            mapping[key] = (
                coding_question_id
            )

        # ==================================================
        # INSERT TEST CASES
        # ==================================================

        for (
            key,
            order,
            input_data,
            expected,
            hidden,
        ) in sorted(
            test_cases,
            key=lambda item: (
                item[0],
                item[1],
            )
        ):

            cur.execute(
                test_sql,
                (
                    mapping[key],
                    input_data,
                    expected,
                    hidden,
                )
            )

        # ==================================================
        # COMMIT
        # ==================================================

        mysql.connection.commit()

        # ==================================================
        # SUCCESS
        # ==================================================

        return jsonify({
            "message":
                (
                    "Coding bulk upload "
                    "completed successfully."
                ),

            "questions_added":
                len(questions),

            "test_cases_added":
                len(test_cases),
        }), 201

    # ======================================================
    # VALIDATION ERROR
    # ======================================================

    except ValueError as error:

        try:

            mysql.connection.rollback()

        except Exception:
            pass

        print(
            "\n"
            "==================================================\n"
            "CODING BULK UPLOAD VALIDATION ERROR\n"
            "==================================================\n"
            f"Error Type: {type(error).__name__}\n"
            f"Error Message: {error}\n"
            f"Exam ID: {exam_id}\n"
            "--------------------------------------------------\n"
        )

        return jsonify({
            "message":
                str(error)
        }), 400

    # ======================================================
    # UNEXPECTED / DATABASE ERROR
    # ======================================================

    except Exception as error:

        try:

            mysql.connection.rollback()

        except Exception:
            pass

        print(
            "\n"
            "==================================================\n"
            "CODING BULK UPLOAD ERROR\n"
            "==================================================\n"
            f"Error Type: {type(error).__name__}\n"
            f"Error Message: {error}\n"
            f"Exam ID: {exam_id}\n"
            f"Questions File: "
            f"{getattr(questions_file, 'filename', None)}\n"
            f"Test Cases File: "
            f"{getattr(test_cases_file, 'filename', None)}\n"
            "--------------------------------------------------\n"
        )

        traceback.print_exc()

        print(
            "==================================================\n"
        )

        return jsonify({
            "message":
                "Unable to upload coding questions.",
            "error":
                str(error),
            "error_type":
                type(error).__name__,
        }), 500

    # ======================================================
    # CLOSE CURSOR
    # ======================================================

    finally:

        cur.close()