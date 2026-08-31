from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import mysql
from utils.decorators import role_required


schedule_bp = Blueprint("schedule", __name__)


@schedule_bp.route(
    "/schedule-assessment",
    methods=["POST"],
)
@jwt_required()
@role_required("Admin", "Examiner")
def schedule_assessment():

    from flask_jwt_extended import get_jwt_identity

    current_user_id = get_jwt_identity()

    cur = mysql.connection.cursor()

    data = request.get_json(
        silent=True
    ) or {}

    exam_id = data.get("exam_id")
    batch_id = data.get("batch_id")
    candidate_id = data.get("candidate_id")

    scheduled_start = data.get(
        "scheduled_start"
    )

    scheduled_end = data.get(
        "scheduled_end"
    )

    if (
        not exam_id
        or not scheduled_start
        or not scheduled_end
    ):

        cur.close()

        return jsonify(
            {
                "message":
                "Exam, scheduled start and scheduled end are required."
            }
        ), 400

    if not batch_id and not candidate_id:

        cur.close()

        return jsonify(
            {
                "message":
                "Select either a batch or a candidate."
            }
        ), 400

    if batch_id and candidate_id:

        cur.close()

        return jsonify(
            {
                "message":
                "Assessment can be scheduled for either a batch or a candidate, not both."
            }
        ), 400

    time_query = """
    SELECT
        CASE
            WHEN %s >= %s
                THEN 1
            ELSE 0
        END
    """

    cur.execute(
        time_query,
        (
            scheduled_start,
            scheduled_end,
        ),
    )

    invalid_time = cur.fetchone()[0]

    if invalid_time:

        cur.close()

        return jsonify(
            {
                "message":
                "Scheduled end must be after the scheduled start."
            }
        ), 400

    exam_query = """
    SELECT
        exam_id
    FROM exams
    WHERE
        exam_id = %s
        AND exam_type = 'Actual'
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
                "Only Actual assessments can be scheduled."
            }
        ), 400

    if batch_id:

        batch_query = """
        SELECT
            batch_id
        FROM batches
        WHERE batch_id = %s
        """

        cur.execute(
            batch_query,
            (batch_id,),
        )

        batch = cur.fetchone()

        if not batch:

            cur.close()

            return jsonify(
                {
                    "message":
                    "Selected batch does not exist."
                }
            ), 404

    if candidate_id:

        candidate_query = """
        SELECT
            user_id
        FROM users
        WHERE
            user_id = %s
            AND role = 'Candidate'
            AND is_active = 1
        """

        cur.execute(
            candidate_query,
            (candidate_id,),
        )

        candidate = cur.fetchone()

        if not candidate:

            cur.close()

            return jsonify(
                {
                    "message":
                    "Selected candidate does not exist or is inactive."
                }
            ), 404

    insert_query = """
    INSERT INTO assessment_schedules
    (
        exam_id,
        batch_id,
        candidate_id,
        scheduled_start,
        scheduled_end,
        scheduled_by
    )
    VALUES
    (
        %s,
        %s,
        %s,
        %s,
        %s,
        %s
    )
    """

    cur.execute(
        insert_query,
        (
            exam_id,
            batch_id,
            candidate_id,
            scheduled_start,
            scheduled_end,
            current_user_id,
        ),
    )

    mysql.connection.commit()

    schedule_id = cur.lastrowid

    cur.close()

    return jsonify(
        {
            "message":
            "Assessment scheduled successfully.",

            "schedule_id":
            schedule_id,
        }
    ), 201


@schedule_bp.route(
    "/assessment-schedules",
    methods=["GET"],
)
@jwt_required()
@role_required("Admin", "Examiner")
def assessment_schedules():

    cur = mysql.connection.cursor()

    schedule_query = """
    SELECT
        s.schedule_id,
        s.exam_id,
        e.title,

        s.batch_id,
        b.batch_name,

        s.candidate_id,
        c.name AS candidate_name,
        c.email AS candidate_email,

        s.scheduled_start,
        s.scheduled_end,

        s.scheduled_by,
        scheduler.name AS scheduled_by_name,

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
        END AS schedule_status

    FROM assessment_schedules s

    JOIN exams e
        ON s.exam_id = e.exam_id

    LEFT JOIN batches b
        ON s.batch_id = b.batch_id

    LEFT JOIN users c
        ON s.candidate_id = c.user_id

    LEFT JOIN users scheduler
        ON s.scheduled_by = scheduler.user_id

    ORDER BY
        s.scheduled_start DESC
    """

    cur.execute(
        schedule_query
    )

    schedules = cur.fetchall()

    cur.close()

    schedule_list = []

    for schedule in schedules:

        assignment_type = (
            "Batch"
            if schedule[3] is not None
            else "Candidate"
        )

        if assignment_type == "Batch":
            assigned_to = schedule[4]
        else:
            assigned_to = schedule[6]

        schedule_list.append(
            {
                "schedule_id":
                schedule[0],

                "exam_id":
                schedule[1],

                "exam_title":
                schedule[2],

                "assignment_type":
                assignment_type,

                "assigned_to":
                assigned_to,

                "batch_id":
                schedule[3],

                "batch_name":
                schedule[4],

                "candidate_id":
                schedule[5],

                "candidate_name":
                schedule[6],

                "candidate_email":
                schedule[7],

                "scheduled_start":
                str(schedule[8]),

                "scheduled_end":
                str(schedule[9]),

                "scheduled_by":
                schedule[10],

                "scheduled_by_name":
                schedule[11],

                "status":
                schedule[12],
            }
        )

    return jsonify(
        {
            "schedules":
            schedule_list
        }
    ), 200


@schedule_bp.route(
    "/update-assessment-schedule/<int:schedule_id>",
    methods=["PUT"],
)
@jwt_required()
@role_required("Admin", "Examiner")
def update_assessment_schedule(
    schedule_id
):

    cur = mysql.connection.cursor()

    schedule_query = """
    SELECT
        schedule_id,
        scheduled_start,
        scheduled_end
    FROM assessment_schedules
    WHERE schedule_id = %s
    """

    cur.execute(
        schedule_query,
        (schedule_id,),
    )

    schedule = cur.fetchone()

    if not schedule:

        cur.close()

        return jsonify(
            {
                "message":
                "Assessment schedule not found."
            }
        ), 404

    status_query = """
    SELECT
        CASE
            WHEN CONVERT_TZ(
                UTC_TIMESTAMP(),
                '+00:00',
                '+05:30'
            ) < scheduled_start
                THEN 'Upcoming'

            WHEN CONVERT_TZ(
                UTC_TIMESTAMP(),
                '+00:00',
                '+05:30'
            ) BETWEEN
                scheduled_start
                AND scheduled_end
                THEN 'Available'

            ELSE 'Ended'
        END AS schedule_status

    FROM assessment_schedules

    WHERE schedule_id = %s
    """

    cur.execute(
        status_query,
        (schedule_id,),
    )

    schedule_status = cur.fetchone()[0]

    if schedule_status != "Upcoming":

        cur.close()

        return jsonify(
            {
                "message":
                "Only upcoming assessment schedules can be updated."
            }
        ), 400

    data = request.get_json(
        silent=True
    ) or {}

    batch_id = data.get(
        "batch_id"
    )

    candidate_id = data.get(
        "candidate_id"
    )

    scheduled_start = data.get(
        "scheduled_start"
    )

    scheduled_end = data.get(
        "scheduled_end"
    )

    if (
        not scheduled_start
        or not scheduled_end
    ):

        cur.close()

        return jsonify(
            {
                "message":
                "Scheduled start and scheduled end are required."
            }
        ), 400

    if not batch_id and not candidate_id:

        cur.close()

        return jsonify(
            {
                "message":
                "Select either a batch or a candidate."
            }
        ), 400

    if batch_id and candidate_id:

        cur.close()

        return jsonify(
            {
                "message":
                "Assessment can be assigned to either a batch or a candidate, not both."
            }
        ), 400

    time_query = """
    SELECT
        CASE
            WHEN %s >= %s
                THEN 1
            ELSE 0
        END
    """

    cur.execute(
        time_query,
        (
            scheduled_start,
            scheduled_end,
        ),
    )

    invalid_time = cur.fetchone()[0]

    if invalid_time:

        cur.close()

        return jsonify(
            {
                "message":
                "Scheduled end must be after the scheduled start."
            }
        ), 400

    if batch_id:

        batch_query = """
        SELECT
            batch_id
        FROM batches
        WHERE batch_id = %s
        """

        cur.execute(
            batch_query,
            (batch_id,),
        )

        batch = cur.fetchone()

        if not batch:

            cur.close()

            return jsonify(
                {
                    "message":
                    "Selected batch does not exist."
                }
            ), 404

    if candidate_id:

        candidate_query = """
        SELECT
            user_id
        FROM users
        WHERE
            user_id = %s
            AND role = 'Candidate'
            AND is_active = 1
        """

        cur.execute(
            candidate_query,
            (candidate_id,),
        )

        candidate = cur.fetchone()

        if not candidate:

            cur.close()

            return jsonify(
                {
                    "message":
                    "Selected candidate does not exist or is inactive."
                }
            ), 404

    update_query = """
    UPDATE assessment_schedules
    SET
        batch_id = %s,
        candidate_id = %s,
        scheduled_start = %s,
        scheduled_end = %s
    WHERE schedule_id = %s
    """

    cur.execute(
        update_query,
        (
            batch_id,
            candidate_id,
            scheduled_start,
            scheduled_end,
            schedule_id,
        ),
    )

    mysql.connection.commit()

    cur.close()

    return jsonify(
        {
            "message":
            "Assessment schedule updated successfully."
        }
    ), 200


@schedule_bp.route(
    "/cancel-assessment-schedule/<int:schedule_id>",
    methods=["DELETE"],
)
@jwt_required()
@role_required("Admin", "Examiner")
def cancel_assessment_schedule(
    schedule_id
):

    cur = mysql.connection.cursor()

    schedule_query = """
    SELECT
        schedule_id,

        CASE
            WHEN CONVERT_TZ(
                UTC_TIMESTAMP(),
                '+00:00',
                '+05:30'
            ) < scheduled_start
                THEN 'Upcoming'

            WHEN CONVERT_TZ(
                UTC_TIMESTAMP(),
                '+00:00',
                '+05:30'
            ) BETWEEN
                scheduled_start
                AND scheduled_end
                THEN 'Available'

            ELSE 'Ended'
        END AS schedule_status

    FROM assessment_schedules

    WHERE schedule_id = %s
    """

    cur.execute(
        schedule_query,
        (schedule_id,),
    )

    schedule = cur.fetchone()

    if not schedule:

        cur.close()

        return jsonify(
            {
                "message":
                "Assessment schedule not found."
            }
        ), 404

    if schedule[1] != "Upcoming":

        cur.close()

        return jsonify(
            {
                "message":
                "Only upcoming assessment schedules can be cancelled."
            }
        ), 400

    delete_query = """
    DELETE FROM assessment_schedules
    WHERE schedule_id = %s
    """

    cur.execute(
        delete_query,
        (schedule_id,),
    )

    mysql.connection.commit()

    cur.close()

    return jsonify(
        {
            "message":
            "Assessment schedule cancelled successfully."
        }
    ), 200


@schedule_bp.route(
    "/remove-assessment-schedule/<int:schedule_id>",
    methods=["DELETE"],
)
@jwt_required()
@role_required("Admin", "Examiner")
def remove_assessment_schedule(
    schedule_id
):

    cur = mysql.connection.cursor()

    schedule_query = """
    SELECT
        schedule_id,

        CASE
            WHEN CONVERT_TZ(
                UTC_TIMESTAMP(),
                '+00:00',
                '+05:30'
            ) < scheduled_start
                THEN 'Upcoming'

            WHEN CONVERT_TZ(
                UTC_TIMESTAMP(),
                '+00:00',
                '+05:30'
            ) BETWEEN
                scheduled_start
                AND scheduled_end
                THEN 'Available'

            ELSE 'Ended'
        END AS schedule_status

    FROM assessment_schedules

    WHERE schedule_id = %s
    """

    cur.execute(
        schedule_query,
        (schedule_id,),
    )

    schedule = cur.fetchone()

    if not schedule:

        cur.close()

        return jsonify(
            {
                "message":
                "Assessment schedule not found."
            }
        ), 404

    if schedule[1] != "Ended":

        cur.close()

        return jsonify(
            {
                "message":
                "Only ended assessment schedules can be removed."
            }
        ), 400

    delete_query = """
    DELETE FROM assessment_schedules
    WHERE schedule_id = %s
    """

    cur.execute(
        delete_query,
        (schedule_id,),
    )

    mysql.connection.commit()

    cur.close()

    return jsonify(
        {
            "message":
            "Ended assessment schedule removed successfully."
        }
    ), 200


@schedule_bp.route(
    "/assessment-candidates",
    methods=["GET"],
)
@jwt_required()
@role_required("Admin", "Examiner")
def assessment_candidates():

    cur = mysql.connection.cursor()

    candidate_query = """
    SELECT
        u.user_id,
        u.name,
        u.email,
        u.batch_id,
        b.batch_name
    FROM users u
    LEFT JOIN batches b
        ON u.batch_id = b.batch_id
    WHERE
        u.role = 'Candidate'
        AND u.is_active = 1
    ORDER BY
        u.name
    """

    cur.execute(
        candidate_query
    )

    candidates = cur.fetchall()

    cur.close()

    candidate_list = []

    for candidate in candidates:

        candidate_list.append(
            {
                "user_id":
                candidate[0],

                "name":
                candidate[1],

                "email":
                candidate[2],

                "batch_id":
                candidate[3],

                "batch_name":
                candidate[4],
            }
        )

    return jsonify(
        candidate_list
    ), 200


@schedule_bp.route(
    "/candidate-exams",
    methods=["GET"],
)
@jwt_required()
@role_required("Candidate")
def candidate_exams():

    from flask_jwt_extended import get_jwt_identity

    current_user_id = get_jwt_identity()

    cur = mysql.connection.cursor()

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

    batch_id = user[0]

    practice_query = """
    SELECT
        exam_id,
        title,
        duration,
        total_marks,
        passing_marks,
        exam_type
    FROM exams
    WHERE exam_type = 'Practice'
    ORDER BY exam_id DESC
    """

    cur.execute(
        practice_query
    )

    practice_exams = cur.fetchall()

    practice_list = []

    for exam in practice_exams:

        practice_list.append(
            {
                "exam_id":
                exam[0],

                "title":
                exam[1],

                "duration":
                exam[2],

                "total_marks":
                exam[3],

                "passing_marks":
                exam[4],

                "exam_type":
                exam[5],

                "availability_status":
                "Available",

                "scheduled_start":
                None,

                "scheduled_end":
                None,
            }
        )

    actual_query = """
    SELECT DISTINCT
        e.exam_id,
        e.title,
        e.duration,
        e.total_marks,
        e.passing_marks,
        e.exam_type,
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
        END AS availability_status

    FROM exams e

    JOIN assessment_schedules s
        ON e.exam_id = s.exam_id

    WHERE
        e.exam_type = 'Actual'

        AND
        (
            s.candidate_id = %s

            OR

            (
                s.batch_id = %s
                AND %s IS NOT NULL
            )
        )

    ORDER BY
        s.scheduled_start DESC
    """

    cur.execute(
        actual_query,
        (
            current_user_id,
            batch_id,
            batch_id,
        ),
    )

    actual_exams = cur.fetchall()

    actual_list = []

    for exam in actual_exams:

        actual_list.append(
            {
                "exam_id":
                exam[0],

                "title":
                exam[1],

                "duration":
                exam[2],

                "total_marks":
                exam[3],

                "passing_marks":
                exam[4],

                "exam_type":
                exam[5],

                "scheduled_start":
                str(exam[6]),

                "scheduled_end":
                str(exam[7]),

                "availability_status":
                exam[8],
            }
        )

    cur.close()

    return jsonify(
        {
            "practice_exams":
            practice_list,

            "actual_assessments":
            actual_list,
        }
    ), 200
