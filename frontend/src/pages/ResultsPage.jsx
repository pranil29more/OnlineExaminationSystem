import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import API_BASE_URL from "../services/api";
import Navbar from "../components/Navbar";

import "../styles/ResultsPage.css";


function ResultsPage() {

    const [results, setResults] =
        useState([]);

    const [search, setSearch] =
        useState("");


    // ==========================================
    // Fetch Results
    // ==========================================

    useEffect(() => {
        fetchResults();
    }, []);


    const fetchResults = async () => {

        try {

            const token =
                localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/results`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            const data =
                await response.json();

            setResults(data);

        } catch (error) {

            console.error(error);
        }
    };


    // ==========================================
    // Filter Results
    // ==========================================

    const searchText =
        search.trim().toLowerCase();

    const filteredResults =
        results.filter(
            (result) => {

                return (

                    String(
                        result.submission_id
                    )
                        .toLowerCase()
                        .includes(searchText)

                    ||

                    (result.exam_title || "")
                        .toLowerCase()
                        .includes(searchText)

                    ||

                    (result.candidate_name || "")
                        .toLowerCase()
                        .includes(searchText)

                );
            }
        );


    const hasCandidateNames =
        results.some(
            (result) =>
                result.candidate_name
        );


    // ==========================================
    // Render
    // ==========================================

    return (

        <div className="rp-page">

            <Navbar />


            <main className="rp-page-container">


                {/* ==========================================
                    Page Header
                ========================================== */}

                <header className="rp-page-header">

                    <div>

                        <span className="rp-page-eyebrow">
                            RESULTS
                        </span>

                        <h1 className="rp-page-title">
                            Submissions & Results
                        </h1>

                        <p className="rp-page-description">
                            Review examination
                            submissions, scores, and
                            performance results.
                        </p>

                    </div>

                </header>


                {/* ==========================================
                    Search
                ========================================== */}

                <section className="rp-search-section">

                    <div className="rp-search-wrapper">

                        <input
                            id="result-search"
                            type="text"
                            className="rp-search-input"
                            placeholder={
                                hasCandidateNames
                                    ? "🔍 Search by candidate, exam or submission ID..."
                                    : "🔍 Search by exam or submission ID..."
                            }
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                        />

                    </div>


                    {search.trim() && (

                        <p className="rp-search-summary">

                            Showing{" "}

                            <strong>
                                {
                                    filteredResults.length
                                }
                            </strong>{" "}

                            matching{" "}

                            {
                                filteredResults.length ===
                                1
                                    ? "result"
                                    : "results"
                            }

                        </p>

                    )}

                </section>


                {/* ==========================================
                    Results Section
                ========================================== */}

                <section className="rp-section">


                    <div className="rp-section-header">

                        <div>

                            <span className="rp-section-kicker">
                                SUBMISSIONS
                            </span>

                            <h2 className="rp-section-title">
                                Examination Results
                            </h2>

                            <p className="rp-section-description">
                                View submitted
                                examinations and
                                their performance
                                details.
                            </p>

                        </div>


                        <span className="rp-count-badge">

                            {
                                filteredResults.length
                            }{" "}

                            {
                                filteredResults.length ===
                                1
                                    ? "Submission"
                                    : "Submissions"
                            }

                        </span>

                    </div>


                    {/* ==========================================
                        Results Grid
                    ========================================== */}

                    {filteredResults.length >
                    0 ? (

                        <div className="rp-results-grid">

                            {filteredResults.map(
                                (result) => {

                                    const isPassed =
                                        result.score >=
                                        result.passing_marks;

                                    return (

                                        <article
                                            key={
                                                result.submission_id
                                            }
                                            className={`rp-result-card ${
                                                isPassed
                                                    ? "rp-result-card-pass"
                                                    : "rp-result-card-fail"
                                            }`}
                                        >


                                            {/* ==================================
                                                Card Header
                                            ================================== */}

                                            <div className="rp-card-header">

                                                <div className="rp-card-heading">

                                                    <span className="rp-submission-label">
                                                        Submission
                                                    </span>

                                                    <h3 className="rp-result-title">
                                                        #
                                                        {
                                                            result.submission_id
                                                        }
                                                    </h3>

                                                </div>


                                                <span
                                                    className={
                                                        isPassed
                                                            ? "rp-status-badge rp-status-pass"
                                                            : "rp-status-badge rp-status-fail"
                                                    }
                                                >
                                                    {
                                                        isPassed
                                                            ? "Pass"
                                                            : "Fail"
                                                    }
                                                </span>

                                            </div>


                                            {/* ==================================
                                                Result Details
                                            ================================== */}

                                            <div className="rp-result-details">


                                                {result.candidate_name && (

                                                    <div className="rp-result-detail">

                                                        <span className="rp-detail-label">
                                                            Candidate
                                                        </span>

                                                        <strong>
                                                            {
                                                                result.candidate_name
                                                            }
                                                        </strong>

                                                    </div>

                                                )}


                                                <div className="rp-result-detail">

                                                    <span className="rp-detail-label">
                                                        Exam
                                                    </span>

                                                    <strong>
                                                        {
                                                            result.exam_title
                                                                ? result.exam_title
                                                                : `Exam #${result.exam_id}`
                                                        }
                                                    </strong>

                                                </div>


                                                <div className="rp-result-detail">

                                                    <span className="rp-detail-label">
                                                        Score
                                                    </span>

                                                    <strong className="rp-score-value">

                                                        {
                                                            result.score
                                                        }

                                                        <span>
                                                            {" "}
                                                            /
                                                            {" "}
                                                            {
                                                                result.total_marks
                                                            }
                                                        </span>

                                                    </strong>

                                                </div>


                                                <div className="rp-result-detail">

                                                    <span className="rp-detail-label">
                                                        Passing Marks
                                                    </span>

                                                    <strong>
                                                        {
                                                            result.passing_marks
                                                        }
                                                    </strong>

                                                </div>


                                            </div>


                                            {/* ==================================
                                                Submission Information
                                            ================================== */}

                                            <div className="rp-submission-info">

                                                <span>
                                                    Submitted
                                                </span>

                                                <strong>
                                                    {
                                                        result.submitted_at
                                                    }
                                                </strong>

                                            </div>


                                            {/* ==================================
                                                Card Footer
                                            ================================== */}

                                            <div className="rp-card-footer">

                                                <Link
    className="rp-view-result"
    to={`/result/${result.submission_id}`}
>
    <svg
        className="rp-eye-icon"
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
        View Result
    </span>
</Link>

                                            </div>


                                        </article>

                                    );
                                }
                            )}

                        </div>

                    ) : (

                        /* ==========================================
                           Empty / Search State
                        ========================================== */

                        <div className="rp-empty-state">

                            <div className="rp-empty-icon">
                                —
                            </div>

                            <strong>
                                {
                                    search.trim()
                                        ? "No Matching Results"
                                        : "No Results Available"
                                }
                            </strong>

                            <p>
                                {
                                    search.trim()
                                        ? "No examination results match your current search."
                                        : "There are currently no examination submissions to display."
                                }
                            </p>

                        </div>

                    )}

                </section>


            </main>

        </div>
    );
}


export default ResultsPage;