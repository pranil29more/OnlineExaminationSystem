import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import API_BASE_URL from "../services/api";
import Navbar from "../components/Navbar";
import PageLoader from "../components/PageLoader";

import "../styles/ExamDetailsPage.css";


function ExamDetailsPage() {

    const { examId } = useParams();

    const navigate = useNavigate();

    const [exam, setExam] = useState(null);

    const [answers, setAnswers] = useState({});

    const [role, setRole] = useState("");

    const [timeLeft, setTimeLeft] = useState("");

    const [timerState, setTimerState] =
        useState("normal");

    const [submissionId, setSubmissionId] =
        useState(null);

    const [endTime, setEndTime] =
        useState(null);

    const [isSubmitting, setIsSubmitting] =
        useState(false);

    const [loadingExam, setLoadingExam] =
        useState(true);

    const hasAutoSubmitted =
        useRef(false);

    const pendingSaves =
        useRef(new Set());

    const answerRequestVersions =
        useRef({});


    // =====================================================
    // Parse Backend IST Time Safely
    //
    // Backend stores/returns submission start_time
    // in IST (+05:30).
    //
    // Explicitly attach +05:30 so the browser does
    // NOT guess the timezone.
    // =====================================================

    const parseISTTime = (value) => {

        if (!value) {
            return NaN;
        }

        const normalized =
            String(value)
                .trim()
                .replace(" ", "T");

        if (
            normalized.endsWith("Z") ||
            /[+-]\d{2}:\d{2}$/.test(normalized)
        ) {

            return new Date(
                normalized
            ).getTime();

        }

        return new Date(
            `${normalized}+05:30`
        ).getTime();
    };


    // =====================================================
    // Fetch Exam
    // =====================================================

    useEffect(() => {

        fetchExam();

    }, [examId]);


    // =====================================================
    // Exam Timer
    // =====================================================

    useEffect(() => {

        if (!endTime) {
            return;
        }


        const updateTimer = () => {

            const remaining =
                endTime - Date.now();


            if (remaining <= 0) {

                setTimeLeft(
                    "00:00"
                );

                setTimerState(
                    "critical"
                );


                if (
                    !hasAutoSubmitted.current
                ) {

                    hasAutoSubmitted.current =
                        true;

                    setIsSubmitting(
                        true
                    );

                    handleSubmitExam();
                }

                return;
            }


            const totalSeconds =
                Math.floor(
                    remaining / 1000
                );


            const minutes =
                Math.floor(
                    remaining / 60000
                );


            const seconds =
                Math.floor(
                    (remaining % 60000) / 1000
                );


            if (
                totalSeconds <= 300
            ) {

                setTimerState(
                    "critical"
                );

            } else if (
                totalSeconds <= 600
            ) {

                setTimerState(
                    "warning"
                );

            } else {

                setTimerState(
                    "normal"
                );
            }


            setTimeLeft(
                `${String(
                    minutes
                ).padStart(
                    2,
                    "0"
                )}:${String(
                    seconds
                ).padStart(
                    2,
                    "0"
                )}`
            );
        };


        updateTimer();


        const timer =
            setInterval(
                updateTimer,
                1000
            );


        return () => {

            clearInterval(
                timer
            );

        };

    }, [endTime]);


    // =====================================================
    // Fetch Exam + Candidate Session
    // =====================================================

    const fetchExam = async () => {

        try {

            setLoadingExam(
                true
            );

            const token =
                localStorage.getItem(
                    "token"
                );


            // =================================================
            // Fetch Exam
            // =================================================

            const examResponse =
                await fetch(
                    `${API_BASE_URL}/exam/${examId}`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    }
                );


            const examData =
                await examResponse.json();


            if (
                !examResponse.ok
            ) {

                alert(
                    examData.message ||
                        "Unable to access this assessment."
                );

                navigate(
                    "/exams"
                );

                return;
            }


            if (
                !examData.exam ||
                !Array.isArray(
                    examData.questions
                )
            ) {

                alert(
                    "Unable to load assessment details."
                );

                navigate(
                    "/exams"
                );

                return;
            }


            // =================================================
            // Fetch Profile
            // =================================================

            const profileResponse =
                await fetch(
                    `${API_BASE_URL}/profile`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    }
                );


            const profileData =
                await profileResponse.json();


            if (
                !profileResponse.ok
            ) {

                alert(
                    profileData.message ||
                        "Unable to load user profile."
                );

                navigate(
                    "/exams"
                );

                return;
            }


            const currentRole =
                profileData.role || "";


            setRole(
                currentRole
            );


            // =================================================
            // Admin / Examiner
            // =================================================

            if (
                currentRole !==
                "Candidate"
            ) {

                setExam(
                    examData
                );

                return;
            }


            // =================================================
            // Candidate Session
            // =================================================

            const sessionResponse =
                await fetch(
                    `${API_BASE_URL}/exam-session/${examId}`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    }
                );


            const sessionData =
                await sessionResponse.json();


            if (
                !sessionResponse.ok
            ) {

                alert(
                    sessionData.message ||
                        "Unable to load exam session."
                );

                navigate(
                    "/exams"
                );

                return;
            }


            // =================================================
            // Not Started
            // =================================================

            if (
                sessionData.status ===
                "Not Started"
            ) {

                setExam(
                    examData
                );

                return;
            }


            // =================================================
            // Practice Completed
            // =================================================

            if (
                sessionData.status ===
                "Practice Completed"
            ) {

                setExam(
                    examData
                );

                return;
            }


            // =================================================
            // Completed / Auto Submitted
            // =================================================

            if (
                sessionData.status ===
                    "Completed" ||
                sessionData.status ===
                    "Auto Submitted"
            ) {

                setExam(
                    examData
                );

                return;
            }


            // =================================================
            // Unknown Session State
            // =================================================

            if (
                sessionData.status !==
                "In Progress"
            ) {

                setExam(
                    examData
                );

                return;
            }


            // =================================================
            // Validate Active Session Data
            // =================================================

            if (
                !sessionData.submission_id ||
                !sessionData.start_time ||
                !sessionData.duration
            ) {

                alert(
                    "Unable to restore your active examination session."
                );

                navigate(
                    "/exams"
                );

                return;
            }


            // =================================================
            // Restore Submission ID
            // =================================================

            setSubmissionId(
                sessionData.submission_id
            );


            // =================================================
            // Restore Saved Answers
            // =================================================

            const restoredAnswers =
                {};


            if (
                Array.isArray(
                    sessionData.answers
                )
            ) {

                sessionData.answers.forEach(
                    (answer) => {

                        if (
                            answer.question_id !==
                                null &&
                            answer.answer_text !==
                                null
                        ) {

                            restoredAnswers[
                                answer.question_id
                            ] =
                                answer.answer_text;

                        }

                    }
                );

            }


            setAnswers(
                restoredAnswers
            );


            // =================================================
            // Calculate Actual Attempt Deadline
            //
            // IMPORTANT:
            //
            // start_time is IST.
            //
            // parseISTTime() explicitly interprets it
            // as IST (+05:30).
            //
            // Deadline =
            //
            // start_time + exam duration
            // =================================================

            const start =
                parseISTTime(
                    sessionData.start_time
                );


            const duration =
                Number(
                    sessionData.duration
                );


            if (
                Number.isNaN(start) ||
                !Number.isFinite(
                    duration
                ) ||
                duration <= 0
            ) {

                alert(
                    "Unable to restore the examination timer."
                );

                navigate(
                    "/exams"
                );

                return;
            }


            const end =
                start +
                duration *
                    60 *
                    1000;


            setEndTime(
                end
            );


            // =================================================
            // Only render active exam after everything
            // required for the session has been restored.
            // =================================================

            setExam(
                examData
            );

        } catch (error) {

            console.error(
                error
            );

            alert(
                "Unable to load assessment."
            );

            navigate(
                "/exams"
            );

        } finally {

            setLoadingExam(
                false
            );
        }
    };


    // =====================================================
    // Wait For Pending Answer Saves
    //
    // Prevents auto-submit from evaluating answers while
    // the final /save-answer request is still in flight.
    // =====================================================

    const waitForPendingSaves = async () => {

        const requests =
            Array.from(
                pendingSaves.current
            );

        if (
            requests.length === 0
        ) {

            return;
        }

        await Promise.allSettled(
            requests
        );
    };


    // =====================================================
    // Handle Answer Change
    // =====================================================

    const handleAnswerChange = async (
        questionId,
        optionText
    ) => {

        if (
            isSubmitting ||
            hasAutoSubmitted.current
        ) {

            return;
        }


        // =================================================
        // Submission Protection
        // =================================================

        if (!submissionId) {

            alert(
                "Your exam session is not ready. Please refresh the page."
            );

            return;
        }


        const previousAnswer =
            answers[
                questionId
            ];


        // =================================================
        // Create Request Version
        //
        // Prevents an older failed request from
        // overwriting a newer selection.
        // =================================================

        const currentVersion =
            (
                answerRequestVersions.current[
                    questionId
                ] || 0
            ) + 1;


        answerRequestVersions.current[
            questionId
        ] =
            currentVersion;


        // =================================================
        // Update UI Immediately
        // =================================================

        setAnswers(
            (previous) => ({
                ...previous,

                [questionId]:
                    optionText,
            })
        );


        const token =
            localStorage.getItem(
                "token"
            );


        const saveRequest =
            fetch(
                `${API_BASE_URL}/save-answer`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        submission_id:
                            submissionId,

                        question_id:
                            questionId,

                        answer_text:
                            optionText,
                    }),
                }
            );


        // =================================================
        // Track Pending Save
        // =================================================

        pendingSaves.current.add(
            saveRequest
        );


        try {

            const response =
                await saveRequest;


            const data =
                await response.json();


            // =================================================
            // Save Failed
            // =================================================

            if (
                !response.ok
            ) {

                // Only rollback if this is still the
                // latest request for this question.
                if (
                    answerRequestVersions
                        .current[
                            questionId
                        ] ===
                    currentVersion
                ) {

                    setAnswers(
                        (previous) => {

                            const restored =
                                {
                                    ...previous,
                                };


                            if (
                                previousAnswer ===
                                undefined
                            ) {

                                delete restored[
                                    questionId
                                ];

                            } else {

                                restored[
                                    questionId
                                ] =
                                    previousAnswer;
                            }


                            return restored;
                        }
                    );

                }


                alert(
                    data.message ||
                        "Unable to save your answer."
                );

                return;
            }

        } catch (error) {

            console.error(
                error
            );


            // =================================================
            // Network Failure
            //
            // Again, only rollback if this request is
            // still the latest request for this question.
            // =================================================

            if (
                answerRequestVersions
                    .current[
                        questionId
                    ] ===
                currentVersion
            ) {

                setAnswers(
                    (previous) => {

                        const restored =
                            {
                                ...previous,
                            };


                        if (
                            previousAnswer ===
                            undefined
                        ) {

                            delete restored[
                                questionId
                            ];

                        } else {

                            restored[
                                questionId
                            ] =
                                previousAnswer;
                        }


                        return restored;
                    }
                );

            }


            alert(
                "Unable to save your answer. Please check your connection."
            );

        } finally {

            pendingSaves.current.delete(
                saveRequest
            );

        }
    };


    // =====================================================
    // Submit Exam
    // =====================================================

    const handleSubmitExam = async () => {

        if (
            isSubmitting &&
            !hasAutoSubmitted.current
        ) {

            return;
        }


        setIsSubmitting(
            true
        );


        try {

            // =================================================
            // CRITICAL:
            //
            // Wait for any answer-save request that was
            // already in progress.
            //
            // This prevents the final selected answer
            // from being missed during auto-submit.
            // =================================================

            await waitForPendingSaves();


            const token =
                localStorage.getItem(
                    "token"
                );


            const response =
                await fetch(
                    `${API_BASE_URL}/submit-exam`,
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
                        }),
                    }
                );


            const data =
                await response.json();


            if (
                response.ok
            ) {

                alert(
                    hasAutoSubmitted.current
                        ? "Time is up. Exam submitted automatically."
                        : "Exam Submitted Successfully!"
                );


                navigate(
                    "/results"
                );


                return;
            }


            setIsSubmitting(
                false
            );


            alert(
                data.message ||
                    "Unable to submit exam."
            );

        } catch (error) {

            console.error(
                error
            );


            setIsSubmitting(
                false
            );


            alert(
                "Unable to submit exam."
            );
        }
    };


    // =====================================================
    // Loading
    // =====================================================

    if (
        loadingExam ||
        !exam
    ) {

        return (

            <div>

                <Navbar />

                <PageLoader
                    message="Loading Exam..."
                />

            </div>
        );
    }


    // =====================================================
    // Render
    // =====================================================

    return (

        <div>

            <Navbar />


            <main
                className={`edp-page ${
                    isSubmitting
                        ? "edp-exam-locked"
                        : ""
                }`}
            >

                <div className="edp-page-container">


                    <section className="edp-exam-header">

                        <div className="edp-exam-header-top">

                            <div className="edp-exam-heading">

                                <span className="edp-exam-eyebrow">
                                    Examination
                                </span>


                                <h1 className="edp-exam-title">
                                    {
                                        exam.exam.title
                                    }
                                </h1>


                                <span className="edp-exam-id">
                                    Exam #
                                    {examId}
                                </span>

                            </div>


                            {role ===
                                "Candidate" && (

                                <div
                                    className={`edp-timer-card edp-timer-${timerState}`}
                                >

                                    <span className="edp-timer-label">
                                        Time Remaining
                                    </span>


                                    <strong className="edp-timer">
                                        {
                                            timeLeft
                                        }
                                    </strong>

                                </div>

                            )}

                        </div>


                        <div className="edp-exam-details">

                            <div className="edp-exam-detail">

                                <span>
                                    Duration
                                </span>

                                <strong>
                                    {
                                        exam.exam
                                            .duration
                                    }{" "}
                                    mins
                                </strong>

                            </div>


                            <div className="edp-exam-detail">

                                <span>
                                    Total Marks
                                </span>

                                <strong>
                                    {
                                        exam.exam
                                            .total_marks
                                    }
                                </strong>

                            </div>


                            <div className="edp-exam-detail">

                                <span>
                                    Passing Marks
                                </span>

                                <strong>
                                    {
                                        exam.exam
                                            .passing_marks
                                    }
                                </strong>

                            </div>


                            <div className="edp-exam-detail">

                                <span>
                                    Questions
                                </span>

                                <strong>
                                    {
                                        exam.questions
                                            .length
                                    }
                                </strong>

                            </div>

                        </div>

                    </section>


                    <section className="edp-questions-section">

                        <div className="edp-section-header">

                            <div>

                                <span className="edp-section-kicker">
                                    EXAMINATION CONTENT
                                </span>


                                <h2 className="edp-section-title">
                                    Questions
                                </h2>


                                <p className="edp-section-description">
                                    {
                                        role ===
                                        "Candidate"
                                            ? "Answer each question carefully before submitting the examination."
                                            : "Review the questions configured for this examination."
                                    }
                                </p>

                            </div>


                            <span className="edp-question-count">

                                {
                                    exam.questions
                                        .length
                                }{" "}

                                {
                                    exam.questions
                                        .length ===
                                    1
                                        ? "Question"
                                        : "Questions"

                                }

                            </span>

                        </div>


                        {
                            exam.questions
                                .length ===
                            0 ? (

                                <div className="edp-empty-state">

                                    <div className="edp-empty-icon">
                                        !
                                    </div>


                                    <strong>
                                        No Questions Available
                                    </strong>


                                    <p>
                                        No questions have
                                        been added to this
                                        examination yet.
                                    </p>

                                </div>

                            ) : (

                                <div className="edp-questions-grid">

                                    {
                                        exam.questions.map(
                                            (
                                                question,
                                                index
                                            ) => (

                                                <article
                                                    key={
                                                        question.question_id
                                                    }
                                                    className="edp-question-card"
                                                >

                                                    <div className="edp-question-header">

                                                        <div className="edp-question-heading">

                                                            <span className="edp-question-number">
                                                                Question #
                                                                {
                                                                    index +
                                                                    1
                                                                }
                                                            </span>


                                                            <h3 className="edp-question-title">
                                                                {
                                                                    question.question_text
                                                                }
                                                            </h3>

                                                        </div>


                                                        <span className="edp-question-marks">
                                                            {
                                                                question.marks
                                                            }{" "}
                                                            Marks
                                                        </span>

                                                    </div>


                                                    <div className="edp-question-details">

                                                        <div className="edp-question-detail">

                                                            <span>
                                                                Difficulty
                                                            </span>


                                                            <strong
                                                                className={`edp-difficulty ${question.difficulty.toLowerCase()}`}
                                                            >
                                                                {
                                                                    question.difficulty
                                                                }
                                                            </strong>

                                                        </div>


                                                        <div className="edp-question-detail">

                                                            <span>
                                                                Marks
                                                            </span>


                                                            <strong>
                                                                {
                                                                    question.marks
                                                                }
                                                            </strong>

                                                        </div>

                                                    </div>


                                                    <div className="edp-options-section">

                                                        <span className="edp-options-label">
                                                            Answer Options
                                                        </span>


                                                        <div className="edp-options-container">

                                                            {
                                                                question.options.map(
                                                                    (
                                                                        option,
                                                                        optionIndex
                                                                    ) => (

                                                                        <label
                                                                            key={
                                                                                option.option_id
                                                                            }
                                                                            className={`edp-option-row ${
                                                                                role ===
                                                                                "Candidate"
                                                                                    ? "edp-candidate-option"
                                                                                    : ""
                                                                            } ${
                                                                                answers[
                                                                                    question
                                                                                        .question_id
                                                                                ] ===
                                                                                option.option_text
                                                                                    ? "edp-selected"
                                                                                    : ""
                                                                            }`}
                                                                        >

                                                                            {
                                                                                role ===
                                                                                    "Candidate" && (

                                                                                    <input
                                                                                        type="radio"

                                                                                        name={`question-${question.question_id}`}

                                                                                        value={
                                                                                            option.option_text
                                                                                        }

                                                                                        checked={
                                                                                            answers[
                                                                                                question
                                                                                                    .question_id
                                                                                            ] ===
                                                                                            option.option_text
                                                                                        }

                                                                                        onChange={() =>
                                                                                            handleAnswerChange(
                                                                                                question.question_id,
                                                                                                option.option_text
                                                                                            )
                                                                                        }

                                                                                        disabled={
                                                                                            isSubmitting
                                                                                        }
                                                                                    />

                                                                                )
                                                                            }


                                                                            <span className="edp-option-letter">

                                                                                {
                                                                                    String.fromCharCode(
                                                                                        65 +
                                                                                        optionIndex
                                                                                    )
                                                                                }

                                                                            </span>


                                                                            <span className="edp-option-text">

                                                                                {
                                                                                    option.option_text
                                                                                }

                                                                            </span>

                                                                        </label>

                                                                    )
                                                                )
                                                            }

                                                        </div>

                                                    </div>

                                                </article>

                                            )
                                        )
                                    }

                                </div>

                            )
                        }

                    </section>


                    {
                        role ===
                            "Candidate" && (

                            <div className="edp-submit-section">

                                <button
                                    type="button"
                                    className="edp-submit-btn"
                                    onClick={
                                        handleSubmitExam
                                    }
                                    disabled={
                                        isSubmitting
                                    }
                                >

                                    {
                                        isSubmitting
                                            ? hasAutoSubmitted.current
                                                ? "Auto Submitting..."
                                                : "Submitting..."
                                            : "Submit Exam"
                                    }

                                </button>

                            </div>

                        )
                    }

                </div>

            </main>

        </div>
    );
}


export default ExamDetailsPage;