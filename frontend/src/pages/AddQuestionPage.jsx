import { useState } from "react";
import {
    useLocation,
    useNavigate,
    useSearchParams,
} from "react-router-dom";

import API_BASE_URL from "../services/api";
import Navbar from "../components/Navbar";

import "../styles/AddQuestionPage.css";

function AddQuestionPage() {

    const navigate = useNavigate();

    const location = useLocation();

    const [searchParams] =
        useSearchParams();

    const [examId, setExamId] = useState(
        searchParams.get("examId") || ""
    );

    const [entryMode, setEntryMode] =
        useState("manual");

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

    const [bulkMarks, setBulkMarks] =
        useState("");

    const [bulkFile, setBulkFile] =
        useState(null);

    const [bulkUploading, setBulkUploading] =
        useState(false);

    const [questionAdding, setQuestionAdding] =
        useState(false);

    const [doneProcessing, setDoneProcessing] =
        useState(false);


    // =========================================================
    // Navigation Destination
    // =========================================================

    const handleFinishNavigation = () => {

        const from =
            location.state?.from;

        if (from === "edit-exam") {

            navigate(
                `/edit-exam/${examId}`
            );

            return;
        }

        navigate(
            `/exam/${examId}`
        );
    };


    // =========================================================
    // Manual Add Question
    // =========================================================

    const handleAddQuestion = async () => {

        if (!examId) {

            alert(
                "Please enter the Exam ID."
            );

            return false;
        }

        if (!questionText.trim()) {

            alert(
                "Please enter the question."
            );

            return false;
        }

        if (
            !marks ||
            Number(marks) <= 0
        ) {

            alert(
                "Please enter valid marks."
            );

            return false;
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

            return false;
        }

        if (!correctOption.trim()) {

            alert(
                "Please enter the correct option."
            );

            return false;
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

            return false;
        }

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

                        Authorization:
                            `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        exam_id:
                            Number(examId),

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

                return true;

            } else {

                alert(
                    data.message ||
                        "Unable to add question."
                );

                return false;
            }

        } catch (error) {

            console.error(error);

            alert(
                "Unable to add question."
            );

            return false;
        }
    };


    // =========================================================
    // Add Question Button
    // =========================================================

    const handleAddQuestionClick = async () => {

        if (
            questionAdding ||
            doneProcessing ||
            bulkUploading
        ) {
            return;
        }

        setQuestionAdding(true);

        try {

            await handleAddQuestion();

        } finally {

            setQuestionAdding(false);
        }
    };


    // =========================================================
    // Done
    // =========================================================

    const handleDone = () => {

        if (
            questionAdding ||
            bulkUploading
        ) {
            return;
        }

        if (!examId) {

            alert(
                "Please enter the Exam ID."
            );

            return;
        }

        handleFinishNavigation();
    };


    // =========================================================
    // Bulk File Selection
    // =========================================================

    const handleBulkFileChange = (
        event
    ) => {

        const selectedFile =
            event.target.files[0];

        if (!selectedFile) {

            setBulkFile(null);

            return;
        }

        const fileName =
            selectedFile.name.toLowerCase();

        if (
            !fileName.endsWith(".xlsx")
        ) {

            alert(
                "Please select an .xlsx Excel file."
            );

            event.target.value = "";

            setBulkFile(null);

            return;
        }

        setBulkFile(selectedFile);
    };


    // =========================================================
    // Bulk Upload Questions
    // =========================================================

    const handleBulkUpload = async () => {

        if (
            bulkUploading ||
            questionAdding ||
            doneProcessing
        ) {
            return;
        }

        if (!examId) {

            alert(
                "Please enter the Exam ID."
            );

            return;
        }

        if (
            !bulkMarks ||
            Number(bulkMarks) <= 0
        ) {

            alert(
                "Please enter valid marks per question."
            );

            return;
        }

        if (!bulkFile) {

            alert(
                "Please select an Excel file."
            );

            return;
        }

        try {

            setBulkUploading(true);

            const token =
                localStorage.getItem("token");

            const formData =
                new FormData();

            formData.append(
                "exam_id",
                examId
            );

            formData.append(
                "marks",
                bulkMarks
            );

            formData.append(
                "file",
                bulkFile
            );

            const response = await fetch(
                `${API_BASE_URL}/bulk-upload-questions`,
                {
                    method: "POST",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },

                    body: formData,
                }
            );

            const data =
                await response.json();

            if (!response.ok) {

                alert(
                    data.message ||
                        "Unable to upload questions."
                );

                return;
            }

            alert(
                data.message ||
                    "Questions uploaded successfully."
            );

            setBulkMarks("");

            setBulkFile(null);

            const fileInput =
                document.getElementById(
                    "bulk-question-file"
                );

            if (fileInput) {

                fileInput.value = "";
            }

            handleFinishNavigation();

        } catch (error) {

            console.error(error);

            alert(
                "Unable to upload questions."
            );

        } finally {

            setBulkUploading(false);
        }
    };


    return (

        <div className="aqp-page">

            <Navbar />

            <div className="aqp-container">

                <div className="aqp-header">

                    <span className="aqp-eyebrow">
                        Examination Management
                    </span>

                    <h1 className="aqp-title">
                        Add Questions
                    </h1>

                    <p className="aqp-description">
                        Add questions manually or upload
                        multiple MCQ questions using the
                        prescribed Excel format.
                    </p>

                </div>


                <div className="aqp-form-card">

                    {/* =================================================
                        Exam ID
                    ================================================= */}

                    <div className="aqp-exam-section">

                        <label className="aqp-field-label">
                            Exam ID
                        </label>

                        <input
                            className="aqp-form-input"
                            type="number"
                            placeholder="Exam ID"
                            value={examId}
                            onChange={(event) =>
                                setExamId(
                                    event.target.value
                                )
                            }
                            disabled={
                                questionAdding ||
                                doneProcessing ||
                                bulkUploading
                            }
                        />

                    </div>


                    {/* =================================================
                        Entry Mode
                    ================================================= */}

                    <div className="aqp-mode-switch">

                        <button
                            type="button"
                            className={`aqp-mode-btn ${
                                entryMode === "manual"
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() =>
                                setEntryMode(
                                    "manual"
                                )
                            }
                            disabled={
                                questionAdding ||
                                doneProcessing ||
                                bulkUploading
                            }
                        >
                            Manual Entry
                        </button>

                        <button
                            type="button"
                            className={`aqp-mode-btn ${
                                entryMode === "bulk"
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() =>
                                setEntryMode(
                                    "bulk"
                                )
                            }
                            disabled={
                                questionAdding ||
                                doneProcessing ||
                                bulkUploading
                            }
                        >
                            Bulk Upload
                        </button>

                    </div>


                    {/* =================================================
                        Manual Entry
                    ================================================= */}

                    {entryMode === "manual" && (

                        <div className="aqp-mode-content">

                            <div className="aqp-section-heading">

                                <span className="aqp-section-eyebrow">
                                    Question Entry
                                </span>

                                <h2 className="aqp-section-title">
                                    Add Question Manually
                                </h2>

                                <p className="aqp-section-description">
                                    Create a single MCQ
                                    question for the
                                    selected examination.
                                </p>

                            </div>


                            <label className="aqp-field-label">
                                Question
                            </label>

                            <input
                                className="aqp-form-input"
                                type="text"
                                placeholder="Enter question"
                                value={questionText}
                                onChange={(event) =>
                                    setQuestionText(
                                        event.target.value
                                    )
                                }
                                disabled={
                                    questionAdding ||
                                    doneProcessing ||
                                    bulkUploading
                                }
                            />


                            <label className="aqp-field-label">
                                Difficulty
                            </label>

                            <select
                                className="aqp-form-select"
                                value={difficulty}
                                onChange={(event) =>
                                    setDifficulty(
                                        event.target.value
                                    )
                                }
                                disabled={
                                    questionAdding ||
                                    doneProcessing ||
                                    bulkUploading
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


                            <label className="aqp-field-label">
                                Marks
                            </label>

                            <input
                                className="aqp-form-input"
                                type="number"
                                min="0.01"
                                step="0.01"
                                placeholder="Marks"
                                value={marks}
                                onChange={(event) =>
                                    setMarks(
                                        event.target.value
                                    )
                                }
                                disabled={
                                    questionAdding ||
                                    doneProcessing ||
                                    bulkUploading
                                }
                            />


                            <div className="aqp-subheading">
                                Answer Options
                            </div>

                            <div className="aqp-options-grid">

                                <input
                                    className="aqp-form-input"
                                    type="text"
                                    placeholder="Option 1"
                                    value={option1}
                                    onChange={(event) =>
                                        setOption1(
                                            event.target.value
                                        )
                                    }
                                    disabled={
                                        questionAdding ||
                                        doneProcessing ||
                                        bulkUploading
                                    }
                                />

                                <input
                                    className="aqp-form-input"
                                    type="text"
                                    placeholder="Option 2"
                                    value={option2}
                                    onChange={(event) =>
                                        setOption2(
                                            event.target.value
                                        )
                                    }
                                    disabled={
                                        questionAdding ||
                                        doneProcessing ||
                                        bulkUploading
                                    }
                                />

                                <input
                                    className="aqp-form-input"
                                    type="text"
                                    placeholder="Option 3"
                                    value={option3}
                                    onChange={(event) =>
                                        setOption3(
                                            event.target.value
                                        )
                                    }
                                    disabled={
                                        questionAdding ||
                                        doneProcessing ||
                                        bulkUploading
                                    }
                                />

                                <input
                                    className="aqp-form-input"
                                    type="text"
                                    placeholder="Option 4"
                                    value={option4}
                                    onChange={(event) =>
                                        setOption4(
                                            event.target.value
                                        )
                                    }
                                    disabled={
                                        questionAdding ||
                                        doneProcessing ||
                                        bulkUploading
                                    }
                                />

                            </div>


                            <label className="aqp-field-label">
                                Correct Answer
                            </label>

                            <input
                                className="aqp-form-input"
                                type="text"
                                placeholder="Enter the exact correct option"
                                value={correctOption}
                                onChange={(event) =>
                                    setCorrectOption(
                                        event.target.value
                                    )
                                }
                                disabled={
                                    questionAdding ||
                                    doneProcessing ||
                                    bulkUploading
                                }
                            />

                            <p className="aqp-form-hint">
                                The correct answer must
                                match one of the four
                                options.
                            </p>


                            {/* =================================================
                                Add Question + Done
                            ================================================= */}

                            <div className="aqp-question-actions">

                                <button
                                    type="button"
                                    className="aqp-submit-btn"
                                    onClick={
                                        handleAddQuestionClick
                                    }
                                    disabled={
                                        questionAdding ||
                                        doneProcessing ||
                                        bulkUploading
                                    }
                                >
                                    {questionAdding
                                        ? "Adding Question..."
                                        : "Add Question"}
                                </button>

                                <button
    type="button"
    className="aqp-done-btn"
    onClick={handleDone}
    disabled={
        questionAdding ||
        bulkUploading
    }
>
    Done
</button>

                            </div>

                        </div>

                    )}


                    {/* =================================================
                        Bulk Upload
                    ================================================= */}

                    {entryMode === "bulk" && (

                        <div className="aqp-mode-content">

                            <div className="aqp-section-heading">

                                <span className="aqp-section-eyebrow">
                                    Question Import
                                </span>

                                <h2 className="aqp-section-title">
                                    Bulk Upload Questions
                                </h2>

                                <p className="aqp-section-description">
                                    Upload multiple MCQ
                                    questions using the
                                    prescribed Excel
                                    format.
                                </p>

                            </div>


                            <div className="aqp-format-card">

                                <div className="aqp-format-title">
                                    Required Excel Columns
                                </div>

                                <div className="aqp-column-list">

                                    <span>
                                        Question Difficulty
                                    </span>

                                    <span>
                                        Question
                                    </span>

                                    <span>
                                        Option A
                                    </span>

                                    <span>
                                        Option B
                                    </span>

                                    <span>
                                        Option C
                                    </span>

                                    <span>
                                        Option D
                                    </span>

                                    <span>
                                        Correct Answer
                                    </span>

                                </div>

                                <p className="aqp-format-note">
                                    Correct Answer should
                                    contain the actual
                                    answer text and must
                                    match one of Option A,
                                    B, C, or D.
                                </p>

                            </div>


                            <label className="aqp-field-label">
                                Marks Per Question
                            </label>

                            <input
                                className="aqp-form-input"
                                type="number"
                                min="0.01"
                                step="0.01"
                                placeholder="Enter marks per question"
                                value={bulkMarks}
                                onChange={(event) =>
                                    setBulkMarks(
                                        event.target.value
                                    )
                                }
                                disabled={
                                    bulkUploading ||
                                    questionAdding ||
                                    doneProcessing
                                }
                            />

                            <p className="aqp-form-hint">
                                These marks will be applied
                                to every question in the
                                uploaded file.
                            </p>


                            <label className="aqp-field-label">
                                Questions Excel File
                            </label>

                            <div className="aqp-upload-box">

                                <input
                                    id="bulk-question-file"
                                    className="aqp-file-input"
                                    type="file"
                                    accept=".xlsx"
                                    onChange={
                                        handleBulkFileChange
                                    }
                                    disabled={
                                        bulkUploading ||
                                        questionAdding ||
                                        doneProcessing
                                    }
                                />

                                <label
                                    htmlFor="bulk-question-file"
                                    className="aqp-file-label"
                                >
                                    Choose Excel File
                                </label>

                                <div className="aqp-file-info">

                                    {bulkFile ? (

                                        <>
                                            <strong>
                                                {
                                                    bulkFile.name
                                                }
                                            </strong>

                                            <span>
                                                Excel file
                                                ready for
                                                upload
                                            </span>
                                        </>

                                    ) : (

                                        <>
                                            <strong>
                                                No file
                                                selected
                                            </strong>

                                            <span>
                                                Only .xlsx
                                                files are
                                                supported
                                            </span>
                                        </>

                                    )}

                                </div>

                            </div>


                            <button
                                type="button"
                                className="aqp-upload-btn"
                                onClick={
                                    handleBulkUpload
                                }
                                disabled={
                                    bulkUploading ||
                                    questionAdding ||
                                    doneProcessing
                                }
                            >
                                {bulkUploading
                                    ? "Uploading Questions..."
                                    : "Upload Questions"}
                            </button>

                        </div>

                    )}

                </div>

            </div>

        </div>
    );
}

export default AddQuestionPage;