from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import mysql
from utils.decorators import role_required

import os
import re
from google import genai


ai_bp = Blueprint("ai", __name__)


client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


GEMINI_MODEL = os.getenv(
    "GEMINI_MODEL",
    "gemini-3.5-flash"
)


def normalize_text(text):

    text = str(text or "").lower()

    text = text.replace("’", "'")
    text = text.replace("-", " ")
    text = re.sub(r"[^a-z0-9\s']", " ", text)
    text = re.sub(r"\s+", " ", text)

    return text.strip()


def contains_any(text, phrases):

    return any(
        phrase in text
        for phrase in phrases
    )


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

    question = normalize_text(
        user_message
    )

    best_match = None
    highest_score = 0

    generic_words = {
        "exam",
        "exams",
        "test",
        "tests",
        "details",
        "detail",
        "information",
        "about",
        "tell",
        "show",
        "give",
        "what",
        "which",
        "the",
        "for",
        "of",
        "is",
        "are",
        "me",
    }

    for exam in exams:

        title = normalize_text(
            exam[1]
        )

        score = 0

        if title and title in question:

            score += 1000

        for word in title.split():

            if (
                len(word) >= 2
                and word in question
                and word not in generic_words
            ):

                score += 10

        if score > highest_score:

            highest_score = score
            best_match = exam

    if highest_score == 0:

        return None

    return best_match


def get_batch_details(user_message):

    cur = mysql.connection.cursor()

    query = """
    SELECT
        b.batch_id,
        b.batch_name,
        b.technology,
        b.trainer_name,
        b.start_date,
        b.end_date
    FROM batches b
    ORDER BY b.batch_id DESC
    """

    cur.execute(query)

    batches = cur.fetchall()

    cur.close()

    if not batches:

        return None

    question = normalize_text(
        user_message
    )

    generic_words = {
        "batch",
        "batches",
        "batch's",
        "report",
        "performance",
        "results",
        "result",
        "score",
        "scores",
        "candidate",
        "candidates",
        "student",
        "students",
        "learner",
        "learners",
        "trainee",
        "trainees",
        "details",
        "detail",
        "show",
        "give",
        "tell",
        "what",
        "how",
        "about",
        "the",
        "for",
        "of",
        "in",
        "is",
        "are",
        "me",
        "who",
        "top",
        "performer",
        "performers",
        "highest",
        "lowest",
        "best",
        "worst",
        "failed",
        "passed",
        "pass",
        "average",
        "all",
        "list",
        "my",
        "their",
    }

    best_match = None
    highest_score = 0

    for batch in batches:

        batch_name = str(
            batch[1]
        ).strip()

        batch_lower = normalize_text(
            batch_name
        )

        score = 0

        if (
            batch_lower
            and batch_lower in question
        ):

            score += 1000

        batch_words = batch_lower.split()

        for word in batch_words:

            if (
                len(word) >= 2
                and word in question
                and word not in generic_words
            ):

                score += 10

        if score > highest_score:

            highest_score = score
            best_match = batch

    if highest_score == 0:

        return None

    return best_match


def get_all_candidates():

    cur = mysql.connection.cursor()

    query = """
    SELECT
        u.user_id,
        u.name,
        u.email,
        b.batch_name
    FROM users u
    LEFT JOIN batches b
        ON u.batch_id = b.batch_id
    WHERE u.role = 'Candidate'
    ORDER BY u.name
    """

    cur.execute(query)

    candidates = cur.fetchall()

    cur.close()

    return candidates


def get_candidates_by_batch(
    user_message
):

    batch = get_batch_details(
        user_message
    )

    if not batch:

        return None

    cur = mysql.connection.cursor()

    query = """
    SELECT
        u.user_id,
        u.name,
        u.email
    FROM users u
    WHERE
        u.role = 'Candidate'
        AND u.batch_id = %s
    ORDER BY u.name
    """

    cur.execute(
        query,
        (batch[0],)
    )

    candidates = cur.fetchall()

    cur.close()

    return {
        "batch": batch,
        "candidates": candidates
    }


def get_candidate_by_name(
    user_message
):

    candidates = get_all_candidates()

    if not candidates:

        return None

    question = normalize_text(
        user_message
    )

    best_match = None
    highest_score = 0

    for candidate in candidates:

        name = normalize_text(
            candidate[1]
        )

        if not name:
            continue

        score = 0

        if name in question:

            score += 100

        name_words = name.split()

        for word in name_words:

            if (
                len(word) >= 3
                and word in question
            ):

                score += 10

        if score > highest_score:

            highest_score = score
            best_match = candidate

    if highest_score == 0:

        return None

    return best_match


def get_candidate_performance_by_id(
    user_id
):

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
                    (s.score * 100.0)
                    / NULLIF(e.total_marks, 0)
                ),
                2
            ),
            0
        ),

        IFNULL(
            ROUND(
                MAX(
                    (s.score * 100.0)
                    / NULLIF(e.total_marks, 0)
                ),
                2
            ),
            0
        ),

        IFNULL(
            ROUND(
                MIN(
                    (s.score * 100.0)
                    / NULLIF(e.total_marks, 0)
                ),
                2
            ),
            0
        ),

        IFNULL(
            SUM(
                CASE
                    WHEN s.score >= e.passing_marks
                    THEN 1
                    ELSE 0
                END
            ),
            0
        ),

        IFNULL(
            SUM(
                CASE
                    WHEN s.score < e.passing_marks
                    THEN 1
                    ELSE 0
                END
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

    WHERE
        u.user_id = %s
        AND u.role = 'Candidate'

    GROUP BY
        u.user_id,
        u.name,
        u.email,
        b.batch_name
    """

    cur.execute(
        query,
        (user_id,)
    )

    result = cur.fetchone()

    cur.close()

    return result


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

        return (
            "There are currently no exams "
            "in the system."
        )

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

    cur.execute(
        "SELECT COUNT(*) FROM users"
    )

    total_users = cur.fetchone()[0]

    cur.execute(
        """
        SELECT COUNT(*)
        FROM users
        WHERE role = 'Candidate'
        """
    )

    total_candidates = cur.fetchone()[0]

    cur.execute(
        "SELECT COUNT(*) FROM batches"
    )

    total_batches = cur.fetchone()[0]

    cur.execute(
        "SELECT COUNT(*) FROM exams"
    )

    total_exams = cur.fetchone()[0]

    cur.execute(
        "SELECT COUNT(*) FROM questions"
    )

    total_questions = cur.fetchone()[0]

    cur.execute(
        "SELECT COUNT(*) FROM submissions"
    )

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
            ROUND(
                AVG(s.score),
                2
            ),
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
                    (s.score * 100.0)
                    / NULLIF(e.total_marks, 0)
                ),
                2
            ),
            0
        ),

        IFNULL(
            ROUND(
                MAX(
                    (s.score * 100.0)
                    / NULLIF(e.total_marks, 0)
                ),
                2
            ),
            0
        ),

        IFNULL(
            ROUND(
                MIN(
                    (s.score * 100.0)
                    / NULLIF(e.total_marks, 0)
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


def get_batch_performance_data(
    user_message
):

    batch = get_batch_details(
        user_message
    )

    if not batch:

        return None

    batch_id = batch[0]

    cur = mysql.connection.cursor()

    overall_query = """
    SELECT
        COUNT(DISTINCT u.user_id),

        COUNT(s.submission_id),

        IFNULL(
            ROUND(
                AVG(
                    (s.score * 100.0)
                    / NULLIF(e.total_marks, 0)
                ),
                2
            ),
            0
        ),

        IFNULL(
            ROUND(
                MAX(
                    (s.score * 100.0)
                    / NULLIF(e.total_marks, 0)
                ),
                2
            ),
            0
        ),

        IFNULL(
            ROUND(
                MIN(
                    (s.score * 100.0)
                    / NULLIF(e.total_marks, 0)
                ),
                2
            ),
            0
        ),

        IFNULL(
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
                    NULLIF(
                        COUNT(s.submission_id),
                        0
                    )
                ) * 100,
                2
            ),
            0
        )

    FROM batches b

    LEFT JOIN users u
        ON b.batch_id = u.batch_id
        AND u.role = 'Candidate'

    LEFT JOIN submissions s
        ON u.user_id = s.user_id

    LEFT JOIN exams e
        ON s.exam_id = e.exam_id

    WHERE b.batch_id = %s
    """

    cur.execute(
        overall_query,
        (batch_id,)
    )

    overall = cur.fetchone()

    exam_query = """
    SELECT
        e.exam_id,
        e.title,
        e.exam_type,
        e.total_marks,
        e.passing_marks,

        COUNT(s.submission_id),

        IFNULL(
            ROUND(
                AVG(
                    (s.score * 100.0)
                    / NULLIF(e.total_marks, 0)
                ),
                2
            ),
            0
        ),

        IFNULL(
            ROUND(
                MAX(
                    (s.score * 100.0)
                    / NULLIF(e.total_marks, 0)
                ),
                2
            ),
            0
        ),

        IFNULL(
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
                    NULLIF(
                        COUNT(s.submission_id),
                        0
                    )
                ) * 100,
                2
            ),
            0
        )

    FROM submissions s

    JOIN users u
        ON s.user_id = u.user_id

    JOIN exams e
        ON s.exam_id = e.exam_id

    WHERE
        u.role = 'Candidate'
        AND u.batch_id = %s

    GROUP BY
        e.exam_id,
        e.title,
        e.exam_type,
        e.total_marks,
        e.passing_marks

    ORDER BY e.exam_id DESC
    """

    cur.execute(
        exam_query,
        (batch_id,)
    )

    exam_results = cur.fetchall()

    candidate_query = """
    SELECT
        u.user_id,
        u.name,
        u.email,

        COUNT(s.submission_id),

        IFNULL(
            ROUND(
                AVG(
                    (s.score * 100.0)
                    / NULLIF(e.total_marks, 0)
                ),
                2
            ),
            0
        ),

        IFNULL(
            ROUND(
                MAX(
                    (s.score * 100.0)
                    / NULLIF(e.total_marks, 0)
                ),
                2
            ),
            0
        ),

        IFNULL(
            ROUND(
                MIN(
                    (s.score * 100.0)
                    / NULLIF(e.total_marks, 0)
                ),
                2
            ),
            0
        ),

        IFNULL(
            SUM(
                CASE
                    WHEN s.score >= e.passing_marks
                    THEN 1
                    ELSE 0
                END
            ),
            0
        ),

        IFNULL(
            SUM(
                CASE
                    WHEN s.score < e.passing_marks
                    THEN 1
                    ELSE 0
                END
            ),
            0
        )

    FROM users u

    LEFT JOIN submissions s
        ON u.user_id = s.user_id

    LEFT JOIN exams e
        ON s.exam_id = e.exam_id

    WHERE
        u.role = 'Candidate'
        AND u.batch_id = %s

    GROUP BY
        u.user_id,
        u.name,
        u.email

    ORDER BY
        AVG(
            (s.score * 100.0)
            / NULLIF(e.total_marks, 0)
        ) DESC
    """

    cur.execute(
        candidate_query,
        (batch_id,)
    )

    candidate_results = cur.fetchall()

    cur.close()

    return {
        "batch": batch,
        "overall": overall,
        "exam_results": exam_results,
        "candidate_results": candidate_results,
    }


def format_all_candidates():

    candidates = get_all_candidates()

    if not candidates:

        return (
            "There are currently no candidates "
            "registered in the system."
        )

    response = (
        f"## All Candidates\n\n"
        f"Found **{len(candidates)}** "
        f"candidate(s) in the system.\n\n"
    )

    for candidate in candidates:

        response += (
            f"• **{candidate[1]}**\n"
            f"  - Candidate ID: {candidate[0]}\n"
            f"  - Email: {candidate[2]}\n"
            f"  - Batch: "
            f"{candidate[3] if candidate[3] else 'Not Assigned'}\n\n"
        )

    return response


def format_candidates_by_batch(
    user_message
):

    data = get_candidates_by_batch(
        user_message
    )

    if not data:

        return (
            "I couldn't identify the batch "
            "from your request. Please mention "
            "the batch name."
        )

    batch = data["batch"]
    candidates = data["candidates"]

    if not candidates:

        return (
            f"There are currently no candidates "
            f"assigned to **{batch[1]}**."
        )

    response = (
        f"## Candidates in {batch[1]}\n\n"
        f"• **Batch ID:** {batch[0]}\n"
        f"• **Technology:** {batch[2]}\n"
        f"• **Trainer:** "
        f"{batch[3] if batch[3] else 'Not Assigned'}\n"
        f"• **Candidate Count:** {len(candidates)}\n\n"
    )

    for candidate in candidates:

        response += (
            f"• **{candidate[1]}**\n"
            f"  - Candidate ID: {candidate[0]}\n"
            f"  - Email: {candidate[2]}\n\n"
        )

    return response


def format_candidate_details(
    user_message
):

    candidate = get_candidate_by_name(
        user_message
    )

    if not candidate:

        return (
            "I couldn't identify the candidate "
            "from your request."
        )

    performance = (
        get_candidate_performance_by_id(
            candidate[0]
        )
    )

    if not performance:

        return (
            f"Candidate **{candidate[1]}** "
            f"was found, but no performance "
            f"data is available."
        )

    return (
        f"## Candidate Details\n\n"
        f"• **Name:** {performance[1]}\n"
        f"• **Candidate ID:** {performance[0]}\n"
        f"• **Email:** {performance[2]}\n"
        f"• **Batch:** "
        f"{performance[3] if performance[3] else 'Not Assigned'}\n"
        f"• **Assessments:** {performance[4]}\n"
        f"• **Average Percentage:** "
        f"{performance[5]:.2f}%\n"
        f"• **Highest Percentage:** "
        f"{performance[6]:.2f}%\n"
        f"• **Lowest Percentage:** "
        f"{performance[7]:.2f}%\n"
        f"• **Passed Assessments:** "
        f"{performance[8]}\n"
        f"• **Failed Assessments:** "
        f"{performance[9]}"
    )


def format_all_exams():

    exams = get_all_exams()

    if not exams:

        return (
            "There are currently no exams "
            "in the system."
        )

    response = (
        "## Available Exams\n\n"
        f"Found **{len(exams)}** exam(s).\n\n"
    )

    for exam in exams:

        response += (
            f"• **{exam[1]}**\n"
            f"  - Exam ID: {exam[0]}\n"
            f"  - Duration: {exam[2]} minutes\n"
            f"  - Total Marks: {exam[3]}\n"
            f"  - Passing Marks: {exam[4]}\n"
            f"  - Type: {exam[5]}\n"
            f"  - Created By: "
            f"{exam[6] if exam[6] else 'Unknown'}\n\n"
        )

    return response


def format_exam_details(
    user_message
):

    exam = get_exam_details(
        user_message
    )

    if not exam:

        return (
            "I couldn't find an exam matching "
            "your request in the examination system."
        )

    return (
        f"## {exam[1]}\n\n"
        f"• **Exam ID:** {exam[0]}\n"
        f"• **Duration:** {exam[2]} minutes\n"
        f"• **Total Marks:** {exam[3]}\n"
        f"• **Passing Marks:** {exam[4]}\n"
        f"• **Exam Type:** {exam[5]}\n"
        f"• **Created By:** "
        f"{exam[6] if exam[6] else 'Unknown'}"
    )


def format_dashboard():

    data = get_dashboard_data()

    return (
        "## Overall Examination System Statistics\n\n"
        f"• **Total Users:** {data['total_users']}\n"
        f"• **Total Candidates:** {data['total_candidates']}\n"
        f"• **Total Batches:** {data['total_batches']}\n"
        f"• **Total Exams:** {data['total_exams']}\n"
        f"• **Total Questions:** {data['total_questions']}\n"
        f"• **Total Submissions:** {data['total_submissions']}\n"
        f"• **Practice Exams:** {data['practice_exams']}\n"
        f"• **Actual Exams:** {data['actual_exams']}"
    )


def format_submission_analytics(
    user_message
):

    results = get_submission_analytics_data()

    if not results:

        return (
            "No examination performance data "
            "is currently available."
        )

    question = normalize_text(
        user_message
    )

    exams_with_submissions = [
        row
        for row in results
        if row[5] > 0
    ]

    if not exams_with_submissions:

        return (
            "There are currently no submissions "
            "available for performance analysis."
        )

    if contains_any(
        question,
        [
            "pass rate",
            "passing rate",
            "pass percentage",
            "passing percentage",
        ]
    ):

        highest_rate = max(
            row[9]
            for row in exams_with_submissions
        )

        matching = [
            row
            for row in exams_with_submissions
            if row[9] == highest_rate
        ]

        response = (
            f"## Highest Exam Pass Rate\n\n"
            f"The highest pass rate is "
            f"**{highest_rate:.2f}%**.\n\n"
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

    if contains_any(
        question,
        [
            "highest score",
            "maximum score",
            "highest percentage",
            "maximum percentage",
        ]
    ):

        highest_score = max(
            row[7]
            for row in exams_with_submissions
        )

        matching = [
            row
            for row in exams_with_submissions
            if row[7] == highest_score
        ]

        response = (
            f"## Highest Exam Score\n\n"
            f"The highest score recorded is "
            f"**{highest_score}**.\n\n"
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

    if contains_any(
        question,
        [
            "lowest score",
            "minimum score",
            "lowest percentage",
            "minimum percentage",
        ]
    ):

        lowest_score = min(
            row[8]
            for row in exams_with_submissions
        )

        matching = [
            row
            for row in exams_with_submissions
            if row[8] == lowest_score
        ]

        response = (
            f"## Lowest Exam Score\n\n"
            f"The lowest score recorded is "
            f"**{lowest_score}**.\n\n"
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

    if contains_any(
        question,
        [
            "average score",
            "average performance",
            "highest average",
        ]
    ):

        highest_average = max(
            row[6]
            for row in exams_with_submissions
        )

        matching = [
            row
            for row in exams_with_submissions
            if row[6] == highest_average
        ]

        response = (
            f"## Highest Average Exam Score\n\n"
            f"The highest average score is "
            f"**{highest_average:.2f}**.\n\n"
        )

        for row in matching:

            response += (
                f"• **{row[1]}**\n"
                f"  - Exam ID: {row[0]}\n"
                f"  - Average Score: {row[6]:.2f}\n"
                f"  - Submissions: {row[5]}\n\n"
            )

        return response

    response = (
        "## Examination Performance\n\n"
    )

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


def format_candidate_results(
    user_message
):

    results = get_candidate_results_data()

    if not results:

        return (
            "No candidate result data is "
            "currently available."
        )

    candidates_with_results = [
        row
        for row in results
        if row[4] > 0
    ]

    if not candidates_with_results:

        return (
            "There are currently no candidate "
            "submissions available."
        )

    question = normalize_text(
        user_message
    )

    if contains_any(
        question,
        [
            "top scorer",
            "top performer",
            "best performer",
            "highest scorer",
            "highest percentage",
            "who scored highest",
            "who scored the highest",
            "who is the top",
        ]
    ):

        highest = max(
            row[6]
            for row in candidates_with_results
        )

        matching = [
            row
            for row in candidates_with_results
            if row[6] == highest
        ]

        response = (
            f"## Top Candidate\n\n"
            f"The highest candidate percentage is "
            f"**{highest:.2f}%**.\n\n"
        )

        for row in matching:

            response += (
                f"• **{row[1]}**\n"
                f"  - Candidate ID: {row[0]}\n"
                f"  - Batch: "
                f"{row[3] if row[3] else 'Not Assigned'}\n"
                f"  - Average Percentage: "
                f"{row[5]:.2f}%\n"
                f"  - Highest Percentage: "
                f"{row[6]:.2f}%\n"
                f"  - Assessments: {row[4]}\n\n"
            )

        return response

    response = (
        "## Candidate Performance\n\n"
    )

    for row in candidates_with_results:

        response += (
            f"• **{row[1]}**\n"
            f"  - Candidate ID: {row[0]}\n"
            f"  - Email: {row[2]}\n"
            f"  - Batch: "
            f"{row[3] if row[3] else 'Not Assigned'}\n"
            f"  - Assessments: {row[4]}\n"
            f"  - Average Percentage: "
            f"{row[5]:.2f}%\n"
            f"  - Highest Percentage: "
            f"{row[6]:.2f}%\n"
            f"  - Lowest Percentage: "
            f"{row[7]:.2f}%\n\n"
        )

    return response


def format_batches():

    batches = get_batch_data()

    if not batches:

        return (
            "There are currently no batches "
            "in the system."
        )

    response = (
        "## Available Batches\n\n"
        f"Found **{len(batches)}** batch(es).\n\n"
    )

    for batch in batches:

        response += (
            f"• **{batch[1]}**\n"
            f"  - Batch ID: {batch[0]}\n"
            f"  - Technology: {batch[2]}\n"
            f"  - Trainer: "
            f"{batch[3] if batch[3] else 'Not Assigned'}\n"
            f"  - Start Date: {batch[4]}\n"
            f"  - End Date: {batch[5]}\n"
            f"  - Candidates: {batch[6]}\n\n"
        )

    return response


def format_batch_details(
    user_message
):

    batch = get_batch_details(
        user_message
    )

    if not batch:

        return (
            "I couldn't find a batch matching "
            "your request in the examination system."
        )

    cur = mysql.connection.cursor()

    cur.execute(
        """
        SELECT COUNT(*)
        FROM users
        WHERE batch_id = %s
        AND role = 'Candidate'
        """,
        (batch[0],)
    )

    candidate_count = cur.fetchone()[0]

    cur.close()

    return (
        f"## {batch[1]}\n\n"
        f"• **Batch ID:** {batch[0]}\n"
        f"• **Technology:** {batch[2]}\n"
        f"• **Trainer:** "
        f"{batch[3] if batch[3] else 'Not Assigned'}\n"
        f"• **Start Date:** {batch[4]}\n"
        f"• **End Date:** {batch[5]}\n"
        f"• **Candidates:** {candidate_count}"
    )


def format_batch_performance(
    user_message
):

    data = get_batch_performance_data(
        user_message
    )

    if not data:

        return (
            "I couldn't identify the specific "
            "batch from your request. Please "
            "mention the batch name."
        )

    batch = data["batch"]
    overall = data["overall"]
    exam_results = data["exam_results"]
    candidate_results = data[
        "candidate_results"
    ]

    candidate_count = overall[0]
    submission_count = overall[1]
    average_percentage = overall[2]
    highest_percentage = overall[3]
    lowest_percentage = overall[4]
    pass_rate = overall[5]

    question = normalize_text(
        user_message
    )

    candidates_with_results = [
        row
        for row in candidate_results
        if row[3] > 0
    ]

    if contains_any(
        question,
        [
            "top performer",
            "best performer",
            "top candidate",
            "best candidate",
            "who performed best",
            "who is the best",
            "who is top",
            "who is the top",
            "top scorer",
        ]
    ):

        if not candidates_with_results:

            return (
                f"There are no candidate submissions "
                f"available for **{batch[1]}** yet."
            )

        highest_average = max(
            row[4]
            for row in candidates_with_results
        )

        matching = [
            row
            for row in candidates_with_results
            if row[4] == highest_average
        ]

        response = (
            f"## Top Performer\n\n"
            f"**Batch:** {batch[1]}\n\n"
            f"The top performer has an average "
            f"percentage of "
            f"**{highest_average:.2f}%**.\n\n"
        )

        for row in matching:

            response += (
                f"• **{row[1]}**\n"
                f"  - Candidate ID: {row[0]}\n"
                f"  - Assessments: {row[3]}\n"
                f"  - Average Percentage: "
                f"{row[4]:.2f}%\n"
                f"  - Highest Percentage: "
                f"{row[5]:.2f}%\n"
                f"  - Lowest Percentage: "
                f"{row[6]:.2f}%\n\n"
            )

        return response

    if contains_any(
        question,
        [
            "highest scorer",
            "highest score",
            "highest percentage",
            "maximum score",
            "maximum percentage",
            "highest individual",
        ]
    ):

        if not candidates_with_results:

            return (
                f"There are no candidate submissions "
                f"available for **{batch[1]}** yet."
            )

        highest = max(
            row[5]
            for row in candidates_with_results
        )

        matching = [
            row
            for row in candidates_with_results
            if row[5] == highest
        ]

        response = (
            f"## Highest Individual Performance\n\n"
            f"**Batch:** {batch[1]}\n\n"
            f"The highest percentage achieved is "
            f"**{highest:.2f}%**.\n\n"
        )

        for row in matching:

            response += (
                f"• **{row[1]}**\n"
                f"  - Candidate ID: {row[0]}\n"
                f"  - Highest Percentage: "
                f"{row[5]:.2f}%\n"
                f"  - Average Percentage: "
                f"{row[4]:.2f}%\n"
                f"  - Assessments: {row[3]}\n\n"
            )

        return response

    if contains_any(
        question,
        [
            "failed candidates",
            "failed candidate",
            "who failed",
            "candidates who failed",
            "students who failed",
            "who has failed",
            "who have failed",
        ]
    ):

        failed_candidates = [
            row
            for row in candidates_with_results
            if row[8] > 0
        ]

        if not failed_candidates:

            return (
                f"No candidates have failed an "
                f"assessment in **{batch[1]}**."
            )

        response = (
            f"## Failed Candidates\n\n"
            f"**Batch:** {batch[1]}\n\n"
            f"Found **{len(failed_candidates)}** "
            f"candidate(s) with at least one "
            f"failed assessment.\n\n"
        )

        for row in failed_candidates:

            response += (
                f"• **{row[1]}**\n"
                f"  - Candidate ID: {row[0]}\n"
                f"  - Failed Assessments: {row[8]}\n"
                f"  - Passed Assessments: {row[7]}\n"
                f"  - Average Percentage: "
                f"{row[4]:.2f}%\n\n"
            )

        return response

    if contains_any(
        question,
        [
            "passed candidates",
            "passed candidate",
            "who passed",
            "candidates who passed",
            "students who passed",
            "who has passed",
            "who have passed",
        ]
    ):

        passed_candidates = [
            row
            for row in candidates_with_results
            if row[7] > 0
        ]

        if not passed_candidates:

            return (
                f"No candidates have passed an "
                f"assessment in **{batch[1]}**."
            )

        response = (
            f"## Passed Candidates\n\n"
            f"**Batch:** {batch[1]}\n\n"
            f"Found **{len(passed_candidates)}** "
            f"candidate(s) with at least one "
            f"passed assessment.\n\n"
        )

        for row in passed_candidates:

            response += (
                f"• **{row[1]}**\n"
                f"  - Candidate ID: {row[0]}\n"
                f"  - Passed Assessments: {row[7]}\n"
                f"  - Failed Assessments: {row[8]}\n"
                f"  - Average Percentage: "
                f"{row[4]:.2f}%\n\n"
            )

        return response

    if contains_any(
        question,
        [
            "pass rate",
            "passing rate",
            "pass percentage",
            "passing percentage",
        ]
    ):

        return (
            f"## Batch Pass Rate\n\n"
            f"**Batch:** {batch[1]}\n\n"
            f"• Candidates: **{candidate_count}**\n"
            f"• Total Submissions: "
            f"**{submission_count}**\n"
            f"• Overall Pass Rate: "
            f"**{pass_rate:.2f}%**"
        )

    if contains_any(
        question,
        [
            "average performance",
            "average percentage",
            "average score",
            "overall average",
            "average result",
        ]
    ):

        return (
            f"## Average Batch Performance\n\n"
            f"**Batch:** {batch[1]}\n\n"
            f"• Candidates: **{candidate_count}**\n"
            f"• Total Submissions: "
            f"**{submission_count}**\n"
            f"• Average Percentage: "
            f"**{average_percentage:.2f}%**\n"
            f"• Highest Percentage: "
            f"**{highest_percentage:.2f}%**\n"
            f"• Lowest Percentage: "
            f"**{lowest_percentage:.2f}%**"
        )

    if contains_any(
        question,
        [
            "lowest percentage",
            "lowest score",
            "lowest performer",
            "worst performer",
            "who performed worst",
            "worst candidate",
        ]
    ):

        if not candidates_with_results:

            return (
                f"There are no candidate submissions "
                f"available for **{batch[1]}** yet."
            )

        lowest_average = min(
            row[4]
            for row in candidates_with_results
        )

        matching = [
            row
            for row in candidates_with_results
            if row[4] == lowest_average
        ]

        response = (
            f"## Lowest Performer\n\n"
            f"**Batch:** {batch[1]}\n\n"
            f"The lowest average percentage is "
            f"**{lowest_average:.2f}%**.\n\n"
        )

        for row in matching:

            response += (
                f"• **{row[1]}**\n"
                f"  - Candidate ID: {row[0]}\n"
                f"  - Assessments: {row[3]}\n"
                f"  - Average Percentage: "
                f"{row[4]:.2f}%\n"
                f"  - Highest Percentage: "
                f"{row[5]:.2f}%\n"
                f"  - Lowest Percentage: "
                f"{row[6]:.2f}%\n\n"
            )

        return response

    response = (
        f"## Batch Performance Report\n\n"
        f"### {batch[1]}\n\n"
        f"• **Batch ID:** {batch[0]}\n"
        f"• **Technology:** {batch[2]}\n"
        f"• **Trainer:** "
        f"{batch[3] if batch[3] else 'Not Assigned'}\n"
        f"• **Start Date:** {batch[4]}\n"
        f"• **End Date:** {batch[5]}\n\n"
        f"### Overall Performance\n\n"
        f"• **Candidates:** {candidate_count}\n"
        f"• **Total Submissions:** "
        f"{submission_count}\n"
        f"• **Average Percentage:** "
        f"{average_percentage:.2f}%\n"
        f"• **Highest Percentage:** "
        f"{highest_percentage:.2f}%\n"
        f"• **Lowest Percentage:** "
        f"{lowest_percentage:.2f}%\n"
        f"• **Overall Pass Rate:** "
        f"{pass_rate:.2f}%\n"
    )

    if exam_results:

        response += (
            "\n### Assessment Performance\n\n"
        )

        for row in exam_results:

            response += (
                f"• **{row[1]}**\n"
                f"  - Exam ID: {row[0]}\n"
                f"  - Type: {row[2]}\n"
                f"  - Total Marks: {row[3]}\n"
                f"  - Passing Marks: {row[4]}\n"
                f"  - Submissions: {row[5]}\n"
                f"  - Average: {row[6]:.2f}%\n"
                f"  - Highest: {row[7]:.2f}%\n"
                f"  - Pass Rate: {row[8]:.2f}%\n\n"
            )

    if candidates_with_results:

        response += (
            "### Candidate Performance\n\n"
        )

        for row in candidates_with_results:

            response += (
                f"• **{row[1]}**\n"
                f"  - Candidate ID: {row[0]}\n"
                f"  - Assessments: {row[3]}\n"
                f"  - Average: {row[4]:.2f}%\n"
                f"  - Highest: {row[5]:.2f}%\n"
                f"  - Lowest: {row[6]:.2f}%\n"
                f"  - Passed: {row[7]}\n"
                f"  - Failed: {row[8]}\n\n"
            )

    elif candidate_count > 0:

        response += (
            "\nNo candidate submissions are "
            "available for this batch yet."
        )

    else:

        response += (
            "\nThis batch currently has no "
            "candidates assigned."
        )

    return response


def format_schedules(
    user_message
):

    schedules = get_schedule_data()

    if not schedules:

        return (
            "There are currently no assessment schedules."
        )

    question = normalize_text(
        user_message
    )

    if "upcoming" in question:

        schedules = [
            schedule
            for schedule in schedules
            if schedule[9] == "Upcoming"
        ]

        if not schedules:

            return (
                "There are currently no upcoming "
                "assessment schedules."
            )

    elif "available" in question:

        schedules = [
            schedule
            for schedule in schedules
            if schedule[9] == "Available"
        ]

        if not schedules:

            return (
                "There are currently no assessments "
                "available right now."
            )

    response = (
        "## Assessment Schedules\n\n"
    )

    for schedule in schedules:

        if schedule[4]:

            assigned_to = (
                f"Batch: {schedule[4]}"
            )

        elif schedule[6]:

            assigned_to = (
                f"Candidate: {schedule[6]}"
            )

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


def detect_intent(
    message
):

    question = normalize_text(
        message
    )

    if (
        contains_any(
            question,
            [
                "candidates in",
                "candidate in",
                "students in",
                "student in",
                "learners in",
                "learner in",
                "trainees in",
                "trainee in",
                "candidates from",
                "students from",
                "learners from",
                "trainees from",
                "show candidates",
                "list candidates",
                "give me candidates",
                "who are the candidates",
            ]
        )
        and contains_any(
            question,
            [
                "batch",
                "batches",
            ]
        )
    ):

        return "candidates_by_batch"

    batch_words = [
        "batch",
        "batches",
        "batch's",
    ]

    batch_performance_words = [
        "performance",
        "performance report",
        "batch report",
        "report",
        "results",
        "result",
        "scores",
        "score",
        "pass rate",
        "passing rate",
        "pass percentage",
        "average score",
        "average percentage",
        "average performance",
        "highest score",
        "highest percentage",
        "highest scorer",
        "maximum score",
        "maximum percentage",
        "lowest score",
        "lowest percentage",
        "lowest performer",
        "worst performer",
        "top scorer",
        "top performer",
        "top candidate",
        "best performer",
        "best candidate",
        "failed candidates",
        "failed candidate",
        "passed candidates",
        "passed candidate",
        "who failed",
        "who passed",
        "who is the top",
        "who is top",
        "who performed best",
        "who performed worst",
        "how are candidates performing",
        "how did candidates perform",
    ]

    if (
        any(
            word in question
            for word in batch_words
        )
        and any(
            word in question
            for word in batch_performance_words
        )
    ):

        return "batch_performance"

    if contains_any(
        question,
        [
            "all candidates",
            "all candidate",
            "list candidates",
            "list all candidates",
            "show candidates",
            "show all candidates",
            "display candidates",
            "display all candidates",
            "give me candidates",
            "give me all candidates",
            "candidate list",
            "list of candidates",
            "all students",
            "list students",
            "show students",
            "all learners",
            "list learners",
            "show learners",
            "all trainees",
            "list trainees",
            "show trainees",
        ]
    ):

        return "all_candidates"

    if contains_any(
        question,
        [
            "how many candidates",
            "number of candidates",
            "count of candidates",
            "candidate count",
            "total candidates",
            "how many students",
            "number of students",
            "student count",
            "how many learners",
            "how many trainees",
        ]
    ):

        return "candidate_count"

    if contains_any(
        question,
        [
            "performance of",
            "result of",
            "results of",
            "score of",
            "scores of",
            "details of",
            "details for",
            "information about",
            "profile of",
        ]
    ) and contains_any(
        question,
        [
            "candidate",
            "student",
            "learner",
            "trainee",
        ]
    ):

        return "candidate_details"

    if contains_any(
        question,
        [
            "list exams",
            "show exams",
            "all exams",
            "available exams",
            "which exams are available",
            "what exams are available",
            "exams available",
            "display exams",
            "list all tests",
            "show all tests",
        ]
    ):

        return "all_exams"

    if contains_any(
        question,
        [
            "overall statistics",
            "overall stats",
            "system statistics",
            "system stats",
            "dashboard",
            "dashboard statistics",
            "overall examination statistics",
            "overall exam statistics",
            "how many users",
            "how many batches",
            "how many questions",
            "how many submissions",
            "total users",
            "total batches",
            "total questions",
            "total submissions",
            "total exams",
        ]
    ):

        return "dashboard"

    if contains_any(
        question,
        [
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

    if contains_any(
        question,
        [
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

    if contains_any(
        question,
        [
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

    if contains_any(
        question,
        [
            "batch details",
            "batch detail",
            "details of batch",
            "details for batch",
            "information about batch",
            "information on batch",
            "tell me about batch",
            "show me batch details",
        ]
    ):

        return "batch_details"

    if contains_any(
        question,
        [
            "all batches",
            "list batches",
            "show batches",
            "available batches",
            "which batches",
            "batch list",
            "trainer",
            "technology",
            "batch strength",
            "batch information",
        ]
    ):

        return "batches"

    if contains_any(
        question,
        [
            "exam details",
            "exam detail",
            "tell me about exam",
            "duration",
            "marks",
            "passing marks",
            "created by",
            "exam type",
        ]
    ):

        return "exam_details"

    if (
        "exam" in question
        or "test" in question
    ):

        return "exam_details"

    return "educational"


def build_direct_database_response(
    user_message
):

    intent = detect_intent(
        user_message
    )

    if intent == "all_candidates":

        return format_all_candidates()

    if intent == "candidate_count":

        candidates = get_all_candidates()

        return (
            f"There are currently "
            f"**{len(candidates)}** candidates "
            f"registered in the system."
        )

    if intent == "candidates_by_batch":

        return format_candidates_by_batch(
            user_message
        )

    if intent == "candidate_details":

        return format_candidate_details(
            user_message
        )

    if intent == "all_exams":

        return format_all_exams()

    if intent == "exam_details":

        return format_exam_details(
            user_message
        )

    if intent == "dashboard":

        return format_dashboard()

    if intent == "submission_analytics":

        return format_submission_analytics(
            user_message
        )

    if intent == "candidate_results":

        return format_candidate_results(
            user_message
        )

    if intent == "batch_performance":

        return format_batch_performance(
            user_message
        )

    if intent == "batch_details":

        return format_batch_details(
            user_message
        )

    if intent == "batches":

        return format_batches()

    if intent == "schedules":

        return format_schedules(
            user_message
        )

    return None


def build_system_prompt(
    user_message
):

    return f"""
You are the AI Assistant for an Online Examination System.

You are assisting an administrator.

Answer the user's educational question clearly,
accurately and professionally.

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
- Do not pretend to have access to database records.
- Database-related questions are handled by the application backend.
- Do not fabricate candidate names, scores, batches, exams or results.
- Do not discuss internal system implementation unless asked.

User Question:

{user_message}
"""


@ai_bp.route(
    "/chat",
    methods=["POST"]
)
@jwt_required()
@role_required("Admin")
def chat():

    try:

        user_message = str(
            (
                request.get_json(
                    silent=True
                ) or {}
            ).get(
                "message",
                ""
            )
        ).strip()

        if not user_message:

            return jsonify(
                {
                    "error":
                    "Message cannot be empty."
                }
            ), 400

        intent = detect_intent(
            user_message
        )

        print(
            f"[AI ASSISTANT] "
            f"Message: {user_message}"
        )

        print(
            f"[AI ASSISTANT] "
            f"Detected Intent: {intent}"
        )

        if intent != "educational":

            database_response = (
                build_direct_database_response(
                    user_message
                )
            )

            if database_response is None:

                return jsonify(
                    {
                        "response":
                        "I could not retrieve "
                        "the requested system "
                        "information.",
                        "source":
                        "database"
                    }
                ), 200

            return jsonify(
                {
                    "response":
                    database_response,
                    "source":
                    "database",
                    "intent":
                    intent
                }
            ), 200

        system_prompt = build_system_prompt(
            user_message
        )

        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=system_prompt
        )

        return jsonify(
            {
                "response":
                response.text,
                "source":
                "gemini",
                "intent":
                "educational"
            }
        ), 200

    except Exception as e:

        import traceback

        traceback.print_exc()

        return jsonify(
            {
                "error":
                str(e)
            }
        ), 500