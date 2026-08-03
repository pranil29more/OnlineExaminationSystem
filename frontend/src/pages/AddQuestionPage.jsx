import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import API_BASE_URL from "../services/api";
import Navbar from "../components/Navbar";
import "../styles/AddQuestionPage.css";

function AddQuestionPage() {
    const [searchParams] = useSearchParams();

    const [examId, setExamId] = useState(
        searchParams.get("examId") || ""
    );

    const [questionText, setQuestionText] =
        useState("");

    const [difficulty, setDifficulty] =
        useState("Easy");

    const [marks, setMarks] = useState("");

    const [option1, setOption1] = useState("");
    const [option2, setOption2] = useState("");
    const [option3, setOption3] = useState("");
    const [option4, setOption4] = useState("");

    const [correctOption, setCorrectOption] =
        useState("");

    const handleAddQuestion = async () => {
        try {
            const token =
                localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/add-question`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        exam_id: Number(examId),
                        question_text:
                            questionText,
                        difficulty,
                        marks: Number(marks),
                        options: [
                            option1,
                            option2,
                            option3,
                            option4,
                        ],
                        correct_option:
                            correctOption,
                    }),
                }
            );

            const data =
                await response.json();

            if (response.ok) {
                alert(
                    "Question Added Successfully"
                );

                setQuestionText("");
                setDifficulty("Easy");
                setMarks("");

                setOption1("");
                setOption2("");
                setOption3("");
                setOption4("");

                setCorrectOption("");
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
                    Add Question
                </h1>

                <div className="form-card">
                    <input
                        className="form-input"
                        type="number"
                        placeholder="Exam ID"
                        value={examId}
                        onChange={(e) =>
                            setExamId(
                                e.target.value
                            )
                        }
                    />

                    <input
                        className="form-input"
                        type="text"
                        placeholder="Question"
                        value={questionText}
                        onChange={(e) =>
                            setQuestionText(
                                e.target.value
                            )
                        }
                    />

                    <select
                        className="form-select"
                        value={difficulty}
                        onChange={(e) =>
                            setDifficulty(
                                e.target.value
                            )
                        }
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

                    <input
                        className="form-input"
                        type="number"
                        placeholder="Marks"
                        value={marks}
                        onChange={(e) =>
                            setMarks(
                                e.target.value
                            )
                        }
                    />

                    <input
                        className="form-input"
                        type="text"
                        placeholder="Option 1"
                        value={option1}
                        onChange={(e) =>
                            setOption1(
                                e.target.value
                            )
                        }
                    />

                    <input
                        className="form-input"
                        type="text"
                        placeholder="Option 2"
                        value={option2}
                        onChange={(e) =>
                            setOption2(
                                e.target.value
                            )
                        }
                    />

                    <input
                        className="form-input"
                        type="text"
                        placeholder="Option 3"
                        value={option3}
                        onChange={(e) =>
                            setOption3(
                                e.target.value
                            )
                        }
                    />

                    <input
                        className="form-input"
                        type="text"
                        placeholder="Option 4"
                        value={option4}
                        onChange={(e) =>
                            setOption4(
                                e.target.value
                            )
                        }
                    />

                    <input
                        className="form-input"
                        type="text"
                        placeholder="Correct Option"
                        value={correctOption}
                        onChange={(e) =>
                            setCorrectOption(
                                e.target.value
                            )
                        }
                    />

                    <button
                        className="submit-btn"
                        onClick={
                            handleAddQuestion
                        }
                    >
                        Add Question
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AddQuestionPage;
