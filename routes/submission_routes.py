from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import mysql
from utils.decorators import role_required


submission_bp = Blueprint("submission", __name__)


@submission_bp.route("/start-exam", methods=["POST"])
@jwt_required()
@role_required("Candidate")
def start_exam():

    current_user_id = get_jwt_identity()

    cur = mysql.connection.cursor()

    # ==========================================
    # Fetch Candidate Batch
    # ==========================================

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

        cur.close()

        return jsonify(
            {
                "message":
                    "User not found"
            }
        ), 404

    user_batch_id = user[0]

    # ==========================================
    # Read Request Data
    # ==========================================

    data = request.get_json() or {}

    exam_id = data.get("exam_id")

    if not exam_id:

        cur.close()

        return jsonify(
            {
                "message":
                    "Exam ID is required."
            }
        ), 400

    # ==========================================
    # Fetch Exam
    # ==========================================

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

        cur.close()

        return jsonify(
            {
                "message":
                    "Exam not found"
            }
        ), 404

    duration = exam[0]
    exam_type = exam[1]

    # ==========================================
    # Check Latest Submission
    # ==========================================

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

    # ==========================================
    # Existing In-Progress Attempt
    # ==========================================

    if (
        existing_submission
        and existing_submission[1] == "In Progress"
    ):

        cur.close()

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

    # ==========================================
    # Actual Exam - One Attempt Only
    # ==========================================

    if (
        exam_type == "Actual"
        and existing_submission
    ):

        cur.close()

        return jsonify(
            {
                "message":
                    "You have already attempted this assessment."
            }
        ), 400

    # ==========================================
    # Actual Assessment Schedule Validation
    # ==========================================

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

            cur.close()

            return jsonify(
                {
                    "message":
                        "This assessment has not been scheduled for you."
                }
            ), 403

        scheduled_start = schedule[1]
        scheduled_end = schedule[2]

        # ======================================
        # Current India Time
        # ======================================

        time_query = """
        SELECT
            DATE_ADD(
                UTC_TIMESTAMP(),
                INTERVAL 330 MINUTE
            )
        """

        cur.execute(time_query)

        current_time = cur.fetchone()[0]

        # ======================================
        # Before Schedule Start
        # ======================================

        if current_time < scheduled_start:

            cur.close()

            return jsonify(
                {
                    "message":
                        "This assessment has not started yet.",

                    "scheduled_start":
                        str(scheduled_start),
                }
            ), 403

        # ======================================
        # After Schedule End
        # ======================================

        if current_time > scheduled_end:

            cur.close()

            return jsonify(
                {
                    "message":
                        "This assessment has ended.",

                    "scheduled_end":
                        str(scheduled_end),
                }
            ), 403

    # ==========================================
    # Create New Submission
    # ==========================================

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

    cur.close()

    return jsonify(
        {
            "message":
                "Exam started",

            "submission_id":
                submission_id,

            "duration":
                duration,
        }
    ), 200


@submission_bp.route(
    "/exam-session/<int:exam_id>",
    methods=["GET"],
)
@jwt_required()
@role_required("Candidate")
def get_exam_session(exam_id):

    current_user_id = get_jwt_identity()

    cur = mysql.connection.cursor()

    # ==========================================
    # Fetch Exam Type
    # ==========================================

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

        cur.close()

        return jsonify(
            {
                "message":
                    "Exam not found"
            }
        ), 404

    exam_type = exam[0]

    # ==========================================
    # Fetch Latest Submission
    # ==========================================

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

    # ==========================================
    # Never Attempted
    # ==========================================

    if not session:

        cur.close()

        return jsonify(
            {
                "status":
                    "Not Started",

                "exam_type":
                    exam_type,
            }
        ), 200

    # ==========================================
    # Practice Exam Already Completed
    # ==========================================

    if (
        exam_type == "Practice"
        and session[3] in [
            "Completed",
            "Auto Submitted",
        ]
    ):

        cur.close()

        return jsonify(
            {
                "status":
                    "Practice Completed",

                "exam_type":
                    exam_type,

                "can_attempt_again":
                    True,
            }
        ), 200

    # ==========================================
    # Completed Actual Exam
    # ==========================================

    if (
        exam_type == "Actual"
        and session[3] in [
            "Completed",
            "Auto Submitted",
        ]
    ):

        cur.close()

        return jsonify(
            {
                "status":
                    session[3],

                "exam_type":
                    exam_type,

                "can_attempt_again":
                    False,
            }
        ), 200

    # ==========================================
    # Fetch Saved Answers
    # ==========================================

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

    cur.close()

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

            "answers":
                answer_list,
        }
    ), 200


@submission_bp.route(
    "/save-answer",
    methods=["POST"],
)
@jwt_required()
@role_required("Candidate")
def save_answer():

    current_user_id = get_jwt_identity()

    cur = mysql.connection.cursor()

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

    # ==========================================
    # Validate Request
    # ==========================================

    if (
        not submission_id
        or not question_id
    ):

        cur.close()

        return jsonify(
            {
                "message":
                    "Submission ID and question ID are required."
            }
        ), 400

    # ==========================================
    # Verify Active Submission
    # ==========================================

    submission_query = """
    SELECT
        s.submission_id,
        s.start_time,
        e.duration
    FROM submissions s
    JOIN exams e
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

        cur.close()

        return jsonify(
            {
                "message":
                    "Invalid submission."
            }
        ), 404

    # ==========================================
    # Server-Side Deadline Validation
    # ==========================================

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

        cur.close()

        return jsonify(
            {
                "message":
                    "The examination time has expired. Your answer cannot be saved."
            }
        ), 403

    # ==========================================
    # Verify Question Belongs To Exam
    # ==========================================

    question_query = """
    SELECT
        q.question_id
    FROM questions q
    JOIN submissions s
        ON q.exam_id = s.exam_id
    WHERE
        q.question_id = %s
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

        cur.close()

        return jsonify(
            {
                "message":
                    "Question does not belong to this exam."
            }
        ), 400

    # ==========================================
    # Verify Submitted Option
    # ==========================================

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

        cur.close()

        return jsonify(
            {
                "message":
                    "Invalid answer option."
            }
        ), 400

    # ==========================================
    # Check Existing Answer
    # ==========================================

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

    # ==========================================
    # Update Existing Answer
    # ==========================================

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

    # ==========================================
    # Insert New Answer
    # ==========================================

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

    cur.close()

    return jsonify(
        {
            "message":
                "Answer saved."
        }
    ), 200


@submission_bp.route(
    "/submit-exam",
    methods=["POST"],
)
@jwt_required()
@role_required("Candidate")
def submit_exam():

    current_user_id = get_jwt_identity()

    cur = mysql.connection.cursor()

    # ==========================================
    # Read Request
    # ==========================================

    data = request.get_json() or {}

    exam_id = data.get(
        "exam_id"
    )

    if not exam_id:

        cur.close()

        return jsonify(
            {
                "message":
                    "Exam ID is required."
            }
        ), 400

    # ==========================================
    # Fetch Active Submission
    # ==========================================

    submission_query = """
    SELECT
        submission_id,
        start_time,
        e.duration
    FROM submissions s
    JOIN exams e
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

        cur.close()

        return jsonify(
            {
                "message":
                    "No active exam found."
            }
        ), 404

    submission_id = submission[0]

    # ==========================================
    # Fetch Saved Answers
    # ==========================================

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

    total_score = 0

    # ==========================================
    # Evaluate Answers
    # ==========================================

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

            is_correct = (
                answer_text.strip().lower()
                ==
                correct_answer[0]
                .strip()
                .lower()
            )

        # ======================================
        # Update Answer Correctness
        # ======================================

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
                is_correct,
                answer_id,
            ),
        )

        # ======================================
        # Add Marks
        # ======================================

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

            if marks:

                total_score += marks[0]

    # ==========================================
    # Complete Submission
    # ==========================================

    update_submission_query = """
    UPDATE submissions
    SET
        score = %s,
        status = 'Completed',
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
            submission_id,
        ),
    )

    mysql.connection.commit()

    cur.close()

    return jsonify(
        {
            "message":
                "Exam submitted successfully",

            "submission_id":
                submission_id,

            "score":
                total_score,
        }
    ), 200
