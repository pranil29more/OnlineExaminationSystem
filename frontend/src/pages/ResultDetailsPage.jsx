import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import API_BASE_URL from "../services/api";
import Navbar from "../components/Navbar";
import PageLoader from "../components/PageLoader";

import "../styles/ResultDetailsPage.css";


function ResultDetailsPage() {

    const { submissionId } =
        useParams();

    const [result, setResult] =
        useState(null);


    useEffect(() => {
        fetchResult();
    }, []);


    const fetchResult = async () => {

        try {

            const token =
                localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/result/${submissionId}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            const data =
                await response.json();

            if (!response.ok) {

                console.error(
                    data.message ||
                        "Unable to load result."
                );

                return;
            }

            setResult(data);

        } catch (error) {

            console.error(error);

        }
    };


    if (!result) {

        return (

            <div>

                <Navbar />

                <PageLoader
                    message="Loading Result..."
                />

            </div>

        );
    }


    const isPassed =
        result.score >=
        result.passing_marks;


    // ==========================================
    // Answer Status Helpers
    // ==========================================

    const isAnswerUnanswered = (
        answer
    ) => {

        if (
            answer.is_answered === false
        ) {
            return true;
        }

        if (
            answer.answer_text === null ||
            answer.answer_text === undefined
        ) {
            return true;
        }

        if (
            String(answer.answer_text)
                .trim() === ""
        ) {
            return true;
        }

        return false;
    };


    const correctAnswers =
        result.answers.filter(
            (answer) =>
                !isAnswerUnanswered(answer) &&
                Boolean(answer.is_correct)
        ).length;


    const unansweredAnswers =
        result.answers.filter(
            (answer) =>
                isAnswerUnanswered(answer)
        ).length;


    const incorrectAnswers =
        result.answers.filter(
            (answer) =>
                !isAnswerUnanswered(answer) &&
                !Boolean(answer.is_correct)
        ).length;


    return (

        <div className="rdp-page">

            <Navbar />


            <main className="rdp-page-container">


                {/* ==========================================
                    Page Header
                ========================================== */}

                <header className="rdp-page-header">

                    <span className="rdp-page-eyebrow">
                        PERFORMANCE DETAILS
                    </span>

                    <h1 className="rdp-page-title">
                        Result Details
                    </h1>

                    <p className="rdp-page-description">
                        Review the examination
                        performance and detailed
                        answers for this submission.
                    </p>

                </header>


                {/* ==========================================
                    Result Summary
                ========================================== */}

                <section className="rdp-summary-card">

                    <div className="rdp-summary-header">

                        <div>

                            <span className="rdp-summary-label">
                                RESULT SUMMARY
                            </span>

                            <h2 className="rdp-summary-title">
                                {
                                    result.exam_title
                                }
                            </h2>

                            <p className="rdp-summary-subtitle">
                                Submission #
                                {
                                    result.submission_id
                                }
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


                    {/* ==========================================
                        Score Overview
                    ========================================== */}

                    <div className="rdp-score-overview">

                        <div className="rdp-score-main">

                            <span className="rdp-score-label">
                                Score
                            </span>

                            <strong className="rdp-score-value">

                                {
                                    result.score
                                }

                                <span>
                                    {" "}
                                    /{" "}
                                    {
                                        result.total_marks
                                    }
                                </span>

                            </strong>

                        </div>


                        <div className="rdp-score-main">

                            <span className="rdp-score-label">
                                Percentage
                            </span>

                            <strong className="rdp-percentage-value">
                                {
                                    result.percentage
                                }%
                            </strong>

                        </div>

                    </div>


                    {/* ==========================================
                        Summary Details
                    ========================================== */}

                    <div className="rdp-summary-details">

                        {result.candidate_name && (

                            <div className="rdp-summary-detail">

                                <span className="rdp-detail-label">
                                    Candidate
                                </span>

                                <strong>
                                    {
                                        result.candidate_name
                                    }
                                </strong>

                            </div>

                        )}


                        <div className="rdp-summary-detail">

                            <span className="rdp-detail-label">
                                Batch
                            </span>

                            <strong>
                                {
                                    result.batch_name
                                }
                            </strong>

                        </div>


                        <div className="rdp-summary-detail">

                            <span className="rdp-detail-label">
                                Passing Marks
                            </span>

                            <strong>
                                {
                                    result.passing_marks
                                }
                            </strong>

                        </div>


                        <div className="rdp-summary-detail">

                            <span className="rdp-detail-label">
                                Submitted
                            </span>

                            <strong>
                                {
                                    result.submitted_at
                                }
                            </strong>

                        </div>

                    </div>

                </section>


                {/* ==========================================
                    Answer Review
                ========================================== */}

                <section className="rdp-answers-section">

                    <div className="rdp-answers-header">

                        <div>

                            <span className="rdp-section-kicker">
                                ANSWERS
                            </span>

                            <h2 className="rdp-section-title">
                                Answer Review
                            </h2>

                            <p className="rdp-section-description">
                                Review each question
                                and the submitted
                                answer.
                            </p>

                        </div>


                        <div className="rdp-answer-count">

                            <span className="rdp-correct-count">
                                {
                                    correctAnswers
                                } Correct
                            </span>

                            <span className="rdp-answer-divider">
                                |
                            </span>

                            <span className="rdp-incorrect-count">
                                {
                                    incorrectAnswers
                                } Incorrect
                            </span>

                            <span className="rdp-answer-divider">
                                |
                            </span>

                            <span className="rdp-unanswered-count">
                                {
                                    unansweredAnswers
                                } Unanswered
                            </span>

                        </div>

                    </div>


                    {/* ==========================================
                        Answers
                    ========================================== */}

                    <div className="rdp-answers-grid">

                        {result.answers.map(
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

                                const incorrect =
                                    !unanswered &&
                                    !correct;


                                return (

                                    <article
                                        key={
                                            answer.question_id ||
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
                                                    Question{" "}
                                                    {
                                                        index + 1
                                                    }
                                                </span>

                                                <h3 className="rdp-question-title">
                                                    {
                                                        answer.question_text
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


                                        {/* ==========================================
                                            Selected Answer
                                            
                                            IMPORTANT:
                                            Unanswered questions do NOT get this
                                            section at all.
                                        ========================================== */}

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

                </section>

            </main>

        </div>
    );
}


export default ResultDetailsPage;