from flask import Blueprint, jsonify
from flask_jwt_extended import (
    jwt_required
)

from extensions import mysql

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/dashboard", methods=["GET"])
@jwt_required()
def dashboard():

    from flask_jwt_extended import get_jwt_identity

    current_user_id = get_jwt_identity()

    cur = mysql.connection.cursor()

    # ==========================================
    # Verify Admin
    # ==========================================

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

    if user[0] != "Admin":

        cur.close()

        return jsonify({
            "message": "Only Admin can access the Dashboard."
        }), 403

    # ==========================================
    # Dashboard Counts
    # ==========================================

    cur.execute("SELECT COUNT(*) FROM exams")
    total_exams = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM questions")
    total_questions = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM submissions")
    total_submissions = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM users")
    total_users = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM batches")
    total_batches = cur.fetchone()[0]

    cur.close()

    return jsonify({

        "total_exams": total_exams,

        "total_questions": total_questions,

        "total_submissions": total_submissions,

        "total_users": total_users,

        "total_batches": total_batches

    }), 200


@dashboard_bp.route("/exam-analytics", methods=["GET"])
@jwt_required()
def exam_analytics():

    cur = mysql.connection.cursor()

    # Total exams

    cur.execute("""
    SELECT COUNT(*)
    FROM exams
    """)

    total_exams = cur.fetchone()[0]

    # Exam Library

    query = """
    SELECT
        e.exam_id,
        e.title,

        COUNT(DISTINCT q.question_id) AS questions,

        COUNT(DISTINCT s.submission_id) AS submissions,

        IFNULL(
            ROUND(
                AVG(s.score),
                2
            ),
            0
        ) AS average_score

    FROM exams e

    LEFT JOIN questions q
        ON e.exam_id = q.exam_id

    LEFT JOIN submissions s
        ON e.exam_id = s.exam_id

    GROUP BY
        e.exam_id,
        e.title

    ORDER BY
        e.exam_id DESC
    """

    cur.execute(query)

    exams = cur.fetchall()

    cur.close()

    exam_list = []

    for exam in exams:

        exam_list.append({

            "exam_id": exam[0],
            "title": exam[1],
            "questions": exam[2],
            "submissions": exam[3],
            "average_score": exam[4]

        })

    return jsonify({

        "total_exams": total_exams,
        "exam_wise": exam_list

    }), 200


@dashboard_bp.route("/submission-analytics", methods=["GET"])
@jwt_required()
def submission_analytics():

    cur = mysql.connection.cursor()

    # Total submissions

    cur.execute("""
    SELECT COUNT(*)
    FROM submissions
    """)

    total_submissions = cur.fetchone()[0]

    # Exam Performance

    query = """
    SELECT

        e.exam_id,
        e.title,

        COUNT(s.submission_id) AS attempts,

        IFNULL(
            ROUND(
                AVG(s.score),
                2
            ),
            0
        ) AS average_score,

        IFNULL(
            MAX(s.score),
            0
        ) AS highest_score,

        (
            SELECT u.name
            FROM submissions s2
            JOIN users u
                ON s2.user_id = u.user_id
            WHERE
                s2.exam_id = e.exam_id
            ORDER BY
                s2.score DESC,
                s2.submitted_at ASC
            LIMIT 1
        ) AS highest_scorer

    FROM exams e

    LEFT JOIN submissions s
        ON e.exam_id = s.exam_id

    GROUP BY

        e.exam_id,
        e.title

    ORDER BY

        e.exam_id DESC
    """

    cur.execute(query)

    exams = cur.fetchall()

    cur.close()

    exam_list = []

    for exam in exams:

        exam_list.append({

            "exam_id": exam[0],
            "title": exam[1],
            "attempts": exam[2],
            "average_score": exam[3],
            "highest_score": exam[4],
            "highest_scorer": exam[5] if exam[5] else "-"

        })

    return jsonify({

        "total_submissions": total_submissions,
        "exam_wise": exam_list

    }), 200