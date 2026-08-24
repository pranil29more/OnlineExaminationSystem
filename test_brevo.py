import os
from dotenv import load_dotenv
from brevo import Brevo
from brevo.core.api_error import ApiError
from brevo.transactional_emails import (
    SendTransacEmailRequestSender,
    SendTransacEmailRequestToItem,
)

load_dotenv()

api_key = os.getenv("BREVO_API_KEY")

if not api_key:
    raise Exception("BREVO_API_KEY is missing from .env")

client = Brevo(api_key=api_key)

try:
    response = client.transactional_emails.send_transac_email(
        sender=SendTransacEmailRequestSender(
            name="Online Examination System",
            email="oes.activation@gmail.com"
        ),
        to=[
            SendTransacEmailRequestToItem(
                email="pranil.more290803@gmail.com",
                name="Pranil More"
            )
        ],
        subject="OES Brevo Test",
        html_content="""
        <h2>Online Examination System</h2>
        <p>This is a test email from the OES backend.</p>
        <p>Brevo email integration is working successfully.</p>
        """
    )

    print("EMAIL SENT SUCCESSFULLY!")
    print(response)

except ApiError as error:
    print("BREVO ERROR:")
    print("Status:", error.status_code)
    print("Body:", error.body)