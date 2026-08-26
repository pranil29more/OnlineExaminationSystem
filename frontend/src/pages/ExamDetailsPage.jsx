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

    const [endTime, setEndTime] = useState(null);

    const [isSubmitting, setIsSubmitting] =
        useState(false);

    const hasAutoSubmitted = useRef(false);


    useEffect(() => {

        fetchExam();

    }, []);


    useEffect(() => {

        if (!endTime) {
            return;
        }


        const updateTimer = () => {

            const remaining =
                endTime - Date.now();


            if (remaining <= 0) {

                setTimeLeft("00:00");

                setTimerState("critical");


                if (
                    !hasAutoSubmitted.current
                ) {

                    hasAutoSubmitted.current =
                        true;

                    setIsSubmitting(true);

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


            if (totalSeconds <= 300) {

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
                `${String(minutes).padStart(
                    2,
                    "0"
                )}:${String(seconds).padStart(
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

            clearInterval(timer);

        };

    }, [endTime]);


    const fetchExam = async () => {

        try {

            const token =
                localStorage.getItem("token");


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


            if (!examResponse.ok) {

                alert(
                    examData.message ||
                        "Unable to access this assessment."
                );

                navigate("/exams");

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

                navigate("/exams");

                return;
            }


            setExam(examData);


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


            setRole(
                profileData.role
            );


            if (
                profileData.role !==
                "Candidate"
            ) {

                return;
            }


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
                sessionData.status ===
                "Not Started"
            ) {

                return;
            }


            if (
                sessionData.status ===
                "Practice Completed"
            ) {

                return;
            }


            if (
                !sessionData.submission_id ||
                !sessionData.start_time ||
                !sessionData.duration
            ) {

                return;
            }


            setSubmissionId(
                sessionData.submission_id
            );


            if (
                sessionData.answers
            ) {

                const restoredAnswers =
                    {};


                sessionData.answers.forEach(
                    (answer) => {

                        restoredAnswers[
                            answer.question_id
                        ] =
                            answer.answer_text;

                    }
                );


                setAnswers(
                    restoredAnswers
                );
            }


            const start =
                new Date(
                    sessionData.start_time
                ).getTime();


            const duration =
                Number(
                    sessionData.duration
                );


            const end =
                start +
                duration *
                    60 *
                    1000;


            setEndTime(
                end
            );

        } catch (error) {

            console.error(error);

        }
    };


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


        setAnswers(
            (previous) => ({
                ...previous,

                [questionId]:
                    optionText,
            })
        );


        try {

            const token =
                localStorage.getItem("token");


            await fetch(
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

        } catch (error) {

            console.error(error);

        }
    };


    const handleSubmitExam = async () => {

        if (isSubmitting &&
            !hasAutoSubmitted.current
        ) {

            return;
        }


        setIsSubmitting(true);


        try {

            const token =
                localStorage.getItem("token");


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


            if (response.ok) {

                alert(
                    hasAutoSubmitted.current
                        ? "Time is up. Exam submitted automatically."
                        : "Exam Submitted Successfully!"
                );


                navigate(
                    "/results"
                );


            } else {

                setIsSubmitting(false);


                alert(
                    data.message ||
                        "Unable to submit exam."
                );
            }

        } catch (error) {

            console.error(error);


            setIsSubmitting(false);


            alert(
                "Unable to submit exam."
            );
        }
    };


    if (!exam) {

        return (

            <div>

                <Navbar />

                <PageLoader
                    message="Loading Exam..."
                />

            </div>
        );
    }


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