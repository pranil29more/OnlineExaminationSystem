# import os
# import resend
# from dotenv import load_dotenv

# load_dotenv()

# resend.api_key = os.getenv("RESEND_API_KEY")

# response = resend.Emails.send({
#     "from": "onboarding@resend.dev",
#     "to": ["pranil.more290803@gmail.com"],
#     "subject": "OES Resend Test",
#     "html": """
#     <h2>Online Examination System</h2>
#     <p>This is a test email from the OES backend.</p>
#     <p>Resend email integration is working successfully.</p>
#     """
# })

# print("Email sent successfully!")
# print(response)