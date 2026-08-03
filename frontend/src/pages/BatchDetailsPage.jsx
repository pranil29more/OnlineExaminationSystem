import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API_BASE_URL from "../services/api";
import Navbar from "../components/Navbar";
import PageLoader from "../components/PageLoader";
import "../styles/BatchDetailsPage.css";

function BatchDetailsPage() {
    const [showAssignModal, setShowAssignModal] =
        useState(false);

    const [
        availableCandidates,
        setAvailableCandidates,
    ] = useState([]);

    const [
        selectedCandidates,
        setSelectedCandidates,
    ] = useState([]);

    const [
        showUnassignModal,
        setShowUnassignModal,
    ] = useState(false);

    const [
        selectedUnassignCandidates,
        setSelectedUnassignCandidates,
    ] = useState([]);

    const { batchId } = useParams();

    const navigate = useNavigate();

    const [batch, setBatch] = useState(null);

    const [candidates, setCandidates] =
        useState([]);

    const [searchAssign, setSearchAssign] =
        useState("");

    const [
        searchUnassign,
        setSearchUnassign,
    ] = useState("");

    const [
        searchCandidate,
        setSearchCandidate,
    ] = useState("");

    useEffect(() => {
        fetchBatchDetails();
    }, []);

    const fetchBatchDetails = async () => {
        try {
            const token =
                localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/batch-details/${batchId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data =
                await response.json();

            setBatch(data.batch);
            setCandidates(data.candidates);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchAvailableCandidates =
        async () => {
            try {
                const token =
                    localStorage.getItem(
                        "token"
                    );

                const response =
                    await fetch(
                        `${API_BASE_URL}/available-candidates`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    );

                const data =
                    await response.json();

                setAvailableCandidates(data);

                setShowAssignModal(true);
            } catch (error) {
                console.error(error);
            }
        };

    const fetchAssignedCandidates = () => {
        setSelectedUnassignCandidates([]);

        setShowUnassignModal(true);
    };

    const toggleCandidateSelection = (
        userId
    ) => {
        setSelectedCandidates((prev) => {
            if (prev.includes(userId)) {
                return prev.filter(
                    (id) => id !== userId
                );
            }

            return [...prev, userId];
        });
    };

    const handleSelectAllAssign = () => {
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

    const toggleUnassignSelection = (
        userId
    ) => {
        setSelectedUnassignCandidates(
            (prev) => {
                if (prev.includes(userId)) {
                    return prev.filter(
                        (id) => id !== userId
                    );
                }

                return [...prev, userId];
            }
        );
    };

    const handleAssignCandidate =
        async () => {
            if (
                selectedCandidates.length ===
                0
            ) {
                alert(
                    "Please select at least one candidate."
                );

                return;
            }

            try {
                const token =
                    localStorage.getItem(
                        "token"
                    );

                const response =
                    await fetch(
                        `${API_BASE_URL}/assign-candidate`,
                        {
                            method: "PUT",
                            headers: {
                                "Content-Type":
                                    "application/json",
                                Authorization: `Bearer ${token}`,
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

                if (response.ok) {
                    alert(data.message);

                    setShowAssignModal(false);

                    setSelectedCandidates(
                        []
                    );

                    setAvailableCandidates(
                        []
                    );

                    fetchBatchDetails();
                } else {
                    alert(data.message);
                }
            } catch (error) {
                console.error(error);
            }
        };
        const handleUnassignCandidates = async () => {
        if (
            selectedUnassignCandidates.length ===
            0
        ) {
            alert(
                "Please select at least one candidate."
            );

            return;
        }

        try {
            const token =
                localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/unassign-candidate`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type":
                            "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        user_ids:
                            selectedUnassignCandidates,
                    }),
                }
            );

            const data =
                await response.json();

            if (response.ok) {
                alert(data.message);

                setShowUnassignModal(false);

                setSelectedUnassignCandidates(
                    []
                );

                fetchBatchDetails();
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error(error);
        }
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
                <PageLoader message="Loading Batch Details..." />
            </div>
        );
    }

    return (
        <div>
            <Navbar />

            <div className="batch-details-container">
                <h1 className="batch-details-title">
                    Batch Details
                </h1>

                <div className="batch-details-card">
                    <h2 className="batch-details-name">
                        {batch.batch_name}
                    </h2>

                    <div className="batch-details-grid">
                        <div>
                            <h4>Technology</h4>
                            <p>{batch.technology}</p>
                        </div>

                        <div>
                            <h4>Trainer</h4>
                            <p>{batch.trainer_name}</p>
                        </div>

                        <div>
                            <h4>Status</h4>
                            <p>{batch.status}</p>
                        </div>

                        <div>
                            <h4>Candidates</h4>
                            <p>{candidates.length}</p>
                        </div>

                        <div>
                            <h4>Start Date</h4>
                            <p>{batch.start_date}</p>
                        </div>

                        <div>
                            <h4>End Date</h4>
                            <p>{batch.end_date}</p>
                        </div>
                    </div>

                    <div className="batch-details-description">
                        <h4>Description</h4>
                        <p>{batch.description}</p>
                    </div>
                </div>

                <div className="batch-details-candidates">
                    <div className="batch-details-header">
                        <h2 className="batch-details-section-title">
                            Candidates
                        </h2>

                        <div className="batch-action-buttons">
                            <button
                                className="assign-btn"
                                onClick={fetchAvailableCandidates}
                            >
                                + Assign Candidate
                            </button>

                            <button
                                className="unassign-btn"
                                onClick={fetchAssignedCandidates}
                            >
                                - Unassign Candidate
                            </button>
                        </div>
                    </div>

                    <div className="batch-search-wrapper">
                        <input
                            type="text"
                            className="batch-search"
                            placeholder="🔍 Search candidate..."
                            value={searchCandidate}
                            onChange={(e) =>
                                setSearchCandidate(
                                    e.target.value
                                )
                            }
                        />
                    </div>

                    <table className="batch-details-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Assessment Count</th>
                                <th>Average Score</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredCandidates.length ===
                            0 ? (
                                <tr>
                                    <td
                                        colSpan="5"
                                        className="batch-details-empty"
                                    >
                                        No candidates assigned
                                        to this batch.
                                    </td>
                                </tr>
                            ) : (
                                filteredCandidates.map(
                                    (candidate) => (
                                        <tr
                                            key={
                                                candidate.user_id
                                            }
                                        >
                                            <td>
                                                {
                                                    candidate.name
                                                }
                                            </td>

                                            <td>
                                                {
                                                    candidate.email
                                                }
                                            </td>

                                            <td>
                                                {
                                                    candidate.assessment_count
                                                }
                                            </td>

                                            <td>
                                                {candidate.average_score !==
                                                null
                                                    ? `${candidate.average_score}%`
                                                    : "--"}
                                            </td>

                                            <td>
                                                <button
                                                    className="batch-details-btn"
                                                    onClick={() =>
                                                        navigate(
                                                            `/candidate-results/${candidate.user_id}`
                                                        )
                                                    }
                                                >
                                                    View
                                                    Results
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showAssignModal && (
                <div className="assign-modal-overlay">
                    <div className="assign-modal">
                        <h2>
                            Assign Candidates
                        </h2>

                        <input
                            type="text"
                            className="candidate-search"
                            placeholder="Search candidates..."
                            value={searchAssign}
                            onChange={(e) =>
                                setSearchAssign(
                                    e.target.value
                                )
                            }
                        />

                        <p className="selected-count">
                            Selected:{" "}
                            {selectedCandidates.length}
                        </p>

                        <div className="select-all-row">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={
                                        allAssignSelected
                                    }
                                    onChange={
                                        handleSelectAllAssign
                                    }
                                />{" "}
                                Select All
                            </label>
                        </div>

                        <div className="candidate-list">
                            {availableCandidates.length ===
                            0 ? (
                                <p className="no-candidates">
                                    No unassigned
                                    candidates
                                    available.
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
                                            className="candidate-item"
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
                                            />

                                            <div>
                                                <strong>
                                                    {
                                                        candidate.name
                                                    }
                                                </strong>

                                                <br />

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

                        <div className="assign-modal-actions">
                            <button
                                className="batch-details-btn"
                                onClick={
                                    handleAssignCandidate
                                }
                            >
                                Assign Selected
                            </button>

                            <button
                                className="cancel-btn"
                                onClick={() => {
                                    setShowAssignModal(
                                        false
                                    );

                                    setSelectedCandidates(
                                        []
                                    );
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showUnassignModal && (
                <div className="assign-modal-overlay">
                    <div className="assign-modal">
                        <h2>
                            Unassign Candidates
                        </h2>

                        <input
                            type="text"
                            className="candidate-search"
                            placeholder="Search candidates..."
                            value={searchUnassign}
                            onChange={(e) =>
                                setSearchUnassign(
                                    e.target.value
                                )
                            }
                        />

                        <p className="selected-count">
                            Selected:{" "}
                            {
                                selectedUnassignCandidates.length
                            }
                        </p>

                        <div className="select-all-row">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={
                                        allUnassignSelected
                                    }
                                    onChange={
                                        handleSelectAllUnassign
                                    }
                                />{" "}
                                Select All
                            </label>
                        </div>

                        <div className="candidate-list">
                            {candidates.length ===
                            0 ? (
                                <p className="no-candidates">
                                    No candidates
                                    assigned to this
                                    batch.
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
                                            className="candidate-item"
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
                                            />

                                            <div>
                                                <strong>
                                                    {
                                                        candidate.name
                                                    }
                                                </strong>

                                                <br />

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

                        <div className="assign-modal-actions">
                            <button
                                className="unassign-btn"
                                onClick={
                                    handleUnassignCandidates
                                }
                            >
                                Unassign Selected
                            </button>

                            <button
                                className="cancel-btn"
                                onClick={() => {
                                    setShowUnassignModal(
                                        false
                                    );

                                    setSelectedUnassignCandidates(
                                        []
                                    );
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default BatchDetailsPage;
