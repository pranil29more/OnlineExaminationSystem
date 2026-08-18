import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IoEyeOutline } from "react-icons/io5";
import API_BASE_URL from "../services/api";
import Navbar from "../components/Navbar";
import PageLoader from "../components/PageLoader";
import "../styles/BatchDetailsPage.css";

function BatchDetailsPage() {
    const { batchId } = useParams();

    const navigate = useNavigate();

    const [batch, setBatch] = useState(null);
    const [candidates, setCandidates] = useState([]);

    const [showAssignModal, setShowAssignModal] =
        useState(false);

    const [availableCandidates, setAvailableCandidates] =
        useState([]);

    const [selectedCandidates, setSelectedCandidates] =
        useState([]);

    const [showUnassignModal, setShowUnassignModal] =
        useState(false);

    const [
        selectedUnassignCandidates,
        setSelectedUnassignCandidates,
    ] = useState([]);

    const [searchAssign, setSearchAssign] =
        useState("");

    const [searchUnassign, setSearchUnassign] =
        useState("");

    const [searchCandidate, setSearchCandidate] =
        useState("");

    const [batchReport, setBatchReport] =
        useState(null);

    const [reportLoading, setReportLoading] =
        useState(true);

    const [assigning, setAssigning] =
        useState(false);

    const [unassigning, setUnassigning] =
        useState(false);

    const [downloadingReport, setDownloadingReport] =
        useState(false);

    const [loadingAvailableCandidates, setLoadingAvailableCandidates] =
        useState(false);

    const [navigatingCandidateId, setNavigatingCandidateId] =
        useState(null);

    useEffect(() => {
        fetchBatchDetails();
        fetchBatchReport();
    }, []);

    const fetchBatchDetails = async () => {
        try {
            const token =
                localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/batch-details/${batchId}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                alert(
                    data.message ||
                        "Unable to load batch details."
                );

                return;
            }

            setBatch(data.batch);
            setCandidates(data.candidates || []);
        } catch (error) {
            console.error(error);

            alert(
                "Unable to load batch details."
            );
        }
    };

    const fetchBatchReport = async () => {
        try {
            setReportLoading(true);

            const token =
                localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/batch-report/${batchId}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                alert(
                    data.message ||
                        "Unable to load batch report."
                );

                return;
            }

            setBatchReport(data);
        } catch (error) {
            console.error(error);

            alert(
                "Unable to load batch performance report."
            );
        } finally {
            setReportLoading(false);
        }
    };

    const handleDownloadBatchReport = async () => {
        if (
            downloadingReport ||
            !batchReport ||
            !batch
        ) {
            return;
        }

        try {
            setDownloadingReport(true);

            const token =
                localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/batch-report/${batchId}/download/excel`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                const data =
                    await response.json();

                alert(
                    data.message ||
                        "Unable to download batch report."
                );

                return;
            }

            const blob =
                await response.blob();

            const url =
                window.URL.createObjectURL(blob);

            const link =
                document.createElement("a");

            link.href = url;

            link.download =
                `${batch.batch_name.replace(
                    /\s+/g,
                    "_"
                )}_Batch_Report.xlsx`;

            document.body.appendChild(link);

            link.click();

            link.remove();

            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);

            alert(
                "Unable to download batch report."
            );
        } finally {
            setDownloadingReport(false);
        }
    };

    const fetchAvailableCandidates =
        async () => {
            if (loadingAvailableCandidates) {
                return;
            }

            try {
                setLoadingAvailableCandidates(true);

                const token =
                    localStorage.getItem("token");

                const response = await fetch(
                    `${API_BASE_URL}/available-candidates`,
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
                            "Unable to load available candidates."
                    );

                    return;
                }

                setAvailableCandidates(
                    data || []
                );

                setSelectedCandidates([]);

                setSearchAssign("");

                setShowAssignModal(true);
            } catch (error) {
                console.error(error);

                alert(
                    "Unable to load available candidates."
                );
            } finally {
                setLoadingAvailableCandidates(false);
            }
        };

    const fetchAssignedCandidates = () => {
        if (unassigning) {
            return;
        }

        setSelectedUnassignCandidates([]);

        setSearchUnassign("");

        setShowUnassignModal(true);
    };

    const toggleCandidateSelection = (
        userId
    ) => {
        if (assigning) {
            return;
        }

        setSelectedCandidates((previous) => {
            if (
                previous.includes(userId)
            ) {
                return previous.filter(
                    (id) => id !== userId
                );
            }

            return [
                ...previous,
                userId,
            ];
        });
    };

    const toggleUnassignSelection = (
        userId
    ) => {
        if (unassigning) {
            return;
        }

        setSelectedUnassignCandidates(
            (previous) => {
                if (
                    previous.includes(
                        userId
                    )
                ) {
                    return previous.filter(
                        (id) =>
                            id !== userId
                    );
                }

                return [
                    ...previous,
                    userId,
                ];
            }
        );
    };

    const handleSelectAllAssign = () => {
        if (assigning) {
            return;
        }

        if (allAssignSelected) {
            setSelectedCandidates(
                selectedCandidates.filter(
                    (id) =>
                        !filteredAvailableCandidates.some(
                            (candidate) =>
                                candidate.user_id ===
                                id
                        )
                )
            );
        } else {
            const ids =
                filteredAvailableCandidates.map(
                    (candidate) =>
                        candidate.user_id
                );

            setSelectedCandidates([
                ...new Set([
                    ...selectedCandidates,
                    ...ids,
                ]),
            ]);
        }
    };

    const handleSelectAllUnassign = () => {
        if (unassigning) {
            return;
        }

        if (allUnassignSelected) {
            setSelectedUnassignCandidates(
                selectedUnassignCandidates.filter(
                    (id) =>
                        !filteredAssignedCandidates.some(
                            (candidate) =>
                                candidate.user_id ===
                                id
                        )
                )
            );
        } else {
            const ids =
                filteredAssignedCandidates.map(
                    (candidate) =>
                        candidate.user_id
                );

            setSelectedUnassignCandidates([
                ...new Set([
                    ...selectedUnassignCandidates,
                    ...ids,
                ]),
            ]);
        }
    };

    const handleAssignCandidate =
        async () => {
            if (
                selectedCandidates.length ===
                    0 ||
                assigning
            ) {
                return;
            }

            try {
                setAssigning(true);

                const token =
                    localStorage.getItem("token");

                const response =
                    await fetch(
                        `${API_BASE_URL}/assign-candidate`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                Authorization:
                                    `Bearer ${token}`,
                            },

                            body: JSON.stringify({
                                batch_id:
                                    Number(
                                        batchId
                                    ),

                                user_ids:
                                    selectedCandidates,
                            }),
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    alert(
                        data.message ||
                            "Unable to assign candidates."
                    );

                    return;
                }

                alert(
                    data.message ||
                        "Candidates assigned successfully."
                );

                setShowAssignModal(false);

                setSelectedCandidates([]);

                setAvailableCandidates([]);

                await fetchBatchDetails();

                await fetchBatchReport();
            } catch (error) {
                console.error(error);

                alert(
                    "Unable to assign candidates."
                );
            } finally {
                setAssigning(false);
            }
        };

    const handleUnassignCandidates =
        async () => {
            if (
                selectedUnassignCandidates.length ===
                    0 ||
                unassigning
            ) {
                return;
            }

            try {
                setUnassigning(true);

                const token =
                    localStorage.getItem("token");

                const response =
                    await fetch(
                        `${API_BASE_URL}/unassign-candidate`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                Authorization:
                                    `Bearer ${token}`,
                            },

                            body: JSON.stringify({
                                user_ids:
                                    selectedUnassignCandidates,
                            }),
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    alert(
                        data.message ||
                            "Unable to unassign candidates."
                    );

                    return;
                }

                alert(
                    data.message ||
                        "Candidates unassigned successfully."
                );

                setShowUnassignModal(false);

                setSelectedUnassignCandidates(
                    []
                );

                await fetchBatchDetails();

                await fetchBatchReport();
            } catch (error) {
                console.error(error);

                alert(
                    "Unable to unassign candidates."
                );
            } finally {
                setUnassigning(false);
            }
        };

    const handleViewResults = (
        userId
    ) => {
        if (navigatingCandidateId) {
            return;
        }

        setNavigatingCandidateId(userId);

        navigate(
            `/candidate-results/${userId}?batch_id=${batchId}`
        );
    };

    const filteredAvailableCandidates =
        availableCandidates.filter(
            (candidate) =>
                candidate.name
                    .toLowerCase()
                    .includes(
                        searchAssign.toLowerCase()
                    ) ||
                candidate.email
                    .toLowerCase()
                    .includes(
                        searchAssign.toLowerCase()
                    )
        );

    const filteredAssignedCandidates =
        candidates.filter(
            (candidate) =>
                candidate.name
                    .toLowerCase()
                    .includes(
                        searchUnassign.toLowerCase()
                    ) ||
                candidate.email
                    .toLowerCase()
                    .includes(
                        searchUnassign.toLowerCase()
                    )
        );

    const filteredCandidates =
        candidates.filter(
            (candidate) =>
                candidate.name
                    .toLowerCase()
                    .includes(
                        searchCandidate.toLowerCase()
                    ) ||
                candidate.email
                    .toLowerCase()
                    .includes(
                        searchCandidate.toLowerCase()
                    )
        );

    const allAssignSelected =
        filteredAvailableCandidates.length >
            0 &&
        filteredAvailableCandidates.every(
            (candidate) =>
                selectedCandidates.includes(
                    candidate.user_id
                )
        );

    const allUnassignSelected =
        filteredAssignedCandidates.length >
            0 &&
        filteredAssignedCandidates.every(
            (candidate) =>
                selectedUnassignCandidates.includes(
                    candidate.user_id
                )
        );

    if (!batch) {
        return (
            <div>
                <Navbar />

                <PageLoader
                    message="Loading Batch Details..."
                />
            </div>
        );
    }


    return (
        <div>
            <Navbar />

            <main className="bdp-page">

                <div className="bdp-page-header">

                    <div>

                        <span className="bdp-page-eyebrow">
                            Batch Management
                        </span>

                        <h1 className="bdp-page-title">
                            {batch.batch_name}
                        </h1>

                        <p className="bdp-page-description">
                            View batch information,
                            manage candidates, and
                            monitor assessment
                            performance.
                        </p>

                    </div>

                    <span
                        className={`bdp-status-badge ${batch.status
                            .toLowerCase()
                            .replace(
                                " ",
                                "-"
                            )}`}
                    >
                        {batch.status}
                    </span>

                </div>


                <section className="bdp-overview-card">

                    <div className="bdp-section-heading">

                        <div>

                            <h2 className="bdp-section-title">
                                Batch Overview
                            </h2>

                            <p className="bdp-section-description">
                                Basic information and
                                configuration for this
                                training batch.
                            </p>

                        </div>

                    </div>


                    <div className="bdp-overview-grid">

                        <div className="bdp-info-card">

                            <span className="bdp-info-label">
                                Technology
                            </span>

                            <strong>
                                {batch.technology}
                            </strong>

                        </div>


                        <div className="bdp-info-card">

                            <span className="bdp-info-label">
                                Trainer
                            </span>

                            <strong>
                                {batch.trainer_name}
                            </strong>

                        </div>


                        <div className="bdp-info-card">

                            <span className="bdp-info-label">
                                Candidates
                            </span>

                            <strong>
                                {candidates.length}
                            </strong>

                        </div>


                        <div className="bdp-info-card">

                            <span className="bdp-info-label">
                                Start Date
                            </span>

                            <strong>
                                {batch.start_date}
                            </strong>

                        </div>


                        <div className="bdp-info-card">

                            <span className="bdp-info-label">
                                End Date
                            </span>

                            <strong>
                                {batch.end_date}
                            </strong>

                        </div>


                        <div className="bdp-info-card">

                            <span className="bdp-info-label">
                                Assessments
                            </span>

                            <strong>
                                {batchReport?.summary
                                    ?.total_assessments ?? 0}
                            </strong>

                        </div>

                    </div>


                    <div className="bdp-description-box">

                        <span className="bdp-info-label">
                            Description
                        </span>

                        <p>
                            {batch.description ||
                                "No description provided for this batch."}
                        </p>

                    </div>

                </section>


                <section className="bdp-candidates-section">

                    <div className="bdp-section-heading bdp-candidates-heading">

                        <div>

                            <h2 className="bdp-section-title">
                                Candidates
                            </h2>

                            <p className="bdp-section-description">
                                Manage candidates assigned
                                to this batch and review
                                their assessment performance.
                            </p>

                        </div>


                        <div className="bdp-action-buttons">

                            <button
                                type="button"
                                className="bdp-assign-btn"
                                onClick={
                                    fetchAvailableCandidates
                                }
                                disabled={
                                    loadingAvailableCandidates ||
                                    assigning ||
                                    unassigning
                                }
                            >
                                {loadingAvailableCandidates
                                    ? "Loading Candidates..."
                                    : "+ Assign Candidate"}
                            </button>


                            <button
                                type="button"
                                className="bdp-unassign-btn"
                                onClick={
                                    fetchAssignedCandidates
                                }
                                disabled={
                                    candidates.length ===
                                        0 ||
                                    loadingAvailableCandidates ||
                                    assigning ||
                                    unassigning
                                }
                            >
                                − Unassign Candidate
                            </button>

                        </div>

                    </div>


                    <div className="bdp-candidate-summary-row">

                        <div className="bdp-candidate-count-card">

                            <span>
                                Assigned Candidates:
                            </span>

                            <strong>
                                {candidates.length}
                            </strong>

                        </div>


                        <div className="bdp-candidate-count-description">
                            Candidates currently
                            associated with this batch.
                        </div>

                    </div>


                    <div className="bdp-search-wrapper">

                        <input
                            type="text"
                            className="bdp-search"
                            placeholder="🔍 Search candidate by name or email..."
                            value={searchCandidate}
                            onChange={(event) =>
                                setSearchCandidate(
                                    event.target.value
                                )
                            }
                            disabled={
                                assigning ||
                                unassigning
                            }
                        />

                    </div>


                    <div className="bdp-table-wrapper">

                        <table className="bdp-details-table">

                            <thead>

                                <tr>

                                    <th>
                                        Candidate
                                    </th>

                                    <th>
                                        Email
                                    </th>

                                    <th>
                                        Action
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {filteredCandidates.length ===
                                0 ? (

                                    <tr>

                                        <td
                                            colSpan="3"
                                            className="bdp-details-empty"
                                        >
                                            {candidates.length ===
                                            0
                                                ? "No candidates are currently assigned to this batch."
                                                : "No candidates match your search."}
                                        </td>

                                    </tr>

                                ) : (

                                    filteredCandidates.map(
                                        (
                                            candidate
                                        ) => (

                                            <tr
                                                key={
                                                    candidate.user_id
                                                }
                                            >

                                                <td>

                                                    <div className="bdp-candidate-table-name">
                                                        {
                                                            candidate.name
                                                        }
                                                    </div>

                                                </td>


                                                <td>

                                                    <span className="bdp-candidate-table-email">
                                                        {
                                                            candidate.email
                                                        }
                                                    </span>

                                                </td>


                                                <td>

    <button
    type="button"
    className="bdp-view-results-btn"
    onClick={() =>
        handleViewResults(
            candidate.user_id
        )
    }
>
    <IoEyeOutline
        className="bdp-view-results-icon"
    />

    <span>
        View Results
    </span>
</button>

</td>

                                            </tr>

                                        )
                                    )

                                )}

                            </tbody>

                        </table>

                    </div>

                </section>


                <section className="bdp-report-section">

                    <div className="bdp-report-header">

                        <div>

                            <span className="bdp-section-eyebrow">
                                Performance
                            </span>

                            <h2 className="bdp-report-title">
                                Batch Performance Report
                            </h2>

                            <p className="bdp-report-description">
                                Overall performance of
                                candidates across
                                assessments conducted for
                                this batch.
                            </p>

                        </div>


                        <button
                            type="button"
                            className="bdp-report-download-btn"
                            onClick={
                                handleDownloadBatchReport
                            }
                            disabled={
                                reportLoading ||
                                !batchReport ||
                                downloadingReport
                            }
                        >
                            {downloadingReport
                                ? "Downloading..."
                                : reportLoading
                                    ? "Preparing Report..."
                                    : "Download Report"}
                        </button>

                    </div>


                    {reportLoading ? (

                        <div className="bdp-report-loading">
                            Loading batch performance
                            report...
                        </div>

                    ) : !batchReport ? (

                        <div className="bdp-report-empty">
                            Unable to load batch
                            performance report.
                        </div>

                    ) : (

                        <>

                            <div className="bdp-report-summary">

                                <div className="bdp-report-summary-card">

                                    <span>
                                        Candidates
                                    </span>

                                    <strong>
                                        {
                                            batchReport.summary
                                                .total_candidates
                                        }
                                    </strong>

                                </div>


                                <div className="bdp-report-summary-card">

                                    <span>
                                        Assessments
                                    </span>

                                    <strong>
                                        {
                                            batchReport.summary
                                                .total_assessments
                                        }
                                    </strong>

                                </div>


                                <div className="bdp-report-summary-card">

                                    <span>
                                        Submissions
                                    </span>

                                    <strong>
                                        {
                                            batchReport.summary
                                                .total_submissions
                                        }
                                    </strong>

                                </div>


                                <div className="bdp-report-summary-card">

                                    <span>
                                        Average Score
                                    </span>

                                    <strong>
                                        {
                                            batchReport.summary
                                                .average_score
                                        }%
                                    </strong>

                                </div>


                                <div className="bdp-report-summary-card">

                                    <span>
                                        Pass Percentage
                                    </span>

                                    <strong>
                                        {
                                            batchReport.summary
                                                .pass_percentage
                                        }%
                                    </strong>

                                </div>


                                <div className="bdp-report-summary-card">

                                    <span>
                                        Highest Score
                                    </span>

                                    <strong>
                                        {
                                            batchReport.summary
                                                .highest_score
                                        }%
                                    </strong>

                                </div>

                            </div>


                            <div className="bdp-report-subsection">

                                <div className="bdp-report-subsection-header">

                                    <div>

                                        <h3>
                                            Candidate Performance
                                        </h3>

                                        <p>
                                            Performance ranking
                                            of candidates based
                                            on their assessment
                                            scores.
                                        </p>

                                    </div>

                                </div>


                                <div className="bdp-report-table-wrapper">

                                    <table className="bdp-report-table">

                                        <thead>

                                            <tr>

                                                <th>
                                                    Rank
                                                </th>

                                                <th>
                                                    Candidate
                                                </th>

                                                <th>
                                                    Assessments
                                                </th>

                                                <th>
                                                    Average Score
                                                </th>

                                                <th>
                                                    Highest
                                                </th>

                                                <th>
                                                    Lowest
                                                </th>

                                                <th>
                                                    Passed
                                                </th>

                                                <th>
                                                    Failed
                                                </th>

                                            </tr>

                                        </thead>


                                        <tbody>

                                            {batchReport.candidates.length ===
                                            0 ? (

                                                <tr>

                                                    <td
                                                        colSpan="8"
                                                        className="bdp-report-empty"
                                                    >
                                                        No candidate
                                                        performance
                                                        data available.
                                                    </td>

                                                </tr>

                                            ) : (

                                                batchReport.candidates.map(
                                                    (
                                                        candidate
                                                    ) => (

                                                        <tr
                                                            key={
                                                                candidate.user_id
                                                            }
                                                        >

                                                            <td>

                                                                <span className="bdp-rank-badge">
                                                                    #
                                                                    {
                                                                        candidate.rank
                                                                    }
                                                                </span>

                                                            </td>


                                                            <td>

                                                                <strong>
                                                                    {
                                                                        candidate.name
                                                                    }
                                                                </strong>

                                                            </td>


                                                            <td>
                                                                {
                                                                    candidate.assessment_count
                                                                }
                                                            </td>


                                                            <td>
                                                                {
                                                                    candidate.average_score
                                                                }%
                                                            </td>


                                                            <td>
                                                                {
                                                                    candidate.highest_score
                                                                }%
                                                            </td>


                                                            <td>
                                                                {
                                                                    candidate.lowest_score
                                                                }%
                                                            </td>


                                                            <td>

                                                                <span className="bdp-pass-count">
                                                                    {
                                                                        candidate.pass_count
                                                                    }
                                                                </span>

                                                            </td>


                                                            <td>

                                                                <span className="bdp-fail-count">
                                                                    {
                                                                        candidate.fail_count
                                                                    }
                                                                </span>

                                                            </td>

                                                        </tr>

                                                    )
                                                )

                                            )}

                                        </tbody>

                                    </table>

                                </div>

                            </div>


                            <div className="bdp-report-subsection">

                                <div className="bdp-report-subsection-header">

                                    <div>

                                        <h3>
                                            Assessment Performance
                                        </h3>

                                        <p>
                                            Assessment-wise
                                            performance across
                                            the batch.
                                        </p>

                                    </div>

                                </div>


                                <div className="bdp-report-table-wrapper">

                                    <table className="bdp-report-table">

                                        <thead>

                                            <tr>

                                                <th>
                                                    Assessment
                                                </th>

                                                <th>
                                                    Submissions
                                                </th>

                                                <th>
                                                    Average Score
                                                </th>

                                                <th>
                                                    Highest
                                                </th>

                                                <th>
                                                    Lowest
                                                </th>

                                                <th>
                                                    Passed
                                                </th>

                                                <th>
                                                    Failed
                                                </th>

                                                <th>
                                                    Pass Rate
                                                </th>

                                            </tr>

                                        </thead>


                                        <tbody>

                                            {batchReport.assessments.length ===
                                            0 ? (

                                                <tr>

                                                    <td
                                                        colSpan="8"
                                                        className="bdp-report-empty"
                                                    >
                                                        No assessment
                                                        performance
                                                        data available.
                                                    </td>

                                                </tr>

                                            ) : (

                                                batchReport.assessments.map(
                                                    (
                                                        assessment
                                                    ) => (

                                                        <tr
                                                            key={
                                                                assessment.exam_id
                                                            }
                                                        >

                                                            <td>

                                                                <strong>
                                                                    {
                                                                        assessment.title
                                                                    }
                                                                </strong>

                                                            </td>


                                                            <td>
                                                                {
                                                                    assessment.submission_count
                                                                }
                                                            </td>


                                                            <td>
                                                                {
                                                                    assessment.average_score
                                                                }%
                                                            </td>


                                                            <td>
                                                                {
                                                                    assessment.highest_score
                                                                }%
                                                            </td>


                                                            <td>
                                                                {
                                                                    assessment.lowest_score
                                                                }%
                                                            </td>


                                                            <td>

                                                                <span className="bdp-pass-count">
                                                                    {
                                                                        assessment.pass_count
                                                                    }
                                                                </span>

                                                            </td>


                                                            <td>

                                                                <span className="bdp-fail-count">
                                                                    {
                                                                        assessment.fail_count
                                                                    }
                                                                </span>

                                                            </td>


                                                            <td>
                                                                {
                                                                    assessment.pass_percentage
                                                                }%
                                                            </td>

                                                        </tr>

                                                    )
                                                )

                                            )}

                                        </tbody>

                                    </table>

                                </div>

                            </div>

                        </>

                    )}

                </section>

            </main>


            {showAssignModal && (

                <div className="bdp-modal-overlay">

                    <div className="bdp-modal">

                        <div className="bdp-modal-header">

                            <div>

                                <span className="bdp-modal-eyebrow">
                                    Candidate Management
                                </span>

                                <h2>
                                    Assign Candidates
                                </h2>

                                <p>
                                    Select candidates to
                                    add them to{" "}
                                    <strong>
                                        {batch.batch_name}
                                    </strong>
                                    .
                                </p>

                            </div>


                            <button
                                type="button"
                                className="bdp-modal-close"
                                onClick={() => {
                                    if (assigning) {
                                        return;
                                    }

                                    setShowAssignModal(
                                        false
                                    );

                                    setSelectedCandidates(
                                        []
                                    );
                                }}
                                disabled={assigning}
                            >
                                ×
                            </button>

                        </div>


                        <input
                            type="text"
                            className="bdp-candidate-search"
                            placeholder="🔍 Search candidates..."
                            value={searchAssign}
                            onChange={(event) =>
                                setSearchAssign(
                                    event.target.value
                                )
                            }
                            disabled={assigning}
                        />


                        <div className="bdp-selection-toolbar">

                            <span className="bdp-selected-count">
                                {selectedCandidates.length}{" "}
                                selected
                            </span>


                            <label className="bdp-select-all-control">

                                <input
                                    type="checkbox"
                                    checked={
                                        allAssignSelected
                                    }
                                    onChange={
                                        handleSelectAllAssign
                                    }
                                    disabled={assigning}
                                />

                                <span>
                                    Select All
                                </span>

                            </label>

                        </div>


                        <div className="bdp-candidate-list">

                            {availableCandidates.length ===
                            0 ? (

                                <p className="bdp-no-candidates">
                                    No unassigned
                                    candidates available.
                                </p>

                            ) : filteredAvailableCandidates.length ===
                              0 ? (

                                <p className="bdp-no-candidates">
                                    No candidates match
                                    your search.
                                </p>

                            ) : (

                                filteredAvailableCandidates.map(
                                    (
                                        candidate
                                    ) => (

                                        <label
                                            key={
                                                candidate.user_id
                                            }
                                            className={`bdp-candidate-item ${
                                                selectedCandidates.includes(
                                                    candidate.user_id
                                                )
                                                    ? "selected"
                                                    : ""
                                            }`}
                                        >

                                            <input
                                                type="checkbox"
                                                checked={selectedCandidates.includes(
                                                    candidate.user_id
                                                )}
                                                onChange={() =>
                                                    toggleCandidateSelection(
                                                        candidate.user_id
                                                    )
                                                }
                                                disabled={assigning}
                                            />


                                            <div className="bdp-candidate-modal-info">

                                                <strong>
                                                    {
                                                        candidate.name
                                                    }
                                                </strong>

                                                <span>
                                                    {
                                                        candidate.email
                                                    }
                                                </span>

                                            </div>

                                        </label>

                                    )
                                )

                            )}

                        </div>


                        <div className="bdp-modal-actions">

                            <button
                                type="button"
                                className="bdp-modal-cancel-btn"
                                onClick={() => {
                                    if (assigning) {
                                        return;
                                    }

                                    setShowAssignModal(
                                        false
                                    );

                                    setSelectedCandidates(
                                        []
                                    );
                                }}
                                disabled={assigning}
                            >
                                Cancel
                            </button>


                            <button
                                type="button"
                                className="bdp-modal-primary-btn"
                                onClick={
                                    handleAssignCandidate
                                }
                                disabled={
                                    selectedCandidates.length ===
                                        0 ||
                                    assigning
                                }
                            >
                                {assigning
                                    ? "Assigning..."
                                    : "Assign Selected"}
                            </button>

                        </div>

                    </div>

                </div>

            )}


            {showUnassignModal && (

                <div className="bdp-modal-overlay">

                    <div className="bdp-modal">

                        <div className="bdp-modal-header">

                            <div>

                                <span className="bdp-modal-eyebrow">
                                    Candidate Management
                                </span>

                                <h2>
                                    Unassign Candidates
                                </h2>

                                <p>
                                    Select candidates to
                                    remove from{" "}
                                    <strong>
                                        {batch.batch_name}
                                    </strong>
                                    .
                                </p>

                            </div>


                            <button
                                type="button"
                                className="bdp-modal-close"
                                onClick={() => {
                                    if (unassigning) {
                                        return;
                                    }

                                    setShowUnassignModal(
                                        false
                                    );

                                    setSelectedUnassignCandidates(
                                        []
                                    );
                                }}
                                disabled={unassigning}
                            >
                                ×
                            </button>

                        </div>


                        <input
                            type="text"
                            className="bdp-candidate-search"
                            placeholder="🔍 Search candidates..."
                            value={searchUnassign}
                            onChange={(event) =>
                                setSearchUnassign(
                                    event.target.value
                                )
                            }
                            disabled={unassigning}
                        />


                        <div className="bdp-selection-toolbar">

                            <span className="bdp-selected-count">
                                {
                                    selectedUnassignCandidates.length
                                }{" "}
                                selected
                            </span>


                            <label className="bdp-select-all-control">

                                <input
                                    type="checkbox"
                                    checked={
                                        allUnassignSelected
                                    }
                                    onChange={
                                        handleSelectAllUnassign
                                    }
                                    disabled={unassigning}
                                />

                                <span>
                                    Select All
                                </span>

                            </label>

                        </div>


                        <div className="bdp-candidate-list">

                            {candidates.length ===
                            0 ? (

                                <p className="bdp-no-candidates">
                                    No candidates assigned
                                    to this batch.
                                </p>

                            ) : filteredAssignedCandidates.length ===
                              0 ? (

                                <p className="bdp-no-candidates">
                                    No candidates match
                                    your search.
                                </p>

                            ) : (

                                filteredAssignedCandidates.map(
                                    (
                                        candidate
                                    ) => (

                                        <label
                                            key={
                                                candidate.user_id
                                            }
                                            className={`bdp-candidate-item ${
                                                selectedUnassignCandidates.includes(
                                                    candidate.user_id
                                                )
                                                    ? "selected"
                                                    : ""
                                            }`}
                                        >

                                            <input
                                                type="checkbox"
                                                checked={selectedUnassignCandidates.includes(
                                                    candidate.user_id
                                                )}
                                                onChange={() =>
                                                    toggleUnassignSelection(
                                                        candidate.user_id
                                                    )
                                                }
                                                disabled={unassigning}
                                            />


                                            <div className="bdp-candidate-modal-info">

                                                <strong>
                                                    {
                                                        candidate.name
                                                    }
                                                </strong>

                                                <span>
                                                    {
                                                        candidate.email
                                                    }
                                                </span>

                                            </div>

                                        </label>

                                    )
                                )

                            )}

                        </div>


                        <div className="bdp-modal-actions">

                            <button
                                type="button"
                                className="bdp-modal-cancel-btn"
                                onClick={() => {
                                    if (unassigning) {
                                        return;
                                    }

                                    setShowUnassignModal(
                                        false
                                    );

                                    setSelectedUnassignCandidates(
                                        []
                                    );
                                }}
                                disabled={unassigning}
                            >
                                Cancel
                            </button>


                            <button
                                type="button"
                                className="bdp-modal-danger-btn"
                                onClick={
                                    handleUnassignCandidates
                                }
                                disabled={
                                    selectedUnassignCandidates.length ===
                                        0 ||
                                    unassigning
                                }
                            >
                                {unassigning
                                    ? "Unassigning..."
                                    : "Unassign Selected"}
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}

export default BatchDetailsPage;