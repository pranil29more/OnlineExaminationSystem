from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import mysql

batch_bp = Blueprint("batch", __name__)


@batch_bp.route("/create-batch", methods=["POST"])
@jwt_required()
def create_batch():

    current_user_id = get_jwt_identity()

    cur = mysql.connection.cursor()

    # ==========================================
    # Verify User Role
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

        return jsonify({"message": "Only Admin can create batches."}), 403

    # ==========================================
    # Read Request Data
    # ==========================================

    data = request.get_json()

    batch_name = data.get("batch_name")
    technology = data.get("technology")
    trainer_name = data.get("trainer_name")
    description = data.get("description")
    start_date = data.get("start_date")
    end_date = data.get("end_date")
    status = data.get("status")

    # ==========================================
    # Validation
    # ==========================================

    if (
        not batch_name
        or not technology
        or not trainer_name
        or not description
        or not start_date
        or not end_date
        or not status
    ):

        cur.close()

        return jsonify({"message": "All fields are required."}), 400

    # ==========================================
    # Prevent Duplicate Batch Names
    # ==========================================

    check_query = """
    SELECT batch_id
    FROM batches
    WHERE batch_name = %s
    """

    cur.execute(check_query, (batch_name,))

    existing = cur.fetchone()

    if existing:

        cur.close()

        return jsonify({"message": "Batch already exists."}), 400

    # ==========================================
    # Insert Batch
    # ==========================================

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
            {"message": "Batch created successfully.", "batch_id": batch_id}
        ),
        201,
    )


@batch_bp.route("/batches", methods=["GET"])
@jwt_required()
def get_batches():

    current_user_id = get_jwt_identity()

    cur = mysql.connection.cursor()

    # ==========================================
    # Verify User Role
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

        return jsonify({"message": "Only Admin can view batches."}), 403

    # ==========================================
    # Fetch All batches
    # ==========================================

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

    COUNT(u.user_id) AS candidate_count

FROM batches b

LEFT JOIN users u

ON b.batch_id = u.batch_id

GROUP BY

    b.batch_id,

    b.batch_name,

    b.technology,

    b.trainer_name,

    b.description,

    b.start_date,

    b.end_date,

    b.status

ORDER BY b.batch_id DESC
    """

    cur.execute(batch_query)

    batches = cur.fetchall()

    batch_list = []

    for batch in batches:

        batch_list.append(
            {
                "batch_id": batch[0],
                "batch_name": batch[1],
                "technology": batch[2],
                "trainer_name": batch[3],
                "description": batch[4],
                "start_date": str(batch[5]),
                "end_date": str(batch[6]),
                "status": batch[7],
                "candidate_count": batch[8],
            }
        )

    cur.close()

    return jsonify(batch_list), 200


@batch_bp.route("/batch/<int:batch_id>", methods=["GET"])
@jwt_required()
def get_batch(batch_id):

    current_user_id = get_jwt_identity()

    cur = mysql.connection.cursor()

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

        return jsonify({"message": "Only Admin can view batch details."}), 403

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

    cur.execute(query, (batch_id,))

    batch = cur.fetchone()

    cur.close()

    if not batch:

        return jsonify({"message": "Batch not found"}), 404

    return (
        jsonify(
            {
                "batch_id": batch[0],
                "batch_name": batch[1],
                "technology": batch[2],
                "trainer_name": batch[3],
                "description": batch[4],
                "start_date": str(batch[5]),
                "end_date": str(batch[6]),
                "status": batch[7],
            }
        ),
        200,
    )


@batch_bp.route("/batch-details/<int:batch_id>", methods=["GET"])
@jwt_required()
def get_batch_details(batch_id):

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
            jsonify({"message": "Only Admin can access batch details."}),
            403,
        )

    # ==========================================
    # Fetch Batch
    # ==========================================

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

    cur.execute(batch_query, (batch_id,))

    batch = cur.fetchone()

    if not batch:

        cur.close()

        return jsonify({"message": "Batch not found"}), 404

    # ==========================================
    # Fetch Candidates
    # ==========================================

    candidate_query = """
    SELECT

        u.user_id,

        u.name,

        u.email,

        COUNT(s.submission_id) AS assessment_count,

        ROUND(

            AVG(

                (s.score * 100.0) / e.total_marks

            ),

            2

        ) AS average_score

    FROM users u

    LEFT JOIN submissions s

    ON u.user_id = s.user_id

    LEFT JOIN exams e

    ON s.exam_id = e.exam_id

    WHERE

        u.batch_id = %s

    GROUP BY

        u.user_id,

        u.name,

        u.email

    ORDER BY

        u.name
    """

    cur.execute(candidate_query, (batch_id,))

    candidates = cur.fetchall()

    candidate_list = []

    for candidate in candidates:

        candidate_list.append(
            {
                "user_id": candidate[0],
                "name": candidate[1],
                "email": candidate[2],
                "assessment_count": candidate[3],
                "average_score": candidate[4],
            }
        )

    cur.close()

    return (
        jsonify(
            {
                "batch": {
                    "batch_id": batch[0],
                    "batch_name": batch[1],
                    "technology": batch[2],
                    "trainer_name": batch[3],
                    "description": batch[4],
                    "start_date": str(batch[5]),
                    "end_date": str(batch[6]),
                    "status": batch[7],
                },
                "candidate_count": len(candidate_list),
                "candidates": candidate_list,
            }
        ),
        200,
    )


@batch_bp.route("/available-candidates", methods=["GET"])
@jwt_required()
def get_available_candidates():

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
            jsonify({"message": "Only Admin can access this resource."}),
            403,
        )

    # ==========================================
    # Fetch Unassigned Candidates
    # ==========================================

    query = """
    SELECT

        user_id,
        name,
        email

    FROM users

    WHERE

        role = 'Candidate'

        AND batch_id IS NULL

    ORDER BY name
    """

    cur.execute(query)

    candidates = cur.fetchall()

    cur.close()

    result = []

    for candidate in candidates:

        result.append(
            {
                "user_id": candidate[0],
                "name": candidate[1],
                "email": candidate[2],
            }
        )

    return jsonify(result), 200


@batch_bp.route("/assign-candidate", methods=["PUT"])
@jwt_required()
def assign_candidate():

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

        return jsonify({"message": "Only Admin can assign candidates."}), 403

    # ==========================================
    # Read Request
    # ==========================================

    data = request.get_json()

    batch_id = data.get("batch_id")

    user_ids = data.get("user_ids")

    # ==========================================
    # Validation
    # ==========================================

    if not batch_id:

        cur.close()

        return jsonify({"message": "Batch ID is required."}), 400

    if not user_ids or len(user_ids) == 0:

        cur.close()

        return (
            jsonify({"message": "Please select at least one candidate."}),
            400,
        )

    # ==========================================
    # Verify Batch Exists
    # ==========================================

    batch_query = """
    SELECT batch_id
    FROM batches
    WHERE batch_id = %s
    """

    cur.execute(batch_query, (batch_id,))

    batch = cur.fetchone()

    if not batch:

        cur.close()

        return jsonify({"message": "Batch not found."}), 404

    # ==========================================
    # Assign Candidates
    # ==========================================

    update_query = """
    UPDATE users
    SET batch_id = %s
    WHERE
        user_id = %s
        AND role = 'Candidate'
    """

    assigned_count = 0

    for user_id in user_ids:

        cur.execute(update_query, (batch_id, user_id))

        assigned_count += cur.rowcount

    mysql.connection.commit()

    cur.close()

    return (
        jsonify(
            {
                "message": f"{assigned_count} candidate(s) assigned successfully."
            }
        ),
        200,
    )


@batch_bp.route("/unassign-candidate", methods=["PUT"])
@jwt_required()
def unassign_candidate():

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

        return jsonify({"message": "Only Admin can unassign candidates."}), 403

    # ==========================================
    # Read Request
    # ==========================================

    data = request.get_json()

    user_ids = data.get("user_ids")

    # ==========================================
    # Validation
    # ==========================================

    if not user_ids or len(user_ids) == 0:

        cur.close()

        return (
            jsonify({"message": "Please select at least one candidate."}),
            400,
        )

    # ==========================================
    # Unassign Candidates
    # ==========================================

    update_query = """
    UPDATE users
    SET batch_id = NULL
    WHERE
        user_id = %s
        AND role = 'Candidate'
    """

    unassigned_count = 0

    for user_id in user_ids:

        cur.execute(update_query, (user_id,))

        unassigned_count += cur.rowcount

    mysql.connection.commit()

    cur.close()

    return (
        jsonify(
            {
                "message": f"{unassigned_count} candidate(s) unassigned successfully."
            }
        ),
        200,
    )


@batch_bp.route("/update-batch/<int:batch_id>", methods=["PUT"])
@jwt_required()
def update_batch(batch_id):

    current_user_id = get_jwt_identity()

    cur = mysql.connection.cursor()

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

        return jsonify({"message": "Only Admin can update batches"}), 403

    data = request.get_json()

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
            data.get("batch_name"),
            data.get("technology"),
            data.get("trainer_name"),
            data.get("description"),
            data.get("start_date"),
            data.get("end_date"),
            data.get("status"),
            batch_id,
        ),
    )

    mysql.connection.commit()

    cur.close()

    return jsonify({"message": "Batch updated successfully"}), 200


@batch_bp.route("/delete-batch/<int:batch_id>", methods=["DELETE"])
@jwt_required()
def delete_batch(batch_id):

    current_user_id = get_jwt_identity()

    cur = mysql.connection.cursor()

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

        return jsonify({"message": "Only Admin can delete batches"}), 403

    check_query = """
    SELECT batch_id
    FROM batches
    WHERE batch_id = %s
    """

    cur.execute(check_query, (batch_id,))

    batch = cur.fetchone()

    if not batch:

        cur.close()

        return jsonify({"message": "Batch not found"}), 404

    delete_query = """
    DELETE FROM batches
    WHERE batch_id = %s
    """

    cur.execute(delete_query, (batch_id,))

    mysql.connection.commit()

    cur.close()

    return jsonify({"message": "Batch deleted successfully"}), 200
