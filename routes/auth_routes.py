from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
)

from extensions import mysql, bcrypt

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():

    data = request.get_json()

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    role = "Candidate"

    # Optional
    batch_id = data.get("batch_id")

    hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")

    cur = mysql.connection.cursor()

    check_query = """
    SELECT user_id
    FROM users
    WHERE email = %s
    """

    cur.execute(check_query, (email,))

    existing_user = cur.fetchone()

    if existing_user:

        cur.close()

        return jsonify({"message": "Email already registered"}), 409

    # ==========================================
    # Validate Batch (only if batch_id provided)
    # ==========================================

    if batch_id is not None:

        batch_query = """
        SELECT batch_id
        FROM batches
        WHERE batch_id = %s
        """

        cur.execute(batch_query, (batch_id,))

        batch = cur.fetchone()

        if not batch:

            cur.close()

            return jsonify({"message": "Invalid Batch"}), 400

    # ==========================================
    # Insert User
    # ==========================================

    query = """
    INSERT INTO users
    (
        name,
        email,
        password,
        role,
        batch_id
    )
    VALUES
    (
        %s,
        %s,
        %s,
        %s,
        %s
    )
    """

    cur.execute(query, (name, email, hashed_password, role, batch_id))

    mysql.connection.commit()

    cur.close()

    return jsonify({"message": "User registered successfully"}), 201


@auth_bp.route("/admin/create-user", methods=["POST"])
@jwt_required()
def admin_create_user():

    current_user_id = get_jwt_identity()

    data = request.get_json()

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role")

    allowed_roles = ["Candidate", "Examiner"]

    if role not in allowed_roles:
        return jsonify({"message": "Invalid role selected"}), 400

    if not name or not email or not password:
        return jsonify({"message": "All fields are required"}), 400

    cur = mysql.connection.cursor()

    # ==========================================
    # Verify Admin
    # ==========================================

    admin_query = """
    SELECT role
    FROM users
    WHERE user_id = %s
    """

    cur.execute(admin_query, (current_user_id,))

    admin = cur.fetchone()

    if not admin or admin[0] != "Admin":
        cur.close()

        return jsonify({"message": "Access denied. Admin only."}), 403

    # ==========================================
    # Check Duplicate Email
    # ==========================================

    check_query = """
    SELECT user_id
    FROM users
    WHERE email = %s
    """

    cur.execute(check_query, (email,))

    existing_user = cur.fetchone()

    if existing_user:
        cur.close()

        return jsonify({"message": "Email already registered"}), 409

    # ==========================================
    # Hash Password
    # ==========================================

    hashed_password = bcrypt.generate_password_hash(
        password
    ).decode("utf-8")

    # ==========================================
    # Create User
    # ==========================================

    insert_query = """
    INSERT INTO users
    (
        name,
        email,
        password,
        role,
        is_active
    )
    VALUES
    (
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
            name,
            email,
            hashed_password,
            role,
            True,
        ),
    )

    mysql.connection.commit()

    new_user_id = cur.lastrowid

    cur.close()

    return (
        jsonify(
            {
                "message": "User created successfully",
                "user_id": new_user_id,
            }
        ),
        201,
    )


@auth_bp.route("/login", methods=["POST"])
def login():

    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    cur = mysql.connection.cursor()

    cur.execute("SELECT DATABASE();")
    print("Connected Database:", cur.fetchone())

    query = """
    SELECT
        user_id,
        name,
        email,
        password,
        role,
        is_active
    FROM users
    WHERE email = %s
    """

    cur.execute(query, (email,))
    user = cur.fetchone()

    cur.close()

    if not user:
        return jsonify({"message": "Invalid email or password"}), 401

    stored_password = user[3]

    if not bcrypt.check_password_hash(stored_password, password):
        return jsonify({"message": "Invalid email or password"}), 401

    if not user[5]:
        return (
            jsonify(
                {
                    "message": "Your account has been deactivated. Please contact the administrator."
                }
            ),
            403,
        )

    access_token = create_access_token(identity=str(user[0]))

    return (
        jsonify(
            {
                "message": "Login successful",
                "token": access_token,
                "user": {
                    "user_id": user[0],
                    "name": user[1],
                    "email": user[2],
                    "role": user[4],
                },
            }
        ),
        200,
    )


@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def profile():

    current_user_id = get_jwt_identity()

    cur = mysql.connection.cursor()

    query = """
    SELECT user_id, name, email, role
    FROM users
    WHERE user_id = %s
    """

    cur.execute(query, (current_user_id,))
    user = cur.fetchone()

    cur.close()

    if not user:
        return jsonify({"message": "User not found"}), 404

    return (
        jsonify(
            {
                "user_id": user[0],
                "name": user[1],
                "email": user[2],
                "role": user[3],
            }
        ),
        200,
    )


@auth_bp.route("/admin-only", methods=["GET"])
@jwt_required()
def admin_only():

    current_user_id = get_jwt_identity()

    cur = mysql.connection.cursor()

    query = """
    SELECT role
    FROM users
    WHERE user_id = %s
    """

    cur.execute(query, (current_user_id,))
    user = cur.fetchone()

    cur.close()

    if not user:
        return jsonify({"message": "User not found"}), 404

    role = user[0]

    if role != "Admin":
        return jsonify({"message": "Access denied. Admin only."}), 403

    return jsonify({"message": "Welcome Admin!"}), 200


@auth_bp.route("/examiner-only", methods=["GET"])
@jwt_required()
def examiner_only():

    current_user_id = get_jwt_identity()

    cur = mysql.connection.cursor()

    query = """
    SELECT role
    FROM users
    WHERE user_id = %s
    """

    cur.execute(query, (current_user_id,))
    user = cur.fetchone()

    cur.close()

    if not user:
        return jsonify({"message": "User not found"}), 404

    role = user[0]

    if role not in ["Admin", "Examiner"]:
        return (
            jsonify({"message": "Access denied. Examiner or Admin only."}),
            403,
        )

    return jsonify({"message": "Welcome Examiner!"}), 200


@auth_bp.route("/users", methods=["GET"])
@jwt_required()
def get_users():

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

        return jsonify({"message": "Access denied"}), 403

    query = """
    SELECT
    u.user_id,
    u.name,
    u.email,
    u.role,
    u.batch_id,
    b.batch_name,
    u.is_active
FROM users u
LEFT JOIN batches b
    ON u.batch_id = b.batch_id
ORDER BY
    u.role,
    u.name
    """

    cur.execute(query)

    users = cur.fetchall()

    cur.close()

    user_list = []

    for user in users:

        user_list.append(
            {
                "user_id": user[0],
                "name": user[1],
                "email": user[2],
                "role": user[3],
                "batch_id": user[4],
                "batch_name": user[5],
                "is_active": bool(user[6]),
            }
        )

    return jsonify(user_list), 200


@auth_bp.route("/toggle-user-status/<int:user_id>", methods=["PUT"])
@jwt_required()
def toggle_user_status(user_id):

    current_user_id = get_jwt_identity()

    cur = mysql.connection.cursor()

    # Check current user is Admin
    cur.execute(
        """
        SELECT role
        FROM users
        WHERE user_id = %s
        """,
        (current_user_id,),
    )

    admin = cur.fetchone()

    if not admin or admin[0] != "Admin":
        cur.close()
        return jsonify({"message": "Access denied"}), 403

    # Get target user
    cur.execute(
        """
        SELECT role, is_active
        FROM users
        WHERE user_id = %s
        """,
        (user_id,),
    )

    user = cur.fetchone()

    if not user:
        cur.close()
        return jsonify({"message": "User not found"}), 404

    # Protect Admin accounts
    if user[0] == "Admin":
        cur.close()
        return jsonify(
            {"message": "Admin account status cannot be changed"}
        ), 403

    new_status = not bool(user[1])

    cur.execute(
        """
        UPDATE users
        SET is_active = %s
        WHERE user_id = %s
        """,
        (new_status, user_id),
    )

    mysql.connection.commit()

    cur.close()

    return jsonify(
        {
            "message": (
                "User activated successfully"
                if new_status
                else "User deactivated successfully"
            ),
            "is_active": new_status,
        }
    ), 200


@auth_bp.route("/delete-user/<int:user_id>", methods=["DELETE"])
@jwt_required()
def delete_user(user_id):

    current_user_id = get_jwt_identity()

    cur = mysql.connection.cursor()

    role_query = """
    SELECT role
    FROM users
    WHERE user_id = %s
    """

    cur.execute(role_query, (current_user_id,))

    admin = cur.fetchone()

    if not admin:

        cur.close()

        return jsonify({"message": "User not found"}), 404

    if admin[0] != "Admin":

        cur.close()

        return jsonify({"message": "Access denied"}), 403

    user_query = """
    SELECT role
    FROM users
    WHERE user_id = %s
    """

    cur.execute(user_query, (user_id,))

    user = cur.fetchone()

    if not user:

        cur.close()

        return jsonify({"message": "User not found"}), 404

    if user[0] == "Admin":

        cur.close()

        return jsonify({"message": "Admin accounts cannot be deleted"}), 403

    submission_query = """
    SELECT submission_id
    FROM submissions
    WHERE user_id = %s
    """

    cur.execute(submission_query, (user_id,))

    submissions = cur.fetchall()

    for submission in submissions:

        delete_answers_query = """
        DELETE FROM answers
        WHERE submission_id = %s
        """

        cur.execute(delete_answers_query, (submission[0],))

    delete_submissions_query = """
    DELETE FROM submissions
    WHERE user_id = %s
    """

    cur.execute(delete_submissions_query, (user_id,))

    delete_user_query = """
    DELETE FROM users
    WHERE user_id = %s
    """

    cur.execute(delete_user_query, (user_id,))

    mysql.connection.commit()

    cur.close()

    return jsonify({"message": "User deleted successfully"}), 200
