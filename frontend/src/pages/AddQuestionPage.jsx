import { useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import API_BASE_URL from "../services/api";
import Navbar from "../components/Navbar";
import "../styles/AddQuestionPage.css";

const emptyTestCase = () => ({
    input_data: "",
    expected_output: "",
    is_hidden: false,
});

function AddQuestionPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const [examId, setExamId] = useState(searchParams.get("examId") || "");
    const [entryMode, setEntryMode] = useState("manual");
    const [questionType, setQuestionType] = useState("mcq");
    const [bulkType, setBulkType] = useState("mcq");

    const [questionText, setQuestionText] = useState("");
    const [difficulty, setDifficulty] = useState("Easy");
    const [marks, setMarks] = useState("");
    const [option1, setOption1] = useState("");
    const [option2, setOption2] = useState("");
    const [option3, setOption3] = useState("");
    const [option4, setOption4] = useState("");
    const [correctOption, setCorrectOption] = useState("");

    const [starterCode, setStarterCode] = useState("");
    const [testCases, setTestCases] = useState([emptyTestCase()]);

    const [bulkMcqMarks, setBulkMcqMarks] = useState("");
    const [bulkMcqFile, setBulkMcqFile] = useState(null);
    const [bulkQuestionsFile, setBulkQuestionsFile] = useState(null);
    const [bulkTestCasesFile, setBulkTestCasesFile] = useState(null);

    const [questionAdding, setQuestionAdding] = useState(false);
    const [bulkUploading, setBulkUploading] = useState(false);
    const [doneProcessing, setDoneProcessing] = useState(false);

    const isBusy = questionAdding || bulkUploading || doneProcessing;

    const token = () => localStorage.getItem("token");

    const handleFinishNavigation = () => {
        if (location.state?.from === "edit-exam") {
            navigate(`/edit-exam/${examId}`);
        } else {
            navigate(`/exam/${examId}`);
        }
    };

    const validateCommon = () => {
        if (!examId || Number(examId) <= 0) {
            alert("Please enter a valid Exam ID.");
            return false;
        }
        if (!questionText.trim()) {
            alert("Please enter the question.");
            return false;
        }
        if (!marks || Number(marks) <= 0) {
            alert("Please enter valid marks.");
            return false;
        }
        return true;
    };

    const handleAddMCQ = async () => {
        if (!validateCommon()) return false;
        const options = [option1.trim(), option2.trim(), option3.trim(), option4.trim()];
        if (options.some((option) => !option)) {
            alert("Please enter all four options.");
            return false;
        }
        if (!correctOption.trim()) {
            alert("Please enter the correct option.");
            return false;
        }
        const correct = options.find(
            (option) => option.toLowerCase() === correctOption.trim().toLowerCase()
        );
        if (!correct) {
            alert("Correct option must match one of the four options.");
            return false;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/add-question`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token()}`,
                },
                body: JSON.stringify({
                    exam_id: Number(examId),
                    question_text: questionText.trim(),
                    difficulty,
                    marks: Number(marks),
                    options,
                    correct_option: correct,
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                alert(data.message || "Unable to add question.");
                return false;
            }
            alert(data.message || "Question added successfully.");
            setQuestionText("");
            setDifficulty("Easy");
            setMarks("");
            setOption1("");
            setOption2("");
            setOption3("");
            setOption4("");
            setCorrectOption("");
            return true;
        } catch (error) {
            console.error(error);
            alert("Unable to add question.");
            return false;
        }
    };

    const handleAddCoding = async () => {
        if (!validateCommon()) return false;
        if (!starterCode.trim()) {
            alert("Please enter the starter code.");
            return false;
        }
        if (!testCases.length) {
            alert("At least one test case is required.");
            return false;
        }
        for (let i = 0; i < testCases.length; i += 1) {
            if (!testCases[i].expected_output.trim()) {
                alert(`Please enter expected output for Test Case ${i + 1}.`);
                return false;
            }
        }

        try {
            const response = await fetch(`${API_BASE_URL}/add-coding-question`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token()}`,
                },
                body: JSON.stringify({
                    exam_id: Number(examId),
                    question_text: questionText.trim(),
                    difficulty,
                    marks: Number(marks),
                    starter_code: starterCode,
                    language: "python",
                    test_cases: testCases.map((item) => ({
                        input_data: item.input_data,
                        expected_output: item.expected_output.trim(),
                        is_hidden: Boolean(item.is_hidden),
                    })),
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                alert(data.message || "Unable to add coding question.");
                return false;
            }
            alert(data.message || "Coding question added successfully.");
            setQuestionText("");
            setDifficulty("Easy");
            setMarks("");
            setStarterCode("");
            setTestCases([emptyTestCase()]);
            return true;
        } catch (error) {
            console.error(error);
            alert("Unable to add coding question.");
            return false;
        }
    };

    const handleAddQuestion = async () => {
        if (isBusy) return;
        setQuestionAdding(true);
        try {
            if (questionType === "mcq") await handleAddMCQ();
            else await handleAddCoding();
        } finally {
            setQuestionAdding(false);
        }
    };

    const handleDone = () => {
        if (questionAdding || bulkUploading) return;
        if (!examId || Number(examId) <= 0) {
            alert("Please enter a valid Exam ID.");
            return;
        }
        setDoneProcessing(true);
        handleFinishNavigation();
    };

    const updateTestCase = (index, field, value) => {
        if (isBusy) return;
        setTestCases((current) => current.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
    };

    const addTestCase = () => {
        if (!isBusy) setTestCases((current) => [...current, emptyTestCase()]);
    };

    const removeTestCase = (index) => {
        if (isBusy) return;
        if (testCases.length === 1) {
            alert("At least one test case is required.");
            return;
        }
        setTestCases((current) => current.filter((_, i) => i !== index));
    };

    const toggleTestCase = (index) => {
        if (isBusy) return;
        setTestCases((current) => current.map((item, i) => (
            i === index ? { ...item, is_hidden: !item.is_hidden } : item
        )));
    };

    const selectXlsx = (event, setter, label) => {
        const file = event.target.files?.[0];
        if (!file) {
            setter(null);
            return;
        }
        if (!file.name.toLowerCase().endsWith(".xlsx")) {
            alert(`Please select an .xlsx ${label} file.`);
            event.target.value = "";
            setter(null);
            return;
        }
        setter(file);
    };

    const handleBulkUpload = async () => {
        if (isBusy) return;
        if (!examId || Number(examId) <= 0) {
            alert("Please enter a valid Exam ID.");
            return;
        }

        const formData = new FormData();
        formData.append("exam_id", examId);

        if (bulkType === "mcq") {
            if (!bulkMcqMarks || Number(bulkMcqMarks) <= 0) {
                alert("Please enter valid marks per MCQ question.");
                return;
            }
            if (!bulkMcqFile) {
                alert("Please select the MCQ Excel file.");
                return;
            }
            formData.append("marks", bulkMcqMarks);
            formData.append("file", bulkMcqFile);
        } else {
            if (!bulkQuestionsFile || !bulkTestCasesFile) {
                alert("Please select both Coding Questions and Test Cases Excel files.");
                return;
            }
            formData.append("questions_file", bulkQuestionsFile);
            formData.append("test_cases_file", bulkTestCasesFile);
        }

        try {
            setBulkUploading(true);
            const endpoint = bulkType === "mcq"
                ? "/bulk-upload-mcq-questions"
                : "/bulk-upload-coding-questions";
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token()}` },
                body: formData,
            });
            const data = await response.json();
            if (!response.ok) {
                alert(data.message || "Unable to upload questions.");
                return;
            }
            alert(data.message || "Questions uploaded successfully.");
            setBulkMcqFile(null);
            setBulkQuestionsFile(null);
            setBulkTestCasesFile(null);
            ["bulk-mcq-file", "bulk-coding-questions-file", "bulk-coding-test-cases-file"].forEach((id) => {
                const input = document.getElementById(id);
                if (input) input.value = "";
            });
            handleFinishNavigation();
        } catch (error) {
            console.error(error);
            alert("Unable to upload questions.");
        } finally {
            setBulkUploading(false);
        }
    };

    return (
        <div className="aqp-page">
            <Navbar />
            <div className="aqp-container">
                <div className="aqp-header">
                    <span className="aqp-eyebrow">Examination Management</span>
                    <h1 className="aqp-title">Add Questions</h1>
                    <p className="aqp-description">
                        Add MCQ or Python coding questions manually, or bulk import MCQs and coding questions using their prescribed Excel templates.
                    </p>
                </div>

                <div className="aqp-form-card">
                    <div className="aqp-exam-section">
                        <label className="aqp-field-label">Exam ID</label>
                        <input
                            className="aqp-form-input"
                            type="number"
                            min="1"
                            placeholder="Exam ID"
                            value={examId}
                            onChange={(e) => setExamId(e.target.value)}
                            disabled={isBusy}
                        />
                    </div>

                    <div className="aqp-mode-label">Question Entry Method</div>
                    <div className="aqp-mode-switch">
                        <button type="button" className={`aqp-mode-btn ${entryMode === "manual" ? "active" : ""}`} onClick={() => setEntryMode("manual")} disabled={isBusy}>Manual Entry</button>
                        <button type="button" className={`aqp-mode-btn ${entryMode === "bulk" ? "active" : ""}`} onClick={() => setEntryMode("bulk")} disabled={isBusy}>Bulk Upload</button>
                    </div>

                    {entryMode === "manual" && (
                        <div className="aqp-mode-content">
                            <div className="aqp-section-heading">
                                <span className="aqp-section-eyebrow">Question Entry</span>
                                <h2 className="aqp-section-title">Create Question</h2>
                                <p className="aqp-section-description">Choose the question type and enter the required details.</p>
                            </div>

                            <label className="aqp-field-label">Question Type</label>
                            <div className="aqp-question-type-switch">
                                <button type="button" className={`aqp-question-type-btn ${questionType === "mcq" ? "active" : ""}`} onClick={() => setQuestionType("mcq")} disabled={isBusy}>MCQ</button>
                                <button type="button" className={`aqp-question-type-btn ${questionType === "coding" ? "active" : ""}`} onClick={() => setQuestionType("coding")} disabled={isBusy}>Coding</button>
                            </div>

                            <label className="aqp-field-label">{questionType === "coding" ? "Coding Question" : "Question"}</label>
                            <textarea className="aqp-form-textarea aqp-question-textarea" placeholder={questionType === "coding" ? "Enter the coding problem statement" : "Enter question"} value={questionText} onChange={(e) => setQuestionText(e.target.value)} disabled={isBusy} />

                            <label className="aqp-field-label">Difficulty</label>
                            <select className="aqp-form-select" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} disabled={isBusy}>
                                <option value="Easy">Easy</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                            </select>

                            <label className="aqp-field-label">Marks</label>
                            <input className="aqp-form-input" type="number" min="0.01" step="0.01" placeholder="Marks" value={marks} onChange={(e) => setMarks(e.target.value)} disabled={isBusy} />

                            {questionType === "mcq" ? (
                                <>
                                    <div className="aqp-subheading">Answer Options</div>
                                    <div className="aqp-options-grid">
                                        {[option1, option2, option3, option4].map((value, index) => {
                                            const setters = [setOption1, setOption2, setOption3, setOption4];
                                            return <input key={index} className="aqp-form-input" type="text" placeholder={`Option ${index + 1}`} value={value} onChange={(e) => setters[index](e.target.value)} disabled={isBusy} />;
                                        })}
                                    </div>
                                    <label className="aqp-field-label">Correct Answer</label>
                                    <input className="aqp-form-input" type="text" placeholder="Enter the exact correct option" value={correctOption} onChange={(e) => setCorrectOption(e.target.value)} disabled={isBusy} />
                                    <p className="aqp-form-hint">The correct answer must match one of the four options.</p>
                                </>
                            ) : (
                                <div className="aqp-coding-section">
                                    <div className="aqp-coding-info-card">
                                        <div className="aqp-coding-info-item"><span className="aqp-coding-info-label">Language</span><strong>Python</strong></div>
                                        <div className="aqp-coding-info-item"><span className="aqp-coding-info-label">Evaluation</span><strong>Full Marks / Zero</strong></div>
                                    </div>
                                    <label className="aqp-field-label">Programming Language</label>
                                    <select className="aqp-form-select" value="python" disabled><option value="python">Python</option></select>
                                    <p className="aqp-form-hint">Python is currently the supported coding language.</p>
                                    <label className="aqp-field-label">Starter Code</label>
                                    <textarea className="aqp-form-textarea aqp-code-textarea" placeholder="Enter starter Python code" value={starterCode} onChange={(e) => setStarterCode(e.target.value)} disabled={isBusy} spellCheck="false" />
                                    <p className="aqp-form-hint">Candidates receive this code as their starting point.</p>

                                    <div className="aqp-test-case-header">
                                        <div><div className="aqp-subheading aqp-no-margin">Test Cases</div><p className="aqp-test-case-description">Add visible and hidden tests used to evaluate the submitted Python code.</p></div>
                                        <button type="button" className="aqp-add-test-btn" onClick={addTestCase} disabled={isBusy}>+ Add Test Case</button>
                                    </div>

                                    <div className="aqp-test-cases">
                                        {testCases.map((testCase, index) => (
                                            <div className="aqp-test-case-card" key={index}>
                                                <div className="aqp-test-case-top">
                                                    <div className="aqp-test-case-number">Test Case {index + 1}</div>
                                                    <div className="aqp-test-case-actions">
                                                        <button type="button" className={`aqp-visibility-btn ${testCase.is_hidden ? "hidden-test" : "visible-test"}`} onClick={() => toggleTestCase(index)} disabled={isBusy}>{testCase.is_hidden ? "Hidden" : "Visible"}</button>
                                                        <button type="button" className="aqp-remove-test-btn" onClick={() => removeTestCase(index)} disabled={isBusy || testCases.length === 1}>Remove</button>
                                                    </div>
                                                </div>
                                                <div className="aqp-test-case-grid">
                                                    <div className="aqp-test-case-field"><label className="aqp-field-label">Input</label><textarea className="aqp-form-textarea aqp-test-textarea" placeholder="Input passed to the program" value={testCase.input_data} onChange={(e) => updateTestCase(index, "input_data", e.target.value)} disabled={isBusy} spellCheck="false" /></div>
                                                    <div className="aqp-test-case-field"><label className="aqp-field-label">Expected Output</label><textarea className="aqp-form-textarea aqp-test-textarea" placeholder="Expected program output" value={testCase.expected_output} onChange={(e) => updateTestCase(index, "expected_output", e.target.value)} disabled={isBusy} spellCheck="false" /></div>
                                                </div>
                                                <div className="aqp-test-case-bottom"><div className="aqp-test-case-status"><span className={`aqp-status-dot ${testCase.is_hidden ? "hidden" : "visible"}`} />{testCase.is_hidden ? "Hidden test case" : "Visible test case"}</div></div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="aqp-coding-note">Hidden test cases are never shown to candidates. Coding evaluation is full marks or zero; partial marking is not used.</p>
                                </div>
                            )}

                            <div className="aqp-question-actions">
                                <button type="button" className="aqp-submit-btn" onClick={handleAddQuestion} disabled={isBusy}>{questionAdding ? "Adding Question..." : questionType === "coding" ? "Add Coding Question" : "Add Question"}</button>
                                <button type="button" className="aqp-done-btn" onClick={handleDone} disabled={questionAdding || bulkUploading}>Done</button>
                            </div>
                        </div>
                    )}

                    {entryMode === "bulk" && (
                        <div className="aqp-mode-content">
                            <div className="aqp-section-heading">
                                <span className="aqp-section-eyebrow">Excel Import</span>
                                <h2 className="aqp-section-title">Bulk Upload</h2>
                                <p className="aqp-section-description">Choose MCQ bulk upload or the two-file Python coding-question import.</p>
                            </div>

                            <div className="aqp-question-type-switch">
                                <button type="button" className={`aqp-question-type-btn ${bulkType === "mcq" ? "active" : ""}`} onClick={() => setBulkType("mcq")} disabled={isBusy}>MCQ Bulk Upload</button>
                                <button type="button" className={`aqp-question-type-btn ${bulkType === "coding" ? "active" : ""}`} onClick={() => setBulkType("coding")} disabled={isBusy}>Coding Bulk Upload</button>
                            </div>

                            {bulkType === "mcq" ? (
                                <>
                                    <div className="aqp-format-card">
                                        <div className="aqp-format-title">MCQ Excel Columns</div>
                                        <div className="aqp-column-list">
                                            {['Question Difficulty', 'Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer'].map((column) => <span key={column}>{column}</span>)}
                                        </div>
                                        <p className="aqp-format-note">Correct Answer must match one of Option A, B, C, or D. Marks are supplied once for the whole upload.</p>
                                    </div>

                                    <label className="aqp-field-label">Marks Per Question</label>
                                    <input className="aqp-form-input" type="number" min="0.01" step="0.01" placeholder="Enter marks per question" value={bulkMcqMarks} onChange={(e) => setBulkMcqMarks(e.target.value)} disabled={isBusy} />

                                    <label className="aqp-field-label">MCQ Questions Excel File</label>
                                    <div className="aqp-upload-box">
                                        <input id="bulk-mcq-file" className="aqp-file-input" type="file" accept=".xlsx" onChange={(e) => selectXlsx(e, setBulkMcqFile, "MCQ")} disabled={isBusy} />
                                        <label htmlFor="bulk-mcq-file" className="aqp-file-label">Choose MCQ Excel File</label>
                                        <div className="aqp-file-info"><strong>{bulkMcqFile ? bulkMcqFile.name : "No MCQ file selected"}</strong><span>{bulkMcqFile ? "Excel file ready for upload" : "Only .xlsx files are supported"}</span></div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="aqp-format-card">
                                        <div className="aqp-format-title">Coding Questions.xlsx Columns</div>
                                        <div className="aqp-column-list">
                                            {['Question Key', 'Language', 'Question Difficulty', 'Question', 'Marks', 'Starter Code'].map((column) => <span key={column}>{column}</span>)}
                                        </div>
                                        <p className="aqp-format-note">Question Key uniquely identifies each coding question. Language is currently Python.</p>
                                    </div>
                                    <div className="aqp-format-card">
                                        <div className="aqp-format-title">Coding Test Cases.xlsx Columns</div>
                                        <div className="aqp-column-list">
                                            {['Question Key', 'Language', 'Test Case Order', 'Input Data', 'Expected Output', 'Hidden'].map((column) => <span key={column}>{column}</span>)}
                                        </div>
                                        <p className="aqp-format-note">Use the same Question Key in both files. Hidden accepts TRUE/FALSE, YES/NO, or 1/0.</p>
                                    </div>
                                    <div className="aqp-bulk-rules-card">
                                        <div className="aqp-bulk-rules-title">Coding Bulk Upload Rules</div>
                                        <ul className="aqp-bulk-rules-list">
                                            <li>Both Excel files are required.</li>
                                            <li>Every test-case Question Key must exist in the Questions file.</li>
                                            <li>Every coding question must have at least one test case.</li>
                                            <li>Test Case Order must be unique within a Question Key.</li>
                                            <li>Language must match in both files and is currently Python.</li>
                                            <li>Marks are read from Coding Questions.xlsx.</li>
                                        </ul>
                                    </div>
                                    <label className="aqp-field-label">Coding Questions Excel File</label>
                                    <div className="aqp-upload-box">
                                        <input id="bulk-coding-questions-file" className="aqp-file-input" type="file" accept=".xlsx" onChange={(e) => selectXlsx(e, setBulkQuestionsFile, "Coding Questions")} disabled={isBusy} />
                                        <label htmlFor="bulk-coding-questions-file" className="aqp-file-label">Choose Questions File</label>
                                        <div className="aqp-file-info"><strong>{bulkQuestionsFile ? bulkQuestionsFile.name : "No questions file selected"}</strong><span>{bulkQuestionsFile ? "Coding Questions.xlsx selected" : "Select the coding questions file"}</span></div>
                                    </div>
                                    <label className="aqp-field-label">Coding Test Cases Excel File</label>
                                    <div className="aqp-upload-box">
                                        <input id="bulk-coding-test-cases-file" className="aqp-file-input" type="file" accept=".xlsx" onChange={(e) => selectXlsx(e, setBulkTestCasesFile, "Coding Test Cases")} disabled={isBusy} />
                                        <label htmlFor="bulk-coding-test-cases-file" className="aqp-file-label">Choose Test Cases File</label>
                                        <div className="aqp-file-info"><strong>{bulkTestCasesFile ? bulkTestCasesFile.name : "No test cases file selected"}</strong><span>{bulkTestCasesFile ? "Coding Test Cases.xlsx selected" : "Select the test cases file"}</span></div>
                                    </div>
                                </>
                            )}

                            <button type="button" className="aqp-upload-btn" onClick={handleBulkUpload} disabled={isBusy}>{bulkUploading ? "Uploading Questions..." : bulkType === "mcq" ? "Upload MCQ Questions" : "Upload Coding Questions & Test Cases"}</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AddQuestionPage;
