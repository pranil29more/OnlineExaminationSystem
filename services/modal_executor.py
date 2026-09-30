# services/modal_executor.py

import base64
import time
from typing import Any

import modal


# ============================================================
# MODAL APP
# ============================================================

app = modal.App.lookup(
    "oes-python-test",
    create_if_missing=True,
)


# ============================================================
# SETTINGS
# ============================================================

DEFAULT_TIME_LIMIT = 5
MAX_TIME_LIMIT = 30

DEFAULT_MEMORY_MB = 128
DEFAULT_CPU = 0.25


# ============================================================
# PYTHON CODE EXECUTOR
# ============================================================

def run_python_code(
    source_code: str,
    time_limit: int = DEFAULT_TIME_LIMIT,
) -> dict[str, Any]:

    # --------------------------------------------------------
    # Validate source code
    # --------------------------------------------------------

    if not isinstance(source_code, str):
        return {
            "status": "INVALID_REQUEST",
            "stdout": "",
            "stderr": "source_code must be a string.",
            "execution_time": 0,
            "exit_code": None,
        }

    if not source_code.strip():
        return {
            "status": "INVALID_REQUEST",
            "stdout": "",
            "stderr": "source_code cannot be empty.",
            "execution_time": 0,
            "exit_code": None,
        }

    # --------------------------------------------------------
    # Validate time limit
    # --------------------------------------------------------

    try:
        time_limit = int(time_limit)
    except (TypeError, ValueError):
        time_limit = DEFAULT_TIME_LIMIT

    time_limit = max(
        1,
        min(time_limit, MAX_TIME_LIMIT)
    )

    # --------------------------------------------------------
    # Encode submitted code
    # --------------------------------------------------------

    encoded_code = base64.b64encode(
        source_code.encode("utf-8")
    ).decode("ascii")

    # --------------------------------------------------------
    # Code executed INSIDE Modal Sandbox
    # --------------------------------------------------------

    wrapper_code = f"""
import base64
import signal
import sys

TIME_LIMIT = {time_limit}


def timeout_handler(signum, frame):
    print(
        "Execution time limit exceeded.",
        file=sys.stderr,
    )
    sys.exit(124)


signal.signal(
    signal.SIGALRM,
    timeout_handler,
)

signal.alarm(TIME_LIMIT)

try:

    source = base64.b64decode(
        "{encoded_code}"
    ).decode("utf-8")

    compiled_code = compile(
        source,
        "<submitted_code>",
        "exec",
    )

    exec(
        compiled_code,
        {{"__name__": "__main__"}},
    )

except SystemExit:
    raise

except Exception:
    raise

finally:
    signal.alarm(0)
"""

    sandbox = None
    start_time = time.perf_counter()

    try:

        # ----------------------------------------------------
        # Create isolated Modal Sandbox
        # ----------------------------------------------------

        sandbox = modal.Sandbox.create(
            "python",
            "-c",
            wrapper_code,

            app=app,

            # Modal Sandbox lifetime.
            # Modal requires this to be at least 10 seconds.
            timeout=max(10, time_limit + 5),

            # Resource limits
            cpu=DEFAULT_CPU,
            memory=DEFAULT_MEMORY_MB,

            # No internet access for submitted code
            block_network=True,
        )

        # ----------------------------------------------------
        # Wait until code finishes
        # ----------------------------------------------------

        sandbox.wait(
            raise_on_termination=False
        )

        # ----------------------------------------------------
        # IMPORTANT:
        # Use poll() to obtain the exit code.
        #
        # Do NOT use:
        #
        # sandbox.returncode()
        #
        # because that caused:
        # TypeError: 'int' object is not callable
        # ----------------------------------------------------

        exit_code = sandbox.poll()

        # ----------------------------------------------------
        # Read output
        # ----------------------------------------------------

        stdout = sandbox.stdout.read()
        stderr = sandbox.stderr.read()

        if stdout is None:
            stdout = ""

        if stderr is None:
            stderr = ""

        # ----------------------------------------------------
        # Calculate execution time
        # ----------------------------------------------------

        execution_time = round(
            time.perf_counter() - start_time,
            3,
        )

        # ----------------------------------------------------
        # Determine status
        # ----------------------------------------------------

        if exit_code == 0:

            status = "SUCCESS"

        elif exit_code == 124:

            status = "TIME_LIMIT_EXCEEDED"

        elif "SyntaxError" in stderr:

            status = "SYNTAX_ERROR"

        else:

            status = "RUNTIME_ERROR"

        # ----------------------------------------------------
        # Return result
        # ----------------------------------------------------

        return {
            "status": status,
            "stdout": stdout,
            "stderr": stderr,
            "execution_time": execution_time,
            "exit_code": exit_code,
        }

    # --------------------------------------------------------
    # Modal Sandbox timeout
    # --------------------------------------------------------

    except modal.exception.SandboxTimeoutError as exc:

        execution_time = round(
            time.perf_counter() - start_time,
            3,
        )

        return {
            "status": "TIME_LIMIT_EXCEEDED",
            "stdout": "",
            "stderr": str(exc),
            "execution_time": execution_time,
            "exit_code": None,
        }

    # --------------------------------------------------------
    # Any other system error
    # --------------------------------------------------------

    except Exception as exc:

        execution_time = round(
            time.perf_counter() - start_time,
            3,
        )

        return {
            "status": "SYSTEM_ERROR",
            "stdout": "",
            "stderr": f"{type(exc).__name__}: {exc}",
            "execution_time": execution_time,
            "exit_code": None,
        }

    # --------------------------------------------------------
    # Always clean up
    # --------------------------------------------------------

    finally:

        if sandbox is not None:

            try:
                sandbox.terminate(
                    wait=False
                )

            except Exception:
                pass


# ============================================================
# GENERIC CODE EXECUTOR
# ============================================================

def run_code(
    source_code: str,
    language: str = "python",
    time_limit: int = DEFAULT_TIME_LIMIT,
) -> dict[str, Any]:

    language = language.lower().strip()

    if language in ("python", "py"):

        return run_python_code(
            source_code=source_code,
            time_limit=time_limit,
        )

    return {
        "status": "UNSUPPORTED_LANGUAGE",
        "stdout": "",
        "stderr": (
            f"Language '{language}' "
            "is not supported yet."
        ),
        "execution_time": 0,
        "exit_code": None,
    }


# ============================================================
# LOCAL TEST
# ============================================================

if __name__ == "__main__":

    print("=" * 60)
    print("CODE EXECUTOR TEST")
    print("=" * 60)

    result = run_code(
        source_code="""
a = 10
b = 20
print(a + b)
""",
        language="python",
        time_limit=5,
    )

    print()
    print("STATUS:")
    print(result["status"])

    print()
    print("STDOUT:")
    print(result["stdout"])

    print()
    print("STDERR:")
    print(result["stderr"])

    print()
    print("EXECUTION TIME:")
    print(result["execution_time"])

    print()
    print("EXIT CODE:")
    print(result["exit_code"])

    print()
    print("=" * 60)