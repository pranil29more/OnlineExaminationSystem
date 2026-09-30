import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import API_BASE_URL from "../services/api";
import Navbar from "../components/Navbar";
import PageLoader from "../components/PageLoader";

import "../styles/ResultDetailsPage.css";


function ResultDetailsPage() {

    const { submissionId } = useParams();

    // ==========================================================
    // STATE
    // ==========================================================

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    // ==========================================================
    // FETCH RESULT
    // ==========================================================

    useEffect(() => {

        const controller = new AbortController();

        const fetchResult = async () => {

            try {

                setLoading(true);
                setError("");

                const token =
                    localStorage.getItem("token");

                const response = await fetch(
                    `${API_BASE_URL}/result/${submissionId}`,
                    {
                        method: "GET",

                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: "application/json",
                        },

                        signal: controller.signal,
                    }
                );

                let data = null;

                try {
                    data = await response.json();
                } catch {
                    data = null;
                }

                if (!response.ok) {

                    throw new Error(
                        data?.message ||
                        data?.error ||
                        "Unable to load result."
                    );
                }

                setResult(data);

            } catch (fetchError) {

                if (fetchError.name === "AbortError") {
                    return;
                }

                console.error(
                    "Unable to load result:",
                    fetchError
                );

                setError(
                    fetchError.message ||
                    "Unable to load result."
                );

            } finally {

                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };


        if (submissionId) {
            fetchResult();
        } else {
            setError("Invalid submission.");
            setLoading(false);
        }


        return () => {
            controller.abort();
        };

    }, [submissionId]);


    // ==========================================================
    // LOADING
    // ==========================================================

    if (loading) {

        return (
            <div className="rdp-page">

                <Navbar />

                <PageLoader
                    message="Loading Result..."
                />

            </div>
        );
    }


    // ==========================================================
    // ERROR
    // ==========================================================

    if (error) {

        return (
            <div className="rdp-page">

                <Navbar />

                <main className="rdp-page-container">

                    <section className="rdp-error-state">

                        <div className="rdp-error-icon">
                            !
                        </div>

                        <h2>
                            Unable to Load Result
                        </h2>

                        <p>
                            {error}
                        </p>

                    </section>

                </main>

            </div>
        );
    }


    // ==========================================================
    // NO RESULT
    // ==========================================================

    if (!result) {

        return (
            <div className="rdp-page">

                <Navbar />

                <main className="rdp-page-container">

                    <section className="rdp-error-state">

                        <div className="rdp-error-icon">
                            !
                        </div>

                        <h2>
                            Result Not Found
                        </h2>

                        <p>
                            No result information is available
                            for this submission.
                        </p>

                    </section>

                </main>

            </div>
        );
    }


    // ==========================================================
    // RESULT ARRAYS
    // ==========================================================

    const mcqResults =
        Array.isArray(result.mcq_results)
            ? result.mcq_results
            : [];


    const codingResults =
        Array.isArray(result.coding_results)
            ? result.coding_results
            : [];


    // ==========================================================
    // NUMBER HELPERS
    // ==========================================================

    const toNumber = (
        value,
        fallback = 0
    ) => {

        const number = Number(value);

        return Number.isFinite(number)
            ? number
            : fallback;
    };


    const score =
        toNumber(result.score);


    const totalMarks =
        toNumber(result.total_marks);


    const passingMarks =
        toNumber(result.passing_marks);


    const percentage =
        result.percentage !== null &&
        result.percentage !== undefined &&
        result.percentage !== ""
            ? result.percentage
            : (
                totalMarks > 0
                    ? (
                        (score / totalMarks) * 100
                    ).toFixed(2)
                    : "0"
            );


    // ==========================================================
    // OVERALL RESULT
    // ==========================================================

    const isPassed =
        score >= passingMarks;


    // ==========================================================
    // MCQ HELPERS
    // ==========================================================

    const isAnswerUnanswered = (
        answer
    ) => {

        if (
            answer?.is_answered === false
        ) {
            return true;
        }

        if (
            answer?.answer_text === null ||
            answer?.answer_text === undefined
        ) {
            return true;
        }

        return (
            String(answer.answer_text).trim() === ""
        );
    };


    const correctAnswers =
        mcqResults.filter(
            (answer) =>
                !isAnswerUnanswered(answer) &&
                Boolean(answer.is_correct)
        ).length;


    const unansweredAnswers =
        mcqResults.filter(
            (answer) =>
                isAnswerUnanswered(answer)
        ).length;


    const incorrectAnswers =
        mcqResults.filter(
            (answer) =>
                !isAnswerUnanswered(answer) &&
                !Boolean(answer.is_correct)
        ).length;


    // ==========================================================
    // CODING HELPERS
    // ==========================================================

    const normalizeCodingStatus = (
        status
    ) => {

        return String(status || "")
            .trim()
            .toUpperCase()
            .replace(/\s+/g, "_");
    };


    // ==========================================================
    // CHECK WHETHER CODING QUESTION IS UNANSWERED
    // ==========================================================

    const isCodingUnanswered = (
        coding
    ) => {

        // ------------------------------------------------------
        // Backend explicitly tells us
        // ------------------------------------------------------

        if (
            coding?.is_answered === false
        ) {
            return true;
        }


        // ------------------------------------------------------
        // NOT_SUBMITTED is also considered unanswered
        // ------------------------------------------------------

        const status =
            normalizeCodingStatus(
                coding?.status
            );


        if (
            status === "NOT_SUBMITTED" ||
            status === "UNANSWERED"
        ) {
            return true;
        }


        return false;
    };


    // ==========================================================
    // CHECK WHETHER CODING QUESTION PASSED
    // ==========================================================

    const isCodingPassed = (
        coding
    ) => {

        // ------------------------------------------------------
        // An unanswered coding question cannot be passed.
        // ------------------------------------------------------

        if (
            isCodingUnanswered(coding)
        ) {
            return false;
        }


        const status =
            normalizeCodingStatus(
                coding?.status
            );


        if (
            status === "SUCCESS" ||
            status === "PASSED" ||
            status === "PASS" ||
            status === "ACCEPTED"
        ) {
            return true;
        }


        const passedTests =
            Number(coding?.passed_tests);


        const totalTests =
            Number(coding?.total_tests);


        if (
            Number.isFinite(passedTests) &&
            Number.isFinite(totalTests) &&
            totalTests > 0 &&
            passedTests === totalTests
        ) {
            return true;
        }


        return false;
    };


    // ==========================================================
    // CODING STATUS CLASS
    // ==========================================================

    const getCodingStatusClass = (
        coding
    ) => {

        if (
            isCodingUnanswered(coding)
        ) {
            return "rdp-coding-status-unanswered";
        }


        return isCodingPassed(coding)
            ? "rdp-coding-status-success"
            : "rdp-coding-status-failed";
    };


    // ==========================================================
    // CODING STATUS TEXT
    // ==========================================================

    const getCodingStatusText = (
        coding
    ) => {

        if (
            isCodingUnanswered(coding)
        ) {
            return "Unanswered";
        }


        const status =
            normalizeCodingStatus(
                coding?.status
            );


        if (isCodingPassed(coding)) {
            return "Passed";
        }


        if (status === "RUNTIME_ERROR") {
            return "Runtime Error";
        }


        if (
            status === "TIME_LIMIT_EXCEEDED" ||
            status === "TIMEOUT"
        ) {
            return "Time Limit Exceeded";
        }


        if (
            status === "COMPILATION_ERROR" ||
            status === "COMPILE_ERROR"
        ) {
            return "Compilation Error";
        }


        if (
            status === "WRONG_ANSWER" ||
            status === "FAILED"
        ) {
            return "Failed";
        }


        if (!status) {
            return "Not Submitted";
        }


        return String(coding.status);
    };


    // ==========================================================
    // CODING TEST COUNTS
    // ==========================================================

    const codingPassedTests =
        codingResults.reduce(
            (total, coding) =>
                total +
                toNumber(
                    coding.passed_tests
                ),
            0
        );


    const codingTotalTests =
        codingResults.reduce(
            (total, coding) =>
                total +
                toNumber(
                    coding.total_tests
                ),
            0
        );


    const codingUnansweredCount =
        codingResults.filter(
            (coding) =>
                isCodingUnanswered(coding)
        ).length;


    const codingAnsweredCount =
        codingResults.length -
        codingUnansweredCount;


    // ==========================================================
    // CODING PASSED QUESTION COUNT
    // ==========================================================

    const codingPassedCount =
        codingResults.filter(
            (coding) =>
                isCodingPassed(coding)
        ).length;


    // ==========================================================
    // CODING FAILED QUESTION COUNT
    // ==========================================================

    const codingFailedCount =
        codingResults.filter(
            (coding) =>
                !isCodingUnanswered(coding) &&
                !isCodingPassed(coding)
        ).length;


    // ==========================================================
    // RENDER
    // ==========================================================

    return (
        <div className="rdp-page">

            <Navbar />

            <main className="rdp-page-container">

                {/* ==================================================
                    PAGE HEADER
                ================================================== */}

                <header className="rdp-page-header">

                    <span className="rdp-page-eyebrow">
                        PERFORMANCE DETAILS
                    </span>

                    <h1 className="rdp-page-title">
                        Result Details
                    </h1>

                    <p className="rdp-page-description">
                        Review the examination performance
                        and detailed answers for this submission.
                    </p>

                </header>


                {/* ==================================================
                    RESULT SUMMARY
                ================================================== */}

                <section className="rdp-summary-card">

                    <div className="rdp-summary-header">

                        <div className="rdp-summary-heading">

                            <span className="rdp-summary-label">
                                RESULT SUMMARY
                            </span>

                            <h2 className="rdp-summary-title">
                                {
                                    result.exam_title ||
                                    "Examination"
                                }
                            </h2>

                            <p className="rdp-summary-subtitle">
                                Submission #
                                {result.submission_id ?? submissionId}
                            </p>

                        </div>


                        <span
                            className={
                                isPassed
                                    ? "rdp-status-badge rdp-status-pass"
                                    : "rdp-status-badge rdp-status-fail"
                            }
                        >
                            {
                                isPassed
                                    ? "Pass"
                                    : "Fail"
                            }
                        </span>

                    </div>


                    {/* ==================================================
                        SCORE
                    ================================================== */}

                    <div className="rdp-score-overview">

                        <div className="rdp-score-main">

                            <span className="rdp-score-label">
                                Score
                            </span>

                            <strong className="rdp-score-value">

                                {score}

                                <span>
                                    {" / "}
                                    {totalMarks}
                                </span>

                            </strong>

                        </div>


                        <div className="rdp-score-main">

                            <span className="rdp-score-label">
                                Percentage
                            </span>

                            <strong className="rdp-percentage-value">
                                {percentage}%
                            </strong>

                        </div>

                    </div>


                    {/* ==================================================
                        SUMMARY DETAILS
                    ================================================== */}

                    <div className="rdp-summary-details">

                        {result.candidate_name && (

                            <div className="rdp-summary-detail">

                                <span className="rdp-detail-label">
                                    Candidate
                                </span>

                                <strong>
                                    {result.candidate_name}
                                </strong>

                            </div>

                        )}


                        <div className="rdp-summary-detail">

                            <span className="rdp-detail-label">
                                Batch
                            </span>

                            <strong>
                                {result.batch_name || "—"}
                            </strong>

                        </div>


                        <div className="rdp-summary-detail">

                            <span className="rdp-detail-label">
                                Passing Marks
                            </span>

                            <strong>
                                {passingMarks}
                            </strong>

                        </div>


                        <div className="rdp-summary-detail">

                            <span className="rdp-detail-label">
                                Submitted
                            </span>

                            <strong>
                                {result.submitted_at || "—"}
                            </strong>

                        </div>

                    </div>

                </section>


                {/* ==================================================
                    MCQ ANSWERS
                ================================================== */}

                <section className="rdp-answers-section">

                    <div className="rdp-answers-header">

                        <div>

                            <span className="rdp-section-kicker">
                                MCQ ANSWERS
                            </span>

                            <h2 className="rdp-section-title">
                                Answer Review
                            </h2>

                            <p className="rdp-section-description">
                                Review each multiple-choice
                                question and the submitted answer.
                            </p>

                        </div>


                        <div className="rdp-answer-count">

                            <span className="rdp-correct-count">
                                {correctAnswers} Correct
                            </span>

                            <span className="rdp-answer-divider">
                                |
                            </span>

                            <span className="rdp-incorrect-count">
                                {incorrectAnswers} Incorrect
                            </span>

                            <span className="rdp-answer-divider">
                                |
                            </span>

                            <span className="rdp-unanswered-count">
                                {unansweredAnswers} Unanswered
                            </span>

                        </div>

                    </div>


                    {mcqResults.length === 0 ? (

                        <div className="rdp-empty-state">

                            <div className="rdp-empty-icon">
                                —
                            </div>

                            <strong>
                                No MCQ Questions
                            </strong>

                            <p>
                                This examination does not contain
                                any multiple-choice questions.
                            </p>

                        </div>

                    ) : (

                        <div className="rdp-answers-grid">

                            {mcqResults.map(
                                (answer, index) => {

                                    const unanswered =
                                        isAnswerUnanswered(
                                            answer
                                        );


                                    const correct =
                                        !unanswered &&
                                        Boolean(
                                            answer.is_correct
                                        );


                                    return (

                                        <article
                                            key={
                                                answer.question_id ??
                                                index
                                            }
                                            className={
                                                `rdp-answer-card ${
                                                    correct
                                                        ? "rdp-answer-correct"
                                                        : unanswered
                                                            ? "rdp-answer-unanswered"
                                                            : "rdp-answer-incorrect"
                                                }`
                                            }
                                        >

                                            <div className="rdp-answer-card-header">

                                                <div>

                                                    <span className="rdp-question-number">
                                                        Question {index + 1}
                                                    </span>

                                                    <h3 className="rdp-question-title">
                                                        {
                                                            answer.question_text ||
                                                            "Question text unavailable."
                                                        }
                                                    </h3>

                                                </div>


                                                <span
                                                    className={
                                                        correct
                                                            ? "rdp-answer-status rdp-correct"
                                                            : unanswered
                                                                ? "rdp-answer-status rdp-unanswered"
                                                                : "rdp-answer-status rdp-incorrect"
                                                    }
                                                >

                                                    {
                                                        correct
                                                            ? "Correct"
                                                            : unanswered
                                                                ? "Unanswered"
                                                                : "Incorrect"
                                                    }

                                                </span>

                                            </div>


                                            {!unanswered && (

                                                <div className="rdp-answer-content">

                                                    <span className="rdp-detail-label">
                                                        Selected Answer
                                                    </span>

                                                    <p className="rdp-answer-text">
                                                        {
                                                            answer.answer_text
                                                        }
                                                    </p>

                                                </div>

                                            )}


                                            <div className="rdp-answer-footer">

                                                <span
                                                    className={
                                                        correct
                                                            ? "rdp-answer-result rdp-correct-result"
                                                            : unanswered
                                                                ? "rdp-answer-result rdp-unanswered-result"
                                                                : "rdp-answer-result rdp-incorrect-result"
                                                    }
                                                >

                                                    {
                                                        correct
                                                            ? "✓ Correct Answer"
                                                            : unanswered
                                                                ? "Not Answered"
                                                                : "✕ Incorrect Answer"
                                                    }

                                                </span>

                                            </div>

                                        </article>
                                    );
                                }
                            )}

                        </div>
                    )}

                </section>


                {/* ==================================================
                    CODING EVALUATION
                ================================================== */}

                <section className="rdp-coding-section">

                    <div className="rdp-answers-header">

                        <div>

                            <span className="rdp-section-kicker">
                                CODING ANSWERS
                            </span>

                            <h2 className="rdp-section-title">
                                Coding Evaluation
                            </h2>

                            <p className="rdp-section-description">
                                Review the evaluation results
                                for each coding question.
                            </p>

                        </div>


                        {codingResults.length > 0 && (

                            <div className="rdp-answer-count">

                                <span className="rdp-correct-count">
                                    {codingPassedCount} Passed
                                </span>

                                <span className="rdp-answer-divider">
                                    |
                                </span>

                                <span className="rdp-incorrect-count">
                                    {codingFailedCount} Failed
                                </span>

                                <span className="rdp-answer-divider">
                                    |
                                </span>

                                <span className="rdp-unanswered-count">
                                    {codingUnansweredCount} Unanswered
                                </span>

                            </div>

                        )}

                    </div>


                    {codingResults.length === 0 ? (

                        <div className="rdp-empty-state">

                            <div className="rdp-empty-icon">
                                —
                            </div>

                            <strong>
                                No Coding Questions
                            </strong>

                            <p>
                                This examination does not contain
                                any coding questions.
                            </p>

                        </div>

                    ) : (

                        <div className="rdp-coding-results-grid">

                            {codingResults.map(
                                (coding, index) => {

                                    const unanswered =
                                        isCodingUnanswered(
                                            coding
                                        );


                                    const passed =
                                        isCodingPassed(
                                            coding
                                        );


                                    const passedTests =
                                        toNumber(
                                            coding.passed_tests
                                        );


                                    const totalTests =
                                        toNumber(
                                            coding.total_tests
                                        );


                                    return (

                                        <article
                                            key={
                                                coding.coding_question_id ??
                                                index
                                            }
                                            className={
                                                `rdp-coding-result-card ${
                                                    passed
                                                        ? "rdp-coding-passed"
                                                        : unanswered
                                                            ? "rdp-coding-unanswered"
                                                            : "rdp-coding-failed"
                                                }`
                                            }
                                        >

                                            <div className="rdp-coding-result-header">

                                                <div>

                                                    <span className="rdp-question-number">
                                                        Coding Question {index + 1}
                                                    </span>

                                                    <h3 className="rdp-question-title">
                                                        {
                                                            coding.question_text ||
                                                            "Coding question text unavailable."
                                                        }
                                                    </h3>

                                                </div>


                                                <span
                                                    className={
                                                        `rdp-coding-status ${
                                                            getCodingStatusClass(
                                                                coding
                                                            )
                                                        }`
                                                    }
                                                >
                                                    {
                                                        getCodingStatusText(
                                                            coding
                                                        )
                                                    }
                                                </span>

                                            </div>


                                            {/* ==================================================
                                                CODING RESULT DETAILS
                                            ================================================== */}

                                            <div className="rdp-coding-result-details">

                                                <div className="rdp-coding-result-detail">

                                                    <span className="rdp-detail-label">
                                                        Language
                                                    </span>

                                                    <strong>
                                                        {
                                                            unanswered
                                                                ? "—"
                                                                : (
                                                                    coding.language ||
                                                                    "Python"
                                                                )
                                                        }
                                                    </strong>

                                                </div>


                                                <div className="rdp-coding-result-detail">

                                                    <span className="rdp-detail-label">
                                                        Tests Passed
                                                    </span>

                                                    <strong>
                                                        {
                                                            unanswered
                                                                ? "—"
                                                                : (
                                                                    <>
                                                                        {passedTests}
                                                                        {" / "}
                                                                        {totalTests}
                                                                    </>
                                                                )
                                                        }
                                                    </strong>

                                                </div>


                                                <div className="rdp-coding-result-detail">

                                                    <span className="rdp-detail-label">
                                                        Score
                                                    </span>

                                                    <strong>
                                                        {
                                                            unanswered
                                                                ? "0"
                                                                : (
                                                                    coding.score ??
                                                                    0
                                                                )
                                                        }
                                                    </strong>

                                                </div>


                                                <div className="rdp-coding-result-detail">

                                                    <span className="rdp-detail-label">
                                                        Submitted
                                                    </span>

                                                    <strong>
                                                        {
                                                            unanswered
                                                                ? "Not Answered"
                                                                : (
                                                                    coding.submitted_at ||
                                                                    "—"
                                                                )
                                                        }
                                                    </strong>

                                                </div>

                                            </div>


                                            {/* ==================================================
                                                CODING RESULT FOOTER
                                            ================================================== */}

                                            <div
                                                className={
                                                    unanswered
                                                        ? "rdp-coding-result-footer rdp-coding-result-unanswered"
                                                        : passed
                                                            ? "rdp-coding-result-footer rdp-coding-result-success"
                                                            : "rdp-coding-result-footer rdp-coding-result-failed"
                                                }
                                            >

                                                <span>

                                                    {
                                                        unanswered
                                                            ? "Not Answered"
                                                            : passed
                                                                ? "✓ All required test cases passed."
                                                                : "✕ The coding submission did not pass all required test cases."
                                                    }

                                                </span>

                                            </div>

                                        </article>
                                    );
                                }
                            )}

                        </div>
                    )}

                </section>

            </main>

        </div>
    );
}


export default ResultDetailsPage;