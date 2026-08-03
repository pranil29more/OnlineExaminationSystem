import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API_BASE_URL from "../services/api";
import Navbar from "../components/Navbar";
import "../styles/EditQuestionPage.css";

function EditQuestionPage() {
    const { questionId } = useParams();

    const navigate = useNavigate();

    const [questionText, setQuestionText] = useState("");
    const [difficulty, setDifficulty] = useState("Easy");
    const [marks, setMarks] = useState("");

    const [option1, setOption1] = useState("");
    const [option2, setOption2] = useState("");
    const [option3, setOption3] = useState("");
    const [option4, setOption4] = useState("");

    const [correctOption, setCorrectOption] = useState("");

    useEffect(() => {
        fetchQuestion();
    }, []);

    const fetchQuestion = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/question/${questionId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            setQuestionText(data.question_text);
            setDifficulty(data.difficulty);
            setMarks(data.marks);

            setOption1(data.options[0] || "");
            setOption2(data.options[1] || "");
            setOption3(data.options[2] || "");
            setOption4(data.options[3] || "");

            setCorrectOption(data.correct_option);
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpdateQuestion = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/update-question/${questionId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        question_text: questionText,
                        difficulty,
                        marks: Number(marks),
                        options: [
                            option1,
                            option2,
                            option3,
                            option4,
                        ],
                        correct_option: correctOption,
                    }),
                }
            );

            const data = await response.json();

            if (response.ok) {
                alert("Question Updated Successfully");
                navigate(-1);
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
                    Edit Question
                </h1>

                <div className="form-card">
                    <input
                        className="form-input"
                        type="text"
                        placeholder="Question"
                        value={questionText}
                        onChange={(e) =>
                            setQuestionText(e.target.value)
                        }
                    />

                    <select
                        className="form-select"
                        value={difficulty}
                        onChange={(e) =>
                            setDifficulty(e.target.value)
                        }
                    >
                        <option>Easy</option>
                        <option>Medium</option>
                        <option>Hard</option>
                    </select>

                    <input
                        className="form-input"
                        type="number"
                        placeholder="Marks"
                        value={marks}
                        onChange={(e) =>
                            setMarks(e.target.value)
                        }
                    />

                    <input
                        className="form-input"
                        type="text"
                        placeholder="Option 1"
                        value={option1}
                        onChange={(e) =>
                            setOption1(e.target.value)
                        }
                    />

                    <input
                        className="form-input"
                        type="text"
                        placeholder="Option 2"
                        value={option2}
                        onChange={(e) =>
                            setOption2(e.target.value)
                        }
                    />

                    <input
                        className="form-input"
                        type="text"
                        placeholder="Option 3"
                        value={option3}
                        onChange={(e) =>
                            setOption3(e.target.value)
                        }
                    />

                    <input
                        className="form-input"
                        type="text"
                        placeholder="Option 4"
                        value={option4}
                        onChange={(e) =>
                            setOption4(e.target.value)
                        }
                    />

                    <input
                        className="form-input"
                        type="text"
                        placeholder="Correct Option"
                        value={correctOption}
                        onChange={(e) =>
                            setCorrectOption(e.target.value)
                        }
                    />

                    <button
                        className="submit-btn"
                        onClick={handleUpdateQuestion}
                    >
                        Update Question
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EditQuestionPage;
