from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity
)

from extensions import mysql

submission_bp = Blueprint("submission", __name__)


@submission_bp.route("/start-exam", methods=["POST"])
@jwt_required()
def start_exam():

    current_user_id = get_jwt_identity()

    cur = mysql.connection.cursor()

    role_query = """
    SELECT role
    FROM users
    WHERE user_id = %s
    """

    cur.execute(
        role_query,
        (current_user_id,)
    )

    user = cur.fetchone()

    if not user:

        cur.close()

        return jsonify({
            "message": "User not found"
        }), 404

    if user[0] != "Candidate":

        cur.close()

        return jsonify({
            "message": "Only candidates can start exams"
        }), 403

    data = request.get_json()

    exam_id = data.get("exam_id")

    # Already attempted?

    check_query = """
    SELECT submission_id
    FROM submissions
    WHERE user_id = %s
    AND exam_id = %s
    """

    cur.execute(
        check_query,
        (
            current_user_id,
            exam_id
        )
    )

    existing = cur.fetchone()

    if existing:

        cur.close()

        return jsonify({
            "message":
            "You have already attempted this exam."
        }), 400

    duration_query = """
    SELECT duration
    FROM exams
    WHERE exam_id = %s
    """

    cur.execute(
        duration_query,
        (exam_id,)
    )

    exam = cur.fetchone()

    if not exam:

        cur.close()

        return jsonify({
            "message": "Exam not found"
        }), 404

    insert_query = """
    INSERT INTO submissions
    (
        user_id,
        exam_id,
        score,
        start_time,
        status
    )
    VALUES
    (
        %s,
        %s,
        0,
        CONVERT_TZ(NOW(), '+00:00', '+05:30'),
        'In Progress'
    )
    """
    from datetime import datetime

    print("Python Time:", datetime.now())

    cur.execute(
        insert_query,
        (
            current_user_id,
            exam_id
        )
    )

    mysql.connection.commit()

    submission_id = cur.lastrowid

    cur.close()

    return jsonify({

        "message":
        "Exam started",

        "submission_id":
        submission_id,

        "duration":
        exam[0]

    }), 200


@submission_bp.route("/exam-session/<int:exam_id>", methods=["GET"])
@jwt_required()
def get_exam_session(exam_id):

    current_user_id = get_jwt_identity()

    cur = mysql.connection.cursor()

    role_query = """
    SELECT role
    FROM users
    WHERE user_id = %s
    """

    cur.execute(
        role_query,
        (current_user_id,)
    )

    user = cur.fetchone()

    if not user:

        cur.close()

        return jsonify({
            "message": "User not found"
        }), 404

    if user[0] != "Candidate":

        cur.close()

        return jsonify({
            "message": "Only candidates can access exam session"
        }), 403

    session_query = """
    SELECT
        s.submission_id,
        s.start_time,
        e.duration,
        s.status
    FROM submissions s
    JOIN exams e
        ON s.exam_id = e.exam_id
    WHERE
        s.user_id = %s
        AND s.exam_id = %s
    ORDER BY s.submission_id DESC
    LIMIT 1
    """

    cur.execute(
        session_query,
        (
            current_user_id,
            exam_id
        )
    )

    session = cur.fetchone()

    if not session:

        cur.close()

        return jsonify({
            "status": "Not Started"
        }), 200

    answers_query = """
    SELECT
        question_id,
        answer_text
    FROM answers
    WHERE submission_id = %s
    """

    cur.execute(
        answers_query,
        (session[0],)
    )

    saved_answers = cur.fetchall()

    answer_list = []

    for answer in saved_answers:

        answer_list.append({

            "question_id": answer[0],

            "answer_text": answer[1]

        })

    cur.close()

    return jsonify({

        "submission_id": session[0],

        "start_time": str(session[1]),

        "duration": session[2],

        "status": session[3],

        "answers": answer_list

    }), 200


@submission_bp.route("/save-answer", methods=["POST"])
@jwt_required()
def save_answer():

    current_user_id = get_jwt_identity()

    cur = mysql.connection.cursor()

    data = request.get_json()

    submission_id = data.get("submission_id")
    question_id = data.get("question_id")
    answer_text = data.get("answer_text")

    submission_query = """
    SELECT submission_id
    FROM submissions
    WHERE
        submission_id = %s
        AND user_id = %s
        AND status = 'In Progress'
    """

    cur.execute(
        submission_query,
        (
            submission_id,
            current_user_id
        )
    )

    submission = cur.fetchone()

    if not submission:

        cur.close()

        return jsonify({
            "message": "Invalid submission."
        }), 404

    check_query = """
    SELECT answer_id
    FROM answers
    WHERE
        submission_id = %s
        AND question_id = %s
    """

    cur.execute(
        check_query,
        (
            submission_id,
            question_id
        )
    )

    existing = cur.fetchone()

    if existing:

        update_query = """
        UPDATE answers
        SET answer_text = %s
        WHERE
            submission_id = %s
            AND question_id = %s
        """

        cur.execute(
            update_query,
            (
                answer_text,
                submission_id,
                question_id
            )
        )

    else:

        insert_query = """
        INSERT INTO answers
        (
            submission_id,
            question_id,
            answer_text,
            is_correct
        )
        VALUES
        (
            %s,
            %s,
            %s,
            0
        )
        """

        cur.execute(
            insert_query,
            (
                submission_id,
                question_id,
                answer_text
            )
        )

    mysql.connection.commit()

    cur.close()

    return jsonify({

        "message": "Answer saved."

    }), 200


@submission_bp.route("/submit-exam", methods=["POST"])
@jwt_required()
def submit_exam():

    current_user_id = get_jwt_identity()

    cur = mysql.connection.cursor()

    role_query = """
    SELECT role
    FROM users
    WHERE user_id = %s
    """

    cur.execute(
        role_query,
        (current_user_id,)
    )

    user = cur.fetchone()

    if not user:

        cur.close()

        return jsonify({
            "message": "User not found"
        }), 404

    if user[0] != "Candidate":

        cur.close()

        return jsonify({
            "message": "Only candidates can submit exams"
        }), 403

    data = request.get_json()

    exam_id = data.get("exam_id")

    submission_query = """
    SELECT submission_id
    FROM submissions
    WHERE
        user_id = %s
        AND exam_id = %s
        AND status = 'In Progress'
    """

    cur.execute(
        submission_query,
        (
            current_user_id,
            exam_id
        )
    )

    submission = cur.fetchone()

    if not submission:

        cur.close()

        return jsonify({
            "message": "No active exam found."
        }), 404

    submission_id = submission[0]

    answers_query = """
    SELECT
        answer_id,
        question_id,
        answer_text
    FROM answers
    WHERE submission_id = %s
    """

    cur.execute(
        answers_query,
        (submission_id,)
    )

    saved_answers = cur.fetchall()

    total_score = 0

    for answer in saved_answers:

        answer_id = answer[0]
        question_id = answer[1]
        answer_text = answer[2]

        correct_query = """
        SELECT option_text
        FROM options
        WHERE
            question_id = %s
            AND is_correct = 1
        """

        cur.execute(
            correct_query,
            (question_id,)
        )

        correct_answer = cur.fetchone()

        is_correct = False

        if correct_answer:

            is_correct = (
                answer_text.strip().lower()
                ==
                correct_answer[0].strip().lower()
            )

        update_answer_query = """
        UPDATE answers
        SET is_correct = %s
        WHERE answer_id = %s
        """

        cur.execute(
            update_answer_query,
            (
                is_correct,
                answer_id
            )
        )

        if is_correct:

            marks_query = """
            SELECT marks
            FROM questions
            WHERE question_id = %s
            """

            cur.execute(
                marks_query,
                (question_id,)
            )

            marks = cur.fetchone()

            if marks:

                total_score += marks[0]

    update_submission_query = """
UPDATE submissions
SET
    score = %s,
    status = 'Completed',
    submitted_at = DATE_ADD(UTC_TIMESTAMP(), INTERVAL 5 HOUR 30 MINUTE)
WHERE submission_id = %s
"""

    cur.execute(
        update_submission_query,
        (
            total_score,
            submission_id
        )
    )

    mysql.connection.commit()

    cur.close()

    return jsonify({

        "message": "Exam submitted successfully",

        "submission_id": submission_id,

        "score": total_score

    }), 200