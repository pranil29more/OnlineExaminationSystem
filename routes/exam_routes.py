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

    insert_query = """
    INSERT INTO exams
    (
        title,
        duration,
        total_marks,
        passing_marks,
        created_by
    )
    VALUES
    (
        %s,
        %s,
        %s,
        %s,
        %s
    )
    """

    cur.execute(
        insert_query,
        (title, duration, total_marks, passing_marks, current_user_id),
    )

    mysql.connection.commit()

    exam_id = cur.lastrowid

    cur.close()

    return (
        jsonify({"message": "Exam created successfully", "exam_id": exam_id}),
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
        exam_id,
        title,
        duration,
        total_marks,
        passing_marks,
        created_by
    FROM exams
    ORDER BY exam_id DESC
    """

    cur.execute(query)

    exams = cur.fetchall()

    cur.close()

    exam_list = []

    for exam in exams:

        exam_list.append(
            {
                "exam_id": exam[0],
                "title": exam[1],
                "duration": exam[2],
                "total_marks": exam[3],
                "passing_marks": exam[4],
                "created_by": exam[5],
            }
        )

    return jsonify(exam_list), 200


@exam_bp.route("/exam/<int:exam_id>", methods=["GET"])
@jwt_required()
def get_exam(exam_id):

    cur = mysql.connection.cursor()

    exam_query = """
    SELECT
        exam_id,
        title,
        duration,
        total_marks,
        passing_marks
    FROM exams
    WHERE exam_id = %s
    """

    cur.execute(exam_query, (exam_id,))
    exam = cur.fetchone()

    if not exam:
        cur.close()

        return jsonify({"message": "Exam not found"}), 404

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

    for question in questions:

        question_id = question[0]

        option_query = """
        SELECT
            option_id,
            option_text
        FROM options
        WHERE question_id = %s
        """

        cur.execute(option_query, (question_id,))
        options = cur.fetchall()

        option_list = []

        for option in options:
            option_list.append(
                {"option_id": option[0], "option_text": option[1]}
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

    return (
        jsonify(
            {
                "exam": {
                    "exam_id": exam[0],
                    "title": exam[1],
                    "duration": exam[2],
                    "total_marks": exam[3],
                    "passing_marks": exam[4],
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

    try:

        question_query = """
        SELECT question_id
        FROM questions
        WHERE exam_id = %s
        """

        cur.execute(question_query, (exam_id,))

        questions = cur.fetchall()

        for question in questions:

            question_id = question[0]

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

        delete_questions_query = """
        DELETE FROM questions
        WHERE exam_id = %s
        """

        cur.execute(delete_questions_query, (exam_id,))

        delete_submissions_query = """
        DELETE FROM submissions
        WHERE exam_id = %s
        """

        cur.execute(delete_submissions_query, (exam_id,))

        delete_exam_query = """
        DELETE FROM exams
        WHERE exam_id = %s
        """

        cur.execute(delete_exam_query, (exam_id,))

        mysql.connection.commit()

    except Exception as error:

        mysql.connection.rollback()

        cur.close()

        return jsonify({"message": str(error)}), 500

    cur.close()

    return jsonify({"message": "Exam deleted successfully"}), 200


@exam_bp.route("/question-analytics", methods=["GET"])
@jwt_required()
def question_analytics():

    cur = mysql.connection.cursor()

    # Total questions

    total_query = """
    SELECT COUNT(*)
    FROM questions
    """

    cur.execute(total_query)

    total_questions = cur.fetchone()[0]

    # Difficulty Distribution

    difficulty_query = """
    SELECT
        difficulty,
        COUNT(*)
    FROM questions
    GROUP BY difficulty
    """

    cur.execute(difficulty_query)

    difficulty_rows = cur.fetchall()

    difficulty = {"Easy": 0, "Medium": 0, "Hard": 0}

    for row in difficulty_rows:

        difficulty[row[0]] = row[1]

    # questions Per Exam

    exam_query = """
    SELECT
        exams.title,
        COUNT(questions.question_id)
    FROM exams
    LEFT JOIN questions
        ON exams.exam_id = questions.exam_id
    GROUP BY exams.exam_id
    ORDER BY exams.title
    """

    cur.execute(exam_query)

    exam_rows = cur.fetchall()

    exam_wise = []

    for row in exam_rows:

        exam_wise.append({"title": row[0], "questions": row[1]})

    cur.close()

    return (
        jsonify(
            {
                "total_questions": total_questions,
                "difficulty": difficulty,
                "exam_wise": exam_wise,
            }
        ),
        200,
    )


@exam_bp.route("/candidate-results/<int:user_id>", methods=["GET"])
@jwt_required()
def candidate_results(user_id):

    current_user_id = get_jwt_identity()

    cur = mysql.connection.cursor()

    # ==========================================
    # Verify Admin / Examiner
    # ==========================================

    role_query = """
    SELECT role
    FROM users
    WHERE user_id = %s
    """

    cur.execute(role_query, (current_user_id,))

    current_user = cur.fetchone()

    if not current_user:

        cur.close()

        return jsonify({"message": "User not found"}), 404

    if current_user[0] not in ["Admin", "Examiner"]:

        cur.close()

        return jsonify({"message": "Access denied."}), 403

    # ==========================================
    # Fetch Candidate
    # ==========================================

    candidate_query = """
    SELECT

        u.user_id,

        u.name,

        u.email,

        b.batch_name,

        b.technology

    FROM users u

    LEFT JOIN batches b

    ON u.batch_id = b.batch_id

    WHERE u.user_id = %s
    """

    cur.execute(candidate_query, (user_id,))

    candidate = cur.fetchone()

    if not candidate:

        cur.close()

        return jsonify({"message": "Candidate not found"}), 404

    # ==========================================
    # Candidate Summary
    # ==========================================

    summary_query = """
    SELECT

        COUNT(s.submission_id),

        ROUND(
            AVG(
                (s.score * 100.0) / e.total_marks
            ),
            2
        ),

        ROUND(
            MAX(
                (s.score * 100.0) / e.total_marks
            ),
            2
        ),

        ROUND(
            MIN(
                (s.score * 100.0) / e.total_marks
            ),
            2
        )

    FROM submissions s

    JOIN exams e
    ON s.exam_id = e.exam_id

    WHERE s.user_id = %s
    """

    cur.execute(summary_query, (user_id,))

    summary = cur.fetchone()

    # ==========================================
    # Assessment History
    # ==========================================

    history_query = """
    SELECT

        s.submission_id,

        e.exam_id,

        e.title,

        s.score,

        e.total_marks,

        ROUND(
            (s.score * 100.0) / e.total_marks,
            2
        ) AS percentage,

        CASE
            WHEN s.score >= e.passing_marks
            THEN 'Pass'
            ELSE 'Fail'
        END AS status,

        s.submitted_at

    FROM submissions s

    JOIN exams e
    ON s.exam_id = e.exam_id

    WHERE s.user_id = %s

    ORDER BY s.submitted_at DESC
    """

    cur.execute(history_query, (user_id,))

    history = cur.fetchall()

    history_list = []

    for row in history:

        history_list.append(
            {
                "submission_id": row[0],
                "exam_id": row[1],
                "exam_title": row[2],
                "score": row[3],
                "total_marks": row[4],
                "percentage": row[5],
                "status": row[6],
                "submitted_at": str(row[7]),
            }
        )

    cur.close()

    return (
        jsonify(
            {
                "candidate": {
                    "user_id": candidate[0],
                    "name": candidate[1],
                    "email": candidate[2],
                    "batch_name": candidate[3],
                    "technology": candidate[4],
                },
                "summary": {
                    "assessment_count": summary[0],
                    "average_score": summary[1],
                    "highest_score": summary[2],
                    "lowest_score": summary[3],
                },
                "history": history_list,
            }
        ),
        200,
    )
