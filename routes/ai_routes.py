from flask import Blueprint

import os
from google import genai

from flask import request, jsonify

ai_bp = Blueprint(
    "ai",
    __name__
)

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


@ai_bp.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json(silent=True)

        if not data:
            return jsonify({
                "error": "Invalid request."
            }), 400

        user_message = data.get("message")

        if not user_message or not user_message.strip():
            return jsonify({
                "error": "Message cannot be empty."
            }), 400

        system_prompt = f"""
        You are an AI Examination Assistant for an Online Examination System.
        
        Your responsibilities are:
        - Help students understand concepts related to their studies.
        - Explain topics in a simple and educational manner.
        - Answer academic and examination-related questions.
        - Provide guidance without encouraging cheating.
        - If a question is unrelated to education or examinations, politely inform the user that you are designed to assist only with learning and exam-related topics.
        
        Student Question:
        {user_message}
        """
        
        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=system_prompt
        )

        return jsonify({
            "response": response.text
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500