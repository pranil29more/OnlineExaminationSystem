import { useEffect, useState } from "react";
import {
    Link,
    useNavigate,
    useParams,
} from "react-router-dom";

import API_BASE_URL from "../services/api";
import Navbar from "../components/Navbar";

import "../styles/EditExamPage.css";

function EditExamPage() {
    const { examId } = useParams();

    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [duration, setDuration] = useState("");
    const [totalMarks, setTotalMarks] = useState("");
    const [passingMarks, setPassingMarks] = useState("");

    const [questions, setQuestions] = useState([]);

    const [updatingExam, setUpdatingExam] =
        useState(false);

    const [deletingQuestionId, setDeletingQuestionId] =
        useState(null);

    useEffect(() => {
        fetchExam();
    }, []);

    const fetchExam = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/exam/${examId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            setTitle(data.exam.title);
            setDuration(data.exam.duration);
            setTotalMarks(data.exam.total_marks);
            setPassingMarks(data.exam.passing_marks);
            setQuestions(data.questions);
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpdateExam = async () => {

        if (updatingExam) {
            return;
        }

        try {
            setUpdatingExam(true);

            const token = localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/update-exam/${examId}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        title,
                        duration: Number(duration),
                        total_marks: Number(totalMarks),
                        passing_marks: Number(passingMarks),
                    }),
                }
            );

            const data = await response.json();

            if (response.ok) {
                alert("Exam Updated Successfully");

                navigate(`/exam/${examId}`);
            } else {
                alert(
                    data.message ||
                        "Unable to update exam."
                );
            }
        } catch (error) {
            console.error(error);

            alert("Unable to update exam.");
        } finally {
            setUpdatingExam(false);
        }
    };

    const handleDeleteQuestion = async (questionId) => {

        if (deletingQuestionId !== null) {
            return;
        }

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this question?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            setDeletingQuestionId(questionId);

            const token = localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/delete-question/${questionId}`,
                {
                    method: "DELETE",

                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (response.ok) {
                alert("Question Deleted Successfully");

                fetchExam();
            } else {
                alert(
                    data.message ||
                        "Unable to delete question."
                );
            }
        } catch (error) {
            console.error(error);

            alert("Unable to delete question.");
        } finally {
            setDeletingQuestionId(null);
        }
    };

    return (
        <div className="eep-page">
            <Navbar />

            <div className="eep-container">

                <div className="eep-header">
                    <span className="eep-eyebrow">
                        EXAMINATION MANAGEMENT
                    </span>

                    <h1 className="eep-title">
                        Edit Exam
                    </h1>

                    <p className="eep-description">
                        Update the examination configuration
                        and manage the questions associated
                        with this assessment.
                    </p>
                </div>

                <div className="eep-form-card">

                    <div className="eep-form-section">

                        <div className="eep-section-heading">
                            <h2>
                                Exam Information
                            </h2>

                            <p>
                                Update the basic configuration
                                of this examination.
                            </p>
                        </div>

                        <label className="eep-field-label">
                            Exam Title
                        </label>

                        <input
                            className="eep-form-input"
                            type="text"
                            placeholder="Enter exam title"
                            value={title}
                            onChange={(event) =>
                                setTitle(
                                    event.target.value
                                )
                            }
                        />

                        <label className="eep-field-label">
                            Duration
                        </label>

                        <input
                            className="eep-form-input"
                            type="number"
                            min="1"
                            placeholder="Enter duration in minutes"
                            value={duration}
                            onChange={(event) =>
                                setDuration(
                                    event.target.value
                                )
                            }
                        />

                        <p className="eep-form-hint">
                            Enter the total time allowed
                            for candidates to complete
                            the examination.
                        </p>

                        <div className="eep-marks-heading">
                            Marks Configuration
                        </div>

                        <div className="eep-marks-grid">

                            <div>
                                <label className="eep-field-label">
                                    Total Marks
                                </label>

                                <input
                                    className="eep-form-input"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    placeholder="Total marks"
                                    value={totalMarks}
                                    onChange={(event) =>
                                        setTotalMarks(
                                            event.target.value
                                        )
                                    }
                                />
                            </div>

                            <div>
                                <label className="eep-field-label">
                                    Passing Marks
                                </label>

                                <input
                                    className="eep-form-input"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    placeholder="Passing marks"
                                    value={passingMarks}
                                    onChange={(event) =>
                                        setPassingMarks(
                                            event.target.value
                                        )
                                    }
                                />
                            </div>

                        </div>

                        <div className="eep-exam-actions">

                            <button
                                type="button"
                                className="eep-update-btn"
                                onClick={
                                    handleUpdateExam
                                }
                                disabled={
                                    updatingExam
                                }
                            >
                                {updatingExam
                                    ? "Updating Exam..."
                                    : "Update Exam"}
                            </button>

                            <Link
                                className="eep-add-question-btn"
                                to={`/add-question?examId=${examId}`}
                                state={{
                                    from: "edit-exam",
                                }}
                            >
                                Add Question
                            </Link>

                        </div>
                    </div>
                </div>

                <section className="eep-questions-section">

                    <div className="eep-questions-heading">

                        <div>
                            <span className="eep-section-eyebrow">
                                QUESTION BANK
                            </span>

                            <h2 className="eep-section-title">
                                Questions
                            </h2>

                            <p className="eep-section-description">
                                Review, edit, or remove
                                questions configured
                                for this examination.
                            </p>
                        </div>

                        <span className="eep-question-count">
                            {questions.length}{" "}
                            {questions.length === 1
                                ? "Question"
                                : "Questions"}
                        </span>

                    </div>

                    {questions.length === 0 ? (
                        <div className="eep-empty-questions">
                            No questions have been
                            added to this exam yet.
                        </div>
                    ) : (
                        <div className="eep-questions-grid">

                            {questions.map((question) => (
                                <div
                                    key={
                                        question.question_id
                                    }
                                    className="eep-question-card"
                                >

                                    <div className="eep-question-card-header">

                                        <div>
                                            <span className="eep-question-number">
                                                Question #
                                                {
                                                    question.question_id
                                                }
                                            </span>

                                            <h3 className="eep-question-title">
                                                {
                                                    question.question_text
                                                }
                                            </h3>
                                        </div>

                                        <span
                                            className={`eep-difficulty-badge ${question.difficulty.toLowerCase()}`}
                                        >
                                            {
                                                question.difficulty
                                            }
                                        </span>

                                    </div>

                                    <div className="eep-question-details">

                                        <div className="eep-question-detail">
                                            <span className="eep-detail-label">
                                                Difficulty
                                            </span>

                                            <strong>
                                                {
                                                    question.difficulty
                                                }
                                            </strong>
                                        </div>

                                        <div className="eep-question-detail">
                                            <span className="eep-detail-label">
                                                Marks
                                            </span>

                                            <strong>
                                                {
                                                    question.marks
                                                }
                                            </strong>
                                        </div>

                                    </div>

                                    <div className="eep-question-actions">

                                        <Link
                                            className="eep-edit-question-btn"
                                            to={`/edit-question/${question.question_id}`}
                                        >
                                            Edit Question
                                        </Link>

                                        <button
                                            type="button"
                                            className="eep-delete-question-btn"
                                            onClick={() =>
                                                handleDeleteQuestion(
                                                    question.question_id
                                                )
                                            }
                                            disabled={
                                                deletingQuestionId ===
                                                question.question_id
                                            }
                                        >
                                            {deletingQuestionId ===
                                            question.question_id
                                                ? "Deleting..."
                                                : "Delete"}
                                        </button>

                                    </div>

                                </div>
                            ))}

                        </div>
                    )}

                </section>

            </div>
        </div>
    );
}

export default EditExamPage;