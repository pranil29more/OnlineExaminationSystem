from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import mysql
from utils.decorators import role_required


result_bp = Blueprint("result", __name__)


# ==========================================================
# GET ALL RESULTS
# ==========================================================

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

    try:

        # --------------------------------------------------
        # Get current user's role
        # --------------------------------------------------

        role_query = """
        SELECT
            role
        FROM users
        WHERE
            user_id = %s
        """

        cur.execute(
            role_query,
            (current_user_id,),
        )

        user = cur.fetchone()

        if not user:
            return jsonify(
                {
                    "message": "User not found"
                }
            ), 404

        role = user[0]

        # ==================================================
        # ADMIN / EXAMINER
        # ==================================================

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
                s.status,
                s.submitted_at
            FROM submissions s
            JOIN users u
                ON s.user_id = u.user_id
            JOIN exams e
                ON s.exam_id = e.exam_id
            WHERE
                s.status != 'In Progress'
            ORDER BY
                s.submitted_at DESC
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
                        "status": result[7],
                        "submitted_at":
                            str(result[8])
                            if result[8]
                            else None,
                    }
                )

        # ==================================================
        # CANDIDATE
        # ==================================================

        else:

            query = """
            SELECT
                s.submission_id,
                s.exam_id,
                e.title,
                s.score,
                e.total_marks,
                e.passing_marks,
                s.status,
                s.submitted_at
            FROM submissions s
            JOIN exams e
                ON s.exam_id = e.exam_id
            WHERE
                s.user_id = %s
                AND s.status != 'In Progress'
            ORDER BY
                s.submitted_at DESC
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
                        "submission_id": result[0],
                        "exam_id": result[1],
                        "exam_title": result[2],
                        "score": result[3],
                        "total_marks": result[4],
                        "passing_marks": result[5],
                        "status": result[6],
                        "submitted_at":
                            str(result[7])
                            if result[7]
                            else None,
                    }
                )

        return jsonify(result_list), 200

    finally:

        cur.close()


# ==========================================================
# GET SINGLE RESULT
# ==========================================================

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

    try:

        # --------------------------------------------------
        # Get current user's role
        # --------------------------------------------------

        role_query = """
        SELECT
            role
        FROM users
        WHERE
            user_id = %s
        """

        cur.execute(
            role_query,
            (current_user_id,),
        )

        user = cur.fetchone()

        if not user:
            return jsonify(
                {
                    "message": "User not found"
                }
            ), 404

        role = user[0]

        # ==================================================
        # FETCH SUBMISSION DETAILS
        # ==================================================

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
                    (
                        s.score * 100.0
                    ) / NULLIF(e.total_marks, 0),
                    2
                ) AS percentage,
                s.status,
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
            """

            cur.execute(
                submission_query,
                (submission_id,),
            )

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
                    (
                        s.score * 100.0
                    ) / NULLIF(e.total_marks, 0),
                    2
                ) AS percentage,
                s.status,
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

            return jsonify(
                {
                    "message": "Result not found"
                }
            ), 404

        exam_id = submission[1]

        # ==========================================================
        # MCQ RESULTS
        #
        # IMPORTANT:
        #
        # questions contains both normal MCQ questions and the
        # question record associated with a coding question.
        #
        # Therefore coding questions are excluded here.
        #
        # LEFT JOIN ensures unanswered MCQs are still returned.
        # ==========================================================

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

        WHERE
            q.exam_id = %s

            AND NOT EXISTS (
                SELECT 1
                FROM coding_questions cq
                WHERE
                    cq.question_id = q.question_id
                    AND cq.exam_id = q.exam_id
            )

        ORDER BY
            q.question_id
        """

        cur.execute(
            answers_query,
            (
                submission_id,
                exam_id,
            ),
        )

        answers = cur.fetchall()

        mcq_results = []

        for answer in answers:

            question_id = answer[0]
            question_text = answer[1]
            answer_text = answer[2]
            is_correct = answer[3]

            is_answered = (
                answer_text is not None
                and str(answer_text).strip() != ""
            )

            mcq_results.append(
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

        # ==========================================================
        # CODING RESULTS
        #
        # IMPORTANT FIX:
        #
        # Start from coding_questions, NOT code_submissions.
        #
        # This guarantees that a coding question is returned even
        # when the candidate never submitted/runs any code.
        #
        # LEFT JOIN brings the latest code submission if one exists.
        #
        # Therefore:
        #
        # Coding question + no code submission
        #       -> is_answered = False
        #       -> status = NOT_SUBMITTED
        #
        # Coding question + code submission
        #       -> evaluation information is returned normally.
        #
        # Multiple code submissions
        #       -> only the latest code_submission_id is returned.
        # ==========================================================

        coding_query = """
        SELECT
            cq.coding_question_id,
            cq.question_text,

            cs.code_submission_id,
            cs.language,
            cs.status,
            cs.passed_tests,
            cs.total_tests,
            cs.score,
            cs.submitted_at

        FROM coding_questions cq

        LEFT JOIN code_submissions cs
            ON cs.coding_question_id =
               cq.coding_question_id

            AND cs.submission_id = %s

            AND cs.code_submission_id = (
                SELECT
                    MAX(cs2.code_submission_id)
                FROM code_submissions cs2
                WHERE
                    cs2.submission_id = %s

                    AND cs2.coding_question_id =
                        cq.coding_question_id
            )

        WHERE
            cq.exam_id = %s

        ORDER BY
            cq.coding_question_id
        """

        cur.execute(
            coding_query,
            (
                submission_id,
                submission_id,
                exam_id,
            ),
        )

        coding_results = cur.fetchall()

        coding_result_list = []

        for coding in coding_results:

            coding_question_id = coding[0]
            question_text = coding[1]

            code_submission_id = coding[2]
            language = coding[3]
            status = coding[4]
            passed_tests = coding[5]
            total_tests = coding[6]
            score = coding[7]
            submitted_at = coding[8]

            # --------------------------------------------------
            # Coding question was never submitted
            # --------------------------------------------------

            if code_submission_id is None:

                coding_result_list.append(
                    {
                        "coding_question_id":
                            coding_question_id,

                        "question_text":
                            question_text,

                        "language":
                            None,

                        "status":
                            "NOT_SUBMITTED",

                        "passed_tests":
                            0,

                        "total_tests":
                            0,

                        "score":
                            0,

                        "submitted_at":
                            None,

                        "is_answered":
                            False,
                    }
                )

            # --------------------------------------------------
            # Coding question has a submission
            # --------------------------------------------------

            else:

                coding_result_list.append(
                    {
                        "coding_question_id":
                            coding_question_id,

                        "question_text":
                            question_text,

                        "language":
                            language,

                        "status":
                            status,

                        "passed_tests":
                            passed_tests
                            if passed_tests is not None
                            else 0,

                        "total_tests":
                            total_tests
                            if total_tests is not None
                            else 0,

                        "score":
                            score
                            if score is not None
                            else 0,

                        "submitted_at":
                            str(submitted_at)
                            if submitted_at
                            else None,

                        "is_answered":
                            True,
                    }
                )

        # ==========================================================
        # RETURN COMPLETE RESULT
        # ==========================================================

        return jsonify(
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

                "status":
                    submission[9],

                "submitted_at":
                    str(submission[10])
                    if submission[10]
                    else None,

                "mcq_results":
                    mcq_results,

                "coding_results":
                    coding_result_list,
            }
        ), 200

    finally:

        cur.close()


# ==========================================================
# GET ALL RESULTS FOR AN EXAM
# ==========================================================

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

    try:

        # ==================================================
        # FETCH EXAM DETAILS
        # ==================================================

        exam_query = """
        SELECT
            exam_id,
            title,
            total_marks,
            passing_marks
        FROM exams
        WHERE
            exam_id = %s
        """

        cur.execute(
            exam_query,
            (exam_id,),
        )

        exam = cur.fetchone()

        if not exam:

            return jsonify(
                {
                    "message": "Exam not found"
                }
            ), 404

        # ==================================================
        # FETCH STUDENT RESULTS
        # ==================================================

        results_query = """
        SELECT
            s.submission_id,
            u.name,
            s.score,
            e.total_marks,
            ROUND(
                (
                    s.score * 100.0
                ) / NULLIF(e.total_marks, 0),
                2
            ) AS percentage,
            CASE
                WHEN
                    s.score >= e.passing_marks
                THEN 'Pass'
                ELSE 'Fail'
            END AS result_status,
            s.status,
            s.submitted_at
        FROM submissions s

        JOIN users u
            ON s.user_id = u.user_id

        JOIN exams e
            ON s.exam_id = e.exam_id

        WHERE
            s.exam_id = %s
            AND s.status != 'In Progress'

        ORDER BY
            s.score DESC,
            s.submitted_at DESC
        """

        cur.execute(
            results_query,
            (exam_id,),
        )

        results = cur.fetchall()

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

                    "total_marks":
                        result[3],

                    "percentage":
                        result[4],

                    "result":
                        result[5],

                    "submission_status":
                        result[6],

                    "submitted_at":
                        str(result[7])
                        if result[7]
                        else None,
                }
            )

        return jsonify(
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
        ), 200

    finally:

        cur.close()


# ==========================================================
# GET CANDIDATE RESULTS
# ==========================================================

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

    try:

        # ==================================================
        # FETCH CANDIDATE
        # ==================================================

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

        WHERE
            u.user_id = %s
        """

        cur.execute(
            candidate_query,
            (user_id,),
        )

        candidate = cur.fetchone()

        if not candidate:

            return jsonify(
                {
                    "message":
                        "Candidate not found"
                }
            ), 404

        # ==================================================
        # CANDIDATE SUMMARY
        # ==================================================

        if batch_id is not None:

            summary_query = """
            SELECT
                COUNT(s.submission_id),

                ROUND(
                    AVG(
                        (
                            s.score * 100.0
                        ) / NULLIF(e.total_marks, 0)
                    ),
                    2
                ),

                ROUND(
                    MAX(
                        (
                            s.score * 100.0
                        ) / NULLIF(e.total_marks, 0)
                    ),
                    2
                ),

                ROUND(
                    MIN(
                        (
                            s.score * 100.0
                        ) / NULLIF(e.total_marks, 0)
                    ),
                    2
                )

            FROM submissions s

            JOIN exams e
                ON s.exam_id = e.exam_id

            WHERE
                s.user_id = %s

                AND s.status != 'In Progress'

                AND EXISTS (
                    SELECT 1
                    FROM assessment_schedules ass
                    WHERE
                        ass.exam_id = e.exam_id
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
                        (
                            s.score * 100.0
                        ) / NULLIF(e.total_marks, 0)
                    ),
                    2
                ),

                ROUND(
                    MAX(
                        (
                            s.score * 100.0
                        ) / NULLIF(e.total_marks, 0)
                    ),
                    2
                ),

                ROUND(
                    MIN(
                        (
                            s.score * 100.0
                        ) / NULLIF(e.total_marks, 0)
                    ),
                    2
                )

            FROM submissions s

            JOIN exams e
                ON s.exam_id = e.exam_id

            WHERE
                s.user_id = %s
                AND s.status != 'In Progress'
            """

            cur.execute(
                summary_query,
                (user_id,),
            )

        summary = cur.fetchone()

        # ==================================================
        # ASSESSMENT HISTORY
        # ==================================================

        if batch_id is not None:

            history_query = """
            SELECT
                s.submission_id,
                e.exam_id,
                e.title,
                s.score,
                e.total_marks,

                ROUND(
                    (
                        s.score * 100.0
                    ) / NULLIF(e.total_marks, 0),
                    2
                ) AS percentage,

                CASE
                    WHEN
                        s.score >= e.passing_marks
                    THEN 'Pass'
                    ELSE 'Fail'
                END AS result_status,

                s.status,
                s.submitted_at

            FROM submissions s

            JOIN exams e
                ON s.exam_id = e.exam_id

            WHERE
                s.user_id = %s

                AND s.status != 'In Progress'

                AND EXISTS (
                    SELECT 1
                    FROM assessment_schedules ass
                    WHERE
                        ass.exam_id = e.exam_id
                        AND ass.batch_id = %s
                )

            ORDER BY
                s.submitted_at DESC
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
                    (
                        s.score * 100.0
                    ) / NULLIF(e.total_marks, 0),
                    2
                ) AS percentage,

                CASE
                    WHEN
                        s.score >= e.passing_marks
                    THEN 'Pass'
                    ELSE 'Fail'
                END AS result_status,

                s.status,
                s.submitted_at

            FROM submissions s

            JOIN exams e
                ON s.exam_id = e.exam_id

            WHERE
                s.user_id = %s
                AND s.status != 'In Progress'

            ORDER BY
                s.submitted_at DESC
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

                    "result":
                        row[6],

                    "submission_status":
                        row[7],

                    "submitted_at":
                        str(row[8])
                        if row[8]
                        else None,
                }
            )

        return jsonify(
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
        ), 200

    finally:

        cur.close()