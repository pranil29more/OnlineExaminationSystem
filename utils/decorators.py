from functools import wraps

from flask import jsonify
from flask_jwt_extended import get_jwt_identity

from extensions import mysql


def role_required(*allowed_roles):

    def decorator(function):

        @wraps(function)
        def wrapper(*args, **kwargs):

            current_user_id = get_jwt_identity()

            cur = mysql.connection.cursor()

            query = """
            SELECT role
            FROM users
            WHERE user_id = %s
            """

            cur.execute(
                query,
                (current_user_id,),
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

            role = user[0]

            if role not in allowed_roles:

                return jsonify(
                    {
                        "message":
                            "Access denied."
                    }
                ), 403

            return function(
                *args,
                **kwargs
            )

        return wrapper

    return decorator