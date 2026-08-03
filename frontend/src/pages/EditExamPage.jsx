import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/update-exam/${examId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type":
                            "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        title,
                        duration: Number(duration),
                        total_marks: Number(
                            totalMarks
                        ),
                        passing_marks: Number(
                            passingMarks
                        ),
                    }),
                }
            );

            const data = await response.json();

            if (response.ok) {
                alert("Exam Updated Successfully");

                navigate(`/exam/${examId}`);
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteQuestion = async (
        questionId
    ) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this question?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
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
                alert(
                    "Question Deleted Successfully"
                );

                fetchExam();
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div>
            <Navbar />

            <div className="page-container">
                <h1 className="page-title">
                    Edit Exam
                </h1>

                <div className="form-card">
                    <input
                        className="form-input"
                        type="text"
                        placeholder="Exam Title"
                        value={title}
                        onChange={(e) =>
                            setTitle(e.target.value)
                        }
                    />

                    <input
                        className="form-input"
                        type="number"
                        placeholder="Duration (Minutes)"
                        value={duration}
                        onChange={(e) =>
                            setDuration(e.target.value)
                        }
                    />

                    <input
                        className="form-input"
                        type="number"
                        placeholder="Total Marks"
                        value={totalMarks}
                        onChange={(e) =>
                            setTotalMarks(
                                e.target.value
                            )
                        }
                    />

                    <input
                        className="form-input"
                        type="number"
                        placeholder="Passing Marks"
                        value={passingMarks}
                        onChange={(e) =>
                            setPassingMarks(
                                e.target.value
                            )
                        }
                    />

                    <div className="exam-buttons">
                        <button
                            className="primary-btn"
                            onClick={
                                handleUpdateExam
                            }
                        >
                            Update Exam
                        </button>

                        <Link
                            className="secondary-btn"
                            to={`/add-question?examId=${examId}`}
                            state={{ from: "edit-exam" }}
                        >
                            Add Question
                        </Link>
                    </div>
                </div>

                <h2 className="section-title">
                    Questions
                </h2>

                <div className="questions-grid">
                    {questions.map((question) => (
                        <div
                            key={question.question_id}
                            className="question-card"
                        >
                            <h3 className="question-title">
                                {
                                    question.question_text
                                }
                            </h3>

                            <p className="question-info">
                                Difficulty:{" "}
                                {
                                    question.difficulty
                                }
                            </p>

                            <p className="question-info">
                                Marks:{" "}
                                {question.marks}
                            </p>

                            <div className="question-action-buttons">
                                <Link
                                    className="question-edit-link"
                                    to={`/edit-question/${question.question_id}`}
                                >
                                    Edit Question
                                </Link>

                                <button
                                    className="question-delete-btn"
                                    onClick={() =>
                                        handleDeleteQuestion(
                                            question.question_id
                                        )
                                    }
                                >
                                    Delete Question
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default EditExamPage;
