import pandas as pd

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import mysql


bulk_question_bp = Blueprint(
    "bulk_question",
    __name__,
)


@bulk_question_bp.route(
    "/bulk-upload-questions",
    methods=["POST"],
)
@jwt_required()
def bulk_upload_questions():

    current_user_id = get_jwt_identity()

    cur = mysql.connection.cursor()

    try:

        # ==========================================
        # Verify Admin / Examiner
        # ==========================================

        role_query = """
        SELECT role
        FROM users
        WHERE user_id = %s
        """

        cur.execute(
            role_query,
            (current_user_id,),
        )

        user = cur.fetchone()

        if not user:

            cur.close()

            return (
                jsonify(
                    {
                        "message":
                        "User not found."
                    }
                ),
                404,
            )

        if user[0] not in [
            "Admin",
            "Examiner",
        ]:

            cur.close()

            return (
                jsonify(
                    {
                        "message":
                        "Access denied. Admin or Examiner only."
                    }
                ),
                403,
            )

        # ==========================================
        # Read Form Data
        # ==========================================

        exam_id = request.form.get(
            "exam_id"
        )

        marks = request.form.get(
            "marks"
        )

        uploaded_file = request.files.get(
            "file"
        )

        # ==========================================
        # Basic Validation
        # ==========================================

        if not exam_id:

            cur.close()

            return (
                jsonify(
                    {
                        "message":
                        "Exam ID is required."
                    }
                ),
                400,
            )

        if not marks:

            cur.close()

            return (
                jsonify(
                    {
                        "message":
                        "Marks per question are required."
                    }
                ),
                400,
            )

        if not uploaded_file:

            cur.close()

            return (
                jsonify(
                    {
                        "message":
                        "Questions file is required."
                    }
                ),
                400,
            )

        try:

            exam_id = int(exam_id)

            marks = float(marks)

        except (ValueError, TypeError):

            cur.close()

            return (
                jsonify(
                    {
                        "message":
                        "Exam ID and marks must be valid numbers."
                    }
                ),
                400,
            )

        if marks <= 0:

            cur.close()

            return (
                jsonify(
                    {
                        "message":
                        "Marks must be greater than zero."
                    }
                ),
                400,
            )

        # ==========================================
        # Validate File Type
        # ==========================================

        file_name = (
            uploaded_file.filename or ""
        ).lower()

        if not file_name.endswith(".xlsx"):

            cur.close()

            return (
                jsonify(
                    {
                        "message":
                        "Only .xlsx Excel files are supported."
                    }
                ),
                400,
            )

        # ==========================================
        # Verify Exam Exists
        # ==========================================

        exam_query = """
        SELECT exam_id
        FROM exams
        WHERE exam_id = %s
        """

        cur.execute(
            exam_query,
            (exam_id,),
        )

        exam = cur.fetchone()

        if not exam:

            cur.close()

            return (
                jsonify(
                    {
                        "message":
                        "Exam not found."
                    }
                ),
                404,
            )

        # ==========================================
        # Read Excel File
        # ==========================================

        try:

            dataframe = pd.read_excel(
                uploaded_file,
                engine="openpyxl",
            )

        except Exception as error:

            cur.close()

            return (
                jsonify(
                    {
                        "message":
                        "Unable to read the Excel file.",
                        "error":
                        str(error),
                    }
                ),
                400,
            )

        # ==========================================
        # Mentor's Required Excel Format
        # ==========================================

        required_columns = [
            "Question Difficulty",
            "Question",
            "Option A",
            "Option B",
            "Option C",
            "Option D",
            "Correct Answer",
        ]

        actual_columns = [
            str(column).strip()
            for column in dataframe.columns
        ]

        dataframe.columns = actual_columns

        if actual_columns != required_columns:

            cur.close()

            return (
                jsonify(
                    {
                        "message":
                        "Invalid questions file format.",
                        "required_columns":
                        required_columns,
                    }
                ),
                400,
            )

        # ==========================================
        # Ensure File Contains Questions
        # ==========================================

        if dataframe.empty:

            cur.close()

            return (
                jsonify(
                    {
                        "message":
                        "The uploaded file contains no questions."
                    }
                ),
                400,
            )

        # ==========================================
        # Validate All Questions First
        # ==========================================

        validated_questions = []

        valid_difficulties = [
            "Easy",
            "Medium",
            "Hard",
        ]

        difficulty_lookup = {
            difficulty.lower(): difficulty
            for difficulty in valid_difficulties
        }

        for index, row in dataframe.iterrows():

            # Excel row 1 contains headings.
            excel_row_number = index + 2

            difficulty = row[
                "Question Difficulty"
            ]

            question_text = row[
                "Question"
            ]

            option_a = row[
                "Option A"
            ]

            option_b = row[
                "Option B"
            ]

            option_c = row[
                "Option C"
            ]

            option_d = row[
                "Option D"
            ]

            correct_answer = row[
                "Correct Answer"
            ]

            # ======================================
            # Missing Cell Validation
            # ======================================

            required_values = [
                difficulty,
                question_text,
                option_a,
                option_b,
                option_c,
                option_d,
                correct_answer,
            ]

            if any(
                pd.isna(value)
                for value in required_values
            ):

                cur.close()

                return (
                    jsonify(
                        {
                            "message":
                            f"Row {excel_row_number} contains empty required fields."
                        }
                    ),
                    400,
                )

            # ======================================
            # Normalize Excel Values
            # ======================================

            difficulty = str(
                difficulty
            ).strip()

            question_text = str(
                question_text
            ).strip()

            options = [
                str(option_a).strip(),
                str(option_b).strip(),
                str(option_c).strip(),
                str(option_d).strip(),
            ]

            correct_answer = str(
                correct_answer
            ).strip()

            # ======================================
            # Empty String Validation
            # ======================================

            if (
                not difficulty
                or not question_text
                or not all(options)
                or not correct_answer
            ):

                cur.close()

                return (
                    jsonify(
                        {
                            "message":
                            f"Row {excel_row_number} contains empty required fields."
                        }
                    ),
                    400,
                )

            # ======================================
            # Difficulty Validation
            # ======================================

            normalized_difficulty = (
                difficulty_lookup.get(
                    difficulty.lower()
                )
            )

            if not normalized_difficulty:

                cur.close()

                return (
                    jsonify(
                        {
                            "message":
                            f"Invalid difficulty in row {excel_row_number}. Use Easy, Medium, or Hard."
                        }
                    ),
                    400,
                )

            # ======================================
            # Duplicate Options Validation
            #
            # CASE-SENSITIVE
            # ======================================

            if len(set(options)) != 4:

                cur.close()

                return (
                    jsonify(
                        {
                            "message":
                            f"Row {excel_row_number} contains duplicate options."
                        }
                    ),
                    400,
                )

            # ======================================
            # Correct Answer Validation
            #
            # CASE-SENSITIVE
            # ======================================

            matching_option = None

            for option in options:

                if option == correct_answer:

                    matching_option = option

                    break

            if matching_option is None:

                cur.close()

                return (
                    jsonify(
                        {
                            "message":
                            f"Correct Answer in row {excel_row_number} must exactly match one of Option A, B, C, or D."
                        }
                    ),
                    400,
                )

            # ======================================
            # Store Validated Question
            # ======================================

            validated_questions.append(
                {
                    "difficulty":
                        normalized_difficulty,

                    "question_text":
                        question_text,

                    "options":
                        options,

                    "correct_answer":
                        matching_option,
                }
            )

        # ==========================================
        # Insert Questions
        # ==========================================

        question_query = """
        INSERT INTO questions
        (
            exam_id,
            type,
            question_text,
            difficulty,
            marks
        )
        VALUES
        (
            %s,
            'MCQ',
            %s,
            %s,
            %s
        )
        """

        option_query = """
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

        inserted_questions = 0

        for question in validated_questions:

            cur.execute(
                question_query,
                (
                    exam_id,
                    question[
                        "question_text"
                    ],
                    question[
                        "difficulty"
                    ],
                    marks,
                ),
            )

            question_id = cur.lastrowid

            for option in question[
                "options"
            ]:

                # ======================================
                # CASE-SENSITIVE Correct Answer Match
                # ======================================

                is_correct = (
                    option
                    ==
                    question[
                        "correct_answer"
                    ]
                )

                cur.execute(
                    option_query,
                    (
                        question_id,
                        option,
                        is_correct,
                    ),
                )

            inserted_questions += 1

        # ==========================================
        # Commit Entire Upload
        # ==========================================

        mysql.connection.commit()

        cur.close()

        return (
            jsonify(
                {
                    "message":
                    f"{inserted_questions} question(s) uploaded successfully.",

                    "questions_added":
                    inserted_questions,
                }
            ),
            201,
        )

    except Exception as error:

        # ==========================================
        # Roll Back Entire Upload
        # ==========================================

        mysql.connection.rollback()

        cur.close()

        print(
            "Bulk question upload error:",
            error,
        )

        return (
            jsonify(
                {
                    "message":
                    "Unable to upload questions."
                }
            ),
            500,
        )