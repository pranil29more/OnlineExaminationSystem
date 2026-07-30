import { useEffect, useState } from "react";

import { useParams, useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";

import PageLoader from "../components/PageLoader";

import API_BASE_URL from "../services/api";

import "../styles/CandidateResultsPage.css";

function CandidateResultsPage() {

    const { userId } = useParams();

    const navigate = useNavigate();

    const [candidate, setCandidate] =
    useState(null);

const [summary, setSummary] =
    useState(null);

    const [history, setHistory] =
    useState([]);

    useEffect(() => {

        fetchCandidate();

    }, []);

    const fetchCandidate = async () => {

        try {

            const token =
                localStorage.getItem("token");

            const response =
                await fetch(

                    `${API_BASE_URL}/candidate-results/${userId}`,

                    {

                        headers: {

                            Authorization:
                                `Bearer ${token}`

                        }

                    }

                );

            const data =
                await response.json();

            if (response.ok) {

                setCandidate(
    data.candidate
);

setSummary(
    data.summary
);

setHistory(
    data.history
);

            }

            else {

                alert(
                    data.message
                );

            }

        }

        catch (error) {

            console.error(error);

        }

    };

    if (!candidate) {

    return (

        <div>

            <Navbar />

            <PageLoader message="Loading Candidate Results..." />

        </div>

    );

}

    return (

        <div>

            <Navbar />

            <div className="candidate-results-container">

                <h1 className="candidate-results-title">

                    Candidate Results

                </h1>

                <div className="candidate-info-card">

                    <h2 className="candidate-name">

                        {candidate.name}

                    </h2>

                    <div className="candidate-grid">

                        <div>

                            <h4>Email</h4>

                            <p>

                                {candidate.email}

                            </p>

                        </div>

                        <div>

                            <h4>Batch</h4>

                            <p>

                                {candidate.batch_name}

                            </p>

                        </div>

                        <div>

                            <h4>Technology</h4>

                            <p>

                                {candidate.technology}

                            </p>

                        </div>

                    </div>

                </div>

                <div className="summary-container">

    <div className="summary-card">

        <h4>Total Assessments</h4>

        <p>

            {summary?.assessment_count ?? 0}

        </p>

    </div>

    <div className="summary-card">

        <h4>Average Score</h4>

        <p>

            {summary?.average_score !== null &&
             summary?.average_score !== undefined

                ? `${summary.average_score}%`

                : "--"}

        </p>

    </div>

    <div className="summary-card">

        <h4>Highest Score</h4>

        <p>

            {summary?.highest_score !== null &&
             summary?.highest_score !== undefined

                ? `${summary.highest_score}%`

                : "--"}

        </p>

    </div>

    <div className="summary-card">

        <h4>Lowest Score</h4>

        <p>

            {summary?.lowest_score !== null &&
             summary?.lowest_score !== undefined

                ? `${summary.lowest_score}%`

                : "--"}

        </p>

    </div>

</div>

<div className="history-card">

    <h2 className="history-title">

        Assessment History

    </h2>

    <table className="history-table">

        <thead>

            <tr>

                <th>Exam</th>

                <th>Score</th>

                <th>Percentage</th>

                <th>Status</th>

                <th>Submitted</th>

                <th>Action</th>

            </tr>

        </thead>

        <tbody>

            {

                history.length === 0 ?

                (

                    <tr>

                        <td
                            colSpan="6"
                            className="history-empty"
                        >

                            No assessments attempted.

                        </td>

                    </tr>

                )

                :

                (

                    history.map((item) => (

                        <tr
                            key={item.submission_id}
                        >

                            <td>

                                {item.exam_title}

                            </td>

                            <td>

                                {item.score} / {item.total_marks}

                            </td>

                            <td>

                                {item.percentage}%

                            </td>

                            <td>

                                <span
                                    className={

                                        item.status === "Pass"

                                        ?

                                        "status-pass"

                                        :

                                        "status-fail"

                                    }
                                >

                                    {item.status}

                                </span>

                            </td>

                            <td>

                                {

                                    new Date(

                                        item.submitted_at

                                    ).toLocaleDateString()

                                }

                            </td>

                            <td>

                                <button
    className="batch-details-btn"
    onClick={() =>
        navigate(`/result/${item.submission_id}`)
    }
>
    View Details
</button>

                            </td>

                        </tr>

                    ))

                )

            }

        </tbody>

    </table>

</div>

            </div>

        </div>

    );

}

export default CandidateResultsPage;