from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import mysql
from utils.decorators import role_required
from services.modal_executor import run_code


coding_bp = Blueprint(
    "coding",
    __name__,
)


# ==========================================================
# CONFIGURATION
# ==========================================================

# Maximum execution time for one test case.
#
# coding_questions table does not contain a time_limit
# column, so we use a fixed value.
DEFAULT_TIME_LIMIT = 5


# ==========================================================
# HELPERS
# ==========================================================

def normalize_output(value):
    """
    Normalize program output before comparing it with the
    expected test-case output.

    Leading/trailing whitespace and newlines are ignored.
    """

    if value is None:
        return ""

    return str(value).strip()


def build_test_source(source_code, input_data):
    """
    Inject test-case input into the submitted Python program.

    Example submitted code:

        n = int(input())
        print(n * 2)

    If input_data is:

        5

    the executor effectively runs:

        sys.stdin = io.StringIO("5")
    """

    if input_data is None:
        input_data = ""

    # repr() safely handles:
    # - quotes
    # - backslashes
    # - newlines
    # - tabs
    # - special characters
    input_literal = repr(str(input_data))

    prefix = f"""
import sys
import io

sys.stdin = io.StringIO({input_literal})
"""

    return prefix + "\n" + source_code


def execute_test_cases(
    source_code,
    language,
    time_limit,
    test_cases,
):
    """
    Execute submitted code against all supplied test cases.

    This function is INTERNAL.

    It may contain hidden-test information because the submit
    endpoint needs it for scoring.

    Hidden information must NEVER be sent directly to the
    candidate.

    Returns:

        {
            "results": [...],
            "passed_tests": int,
            "total_tests": int
        }
    """

    results = []
    passed_tests = 0

    for test_case in test_cases:

        # --------------------------------------------------
        # test_cases table:
        #
        # test_case_id
        # coding_question_id
        # input_data
        # expected_output
        # is_hidden
        # --------------------------------------------------

        test_case_id = test_case[0]
        input_data = test_case[1]
        expected_output = test_case[2]
        is_hidden = test_case[3]

        # --------------------------------------------------
        # Build executable source.
        # --------------------------------------------------

        test_source = build_test_source(
            source_code,
            input_data,
        )

        # --------------------------------------------------
        # Execute through Modal executor.
        # --------------------------------------------------

        result = run_code(
            source_code=test_source,
            language=language,
            time_limit=time_limit,
        )

        # --------------------------------------------------
        # Normalize output.
        # --------------------------------------------------

        actual_output = normalize_output(
            result.get("stdout")
        )

        expected = normalize_output(
            expected_output
        )

        # --------------------------------------------------
        # Test passes only when:
        #
        # 1. Execution was successful
        # 2. Output exactly matches expected output
        # --------------------------------------------------

        passed = (
            result.get("status") == "SUCCESS"
            and actual_output == expected
        )

        if passed:
            passed_tests += 1

        # --------------------------------------------------
        # Internal result.
        #
        # IMPORTANT:
        #
        # This object MUST NOT be returned directly to the
        # candidate for hidden tests.
        # --------------------------------------------------

        results.append(
            {
                "test_case_id": test_case_id,
                "passed": passed,
                "status": result.get("status"),
                "stdout": result.get("stdout", ""),
                "stderr": result.get("stderr", ""),
                "execution_time": result.get(
                    "execution_time"
                ),
                "hidden": bool(is_hidden),
            }
        )

        # --------------------------------------------------
        # Stop on system-level executor failure.
        # --------------------------------------------------

        if result.get("status") == "SYSTEM_ERROR":
            break

    return {
        "results": results,
        "passed_tests": passed_tests,
        "total_tests": len(test_cases),
    }


def build_visible_results(execution):
    """
    Build safe results for the candidate.

    Only visible tests are allowed to appear here.

    The function deliberately does NOT expose:
        - hidden test input
        - hidden expected output
        - hidden stdout
        - hidden stderr
        - hidden test IDs
        - hidden execution details
    """

    visible_results = []

    for result in execution["results"]:

        if result.get("hidden"):
            continue

        visible_results.append(
            {
                "test_case_id":
                    result.get("test_case_id"),

                "passed":
                    result.get("passed"),

                "status":
                    result.get("status"),

                "stdout":
                    result.get("stdout", ""),

                "stderr":
                    result.get("stderr", ""),

                "execution_time":
                    result.get("execution_time"),
            }
        )

    return visible_results


def build_submission_output(execution):
    """
    Build aggregate stdout/stderr values for storage in the
    code_submissions table.

    The database has stdout and stderr columns, but it does
    NOT have an execution_time column.

    We therefore store combined output/error text.

    This information stays in the backend/database and is
    not returned as hidden-test details to the candidate.
    """

    stdout_parts = []
    stderr_parts = []

    for result in execution["results"]:

        stdout = result.get("stdout")
        stderr = result.get("stderr")

        if stdout:
            stdout_parts.append(
                str(stdout)
            )

        if stderr:
            stderr_parts.append(
                str(stderr)
            )

    combined_stdout = "\n".join(
        stdout_parts
    )

    combined_stderr = "\n".join(
        stderr_parts
    )

    return (
        combined_stdout,
        combined_stderr,
    )


# ==========================================================
# GET CODING QUESTION
# ==========================================================

@coding_bp.route(
    "/coding/question/<int:coding_question_id>",
    methods=["GET"],
)
@jwt_required()
@role_required("Candidate")
def get_coding_question(coding_question_id):

    current_user_id = get_jwt_identity()

    cur = mysql.connection.cursor()

    try:

        # --------------------------------------------------
        # Find candidate's active exam submission.
        #
        # The coding question must belong to the same exam.
        # --------------------------------------------------

        submission_query = """
        SELECT
            s.submission_id,
            s.exam_id,
            s.status
        FROM submissions s
        JOIN coding_questions cq
            ON cq.exam_id = s.exam_id
        WHERE
            s.user_id = %s
            AND s.status = 'In Progress'
            AND cq.coding_question_id = %s
        ORDER BY
            s.submission_id DESC
        LIMIT 1
        """

        cur.execute(
            submission_query,
            (
                current_user_id,
                coding_question_id,
            ),
        )

        submission = cur.fetchone()

        if not submission:

            return jsonify(
                {
                    "message":
                        "No active exam submission found for this coding question."
                }
            ), 403

        # --------------------------------------------------
        # Fetch coding question.
        #
        # Actual coding_questions structure:
        #
        # coding_question_id
        # exam_id
        # question_text
        # difficulty
        # marks
        # starter_code
        # language
        # created_at
        # --------------------------------------------------

        question_query = """
        SELECT
            coding_question_id,
            exam_id,
            question_text,
            difficulty,
            marks,
            starter_code,
            language
        FROM coding_questions
        WHERE
            coding_question_id = %s
            AND exam_id = %s
        """

        cur.execute(
            question_query,
            (
                coding_question_id,
                submission[1],
            ),
        )

        question = cur.fetchone()

        if not question:

            return jsonify(
                {
                    "message":
                        "Coding question not found."
                }
            ), 404

        # --------------------------------------------------
        # Return question information.
        #
        # Test cases are NOT returned.
        # --------------------------------------------------

        return jsonify(
            {
                "coding_question_id":
                    question[0],

                "exam_id":
                    question[1],

                "question_text":
                    question[2],

                "difficulty":
                    question[3],

                "marks":
                    question[4],

                "starter_code":
                    question[5],

                "language":
                    question[6],

                "time_limit":
                    DEFAULT_TIME_LIMIT,

                "submission_id":
                    submission[0],
            }
        ), 200

    finally:

        cur.close()


# ==========================================================
# RUN CODE
# ==========================================================

@coding_bp.route(
    "/coding/run",
    methods=["POST"],
)
@jwt_required()
@role_required("Candidate")
def run_coding_code():

    current_user_id = get_jwt_identity()

    data = request.get_json() or {}

    submission_id = data.get(
        "submission_id"
    )

    coding_question_id = data.get(
        "coding_question_id"
    )

    source_code = data.get(
        "source_code"
    )

    # ------------------------------------------------------
    # Basic validation
    # ------------------------------------------------------

    if not submission_id:

        return jsonify(
            {
                "message":
                    "submission_id is required."
            }
        ), 400

    if not coding_question_id:

        return jsonify(
            {
                "message":
                    "coding_question_id is required."
            }
        ), 400

    if not isinstance(source_code, str):

        return jsonify(
            {
                "message":
                    "source_code must be a string."
            }
        ), 400

    if not source_code.strip():

        return jsonify(
            {
                "message":
                    "source_code cannot be empty."
            }
        ), 400

    cur = mysql.connection.cursor()

    try:

        # --------------------------------------------------
        # Verify:
        #
        # 1. Submission belongs to candidate
        # 2. Submission is In Progress
        # 3. Coding question belongs to same exam
        # 4. Coding question exists
        # --------------------------------------------------

        question_query = """
        SELECT
            cq.language
        FROM submissions s
        JOIN coding_questions cq
            ON cq.exam_id = s.exam_id
        WHERE
            s.submission_id = %s
            AND s.user_id = %s
            AND s.status = 'In Progress'
            AND cq.coding_question_id = %s
        """

        cur.execute(
            question_query,
            (
                submission_id,
                current_user_id,
                coding_question_id,
            ),
        )

        coding_question = cur.fetchone()

        if not coding_question:

            return jsonify(
                {
                    "message":
                        "Invalid submission or coding question."
                }
            ), 403

        language = coding_question[0]

        # --------------------------------------------------
        # Fixed execution time.
        # --------------------------------------------------

        time_limit = DEFAULT_TIME_LIMIT

        # --------------------------------------------------
        # RUN BUTTON
        #
        # IMPORTANT:
        #
        # ONLY visible test cases are fetched.
        #
        # Hidden test cases are NOT executed.
        # --------------------------------------------------

        test_case_query = """
        SELECT
            test_case_id,
            input_data,
            expected_output,
            is_hidden
        FROM test_cases
        WHERE
            coding_question_id = %s
            AND is_hidden = 0
        ORDER BY
            test_case_id ASC
        """

        cur.execute(
            test_case_query,
            (coding_question_id,),
        )

        test_cases = cur.fetchall()

        if not test_cases:

            return jsonify(
                {
                    "message":
                        "No visible test cases are configured."
                }
            ), 400

        # --------------------------------------------------
        # Execute visible tests.
        # --------------------------------------------------

        execution = execute_test_cases(
            source_code=source_code,
            language=language,
            time_limit=time_limit,
            test_cases=test_cases,
        )

        # --------------------------------------------------
        # Determine Run status.
        # --------------------------------------------------

        all_passed = (
            execution["total_tests"] > 0
            and execution["passed_tests"]
            == execution["total_tests"]
        )

        run_status = (
            "SUCCESS"
            if all_passed
            else "FAILED"
        )

        # --------------------------------------------------
        # Build SAFE visible results.
        #
        # Since the SQL query already filters hidden tests,
        # there should be no hidden result here.
        #
        # The extra filtering provides another security
        # layer.
        # --------------------------------------------------

        visible_results = build_visible_results(
            execution
        )

        # --------------------------------------------------
        # Return visible results only.
        # --------------------------------------------------

        return jsonify(
            {
                "message":
                    "Code executed successfully.",

                "status":
                    run_status,

                "passed_tests":
                    execution["passed_tests"],

                "total_tests":
                    execution["total_tests"],

                "results":
                    visible_results,
            }
        ), 200

    finally:

        cur.close()


# ==========================================================
# SUBMIT CODE
# ==========================================================

@coding_bp.route(
    "/coding/submit",
    methods=["POST"],
)
@jwt_required()
@role_required("Candidate")
def submit_coding_code():

    current_user_id = get_jwt_identity()

    data = request.get_json() or {}

    submission_id = data.get(
        "submission_id"
    )

    coding_question_id = data.get(
        "coding_question_id"
    )

    source_code = data.get(
        "source_code"
    )

    # ------------------------------------------------------
    # Validate request.
    # ------------------------------------------------------

    if not submission_id:

        return jsonify(
            {
                "message":
                    "submission_id is required."
            }
        ), 400

    if not coding_question_id:

        return jsonify(
            {
                "message":
                    "coding_question_id is required."
            }
        ), 400

    if not isinstance(source_code, str):

        return jsonify(
            {
                "message":
                    "source_code must be a string."
            }
        ), 400

    if not source_code.strip():

        return jsonify(
            {
                "message":
                    "source_code cannot be empty."
            }
        ), 400

    cur = mysql.connection.cursor()

    try:

        # --------------------------------------------------
        # Fetch coding question and verify submission.
        # --------------------------------------------------

        question_query = """
        SELECT
            cq.language,
            cq.marks
        FROM submissions s
        JOIN coding_questions cq
            ON cq.exam_id = s.exam_id
        WHERE
            s.submission_id = %s
            AND s.user_id = %s
            AND s.status = 'In Progress'
            AND cq.coding_question_id = %s
        """

        cur.execute(
            question_query,
            (
                submission_id,
                current_user_id,
                coding_question_id,
            ),
        )

        coding_question = cur.fetchone()

        if not coding_question:

            return jsonify(
                {
                    "message":
                        "Invalid submission or coding question."
                }
            ), 403

        language = coding_question[0]

        # --------------------------------------------------
        # These are the TOTAL marks for the coding question.
        #
        # There are NO marks associated with individual
        # test cases anymore.
        # --------------------------------------------------

        marks = coding_question[1] or 0

        # --------------------------------------------------
        # Fixed execution time.
        # --------------------------------------------------

        time_limit = DEFAULT_TIME_LIMIT

        # --------------------------------------------------
        # Fetch ALL test cases.
        #
        # This includes:
        #
        #     visible tests
        #     hidden tests
        #
        # Hidden test information stays on the backend.
        # --------------------------------------------------

        test_case_query = """
        SELECT
            test_case_id,
            input_data,
            expected_output,
            is_hidden
        FROM test_cases
        WHERE
            coding_question_id = %s
        ORDER BY
            test_case_id ASC
        """

        cur.execute(
            test_case_query,
            (coding_question_id,),
        )

        test_cases = cur.fetchall()

        if not test_cases:

            return jsonify(
                {
                    "message":
                        "No test cases are configured."
                }
            ), 400

        # --------------------------------------------------
        # Execute ALL tests.
        #
        # Hidden tests are executed here internally.
        # --------------------------------------------------

        execution = execute_test_cases(
            source_code=source_code,
            language=language,
            time_limit=time_limit,
            test_cases=test_cases,
        )

        passed_tests = execution[
            "passed_tests"
        ]

        total_tests = execution[
            "total_tests"
        ]

        # --------------------------------------------------
        # NO PARTIAL MARKING
        #
        # Every test must pass.
        #
        # All pass:
        #     full coding-question marks
        #
        # Any failure:
        #     zero marks
        # --------------------------------------------------

        all_tests_passed = (
            total_tests > 0
            and passed_tests == total_tests
        )

        if all_tests_passed:

            score = marks

            execution_status = "PASSED"

        else:

            score = 0

            execution_status = "FAILED"

        # --------------------------------------------------
        # Build combined stdout/stderr.
        #
        # These columns EXIST in code_submissions.
        #
        # execution_time does NOT exist, so we don't try
        # to insert it.
        # --------------------------------------------------

        combined_stdout, combined_stderr = (
            build_submission_output(
                execution
            )
        )

        # --------------------------------------------------
        # INSERT INTO code_submissions
        #
        # Actual table structure:
        #
        # code_submission_id
        # submission_id
        # coding_question_id
        # language
        # source_code
        # status
        # stdout
        # stderr
        # score
        # total_tests
        # passed_tests
        # submitted_at
        #
        # There is NO execution_time column.
        # --------------------------------------------------

        insert_query = """
        INSERT INTO code_submissions
        (
            submission_id,
            coding_question_id,
            language,
            source_code,
            status,
            stdout,
            stderr,
            score,
            total_tests,
            passed_tests,
            submitted_at
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
            %s,
            %s,
            %s,
            CONVERT_TZ(
                UTC_TIMESTAMP(),
                '+00:00',
                '+05:30'
            )
        )
        """

        cur.execute(
            insert_query,
            (
                submission_id,
                coding_question_id,
                language,
                source_code,
                execution_status,
                combined_stdout,
                combined_stderr,
                score,
                total_tests,
                passed_tests,
            ),
        )

        code_submission_id = cur.lastrowid

        # --------------------------------------------------
        # Commit database transaction.
        # --------------------------------------------------

        mysql.connection.commit()

        # --------------------------------------------------
        # IMPORTANT SECURITY RULE
        #
        # DO NOT return:
        #
        # - hidden test IDs
        # - hidden inputs
        # - hidden expected outputs
        # - hidden stdout
        # - hidden stderr
        # - hidden execution details
        #
        # Only aggregate information is returned.
        # --------------------------------------------------

        return jsonify(
            {
                "message":
                    "Code submitted successfully.",

                "code_submission_id":
                    code_submission_id,

                "status":
                    execution_status,

                "passed_tests":
                    passed_tests,

                "total_tests":
                    total_tests,

                "score":
                    score,

                "max_marks":
                    marks,
            }
        ), 201

    except Exception:

        mysql.connection.rollback()

        raise

    finally:

        cur.close()