from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import mysql

import os
from google import genai


ai_bp = Blueprint("ai", __name__)


client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


def get_admin_user(user_id):

    cur = mysql.connection.cursor()

    query = """
    SELECT
        user_id,
        name,
        email,
        role
    FROM users
    WHERE user_id = %s
    """

    cur.execute(query, (user_id,))

    user = cur.fetchone()

    cur.close()

    return user


def get_all_exams():

    cur = mysql.connection.cursor()

    query = """
    SELECT
        e.exam_id,
        e.title,
        e.duration,
        e.total_marks,
        e.passing_marks,
        e.exam_type,
        u.name
    FROM exams e
    LEFT JOIN users u
        ON e.created_by = u.user_id
    ORDER BY e.exam_id DESC
    """

    cur.execute(query)

    exams = cur.fetchall()

    cur.close()

    return exams


def get_exam_details(user_message):

    cur = mysql.connection.cursor()

    query = """
    SELECT
        e.exam_id,
        e.title,
        e.duration,
        e.total_marks,
        e.passing_marks,
        e.exam_type,
        u.name
    FROM exams e
    LEFT JOIN users u
        ON e.created_by = u.user_id
    """

    cur.execute(query)

    exams = cur.fetchall()

    cur.close()

    question = user_message.lower()

    best_match = None
    highest_score = 0

    for exam in exams:

        title = exam[1].lower()

        score = 0

        for word in title.split():

            clean_word = word.strip(".,!?()[]{}:")

            if len(clean_word) > 2 and clean_word in question:
                score += 1

        if score > highest_score:

            highest_score = score
            best_match = exam

    return best_match


def get_exam_context(exam):

    if not exam:

        return ""

    return f"""
Exam ID: {exam[0]}
Exam Title: {exam[1]}
Duration: {exam[2]} minutes
Total Marks: {exam[3]}
Passing Marks: {exam[4]}
Exam Type: {exam[5]}
Created By: {exam[6]}
"""


def get_all_exam_context():

    exams = get_all_exams()

    if not exams:

        return "There are currently no exams in the system."

    context = ""

    for exam in exams:

        context += f"""
Exam ID: {exam[0]}
Title: {exam[1]}
Duration: {exam[2]} minutes
Total Marks: {exam[3]}
Passing Marks: {exam[4]}
Exam Type: {exam[5]}
Created By: {exam[6]}

"""

    return context


def get_dashboard_data():

    cur = mysql.connection.cursor()

    cur.execute("SELECT COUNT(*) FROM users")
    total_users = cur.fetchone()[0]

    cur.execute(
        """
        SELECT COUNT(*)
        FROM users
        WHERE role = 'Candidate'
        """
    )
    total_candidates = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM batches")
    total_batches = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM exams")
    total_exams = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM questions")
    total_questions = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM submissions")
    total_submissions = cur.fetchone()[0]

    cur.execute(
        """
        SELECT COUNT(*)
        FROM exams
        WHERE exam_type = 'Practice'
        """
    )
    practice_exams = cur.fetchone()[0]

    cur.execute(
        """
        SELECT COUNT(*)
        FROM exams
        WHERE exam_type = 'Actual'
        """
    )
    actual_exams = cur.fetchone()[0]

    cur.close()

    return {
        "total_users": total_users,
        "total_candidates": total_candidates,
        "total_batches": total_batches,
        "total_exams": total_exams,
        "total_questions": total_questions,
        "total_submissions": total_submissions,
        "practice_exams": practice_exams,
        "actual_exams": actual_exams,
    }


def get_submission_analytics_data():

    cur = mysql.connection.cursor()

    query = """
    SELECT
        e.exam_id,
        e.title,
        e.exam_type,
        e.total_marks,
        e.passing_marks,

        COUNT(s.submission_id),

        IFNULL(
            ROUND(AVG(s.score), 2),
            0
        ),

        IFNULL(
            MAX(s.score),
            0
        ),

        IFNULL(
            MIN(s.score),
            0
        ),

        CASE
            WHEN COUNT(s.submission_id) = 0
                THEN 0
            ELSE
                ROUND(
                    (
                        SUM(
                            CASE
                                WHEN s.score >= e.passing_marks
                                    THEN 1
                                ELSE 0
                            END
                        )
                        /
                        COUNT(s.submission_id)
                    ) * 100,
                    2
                )
        END

    FROM exams e

    LEFT JOIN submissions s
        ON e.exam_id = s.exam_id

    GROUP BY
        e.exam_id,
        e.title,
        e.exam_type,
        e.total_marks,
        e.passing_marks

    ORDER BY e.exam_id DESC
    """

    cur.execute(query)

    results = cur.fetchall()

    cur.close()

    return results


def get_candidate_results_data():

    cur = mysql.connection.cursor()

    query = """
    SELECT
        u.user_id,
        u.name,
        u.email,
        b.batch_name,

        COUNT(s.submission_id),

        IFNULL(
            ROUND(
                AVG(
                    (s.score * 100.0) / e.total_marks
                ),
                2
            ),
            0
        ),

        IFNULL(
            ROUND(
                MAX(
                    (s.score * 100.0) / e.total_marks
                ),
                2
            ),
            0
        ),

        IFNULL(
            ROUND(
                MIN(
                    (s.score * 100.0) / e.total_marks
                ),
                2
            ),
            0
        )

    FROM users u

    LEFT JOIN batches b
        ON u.batch_id = b.batch_id

    LEFT JOIN submissions s
        ON u.user_id = s.user_id

    LEFT JOIN exams e
        ON s.exam_id = e.exam_id

    WHERE u.role = 'Candidate'

    GROUP BY
        u.user_id,
        u.name,
        u.email,
        b.batch_name

    ORDER BY u.name
    """

    cur.execute(query)

    results = cur.fetchall()

    cur.close()

    return results


def get_batch_data():

    cur = mysql.connection.cursor()

    query = """
    SELECT
        b.batch_id,
        b.batch_name,
        b.technology,
        b.trainer_name,
        b.start_date,
        b.end_date,

        COUNT(
            CASE
                WHEN u.role = 'Candidate'
                THEN u.user_id
            END
        )

    FROM batches b

    LEFT JOIN users u
        ON b.batch_id = u.batch_id

    GROUP BY
        b.batch_id,
        b.batch_name,
        b.technology,
        b.trainer_name,
        b.start_date,
        b.end_date

    ORDER BY b.batch_id DESC
    """

    cur.execute(query)

    batches = cur.fetchall()

    cur.close()

    return batches


def get_schedule_data():

    cur = mysql.connection.cursor()

    query = """
    SELECT
        s.schedule_id,
        e.exam_id,
        e.title,
        s.batch_id,
        b.batch_name,
        s.candidate_id,
        c.name,
        s.scheduled_start,
        s.scheduled_end,

        CASE
            WHEN CONVERT_TZ(
                UTC_TIMESTAMP(),
                '+00:00',
                '+05:30'
            ) < s.scheduled_start
                THEN 'Upcoming'

            WHEN CONVERT_TZ(
                UTC_TIMESTAMP(),
                '+00:00',
                '+05:30'
            ) BETWEEN
                s.scheduled_start
                AND s.scheduled_end
                THEN 'Available'

            ELSE 'Ended'
        END

    FROM assessment_schedules s

    JOIN exams e
        ON s.exam_id = e.exam_id

    LEFT JOIN batches b
        ON s.batch_id = b.batch_id

    LEFT JOIN users c
        ON s.candidate_id = c.user_id

    ORDER BY s.scheduled_start DESC
    """

    cur.execute(query)

    schedules = cur.fetchall()

    cur.close()

    return schedules


def detect_intent(message):

    question = message.lower().strip()

    if any(
        keyword in question
        for keyword in [
            "list exams",
            "show exams",
            "all exams",
            "available exams",
            "which exams are available",
            "what exams are available",
            "exams available",
            "display exams",
        ]
    ):

        return "all_exams"

    if any(
        keyword in question
        for keyword in [
            "overall statistics",
            "overall stats",
            "system statistics",
            "system stats",
            "dashboard",
            "dashboard statistics",
            "overall examination statistics",
            "overall exam statistics",
            "how many users",
            "how many candidates",
            "how many batches",
            "how many questions",
            "how many submissions",
            "total users",
            "total candidates",
            "total batches",
            "total questions",
            "total submissions",
            "total exams",
        ]
    ):

        return "dashboard"

    if any(
        keyword in question
        for keyword in [
            "candidate results",
            "candidate performance",
            "student performance",
            "student results",
            "who scored",
            "top scorer",
            "highest scorer",
            "failed candidates",
            "candidate score",
            "candidate scores",
            "candidate percentage",
            "student percentage",
            "highest percentage",
            "lowest percentage",
            "average percentage",
        ]
    ):

        return "candidate_results"

    if any(
        keyword in question
        for keyword in [
            "pass rate",
            "average score",
            "highest score",
            "lowest score",
            "exam performance",
            "exam analytics",
            "submission analytics",
            "performance of exams",
            "which exam has",
            "best performing exam",
            "worst performing exam",
            "highest performing exam",
            "lowest performing exam",
        ]
    ):

        return "submission_analytics"

    if any(
        keyword in question
        for keyword in [
            "upcoming assessment",
            "upcoming assessments",
            "upcoming exam",
            "upcoming exams",
            "available assessment",
            "available assessments",
            "assessment schedule",
            "assessment schedules",
            "schedule",
            "scheduled",
            "schedules",
        ]
    ):

        return "schedules"

    if any(
        keyword in question
        for keyword in [
            "batch",
            "batches",
            "trainer",
            "technology",
            "batch strength",
            "candidates in",
            "batch information",
            "batch details",
        ]
    ):

        return "batches"

    if any(
        keyword in question
        for keyword in [
            "exam details",
            "exam detail",
            "tell me about",
            "duration",
            "marks",
            "passing marks",
            "created by",
            "exam type",
        ]
    ):

        return "exam_details"

    if "exam" in question or "test" in question:

        return "exam_details"

    return "educational"


def format_all_exams():

    exams = get_all_exams()

    if not exams:

        return "There are currently no exams in the system."

    response = "Here are the exams currently available in the system:\n\n"

    for exam in exams:

        response += (
            f"• **{exam[1]}**\n"
            f"  - Exam ID: {exam[0]}\n"
            f"  - Duration: {exam[2]} minutes\n"
            f"  - Total Marks: {exam[3]}\n"
            f"  - Passing Marks: {exam[4]}\n"
            f"  - Type: {exam[5]}\n"
            f"  - Created By: {exam[6] if exam[6] else 'Unknown'}\n\n"
        )

    return response


def format_exam_details(user_message):

    exam = get_exam_details(user_message)

    if not exam:

        return (
            "I couldn't find an exam matching your request "
            "in the examination system."
        )

    return (
        f"Here are the details of **{exam[1]}**:\n\n"
        f"• Exam ID: {exam[0]}\n"
        f"• Duration: {exam[2]} minutes\n"
        f"• Total Marks: {exam[3]}\n"
        f"• Passing Marks: {exam[4]}\n"
        f"• Exam Type: {exam[5]}\n"
        f"• Created By: {exam[6] if exam[6] else 'Unknown'}"
    )


def format_dashboard():

    data = get_dashboard_data()

    return (
        "Here are the overall examination system statistics:\n\n"
        f"• Total Users: **{data['total_users']}**\n"
        f"• Total Candidates: **{data['total_candidates']}**\n"
        f"• Total Batches: **{data['total_batches']}**\n"
        f"• Total Exams: **{data['total_exams']}**\n"
        f"• Total Questions: **{data['total_questions']}**\n"
        f"• Total Submissions: **{data['total_submissions']}**\n"
        f"• Practice Exams: **{data['practice_exams']}**\n"
        f"• Actual Exams: **{data['actual_exams']}**"
    )


def format_submission_analytics(user_message):

    results = get_submission_analytics_data()

    if not results:

        return "No examination performance data is currently available."

    question = user_message.lower()

    exams_with_submissions = [
        row for row in results if row[5] > 0
    ]

    if not exams_with_submissions:

        return "There are currently no submissions available for performance analysis."

    if "pass rate" in question:

        highest_rate = max(
            row[9] for row in exams_with_submissions
        )

        matching = [
            row for row in exams_with_submissions
            if row[9] == highest_rate
        ]

        response = (
            f"The highest pass rate is **{highest_rate:.2f}%**.\n\n"
        )

        for row in matching:

            response += (
                f"• **{row[1]}**\n"
                f"  - Exam ID: {row[0]}\n"
                f"  - Pass Rate: {row[9]:.2f}%\n"
                f"  - Submissions: {row[5]}\n"
                f"  - Exam Type: {row[2]}\n\n"
            )

        return response

    if "highest score" in question:

        highest_score = max(
            row[7] for row in exams_with_submissions
        )

        matching = [
            row for row in exams_with_submissions
            if row[7] == highest_score
        ]

        response = (
            f"The highest score recorded is **{highest_score}**.\n\n"
        )

        for row in matching:

            response += (
                f"• **{row[1]}**\n"
                f"  - Exam ID: {row[0]}\n"
                f"  - Highest Score: {row[7]}\n"
                f"  - Total Marks: {row[3]}\n"
                f"  - Submissions: {row[5]}\n\n"
            )

        return response

    if "lowest score" in question:

        lowest_score = min(
            row[8] for row in exams_with_submissions
        )

        matching = [
            row for row in exams_with_submissions
            if row[8] == lowest_score
        ]

        response = (
            f"The lowest score recorded is **{lowest_score}**.\n\n"
        )

        for row in matching:

            response += (
                f"• **{row[1]}**\n"
                f"  - Exam ID: {row[0]}\n"
                f"  - Lowest Score: {row[8]}\n"
                f"  - Total Marks: {row[3]}\n"
                f"  - Submissions: {row[5]}\n\n"
            )

        return response

    if "average score" in question:

        highest_average = max(
            row[6] for row in exams_with_submissions
        )

        matching = [
            row for row in exams_with_submissions
            if row[6] == highest_average
        ]

        response = (
            f"The highest average score is **{highest_average:.2f}**.\n\n"
        )

        for row in matching:

            response += (
                f"• **{row[1]}**\n"
                f"  - Exam ID: {row[0]}\n"
                f"  - Average Score: {row[6]:.2f}\n"
                f"  - Submissions: {row[5]}\n\n"
            )

        return response

    response = "Here is the examination performance data:\n\n"

    for row in results:

        response += (
            f"• **{row[1]}**\n"
            f"  - Exam ID: {row[0]}\n"
            f"  - Exam Type: {row[2]}\n"
            f"  - Submissions: {row[5]}\n"
            f"  - Average Score: {row[6]}\n"
            f"  - Highest Score: {row[7]}\n"
            f"  - Lowest Score: {row[8]}\n"
            f"  - Pass Rate: {row[9]}%\n\n"
        )

    return response


def format_candidate_results(user_message):

    results = get_candidate_results_data()

    if not results:

        return "No candidate result data is currently available."

    candidates_with_results = [
        row for row in results if row[4] > 0
    ]

    if not candidates_with_results:

        return "There are currently no candidate submissions available."

    question = user_message.lower()

    if (
        "top scorer" in question
        or "highest percentage" in question
        or "highest score" in question
        or "who scored" in question
    ):

        highest = max(
            row[6] for row in candidates_with_results
        )

        matching = [
            row for row in candidates_with_results
            if row[6] == highest
        ]

        response = (
            f"The highest candidate percentage is **{highest:.2f}%**.\n\n"
        )

        for row in matching:

            response += (
                f"• **{row[1]}**\n"
                f"  - Candidate ID: {row[0]}\n"
                f"  - Batch: {row[3] if row[3] else 'Not Assigned'}\n"
                f"  - Average Percentage: {row[5]:.2f}%\n"
                f"  - Highest Percentage: {row[6]:.2f}%\n"
                f"  - Assessments: {row[4]}\n\n"
            )

        return response

    response = "Here is the candidate performance data:\n\n"

    for row in candidates_with_results:

        response += (
            f"• **{row[1]}**\n"
            f"  - Candidate ID: {row[0]}\n"
            f"  - Email: {row[2]}\n"
            f"  - Batch: {row[3] if row[3] else 'Not Assigned'}\n"
            f"  - Assessments: {row[4]}\n"
            f"  - Average Percentage: {row[5]:.2f}%\n"
            f"  - Highest Percentage: {row[6]:.2f}%\n"
            f"  - Lowest Percentage: {row[7]:.2f}%\n\n"
        )

    return response


def format_batches():

    batches = get_batch_data()

    if not batches:

        return "There are currently no batches in the system."

    response = "Here are the batches currently available:\n\n"

    for batch in batches:

        response += (
            f"• **{batch[1]}**\n"
            f"  - Batch ID: {batch[0]}\n"
            f"  - Technology: {batch[2]}\n"
            f"  - Trainer: {batch[3] if batch[3] else 'Not Assigned'}\n"
            f"  - Start Date: {batch[4]}\n"
            f"  - End Date: {batch[5]}\n"
            f"  - Candidates: {batch[6]}\n\n"
        )

    return response


def format_schedules(user_message):

    schedules = get_schedule_data()

    if not schedules:

        return "There are currently no assessment schedules."

    question = user_message.lower()

    if "upcoming" in question:

        schedules = [
            schedule
            for schedule in schedules
            if schedule[9] == "Upcoming"
        ]

        if not schedules:

            return "There are currently no upcoming assessment schedules."

    elif "available" in question:

        schedules = [
            schedule
            for schedule in schedules
            if schedule[9] == "Available"
        ]

        if not schedules:

            return "There are currently no assessments available right now."

    response = "Here are the assessment schedules:\n\n"

    for schedule in schedules:

        if schedule[4]:

            assigned_to = f"Batch: {schedule[4]}"

        elif schedule[6]:

            assigned_to = f"Candidate: {schedule[6]}"

        else:

            assigned_to = "Not specified"

        response += (
            f"• **{schedule[2]}**\n"
            f"  - Schedule ID: {schedule[0]}\n"
            f"  - Exam ID: {schedule[1]}\n"
            f"  - Assigned To: {assigned_to}\n"
            f"  - Start: {schedule[7]}\n"
            f"  - End: {schedule[8]}\n"
            f"  - Status: {schedule[9]}\n\n"
        )

    return response


def build_direct_database_response(user_message):

    intent = detect_intent(user_message)

    if intent == "all_exams":

        return format_all_exams()

    if intent == "exam_details":

        return format_exam_details(user_message)

    if intent == "dashboard":

        return format_dashboard()

    if intent == "submission_analytics":

        return format_submission_analytics(user_message)

    if intent == "candidate_results":

        return format_candidate_results(user_message)

    if intent == "batches":

        return format_batches()

    if intent == "schedules":

        return format_schedules(user_message)

    return None


def build_system_prompt(user_message):

    return f"""
You are the AI Assistant for an Online Examination System.

You are assisting an administrator.

Answer the user's educational question clearly and accurately.

Topics may include:

- Python
- Java
- SQL
- Databases
- Data Structures
- Algorithms
- Networking
- Artificial Intelligence
- Machine Learning
- Cybersecurity
- Programming
- Software Engineering
- Other academic subjects

Rules:

- Provide accurate educational explanations.
- Keep answers concise but useful.
- Use examples when they improve understanding.
- Use code examples when appropriate.
- Never assist with cheating during an active examination.
- Do not invent information about the Online Examination System.
- Do not claim to have accessed the application's database.
- Do not discuss internal system implementation unless asked.

User Question:

{user_message}
"""


@ai_bp.route("/chat", methods=["POST"])
@jwt_required()
def chat():

    try:

        current_user_id = get_jwt_identity()

        user = get_admin_user(current_user_id)

        if not user:

            return jsonify(
                {
                    "error": "User not found."
                }
            ), 404

        if user[3] != "Admin":

            return jsonify(
                {
                    "error":
                    "Only Admin can access the AI Assistant."
                }
            ), 403

        data = request.get_json(silent=True)

        if not data:

            return jsonify(
                {
                    "error": "Invalid request."
                }
            ), 400

        user_message = data.get("message", "").strip()

        if not user_message:

            return jsonify(
                {
                    "error": "Message cannot be empty."
                }
            ), 400

        intent = detect_intent(user_message)

        if intent != "educational":

            database_response = build_direct_database_response(
                user_message
            )

            return jsonify(
                {
                    "response": database_response,
                    "source": "database"
                }
            ), 200

        system_prompt = build_system_prompt(
            user_message
        )

        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=system_prompt
        )

        return jsonify(
            {
                "response": response.text,
                "source": "gemini"
            }
        ), 200

    except Exception as e:

        import traceback

        traceback.print_exc()

        return jsonify(
            {
                "error": str(e)
            }
        ), 500