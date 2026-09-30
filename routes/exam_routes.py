from uuid import uuid4

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import mysql
from utils.decorators import role_required


exam_bp = Blueprint(
    "exam",
    __name__
)


# ==========================================================
# HELPERS
# ==========================================================

def generate_question_key(prefix="Q"):
    """
    Generate a unique question key.

    Example:
        MCQ-8F3A21C9D4B7
        CODING-A91F20B3C4D5
    """
    return f"{prefix}-{uuid4().hex[:12].upper()}"


def validate_difficulty(difficulty):
    """
    Normalize and validate difficulty.
    """
    if difficulty is None:
        return None

    difficulty = str(difficulty).strip().lower()

    difficulty_map = {
        "easy": "Easy",
        "medium": "Medium",
        "hard": "Hard",
    }

    return difficulty_map.get(difficulty)


def validate_positive_number(value, field_name):
    """
    Validate numeric fields such as marks.
    """
    if value is None or value == "":
        raise ValueError(f"{field_name} is required.")

    try:
        value = float(value)
    except (TypeError, ValueError):
        raise ValueError(
            f"{field_name} must be a valid number."
        )

    if value <= 0:
        raise ValueError(
            f"{field_name} must be greater than zero."
        )

    return value


# ==========================================================
# EXAM ROUTES
# ==========================================================


# ==========================================================
# CREATE EXAM
# ==========================================================

@exam_bp.route(
    "/create-exam",
    methods=["POST"],
)
@jwt_required()
@role_required("Admin", "Examiner")
def create_exam():

    current_user_id = get_jwt_identity()

    cur = mysql.connection.cursor()

    try:

        data = request.get_json() or {}

        title = data.get("title")
        duration = data.get("duration")
        total_marks = data.get("total_marks")
        passing_marks = data.get("passing_marks")

        exam_type = data.get(
            "exam_type",
            "Practice",
        )

        # --------------------------------------------------
        # Validate exam type
        # --------------------------------------------------

        if exam_type not in [
            "Practice",
            "Actual",
        ]:

            return jsonify(
                {
                    "message":
                        "Invalid exam type. Exam type must be Practice or Actual."
                }
            ), 400

        # --------------------------------------------------
        # Basic validation
        # --------------------------------------------------

        if not title or not str(title).strip():

            return jsonify(
                {
                    "message":
                        "Exam title is required."
                }
            ), 400

        if duration is None or duration == "":

            return jsonify(
                {
                    "message":
                        "Duration is required."
                }
            ), 400

        if total_marks is None or total_marks == "":

            return jsonify(
                {
                    "message":
                        "Total marks are required."
                }
            ), 400

        if passing_marks is None or passing_marks == "":

            return jsonify(
                {
                    "message":
                        "Passing marks are required."
                }
            ), 400

        # --------------------------------------------------
        # Insert exam
        # --------------------------------------------------

        insert_query = """
        INSERT INTO exams
        (
            title,
            duration,
            total_marks,
            passing_marks,
            created_by,
            exam_type
        )
        VALUES
        (
            %s,
            %s,
            %s,
            %s,
            %s,
            %s
        )
        """

        cur.execute(
            insert_query,
            (
                title,
                duration,
                total_marks,
                passing_marks,
                current_user_id,
                exam_type,
            ),
        )

        mysql.connection.commit()

        exam_id = cur.lastrowid

        return jsonify(
            {
                "message":
                    "Exam created successfully",

                "exam_id":
                    exam_id,

                "exam_type":
                    exam_type,
            }
        ), 201

    except Exception as error:

        mysql.connection.rollback()

        print("Create exam error:", error)

        return jsonify(
            {
                "message":
                    str(error)
            }
        ), 500

    finally:

        cur.close()


# ==========================================================
# UPDATE EXAM
# ==========================================================

@exam_bp.route(
    "/update-exam/<int:exam_id>",
    methods=["PUT"],
)
@jwt_required()
@role_required("Admin", "Examiner")
def update_exam(exam_id):

    cur = mysql.connection.cursor()

    try:

        # --------------------------------------------------
        # Verify exam exists
        # --------------------------------------------------

        exam_check_query = """
        SELECT
            exam_id
        FROM exams
        WHERE exam_id = %s
        """

        cur.execute(
            exam_check_query,
            (exam_id,),
        )

        exam = cur.fetchone()

        if not exam:

            return jsonify(
                {
                    "message":
                        "Exam not found"
                }
            ), 404

        data = request.get_json() or {}

        title = data.get("title")
        duration = data.get("duration")
        total_marks = data.get("total_marks")
        passing_marks = data.get("passing_marks")

        # --------------------------------------------------
        # Update exam
        # --------------------------------------------------

        update_query = """
        UPDATE exams
        SET
            title = %s,
            duration = %s,
            total_marks = %s,
            passing_marks = %s
        WHERE exam_id = %s
        """

        cur.execute(
            update_query,
            (
                title,
                duration,
                total_marks,
                passing_marks,
                exam_id,
            ),
        )

        mysql.connection.commit()

        return jsonify(
            {
                "message":
                    "Exam updated successfully",

                "exam_id":
                    exam_id,
            }
        ), 200

    except Exception as error:

        mysql.connection.rollback()

        print("Update exam error:", error)

        return jsonify(
            {
                "message":
                    str(error)
            }
        ), 500

    finally:

        cur.close()


# ==========================================================
# ADD MCQ QUESTION
# ==========================================================

@exam_bp.route(
    "/add-question",
    methods=["POST"],
)
@jwt_required()
@role_required("Admin", "Examiner")
def add_question():

    cur = mysql.connection.cursor()

    try:

        data = request.get_json() or {}

        exam_id = data.get("exam_id")

        question_text = data.get(
            "question_text"
        )

        difficulty = data.get(
            "difficulty"
        )

        marks = data.get(
            "marks"
        )

        options = data.get(
            "options"
        )

        correct_option = data.get(
            "correct_option"
        )

        # --------------------------------------------------
        # Basic validation
        # --------------------------------------------------

        if not exam_id:

            return jsonify(
                {
                    "message":
                        "exam_id is required."
                }
            ), 400

        try:
            exam_id = int(exam_id)
        except (TypeError, ValueError):

            return jsonify(
                {
                    "message":
                        "exam_id must be a valid integer."
                }
            ), 400

        if not question_text or not str(question_text).strip():

            return jsonify(
                {
                    "message":
                        "question_text is required."
                }
            ), 400

        # --------------------------------------------------
        # Difficulty
        # --------------------------------------------------

        difficulty = validate_difficulty(difficulty)

        if not difficulty:

            return jsonify(
                {
                    "message":
                        "difficulty must be Easy, Medium, or Hard."
                }
            ), 400

        # --------------------------------------------------
        # Marks
        # --------------------------------------------------

        try:

            marks = validate_positive_number(
                marks,
                "marks"
            )

        except ValueError as error:

            return jsonify(
                {
                    "message":
                        str(error)
                }
            ), 400

        # --------------------------------------------------
        # Options
        # --------------------------------------------------

        if not isinstance(options, list):

            return jsonify(
                {
                    "message":
                        "options must be an array."
                }
            ), 400

        if len(options) != 4:

            return jsonify(
                {
                    "message":
                        "Exactly four options are required for an MCQ."
                }
            ), 400

        cleaned_options = []

        for option in options:

            if option is None:

                return jsonify(
                    {
                        "message":
                            "Options cannot be empty."
                    }
                ), 400

            option = str(option).strip()

            if not option:

                return jsonify(
                    {
                        "message":
                            "Options cannot be empty."
                    }
                ), 400

            cleaned_options.append(option)

        # --------------------------------------------------
        # Duplicate options
        # --------------------------------------------------

        normalized_options = [
            option.casefold()
            for option in cleaned_options
        ]

        if len(set(normalized_options)) != 4:

            return jsonify(
                {
                    "message":
                        "MCQ options must be unique."
                }
            ), 400

        # --------------------------------------------------
        # Correct option
        # --------------------------------------------------

        if correct_option is None:

            return jsonify(
                {
                    "message":
                        "correct_option is required."
                }
            ), 400

        correct_option = str(
            correct_option
        ).strip()

        correct_match = None

        for option in cleaned_options:

            if option.casefold() == correct_option.casefold():

                correct_match = option
                break

        if correct_match is None:

            return jsonify(
                {
                    "message":
                        "correct_option must match one of the provided options."
                }
            ), 400

        # --------------------------------------------------
        # Verify exam exists
        # --------------------------------------------------

        exam_query = """
        SELECT
            exam_id
        FROM exams
        WHERE exam_id = %s
        """

        cur.execute(
            exam_query,
            (exam_id,),
        )

        if not cur.fetchone():

            return jsonify(
                {
                    "message":
                        "Exam not found."
                }
            ), 404

        # --------------------------------------------------
        # Generate Question Key
        #
        # IMPORTANT:
        # questions.question_key is required by the DB.
        # --------------------------------------------------

        question_key = generate_question_key(
            "MCQ"
        )

        # --------------------------------------------------
        # Insert MCQ parent question
        # --------------------------------------------------

        question_query = """
        INSERT INTO questions
        (
            exam_id,
            question_key,
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

        cur.execute(
            question_query,
            (
                exam_id,
                question_key,
                question_text,
                difficulty,
                marks,
            ),
        )

        question_id = cur.lastrowid

        # --------------------------------------------------
        # Insert options
        # --------------------------------------------------

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

        for option in cleaned_options:

            is_correct = (
                option == correct_match
            )

            cur.execute(
                option_query,
                (
                    question_id,
                    option,
                    is_correct,
                ),
            )

        mysql.connection.commit()

        return jsonify(
            {
                "message":
                    "Question added successfully",

                "question_id":
                    question_id,

                "question_key":
                    question_key,

                "type":
                    "MCQ",
            }
        ), 201

    except Exception as error:

        mysql.connection.rollback()

        print("Add MCQ question error:", error)

        return jsonify(
            {
                "message":
                    str(error)
            }
        ), 500

    finally:

        cur.close()


# ==========================================================
# ADD CODING QUESTION
# ==========================================================

@exam_bp.route(
    "/add-coding-question",
    methods=["POST"],
)
@jwt_required()
@role_required("Admin", "Examiner")
def add_coding_question():

    cur = mysql.connection.cursor()

    try:

        data = request.get_json() or {}

        exam_id = data.get(
            "exam_id"
        )

        question_text = data.get(
            "question_text"
        )

        difficulty = data.get(
            "difficulty"
        )

        marks = data.get(
            "marks"
        )

        starter_code = data.get(
            "starter_code",
            "",
        )

        language = data.get(
            "language",
            "python",
        )

        test_cases = data.get(
            "test_cases"
        )

        # --------------------------------------------------
        # Basic validation
        # --------------------------------------------------

        if not exam_id:

            return jsonify(
                {
                    "message":
                        "exam_id is required."
                }
            ), 400

        try:
            exam_id = int(exam_id)
        except (TypeError, ValueError):

            return jsonify(
                {
                    "message":
                        "exam_id must be a valid integer."
                }
            ), 400

        if not question_text or not str(question_text).strip():

            return jsonify(
                {
                    "message":
                        "question_text is required."
                }
            ), 400

        if not language:

            return jsonify(
                {
                    "message":
                        "language is required."
                }
            ), 400

        language = str(language).strip().lower()

        # --------------------------------------------------
        # Current coding scope = Python
        # --------------------------------------------------

        if language != "python":

            return jsonify(
                {
                    "message":
                        "Only Python coding questions are currently supported."
                }
            ), 400

        # --------------------------------------------------
        # Difficulty
        # --------------------------------------------------

        difficulty = validate_difficulty(
            difficulty
        )

        if not difficulty:

            return jsonify(
                {
                    "message":
                        "difficulty must be Easy, Medium, or Hard."
                }
            ), 400

        # --------------------------------------------------
        # Marks
        # --------------------------------------------------

        try:

            marks = validate_positive_number(
                marks,
                "marks"
            )

        except ValueError as error:

            return jsonify(
                {
                    "message":
                        str(error)
                }
            ), 400

        # --------------------------------------------------
        # Test cases
        # --------------------------------------------------

        if not isinstance(
            test_cases,
            list
        ) or not test_cases:

            return jsonify(
                {
                    "message":
                        "At least one test case is required."
                }
            ), 400

        # --------------------------------------------------
        # Verify exam exists
        # --------------------------------------------------

        exam_query = """
        SELECT
            exam_id
        FROM exams
        WHERE exam_id = %s
        """

        cur.execute(
            exam_query,
            (exam_id,),
        )

        if not cur.fetchone():

            return jsonify(
                {
                    "message":
                        "Exam not found."
                }
            ), 404

        # --------------------------------------------------
        # Validate test cases BEFORE inserting anything
        # --------------------------------------------------

        validated_test_cases = []

        for index, test_case in enumerate(
            test_cases,
            start=1
        ):

            if not isinstance(
                test_case,
                dict
            ):

                return jsonify(
                    {
                        "message":
                            f"Test case {index} must be an object."
                    }
                ), 400

            if "input_data" not in test_case:

                return jsonify(
                    {
                        "message":
                            f"Test case {index} requires input_data."
                    }
                ), 400

            if "expected_output" not in test_case:

                return jsonify(
                    {
                        "message":
                            f"Test case {index} requires expected_output."
                    }
                ), 400

            input_data = test_case.get(
                "input_data"
            )

            expected_output = test_case.get(
                "expected_output"
            )

            if expected_output is None:

                return jsonify(
                    {
                        "message":
                            f"Test case {index}: expected_output cannot be empty."
                    }
                ), 400

            is_hidden = bool(
                test_case.get(
                    "is_hidden",
                    False,
                )
            )

            validated_test_cases.append(
                (
                    input_data,
                    expected_output,
                    is_hidden,
                )
            )

        # --------------------------------------------------
        # Generate Question Key
        # --------------------------------------------------

        question_key = generate_question_key(
            "CODING"
        )

        # --------------------------------------------------
        # Insert parent question
        # --------------------------------------------------

        parent_question_query = """
        INSERT INTO questions
        (
            exam_id,
            question_key,
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

        cur.execute(
            parent_question_query,
            (
                exam_id,
                question_key,
                question_text,
                difficulty,
                marks,
            ),
        )

        question_id = cur.lastrowid

        # --------------------------------------------------
        # Insert coding-specific details
        # --------------------------------------------------

        coding_question_query = """
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

        cur.execute(
            coding_question_query,
            (
                exam_id,
                question_id,
                question_text,
                difficulty,
                marks,
                starter_code,
                language,
            ),
        )

        coding_question_id = cur.lastrowid

        # --------------------------------------------------
        # Insert test cases
        # --------------------------------------------------

        test_case_query = """
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

        for (
            input_data,
            expected_output,
            is_hidden,
        ) in validated_test_cases:

            cur.execute(
                test_case_query,
                (
                    coding_question_id,
                    input_data,
                    expected_output,
                    is_hidden,
                ),
            )

        mysql.connection.commit()

        return jsonify(
            {
                "message":
                    "Coding question added successfully",

                "coding_question_id":
                    coding_question_id,

                "question_id":
                    question_id,

                "question_key":
                    question_key,

                "type":
                    "CODING",
            }
        ), 201

    except Exception as error:

        mysql.connection.rollback()

        print("Add coding question error:", error)

        return jsonify(
            {
                "message":
                    str(error)
            }
        ), 500

    finally:

        cur.close()


# ==========================================================
# DELETE MCQ QUESTION
# ==========================================================

@exam_bp.route(
    "/delete-question/<int:question_id>",
    methods=["DELETE"],
)
@jwt_required()
@role_required("Admin", "Examiner")
def delete_question(question_id):

    cur = mysql.connection.cursor()

    try:

        question_query = """
        SELECT
            question_id,
            type
        FROM questions
        WHERE question_id = %s
        """

        cur.execute(
            question_query,
            (question_id,),
        )

        question = cur.fetchone()

        if not question:

            return jsonify(
                {
                    "message":
                        "Question not found"
                }
            ), 404

        # --------------------------------------------------
        # Ensure this endpoint is for MCQ
        # --------------------------------------------------

        if question[1] != "MCQ":

            return jsonify(
                {
                    "message":
                        "This endpoint can only delete MCQ questions."
                }
            ), 400

        # --------------------------------------------------
        # Delete answers
        # --------------------------------------------------

        delete_answers_query = """
        DELETE FROM answers
        WHERE question_id = %s
        """

        cur.execute(
            delete_answers_query,
            (question_id,),
        )

        # --------------------------------------------------
        # Delete options
        # --------------------------------------------------

        delete_options_query = """
        DELETE FROM options
        WHERE question_id = %s
        """

        cur.execute(
            delete_options_query,
            (question_id,),
        )

        # --------------------------------------------------
        # Delete question
        # --------------------------------------------------

        delete_question_query = """
        DELETE FROM questions
        WHERE question_id = %s
        """

        cur.execute(
            delete_question_query,
            (question_id,),
        )

        mysql.connection.commit()

        return jsonify(
            {
                "message":
                    "Question deleted successfully"
            }
        ), 200

    except Exception as error:

        mysql.connection.rollback()

        print("Delete MCQ question error:", error)

        return jsonify(
            {
                "message":
                    str(error)
            }
        ), 500

    finally:

        cur.close()


# ==========================================================
# UPDATE MCQ QUESTION
# ==========================================================

@exam_bp.route(
    "/update-question/<int:question_id>",
    methods=["PUT"],
)
@jwt_required()
@role_required("Admin", "Examiner")
def update_question(question_id):

    cur = mysql.connection.cursor()

    try:

        question_check_query = """
        SELECT
            question_id,
            type
        FROM questions
        WHERE question_id = %s
        """

        cur.execute(
            question_check_query,
            (question_id,),
        )

        question = cur.fetchone()

        if not question:

            return jsonify(
                {
                    "message":
                        "Question not found"
                }
            ), 404

        if question[1] != "MCQ":

            return jsonify(
                {
                    "message":
                        "This endpoint can only update MCQ questions."
                }
            ), 400

        data = request.get_json() or {}

        question_text = data.get(
            "question_text"
        )

        difficulty = data.get(
            "difficulty"
        )

        marks = data.get(
            "marks"
        )

        options = data.get(
            "options"
        )

        correct_option = data.get(
            "correct_option"
        )

        # --------------------------------------------------
        # Validation
        # --------------------------------------------------

        if not question_text or not str(question_text).strip():

            return jsonify(
                {
                    "message":
                        "question_text is required."
                }
            ), 400

        difficulty = validate_difficulty(
            difficulty
        )

        if not difficulty:

            return jsonify(
                {
                    "message":
                        "difficulty must be Easy, Medium, or Hard."
                }
            ), 400

        try:

            marks = validate_positive_number(
                marks,
                "marks"
            )

        except ValueError as error:

            return jsonify(
                {
                    "message":
                        str(error)
                }
            ), 400

        if not isinstance(
            options,
            list
        ) or len(options) != 4:

            return jsonify(
                {
                    "message":
                        "Exactly four options are required for an MCQ."
                }
            ), 400

        cleaned_options = []

        for option in options:

            if option is None:

                return jsonify(
                    {
                        "message":
                            "Options cannot be empty."
                    }
                ), 400

            option = str(option).strip()

            if not option:

                return jsonify(
                    {
                        "message":
                            "Options cannot be empty."
                    }
                ), 400

            cleaned_options.append(option)

        normalized_options = [
            option.casefold()
            for option in cleaned_options
        ]

        if len(set(normalized_options)) != 4:

            return jsonify(
                {
                    "message":
                        "MCQ options must be unique."
                }
            ), 400

        if correct_option is None:

            return jsonify(
                {
                    "message":
                        "correct_option is required."
                }
            ), 400

        correct_option = str(
            correct_option
        ).strip()

        correct_match = None

        for option in cleaned_options:

            if option.casefold() == correct_option.casefold():

                correct_match = option
                break

        if correct_match is None:

            return jsonify(
                {
                    "message":
                        "correct_option must match one of the provided options."
                }
            ), 400

        # --------------------------------------------------
        # Update question
        #
        # question_key is intentionally NOT changed.
        # --------------------------------------------------

        update_question_query = """
        UPDATE questions
        SET
            question_text = %s,
            difficulty = %s,
            marks = %s
        WHERE question_id = %s
          AND type = 'MCQ'
        """

        cur.execute(
            update_question_query,
            (
                question_text,
                difficulty,
                marks,
                question_id,
            ),
        )

        # --------------------------------------------------
        # Delete old options
        # --------------------------------------------------

        delete_options_query = """
        DELETE FROM options
        WHERE question_id = %s
        """

        cur.execute(
            delete_options_query,
            (question_id,),
        )

        # --------------------------------------------------
        # Insert new options
        # --------------------------------------------------

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

        for option in cleaned_options:

            is_correct = (
                option == correct_match
            )

            cur.execute(
                option_query,
                (
                    question_id,
                    option,
                    is_correct,
                ),
            )

        mysql.connection.commit()

        return jsonify(
            {
                "message":
                    "Question updated successfully",

                "question_id":
                    question_id,
            }
        ), 200

    except Exception as error:

        mysql.connection.rollback()

        print("Update MCQ question error:", error)

        return jsonify(
            {
                "message":
                    str(error)
            }
        ), 500

    finally:

        cur.close()


# ==========================================================
# GET ALL EXAMS
# ==========================================================

@exam_bp.route(
    "/exams",
    methods=["GET"],
)
@jwt_required()
@role_required(
    "Admin",
    "Examiner",
    "Candidate",
)
def get_exams():

    cur = mysql.connection.cursor()

    try:

        query = """
        SELECT
            e.exam_id,
            e.title,
            e.duration,
            e.total_marks,
            e.passing_marks,
            e.created_by,
            e.exam_type,
            MIN(s.scheduled_start) AS scheduled_start,
            MAX(s.scheduled_end) AS scheduled_end,
            COUNT(s.schedule_id) AS schedule_count
        FROM exams e
        LEFT JOIN assessment_schedules s
            ON e.exam_id = s.exam_id
        GROUP BY
            e.exam_id,
            e.title,
            e.duration,
            e.total_marks,
            e.passing_marks,
            e.created_by,
            e.exam_type
        ORDER BY
            e.exam_id DESC
        """

        cur.execute(query)

        exams = cur.fetchall()

        exam_list = []

        for exam in exams:

            is_scheduled = (
                exam[9] > 0
            )

            exam_list.append(
                {
                    "exam_id":
                        exam[0],

                    "title":
                        exam[1],

                    "duration":
                        exam[2],

                    "total_marks":
                        exam[3],

                    "passing_marks":
                        exam[4],

                    "created_by":
                        exam[5],

                    "exam_type":
                        exam[6],

                    "scheduled_start": (
                        str(exam[7])
                        if exam[7]
                        else None
                    ),

                    "scheduled_end": (
                        str(exam[8])
                        if exam[8]
                        else None
                    ),

                    "is_scheduled":
                        is_scheduled,
                }
            )

        return jsonify(
            exam_list
        ), 200

    finally:

        cur.close()


# ==========================================================
# GET SINGLE EXAM
#
# Returns BOTH:
#
#     MCQ questions
#     CODING questions
#
# in one questions array.
# ==========================================================

@exam_bp.route(
    "/exam/<int:exam_id>",
    methods=["GET"],
)
@jwt_required()
@role_required(
    "Admin",
    "Examiner",
    "Candidate",
)
def get_exam(exam_id):

    current_user_id = get_jwt_identity()

    cur = mysql.connection.cursor()

    try:

        # ==================================================
        # Fetch Current User
        # ==================================================

        user_query = """
        SELECT
            role,
            batch_id
        FROM users
        WHERE user_id = %s
        """

        cur.execute(
            user_query,
            (current_user_id,),
        )

        user = cur.fetchone()

        if not user:

            return jsonify(
                {
                    "message":
                        "User not found"
                }
            ), 404

        user_role = user[0]
        user_batch_id = user[1]

        # ==================================================
        # Fetch Exam
        # ==================================================

        exam_query = """
        SELECT
            exam_id,
            title,
            duration,
            total_marks,
            passing_marks,
            exam_type
        FROM exams
        WHERE exam_id = %s
        """

        cur.execute(
            exam_query,
            (exam_id,),
        )

        exam = cur.fetchone()

        if not exam:

            return jsonify(
                {
                    "message":
                        "Exam not found"
                }
            ), 404

        exam_type = exam[5]

        # ==================================================
        # Candidate Access Control
        # ==================================================

        if (
            user_role == "Candidate"
            and exam_type == "Actual"
        ):

            # ==============================================
            # Check Existing Active Attempt
            # ==============================================

            active_submission_query = """
            SELECT
                submission_id
            FROM submissions
            WHERE
                user_id = %s
                AND exam_id = %s
                AND status = 'In Progress'
            ORDER BY
                submission_id DESC
            LIMIT 1
            """

            cur.execute(
                active_submission_query,
                (
                    current_user_id,
                    exam_id,
                ),
            )

            active_submission = (
                cur.fetchone()
            )

            has_active_attempt = (
                active_submission
                is not None
            )

            # ==============================================
            # Enforce Schedule Only For New Attempts
            # ==============================================

            if not has_active_attempt:

                schedule_query = """
                SELECT
                    schedule_id,
                    scheduled_start,
                    scheduled_end
                FROM assessment_schedules
                WHERE
                    exam_id = %s
                    AND
                    (
                        candidate_id = %s
                        OR
                        (
                            batch_id = %s
                            AND candidate_id IS NULL
                        )
                    )
                ORDER BY
                    scheduled_start DESC
                LIMIT 1
                """

                cur.execute(
                    schedule_query,
                    (
                        exam_id,
                        current_user_id,
                        user_batch_id,
                    ),
                )

                schedule = cur.fetchone()

                if not schedule:

                    return jsonify(
                        {
                            "message":
                                "This assessment has not been scheduled for you."
                        }
                    ), 403

                scheduled_start = schedule[1]
                scheduled_end = schedule[2]

                # ==========================================
                # Current India Time
                # ==========================================

                time_query = """
                SELECT
                    DATE_ADD(
                        UTC_TIMESTAMP(),
                        INTERVAL 330 MINUTE
                    )
                """

                cur.execute(time_query)

                current_time = (
                    cur.fetchone()[0]
                )

                # ==========================================
                # Before Start
                # ==========================================

                if current_time < scheduled_start:

                    return jsonify(
                        {
                            "message":
                                "This assessment has not started yet.",

                            "scheduled_start":
                                str(
                                    scheduled_start
                                ),
                        }
                    ), 403

                # ==========================================
                # After End
                # ==========================================

                if current_time > scheduled_end:

                    return jsonify(
                        {
                            "message":
                                "This assessment has ended.",

                            "scheduled_end":
                                str(
                                    scheduled_end
                                ),
                        }
                    ), 403

        # ==================================================
        # FETCH MCQ QUESTIONS
        # ==================================================

        mcq_query = """
        SELECT
            question_id,
            question_key,
            question_text,
            difficulty,
            marks
        FROM questions
        WHERE
            exam_id = %s
            AND type = 'MCQ'
        ORDER BY
            question_id ASC
        """

        cur.execute(
            mcq_query,
            (exam_id,),
        )

        mcq_questions = (
            cur.fetchall()
        )

        question_list = []

        # ==================================================
        # Build MCQ Questions
        # ==================================================

        for question in mcq_questions:

            question_id = question[0]

            option_query = """
            SELECT
                option_id,
                option_text
            FROM options
            WHERE question_id = %s
            ORDER BY option_id
            """

            cur.execute(
                option_query,
                (question_id,),
            )

            options = cur.fetchall()

            option_list = []

            for option in options:

                option_list.append(
                    {
                        "option_id":
                            option[0],

                        "option_text":
                            option[1],
                    }
                )

            question_list.append(
                {
                    "type":
                        "MCQ",

                    "question_id":
                        question[0],

                    "question_key":
                        question[1],

                    "question_text":
                        question[2],

                    "difficulty":
                        question[3],

                    "marks":
                        question[4],

                    "options":
                        option_list,
                }
            )

        # ==================================================
        # FETCH CODING QUESTIONS
        #
        # Test cases are NOT returned here.
        # ==================================================

        coding_query = """
        SELECT
            cq.coding_question_id,
            cq.question_id,
            q.question_key,
            cq.question_text,
            cq.difficulty,
            cq.marks,
            cq.starter_code,
            cq.language
        FROM coding_questions cq
        INNER JOIN questions q
            ON q.question_id = cq.question_id
        WHERE cq.exam_id = %s
        ORDER BY
            cq.coding_question_id ASC
        """

        cur.execute(
            coding_query,
            (exam_id,),
        )

        coding_questions = (
            cur.fetchall()
        )

        # ==================================================
        # Build Coding Questions
        # ==================================================

        for question in coding_questions:

            question_list.append(
                {
                    "type":
                        "CODING",

                    "coding_question_id":
                        question[0],

                    "question_id":
                        question[1],

                    "question_key":
                        question[2],

                    "question_text":
                        question[3],

                    "difficulty":
                        question[4],

                    "marks":
                        question[5],

                    "starter_code":
                        question[6],

                    "language":
                        question[7],

                    "options":
                        [],
                }
            )

        # ==================================================
        # Return Combined Exam
        # ==================================================

        return jsonify(
            {
                "exam": {
                    "exam_id":
                        exam[0],

                    "title":
                        exam[1],

                    "duration":
                        exam[2],

                    "total_marks":
                        exam[3],

                    "passing_marks":
                        exam[4],

                    "exam_type":
                        exam[5],
                },

                "questions":
                    question_list,
            }
        ), 200

    finally:

        cur.close()


# ==========================================================
# GET MCQ QUESTION
# ==========================================================

@exam_bp.route(
    "/question/<int:question_id>",
    methods=["GET"],
)
@jwt_required()
@role_required(
    "Admin",
    "Examiner",
)
def get_question(question_id):

    cur = mysql.connection.cursor()

    try:

        question_query = """
        SELECT
            question_id,
            question_key,
            question_text,
            difficulty,
            marks
        FROM questions
        WHERE
            question_id = %s
            AND type = 'MCQ'
        """

        cur.execute(
            question_query,
            (question_id,),
        )

        question = cur.fetchone()

        if not question:

            return jsonify(
                {
                    "message":
                        "Question not found"
                }
            ), 404

        option_query = """
        SELECT
            option_text,
            is_correct
        FROM options
        WHERE question_id = %s
        ORDER BY option_id
        """

        cur.execute(
            option_query,
            (question_id,),
        )

        options = cur.fetchall()

        option_list = []

        correct_option = ""

        for option in options:

            option_list.append(
                option[0]
            )

            if option[1]:

                correct_option = option[0]

        return jsonify(
            {
                "type":
                    "MCQ",

                "question_id":
                    question[0],

                "question_key":
                    question[1],

                "question_text":
                    question[2],

                "difficulty":
                    question[3],

                "marks":
                    question[4],

                "options":
                    option_list,

                "correct_option":
                    correct_option,
            }
        ), 200

    finally:

        cur.close()


# ==========================================================
# GET CODING QUESTION FOR ADMIN / EXAMINER
# ==========================================================

@exam_bp.route(
    "/coding-question/<int:coding_question_id>",
    methods=["GET"],
)
@jwt_required()
@role_required(
    "Admin",
    "Examiner",
)
def get_coding_question_for_management(
    coding_question_id
):

    cur = mysql.connection.cursor()

    try:

        question_query = """
        SELECT
            cq.coding_question_id,
            cq.exam_id,
            cq.question_id,
            q.question_key,
            cq.question_text,
            cq.difficulty,
            cq.marks,
            cq.starter_code,
            cq.language
        FROM coding_questions cq
        INNER JOIN questions q
            ON q.question_id = cq.question_id
        WHERE cq.coding_question_id = %s
        """

        cur.execute(
            question_query,
            (coding_question_id,),
        )

        question = cur.fetchone()

        if not question:

            return jsonify(
                {
                    "message":
                        "Coding question not found."
                }
            ), 404

        # --------------------------------------------------
        # Test cases
        # --------------------------------------------------

        test_case_query = """
        SELECT
            test_case_id,
            input_data,
            expected_output,
            is_hidden
        FROM test_cases
        WHERE
            coding_question_id = %s
        ORDER BY
            test_case_id ASC
        """

        cur.execute(
            test_case_query,
            (coding_question_id,),
        )

        test_cases = cur.fetchall()

        test_case_list = []

        for test_case in test_cases:

            test_case_list.append(
                {
                    "test_case_id":
                        test_case[0],

                    "input_data":
                        test_case[1],

                    "expected_output":
                        test_case[2],

                    "is_hidden":
                        bool(test_case[3]),
                }
            )

        return jsonify(
            {
                "type":
                    "CODING",

                "coding_question_id":
                    question[0],

                "exam_id":
                    question[1],

                "question_id":
                    question[2],

                "question_key":
                    question[3],

                "question_text":
                    question[4],

                "difficulty":
                    question[5],

                "marks":
                    question[6],

                "starter_code":
                    question[7],

                "language":
                    question[8],

                "test_cases":
                    test_case_list,
            }
        ), 200

    finally:

        cur.close()


# ==========================================================
# UPDATE CODING QUESTION
# ==========================================================

@exam_bp.route(
    "/update-coding-question/<int:coding_question_id>",
    methods=["PUT"],
)
@jwt_required()
@role_required(
    "Admin",
    "Examiner",
)
def update_coding_question(
    coding_question_id
):

    cur = mysql.connection.cursor()

    try:

        # --------------------------------------------------
        # Verify coding question
        # --------------------------------------------------

        check_query = """
        SELECT
            coding_question_id,
            question_id
        FROM coding_questions
        WHERE coding_question_id = %s
        """

        cur.execute(
            check_query,
            (coding_question_id,),
        )

        question = cur.fetchone()

        if not question:

            return jsonify(
                {
                    "message":
                        "Coding question not found."
                }
            ), 404

        data = request.get_json() or {}

        question_text = data.get(
            "question_text"
        )

        difficulty = data.get(
            "difficulty"
        )

        marks = data.get(
            "marks"
        )

        starter_code = data.get(
            "starter_code",
            "",
        )

        language = data.get(
            "language",
            "python",
        )

        test_cases = data.get(
            "test_cases"
        )

        # --------------------------------------------------
        # Validation
        # --------------------------------------------------

        if not question_text or not str(question_text).strip():

            return jsonify(
                {
                    "message":
                        "question_text is required."
                }
            ), 400

        difficulty = validate_difficulty(
            difficulty
        )

        if not difficulty:

            return jsonify(
                {
                    "message":
                        "difficulty must be Easy, Medium, or Hard."
                }
            ), 400

        try:

            marks = validate_positive_number(
                marks,
                "marks"
            )

        except ValueError as error:

            return jsonify(
                {
                    "message":
                        str(error)
                }
            ), 400

        language = str(
            language
        ).strip().lower()

        # --------------------------------------------------
        # Python only
        # --------------------------------------------------

        if language != "python":

            return jsonify(
                {
                    "message":
                        "Only Python coding questions are currently supported."
                }
            ), 400

        # --------------------------------------------------
        # Validate test cases before modifying database
        # --------------------------------------------------

        validated_test_cases = None

        if test_cases is not None:

            if not isinstance(
                test_cases,
                list
            ) or not test_cases:

                return jsonify(
                    {
                        "message":
                            "At least one test case is required."
                    }
                ), 400

            validated_test_cases = []

            for index, test_case in enumerate(
                test_cases,
                start=1
            ):

                if not isinstance(
                    test_case,
                    dict
                ):

                    return jsonify(
                        {
                            "message":
                                f"Test case {index} must be an object."
                        }
                    ), 400

                if "input_data" not in test_case:

                    return jsonify(
                        {
                            "message":
                                f"Test case {index} requires input_data."
                        }
                    ), 400

                if "expected_output" not in test_case:

                    return jsonify(
                        {
                            "message":
                                f"Test case {index} requires expected_output."
                        }
                    ), 400

                expected_output = test_case.get(
                    "expected_output"
                )

                if expected_output is None:

                    return jsonify(
                        {
                            "message":
                                f"Test case {index}: expected_output cannot be empty."
                        }
                    ), 400

                validated_test_cases.append(
                    (
                        test_case.get(
                            "input_data"
                        ),
                        expected_output,
                        bool(
                            test_case.get(
                                "is_hidden",
                                False,
                            )
                        ),
                    )
                )

        # --------------------------------------------------
        # Update coding question
        # --------------------------------------------------

        update_query = """
        UPDATE coding_questions
        SET
            question_text = %s,
            difficulty = %s,
            marks = %s,
            starter_code = %s,
            language = %s
        WHERE
            coding_question_id = %s
        """

        cur.execute(
            update_query,
            (
                question_text,
                difficulty,
                marks,
                starter_code,
                language,
                coding_question_id,
            ),
        )

        # --------------------------------------------------
        # Keep parent question synchronized.
        #
        # question_key remains unchanged.
        # --------------------------------------------------

        parent_question_id = question[1]

        parent_update_query = """
        UPDATE questions
        SET
            question_text = %s,
            difficulty = %s,
            marks = %s,
            type = 'CODING'
        WHERE question_id = %s
        """

        cur.execute(
            parent_update_query,
            (
                question_text,
                difficulty,
                marks,
                parent_question_id,
            ),
        )

        # --------------------------------------------------
        # Replace test cases only when supplied.
        # --------------------------------------------------

        if validated_test_cases is not None:

            delete_test_cases_query = """
            DELETE FROM test_cases
            WHERE coding_question_id = %s
            """

            cur.execute(
                delete_test_cases_query,
                (coding_question_id,),
            )

            test_case_query = """
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

            for (
                input_data,
                expected_output,
                is_hidden,
            ) in validated_test_cases:

                cur.execute(
                    test_case_query,
                    (
                        coding_question_id,
                        input_data,
                        expected_output,
                        is_hidden,
                    ),
                )

        mysql.connection.commit()

        return jsonify(
            {
                "message":
                    "Coding question updated successfully",

                "coding_question_id":
                    coding_question_id,
            }
        ), 200

    except Exception as error:

        mysql.connection.rollback()

        print("Update coding question error:", error)

        return jsonify(
            {
                "message":
                    str(error)
            }
        ), 500

    finally:

        cur.close()


# ==========================================================
# DELETE CODING QUESTION
# ==========================================================

@exam_bp.route(
    "/delete-coding-question/<int:coding_question_id>",
    methods=["DELETE"],
)
@jwt_required()
@role_required(
    "Admin",
    "Examiner",
)
def delete_coding_question(
    coding_question_id
):

    cur = mysql.connection.cursor()

    try:

        # --------------------------------------------------
        # Verify coding question
        # --------------------------------------------------

        check_query = """
        SELECT
            coding_question_id,
            question_id
        FROM coding_questions
        WHERE coding_question_id = %s
        """

        cur.execute(
            check_query,
            (coding_question_id,),
        )

        question = cur.fetchone()

        if not question:

            return jsonify(
                {
                    "message":
                        "Coding question not found."
                }
            ), 404

        parent_question_id = question[1]

        # --------------------------------------------------
        # Delete code submissions
        # --------------------------------------------------

        delete_code_submissions_query = """
        DELETE FROM code_submissions
        WHERE coding_question_id = %s
        """

        cur.execute(
            delete_code_submissions_query,
            (coding_question_id,),
        )

        # --------------------------------------------------
        # Delete test cases
        # --------------------------------------------------

        delete_test_cases_query = """
        DELETE FROM test_cases
        WHERE coding_question_id = %s
        """

        cur.execute(
            delete_test_cases_query,
            (coding_question_id,),
        )

        # --------------------------------------------------
        # Delete coding question
        # --------------------------------------------------

        delete_question_query = """
        DELETE FROM coding_questions
        WHERE coding_question_id = %s
        """

        cur.execute(
            delete_question_query,
            (coding_question_id,),
        )

        # --------------------------------------------------
        # Delete parent question
        # --------------------------------------------------

        delete_parent_query = """
        DELETE FROM questions
        WHERE question_id = %s
          AND type = 'CODING'
        """

        cur.execute(
            delete_parent_query,
            (parent_question_id,),
        )

        mysql.connection.commit()

        return jsonify(
            {
                "message":
                    "Coding question deleted successfully"
            }
        ), 200

    except Exception as error:

        mysql.connection.rollback()

        print("Delete coding question error:", error)

        return jsonify(
            {
                "message":
                    str(error)
            }
        ), 500

    finally:

        cur.close()


# ==========================================================
# DELETE EXAM
# ==========================================================

@exam_bp.route(
    "/delete-exam/<int:exam_id>",
    methods=["DELETE"],
)
@jwt_required()
@role_required(
    "Admin",
    "Examiner",
)
def delete_exam(exam_id):

    cur = mysql.connection.cursor()

    try:

        # ==================================================
        # Verify Exam Exists
        # ==================================================

        exam_query = """
        SELECT
            exam_id
        FROM exams
        WHERE exam_id = %s
        """

        cur.execute(
            exam_query,
            (exam_id,),
        )

        exam = cur.fetchone()

        if not exam:

            return jsonify(
                {
                    "message":
                        "Exam not found"
                }
            ), 404

        # ==================================================
        # Fetch All Questions
        # ==================================================

        question_query = """
        SELECT
            question_id
        FROM questions
        WHERE exam_id = %s
        """

        cur.execute(
            question_query,
            (exam_id,),
        )

        questions = cur.fetchall()

        # ==================================================
        # Delete MCQ Answers + Options
        # ==================================================

        for question in questions:

            question_id = question[0]

            delete_answers_query = """
            DELETE FROM answers
            WHERE question_id = %s
            """

            cur.execute(
                delete_answers_query,
                (question_id,),
            )

            delete_options_query = """
            DELETE FROM options
            WHERE question_id = %s
            """

            cur.execute(
                delete_options_query,
                (question_id,),
            )

        # ==================================================
        # Fetch Coding Question IDs
        # ==================================================

        coding_question_query = """
        SELECT
            coding_question_id
        FROM coding_questions
        WHERE exam_id = %s
        """

        cur.execute(
            coding_question_query,
            (exam_id,),
        )

        coding_questions = (
            cur.fetchall()
        )

        # ==================================================
        # Delete Coding Dependencies
        # ==================================================

        for coding_question in coding_questions:

            coding_question_id = (
                coding_question[0]
            )

            # ----------------------------------------------
            # Delete code submissions
            # ----------------------------------------------

            delete_code_submissions_query = """
            DELETE FROM code_submissions
            WHERE coding_question_id = %s
            """

            cur.execute(
                delete_code_submissions_query,
                (coding_question_id,),
            )

            # ----------------------------------------------
            # Delete test cases
            # ----------------------------------------------

            delete_test_cases_query = """
            DELETE FROM test_cases
            WHERE coding_question_id = %s
            """

            cur.execute(
                delete_test_cases_query,
                (coding_question_id,),
            )

        # ==================================================
        # Delete Coding Questions
        # ==================================================

        delete_coding_questions_query = """
        DELETE FROM coding_questions
        WHERE exam_id = %s
        """

        cur.execute(
            delete_coding_questions_query,
            (exam_id,),
        )

        # ==================================================
        # Delete Questions
        # ==================================================

        delete_questions_query = """
        DELETE FROM questions
        WHERE exam_id = %s
        """

        cur.execute(
            delete_questions_query,
            (exam_id,),
        )

        # ==================================================
        # Delete Submissions
        # ==================================================

        delete_submissions_query = """
        DELETE FROM submissions
        WHERE exam_id = %s
        """

        cur.execute(
            delete_submissions_query,
            (exam_id,),
        )

        # ==================================================
        # Delete Assessment Schedules
        # ==================================================

        delete_schedules_query = """
        DELETE FROM assessment_schedules
        WHERE exam_id = %s
        """

        cur.execute(
            delete_schedules_query,
            (exam_id,),
        )

        # ==================================================
        # Delete Exam
        # ==================================================

        delete_exam_query = """
        DELETE FROM exams
        WHERE exam_id = %s
        """

        cur.execute(
            delete_exam_query,
            (exam_id,),
        )

        # ==================================================
        # Commit
        # ==================================================

        mysql.connection.commit()

        return jsonify(
            {
                "message":
                    "Exam deleted successfully"
            }
        ), 200

    except Exception as error:

        mysql.connection.rollback()

        print("Delete exam error:", error)

        return jsonify(
            {
                "message":
                    str(error)
            }
        ), 500

    finally:

        cur.close()