import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import API_BASE_URL from "../services/api";
import Navbar from "../components/Navbar";

import "../styles/EditCodingQuestionPage.css";


function EditCodingQuestionPage() {

    const { codingQuestionId } = useParams();

    const navigate = useNavigate();


    // =========================================================
    // STATE
    // =========================================================

    const [question, setQuestion] =
        useState({
            exam_id: "",
        });

    const [questionText, setQuestionText] =
        useState("");

    const [difficulty, setDifficulty] =
        useState("Easy");

    const [marks, setMarks] =
        useState("");

    const [starterCode, setStarterCode] =
        useState("");

    const [testCases, setTestCases] =
        useState([]);

    const [saving, setSaving] =
        useState(false);


    // =========================================================
    // LOAD CODING QUESTION
    // =========================================================

    useEffect(() => {

        const loadCodingQuestion = async () => {

            try {

                const token =
                    localStorage.getItem("token");

                const response =
                    await fetch(
                        `${API_BASE_URL}/coding-question/${codingQuestionId}`,
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`,
                            },
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Unable to load coding question."
                    );
                }


                setQuestion(data);

                setQuestionText(
                    data.question_text || ""
                );

                setDifficulty(
                    data.difficulty || "Easy"
                );

                setMarks(
                    data.marks ?? ""
                );

                setStarterCode(
                    data.starter_code || ""
                );

                setTestCases(
                    (data.test_cases || []).map(
                        (item) => ({
                            input_data:
                                item.input_data || "",

                            expected_output:
                                item.expected_output || "",

                            is_hidden:
                                Boolean(
                                    item.is_hidden
                                ),
                        })
                    )
                );

            } catch (error) {

                console.error(error);

                alert(
                    error.message ||
                    "Unable to load coding question."
                );

                navigate(-1);
            }
        };


        loadCodingQuestion();

    }, [
        codingQuestionId,
        navigate,
    ]);


    // =========================================================
    // UPDATE TEST CASE
    // =========================================================

    const updateTestCase = (
        index,
        field,
        value
    ) => {

        setTestCases(
            (current) =>
                current.map(
                    (item, i) =>
                        i === index
                            ? {
                                ...item,
                                [field]: value,
                            }
                            : item
                )
        );
    };


    // =========================================================
    // ADD TEST CASE
    // =========================================================

    const addTestCase = () => {

        setTestCases(
            (current) => [
                ...current,

                {
                    input_data: "",
                    expected_output: "",
                    is_hidden: false,
                },
            ]
        );
    };


    // =========================================================
    // REMOVE TEST CASE
    // =========================================================

    const removeTestCase = (index) => {

        if (testCases.length === 1) {

            alert(
                "At least one test case is required."
            );

            return;
        }

        setTestCases(
            (current) =>
                current.filter(
                    (_, i) =>
                        i !== index
                )
        );
    };


    // =========================================================
    // SAVE CODING QUESTION
    // =========================================================

    const save = async () => {

        if (saving) {
            return;
        }


        // -----------------------------------------------------
        // Basic Validation
        // -----------------------------------------------------

        if (
            !questionText.trim() ||
            !marks ||
            Number(marks) <= 0 ||
            !starterCode.trim()
        ) {

            alert(
                "Question, valid marks, and starter code are required."
            );

            return;
        }


        // -----------------------------------------------------
        // Test Case Validation
        // -----------------------------------------------------

        if (
            !testCases.length ||
            testCases.some(
                (item) =>
                    !item.expected_output.trim()
            )
        ) {

            alert(
                "Every test case must have expected output."
            );

            return;
        }


        try {

            setSaving(true);

            const token =
                localStorage.getItem("token");


            const response =
                await fetch(
                    `${API_BASE_URL}/update-coding-question/${codingQuestionId}`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${token}`,
                        },

                        body: JSON.stringify({

                            question_text:
                                questionText.trim(),

                            difficulty,

                            marks:
                                Number(marks),

                            starter_code:
                                starterCode,

                            language:
                                "python",

                            test_cases:
                                testCases.map(
                                    (item) => ({
                                        input_data:
                                            item.input_data,

                                        expected_output:
                                            item.expected_output.trim(),

                                        is_hidden:
                                            Boolean(
                                                item.is_hidden
                                            ),
                                    })
                                ),
                        }),
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                alert(
                    data.message ||
                    "Unable to update coding question."
                );

                return;
            }


            alert(
                data.message ||
                "Coding question updated successfully."
            );


            navigate(
                `/edit-exam/${question.exam_id}`
            );

        } catch (error) {

            console.error(error);

            alert(
                "Unable to update coding question."
            );

        } finally {

            setSaving(false);
        }
    };


    // =========================================================
    // RENDER
    // =========================================================

    return (

        <div className="ecqp-page">

            <Navbar />

            <main className="ecqp-container">


                {/* =================================================
                    PAGE HEADER
                ================================================= */}

                <header className="ecqp-header">

                    <span className="ecqp-eyebrow">
                        Examination Management
                    </span>

                    <h1 className="ecqp-title">
                        Edit Coding Question
                    </h1>

                    <p className="ecqp-description">
                        Update the Python problem,
                        starter code, marks, and
                        evaluation test cases.
                    </p>

                </header>


                {/* =================================================
                    MAIN FORM CARD
                ================================================= */}

                <div className="ecqp-form-card">


                    {/* =================================================
                        QUESTION CONFIGURATION
                    ================================================= */}

                    <div className="ecqp-form-section">

                        <div className="ecqp-section-heading">

                            <span className="ecqp-section-eyebrow">
                                Question Configuration
                            </span>

                            <h2>
                                Question Details
                            </h2>

                            <p>
                                Update the coding problem,
                                difficulty, marks, and
                                programming language.
                            </p>

                        </div>


                        {/* Exam ID */}

                        <label
                            className="ecqp-field-label"
                            htmlFor="ecqp-exam-id"
                        >
                            Exam ID
                        </label>

                        <input
                            id="ecqp-exam-id"
                            className="ecqp-form-input"
                            type="number"
                            value={
                                question?.exam_id ?? ""
                            }
                            disabled
                        />


                        {/* Coding Question */}

                        <label
                            className="ecqp-field-label"
                            htmlFor="ecqp-question"
                        >
                            Coding Question
                        </label>

                        <textarea
                            id="ecqp-question"
                            className="ecqp-form-textarea ecqp-question-textarea"
                            placeholder="Enter coding question"
                            value={questionText}
                            onChange={(event) =>
                                setQuestionText(
                                    event.target.value
                                )
                            }
                            disabled={saving}
                        />


                        {/* Difficulty */}

                        <label
                            className="ecqp-field-label"
                            htmlFor="ecqp-difficulty"
                        >
                            Difficulty
                        </label>

                        <select
                            id="ecqp-difficulty"
                            className="ecqp-form-input ecqp-form-select"
                            value={difficulty}
                            onChange={(event) =>
                                setDifficulty(
                                    event.target.value
                                )
                            }
                            disabled={saving}
                        >

                            <option value="Easy">
                                Easy
                            </option>

                            <option value="Medium">
                                Medium
                            </option>

                            <option value="Hard">
                                Hard
                            </option>

                        </select>


                        {/* Marks */}

                        <label
                            className="ecqp-field-label"
                            htmlFor="ecqp-marks"
                        >
                            Marks
                        </label>

                        <input
                            id="ecqp-marks"
                            className="ecqp-form-input"
                            type="number"
                            min="0.01"
                            step="0.01"
                            placeholder="Enter marks"
                            value={marks}
                            onChange={(event) =>
                                setMarks(
                                    event.target.value
                                )
                            }
                            disabled={saving}
                        />


                        {/* Programming Language */}

                        <label
                            className="ecqp-field-label"
                            htmlFor="ecqp-language"
                        >
                            Programming Language
                        </label>

                        <select
                            id="ecqp-language"
                            className="ecqp-form-input ecqp-form-select"
                            value="python"
                            disabled
                        >

                            <option value="python">
                                Python
                            </option>

                        </select>

                    </div>


                    {/* =================================================
                        STARTER CODE
                    ================================================= */}

                    <div className="ecqp-form-section">

                        <div className="ecqp-subheading">
                            Starter Code
                        </div>

                        <p className="ecqp-section-help">
                            Update the code template
                            provided to candidates before
                            they begin solving the problem.
                        </p>

                        <textarea
                            id="ecqp-starter-code"
                            className="ecqp-form-textarea ecqp-code-textarea"
                            placeholder="Enter starter Python code"
                            value={starterCode}
                            onChange={(event) =>
                                setStarterCode(
                                    event.target.value
                                )
                            }
                            disabled={saving}
                            spellCheck="false"
                        />

                    </div>


                    {/* =================================================
                        TEST CASES
                    ================================================= */}

                    <div className="ecqp-form-section ecqp-test-case-section">

                        <div className="ecqp-test-case-header">

                            <div className="ecqp-test-case-heading">

                                <div className="ecqp-subheading ecqp-no-margin">
                                    Test Cases
                                </div>

                                <p className="ecqp-test-case-description">
                                    Visible tests are available
                                    to candidates during Run
                                    Code; hidden tests are used
                                    at final submission.
                                </p>

                            </div>


                            <button
                                type="button"
                                className="ecqp-add-test-btn"
                                onClick={addTestCase}
                                disabled={saving}
                            >
                                + Add Test Case
                            </button>

                        </div>


                        <div className="ecqp-test-cases">

                            {testCases.map(
                                (testCase, index) => (

                                    <div
                                        className="ecqp-test-case-card"
                                        key={index}
                                    >

                                        {/* =================================
                                            Test Case Header
                                        ================================= */}

                                        <div className="ecqp-test-case-top">

                                            <div className="ecqp-test-case-number">
                                                Test Case {index + 1}
                                            </div>


                                            <div className="ecqp-test-case-actions">

                                                <button
                                                    type="button"
                                                    className={
                                                        `ecqp-visibility-btn ${
                                                            testCase.is_hidden
                                                                ? "hidden-test"
                                                                : "visible-test"
                                                        }`
                                                    }
                                                    onClick={() =>
                                                        updateTestCase(
                                                            index,
                                                            "is_hidden",
                                                            !testCase.is_hidden
                                                        )
                                                    }
                                                    disabled={saving}
                                                >
                                                    {
                                                        testCase.is_hidden
                                                            ? "Hidden"
                                                            : "Visible"
                                                    }
                                                </button>


                                                <button
                                                    type="button"
                                                    className="ecqp-remove-test-btn"
                                                    onClick={() =>
                                                        removeTestCase(
                                                            index
                                                        )
                                                    }
                                                    disabled={
                                                        saving ||
                                                        testCases.length === 1
                                                    }
                                                >
                                                    Remove
                                                </button>

                                            </div>

                                        </div>


                                        {/* =================================
                                            Test Case Fields
                                        ================================= */}

                                        <div className="ecqp-test-case-grid">

                                            <div className="ecqp-test-case-field">

                                                <label
                                                    className="ecqp-field-label"
                                                    htmlFor={
                                                        `ecqp-input-${index}`
                                                    }
                                                >
                                                    Input
                                                </label>

                                                <textarea
                                                    id={
                                                        `ecqp-input-${index}`
                                                    }
                                                    className="ecqp-form-textarea ecqp-test-textarea"
                                                    placeholder="Enter test input"
                                                    value={
                                                        testCase.input_data
                                                    }
                                                    onChange={(event) =>
                                                        updateTestCase(
                                                            index,
                                                            "input_data",
                                                            event.target.value
                                                        )
                                                    }
                                                    disabled={saving}
                                                    spellCheck="false"
                                                />

                                            </div>


                                            <div className="ecqp-test-case-field">

                                                <label
                                                    className="ecqp-field-label"
                                                    htmlFor={
                                                        `ecqp-output-${index}`
                                                    }
                                                >
                                                    Expected Output
                                                </label>

                                                <textarea
                                                    id={
                                                        `ecqp-output-${index}`
                                                    }
                                                    className="ecqp-form-textarea ecqp-test-textarea"
                                                    placeholder="Enter expected output"
                                                    value={
                                                        testCase.expected_output
                                                    }
                                                    onChange={(event) =>
                                                        updateTestCase(
                                                            index,
                                                            "expected_output",
                                                            event.target.value
                                                        )
                                                    }
                                                    disabled={saving}
                                                    spellCheck="false"
                                                />

                                            </div>

                                        </div>

                                    </div>
                                )
                            )}

                        </div>

                    </div>


                    {/* =================================================
                        ACTIONS
                    ================================================= */}

                    <div className="ecqp-action-area">

                        <button
                            type="button"
                            className="ecqp-save-btn"
                            onClick={save}
                            disabled={saving}
                        >
                            {
                                saving
                                    ? "Updating Question..."
                                    : "Update Question"
                            }
                        </button>

                    </div>

                </div>

            </main>

        </div>
    );
}


export default EditCodingQuestionPage;