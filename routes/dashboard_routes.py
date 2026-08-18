from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

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

    cur.execute(role_query, (current_user_id,))

    user = cur.fetchone()

    if not user:

        cur.close()

        return jsonify({"message": "User not found"}), 404

    if user[0] != "Admin":

        cur.close()

        return (
            jsonify({"message": "Only Admin can access the Dashboard."}),
            403,
        )

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

    return (
        jsonify(
            {
                "total_exams": total_exams,
                "total_questions": total_questions,
                "total_submissions": total_submissions,
                "total_users": total_users,
                "total_batches": total_batches,
            }
        ),
        200,
    )


@dashboard_bp.route("/exam-analytics", methods=["GET"])
@jwt_required()
def exam_analytics():

    cur = mysql.connection.cursor()

    # ==========================================
    # Total Exams
    # ==========================================

    cur.execute(
        """
        SELECT COUNT(*)
        FROM exams
        """
    )

    total_exams = cur.fetchone()[0]

    # ==========================================
    # Exam Library
    # ==========================================

    query = """
    SELECT
        e.exam_id,
        e.title,
        e.exam_type,
        e.duration,
        e.total_marks,
        e.passing_marks,

        COUNT(DISTINCT q.question_id) AS questions,

        COUNT(DISTINCT a.schedule_id) AS schedule_count,

        u.name AS created_by_name

    FROM exams e

    LEFT JOIN users u
        ON e.created_by = u.user_id

    LEFT JOIN questions q
        ON e.exam_id = q.exam_id

    LEFT JOIN assessment_schedules a
        ON e.exam_id = a.exam_id

    GROUP BY
        e.exam_id,
        e.title,
        e.exam_type,
        e.duration,
        e.total_marks,
        e.passing_marks,
        u.name

    ORDER BY
        e.exam_id DESC
    """

    cur.execute(query)

    exams = cur.fetchall()

    cur.close()

    # ==========================================
    # Build Exam Library Response
    # ==========================================

    exam_list = []

    for exam in exams:

        exam_type = exam[2]
        schedule_count = exam[7]

        if exam_type == "Actual":

            if schedule_count > 0:
                schedule_status = "Scheduled"
            else:
                schedule_status = "Not Scheduled"

        else:
            schedule_status = None

        exam_list.append(
            {
                "exam_id": exam[0],
                "title": exam[1],
                "exam_type": exam[2],
                "duration": exam[3],
                "total_marks": exam[4],
                "passing_marks": exam[5],
                "questions": exam[6],
                "schedule_count": exam[7],
                "created_by_name": exam[8],
                "schedule_status": schedule_status,
            }
        )

    # ==========================================
    # Response
    # ==========================================

    return (
        jsonify(
            {
                "total_exams": total_exams,
                "exam_wise": exam_list,
            }
        ),
        200,
    )


@dashboard_bp.route("/submission-analytics", methods=["GET"])
@jwt_required()
def submission_analytics():

    cur = mysql.connection.cursor()

    # ==========================================
    # Total Submissions
    # ==========================================

    cur.execute(
        """
        SELECT COUNT(*)
        FROM submissions
        """
    )

    total_submissions = cur.fetchone()[0]

    # ==========================================
    # Exam Performance
    # ==========================================

    query = """
    SELECT

        e.exam_id,
        e.title,
        e.exam_type,
        e.total_marks,

        COUNT(s.submission_id) AS submissions,

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

        CASE
            WHEN COUNT(s.submission_id) = 0
                THEN NULL
            ELSE
                ROUND(
                    (
                        SUM(
                            CASE
                                WHEN s.score >= e.passing_marks
                                    THEN 1
                                ELSE 0
                            END
                        ) / COUNT(s.submission_id)
                    ) * 100,
                    2
                )
        END AS pass_rate,

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
        e.title,
        e.exam_type,
        e.passing_marks,
        e.total_marks

    ORDER BY
        e.exam_id DESC
    """

    cur.execute(query)

    exams = cur.fetchall()

    cur.close()

    # ==========================================
    # Build Submission Analytics Response
    # ==========================================

    exam_list = []

    for exam in exams:

        exam_list.append(
            {
                "exam_id": exam[0],
                "title": exam[1],
                "exam_type": exam[2],
                "total_marks": exam[3],
                "submissions": exam[4],
                "average_score": exam[5],
                "highest_score": exam[6],
                "pass_rate": exam[7],
                "highest_scorer": exam[8] if exam[8] else "-",
            }
        )

    # ==========================================
    # Response
    # ==========================================

    return (
        jsonify(
            {
                "total_submissions": total_submissions,
                "exam_wise": exam_list,
            }
        ),
        200,
    )