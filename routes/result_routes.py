from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import mysql
from utils.decorators import role_required


result_bp = Blueprint("result", __name__)


@result_bp.route(
    "/results",
    methods=["GET"],
)
@jwt_required()
@role_required(
    "Admin",
    "Examiner",
    "Candidate",
)
def get_results():

    current_user_id = get_jwt_identity()

    cur = mysql.connection.cursor()

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

        return jsonify(
            {
                "message":
                    "User not found"
            }
        ), 404

    role = user[0]

    if role in [
        "Admin",
        "Examiner",
    ]:

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
                    "submission_id":
                        result[0],

                    "exam_id":
                        result[1],

                    "exam_title":
                        result[2],

                    "candidate_name":
                        result[3],

                    "score":
                        result[4],

                    "total_marks":
                        result[5],

                    "passing_marks":
                        result[6],

                    "submitted_at":
                        str(result[7]),
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

        cur.execute(
            query,
            (current_user_id,),
        )

        results = cur.fetchall()

        result_list = []

        for result in results:

            result_list.append(
                {
                    "submission_id":
                        result[0],

                    "exam_id":
                        result[1],

                    "exam_title":
                        result[2],

                    "score":
                        result[3],

                    "total_marks":
                        result[4],

                    "passing_marks":
                        result[5],

                    "submitted_at":
                        str(result[6]),
                }
            )

    cur.close()

    return jsonify(
        result_list
    ), 200


@result_bp.route(
    "/result/<int:submission_id>",
    methods=["GET"],
)
@jwt_required()
@role_required(
    "Admin",
    "Examiner",
    "Candidate",
)
def get_result(submission_id):

    current_user_id = get_jwt_identity()

    cur = mysql.connection.cursor()

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

        return jsonify(
            {
                "message":
                    "User not found"
            }
        ), 404

    role = user[0]

    # ==========================================
    # Admin / Examiner
    # ==========================================

    if role in [
        "Admin",
        "Examiner",
    ]:

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

        cur.execute(
            submission_query,
            (submission_id,),
        )

    # ==========================================
    # Candidate
    # ==========================================

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
        WHERE
            s.submission_id = %s
            AND s.user_id = %s
        """

        cur.execute(
            submission_query,
            (
                submission_id,
                current_user_id,
            ),
        )

    submission = cur.fetchone()

    if not submission:

        cur.close()

        return jsonify(
            {
                "message":
                    "Result not found"
            }
        ), 404

    exam_id = submission[1]

    # ==========================================
    # Fetch ALL Questions
    # ==========================================

    answers_query = """
    SELECT
        q.question_id,
        q.question_text,
        a.answer_text,
        a.is_correct
    FROM questions q
    LEFT JOIN answers a
        ON q.question_id = a.question_id
        AND a.submission_id = %s
    WHERE q.exam_id = %s
    ORDER BY q.question_id
    """

    cur.execute(
        answers_query,
        (
            submission_id,
            exam_id,
        ),
    )

    answers = cur.fetchall()

    cur.close()

    answer_list = []

    for answer in answers:

        question_id = answer[0]

        question_text = answer[1]

        answer_text = answer[2]

        is_correct = answer[3]

        is_answered = (
            answer_text is not None
            and str(answer_text).strip() != ""
        )

        answer_list.append(
            {
                "question_id":
                    question_id,

                "question_text":
                    question_text,

                "answer_text":
                    answer_text,

                "is_answered":
                    is_answered,

                "is_correct":
                    bool(is_correct)
                    if is_answered
                    else False,
            }
        )

    return (
        jsonify(
            {
                "submission_id":
                    submission[0],

                "exam_id":
                    submission[1],

                "exam_title":
                    submission[2],

                "candidate_name":
                    submission[3],

                "batch_name":
                    submission[4],

                "score":
                    submission[5],

                "total_marks":
                    submission[6],

                "passing_marks":
                    submission[7],

                "percentage":
                    submission[8],

                "submitted_at":
                    str(submission[9]),

                "answers":
                    answer_list,
            }
        ),
        200,
    )


@result_bp.route(
    "/exam-results/<int:exam_id>",
    methods=["GET"],
)
@jwt_required()
@role_required(
    "Admin",
    "Examiner",
)
def get_exam_results(exam_id):

    cur = mysql.connection.cursor()

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

    cur.execute(
        exam_query,
        (exam_id,),
    )

    exam = cur.fetchone()

    if not exam:

        cur.close()

        return jsonify(
            {
                "message":
                    "Exam not found"
            }
        ), 404

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

    cur.execute(
        results_query,
        (exam_id,),
    )

    results = cur.fetchall()

    cur.close()

    result_list = []

    for result in results:

        result_list.append(
            {
                "submission_id":
                    result[0],

                "candidate_name":
                    result[1],

                "score":
                    result[2],

                "submitted_at":
                    str(result[3]),
            }
        )

    return (
        jsonify(
            {
                "exam": {
                    "exam_id":
                        exam[0],

                    "title":
                        exam[1],

                    "total_marks":
                        exam[2],

                    "passing_marks":
                        exam[3],
                },

                "results":
                    result_list,
            }
        ),
        200,
    )


@result_bp.route(
    "/candidate-results/<int:user_id>",
    methods=["GET"],
)
@jwt_required()
@role_required(
    "Admin",
    "Examiner",
)
def candidate_results(user_id):

    batch_id = request.args.get(
        "batch_id",
        type=int,
    )

    cur = mysql.connection.cursor()

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

    cur.execute(
        candidate_query,
        (user_id,),
    )

    candidate = cur.fetchone()

    if not candidate:

        cur.close()

        return jsonify(
            {
                "message":
                    "Candidate not found"
            }
        ), 404

    # ==========================================
    # Candidate Summary
    # ==========================================

    if batch_id is not None:

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

        AND EXISTS (
            SELECT 1
            FROM assessment_schedules ass
            WHERE ass.exam_id = e.exam_id
            AND ass.batch_id = %s
        )
        """

        cur.execute(
            summary_query,
            (
                user_id,
                batch_id,
            ),
        )

    else:

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

        cur.execute(
            summary_query,
            (user_id,),
        )

    summary = cur.fetchone()

    # ==========================================
    # Assessment History
    # ==========================================

    if batch_id is not None:

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

        AND EXISTS (
            SELECT 1
            FROM assessment_schedules ass
            WHERE ass.exam_id = e.exam_id
            AND ass.batch_id = %s
        )

        ORDER BY s.submitted_at DESC
        """

        cur.execute(
            history_query,
            (
                user_id,
                batch_id,
            ),
        )

    else:

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

        cur.execute(
            history_query,
            (user_id,),
        )

    history = cur.fetchall()

    history_list = []

    for row in history:

        history_list.append(
            {
                "submission_id":
                    row[0],

                "exam_id":
                    row[1],

                "exam_title":
                    row[2],

                "score":
                    row[3],

                "total_marks":
                    row[4],

                "percentage":
                    row[5],

                "status":
                    row[6],

                "submitted_at":
                    str(row[7]),
            }
        )

    cur.close()

    return (
        jsonify(
            {
                "candidate": {
                    "user_id":
                        candidate[0],

                    "name":
                        candidate[1],

                    "email":
                        candidate[2],

                    "batch_name":
                        candidate[3],

                    "technology":
                        candidate[4],
                },

                "summary": {
                    "assessment_count":
                        summary[0],

                    "average_score":
                        summary[1],

                    "highest_score":
                        summary[2],

                    "lowest_score":
                        summary[3],
                },

                "history":
                    history_list,

                "batch_id":
                    batch_id,
            }
        ),
        200,
    )
