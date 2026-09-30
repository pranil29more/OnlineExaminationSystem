from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import mysql
from utils.decorators import role_required


submission_bp = Blueprint("submission", __name__)


# ==========================================================
# Evaluate And Finalize Submission
# ==========================================================

def finalize_submission(cur, submission_id, final_status="Completed"):

    # ======================================================
    # Get Exam ID
    # ======================================================

    exam_query = """
    SELECT
        exam_id
    FROM submissions
    WHERE
        submission_id = %s
    """

    cur.execute(
        exam_query,
        (submission_id,),
    )

    submission = cur.fetchone()

    if not submission:
        return 0

    exam_id = submission[0]

    # ======================================================
    # MCQ SCORE
    # ======================================================

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
        (submission_id,),
    )

    saved_answers = cur.fetchall()

    mcq_score = 0

    # ======================================================
    # Evaluate MCQ Answers
    # ======================================================

    for answer in saved_answers:

        answer_id = answer[0]
        question_id = answer[1]
        answer_text = answer[2]

        correct_query = """
        SELECT
            option_text
        FROM options
        WHERE
            question_id = %s
            AND is_correct = 1
        LIMIT 1
        """

        cur.execute(
            correct_query,
            (question_id,),
        )

        correct_answer = cur.fetchone()

        is_correct = False

        if (
            correct_answer
            and answer_text is not None
        ):

            submitted_answer = str(
                answer_text
            ).strip().lower()

            correct_option = str(
                correct_answer[0]
            ).strip().lower()

            is_correct = (
                submitted_answer
                == correct_option
            )

        update_answer_query = """
        UPDATE answers
        SET
            is_correct = %s
        WHERE
            answer_id = %s
        """

        cur.execute(
            update_answer_query,
            (
                1 if is_correct else 0,
                answer_id,
            ),
        )

        if is_correct:

            marks_query = """
            SELECT
                marks
            FROM questions
            WHERE question_id = %s
            """

            cur.execute(
                marks_query,
                (question_id,),
            )

            marks = cur.fetchone()

            if (
                marks
                and marks[0] is not None
            ):

                mcq_score += marks[0]

    # ======================================================
    # CODING SCORE
    # ======================================================
    #
    # Rules:
    #
    # 1. Only the latest code submission for each coding
    #    question is considered.
    #
    # 2. PASSED = full coding-question marks.
    #
    # 3. FAILED = zero.
    #
    # 4. No partial marking.
    #
    # 5. Missing coding submission = zero.
    #
    # ======================================================

    coding_score = 0

    coding_query = """
    SELECT
        cs.code_submission_id,
        cs.coding_question_id,
        cs.status,
        cs.score,
        cq.marks
    FROM code_submissions cs
    INNER JOIN coding_questions cq
        ON cs.coding_question_id =
           cq.coding_question_id
    WHERE
        cs.submission_id = %s
        AND cs.code_submission_id = (
            SELECT
                MAX(cs2.code_submission_id)
            FROM code_submissions cs2
            WHERE
                cs2.submission_id = cs.submission_id
                AND cs2.coding_question_id =
                    cs.coding_question_id
        )
    ORDER BY
        cs.coding_question_id ASC
    """

    cur.execute(
        coding_query,
        (submission_id,),
    )

    coding_submissions = cur.fetchall()

    for coding in coding_submissions:

        coding_status = coding[2]
        stored_score = coding[3]
        coding_marks = coding[4]

        # --------------------------------------------------
        # NO PARTIAL MARKING
        #
        # A coding question receives marks only when the
        # complete test suite passed.
        #
        # The stored score is deliberately ignored when the
        # status is not PASSED.
        # --------------------------------------------------

        if coding_status == "PASSED":

            if coding_marks is not None:

                coding_score += coding_marks

            elif stored_score is not None:

                coding_score += stored_score

    # ======================================================
    # FINAL SCORE
    # ======================================================

    total_score = (
        mcq_score
        + coding_score
    )

    # ======================================================
    # Finalize Submission
    # ======================================================

    update_submission_query = """
    UPDATE submissions
    SET
        score = %s,
        status = %s,
        submitted_at = CONVERT_TZ(
            UTC_TIMESTAMP(),
            '+00:00',
            '+05:30'
        )
    WHERE
        submission_id = %s
        AND status = 'In Progress'
    """

    cur.execute(
        update_submission_query,
        (
            total_score,
            final_status,
            submission_id,
        ),
    )

    return total_score


# ==========================================================
# Start Exam
# ==========================================================

@submission_bp.route(
    "/start-exam",
    methods=["POST"],
)
@jwt_required()
@role_required("Candidate")
def start_exam():

    current_user_id = get_jwt_identity()

    cur = mysql.connection.cursor()

    try:

        # ==================================================
        # Fetch Candidate Batch
        # ==================================================

        user_query = """
        SELECT
            batch_id
        FROM users
        WHERE user_id = %s
        """

        cur.execute(
            user_query,
            (current_user_id,),
        )

        user = cur.fetchone()

        if not user:

            return jsonify(
                {
                    "message":
                        "User not found"
                }
            ), 404

        user_batch_id = user[0]

        # ==================================================
        # Read Request Data
        # ==================================================

        data = request.get_json() or {}

        exam_id = data.get("exam_id")

        if not exam_id:

            return jsonify(
                {
                    "message":
                        "Exam ID is required."
                }
            ), 400

        # ==================================================
        # Fetch Exam
        # ==================================================

        exam_query = """
        SELECT
            duration,
            exam_type
        FROM exams
        WHERE exam_id = %s
        """

        cur.execute(
            exam_query,
            (exam_id,),
        )

        exam = cur.fetchone()

        if not exam:

            return jsonify(
                {
                    "message":
                        "Exam not found"
                }
            ), 404

        duration = exam[0]
        exam_type = exam[1]

        # ==================================================
        # Check Latest Submission
        # ==================================================

        submission_query = """
        SELECT
            submission_id,
            status
        FROM submissions
        WHERE
            user_id = %s
            AND exam_id = %s
        ORDER BY
            submission_id DESC
        LIMIT 1
        """

        cur.execute(
            submission_query,
            (
                current_user_id,
                exam_id,
            ),
        )

        existing_submission = cur.fetchone()

        # ==================================================
        # Existing In-Progress Attempt
        # ==================================================

        if (
            existing_submission
            and existing_submission[1] == "In Progress"
        ):

            return jsonify(
                {
                    "message":
                        "Exam is already in progress.",

                    "submission_id":
                        existing_submission[0],

                    "duration":
                        duration,
                }
            ), 200

        # ==================================================
        # Actual Exam - One Attempt Only
        # ==================================================

        if (
            exam_type == "Actual"
            and existing_submission
        ):

            return jsonify(
                {
                    "message":
                        "You have already attempted this assessment."
                }
            ), 400

        # ==================================================
        # Actual Assessment Schedule Validation
        # ==================================================

        if exam_type == "Actual":

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
            ORDER BY
                scheduled_start DESC
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

                return jsonify(
                    {
                        "message":
                            "This assessment has not been scheduled for you."
                    }
                ), 403

            scheduled_start = schedule[1]
            scheduled_end = schedule[2]

            # ==================================================
            # Current India Time
            # ==================================================

            time_query = """
            SELECT
                DATE_ADD(
                    UTC_TIMESTAMP(),
                    INTERVAL 330 MINUTE
                )
            """

            cur.execute(time_query)

            current_time = cur.fetchone()[0]

            # ==================================================
            # Before Schedule Start
            # ==================================================

            if current_time < scheduled_start:

                return jsonify(
                    {
                        "message":
                            "This assessment has not started yet.",

                        "scheduled_start":
                            str(scheduled_start),
                    }
                ), 403

            # ==================================================
            # After Schedule End
            # ==================================================

            if current_time > scheduled_end:

                return jsonify(
                    {
                        "message":
                            "This assessment has ended.",

                        "scheduled_end":
                            str(scheduled_end),
                    }
                ), 403

        # ==================================================
        # Create New Submission
        # ==================================================

        insert_query = """
        INSERT INTO submissions
        (
            user_id,
            exam_id,
            score,
            tab_switch_count,
            start_time,
            status
        )
        VALUES
        (
            %s,
            %s,
            0,
            0,
            CONVERT_TZ(
                UTC_TIMESTAMP(),
                '+00:00',
                '+05:30'
            ),
            'In Progress'
        )
        """

        cur.execute(
            insert_query,
            (
                current_user_id,
                exam_id,
            ),
        )

        mysql.connection.commit()

        submission_id = cur.lastrowid

        return jsonify(
            {
                "message":
                    "Exam started",

                "submission_id":
                    submission_id,

                "duration":
                    duration,

                "tab_switch_count":
                    0,
            }
        ), 200

    except Exception as error:

        mysql.connection.rollback()

        return jsonify(
            {
                "message":
                    str(error)
            }
        ), 500

    finally:

        cur.close()


# ==========================================================
# Get Exam Session
# ==========================================================

@submission_bp.route(
    "/exam-session/<int:exam_id>",
    methods=["GET"],
)
@jwt_required()
@role_required("Candidate")
def get_exam_session(exam_id):

    current_user_id = get_jwt_identity()

    cur = mysql.connection.cursor()

    try:

        # ==================================================
        # Fetch Exam Type
        # ==================================================

        exam_query = """
        SELECT
            exam_type
        FROM exams
        WHERE exam_id = %s
        """

        cur.execute(
            exam_query,
            (exam_id,),
        )

        exam = cur.fetchone()

        if not exam:

            return jsonify(
                {
                    "message":
                        "Exam not found"
                }
            ), 404

        exam_type = exam[0]

        # ==================================================
        # Fetch Latest Submission
        # ==================================================

        session_query = """
        SELECT
            s.submission_id,
            s.start_time,
            e.duration,
            s.status,
            s.tab_switch_count
        FROM submissions s
        INNER JOIN exams e
            ON s.exam_id = e.exam_id
        WHERE
            s.user_id = %s
            AND s.exam_id = %s
        ORDER BY
            s.submission_id DESC
        LIMIT 1
        """

        cur.execute(
            session_query,
            (
                current_user_id,
                exam_id,
            ),
        )

        session = cur.fetchone()

        # ==================================================
        # Never Attempted
        # ==================================================

        if not session:

            return jsonify(
                {
                    "status":
                        "Not Started",

                    "exam_type":
                        exam_type,

                    "tab_switch_count":
                        0,
                }
            ), 200

        # ==================================================
        # Practice Exam Already Completed
        # ==================================================

        if (
            exam_type == "Practice"
            and session[3] in [
                "Completed",
                "Auto Submitted",
                "Violation",
            ]
        ):

            return jsonify(
                {
                    "status":
                        "Practice Completed",

                    "exam_type":
                        exam_type,

                    "can_attempt_again":
                        True,

                    "tab_switch_count":
                        session[4] or 0,
                }
            ), 200

        # ==================================================
        # Completed Actual Exam
        # ==================================================

        if (
            exam_type == "Actual"
            and session[3] in [
                "Completed",
                "Auto Submitted",
                "Violation",
            ]
        ):

            return jsonify(
                {
                    "status":
                        session[3],

                    "exam_type":
                        exam_type,

                    "can_attempt_again":
                        False,

                    "tab_switch_count":
                        session[4] or 0,
                }
            ), 200

        # ==================================================
        # Unknown Session State
        # ==================================================

        if session[3] != "In Progress":

            return jsonify(
                {
                    "status":
                        session[3],

                    "exam_type":
                        exam_type,

                    "tab_switch_count":
                        session[4] or 0,
                }
            ), 200

        # ==================================================
        # Fetch Saved MCQ Answers
        # ==================================================

        answers_query = """
        SELECT
            question_id,
            answer_text
        FROM answers
        WHERE submission_id = %s
        """

        cur.execute(
            answers_query,
            (session[0],),
        )

        saved_answers = cur.fetchall()

        answer_list = []

        for answer in saved_answers:

            answer_list.append(
                {
                    "question_id":
                        answer[0],

                    "answer_text":
                        answer[1],
                }
            )

        # ==================================================
        # Fetch Saved Coding Submissions
        #
        # Only the latest code submission for each coding
        # question is returned.
        #
        # Source code is returned so the candidate can
        # resume an in-progress exam.
        # ==================================================

        coding_query = """
        SELECT
            cs.code_submission_id,
            cs.coding_question_id,
            cs.source_code,
            cs.status,
            cs.score
        FROM code_submissions cs
        WHERE
            cs.submission_id = %s
            AND cs.code_submission_id = (
                SELECT
                    MAX(cs2.code_submission_id)
                FROM code_submissions cs2
                WHERE
                    cs2.submission_id = cs.submission_id
                    AND cs2.coding_question_id =
                        cs.coding_question_id
            )
        ORDER BY
            cs.coding_question_id ASC
        """

        cur.execute(
            coding_query,
            (session[0],),
        )

        saved_coding_submissions = (
            cur.fetchall()
        )

        coding_submission_list = []

        for coding in saved_coding_submissions:

            coding_submission_list.append(
                {
                    "code_submission_id":
                        coding[0],

                    "coding_question_id":
                        coding[1],

                    "source_code":
                        coding[2],

                    "status":
                        coding[3],

                    "score":
                        coding[4],
                }
            )

        return jsonify(
            {
                "submission_id":
                    session[0],

                "start_time":
                    str(session[1]),

                "duration":
                    session[2],

                "status":
                    session[3],

                "exam_type":
                    exam_type,

                "tab_switch_count":
                    session[4] or 0,

                "answers":
                    answer_list,

                "coding_submissions":
                    coding_submission_list,
            }
        ), 200

    finally:

        cur.close()


# ==========================================================
# Save MCQ Answer
# ==========================================================

@submission_bp.route(
    "/save-answer",
    methods=["POST"],
)
@jwt_required()
@role_required("Candidate")
def save_answer():

    current_user_id = get_jwt_identity()

    cur = mysql.connection.cursor()

    try:

        data = request.get_json() or {}

        submission_id = data.get(
            "submission_id"
        )

        question_id = data.get(
            "question_id"
        )

        answer_text = data.get(
            "answer_text"
        )

        # ==================================================
        # Validate Request
        # ==================================================

        if (
            not submission_id
            or not question_id
        ):

            return jsonify(
                {
                    "message":
                        "Submission ID and question ID are required."
                }
            ), 400

        # ==================================================
        # Verify Active Submission
        # ==================================================

        submission_query = """
        SELECT
            s.submission_id,
            s.start_time,
            e.duration
        FROM submissions s
        INNER JOIN exams e
            ON s.exam_id = e.exam_id
        WHERE
            s.submission_id = %s
            AND s.user_id = %s
            AND s.status = 'In Progress'
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
                    "message":
                        "Invalid submission."
                }
            ), 404

        # ==================================================
        # Server-Side Deadline Validation
        # ==================================================

        deadline_query = """
        SELECT
            CASE
                WHEN
                    DATE_ADD(
                        %s,
                        INTERVAL %s MINUTE
                    )
                    <=
                    DATE_ADD(
                        UTC_TIMESTAMP(),
                        INTERVAL 330 MINUTE
                    )
                THEN 1
                ELSE 0
            END
        """

        cur.execute(
            deadline_query,
            (
                submission[1],
                submission[2],
            ),
        )

        deadline_result = cur.fetchone()

        is_expired = (
            deadline_result
            and int(deadline_result[0]) == 1
        )

        if is_expired:

            return jsonify(
                {
                    "message":
                        "The examination time has expired. Your answer cannot be saved."
                }
            ), 403

        # ==================================================
        # Verify Question Belongs To Exam
        #
        # MCQ questions only.
        # ==================================================

        question_query = """
        SELECT
            q.question_id
        FROM questions q
        INNER JOIN submissions s
            ON q.exam_id = s.exam_id
        WHERE
            q.question_id = %s
            AND q.type = 'MCQ'
            AND s.submission_id = %s
        """

        cur.execute(
            question_query,
            (
                question_id,
                submission_id,
            ),
        )

        question = cur.fetchone()

        if not question:

            return jsonify(
                {
                    "message":
                        "Question does not belong to this exam."
                }
            ), 400

        # ==================================================
        # Verify Submitted Option
        # ==================================================

        option_query = """
        SELECT
            option_id
        FROM options
        WHERE
            question_id = %s
            AND option_text = %s
        """

        cur.execute(
            option_query,
            (
                question_id,
                answer_text,
            ),
        )

        option = cur.fetchone()

        if not option:

            return jsonify(
                {
                    "message":
                        "Invalid answer option."
                }
            ), 400

        # ==================================================
        # Check Existing Answer
        # ==================================================

        check_query = """
        SELECT
            answer_id
        FROM answers
        WHERE
            submission_id = %s
            AND question_id = %s
        """

        cur.execute(
            check_query,
            (
                submission_id,
                question_id,
            ),
        )

        existing = cur.fetchone()

        # ==================================================
        # Update Existing Answer
        # ==================================================

        if existing:

            update_query = """
            UPDATE answers
            SET
                answer_text = %s,
                is_correct = 0
            WHERE
                submission_id = %s
                AND question_id = %s
            """

            cur.execute(
                update_query,
                (
                    answer_text,
                    submission_id,
                    question_id,
                ),
            )

        # ==================================================
        # Insert New Answer
        # ==================================================

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
                    answer_text,
                ),
            )

        mysql.connection.commit()

        return jsonify(
            {
                "message":
                    "Answer saved."
            }
        ), 200

    except Exception as error:

        mysql.connection.rollback()

        return jsonify(
            {
                "message":
                    str(error)
            }
        ), 500

    finally:

        cur.close()


# ==========================================================
# Submit Exam
# ==========================================================

@submission_bp.route(
    "/submit-exam",
    methods=["POST"],
)
@jwt_required()
@role_required("Candidate")
def submit_exam():

    current_user_id = get_jwt_identity()

    cur = mysql.connection.cursor()

    try:

        # ==================================================
        # Read Request
        # ==================================================

        data = request.get_json() or {}

        exam_id = data.get(
            "exam_id"
        )

        if not exam_id:

            return jsonify(
                {
                    "message":
                        "Exam ID is required."
                }
            ), 400

        # ==================================================
        # Fetch Active Submission
        # ==================================================

        submission_query = """
        SELECT
            s.submission_id,
            s.start_time,
            e.duration
        FROM submissions s
        INNER JOIN exams e
            ON s.exam_id = e.exam_id
        WHERE
            s.user_id = %s
            AND s.exam_id = %s
            AND s.status = 'In Progress'
        ORDER BY
            s.submission_id DESC
        LIMIT 1
        """

        cur.execute(
            submission_query,
            (
                current_user_id,
                exam_id,
            ),
        )

        submission = cur.fetchone()

        if not submission:

            return jsonify(
                {
                    "message":
                        "No active exam found."
                }
            ), 404

        submission_id = submission[0]

        # ==================================================
        # Server-Side Deadline Validation
        #
        # The candidate may manually submit while the timer
        # is running. Once the server-side duration has
        # expired, the submission is auto-finalized.
        # ==================================================

        deadline_query = """
        SELECT
            CASE
                WHEN
                    DATE_ADD(
                        %s,
                        INTERVAL %s MINUTE
                    )
                    <=
                    DATE_ADD(
                        UTC_TIMESTAMP(),
                        INTERVAL 330 MINUTE
                    )
                THEN 1
                ELSE 0
            END
        """

        cur.execute(
            deadline_query,
            (
                submission[1],
                submission[2],
            ),
        )

        deadline_result = cur.fetchone()

        is_expired = (
            deadline_result
            and int(deadline_result[0]) == 1
        )

        if is_expired:

            total_score = finalize_submission(
                cur,
                submission_id,
                "Auto Submitted",
            )

            mysql.connection.commit()

            return jsonify(
                {
                    "message":
                        "Examination time has expired. The exam was automatically submitted.",

                    "submission_id":
                        submission_id,

                    "score":
                        total_score,

                    "auto_submitted":
                        True,
                }
            ), 200

        # ==================================================
        # Final Submit
        # ==================================================

        total_score = finalize_submission(
            cur,
            submission_id,
            "Completed",
        )

        mysql.connection.commit()

        return jsonify(
            {
                "message":
                    "Exam submitted successfully",

                "submission_id":
                    submission_id,

                "score":
                    total_score,

                "auto_submitted":
                    False,
            }
        ), 200

    except Exception as error:

        mysql.connection.rollback()

        return jsonify(
            {
                "message":
                    str(error)
            }
        ), 500

    finally:

        cur.close()


# ==========================================================
# Record Tab Switch
# ==========================================================

@submission_bp.route(
    "/tab-switch",
    methods=["POST"],
)
@jwt_required()
@role_required("Candidate")
def record_tab_switch():

    current_user_id = get_jwt_identity()

    cur = mysql.connection.cursor()

    try:

        # ==================================================
        # Read Optional Submission ID
        # ==================================================

        data = request.get_json() or {}

        requested_submission_id = data.get(
            "submission_id"
        )

        # ==================================================
        # Find Exact Active Examination
        # ==================================================

        if requested_submission_id:

            submission_query = """
            SELECT
                submission_id,
                tab_switch_count
            FROM submissions
            WHERE
                submission_id = %s
                AND user_id = %s
                AND status = 'In Progress'
            LIMIT 1
            """

            cur.execute(
                submission_query,
                (
                    requested_submission_id,
                    current_user_id,
                ),
            )

        else:

            submission_query = """
            SELECT
                submission_id,
                tab_switch_count
            FROM submissions
            WHERE
                user_id = %s
                AND status = 'In Progress'
            ORDER BY
                submission_id DESC
            LIMIT 1
            """

            cur.execute(
                submission_query,
                (current_user_id,),
            )

        submission = cur.fetchone()

        if not submission:

            return jsonify(
                {
                    "message":
                        "No active examination found."
                }
            ), 404

        submission_id = submission[0]

        current_count = (
            submission[1]
            if submission[1] is not None
            else 0
        )

        # ==================================================
        # Maximum Violation Protection
        # ==================================================

        if current_count >= 3:

            return jsonify(
                {
                    "message":
                        "Examination already terminated due to tab-switch violation.",

                    "submission_id":
                        submission_id,

                    "tab_switch_count":
                        current_count,

                    "violation":
                        True,

                    "auto_submitted":
                        True,
                }
            ), 200

        # ==================================================
        # Increment Tab Switch Count
        # ==================================================

        update_query = """
        UPDATE submissions
        SET
            tab_switch_count =
                COALESCE(tab_switch_count, 0) + 1
        WHERE
            submission_id = %s
            AND user_id = %s
            AND status = 'In Progress'
        """

        cur.execute(
            update_query,
            (
                submission_id,
                current_user_id,
            ),
        )

        # ==================================================
        # Fetch Updated Count
        # ==================================================

        count_query = """
        SELECT
            tab_switch_count
        FROM submissions
        WHERE
            submission_id = %s
        """

        cur.execute(
            count_query,
            (submission_id,),
        )

        result = cur.fetchone()

        if not result:

            mysql.connection.rollback()

            return jsonify(
                {
                    "message":
                        "Unable to record tab switch."
                }
            ), 500

        tab_switch_count = (
            result[0]
            if result[0] is not None
            else 0
        )

        # ==================================================
        # Third Switch = Auto Submit
        #
        # finalize_submission includes:
        #
        # MCQ marks
        # +
        # latest coding submission
        # +
        # no partial marking
        # ==================================================

        if tab_switch_count >= 3:

            total_score = finalize_submission(
                cur,
                submission_id,
                "Auto Submitted",
            )

            mysql.connection.commit()

            return jsonify(
                {
                    "message":
                        "Examination automatically submitted due to tab-switch violation.",

                    "submission_id":
                        submission_id,

                    "tab_switch_count":
                        tab_switch_count,

                    "warning":
                        "Final tab-switch violation reached.",

                    "violation":
                        True,

                    "auto_submitted":
                        True,

                    "score":
                        total_score,
                }
            ), 200

        # ==================================================
        # First / Second Switch
        # ==================================================

        mysql.connection.commit()

        return jsonify(
            {
                "message":
                    "Tab switch recorded.",

                "submission_id":
                    submission_id,

                "tab_switch_count":
                    tab_switch_count,

                "warning":
                    True,

                "violation":
                    False,

                "auto_submitted":
                    False,
            }
        ), 200

    except Exception as error:

        mysql.connection.rollback()

        return jsonify(
            {
                "message":
                    str(error)
            }
        ), 500

    finally:

        cur.close()