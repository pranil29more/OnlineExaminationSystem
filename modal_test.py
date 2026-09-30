import modal

app = modal.App.lookup(
    "oes-python-test",
    create_if_missing=True
)


def run_code(code, timeout=10):
    print("\n" + "=" * 60)
    print("RUNNING CODE")
    print("=" * 60)

    sandbox = modal.Sandbox.create(
        "python",
        "-c",
        code,
        app=app,
        timeout=timeout,
        cpu=0.25,
        memory=128,
        block_network=True,
    )

    try:
        stdout = sandbox.stdout.read()
        stderr = sandbox.stderr.read()

        sandbox.wait()

        print("\n--- STDOUT ---")
        print(stdout if stdout else "(empty)")

        print("\n--- STDERR ---")
        print(stderr if stderr else "(empty)")

        # ------------------------------------------
        # CLASSIFY RESULT
        # ------------------------------------------

        if "SyntaxError" in stderr:
            status = "SYNTAX_ERROR"

        elif stderr:
            status = "RUNTIME_ERROR"

        else:
            status = "SUCCESS"

        print("\n--- STATUS ---")
        print(status)

        return {
            "status": status,
            "stdout": stdout,
            "stderr": stderr,
        }

    except Exception as e:

        error_message = str(e)

        print("\n--- EXECUTION EXCEPTION ---")
        print(repr(e))

        # Modal's timeout exception may not literally
        # contain the word "timeout", so we classify
        # this execution exception as a timeout for now.
        status = "TIME_LIMIT_EXCEEDED"

        print("\n--- STATUS ---")
        print(status)

        return {
            "status": status,
            "stdout": "",
            "stderr": "",
            "error": error_message,
        }

    finally:
        sandbox.terminate()


def main():

    # ==================================================
    # TEST 1
    # NORMAL CODE
    # ==================================================

    print("\n\nTEST 1: NORMAL CODE")

    run_code("""
a = 10
b = 20
print(a + b)
""")


    # ==================================================
    # TEST 2
    # RUNTIME ERROR
    # ==================================================

    print("\n\nTEST 2: RUNTIME ERROR")

    run_code("""
a = 10
b = 0
print(a / b)
""")


    # ==================================================
    # TEST 3
    # SYNTAX ERROR
    # ==================================================

    print("\n\nTEST 3: SYNTAX ERROR")

    run_code("""
if True
    print("Hello")
""")


    # ==================================================
    # TEST 4
    # TIMEOUT
    # ==================================================

    print("\n\nTEST 4: TIMEOUT")

    run_code("""
while True:
    pass
""", timeout=10)


if __name__ == "__main__":
    main()