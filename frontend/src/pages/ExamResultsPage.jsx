import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { IoEyeOutline } from "react-icons/io5";

import API_BASE_URL from "../services/api";
import Navbar from "../components/Navbar";
import PageLoader from "../components/PageLoader";

import "../styles/ExamResultsPage.css";


function ExamResultsPage() {

    const { examId } = useParams();


    const [exam, setExam] =
        useState(null);

    const [results, setResults] =
        useState([]);


    // =========================================================
    // Fetch Exam Results
    // =========================================================

    useEffect(() => {
        fetchResults();
    }, []);


    const fetchResults = async () => {

        try {

            const token =
                localStorage.getItem("token");


            const response = await fetch(
                `${API_BASE_URL}/exam-results/${examId}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );


            const data =
                await response.json();


            setExam(data.exam);

            setResults(
                data.results || []
            );

        } catch (error) {

            console.error(error);

        }

    };


    // =========================================================
    // Loading
    // =========================================================

    if (!exam) {

        return (

            <div className="erp-page">

                <Navbar />

                <PageLoader
                    message="Loading Exam Results..."
                />

            </div>

        );

    }


    // =========================================================
    // Render
    // =========================================================

    return (

        <div className="erp-page">

            <Navbar />


            <main className="erp-page-container">


                {/* =================================================
                    Page Header
                ================================================= */}

                <div className="erp-page-header">

                    <div>

                        <span className="erp-page-eyebrow">
                            Examination Analytics
                        </span>

                        <h1 className="erp-page-title">
                            Exam Results
                        </h1>

                        <p className="erp-page-description">
                            Review candidate
                            submissions, scores,
                            performance status, and
                            detailed result information.
                        </p>

                    </div>

                </div>


                {/* =================================================
                    Exam Information
                ================================================= */}

                <section className="erp-exam-section">

                    <div className="erp-section-header">

                        <div>

                            <span className="erp-section-eyebrow">
                                Examination
                            </span>

                            <h2 className="erp-section-title">
                                Exam Information
                            </h2>

                            <p className="erp-section-description">
                                Overview of the examination
                                associated with these
                                submissions.
                            </p>

                        </div>

                    </div>


                    <div className="erp-exam-profile">


                        <div className="erp-exam-name-block">

                            <span className="erp-info-label">
                                Assessment
                            </span>

                            <h2 className="erp-exam-name">
                                {exam.title}
                            </h2>

                        </div>


                        <div className="erp-exam-grid">


                            <div className="erp-info-card">

                                <span className="erp-info-label">
                                    Total Marks
                                </span>

                                <strong>
                                    {exam.total_marks}
                                </strong>

                            </div>


                            <div className="erp-info-card">

                                <span className="erp-info-label">
                                    Passing Marks
                                </span>

                                <strong>
                                    {exam.passing_marks}
                                </strong>

                            </div>


                            <div className="erp-info-card">

                                <span className="erp-info-label">
                                    Submissions
                                </span>

                                <strong>
                                    {results.length}
                                </strong>

                            </div>


                        </div>

                    </div>

                </section>


                {/* =================================================
                    Student Results
                ================================================= */}

                <section className="erp-results-section">


                    <div className="erp-section-header">

                        <div>

                            <span className="erp-section-eyebrow">
                                Performance History
                            </span>

                            <h2 className="erp-section-title">
                                Student Results
                            </h2>

                            <p className="erp-section-description">
                                Review every candidate
                                submission and open
                                detailed result information.
                            </p>

                        </div>


                        <span className="erp-results-count">

                            {results.length}{" "}

                            {results.length === 1
                                ? "Submission"
                                : "Submissions"}

                        </span>

                    </div>


                    {/* =================================================
                        Results Table
                    ================================================= */}

                    <div className="erp-table-wrapper">

                        <table className="erp-results-table">

                            <thead>

                                <tr>

                                    <th>
                                        Candidate
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

                                {results.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan="6"
                                            className="erp-table-empty"
                                        >
                                            No candidates have
                                            submitted this
                                            examination yet.
                                        </td>

                                    </tr>

                                ) : (

                                    results.map(
                                        (result) => {

                                            const status =
                                                Number(
                                                    result.score
                                                ) >=
                                                Number(
                                                    exam.passing_marks
                                                )
                                                    ? "Pass"
                                                    : "Fail";


                                            const percentage =
                                                Number(
                                                    exam.total_marks
                                                ) > 0
                                                    ? (
                                                        Number(
                                                            result.score
                                                        ) /
                                                        Number(
                                                            exam.total_marks
                                                        )
                                                    ) *
                                                    100
                                                    : 0;


                                            const submittedDate =
                                                new Date(
                                                    result.submitted_at
                                                ).toLocaleDateString(
                                                    "en-GB"
                                                );


                                            return (

                                                <tr
                                                    key={
                                                        result.submission_id
                                                    }
                                                >


                                                    <td>

                                                        <strong className="erp-candidate-name">
                                                            {
                                                                result.candidate_name
                                                            }
                                                        </strong>

                                                    </td>


                                                    <td>

                                                        <span className="erp-score">

                                                            {
                                                                result.score
                                                            }

                                                            {" "}

                                                            /

                                                            {" "}

                                                            {
                                                                exam.total_marks
                                                            }

                                                        </span>

                                                    </td>


                                                    <td>

                                                        <strong className="erp-percentage">

                                                            {
                                                                percentage.toFixed(
                                                                    2
                                                                )
                                                            }%

                                                        </strong>

                                                    </td>


                                                    <td>

                                                        <span
                                                            className={
                                                                status ===
                                                                "Pass"
                                                                    ? "erp-status-badge erp-status-pass"
                                                                    : "erp-status-badge erp-status-fail"
                                                            }
                                                        >
                                                            {
                                                                status
                                                            }
                                                        </span>

                                                    </td>


                                                    <td>

                                                        <span className="erp-submitted-date">
                                                            {
                                                                submittedDate
                                                            }
                                                        </span>

                                                    </td>


                                                    <td>

                                                        <Link
                                                            className="erp-view-details-btn"
                                                            to={`/result/${result.submission_id}`}
                                                        >

                                                            <IoEyeOutline
                                                                className="erp-view-details-icon"
                                                            />

                                                            <span>
                                                                View Details
                                                            </span>

                                                        </Link>

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


export default ExamResultsPage;