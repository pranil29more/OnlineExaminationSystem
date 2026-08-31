import { useEffect, useState } from "react";
import {
    useNavigate,
    useParams,
    useSearchParams,
} from "react-router-dom";
import { IoEyeOutline } from "react-icons/io5";
import Navbar from "../components/Navbar";
import PageLoader from "../components/PageLoader";
import API_BASE_URL from "../services/api";
import "../styles/CandidateResultsPage.css";

function CandidateResultsPage() {
    const { userId } = useParams();

    const [searchParams] = useSearchParams();

    const batchId = searchParams.get("batch_id");

    const navigate = useNavigate();

    const [candidate, setCandidate] =
        useState(null);

    const [summary, setSummary] =
        useState(null);

    const [history, setHistory] =
        useState([]);

    const [loadingSubmissionId, setLoadingSubmissionId] =
        useState(null);

    useEffect(() => {
        fetchCandidate();
    }, [userId, batchId]);

    const fetchCandidate = async () => {
        try {
            const token =
                localStorage.getItem("token");

            const query =
                batchId
                    ? `?batch_id=${batchId}`
                    : "";

            const response = await fetch(
                `${API_BASE_URL}/candidate-results/${userId}${query}`,
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
                alert(
                    data.message ||
                        "Unable to load candidate results."
                );

                return;
            }

            setCandidate(data.candidate);
            setSummary(data.summary);
            setHistory(data.history || []);
        } catch (error) {
            console.error(error);

            alert(
                "Unable to load candidate results."
            );
        }
    };

    const handleViewDetails = (
        submissionId
    ) => {
        setLoadingSubmissionId(
            submissionId
        );

        navigate(
            `/result/${submissionId}`
        );
    };

    if (!candidate) {
        return (
            <div className="crp-page">
                <Navbar />

                <PageLoader
                    message="Loading Candidate Results..."
                />
            </div>
        );
    }

    return (
        <div className="crp-page">
            <Navbar />

            <main className="crp-page-container">
                {/* =================================================
                    Page Header
                ================================================= */}

                <div className="crp-page-header">
                    <div>
                        <span className="crp-page-eyebrow">
                            PERFORMANCE ANALYTICS
                        </span>

                        <h1 className="crp-page-title">
                            Candidate Results
                        </h1>

                        <p className="crp-page-description">
                            Review candidate
                            information, assessment
                            performance, and complete
                            submission history.
                        </p>
                    </div>
                </div>

                {/* =================================================
                    Candidate Information
                ================================================= */}

                <section className="crp-candidate-section">
                    <div className="crp-section-header">
                        <div>
                            <h2 className="crp-section-title">
                                Candidate Information
                            </h2>

                            <p className="crp-section-description">
                                Profile and batch
                                information associated
                                with this candidate.
                            </p>
                        </div>
                    </div>

                    <div className="crp-candidate-profile">
                        <div className="crp-candidate-name-block">
                            <span className="crp-info-label">
                                Candidate
                            </span>

                            <h2 className="crp-candidate-name">
                                {candidate.name}
                            </h2>
                        </div>

                        <div className="crp-candidate-grid">
                            <div className="crp-info-card">
                                <span className="crp-info-label">
                                    Email
                                </span>

                                <strong>
                                    {candidate.email}
                                </strong>
                            </div>

                            <div className="crp-info-card">
                                <span className="crp-info-label">
                                    Batch
                                </span>

                                <strong>
                                    {candidate.batch_name ||
                                        "Not Assigned"}
                                </strong>
                            </div>

                            <div className="crp-info-card">
                                <span className="crp-info-label">
                                    Technology
                                </span>

                                <strong>
                                    {candidate.technology ||
                                        "Not Available"}
                                </strong>
                            </div>
                        </div>
                    </div>
                </section>

                {/* =================================================
                    Performance Summary
                ================================================= */}

                <section className="crp-summary-section">
                    <div className="crp-section-header">
                        <div>
                            <h2 className="crp-section-title">
                                Performance Summary
                            </h2>

                            <p className="crp-section-description">
                                Overall assessment
                                performance for this
                                candidate.
                            </p>
                        </div>
                    </div>

                    <div className="crp-summary-grid">
                        <div className="crp-summary-card">
                            <span className="crp-summary-label">
                                Total Assessments
                            </span>

                            <strong className="crp-summary-value">
                                {
                                    summary?.assessment_count ??
                                    0
                                }
                            </strong>
                        </div>

                        <div className="crp-summary-card">
                            <span className="crp-summary-label">
                                Average Score
                            </span>

                            <strong className="crp-summary-value">
                                {summary?.average_score !==
                                    null &&
                                summary?.average_score !==
                                    undefined
                                    ? `${summary.average_score}%`
                                    : "--"}
                            </strong>
                        </div>

                        <div className="crp-summary-card">
                            <span className="crp-summary-label">
                                Highest Score
                            </span>

                            <strong className="crp-summary-value">
                                {summary?.highest_score !==
                                    null &&
                                summary?.highest_score !==
                                    undefined
                                    ? `${summary.highest_score}%`
                                    : "--"}
                            </strong>
                        </div>

                        <div className="crp-summary-card">
                            <span className="crp-summary-label">
                                Lowest Score
                            </span>

                            <strong className="crp-summary-value">
                                {summary?.lowest_score !==
                                    null &&
                                summary?.lowest_score !==
                                    undefined
                                    ? `${summary.lowest_score}%`
                                    : "--"}
                            </strong>
                        </div>
                    </div>
                </section>

                {/* =================================================
                    Assessment History
                ================================================= */}

                <section className="crp-history-section">
                    <div className="crp-section-header">
                        <div>
                            <span className="crp-section-eyebrow">
                                Performance History
                            </span>

                            <h2 className="crp-section-title">
                                Assessment History
                            </h2>

                            <p className="crp-section-description">
                                Review every assessment
                                submission and open
                                detailed result information.
                            </p>
                        </div>

                        <span className="crp-history-count">
                            {history.length}{" "}
                            {history.length === 1
                                ? "Assessment"
                                : "Assessments"}
                        </span>
                    </div>

                    <div className="crp-table-wrapper">
                        <table className="crp-history-table">
                            <thead>
                                <tr>
                                    <th>
                                        Exam
                                    </th>

                                    <th>
                                        Score
                                    </th>

                                    <th>
                                        Percentage
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Submitted
                                    </th>

                                    <th>
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {history.length ===
                                0 ? (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="crp-table-empty"
                                        >
                                            No assessments
                                            attempted.
                                        </td>
                                    </tr>
                                ) : (
                                    history.map(
                                        (item) => {
                                            const loading =
                                                loadingSubmissionId ===
                                                item.submission_id;

                                            return (
                                                <tr
                                                    key={
                                                        item.submission_id
                                                    }
                                                >
                                                    <td>
                                                        <strong className="crp-exam-title">
                                                            {
                                                                item.exam_title
                                                            }
                                                        </strong>
                                                    </td>

                                                    <td>
                                                        <span className="crp-score">
                                                            {
                                                                item.score
                                                            }{" "}
                                                            /{" "}
                                                            {
                                                                item.total_marks
                                                            }
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <strong className="crp-percentage">
                                                            {
                                                                item.percentage
                                                            }%
                                                        </strong>
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={
                                                                item.status ===
                                                                "Pass"
                                                                    ? "crp-status-badge crp-status-pass"
                                                                    : "crp-status-badge crp-status-fail"
                                                            }
                                                        >
                                                            {
                                                                item.status
                                                            }
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <span className="crp-submitted-date">
                                                            {new Date(
                                                                item.submitted_at
                                                            ).toLocaleDateString()}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <button
                                                            type="button"
                                                            className="crp-view-details-btn"
                                                            onClick={() =>
                                                                handleViewDetails(
                                                                    item.submission_id
                                                                )
                                                            }
                                                        >
                                                            <IoEyeOutline
                                                                className="crp-view-details-icon"
                                                            />

                                                            <span>
                                                                View Details
                                                            </span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default CandidateResultsPage;