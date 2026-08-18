from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import mysql

exam_bp = Blueprint("exam", __name__)


@exam_bp.route("/create-exam", methods=["POST"])
@jwt_required()
def create_exam():

    current_user_id = get_jwt_identity()

    cur = mysql.connection.cursor()

    role_query = """
    SELECT role
    FROM users
    WHERE user_id = %s
    """

    cur.execute(role_query, (current_user_id,))
    user = cur.fetchone()

    if not user:
        cur.close()

        return jsonify({"message": "User not found"}), 404

    role = user[0]

    if role not in ["Admin", "Examiner"]:
        cur.close()

        return (
            jsonify({"message": "Access denied. Admin or Examiner only."}),
            403,
        )

    data = request.get_json()

    title = data.get("title")
    duration = data.get("duration")
    total_marks = data.get("total_marks")
    passing_marks = data.get("passing_marks")
    exam_type = data.get("exam_type", "Practice")

    if exam_type not in ["Practice", "Actual"]:
        cur.close()

        return (
            jsonify(
                {
                    "message": "Invalid exam type. Exam type must be Practice or Actual."
                }
            ),
            400,
        )

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

    cur.close()

    return (
        jsonify(
            {
                "message": "Exam created successfully",
                "exam_id": exam_id,
                "exam_type": exam_type,
            }
        ),
        201,
    )


@exam_bp.route("/update-exam/<int:exam_id>", methods=["PUT"])
@jwt_required()
def update_exam(exam_id):

    current_user_id = get_jwt_identity()

    cur = mysql.connection.cursor()

    role_query = """
    SELECT role
    FROM users
    WHERE user_id = %s
    """

    cur.execute(role_query, (current_user_id,))
    user = cur.fetchone()

    if not user:
        cur.close()

        return jsonify({"message": "User not found"}), 404

    role = user[0]

    if role not in ["Admin", "Examiner"]:
        cur.close()

        return (
            jsonify({"message": "Access denied. Admin or Examiner only."}),
            403,
        )

    exam_check_query = """
    SELECT exam_id
    FROM exams
    WHERE exam_id = %s
    """

    cur.execute(exam_check_query, (exam_id,))

    exam = cur.fetchone()

    if not exam:

        cur.close()

        return jsonify({"message": "Exam not found"}), 404

    data = request.get_json()

    title = data.get("title")
    duration = data.get("duration")
    total_marks = data.get("total_marks")
    passing_marks = data.get("passing_marks")

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
        update_query, (title, duration, total_marks, passing_marks, exam_id)
    )

    mysql.connection.commit()

    cur.close()

    return (
        jsonify({"message": "Exam updated successfully", "exam_id": exam_id}),
        200,
    )


@exam_bp.route("/add-question", methods=["POST"])
@jwt_required()
def add_question():

    current_user_id = get_jwt_identity()

    cur = mysql.connection.cursor()

    role_query = """
    SELECT role
    FROM users
    WHERE user_id = %s
    """

    cur.execute(role_query, (current_user_id,))
    user = cur.fetchone()

    if not user:
        cur.close()

        return jsonify({"message": "User not found"}), 404

    role = user[0]

    if role not in ["Admin", "Examiner"]:
        cur.close()

        return (
            jsonify({"message": "Access denied. Admin or Examiner only."}),
            403,
        )

    data = request.get_json()

    exam_id = data.get("exam_id")
    question_text = data.get("question_text")
    difficulty = data.get("difficulty")
    marks = data.get("marks")
    options = data.get("options")
    correct_option = data.get("correct_option")

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

    cur.execute(question_query, (exam_id, question_text, difficulty, marks))

    question_id = cur.lastrowid

    for option in options:

        is_correct = option == correct_option

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

        cur.execute(option_query, (question_id, option, is_correct))

    mysql.connection.commit()

    cur.close()

    return (
        jsonify(
            {
                "message": "Question added successfully",
                "question_id": question_id,
            }
        ),
        201,
    )


@exam_bp.route("/delete-question/<int:question_id>", methods=["DELETE"])
@jwt_required()
def delete_question(question_id):

    current_user_id = get_jwt_identity()

    cur = mysql.connection.cursor()

    role_query = """
    SELECT role
    FROM users
    WHERE user_id = %s
    """

    cur.execute(role_query, (current_user_id,))
    user = cur.fetchone()

    if not user:
        cur.close()

        return jsonify({"message": "User not found"}), 404

    role = user[0]

    if role not in ["Admin", "Examiner"]:
        cur.close()

        return (
            jsonify({"message": "Access denied. Admin or Examiner only."}),
            403,
        )

    question_query = """
    SELECT question_id
    FROM questions
    WHERE question_id = %s
    """

    cur.execute(question_query, (question_id,))

    question = cur.fetchone()

    if not question:

        cur.close()

        return jsonify({"message": "Question not found"}), 404

    delete_answers_query = """
    DELETE FROM answers
    WHERE question_id = %s
    """

    cur.execute(delete_answers_query, (question_id,))

    delete_options_query = """
    DELETE FROM options
    WHERE question_id = %s
    """

    cur.execute(delete_options_query, (question_id,))

    delete_question_query = """
    DELETE FROM questions
    WHERE question_id = %s
    """

    cur.execute(delete_question_query, (question_id,))

    mysql.connection.commit()

    cur.close()

    return jsonify({"message": "Question deleted successfully"}), 200


@exam_bp.route("/update-question/<int:question_id>", methods=["PUT"])
@jwt_required()
def update_question(question_id):

    current_user_id = get_jwt_identity()

    cur = mysql.connection.cursor()

    role_query = """
    SELECT role
    FROM users
    WHERE user_id = %s
    """

    cur.execute(role_query, (current_user_id,))
    user = cur.fetchone()

    if not user:

        cur.close()

        return jsonify({"message": "User not found"}), 404

    role = user[0]

    if role not in ["Admin", "Examiner"]:

        cur.close()

        return (
            jsonify({"message": "Access denied. Admin or Examiner only."}),
            403,
        )

    question_check_query = """
    SELECT question_id
    FROM questions
    WHERE question_id = %s
    """

    cur.execute(question_check_query, (question_id,))

    question = cur.fetchone()

    if not question:

        cur.close()

        return jsonify({"message": "Question not found"}), 404

    data = request.get_json()

    question_text = data.get("question_text")
    difficulty = data.get("difficulty")
    marks = data.get("marks")
    options = data.get("options")
    correct_option = data.get("correct_option")

    update_question_query = """
    UPDATE questions
    SET
        question_text = %s,
        difficulty = %s,
        marks = %s
    WHERE question_id = %s
    """

    cur.execute(
        update_question_query, (question_text, difficulty, marks, question_id)
    )

    delete_options_query = """
    DELETE FROM options
    WHERE question_id = %s
    """

    cur.execute(delete_options_query, (question_id,))

    for option in options:

        is_correct = option == correct_option

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

        cur.execute(option_query, (question_id, option, is_correct))

    mysql.connection.commit()

    cur.close()

    return (
        jsonify(
            {
                "message": "Question updated successfully",
                "question_id": question_id,
            }
        ),
        200,
    )


@exam_bp.route("/exams", methods=["GET"])
@jwt_required()
def get_exams():

    cur = mysql.connection.cursor()

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
    ORDER BY e.exam_id DESC
    """

    cur.execute(query)

    exams = cur.fetchall()

    cur.close()

    exam_list = []

    for exam in exams:

        is_scheduled = exam[9] > 0

        exam_list.append(
            {
                "exam_id": exam[0],
                "title": exam[1],
                "duration": exam[2],
                "total_marks": exam[3],
                "passing_marks": exam[4],
                "created_by": exam[5],
                "exam_type": exam[6],
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
                "is_scheduled": is_scheduled,
            }
        )

    return jsonify(exam_list), 200


@exam_bp.route("/exam/<int:exam_id>", methods=["GET"])
@jwt_required()
def get_exam(exam_id):

    current_user_id = get_jwt_identity()

    cur = mysql.connection.cursor()

    # ==========================================
    # Fetch Current User
    # ==========================================

    user_query = """
    SELECT
        role,
        batch_id
    FROM users
    WHERE user_id = %s
    """

    cur.execute(user_query, (current_user_id,))

    user = cur.fetchone()

    if not user:

        cur.close()

        return jsonify({"message": "User not found"}), 404

    user_role = user[0]
    user_batch_id = user[1]

    # ==========================================
    # Fetch Exam
    # ==========================================

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

    cur.execute(exam_query, (exam_id,))

    exam = cur.fetchone()

    if not exam:

        cur.close()

        return jsonify({"message": "Exam not found"}), 404

    exam_type = exam[5]

    # ==========================================
    # Candidate Access Control
    # ==========================================

    if user_role == "Candidate" and exam_type == "Actual":

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
        ORDER BY scheduled_start DESC
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

            cur.close()

            return (
                jsonify(
                    {
                        "message":
                        "This assessment has not been scheduled for you."
                    }
                ),
                403,
            )

        scheduled_start = schedule[1]
        scheduled_end = schedule[2]

        # ==========================================
        # Check Assessment Time Window
        # ==========================================

        time_query = """
SELECT DATE_ADD(
    UTC_TIMESTAMP(),
    INTERVAL 330 MINUTE
)
"""

        cur.execute(time_query)

        current_time = cur.fetchone()[0]

        if current_time < scheduled_start:

            cur.close()

            return (
                jsonify(
                    {
                        "message":
                        "This assessment has not started yet.",
                        "scheduled_start":
                        str(scheduled_start),
                    }
                ),
                403,
            )

        if current_time > scheduled_end:

            cur.close()

            return (
                jsonify(
                    {
                        "message":
                        "This assessment has ended.",
                        "scheduled_end":
                        str(scheduled_end),
                    }
                ),
                403,
            )

    # ==========================================
    # Fetch Questions
    # ==========================================

    question_query = """
    SELECT
        question_id,
        question_text,
        difficulty,
        marks
    FROM questions
    WHERE exam_id = %s
    """

    cur.execute(question_query, (exam_id,))

    questions = cur.fetchall()

    question_list = []

    # ==========================================
    # Fetch Options
    # ==========================================

    for question in questions:

        question_id = question[0]

        option_query = """
        SELECT
            option_id,
            option_text
        FROM options
        WHERE question_id = %s
        ORDER BY option_id
        """

        cur.execute(option_query, (question_id,))

        options = cur.fetchall()

        option_list = []

        for option in options:

            option_list.append(
                {
                    "option_id": option[0],
                    "option_text": option[1],
                }
            )

        question_list.append(
            {
                "question_id": question[0],
                "question_text": question[1],
                "difficulty": question[2],
                "marks": question[3],
                "options": option_list,
            }
        )

    cur.close()

    # ==========================================
    # Response
    # ==========================================

    return (
        jsonify(
            {
                "exam": {
                    "exam_id": exam[0],
                    "title": exam[1],
                    "duration": exam[2],
                    "total_marks": exam[3],
                    "passing_marks": exam[4],
                    "exam_type": exam[5],
                },
                "questions": question_list,
            }
        ),
        200,
    )


@exam_bp.route("/question/<int:question_id>", methods=["GET"])
@jwt_required()
def get_question(question_id):

    cur = mysql.connection.cursor()

    question_query = """
    SELECT
        question_id,
        question_text,
        difficulty,
        marks
    FROM questions
    WHERE question_id = %s
    """

    cur.execute(question_query, (question_id,))

    question = cur.fetchone()

    if not question:

        cur.close()

        return jsonify({"message": "Question not found"}), 404

    option_query = """
    SELECT
        option_text,
        is_correct
    FROM options
    WHERE question_id = %s
    ORDER BY option_id
    """

    cur.execute(option_query, (question_id,))

    options = cur.fetchall()

    option_list = []
    correct_option = ""

    for option in options:

        option_list.append(option[0])

        if option[1]:
            correct_option = option[0]

    cur.close()

    return (
        jsonify(
            {
                "question_id": question[0],
                "question_text": question[1],
                "difficulty": question[2],
                "marks": question[3],
                "options": option_list,
                "correct_option": correct_option,
            }
        ),
        200,
    )


@exam_bp.route("/delete-exam/<int:exam_id>", methods=["DELETE"])
@jwt_required()
def delete_exam(exam_id):

    current_user_id = get_jwt_identity()

    cur = mysql.connection.cursor()

    # ==========================================
    # Verify User Role
    # ==========================================

    role_query = """
    SELECT role
    FROM users
    WHERE user_id = %s
    """

    cur.execute(role_query, (current_user_id,))

    user = cur.fetchone()

    if not user:

        cur.close()

        return jsonify({"message": "User not found"}), 404

    if user[0] not in ["Admin", "Examiner"]:

        cur.close()

        return jsonify({"message": "Access denied"}), 403

    # ==========================================
    # Verify Exam Exists
    # ==========================================

    exam_query = """
    SELECT exam_id
    FROM exams
    WHERE exam_id = %s
    """

    cur.execute(exam_query, (exam_id,))

    exam = cur.fetchone()

    if not exam:

        cur.close()

        return jsonify({"message": "Exam not found"}), 404

    try:

        # ==========================================
        # Fetch Questions
        # ==========================================

        question_query = """
        SELECT question_id
        FROM questions
        WHERE exam_id = %s
        """

        cur.execute(question_query, (exam_id,))

        questions = cur.fetchall()

        # ==========================================
        # Delete Question Dependencies
        # ==========================================

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

        # ==========================================
        # Delete Questions
        # ==========================================

        delete_questions_query = """
        DELETE FROM questions
        WHERE exam_id = %s
        """

        cur.execute(
            delete_questions_query,
            (exam_id,),
        )

        # ==========================================
        # Delete Submissions
        # ==========================================

        delete_submissions_query = """
        DELETE FROM submissions
        WHERE exam_id = %s
        """

        cur.execute(
            delete_submissions_query,
            (exam_id,),
        )

        # ==========================================
        # Delete Assessment Schedules
        # ==========================================

        delete_schedules_query = """
        DELETE FROM assessment_schedules
        WHERE exam_id = %s
        """

        cur.execute(
            delete_schedules_query,
            (exam_id,),
        )

        # ==========================================
        # Delete Exam
        # ==========================================

        delete_exam_query = """
        DELETE FROM exams
        WHERE exam_id = %s
        """

        cur.execute(
            delete_exam_query,
            (exam_id,),
        )

        # ==========================================
        # Commit Transaction
        # ==========================================

        mysql.connection.commit()

    except Exception as error:

        mysql.connection.rollback()

        cur.close()

        return (
            jsonify(
                {
                    "message": str(error)
                }
            ),
            500,
        )

    cur.close()

    return (
        jsonify(
            {
                "message":
                    "Exam deleted successfully"
            }
        ),
        200,
    )
