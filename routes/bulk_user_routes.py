import os
import re
import secrets

import pandas as pd

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required

from extensions import mysql, bcrypt
from utils.decorators import role_required

from config import Config

from brevo import Brevo
from brevo.transactional_emails import (
    SendTransacEmailRequestSender,
    SendTransacEmailRequestToItem,
)


bulk_user_bp = Blueprint(
    "bulk_user",
    __name__,
)


@bulk_user_bp.route(
    "/admin/bulk-upload-users",
    methods=["POST"],
)
@jwt_required()
@role_required("Admin")
def bulk_upload_users():

    cur = mysql.connection.cursor()

    try:

        # ==========================================
        # Read Form Data
        # ==========================================

        role = request.form.get(
            "role"
        )

        uploaded_file = request.files.get(
            "file"
        )

        # ==========================================
        # Basic Validation
        # ==========================================

        allowed_roles = [
            "Candidate",
            "Examiner",
        ]

        if role not in allowed_roles:

            cur.close()

            return (
                jsonify(
                    {
                        "message":
                        "Invalid role selected. Choose Candidate or Examiner."
                    }
                ),
                400,
            )

        if not uploaded_file:

            cur.close()

            return (
                jsonify(
                    {
                        "message":
                        "Users file is required."
                    }
                ),
                400,
            )

        # ==========================================
        # Validate File Type
        # ==========================================

        file_name = (
            uploaded_file.filename or ""
        ).lower()

        if not file_name.endswith(".xlsx"):

            cur.close()

            return (
                jsonify(
                    {
                        "message":
                        "Only .xlsx Excel files are supported."
                    }
                ),
                400,
            )

        # ==========================================
        # Read Excel File
        # ==========================================

        try:

            dataframe = pd.read_excel(
                uploaded_file,
                engine="openpyxl",
            )

        except Exception as error:

            cur.close()

            return (
                jsonify(
                    {
                        "message":
                        "Unable to read the Excel file.",

                        "error":
                        str(error),
                    }
                ),
                400,
            )

        # ==========================================
        # Required Excel Format
        # ==========================================

        required_columns = [
            "Name",
            "Email",
        ]

        actual_columns = [
            str(column).strip()
            for column in dataframe.columns
        ]

        dataframe.columns = actual_columns

        if actual_columns != required_columns:

            cur.close()

            return (
                jsonify(
                    {
                        "message":
                        "Invalid users file format.",

                        "required_columns":
                        required_columns,
                    }
                ),
                400,
            )

        # ==========================================
        # Ensure File Contains Users
        # ==========================================

        if dataframe.empty:

            cur.close()

            return (
                jsonify(
                    {
                        "message":
                        "The uploaded file contains no users."
                    }
                ),
                400,
            )

        # ==========================================
        # Email Validation Pattern
        # ==========================================

        email_pattern = re.compile(
            r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
        )

        # ==========================================
        # Validate All Users First
        # ==========================================

        validated_users = []

        excel_emails = set()

        for index, row in dataframe.iterrows():

            excel_row_number = index + 2

            name = row[
                "Name"
            ]

            email = row[
                "Email"
            ]

            # ======================================
            # Missing Cell Validation
            # ======================================

            if (
                pd.isna(name)
                or pd.isna(email)
            ):

                cur.close()

                return (
                    jsonify(
                        {
                            "message":
                            f"Row {excel_row_number} contains empty required fields."
                        }
                    ),
                    400,
                )

            # ======================================
            # Normalize Values
            # ======================================

            name = str(
                name
            ).strip()

            email = str(
                email
            ).strip()

            # ======================================
            # Empty String Validation
            # ======================================

            if not name or not email:

                cur.close()

                return (
                    jsonify(
                        {
                            "message":
                            f"Row {excel_row_number} contains empty required fields."
                        }
                    ),
                    400,
                )

            # ======================================
            # Name Validation
            # ======================================

            if len(name) > 255:

                cur.close()

                return (
                    jsonify(
                        {
                            "message":
                            f"Name in row {excel_row_number} is too long."
                        }
                    ),
                    400,
                )

            # ======================================
            # Email Validation
            # ======================================

            if not email_pattern.match(
                email
            ):

                cur.close()

                return (
                    jsonify(
                        {
                            "message":
                            f"Invalid email address in row {excel_row_number}."
                        }
                    ),
                    400,
                )

            # ======================================
            # Duplicate Email Inside Excel
            # ======================================

            normalized_email = email.lower()

            if normalized_email in excel_emails:

                cur.close()

                return (
                    jsonify(
                        {
                            "message":
                            f"Duplicate email found in row {excel_row_number}: {email}."
                        }
                    ),
                    409,
                )

            excel_emails.add(
                normalized_email
            )

            # ======================================
            # Store Validated User
            # ======================================

            validated_users.append(
                {
                    "name":
                    name,

                    "email":
                    email,
                }
            )

        # ==========================================
        # Check Existing Users in Database
        # ==========================================

        for user in validated_users:

            check_query = """
            SELECT user_id
            FROM users
            WHERE LOWER(email) = %s
            """

            cur.execute(
                check_query,
                (
                    user["email"].lower(),
                ),
            )

            existing_user = cur.fetchone()

            if existing_user:

                cur.close()

                return (
                    jsonify(
                        {
                            "message":
                            f"Email already registered: {user['email']}"
                        }
                    ),
                    409,
                )

        # ==========================================
        # Prepare Insert Query
        # ==========================================

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

        # ==========================================
        # Create Users
        # ==========================================

        created_users = []

        for user in validated_users:

            activation_token = (
                secrets.token_urlsafe(32)
            )

            temporary_password = (
                secrets.token_urlsafe(32)
            )

            hashed_password = (
                bcrypt.generate_password_hash(
                    temporary_password
                ).decode("utf-8")
            )

            cur.execute(
                insert_query,
                (
                    user["name"],
                    user["email"],
                    hashed_password,
                    role,
                    True,
                    "Pending",
                    activation_token,
                ),
            )

            new_user_id = cur.lastrowid

            created_users.append(
                {
                    "user_id":
                    new_user_id,

                    "name":
                    user["name"],

                    "email":
                    user["email"],

                    "role":
                    role,

                    "activation_token":
                    activation_token,
                }
            )

        # ==========================================
        # Commit All Users
        # ==========================================

        mysql.connection.commit()

        # ==========================================
        # Send Activation Emails
        # ==========================================

        emails_sent = 0

        emails_failed = 0

        api_key = os.getenv(
            "BREVO_API_KEY"
        )

        sender_email = os.getenv(
            "BREVO_SENDER_EMAIL",
            "oes.activation@gmail.com"
        )

        if not api_key:

            current_app.logger.error(
                "BREVO_API_KEY is missing from environment variables."
            )

            emails_failed = len(
                created_users
            )

        else:

            client = Brevo(
                api_key=api_key
            )

            for user in created_users:

                try:

                    activation_link = (
                        f"{Config.FRONTEND_URL}"
                        f"/activate-account/"
                        f"{user['activation_token']}"
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
            Hello <strong>{user["name"]}</strong>,
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
                {user["email"]}
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
Hello {user["name"]},

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
                                        user["email"],

                                    name=
                                        user["name"],
                                )
                            ],
                        )
                    )

                    current_app.logger.info(
                        "Activation email sent successfully to %s. "
                        "Message ID: %s",
                        user["email"],
                        getattr(
                            response,
                            "message_id",
                            None
                        ),
                    )

                    emails_sent += 1

                except Exception as error:

                    emails_failed += 1

                    current_app.logger.error(
                        "Activation email could not be sent to %s: %s",
                        user["email"],
                        error,
                    )

        # ==========================================
        # Close Cursor
        # ==========================================

        cur.close()

        # ==========================================
        # Final Response
        # ==========================================

        if emails_failed == 0:

            message = (
                f"{len(created_users)} user(s) created successfully. "
                f"Activation email sent to all users."
            )

        else:

            message = (
                f"{len(created_users)} user(s) created successfully. "
                f"{emails_sent} activation email(s) sent and "
                f"{emails_failed} email(s) could not be sent."
            )

        return (
            jsonify(
                {
                    "message":
                    message,

                    "users_created":
                    len(created_users),

                    "emails_sent":
                    emails_sent,

                    "emails_failed":
                    emails_failed,

                    "role":
                    role,
                }
            ),
            201,
        )

    except Exception as error:

        mysql.connection.rollback()

        cur.close()

        current_app.logger.error(
            "Bulk user upload error: %s",
            error,
        )

        return (
            jsonify(
                {
                    "message":
                    "Unable to upload users."
                }
            ),
            500,
        )