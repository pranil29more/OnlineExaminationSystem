# Online Examination System (OES)

## 1. Project Overview

The Online Examination System (OES) is a web-based examination management platform designed to manage the complete examination lifecycle in a centralized system.

The system provides separate functionality for administrators, examiners, and candidates. It supports user authentication, batch management, examination creation, question management, assessment scheduling, exam sessions, automatic evaluation, result analysis, candidate performance tracking, email communication, and an AI-powered assistant.

The application is designed to simplify examination administration while providing candidates with a structured and secure environment for taking online assessments.

---

## 2. Key Features

### Authentication and Authorization

- Secure user authentication using JWT.
- Role-based access control.
- Separate access permissions for Admin, Examiner, and Candidate users.
- Password hashing using Bcrypt.
- Protected backend API routes.

### Admin Features

- Manage users and candidates.
- Manage batches.
- View examination statistics.
- Monitor candidate performance.
- View submission analytics.
- View candidate results.
- View assessment schedules.
- Access the AI Assistant.
- Manage examination-related data.

### Examiner Features

- Create and manage examinations.
- Create and manage questions.
- Schedule assessments.
- Assign assessments to batches or candidates.
- Review examination-related information.

### Candidate Features

- Access assigned assessments.
- Participate in scheduled examinations.
- Submit answers.
- Receive evaluated results.
- View examination performance where permitted.

### Examination Management

- Support for Practice and Actual examinations.
- Configurable examination duration.
- Configurable total marks.
- Configurable passing marks.
- Question management.
- Answer submission.
- Automatic evaluation.
- Score calculation.

### Scheduling

Assessments can be scheduled for:

- Specific batches.
- Individual candidates.

The system determines whether an assessment is:

- Upcoming
- Available
- Ended

### Performance Analytics

The system provides:

- Average performance.
- Highest score.
- Lowest score.
- Pass rate.
- Candidate performance.
- Batch performance.
- Examination performance.
- Passed and failed assessment counts.
- Top-performing candidates.

### AI Assistant

The system includes an AI Assistant powered by Google Gemini.

The assistant can:

- Answer educational questions.
- Explain programming and academic concepts.
- Provide programming examples.
- Retrieve examination-system information through backend database queries.
- Provide candidate information and performance.
- Provide batch information and performance.
- Provide examination information.
- Provide scheduling information.
- Provide examination and submission analytics.

Database-related requests are handled directly by the backend to prevent the AI model from fabricating system information.

---

## 3. Technology Stack

### Frontend

- React
- React DOM
- React Router DOM
- Vite
- React Markdown
- Remark GFM
- React Icons
- React Hot Toast
- NProgress

### Backend

- Python
- Flask
- Flask-JWT-Extended
- Flask-Bcrypt
- Flask-CORS
- Flask-SQLAlchemy
- Flask-MySQLdb
- MySQL Client
- Gunicorn
- Python-dotenv

### Database

- MySQL
- Aiven

### AI Integration

- Google Gemini API
- `google-genai`

### Email Integration

- Brevo API

### Data Processing

- Pandas
- OpenPyXL

### Deployment

- Frontend: Vercel
- Backend: Render
- Database: Aiven

---

## 4. System Architecture

The application follows a client-server architecture.

The frontend is developed using React and communicates with the Flask backend through REST APIs.

The Flask backend handles:

- Authentication
- Authorization
- Business logic
- Database operations
- Examination processing
- Evaluation
- Analytics
- Scheduling
- AI Assistant requests
- Email-related operations

The backend communicates with the MySQL database hosted on Aiven.

The AI Assistant communicates with Google Gemini for educational queries while database-related queries are processed directly using backend database functions.

The general architecture is:

    User
      |
      v
    React Frontend
      |
      v
    Flask REST API
      |
      +--------------------+
      |                    |
      v                    v
    MySQL Database       Gemini API
      |                    |
      v                    v
    Aiven                AI Assistant

Email-related functionality is integrated through Brevo.

---

## 5. Deployment Architecture

The production deployment uses separate services for the frontend, backend, and database.

### Frontend

The React frontend is deployed on:

**Vercel**

### Backend

The Flask backend is deployed on:

**Render**

Gunicorn is used as the production WSGI server.

### Database

The MySQL database is hosted on:

**Aiven**

### External Services

The application also integrates with:

- Google Gemini API for AI functionality.
- Brevo API for email functionality.

---

## 6. User Roles

### Admin

The Admin has system-level access and can:

- Manage users.
- Manage candidates.
- Manage batches.
- View examinations.
- View system statistics.
- View analytics.
- View candidate performance.
- View batch performance.
- View schedules.
- Use the AI Assistant.

### Examiner

The Examiner is responsible for examination-related operations such as:

- Creating examinations.
- Managing questions.
- Scheduling assessments.
- Assigning assessments.

### Candidate

The Candidate can:

- Access assigned examinations.
- Attempt examinations.
- Submit answers.
- View applicable results and performance information.

---

## 7. Major Backend Modules

The backend is organized into route modules.

### `auth_routes.py`

Handles authentication and user-related authentication operations.

### `batch_routes.py`

Handles batch creation, management, and batch-related operations.

### `bulk_question_routes.py`

Handles bulk question-related operations.

### `bulk_user_routes.py`

Handles bulk user-related operations.

### `dashboard_routes.py`

Provides dashboard-related information and statistics.

### `exam_routes.py`

Handles examination creation, management, and examination-related operations.

### `result_routes.py`

Handles examination result and result-related operations.

### `schedule_routes.py`

Handles assessment scheduling and scheduling-related operations.

### `submission_routes.py`

Handles candidate submissions and answer evaluation-related operations.

### `ai_routes.py`

Provides the Admin AI Assistant.

The AI Assistant supports both:

1. Educational questions handled using Google Gemini.
2. Online Examination System questions handled directly through backend database queries.

---

## 8. AI Assistant Architecture

The AI Assistant uses an intent-based approach.

Incoming user questions are first normalized and analyzed by the backend.

The system identifies whether the request relates to information stored in the examination system.

Examples include:

- Candidate information.
- Candidate count.
- Candidate performance.
- Batch information.
- Batch performance.
- Examination information.
- Examination analytics.
- Submission analytics.
- Assessment schedules.
- Dashboard statistics.

When the question is related to the OES database, the backend retrieves the required information directly from MySQL.

For general educational questions, the request is sent to Google Gemini.

This approach prevents the AI model from inventing database information.

The simplified flow is:

    User Question
          |
          v
    Intent Detection
          |
       +--+--+
       |     |
       v     v
    OES DB  Educational
    Query    Query
       |       |
       v       v
    MySQL    Gemini
       |       |
       +---+---+
           |
           v
        Response

---

## 9. Database Schema

The OES uses a MySQL relational database.

The major tables are:

### 1. `users`

Stores user account and role information.

Important columns include:

- `user_id`
- `name`
- `email`
- `password`
- `role`
- `batch_id`

---

### 2. `batches`

Stores candidate batch information.

Important columns include:

- `batch_id`
- `batch_name`
- `technology`
- `trainer_name`
- `start_date`
- `end_date`

---

### 3. `exams`

Stores examination definitions.

Important columns include:

- `exam_id`
- `title`
- `duration`
- `total_marks`
- `passing_marks`
- `exam_type`
- `created_by`

---

### 4. `questions`

Stores examination questions.

The table contains question information associated with examinations and their respective options/answer data.

---

### 5. `options`

Stores answer options associated with examination questions.

---

### 6. `submissions`

Stores candidate examination submissions and scores.

Important columns referenced by the application include:

- `submission_id`
- `user_id`
- `exam_id`
- `score`

---

### 7. `answers`

Stores candidate answers submitted during examination sessions.

Answer records are associated with the relevant submission/question information.

---

### 8. `assessment_schedules`

Stores scheduled assessment information.

Important columns include:

- `schedule_id`
- `exam_id`
- `batch_id`
- `candidate_id`
- `scheduled_start`
- `scheduled_end`

---

### Database Relationships

The major relationships are:

- A user can belong to a batch.
- A batch can contain multiple candidates.
- An examination can contain multiple questions.
- A question can contain multiple options.
- A candidate can have multiple submissions.
- A submission belongs to an examination.
- A candidate can submit answers for an examination.
- An examination can have multiple schedules.
- A schedule can target a batch or an individual candidate.

---

## 10. Examination Evaluation

The system evaluates candidate submissions using the configured examination marks and passing marks.

Candidate performance is calculated using:

    Percentage =
    (Score × 100) / Total Marks

The system can calculate:

- Average percentage.
- Highest percentage.
- Lowest percentage.
- Passed assessments.
- Failed assessments.

Pass/fail status is determined using the configured passing marks for the examination.

---

## 11. Batch Performance Analytics

The system provides batch-level analytics including:

- Number of candidates.
- Total submissions.
- Average percentage.
- Highest percentage.
- Lowest percentage.
- Overall pass rate.
- Examination-wise performance.
- Candidate-wise performance.
- Passed candidates.
- Failed candidates.
- Top performers.
- Lowest performers.

This allows administrators to evaluate the overall performance of a training batch.

---

## 12. Assessment Scheduling

Assessments can be scheduled for either:

- A complete batch.
- An individual candidate.

Each schedule contains a start and end time.

The application determines the schedule status based on the current time:

### Upcoming

The assessment has not started yet.

### Available

The assessment is currently within its scheduled time window.

### Ended

The scheduled end time has passed.

---

## 13. Authentication and Security

The backend uses JWT-based authentication for protected API endpoints.

Role-based authorization ensures that users can only access operations permitted for their role.

Passwords are protected using Bcrypt hashing.

Environment variables are used for sensitive configuration values such as:

- Database credentials.
- JWT secret.
- Gemini API key.
- Brevo API key.
- Frontend URL.

Sensitive environment files are excluded from version control.

The repository contains `.env.example` as a configuration template.

**Actual credentials must never be committed to GitHub.**

---

## 14. Environment Configuration

Create a `.env` file in the backend/root project directory using `.env.example` as a reference.

Example structure:

    MYSQL_HOST=
    MYSQL_USER=
    MYSQL_PASSWORD=
    MYSQL_DB=
    MYSQL_PORT=

    JWT_SECRET_KEY=

    GEMINI_API_KEY=
    GEMINI_MODEL=gemini-3.5-flash

    FRONTEND_URL=

    BREVO_API_KEY=
    BREVO_SENDER_EMAIL=
    BREVO_SENDER_NAME=

Actual values are environment-specific and are not included in this repository.

For production deployment, the required environment variables are configured through the hosting platform.

---

## 15. Local Backend Setup

Clone the repository and navigate to the project directory.

Create a Python virtual environment:

    python -m venv venv

Activate the virtual environment on Windows:

    venv\Scripts\activate

Install the required dependencies:

    pip install -r requirements.txt

Configure the required environment variables using `.env.example`.

Start the Flask application:

    python app.py

For production deployment, Gunicorn is used as the WSGI server.

---

## 16. Local Frontend Setup

Navigate to the frontend directory:

    cd frontend

Install dependencies:

    npm install

Start the Vite development server:

    npm run dev

The frontend communicates with the configured Flask backend API.

---

## 17. Frontend Build

To create a production build:

    npm run build

To preview the production build locally:

    npm run preview

---

## 18. Project Structure

    OnlineExaminationSystem/
    |
    +-- frontend/
    |   +-- src/
    |   +-- public/
    |   +-- package.json
    |   +-- package-lock.json
    |   +-- vite.config.js
    |
    +-- routes/
    |   +-- auth_routes.py
    |   +-- batch_routes.py
    |   +-- bulk_question_routes.py
    |   +-- bulk_user_routes.py
    |   +-- dashboard_routes.py
    |   +-- exam_routes.py
    |   +-- result_routes.py
    |   +-- schedule_routes.py
    |   +-- submission_routes.py
    |   +-- ai_routes.py
    |
    +-- utils/
    |   +-- decorators.py
    |
    +-- app.py
    +-- extensions.py
    +-- requirements.txt
    +-- .env.example
    +-- .gitignore
    +-- README.md

---

## 19. Important Dependencies

The backend uses the following major Python packages:

- Flask
- Flask-Bcrypt
- Flask-CORS
- Flask-JWT-Extended
- Flask-MySQLdb
- Flask-SQLAlchemy
- MySQL Client
- SQLAlchemy
- Gunicorn
- Python-dotenv
- Google GenAI
- Pandas
- OpenPyXL
- Brevo Python SDK

The frontend uses React with Vite and supporting libraries for routing, Markdown rendering, icons, notifications, and progress indication.

---

## 20. Production Environment

The deployed OES uses:

    Frontend
    Vercel

    Backend
    Render

    Database
    Aiven

    AI Service
    Google Gemini

    Email Service
    Brevo

The frontend communicates with the deployed Flask backend through the configured backend API URL.

The backend connects to the production MySQL database hosted by Aiven.

---

## 21. Handover Notes

For project handover:

- The complete source code is available in this repository.
- `.env.example` is provided as an environment configuration template.
- Actual environment credentials are intentionally excluded from version control.
- Production environment variables are maintained separately on the deployment platform.
- The frontend is deployed on Vercel.
- The backend is deployed on Render.
- The MySQL database is hosted on Aiven.
- Google Gemini is used for educational AI responses.
- Brevo is used for email-related functionality.

Before running the project in another environment, configure the required environment variables and database connection details.

---

## 22. Project Objective

The primary objective of the Online Examination System is to provide a centralized platform for conducting and managing online assessments while reducing manual examination administration.

The system integrates examination creation, candidate management, scheduling, evaluation, result analysis, communication, and AI-assisted information retrieval into a single application.

---

## 23. Conclusion

The Online Examination System provides an end-to-end solution for online examination management.

It combines a React-based frontend, Flask backend, MySQL database, JWT authentication, automated evaluation, performance analytics, scheduling, email integration, and an AI Assistant into a unified web application.

The deployed architecture separates the frontend, backend, and database services, allowing each component to be independently maintained and deployed.
