import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import API_BASE_URL from "../services/api";
import Navbar from "../components/Navbar";

import "../styles/EditQuestionPage.css";

function EditQuestionPage() {

    const { questionId } = useParams();

    const navigate = useNavigate();

    // =========================================================
    // Question States
    // =========================================================

    const [questionText, setQuestionText] =
        useState("");

    const [difficulty, setDifficulty] =
        useState("Easy");

    const [marks, setMarks] =
        useState("");

    const [option1, setOption1] =
        useState("");

    const [option2, setOption2] =
        useState("");

    const [option3, setOption3] =
        useState("");

    const [option4, setOption4] =
        useState("");

    const [correctOption, setCorrectOption] =
        useState("");

    const [updating, setUpdating] =
        useState(false);


    // =========================================================
    // Fetch Question
    // =========================================================

    useEffect(() => {
        fetchQuestion();
    }, []);

    const fetchQuestion = async () => {

        try {

            const token =
                localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/question/${questionId}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            const data =
                await response.json();

            setQuestionText(
                data.question_text
            );

            setDifficulty(
                data.difficulty
            );

            setMarks(
                data.marks
            );

            setOption1(
                data.options[0] || ""
            );

            setOption2(
                data.options[1] || ""
            );

            setOption3(
                data.options[2] || ""
            );

            setOption4(
                data.options[3] || ""
            );

            setCorrectOption(
                data.correct_option
            );

        } catch (error) {

            console.error(error);

        }
    };


    // =========================================================
    // Update Question
    // =========================================================

    const handleUpdateQuestion = async () => {

        if (updating) {
            return;
        }

        if (!questionText.trim()) {

            alert(
                "Please enter the question."
            );

            return;
        }

        if (
            !marks ||
            Number(marks) <= 0
        ) {

            alert(
                "Please enter valid marks."
            );

            return;
        }

        if (
            !option1.trim() ||
            !option2.trim() ||
            !option3.trim() ||
            !option4.trim()
        ) {

            alert(
                "Please enter all four options."
            );

            return;
        }

        if (!correctOption.trim()) {

            alert(
                "Please enter the correct option."
            );

            return;
        }

        const options = [
            option1.trim(),
            option2.trim(),
            option3.trim(),
            option4.trim(),
        ];

        const matchingCorrectOption =
            options.find(
                (option) =>
                    option.toLowerCase() ===
                    correctOption
                        .trim()
                        .toLowerCase()
            );

        if (!matchingCorrectOption) {

            alert(
                "Correct option must match one of the four options."
            );

            return;
        }

        try {

            setUpdating(true);

            const token =
                localStorage.getItem("token");

            const response =
                await fetch(
                    `${API_BASE_URL}/update-question/${questionId}`,
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

                            options,

                            correct_option:
                                matchingCorrectOption,
                        }),
                    }
                );

            const data =
                await response.json();

            if (response.ok) {

                alert(
                    "Question Updated Successfully"
                );

                navigate(-1);

            } else {

                alert(
                    data.message ||
                        "Unable to update question."
                );

            }

        } catch (error) {

            console.error(error);

            alert(
                "Unable to update question."
            );

        } finally {

            setUpdating(false);

        }
    };


    return (

        <div className="eqp-page">

            <Navbar />

            <main className="eqp-container">

                {/* =================================================
                    Page Header
                ================================================= */}

                <header className="eqp-header">

                    <span className="eqp-eyebrow">
                        Examination Management
                    </span>

                    <h1 className="eqp-title">
                        Edit Question
                    </h1>

                    <p className="eqp-description">
                        Update the question details,
                        difficulty, marks, answer options,
                        and correct answer.
                    </p>

                </header>


                {/* =================================================
                    Main Form Card
                ================================================= */}

                <div className="eqp-form-card">

                    {/* =================================================
                        Question Details
                    ================================================= */}

                    <div className="eqp-form-section">

                        <div className="eqp-section-heading">

                            <span className="eqp-section-eyebrow">
                                Question Configuration
                            </span>

                            <h2>
                                Question Details
                            </h2>

                            <p>
                                Update the question,
                                difficulty, and marks
                                assigned to this
                                question.
                            </p>

                        </div>


                        {/* Question */}

                        <label
                            className="eqp-field-label"
                            htmlFor="eqp-question"
                        >
                            Question
                        </label>

                        <input
                            id="eqp-question"
                            className="eqp-form-input"
                            type="text"
                            placeholder="Enter question"
                            value={questionText}
                            onChange={(event) =>
                                setQuestionText(
                                    event.target.value
                                )
                            }
                            disabled={updating}
                        />


                        {/* Difficulty */}

                        <label
                            className="eqp-field-label"
                            htmlFor="eqp-difficulty"
                        >
                            Difficulty
                        </label>

                        <select
                            id="eqp-difficulty"
                            className="eqp-form-input eqp-form-select"
                            value={difficulty}
                            onChange={(event) =>
                                setDifficulty(
                                    event.target.value
                                )
                            }
                            disabled={updating}
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
                            className="eqp-field-label"
                            htmlFor="eqp-marks"
                        >
                            Marks
                        </label>

                        <input
                            id="eqp-marks"
                            className="eqp-form-input"
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
                            disabled={updating}
                        />

                    </div>


                    {/* =================================================
                        Answer Options
                    ================================================= */}

                    <div className="eqp-form-section">

                        <div className="eqp-subheading">
                            Answer Options
                        </div>

                        <div className="eqp-options-grid">

                            <div className="eqp-option-field">

                                <label
                                    className="eqp-field-label"
                                    htmlFor="eqp-option-1"
                                >
                                    Option 1
                                </label>

                                <input
                                    id="eqp-option-1"
                                    className="eqp-form-input"
                                    type="text"
                                    placeholder="Enter option 1"
                                    value={option1}
                                    onChange={(event) =>
                                        setOption1(
                                            event.target.value
                                        )
                                    }
                                    disabled={updating}
                                />

                            </div>


                            <div className="eqp-option-field">

                                <label
                                    className="eqp-field-label"
                                    htmlFor="eqp-option-2"
                                >
                                    Option 2
                                </label>

                                <input
                                    id="eqp-option-2"
                                    className="eqp-form-input"
                                    type="text"
                                    placeholder="Enter option 2"
                                    value={option2}
                                    onChange={(event) =>
                                        setOption2(
                                            event.target.value
                                        )
                                    }
                                    disabled={updating}
                                />

                            </div>


                            <div className="eqp-option-field">

                                <label
                                    className="eqp-field-label"
                                    htmlFor="eqp-option-3"
                                >
                                    Option 3
                                </label>

                                <input
                                    id="eqp-option-3"
                                    className="eqp-form-input"
                                    type="text"
                                    placeholder="Enter option 3"
                                    value={option3}
                                    onChange={(event) =>
                                        setOption3(
                                            event.target.value
                                        )
                                    }
                                    disabled={updating}
                                />

                            </div>


                            <div className="eqp-option-field">

                                <label
                                    className="eqp-field-label"
                                    htmlFor="eqp-option-4"
                                >
                                    Option 4
                                </label>

                                <input
                                    id="eqp-option-4"
                                    className="eqp-form-input"
                                    type="text"
                                    placeholder="Enter option 4"
                                    value={option4}
                                    onChange={(event) =>
                                        setOption4(
                                            event.target.value
                                        )
                                    }
                                    disabled={updating}
                                />

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        Correct Answer
                    ================================================= */}

                    <div className="eqp-form-section eqp-correct-section">

                        <label
                            className="eqp-field-label"
                            htmlFor="eqp-correct-answer"
                        >
                            Correct Answer
                        </label>

                        <input
                            id="eqp-correct-answer"
                            className="eqp-form-input"
                            type="text"
                            placeholder="Enter the exact correct option"
                            value={correctOption}
                            onChange={(event) =>
                                setCorrectOption(
                                    event.target.value
                                )
                            }
                            disabled={updating}
                        />

                        <p className="eqp-form-hint">
                            The correct answer should
                            match one of the four
                            options.
                        </p>

                    </div>


                    {/* =================================================
                        Update Button
                    ================================================= */}

                    <div className="eqp-action-area">

                        <button
                            type="button"
                            className="eqp-update-btn"
                            onClick={
                                handleUpdateQuestion
                            }
                            disabled={updating}
                        >
                            {updating
                                ? "Updating Question..."
                                : "Update Question"}
                        </button>

                    </div>

                </div>

            </main>

        </div>

    );
}

export default EditQuestionPage;