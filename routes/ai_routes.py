from flask import Blueprint

import os
from google import genai

from flask_jwt_extended import jwt_required
from extensions import mysql

from flask import request, jsonify

ai_bp = Blueprint("ai", __name__)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def get_all_exams():

    cur = mysql.connection.cursor()

    query = """
    SELECT
        exam_id,
        title,
        duration,
        total_marks,
        passing_marks,
        created_by
    FROM exams
    ORDER BY exam_id DESC
    """

    cur.execute(query)

    exams = cur.fetchall()

    cur.close()

    return exams


def search_exam(user_message):

    cur = mysql.connection.cursor()

    query = """
    SELECT
        exam_id,
        title,
        duration,
        total_marks,
        passing_marks,
        created_by
    FROM exams
    """

    cur.execute(query)

    exams = cur.fetchall()

    cur.close()

    question = user_message.lower()

    best_match = None

    highest_score = 0

    for exam in exams:

        title = exam[1].lower()

        score = 0

        for word in title.split():

            if len(word) > 2 and word in question:

                score += 1

        if score > highest_score:

            highest_score = score

            best_match = exam

    return best_match


def build_exam_context(exam):

    if not exam:

        return ""

    return f"""
Exam Details

Exam ID: {exam[0]}
Title: {exam[1]}
Duration: {exam[2]} minutes
Total Marks: {exam[3]}
Passing Marks: {exam[4]}
Created By: {exam[5]}
"""


def build_all_exam_context():

    exams = get_all_exams()

    if not exams:

        return "There are currently no exams available."

    context = "Available Exams:\n\n"

    for exam in exams:

        context += (
            f"Title: {exam[1]}\n"
            f"Duration: {exam[2]} minutes\n"
            f"Total Marks: {exam[3]}\n"
            f"Passing Marks: {exam[4]}\n\n"
        )

    return context


def detect_exam_intent(user_message):

    question = user_message.lower()

    list_keywords = [
        "list",
        "show",
        "available",
        "all exams",
        "all exam",
        "display exams",
    ]

    exam_keywords = [
        "exam",
        "test",
        "duration",
        "marks",
        "passing",
        "created",
        "creator",
    ]

    if any(keyword in question for keyword in list_keywords):
        return "list_exams"

    if any(keyword in question for keyword in exam_keywords):
        return "exam_details"

    return "educational"


@ai_bp.route("/chat", methods=["POST"])
@jwt_required()
def chat():
    try:

        data = request.get_json(silent=True)

        if not data:
            return jsonify({"error": "Invalid request."}), 400

        user_message = data.get("message", "").strip()

        if not user_message:
            return jsonify({"error": "Message cannot be empty."}), 400

        intent = detect_exam_intent(user_message)

        exam_context = ""

        if intent == "list_exams":

            exam_context = build_all_exam_context()

        elif intent == "exam_details":

            exam = search_exam(user_message)

            if exam:

                exam_context = build_exam_context(exam)

            else:

                exam_context = (
                    "The requested exam was not found in the "
                    "Online Examination System."
                )

        system_prompt = f"""
You are the AI Examination Assistant for an Online Examination System.

Your responsibilities are:

1. Help students with questions related to the Online Examination System.
2. Answer educational questions on programming, databases, networking, AI, cybersecurity and other academic subjects.

Instructions:

• If Exam Context is provided, use ONLY the information from that context when answering exam-related questions.
• Never invent exam titles, durations, marks, passing marks or any other exam details.
• If the requested exam is not found in the provided context, politely inform the user that it is not available.
• If the user asks to list available exams, list every exam present in the provided context.
• If the user's question is educational and does not require database information, answer normally as an educational AI tutor.
• Never promote or assist cheating during examinations.
• Keep answers concise, accurate, professional and easy for students to understand.
• If no exam context is available and the question is not educational, politely ask the user to clarify their request.

Exam Context:
{exam_context}

Student Question:
{user_message}
"""

        response = client.models.generate_content(
            model="gemini-3.5-flash", contents=system_prompt
        )

        return jsonify({"response": response.text}), 200

    except Exception as e:

        import traceback

        traceback.print_exc()

        return jsonify({"error": str(e)}), 500
