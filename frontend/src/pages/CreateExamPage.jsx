import { useState } from "react";
import { useNavigate } from "react-router-dom";

import API_BASE_URL from "../services/api";
import Navbar from "../components/Navbar";

import "../styles/CreateExamPage.css";

function CreateExamPage() {

    const navigate = useNavigate();

    const [title, setTitle] = useState("");

    const [duration, setDuration] =
        useState("");

    const [totalMarks, setTotalMarks] =
        useState("");

    const [passingMarks, setPassingMarks] =
        useState("");

    const [examType, setExamType] =
        useState("Practice");

    const [creatingExam, setCreatingExam] =
        useState(false);


    // =========================================================
    // Create Exam
    // =========================================================

    const handleCreateExam = async () => {

        if (creatingExam) {
            return;
        }


        // =========================================================
        // Validation
        // =========================================================

        if (!title.trim()) {

            alert(
                "Please enter the exam title."
            );

            return;
        }


        if (
            !duration ||
            Number(duration) <= 0
        ) {

            alert(
                "Please enter valid duration."
            );

            return;
        }


        if (
            !totalMarks ||
            Number(totalMarks) <= 0
        ) {

            alert(
                "Please enter valid total marks."
            );

            return;
        }


        if (
            !passingMarks ||
            Number(passingMarks) <= 0
        ) {

            alert(
                "Please enter valid passing marks."
            );

            return;
        }


        if (
            Number(passingMarks) >
            Number(totalMarks)
        ) {

            alert(
                "Passing marks cannot be greater than total marks."
            );

            return;
        }


        if (!examType) {

            alert(
                "Please select an exam type."
            );

            return;
        }


        // =========================================================
        // API Request
        // =========================================================

        try {

            setCreatingExam(true);

            const token =
                localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/create-exam`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        title:
                            title.trim(),

                        duration:
                            Number(duration),

                        total_marks:
                            Number(totalMarks),

                        passing_marks:
                            Number(passingMarks),

                        exam_type:
                            examType,
                    }),
                }
            );

            const data =
                await response.json();

            if (response.ok) {

                alert(
                    "Exam Created Successfully"
                );

                navigate(
                    `/add-question?examId=${data.exam_id}`
                );

            } else {

                alert(
                    data.message ||
                        "Unable to create exam."
                );

            }

        } catch (error) {

            console.error(error);

            alert(
                "Unable to create exam."
            );

        } finally {

            setCreatingExam(false);

        }

    };


    return (

        <div className="cep-page">

            <Navbar />

            <main className="cep-container">

                {/* =================================================
                    Page Header
                ================================================= */}

                <header className="cep-page-header">

                    <span className="cep-eyebrow">
                        CONFIGURATION
                    </span>

                    <h1 className="cep-page-title">
                        Create Exam
                    </h1>

                    <p className="cep-page-description">
                        Configure the examination details,
                        assessment settings, and marking
                        structure before adding questions.
                    </p>

                </header>


                {/* =================================================
                    Form Card
                ================================================= */}

                <section className="cep-form-card">

                    <div className="cep-form-section">

                        {/* =================================================
                            Section Heading
                        ================================================= */}

                        <div className="cep-section-heading">

                            <span className="cep-section-eyebrow">
                                Assessment Setup
                            </span>

                            <h2 className="cep-section-title">
                                Exam Information
                            </h2>

                            <p className="cep-section-description">
                                Configure the basic details
                                and assessment settings for
                                the new examination.
                            </p>

                        </div>


                        {/* =================================================
                            Exam Type
                        ================================================= */}

                        <div className="cep-field">

                            <label className="cep-field-label">
                                Exam Type
                            </label>

                            <div className="cep-exam-type-switch">

                                <button
                                    type="button"
                                    className={`cep-exam-type-btn ${
                                        examType === "Practice"
                                            ? "active"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        setExamType(
                                            "Practice"
                                        )
                                    }
                                    disabled={
                                        creatingExam
                                    }
                                >
                                    Practice Exam
                                </button>

                                <button
                                    type="button"
                                    className={`cep-exam-type-btn ${
                                        examType === "Actual"
                                            ? "active"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        setExamType(
                                            "Actual"
                                        )
                                    }
                                    disabled={
                                        creatingExam
                                    }
                                >
                                    Actual Assessment
                                </button>

                            </div>

                            <p className="cep-field-hint">
                                Practice exams are available
                                for candidate practice, while
                                Actual Assessments can be
                                scheduled for candidates or
                                batches.
                            </p>

                        </div>


                        {/* =================================================
                            Exam Title
                        ================================================= */}

                        <div className="cep-field">

                            <label
                                htmlFor="cep-exam-title"
                                className="cep-field-label"
                            >
                                Exam Title
                            </label>

                            <input
                                id="cep-exam-title"
                                className="cep-input"
                                type="text"
                                placeholder="Enter exam title"
                                value={title}
                                onChange={(event) =>
                                    setTitle(
                                        event.target.value
                                    )
                                }
                                disabled={
                                    creatingExam
                                }
                            />

                        </div>


                        {/* =================================================
                            Duration
                        ================================================= */}

                        <div className="cep-field">

                            <label
                                htmlFor="cep-duration"
                                className="cep-field-label"
                            >
                                Duration
                            </label>

                            <input
                                id="cep-duration"
                                className="cep-input"
                                type="number"
                                min="1"
                                placeholder="Enter duration in minutes"
                                value={duration}
                                onChange={(event) =>
                                    setDuration(
                                        event.target.value
                                    )
                                }
                                disabled={
                                    creatingExam
                                }
                            />

                            <p className="cep-field-hint">
                                Enter the total time allowed
                                for candidates to complete
                                the examination.
                            </p>

                        </div>


                        {/* =================================================
                            Marks Configuration
                        ================================================= */}

                        <div className="cep-marks-section">

                            <div className="cep-subsection-heading">
                                Marks Configuration
                            </div>

                            <div className="cep-marks-grid">

                                <div className="cep-field">

                                    <label
                                        htmlFor="cep-total-marks"
                                        className="cep-field-label"
                                    >
                                        Total Marks
                                    </label>

                                    <input
                                        id="cep-total-marks"
                                        className="cep-input"
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        placeholder="Total marks"
                                        value={totalMarks}
                                        onChange={(
                                            event
                                        ) =>
                                            setTotalMarks(
                                                event.target.value
                                            )
                                        }
                                        disabled={
                                            creatingExam
                                        }
                                    />

                                </div>


                                <div className="cep-field">

                                    <label
                                        htmlFor="cep-passing-marks"
                                        className="cep-field-label"
                                    >
                                        Passing Marks
                                    </label>

                                    <input
                                        id="cep-passing-marks"
                                        className="cep-input"
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        placeholder="Passing marks"
                                        value={passingMarks}
                                        onChange={(
                                            event
                                        ) =>
                                            setPassingMarks(
                                                event.target.value
                                            )
                                        }
                                        disabled={
                                            creatingExam
                                        }
                                    />

                                </div>

                            </div>

                        </div>


                        {/* =================================================
                            Submit
                        ================================================= */}

                        <div className="cep-submit-wrapper">

                            <button
                                type="button"
                                className="cep-submit-btn"
                                onClick={
                                    handleCreateExam
                                }
                                disabled={
                                    creatingExam
                                }
                            >
                                {creatingExam
                                    ? "Creating..."
                                    : "Create Exam"}
                            </button>

                        </div>

                    </div>

                </section>

            </main>

        </div>

    );
}

export default CreateExamPage;