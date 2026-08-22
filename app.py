from dotenv import load_dotenv

load_dotenv(dotenv_path=".env")

from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS

from config import Config
from extensions import mysql, bcrypt
from email_service import mail

from datetime import timedelta


app = Flask(__name__)


CORS(
    app,
    origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    methods=[
        "GET",
        "POST",
        "PUT",
        "DELETE",
        "OPTIONS"
    ],
    allow_headers=[
        "Content-Type",
        "Authorization"
    ]
)


app.config["MYSQL_HOST"] = Config.MYSQL_HOST
app.config["MYSQL_USER"] = Config.MYSQL_USER
app.config["MYSQL_PASSWORD"] = Config.MYSQL_PASSWORD
app.config["MYSQL_DB"] = Config.MYSQL_DB
app.config["MYSQL_PORT"] = Config.MYSQL_PORT
app.config["MYSQL_SSL_MODE"] = "REQUIRED"
app.config["MYSQL_SSL_CA"] = "ca.pem"

app.config["JWT_SECRET_KEY"] = Config.JWT_SECRET_KEY
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=365)


app.config["MAIL_SERVER"] = Config.MAIL_SERVER
app.config["MAIL_PORT"] = Config.MAIL_PORT
app.config["MAIL_USE_TLS"] = Config.MAIL_USE_TLS
app.config["MAIL_USERNAME"] = Config.MAIL_USERNAME
app.config["MAIL_PASSWORD"] = Config.MAIL_PASSWORD
app.config["MAIL_DEFAULT_SENDER"] = Config.MAIL_USERNAME


mysql.init_app(app)

mail.init_app(app)

print("MYSQL_DB:", app.config["MYSQL_DB"])
print("MYSQL_PORT:", app.config["MYSQL_PORT"])


bcrypt.init_app(app)


jwt = JWTManager(app)


from routes.auth_routes import auth_bp
from routes.exam_routes import exam_bp
from routes.submission_routes import submission_bp
from routes.result_routes import result_bp
from routes.dashboard_routes import dashboard_bp
from routes.batch_routes import batch_bp
from routes.ai_routes import ai_bp

from routes.schedule_routes import schedule_bp
from routes.bulk_question_routes import bulk_question_bp


app.register_blueprint(auth_bp)
app.register_blueprint(exam_bp)
app.register_blueprint(submission_bp)
app.register_blueprint(result_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(batch_bp)
app.register_blueprint(ai_bp)

app.register_blueprint(schedule_bp)
app.register_blueprint(bulk_question_bp)


@app.route("/")
def home():

    return "Online Examination System API Running"


if __name__ == "__main__":

    app.run(debug=True)