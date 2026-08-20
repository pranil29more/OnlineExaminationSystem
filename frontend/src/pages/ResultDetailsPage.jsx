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


    const correctAnswers =
        result.answers.filter(
            (answer) =>
                answer.is_correct
        ).length;


    const incorrectAnswers =
        result.answers.length -
        correctAnswers;


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

                        </div>

                    </div>


                    {/* ==========================================
                        Answers
                    ========================================== */}

                    <div className="rdp-answers-grid">

                        {result.answers.map(
                            (answer, index) => (

                                <article
                                    key={index}
                                    className={
                                        `rdp-answer-card ${
                                            answer.is_correct
                                                ? "rdp-answer-correct"
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
                                                answer.is_correct
                                                    ? "rdp-answer-status rdp-correct"
                                                    : "rdp-answer-status rdp-incorrect"
                                            }
                                        >
                                            {
                                                answer.is_correct
                                                    ? "Correct"
                                                    : "Incorrect"
                                            }
                                        </span>

                                    </div>


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


                                    <div className="rdp-answer-footer">

                                        <span
                                            className={
                                                answer.is_correct
                                                    ? "rdp-answer-result rdp-correct-result"
                                                    : "rdp-answer-result rdp-incorrect-result"
                                            }
                                        >
                                            {
                                                answer.is_correct
                                                    ? "✓ Correct Answer"
                                                    : "✕ Incorrect Answer"
                                            }
                                        </span>

                                    </div>


                                </article>

                            )
                        )}

                    </div>

                </section>

            </main>

        </div>
    );
}


export default ResultDetailsPage;