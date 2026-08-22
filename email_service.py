from flask_mail import Mail, Message

from config import Config


mail = Mail()


def send_activation_email(
    recipient_email,
    recipient_name,
    activation_link
):

    message = Message(
        subject="Activate Your OES Account",
        recipients=[
            recipient_email
        ],
        sender=Config.MAIL_USERNAME,
    )

    message.body = f"""
Hello {recipient_name},

Your account has been created in the Online Examination System.

Please activate your account using the link below:

{activation_link}

This activation link will expire in 24 hours.

If you did not expect this email, please contact the administrator.

Regards,
Online Examination System
"""

    mail.send(message)