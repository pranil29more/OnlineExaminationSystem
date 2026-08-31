from flask import (
    Blueprint,
    request,
    jsonify,
    send_file,
)
from flask_jwt_extended import jwt_required
import io
import pandas as pd
from extensions import mysql
from utils.decorators import role_required


batch_bp = Blueprint("batch", __name__)


@batch_bp.route(
    "/create-batch",
    methods=["POST"]
)
@jwt_required()
@role_required("Admin")
def create_batch():

    cur = mysql.connection.cursor()

    data = request.get_json(
        silent=True
    ) or {}

    batch_name = data.get("batch_name")
    technology = data.get("technology")
    trainer_name = data.get("trainer_name")
    description = data.get("description")
    start_date = data.get("start_date")
    end_date = data.get("end_date")

    if (
        not batch_name
        or not technology
        or not trainer_name
        or not description
        or not start_date
        or not end_date
    ):

        cur.close()

        return (
            jsonify(
                {
                    "message":
                    "All fields are required."
                }
            ),
            400,
        )

    if end_date < start_date:

        cur.close()

        return (
            jsonify(
                {
                    "message":
                    "End date cannot be before the start date."
                }
            ),
            400,
        )

    check_query = """
    SELECT batch_id
    FROM batches
    WHERE batch_name = %s
    """

    cur.execute(
        check_query,
        (batch_name,)
    )

    existing = cur.fetchone()

    if existing:

        cur.close()

        return (
            jsonify(
                {
                    "message":
                    "Batch already exists."
                }
            ),
            400,
        )

    status_query = """
    SELECT
        CASE
            WHEN CURRENT_DATE < %s
                THEN 'Upcoming'

            WHEN CURRENT_DATE > %s
                THEN 'Completed'

            ELSE 'Active'
        END
    """

    cur.execute(
        status_query,
        (
            start_date,
            end_date,
        ),
    )

    status = cur.fetchone()[0]

    insert_query = """
    INSERT INTO batches
    (
        batch_name,
        technology,
        trainer_name,
        description,
        start_date,
        end_date,
        status
    )
    VALUES
    (
        %s,
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
            batch_name,
            technology,
            trainer_name,
            description,
            start_date,
            end_date,
            status,
        ),
    )

    mysql.connection.commit()

    batch_id = cur.lastrowid

    cur.close()

    return (
        jsonify(
            {
                "message":
                "Batch created successfully.",

                "batch_id":
                batch_id,
            }
        ),
        201,
    )


@batch_bp.route(
    "/batches",
    methods=["GET"]
)
@jwt_required()
@role_required("Admin")
def get_batches():

    cur = mysql.connection.cursor()

    status_update_query = """
    UPDATE batches
    SET status =
        CASE
            WHEN CURRENT_DATE < start_date
                THEN 'Upcoming'

            WHEN CURRENT_DATE > end_date
                THEN 'Completed'

            ELSE 'Active'
        END
    """

    cur.execute(
        status_update_query
    )

    mysql.connection.commit()

    batch_query = """
    SELECT
        b.batch_id,
        b.batch_name,
        b.technology,
        b.trainer_name,
        b.description,
        b.start_date,
        b.end_date,
        b.status,

        COUNT(DISTINCT u.user_id)
            AS candidate_count,

        COUNT(DISTINCT s.schedule_id)
            AS assignment_count

    FROM batches b

    LEFT JOIN users u
        ON b.batch_id = u.batch_id

    LEFT JOIN assessment_schedules s
        ON b.batch_id = s.batch_id

    GROUP BY
        b.batch_id,
        b.batch_name,
        b.technology,
        b.trainer_name,
        b.description,
        b.start_date,
        b.end_date,
        b.status

    ORDER BY
        b.batch_id DESC
    """

    cur.execute(
        batch_query
    )

    batches = cur.fetchall()

    cur.close()

    batch_list = []

    for batch in batches:

        batch_list.append(
            {
                "batch_id":
                    batch[0],

                "batch_name":
                    batch[1],

                "technology":
                    batch[2],

                "trainer_name":
                    batch[3],

                "description":
                    batch[4],

                "start_date":
                    str(batch[5]),

                "end_date":
                    str(batch[6]),

                "status":
                    batch[7],

                "candidate_count":
                    batch[8],

                "assignment_count":
                    batch[9],
            }
        )

    return jsonify(
        batch_list
    ), 200


@batch_bp.route(
    "/batch/<int:batch_id>",
    methods=["GET"]
)
@jwt_required()
@role_required("Admin")
def get_batch(batch_id):

    cur = mysql.connection.cursor()

    status_update_query = """
    UPDATE batches
    SET status =
        CASE
            WHEN CURRENT_DATE < start_date
                THEN 'Upcoming'

            WHEN CURRENT_DATE > end_date
                THEN 'Completed'

            ELSE 'Active'
        END
    WHERE batch_id = %s
    """

    cur.execute(
        status_update_query,
        (batch_id,),
    )

    mysql.connection.commit()

    query = """
    SELECT
        batch_id,
        batch_name,
        technology,
        trainer_name,
        description,
        start_date,
        end_date,
        status
    FROM batches
    WHERE batch_id = %s
    """

    cur.execute(
        query,
        (batch_id,)
    )

    batch = cur.fetchone()

    cur.close()

    if not batch:

        return (
            jsonify(
                {
                    "message":
                    "Batch not found"
                }
            ),
            404,
        )

    return (
        jsonify(
            {
                "batch_id":
                    batch[0],

                "batch_name":
                    batch[1],

                "technology":
                    batch[2],

                "trainer_name":
                    batch[3],

                "description":
                    batch[4],

                "start_date":
                    str(batch[5]),

                "end_date":
                    str(batch[6]),

                "status":
                    batch[7],
            }
        ),
        200,
    )


@batch_bp.route(
    "/batch-details/<int:batch_id>",
    methods=["GET"],
)
@jwt_required()
@role_required("Admin")
def get_batch_details(batch_id):

    cur = mysql.connection.cursor()

    status_update_query = """
    UPDATE batches
    SET status =
        CASE
            WHEN CURRENT_DATE < start_date
                THEN 'Upcoming'

            WHEN CURRENT_DATE > end_date
                THEN 'Completed'

            ELSE 'Active'
        END
    WHERE batch_id = %s
    """

    cur.execute(
        status_update_query,
        (batch_id,),
    )

    mysql.connection.commit()

    batch_query = """
    SELECT
        batch_id,
        batch_name,
        technology,
        trainer_name,
        description,
        start_date,
        end_date,
        status
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

        return (
            jsonify(
                {
                    "message":
                    "Batch not found"
                }
            ),
            404,
        )

    candidate_query = """
    SELECT

        u.user_id,
        u.name,
        u.email,

        COALESCE(
            performance.assessment_count,
            0
        ) AS assessment_count,

        performance.average_score

    FROM users u

    LEFT JOIN
    (
        SELECT

            s.user_id,

            COUNT(DISTINCT s.exam_id)
                AS assessment_count,

            ROUND(
                AVG(
                    (
                        s.score * 100.0
                    )
                    / NULLIF(
                        e.total_marks,
                        0
                    )
                ),
                2
            ) AS average_score

        FROM submissions s

        INNER JOIN exams e
            ON s.exam_id = e.exam_id

        INNER JOIN assessment_schedules sch
            ON s.exam_id = sch.exam_id

        WHERE
            sch.batch_id = %s

            AND e.exam_type = 'Actual'

        GROUP BY
            s.user_id

    ) performance

        ON u.user_id =
            performance.user_id

    WHERE
        u.batch_id = %s

    ORDER BY
        u.name
    """

    cur.execute(
        candidate_query,
        (
            batch_id,
            batch_id,
        ),
    )

    candidates = cur.fetchall()

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

                "assessment_count":
                    int(
                        candidate[3] or 0
                    ),

                "average_score":
                    float(
                        candidate[4]
                    )
                    if candidate[4] is not None
                    else None,
            }
        )

    cur.close()

    return (
        jsonify(
            {
                "batch": {
                    "batch_id":
                        batch[0],

                    "batch_name":
                        batch[1],

                    "technology":
                        batch[2],

                    "trainer_name":
                        batch[3],

                    "description":
                        batch[4],

                    "start_date":
                        str(batch[5]),

                    "end_date":
                        str(batch[6]),

                    "status":
                        batch[7],
                },

                "candidate_count":
                    len(candidate_list),

                "candidates":
                    candidate_list,
            }
        ),
        200,
    )


@batch_bp.route(
    "/available-candidates",
    methods=["GET"],
)
@jwt_required()
@role_required("Admin")
def get_available_candidates():

    cur = mysql.connection.cursor()

    query = """
    SELECT
        user_id,
        name,
        email
    FROM users
    WHERE
        role = 'Candidate'
        AND batch_id IS NULL
    ORDER BY
        name
    """

    cur.execute(
        query
    )

    candidates = cur.fetchall()

    cur.close()

    result = []

    for candidate in candidates:

        result.append(
            {
                "user_id":
                    candidate[0],

                "name":
                    candidate[1],

                "email":
                    candidate[2],
            }
        )

    return jsonify(
        result
    ), 200


@batch_bp.route(
    "/assign-candidate",
    methods=["PUT"],
)
@jwt_required()
@role_required("Admin")
def assign_candidate():

    cur = mysql.connection.cursor()

    data = request.get_json(
        silent=True
    ) or {}

    batch_id = data.get(
        "batch_id"
    )

    user_ids = data.get(
        "user_ids"
    )

    if not batch_id:

        cur.close()

        return (
            jsonify(
                {
                    "message":
                    "Batch ID is required."
                }
            ),
            400,
        )

    if (
        not user_ids
        or len(user_ids) == 0
    ):

        cur.close()

        return (
            jsonify(
                {
                    "message":
                    "Please select at least one candidate."
                }
            ),
            400,
        )

    batch_query = """
    SELECT batch_id
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

        return (
            jsonify(
                {
                    "message":
                    "Batch not found."
                }
            ),
            404,
        )

    update_query = """
    UPDATE users
    SET batch_id = %s
    WHERE
        user_id = %s
        AND role = 'Candidate'
    """

    assigned_count = 0

    for user_id in user_ids:

        cur.execute(
            update_query,
            (
                batch_id,
                user_id,
            ),
        )

        assigned_count += (
            cur.rowcount
        )

    mysql.connection.commit()

    cur.close()

    return (
        jsonify(
            {
                "message":
                f"{assigned_count} "
                "candidate(s) assigned successfully."
            }
        ),
        200,
    )


@batch_bp.route(
    "/unassign-candidate",
    methods=["PUT"],
)
@jwt_required()
@role_required("Admin")
def unassign_candidate():

    cur = mysql.connection.cursor()

    data = request.get_json(
        silent=True
    ) or {}

    user_ids = data.get(
        "user_ids"
    )

    if (
        not user_ids
        or len(user_ids) == 0
    ):

        cur.close()

        return (
            jsonify(
                {
                    "message":
                    "Please select at least one candidate."
                }
            ),
            400,
        )

    update_query = """
    UPDATE users
    SET batch_id = NULL
    WHERE
        user_id = %s
        AND role = 'Candidate'
    """

    unassigned_count = 0

    for user_id in user_ids:

        cur.execute(
            update_query,
            (user_id,)
        )

        unassigned_count += (
            cur.rowcount
        )

    mysql.connection.commit()

    cur.close()

    return (
        jsonify(
            {
                "message":
                f"{unassigned_count} "
                "candidate(s) unassigned successfully."
            }
        ),
        200,
    )


@batch_bp.route(
    "/update-batch/<int:batch_id>",
    methods=["PUT"],
)
@jwt_required()
@role_required("Admin")
def update_batch(batch_id):

    cur = mysql.connection.cursor()

    data = request.get_json(
        silent=True
    ) or {}

    batch_name = data.get(
        "batch_name"
    )

    technology = data.get(
        "technology"
    )

    trainer_name = data.get(
        "trainer_name"
    )

    description = data.get(
        "description"
    )

    start_date = data.get(
        "start_date"
    )

    end_date = data.get(
        "end_date"
    )

    if (
        not batch_name
        or not technology
        or not trainer_name
        or not description
        or not start_date
        or not end_date
    ):

        cur.close()

        return (
            jsonify(
                {
                    "message":
                    "All fields are required."
                }
            ),
            400,
        )

    if end_date < start_date:

        cur.close()

        return (
            jsonify(
                {
                    "message":
                    "End date cannot be before the start date."
                }
            ),
            400,
        )

    check_query = """
    SELECT batch_id
    FROM batches
    WHERE batch_id = %s
    """

    cur.execute(
        check_query,
        (batch_id,),
    )

    batch = cur.fetchone()

    if not batch:

        cur.close()

        return (
            jsonify(
                {
                    "message":
                    "Batch not found."
                }
            ),
            404,
        )

    status_query = """
    SELECT
        CASE
            WHEN CURRENT_DATE < %s
                THEN 'Upcoming'

            WHEN CURRENT_DATE > %s
                THEN 'Completed'

            ELSE 'Active'
        END
    """

    cur.execute(
        status_query,
        (
            start_date,
            end_date,
        ),
    )

    status = cur.fetchone()[0]

    update_query = """
    UPDATE batches
    SET
        batch_name = %s,
        technology = %s,
        trainer_name = %s,
        description = %s,
        start_date = %s,
        end_date = %s,
        status = %s
    WHERE batch_id = %s
    """

    cur.execute(
        update_query,
        (
            batch_name,
            technology,
            trainer_name,
            description,
            start_date,
            end_date,
            status,
            batch_id,
        ),
    )

    mysql.connection.commit()

    cur.close()

    return (
        jsonify(
            {
                "message":
                "Batch updated successfully."
            }
        ),
        200,
    )


@batch_bp.route(
    "/delete-batch/<int:batch_id>",
    methods=["DELETE"],
)
@jwt_required()
@role_required("Admin")
def delete_batch(batch_id):

    cur = mysql.connection.cursor()

    check_query = """
    SELECT batch_id
    FROM batches
    WHERE batch_id = %s
    """

    cur.execute(
        check_query,
        (batch_id,),
    )

    batch = cur.fetchone()

    if not batch:

        cur.close()

        return (
            jsonify(
                {
                    "message":
                    "Batch not found"
                }
            ),
            404,
        )

    delete_query = """
    DELETE FROM batches
    WHERE batch_id = %s
    """

    cur.execute(
        delete_query,
        (batch_id,),
    )

    mysql.connection.commit()

    cur.close()

    return (
        jsonify(
            {
                "message":
                "Batch deleted successfully"
            }
        ),
        200,
    )


@batch_bp.route(
    "/batch-report/<int:batch_id>",
    methods=["GET"],
)
@jwt_required()
@role_required(
    "Admin",
    "Examiner"
)
def get_batch_report(batch_id):

    cur = mysql.connection.cursor()

    batch_query = """
    SELECT
        batch_id,
        batch_name,
        technology,
        trainer_name,
        description,
        start_date,
        end_date,
        status
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
                "Batch not found"
            }
        ), 404

    summary_query = """
    SELECT

        (
            SELECT COUNT(*)
            FROM users
            WHERE
                batch_id = %s
                AND role = 'Candidate'
        ) AS total_candidates,

        (
            SELECT COUNT(DISTINCT exam_id)
            FROM assessment_schedules
            WHERE
                batch_id = %s
                AND exam_id IN (
                    SELECT exam_id
                    FROM exams
                    WHERE exam_type = 'Actual'
                )
        ) AS total_assessments,

        COUNT(s.submission_id)
            AS total_submissions,

        ROUND(
            AVG(
                (
                    s.score * 100.0
                )
                / NULLIF(
                    e.total_marks,
                    0
                )
            ),
            2
        ) AS average_score,

        ROUND(
            MAX(
                (
                    s.score * 100.0
                )
                / NULLIF(
                    e.total_marks,
                    0
                )
            ),
            2
        ) AS highest_score,

        ROUND(
            MIN(
                (
                    s.score * 100.0
                )
                / NULLIF(
                    e.total_marks,
                    0
                )
            ),
            2
        ) AS lowest_score,

        SUM(
            CASE
                WHEN
                    s.submission_id IS NOT NULL
                    AND s.score >= e.passing_marks
                THEN 1
                ELSE 0
            END
        ) AS pass_count,

        SUM(
            CASE
                WHEN
                    s.submission_id IS NOT NULL
                    AND s.score < e.passing_marks
                THEN 1
                ELSE 0
            END
        ) AS fail_count

    FROM users u

    LEFT JOIN submissions s
        ON u.user_id = s.user_id

        AND EXISTS (
            SELECT 1
            FROM assessment_schedules sch
            WHERE
                sch.exam_id = s.exam_id
                AND sch.batch_id = %s
        )

    LEFT JOIN exams e
        ON s.exam_id = e.exam_id
        AND e.exam_type = 'Actual'

    WHERE
        u.batch_id = %s
        AND u.role = 'Candidate'
    """

    cur.execute(
        summary_query,
        (
            batch_id,
            batch_id,
            batch_id,
            batch_id,
        ),
    )

    summary = cur.fetchone()

    candidate_query = """
    SELECT

        u.user_id,
        u.name,
        u.email,

        COUNT(s.submission_id)
            AS assessment_count,

        ROUND(
            AVG(
                (
                    s.score * 100.0
                )
                / NULLIF(
                    e.total_marks,
                    0
                )
            ),
            2
        ) AS average_score,

        ROUND(
            MAX(
                (
                    s.score * 100.0
                )
                / NULLIF(
                    e.total_marks,
                    0
                )
            ),
            2
        ) AS highest_score,

        ROUND(
            MIN(
                (
                    s.score * 100.0
                )
                / NULLIF(
                    e.total_marks,
                    0
                )
            ),
            2
        ) AS lowest_score,

        SUM(
            CASE
                WHEN
                    s.submission_id IS NOT NULL
                    AND s.score >= e.passing_marks
                THEN 1
                ELSE 0
            END
        ) AS pass_count,

        SUM(
            CASE
                WHEN
                    s.submission_id IS NOT NULL
                    AND s.score < e.passing_marks
                THEN 1
                ELSE 0
            END
        ) AS fail_count

    FROM users u

    LEFT JOIN submissions s
        ON u.user_id = s.user_id

        AND EXISTS (
            SELECT 1
            FROM assessment_schedules sch
            WHERE
                sch.exam_id = s.exam_id
                AND sch.batch_id = %s
        )

    LEFT JOIN exams e
        ON s.exam_id = e.exam_id
        AND e.exam_type = 'Actual'

    WHERE
        u.batch_id = %s
        AND u.role = 'Candidate'

    GROUP BY
        u.user_id,
        u.name,
        u.email

    ORDER BY
        average_score DESC
    """

    cur.execute(
        candidate_query,
        (
            batch_id,
            batch_id,
        ),
    )

    candidates = cur.fetchall()

    assessment_query = """
    SELECT

        e.exam_id,
        e.title,
        e.total_marks,
        e.passing_marks,

        COUNT(s.submission_id)
            AS submission_count,

        ROUND(
            AVG(
                (
                    s.score * 100.0
                )
                / NULLIF(
                    e.total_marks,
                    0
                )
            ),
            2
        ) AS average_score,

        ROUND(
            MAX(
                (
                    s.score * 100.0
                )
                / NULLIF(
                    e.total_marks,
                    0
                )
            ),
            2
        ) AS highest_score,

        ROUND(
            MIN(
                (
                    s.score * 100.0
                )
                / NULLIF(
                    e.total_marks,
                    0
                )
            ),
            2
        ) AS lowest_score,

        SUM(
            CASE
                WHEN
                    s.submission_id IS NOT NULL
                    AND s.score >= e.passing_marks
                THEN 1
                ELSE 0
            END
        ) AS pass_count,

        SUM(
            CASE
                WHEN
                    s.submission_id IS NOT NULL
                    AND s.score < e.passing_marks
                THEN 1
                ELSE 0
            END
        ) AS fail_count

    FROM
    (
        SELECT DISTINCT
            exam_id
        FROM assessment_schedules
        WHERE batch_id = %s
    ) scheduled

    JOIN exams e
        ON scheduled.exam_id = e.exam_id

    LEFT JOIN submissions s
        ON s.exam_id = e.exam_id

        AND s.user_id IN (
            SELECT user_id
            FROM users
            WHERE
                batch_id = %s
                AND role = 'Candidate'
        )

    WHERE
        e.exam_type = 'Actual'

    GROUP BY
        e.exam_id,
        e.title,
        e.total_marks,
        e.passing_marks

    ORDER BY
        e.title
    """

    cur.execute(
        assessment_query,
        (
            batch_id,
            batch_id,
        ),
    )

    assessments = cur.fetchall()

    cur.close()

    candidate_list = []

    for index, candidate in enumerate(
        candidates,
        start=1,
    ):

        candidate_list.append(
            {
                "rank":
                    index,

                "user_id":
                    candidate[0],

                "name":
                    candidate[1],

                "email":
                    candidate[2],

                "assessment_count":
                    int(
                        candidate[3] or 0
                    ),

                "average_score":
                    float(candidate[4])
                    if candidate[4] is not None
                    else None,

                "highest_score":
                    float(candidate[5])
                    if candidate[5] is not None
                    else None,

                "lowest_score":
                    float(candidate[6])
                    if candidate[6] is not None
                    else None,

                "pass_count":
                    int(
                        candidate[7] or 0
                    ),

                "fail_count":
                    int(
                        candidate[8] or 0
                    ),
            }
        )

    assessment_list = []

    for assessment in assessments:

        submission_count = int(
            assessment[4] or 0
        )

        pass_count = int(
            assessment[8] or 0
        )

        fail_count = int(
            assessment[9] or 0
        )

        pass_percentage = (
            round(
                (
                    pass_count * 100.0
                )
                / submission_count,
                2,
            )
            if submission_count > 0
            else 0
        )

        assessment_list.append(
            {
                "exam_id":
                    assessment[0],

                "title":
                    assessment[1],

                "total_marks":
                    assessment[2],

                "passing_marks":
                    assessment[3],

                "submission_count":
                    submission_count,

                "average_score":
                    float(assessment[5])
                    if assessment[5] is not None
                    else None,

                "highest_score":
                    float(assessment[6])
                    if assessment[6] is not None
                    else None,

                "lowest_score":
                    float(assessment[7])
                    if assessment[7] is not None
                    else None,

                "pass_count":
                    pass_count,

                "fail_count":
                    fail_count,

                "pass_percentage":
                    pass_percentage,
            }
        )

    total_candidates = int(
        summary[0] or 0
    )

    total_assessments = int(
        summary[1] or 0
    )

    total_submissions = int(
        summary[2] or 0
    )

    total_passes = int(
        summary[6] or 0
    )

    total_fails = int(
        summary[7] or 0
    )

    pass_percentage = (
        round(
            (
                total_passes * 100.0
            )
            / total_submissions,
            2,
        )
        if total_submissions > 0
        else 0
    )

    return (
        jsonify(
            {
                "batch": {
                    "batch_id":
                        batch[0],

                    "batch_name":
                        batch[1],

                    "technology":
                        batch[2],

                    "trainer_name":
                        batch[3],

                    "description":
                        batch[4],

                    "start_date":
                        str(batch[5]),

                    "end_date":
                        str(batch[6]),

                    "status":
                        batch[7],
                },

                "summary": {
                    "total_candidates":
                        total_candidates,

                    "total_submissions":
                        total_submissions,

                    "total_assessments":
                        total_assessments,

                    "average_score":
                        float(summary[3])
                        if summary[3] is not None
                        else 0,

                    "highest_score":
                        float(summary[4])
                        if summary[4] is not None
                        else 0,

                    "lowest_score":
                        float(summary[5])
                        if summary[5] is not None
                        else 0,

                    "pass_count":
                        total_passes,

                    "fail_count":
                        total_fails,

                    "pass_percentage":
                        pass_percentage,
                },

                "candidates":
                    candidate_list,

                "assessments":
                    assessment_list,
            }
        ),
        200,
    )


@batch_bp.route(
    "/batch-report/<int:batch_id>/download/excel",
    methods=["GET"],
)
@jwt_required()
@role_required(
    "Admin",
    "Examiner"
)
def download_batch_report_excel(
    batch_id
):

    response = get_batch_report(
        batch_id
    )

    if isinstance(
        response,
        tuple
    ):

        response_object = response[0]
        status_code = response[1]

        if status_code != 200:

            return response

    else:

        response_object = response

    report_data = (
        response_object.get_json()
    )

    batch = report_data["batch"]

    summary = report_data["summary"]

    candidates = (
        report_data["candidates"]
    )

    assessments = (
        report_data["assessments"]
    )

    output = io.BytesIO()

    with pd.ExcelWriter(
        output,
        engine="openpyxl",
    ) as writer:

        summary_data = [
            {
                "Batch Name":
                    batch["batch_name"],

                "Technology":
                    batch["technology"],

                "Trainer":
                    batch["trainer_name"],

                "Status":
                    batch["status"],

                "Start Date":
                    batch["start_date"],

                "End Date":
                    batch["end_date"],

                "Total Candidates":
                    summary[
                        "total_candidates"
                    ],

                "Total Assessments":
                    summary[
                        "total_assessments"
                    ],

                "Total Submissions":
                    summary[
                        "total_submissions"
                    ],

                "Average Score (%)":
                    summary[
                        "average_score"
                    ],

                "Highest Score (%)":
                    summary[
                        "highest_score"
                    ],

                "Lowest Score (%)":
                    summary[
                        "lowest_score"
                    ],

                "Pass Count":
                    summary[
                        "pass_count"
                    ],

                "Fail Count":
                    summary[
                        "fail_count"
                    ],

                "Pass Percentage (%)":
                    summary[
                        "pass_percentage"
                    ],
            }
        ]

        summary_df = pd.DataFrame(
            summary_data
        )

        summary_df.to_excel(
            writer,
            sheet_name="Batch Summary",
            index=False,
        )

        candidate_data = []

        for candidate in candidates:

            candidate_data.append(
                {
                    "Rank":
                        candidate["rank"],

                    "Candidate":
                        candidate["name"],

                    "Email":
                        candidate["email"],

                    "Assessments":
                        candidate[
                            "assessment_count"
                        ],

                    "Average Score (%)":
                        candidate[
                            "average_score"
                        ],

                    "Highest Score (%)":
                        candidate[
                            "highest_score"
                        ],

                    "Lowest Score (%)":
                        candidate[
                            "lowest_score"
                        ],

                    "Passed":
                        candidate[
                            "pass_count"
                        ],

                    "Failed":
                        candidate[
                            "fail_count"
                        ],
                }
            )

        candidate_df = pd.DataFrame(
            candidate_data
        )

        candidate_df.to_excel(
            writer,
            sheet_name="Candidate Performance",
            index=False,
        )

        assessment_data = []

        for assessment in assessments:

            assessment_data.append(
                {
                    "Assessment":
                        assessment["title"],

                    "Total Marks":
                        assessment[
                            "total_marks"
                        ],

                    "Passing Marks":
                        assessment[
                            "passing_marks"
                        ],

                    "Submissions":
                        assessment[
                            "submission_count"
                        ],

                    "Average Score (%)":
                        assessment[
                            "average_score"
                        ],

                    "Highest Score (%)":
                        assessment[
                            "highest_score"
                        ],

                    "Lowest Score (%)":
                        assessment[
                            "lowest_score"
                        ],

                    "Passed":
                        assessment[
                            "pass_count"
                        ],

                    "Failed":
                        assessment[
                            "fail_count"
                        ],

                    "Pass Rate (%)":
                        assessment[
                            "pass_percentage"
                        ],
                }
            )

        assessment_df = pd.DataFrame(
            assessment_data
        )

        assessment_df.to_excel(
            writer,
            sheet_name="Assessment Performance",
            index=False,
        )

    output.seek(0)

    filename = (
        f"{batch['batch_name']}"
        "_Batch_Report.xlsx"
    )

    filename = filename.replace(
        " ",
        "_",
    )

    return send_file(
        output,
        as_attachment=True,
        download_name=filename,
        mimetype=(
            "application/vnd.openxmlformats-officedocument"
            ".spreadsheetml.sheet"
        ),
    )
