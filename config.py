import os


class Config:

    MYSQL_HOST = os.getenv("MYSQL_HOST")
    MYSQL_USER = os.getenv("MYSQL_USER")
    MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")
    MYSQL_DB = os.getenv("MYSQL_DB")
    MYSQL_PORT = int(os.getenv("MYSQL_PORT"))

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

    FRONTEND_URL = os.getenv("FRONTEND_URL")

    BREVO_API_KEY = os.getenv("BREVO_API_KEY")
    BREVO_SENDER_EMAIL = os.getenv("BREVO_SENDER_EMAIL")
    BREVO_SENDER_NAME = os.getenv(
        "BREVO_SENDER_NAME",
        "Online Examination System"
    )