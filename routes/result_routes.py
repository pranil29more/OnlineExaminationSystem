from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import mysql

result_bp = Blueprint("result", __name__)


@result_bp.route("/results", methods=["GET"])
@jwt_required()
def get_results():

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

    if role in ["Admin", "Examiner"]:

        query = """
        SELECT
            s.submission_id,
            s.exam_id,
            e.title,
            u.name,
            s.score,
            e.total_marks,
            e.passing_marks,
            s.submitted_at
        FROM submissions s
        JOIN users u
            ON s.user_id = u.user_id
        JOIN exams e
            ON s.exam_id = e.exam_id
        ORDER BY s.submitted_at DESC
        """

        cur.execute(query)

        results = cur.fetchall()

        result_list = []

        for result in results:

            result_list.append(
                {
                    "submission_id": result[0],
                    "exam_id": result[1],
                    "exam_title": result[2],
                    "candidate_name": result[3],
                    "score": result[4],
                    "total_marks": result[5],
                    "passing_marks": result[6],
                    "submitted_at": str(result[7]),
                }
            )

    else:

        query = """
        SELECT
            s.submission_id,
            s.exam_id,
            e.title,
            s.score,
            e.total_marks,
            e.passing_marks,
            s.submitted_at
        FROM submissions s
        JOIN exams e
            ON s.exam_id = e.exam_id
        WHERE s.user_id = %s
        ORDER BY s.submitted_at DESC
        """

        cur.execute(query, (current_user_id,))

        results = cur.fetchall()

        result_list = []

        for result in results:

            result_list.append(
                {
                    "submission_id": result[0],
                    "exam_id": result[1],
                    "exam_title": result[2],
                    "score": result[3],
                    "total_marks": result[4],
                    "passing_marks": result[5],
                    "submitted_at": str(result[6]),
                }
            )

    cur.close()

    return jsonify(result_list), 200


@result_bp.route("/result/<int:submission_id>", methods=["GET"])
@jwt_required()
def get_result(submission_id):

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

    # =========================
    # Admin / Examiner
    # =========================

    if role in ["Admin", "Examiner"]:

        submission_query = """
        SELECT
    s.submission_id,
    s.exam_id,
    e.title,
    u.name,
    b.batch_name,
    s.score,
    e.total_marks,
    e.passing_marks,
    ROUND(
        (s.score * 100.0) / e.total_marks,
        2
    ) AS percentage,
    s.submitted_at
FROM submissions s
JOIN users u
    ON s.user_id = u.user_id
JOIN exams e
    ON s.exam_id = e.exam_id
LEFT JOIN batches b
    ON u.batch_id = b.batch_id
WHERE s.submission_id = %s
        """

        cur.execute(submission_query, (submission_id,))

    # =========================
    # Candidate
    # =========================

    else:

        submission_query = """
        SELECT
    s.submission_id,
    s.exam_id,
    e.title,
    u.name,
    b.batch_name,
    s.score,
    e.total_marks,
    e.passing_marks,
    ROUND(
        (s.score * 100.0) / e.total_marks,
        2
    ) AS percentage,
    s.submitted_at
FROM submissions s
JOIN users u
    ON s.user_id = u.user_id
JOIN exams e
    ON s.exam_id = e.exam_id
LEFT JOIN batches b
    ON u.batch_id = b.batch_id
WHERE s.submission_id = %s
AND s.user_id = %s
        """

        cur.execute(submission_query, (submission_id, current_user_id))

    submission = cur.fetchone()

    if not submission:

        cur.close()

        return jsonify({"message": "Result not found"}), 404

    answers_query = """
    SELECT
        q.question_text,
        a.answer_text,
        a.is_correct
    FROM answers a
    JOIN questions q
        ON a.question_id = q.question_id
    WHERE a.submission_id = %s
    """

    cur.execute(answers_query, (submission_id,))

    answers = cur.fetchall()

    cur.close()

    answer_list = []

    for answer in answers:

        answer_list.append(
            {
                "question_text": answer[0],
                "answer_text": answer[1],
                "is_correct": bool(answer[2]),
            }
        )

    return (
        jsonify(
            {
                "submission_id": submission[0],
                "exam_id": submission[1],
                "exam_title": submission[2],
                "candidate_name": submission[3],
"batch_name": submission[4],
"score": submission[5],
"total_marks": submission[6],
"passing_marks": submission[7],
"percentage": submission[8],
"submitted_at": str(submission[9]),
                "answers": answer_list,
            }
        ),
        200,
    )


@result_bp.route("/exam-results/<int:exam_id>", methods=["GET"])
@jwt_required()
def get_exam_results(exam_id):

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

    # ==========================================
    # Fetch Exam Details
    # ==========================================

    exam_query = """
    SELECT
        exam_id,
        title,
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

    # ==========================================
    # Fetch Student Results
    # ==========================================

    results_query = """
    SELECT
        s.submission_id,
        u.name,
        s.score,
        s.submitted_at
    FROM submissions s
    JOIN users u
        ON s.user_id = u.user_id
    WHERE s.exam_id = %s
    ORDER BY
        s.score DESC,
        s.submitted_at DESC
    """

    cur.execute(results_query, (exam_id,))

    results = cur.fetchall()

    cur.close()

    result_list = []

    for result in results:

        result_list.append({

            "submission_id": result[0],

            "candidate_name": result[1],

            "score": result[2],

            "submitted_at": str(result[3])

        })

    return jsonify({

        "exam": {

            "exam_id": exam[0],

            "title": exam[1],

            "total_marks": exam[2],

            "passing_marks": exam[3]

        },

        "results": result_list

    }), 200
