import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../services/api";
import Navbar from "../components/Navbar";
import "../styles/CreateExamPage.css";

function CreateExamPage() {
    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [duration, setDuration] = useState("");
    const [totalMarks, setTotalMarks] = useState("");
    const [passingMarks, setPassingMarks] = useState("");

    const handleCreateExam = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/create-exam`,
                {
                    method: "POST",
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
                alert("Exam Created Successfully");

                navigate(
                    `/add-question?examId=${data.exam_id}`
                );
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
                    Create Exam
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

                    <button
                        className="submit-btn"
                        onClick={handleCreateExam}
                    >
                        Create Exam
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CreateExamPage;
