import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API_BASE_URL from "../services/api";
import Navbar from "../components/Navbar";
import PageLoader from "../components/PageLoader";
import "../styles/SubmissionAnalyticsPage.css";

function SubmissionAnalyticsPage() {
    const [analytics, setAnalytics] =
        useState(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const token =
                localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/submission-analytics`,
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
                        "Unable to load submission analytics."
                );

                return;
            }

            setAnalytics(data);
        } catch (error) {
            console.error(error);
        }
    };

    const totalPassed =
        analytics?.exam_wise?.reduce(
            (total, exam) => {
                if (
                    typeof exam.passed ===
                    "number"
                ) {
                    return total + exam.passed;
                }

                if (
                    exam.pass_rate === null ||
                    exam.pass_rate === undefined ||
                    !exam.submissions
                ) {
                    return total;
                }

                return (
                    total +
                    Math.round(
                        (
                            Number(
                                exam.submissions
                            ) *
                            Number(
                                exam.pass_rate
                            )
                        ) /
                            100
                    )
                );
            },
            0
        ) || 0;

    const totalFailed =
        Math.max(
            0,
            (
                analytics?.total_submissions ||
                0
            ) -
                totalPassed
        );

    if (!analytics) {
        return (
            <div className="sap-page">
                <Navbar />

                <PageLoader
                    message="Loading Submission Analytics..."
                />
            </div>
        );
    }

    return (
        <div className="sap-page">
            <Navbar />

            <main className="sap-page-container">

                {/* =================================================
                    Page Header
                ================================================= */}

                <div className="sap-page-header">
                    <div>
                        <span className="sap-page-eyebrow">
                            ASSESSMENT INSIGHTS
                        </span>

                        <h1 className="sap-page-title">
                            Submission Analytics
                        </h1>

                        <p className="sap-page-description">
                            Monitor submission activity
                            and evaluate examination
                            performance across the
                            system.
                        </p>
                    </div>
                </div>

                {/* =================================================
                    Overall Summary
                ================================================= */}

                <section className="sap-summary-card">
                    <div className="sap-summary-header">
                        <div className="sap-summary-icon">
                            <svg
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
                                />

                                <path
                                    d="M14 3v5h5"
                                />

                                <path
                                    d="m8.5 15 2 2 4.5-5"
                                />
                            </svg>
                        </div>

                        <div className="sap-summary-content">
                            <strong className="sap-summary-value">
                                {
                                    analytics.total_submissions
                                }
                            </strong>

                            <span className="sap-summary-label">
                                TOTAL SUBMISSIONS
                            </span>
                        </div>
                    </div>

                    <div className="sap-summary-breakdown">
                        <div className="sap-summary-metric sap-summary-passed">
                            <strong className="sap-summary-metric-value">
                                {totalPassed}
                            </strong>

                            <span className="sap-summary-metric-label">
                                PASSED
                            </span>
                        </div>

                        <div className="sap-summary-divider"></div>

                        <div className="sap-summary-metric sap-summary-failed">
                            <strong className="sap-summary-metric-value">
                                {totalFailed}
                            </strong>

                            <span className="sap-summary-metric-label">
                                FAILED
                            </span>
                        </div>
                    </div>
                </section>

                {/* =================================================
                    Exam Performance
                ================================================= */}

                <section className="sap-exam-section">
                    <div className="sap-section-header">
                        <div>
                            <span className="sap-section-kicker">
                                EXAMINATION ANALYTICS
                            </span>

                            <h2 className="sap-section-title">
                                Exam Performance
                            </h2>

                            <p className="sap-section-description">
                                View submission activity
                                and performance across
                                all examinations.
                            </p>
                        </div>

                        <span className="sap-exam-count">
                            {analytics.exam_wise.length}{" "}

                            {analytics.exam_wise.length === 1
                                ? "Exam"
                                : "Exams"}
                        </span>
                    </div>

                    {/* =================================================
                        Empty State
                    ================================================= */}

                    {analytics.exam_wise.length === 0 ? (
                        <div className="sap-empty-state">
                            <div className="sap-empty-icon">
                                —
                            </div>

                            <h3>
                                No Submission Data
                            </h3>

                            <p>
                                No submission data is
                                available yet.
                            </p>
                        </div>
                    ) : (
                        <div className="sap-exam-grid">
                            {analytics.exam_wise.map(
                                (exam) => {
                                    const examType =
                                        String(
                                            exam.exam_type ||
                                                ""
                                        )
                                            .trim()
                                            .toLowerCase();

                                    const isActual =
                                        examType.includes(
                                            "actual"
                                        );

                                    const isPractice =
                                        examType.includes(
                                            "practice"
                                        );

                                    const cardClass =
                                        isActual
                                            ? "sap-actual"
                                            : isPractice
                                            ? "sap-practice"
                                            : "sap-default";

                                    return (
                                        <article
                                            key={
                                                exam.exam_id
                                            }
                                            className={`sap-exam-card ${cardClass}`}
                                        >

                                            {/* ==========================================
                                                Card Header
                                            ========================================== */}

                                            <div className="sap-card-header">
                                                <div className="sap-card-title-area">
                                                    <span className="sap-exam-id">
                                                        EXAM #
                                                        {exam.exam_id}
                                                    </span>

                                                    <h3 className="sap-exam-title">
                                                        {exam.title}
                                                    </h3>
                                                </div>

                                                <span
                                                    className={`sap-performance-badge ${
                                                        isActual
                                                            ? "sap-performance-actual"
                                                            : isPractice
                                                            ? "sap-performance-practice"
                                                            : ""
                                                    }`}
                                                >
                                                    {isActual
                                                        ? "ACTUAL"
                                                        : isPractice
                                                        ? "PRACTICE"
                                                        : "EXAM"}
                                                </span>
                                            </div>

                                            {/* ==========================================
                                                Statistics
                                            ========================================== */}

                                            <div className="sap-stat-grid">
                                                <div className="sap-stat-item">
                                                    <span className="sap-stat-label">
                                                        Pass Rate
                                                    </span>

                                                    <strong className="sap-stat-value">
                                                        {
                                                            exam.pass_rate ===
                                                            null
                                                                ? "N/A"
                                                                : `${exam.pass_rate}%`
                                                        }
                                                    </strong>
                                                </div>

                                                <div className="sap-stat-item">
                                                    <span className="sap-stat-label">
                                                        Average Score
                                                    </span>

                                                    <strong className="sap-stat-value">
                                                        {
                                                            exam.average_score
                                                        }
                                                    </strong>
                                                </div>

                                                <div className="sap-stat-item">
                                                    <span className="sap-stat-label">
                                                        Highest Score
                                                    </span>

                                                    <strong className="sap-stat-value">
                                                        {
                                                            exam.highest_score
                                                        }{" "}
                                                        /{" "}
                                                        {
                                                            exam.total_marks
                                                        }
                                                    </strong>
                                                </div>

                                                <div className="sap-stat-item">
                                                    <span className="sap-stat-label">
                                                        Submissions
                                                    </span>

                                                    <strong className="sap-stat-value">
                                                        {
                                                            exam.submissions
                                                        }
                                                    </strong>
                                                </div>
                                            </div>

                                            {/* ==========================================
                                                Activity
                                            ========================================== */}

                                            <div className="sap-activity-area">
                                                <div className="sap-activity-header">
                                                    <span className="sap-activity-title">
                                                        Submission Activity
                                                    </span>

                                                    <span
                                                        className={`sap-activity-status ${
                                                            exam.submissions >
                                                            0
                                                                ? "active"
                                                                : "no-attempts"
                                                        }`}
                                                    >
                                                        <span className="sap-status-dot"></span>

                                                        {
                                                            exam.submissions >
                                                            0
                                                                ? "Active"
                                                                : "No Attempts"
                                                        }
                                                    </span>
                                                </div>

                                                <p className="sap-activity-description">
                                                    {
                                                        exam.submissions >
                                                        0
                                                            ? `${exam.submissions} submission${
                                                                  exam.submissions !==
                                                                  1
                                                                      ? "s"
                                                                      : ""
                                                              } recorded for this examination.`
                                                            : "No candidates have submitted this examination yet."
                                                    }
                                                </p>
                                            </div>

                                            {/* ==========================================
                                                Footer
                                            ========================================== */}

                                            <div className="sap-card-footer">
                                                <span className="sap-highest-scorer">
                                                    Highest Scorer:

                                                    <strong>
                                                        {
                                                            exam.highest_scorer
                                                        }
                                                    </strong>
                                                </span>

                                                <Link
                                                    className="sap-view-results-btn"
                                                    to={`/results/exam/${exam.exam_id}`}
                                                >
                                                    <svg
                                                        className="sap-eye-icon"
                                                        viewBox="0 0 24 24"
                                                        aria-hidden="true"
                                                    >
                                                        <path
                                                            d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
                                                        />

                                                        <circle
                                                            cx="12"
                                                            cy="12"
                                                            r="2.5"
                                                        />
                                                    </svg>

                                                    <span>
                                                        View Results
                                                    </span>
                                                </Link>
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

export default SubmissionAnalyticsPage;