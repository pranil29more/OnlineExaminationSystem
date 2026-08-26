from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
)

from extensions import mysql, bcrypt
from config import Config

from brevo import Brevo
from brevo.transactional_emails import (
    SendTransacEmailRequestSender,
    SendTransacEmailRequestToItem,
)

from utils.decorators import role_required

import os
import secrets


auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():

    return (
        jsonify(
            {
                "message":
                "Self-registration is disabled. "
                "Please contact the administrator "
                "for account activation."
            }
        ),
        403,
    )


@auth_bp.route(
    "/admin/create-user",
    methods=["POST"],
)
@jwt_required()
@role_required("Admin")
def admin_create_user():

    data = request.get_json(
        silent=True
    )

    if not data:

        return jsonify(
            {
                "message":
                "Invalid request."
            }
        ), 400

    name = data.get("name")
    email = data.get("email")
    role = data.get("role")

    allowed_roles = [
        "Candidate",
        "Examiner",
    ]

    if role not in allowed_roles:

        return jsonify(
            {
                "message":
                "Invalid role selected"
            }
        ), 400

    if not name or not email:

        return jsonify(
            {
                "message":
                "Name and email are required"
            }
        ), 400

    cur = mysql.connection.cursor()

    check_query = """
    SELECT user_id
    FROM users
    WHERE email = %s
    """

    cur.execute(
        check_query,
        (email,)
    )

    existing_user = cur.fetchone()

    if existing_user:

        cur.close()

        return jsonify(
            {
                "message":
                "Email already registered"
            }
        ), 409

    activation_token = secrets.token_urlsafe(32)

    temporary_password = secrets.token_urlsafe(32)

    hashed_password = (
        bcrypt.generate_password_hash(
            temporary_password
        ).decode("utf-8")
    )

    insert_query = """
    INSERT INTO users
    (
        name,
        email,
        password,
        role,
        is_active,
        account_status,
        activation_token,
        activation_token_expires_at
    )
    VALUES
    (
        %s,
        %s,
        %s,
        %s,
        %s,
        %s,
        %s,
        DATE_ADD(
            UTC_TIMESTAMP(),
            INTERVAL 24 HOUR
        )
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
            "Pending",
            activation_token,
        ),
    )

    mysql.connection.commit()

    new_user_id = cur.lastrowid

    cur.close()

    activation_link = (
        f"{Config.FRONTEND_URL}"
        f"/activate-account/"
        f"{activation_token}"
    )

    message_html = f"""
<!DOCTYPE html>

<html>

<head>

    <meta charset="UTF-8">

    <title>
        Activate Your OES Account
    </title>

</head>

<body
    style="
        margin: 0;
        padding: 0;
        background-color: #f4f6f8;
        font-family: Arial, sans-serif;
    "
>

    <div
        style="
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 10px;
            padding: 35px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.08);
        "
    >

        <h2
            style="
                color: #1f2937;
                margin-bottom: 10px;
            "
        >
            Welcome to the Online Examination System
        </h2>

        <p
            style="
                color: #4b5563;
                font-size: 15px;
                line-height: 1.6;
            "
        >
            Hello <strong>{name}</strong>,
        </p>

        <p
            style="
                color: #4b5563;
                font-size: 15px;
                line-height: 1.6;
            "
        >
            Your account has been created successfully.
        </p>

        <div
            style="
                background-color: #f3f4f6;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
            "
        >

            <p
                style="
                    margin: 5px 0;
                    color: #374151;
                "
            >
                <strong>Email:</strong>
                {email}
            </p>

            <p
                style="
                    margin: 5px 0;
                    color: #374151;
                "
            >
                <strong>Role:</strong>
                {role}
            </p>

            <p
                style="
                    margin: 5px 0;
                    color: #374151;
                "
            >
                <strong>Status:</strong>
                Pending Activation
            </p>

        </div>

        <p
            style="
                color: #4b5563;
                font-size: 15px;
                line-height: 1.6;
            "
        >
            Click the button below to activate your account
            and create your password.
        </p>

        <div
            style="
                text-align: center;
                margin: 30px 0;
            "
        >

            <a
                href="{activation_link}"
                style="
                    display: inline-block;
                    background-color: #2563eb;
                    color: #ffffff;
                    text-decoration: none;
                    padding: 13px 25px;
                    border-radius: 6px;
                    font-size: 15px;
                    font-weight: bold;
                "
            >
                Activate My Account
            </a>

        </div>

        <p
            style="
                color: #6b7280;
                font-size: 13px;
                line-height: 1.5;
            "
        >
            This activation link will expire in
            <strong>24 hours</strong>.
        </p>

        <p
            style="
                color: #6b7280;
                font-size: 13px;
                line-height: 1.5;
            "
        >
            If you did not expect this account,
            please contact the system administrator.
        </p>

        <hr
            style="
                border: none;
                border-top: 1px solid #e5e7eb;
                margin: 30px 0;
            "
        >

        <p
            style="
                color: #9ca3af;
                font-size: 12px;
                text-align: center;
            "
        >
            Online Examination System
        </p>

    </div>

</body>

</html>
"""

    message_text = f"""
Hello {name},

Your account has been created for the Online Examination System.

Role: {role}

Your account is currently pending activation.

Please click the link below to activate your account
and create your password:

{activation_link}

This activation link will expire in 24 hours.

If you did not expect this account, please contact the system administrator.

Regards,
Online Examination System
"""

    try:

        api_key = os.getenv(
            "BREVO_API_KEY"
        )

        if not api_key:

            raise Exception(
                "BREVO_API_KEY is missing from environment variables."
            )

        sender_email = os.getenv(
            "BREVO_SENDER_EMAIL",
            "oes.activation@gmail.com"
        )

        client = Brevo(
            api_key=api_key
        )

        response = (
            client.transactional_emails
            .send_transac_email(
                subject=
                    "Activate Your OES Account",

                html_content=
                    message_html,

                text_content=
                    message_text,

                sender=
                    SendTransacEmailRequestSender(
                        name=
                            "Online Examination System",

                        email=
                            sender_email,
                    ),

                to=[
                    SendTransacEmailRequestToItem(
                        email=
                            email,

                        name=
                            name,
                    )
                ],
            )
        )

        current_app.logger.info(
            "Activation email sent successfully. "
            "Message ID: %s",
            getattr(
                response,
                "message_id",
                None
            )
        )

    except Exception as error:

        current_app.logger.error(
            "Activation email could not be sent: %s",
            error
        )

        return (
            jsonify(
                {
                    "message":
                    "User created successfully, "
                    "but the activation email could not be sent.",

                    "user_id":
                    new_user_id,

                    "account_status":
                    "Pending",
                }
            ),
            201,
        )

    return (
        jsonify(
            {
                "message":
                "User created successfully. "
                "Activation email sent.",

                "user_id":
                new_user_id,

                "account_status":
                "Pending",
            }
        ),
        201,
    )


@auth_bp.route(
    "/login",
    methods=["POST"]
)
def login():

    data = request.get_json(
        silent=True
    )

    if not data:

        return jsonify(
            {
                "message":
                "Invalid request."
            }
        ), 400

    email = data.get("email")
    password = data.get("password")

    if not email or not password:

        return jsonify(
            {
                "message":
                "Email and password are required."
            }
        ), 400

    cur = mysql.connection.cursor()

    query = """
    SELECT
        user_id,
        name,
        email,
        password,
        role,
        is_active,
        account_status
    FROM users
    WHERE email = %s
    """

    cur.execute(
        query,
        (email,)
    )

    user = cur.fetchone()

    cur.close()

    if not user:

        return jsonify(
            {
                "message":
                "Invalid email or password"
            }
        ), 401

    if user[6] == "Pending":

        return (
            jsonify(
                {
                    "message":
                    "Your account has not been activated yet. "
                    "Please check your email for the activation link."
                }
            ),
            403,
        )

    stored_password = user[3]

    if not bcrypt.check_password_hash(
        stored_password,
        password
    ):

        return jsonify(
            {
                "message":
                "Invalid email or password"
            }
        ), 401

    if not user[5]:

        return (
            jsonify(
                {
                    "message":
                    "Your account has been deactivated. "
                    "Please contact the administrator."
                }
            ),
            403,
        )

    access_token = create_access_token(
        identity=str(user[0])
    )

    return (
        jsonify(
            {
                "message":
                "Login successful",

                "token":
                access_token,

                "user":
                {
                    "user_id":
                    user[0],

                    "name":
                    user[1],

                    "email":
                    user[2],

                    "role":
                    user[4],

                    "account_status":
                    user[6],
                },
            }
        ),
        200,
    )


@auth_bp.route(
    "/activate-account/<string:activation_token>",
    methods=["GET"]
)
def verify_activation_token(
    activation_token
):

    if not activation_token:

        return jsonify(
            {
                "message":
                "Invalid activation link."
            }
        ), 400

    cur = mysql.connection.cursor()

    query = """
    SELECT
        user_id,
        name,
        email,
        role,
        account_status,
        activation_token_expires_at,
        CASE
            WHEN activation_token_expires_at IS NOT NULL
                 AND activation_token_expires_at > UTC_TIMESTAMP()
            THEN 1
            ELSE 0
        END AS token_valid
    FROM users
    WHERE activation_token = %s
    """

    cur.execute(
        query,
        (activation_token,)
    )

    user = cur.fetchone()

    cur.close()

    if not user:

        return jsonify(
            {
                "message":
                "Invalid or expired activation link."
            }
        ), 400

    if user[4] == "Active":

        return jsonify(
            {
                "message":
                "This account has already been activated."
            }
        ), 400

    if not user[5] or not user[6]:

        return jsonify(
            {
                "message":
                "This activation link has expired. "
                "Please contact the administrator "
                "for a new activation link."
            }
        ), 400

    return jsonify(
        {
            "message":
            "Activation link is valid.",

            "user_id":
            user[0],

            "name":
            user[1],

            "email":
            user[2],

            "role":
            user[3],

            "account_status":
            user[4],
        }
    ), 200


@auth_bp.route(
    "/activate-account/<string:activation_token>",
    methods=["POST"]
)
def activate_account(
    activation_token
):

    data = request.get_json(
        silent=True
    )

    if not data:

        return jsonify(
            {
                "message":
                "Invalid request."
            }
        ), 400

    new_password = data.get(
        "password"
    )

    if not new_password:

        return jsonify(
            {
                "message":
                "Password is required."
            }
        ), 400

    if len(new_password) < 8:

        return jsonify(
            {
                "message":
                "Password must be at least 8 characters long."
            }
        ), 400

    cur = mysql.connection.cursor()

    query = """
    SELECT
        user_id,
        account_status
    FROM users
    WHERE activation_token = %s
      AND activation_token_expires_at > UTC_TIMESTAMP()
    """

    cur.execute(
        query,
        (activation_token,)
    )

    user = cur.fetchone()

    if not user:

        cur.close()

        return jsonify(
            {
                "message":
                "Invalid or expired activation link."
            }
        ), 400

    user_id = user[0]
    account_status = user[1]

    if account_status == "Active":

        cur.close()

        return jsonify(
            {
                "message":
                "This account has already been activated."
            }
        ), 400

    hashed_password = (
        bcrypt.generate_password_hash(
            new_password
        ).decode("utf-8")
    )

    update_query = """
    UPDATE users
    SET
        password = %s,
        account_status = 'Active',
        is_active = 1,
        activation_token = NULL,
        activation_token_expires_at = NULL
    WHERE user_id = %s
    """

    cur.execute(
        update_query,
        (
            hashed_password,
            user_id
        )
    )

    mysql.connection.commit()

    cur.close()

    return jsonify(
        {
            "message":
            "Account activated successfully. "
            "You can now login."
        }
    ), 200


@auth_bp.route(
    "/profile",
    methods=["GET"]
)
@jwt_required()
def profile():

    current_user_id = get_jwt_identity()

    cur = mysql.connection.cursor()

    query = """
    SELECT
        user_id,
        name,
        email,
        role,
        account_status
    FROM users
    WHERE user_id = %s
    """

    cur.execute(
        query,
        (current_user_id,)
    )

    user = cur.fetchone()

    cur.close()

    if not user:

        return jsonify(
            {
                "message":
                "User not found"
            }
        ), 404

    return (
        jsonify(
            {
                "user_id":
                user[0],

                "name":
                user[1],

                "email":
                user[2],

                "role":
                user[3],

                "account_status":
                user[4],
            }
        ),
        200,
    )


@auth_bp.route(
    "/admin-only",
    methods=["GET"]
)
@jwt_required()
@role_required("Admin")
def admin_only():

    return jsonify(
        {
            "message":
            "Welcome Admin!"
        }
    ), 200


@auth_bp.route(
    "/examiner-only",
    methods=["GET"]
)
@jwt_required()
@role_required(
    "Admin",
    "Examiner"
)
def examiner_only():

    return jsonify(
        {
            "message":
            "Welcome Examiner!"
        }
    ), 200


@auth_bp.route(
    "/users",
    methods=["GET"]
)
@jwt_required()
@role_required("Admin")
def get_users():

    cur = mysql.connection.cursor()

    query = """
    SELECT
        u.user_id,
        u.name,
        u.email,
        u.role,
        u.batch_id,
        b.batch_name,
        u.is_active,
        u.account_status
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
                "user_id":
                user[0],

                "name":
                user[1],

                "email":
                user[2],

                "role":
                user[3],

                "batch_id":
                user[4],

                "batch_name":
                user[5],

                "is_active":
                bool(user[6]),

                "account_status":
                user[7],
            }
        )

    return jsonify(
        user_list
    ), 200


@auth_bp.route(
    "/toggle-user-status/<int:user_id>",
    methods=["PUT"]
)
@jwt_required()
@role_required("Admin")
def toggle_user_status(
    user_id
):

    cur = mysql.connection.cursor()

    cur.execute(
        """
        SELECT
            role,
            is_active
        FROM users
        WHERE user_id = %s
        """,
        (user_id,)
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

    if user[0] == "Admin":

        cur.close()

        return jsonify(
            {
                "message":
                "Admin account status cannot be changed"
            }
        ), 403

    new_status = not bool(
        user[1]
    )

    cur.execute(
        """
        UPDATE users
        SET is_active = %s
        WHERE user_id = %s
        """,
        (
            new_status,
            user_id
        )
    )

    mysql.connection.commit()

    cur.close()

    return jsonify(
        {
            "message":
            (
                "User activated successfully"
                if new_status
                else
                "User deactivated successfully"
            ),

            "is_active":
            new_status,
        }
    ), 200


@auth_bp.route(
    "/delete-user/<int:user_id>",
    methods=["DELETE"]
)
@jwt_required()
@role_required("Admin")
def delete_user(
    user_id
):

    cur = mysql.connection.cursor()

    cur.execute(
        """
        SELECT
            role
        FROM users
        WHERE user_id = %s
        """,
        (user_id,)
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

    if user[0] == "Admin":

        cur.close()

        return jsonify(
            {
                "message":
                "Admin accounts cannot be deleted"
            }
        ), 403

    submission_query = """
    SELECT
        submission_id
    FROM submissions
    WHERE user_id = %s
    """

    cur.execute(
        submission_query,
        (user_id,)
    )

    submissions = cur.fetchall()

    for submission in submissions:

        delete_answers_query = """
        DELETE FROM answers
        WHERE submission_id = %s
        """

        cur.execute(
            delete_answers_query,
            (submission[0],)
        )

    delete_submissions_query = """
    DELETE FROM submissions
    WHERE user_id = %s
    """

    cur.execute(
        delete_submissions_query,
        (user_id,)
    )

    delete_user_query = """
    DELETE FROM users
    WHERE user_id = %s
    """

    cur.execute(
        delete_user_query,
        (user_id,)
    )

    mysql.connection.commit()

    cur.close()

    return jsonify(
        {
            "message":
            "User deleted successfully"
        }
    ), 200