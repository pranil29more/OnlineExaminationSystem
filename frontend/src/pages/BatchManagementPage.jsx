import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../services/api";
import Navbar from "../components/Navbar";
import PageLoader from "../components/PageLoader";
import "../styles/BatchManagementPage.css";

function BatchManagementPage() {
    const navigate = useNavigate();

    const [batches, setBatches] = useState([]);

    const [loading, setLoading] = useState(true);

    const [activeAction, setActiveAction] =
        useState(null);

    useEffect(() => {
        fetchBatches();
    }, []);

    const fetchBatches = async () => {
        try {
            setLoading(true);

            const token =
                localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/batches`,
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
                        "Unable to load batches."
                );

                return;
            }

            setBatches(data || []);
        } catch (error) {
            console.error(error);

            alert(
                "Unable to load batches."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBatch = () => {
        navigate("/create-batch");
    };

    const handleViewDetails = (
        batchId
    ) => {
        navigate(
            `/batch-details/${batchId}`
        );
    };

    const handleEditBatch = (
        batchId
    ) => {
        navigate(
            `/edit-batch/${batchId}`
        );
    };

    const handleDeleteBatch = async (
        batchId
    ) => {
        const confirmDelete =
            window.confirm(
                "Are you sure you want to delete this batch?"
            );

        if (!confirmDelete) {
            return;
        }

        try {
            setActiveAction({
                type: "delete",
                id: batchId,
            });

            const token =
                localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/delete-batch/${batchId}`,
                {
                    method: "DELETE",

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
                        "Unable to delete batch."
                );

                return;
            }

            alert(
                "Batch deleted successfully."
            );

            await fetchBatches();
        } catch (error) {
            console.error(error);

            alert(
                "Unable to delete batch."
            );
        } finally {
            setActiveAction(null);
        }
    };

    const isActionActive = (
        type,
        batchId = null
    ) => {
        if (!activeAction) {
            return false;
        }

        if (
            activeAction.type !== type
        ) {
            return false;
        }

        if (batchId === null) {
            return true;
        }

        return (
            activeAction.id === batchId
        );
    };

    if (loading) {
        return (
            <div>
                <Navbar />

                <PageLoader
                    message="Loading Batches..."
                />
            </div>
        );
    }

    return (
        <div className="bmp-page">
            <Navbar />

            <main className="bmp-container">
                {/* ==========================================
                    Page Header
                ========================================== */}

                <div className="bmp-header">
                    <div>
                        <span className="bmp-eyebrow">
                            TRAINING CONTROL
                        </span>

                        <h1 className="bmp-title">
                            Batch Management
                        </h1>

                        <p className="bmp-description">
                            Create, manage, and monitor
                            training batches and their
                            assigned candidates.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="bmp-create-btn"
                        onClick={
                            handleCreateBatch
                        }
                    >
                        + Create Batch
                    </button>
                </div>

                {/* ==========================================
                    Batch Grid
                ========================================== */}

                {batches.length === 0 ? (
                    <div className="bmp-empty-state">
                        <div className="bmp-empty-icon">
                            +
                        </div>

                        <h2>
                            No Training Batches
                        </h2>

                        <p>
                            There are currently no
                            training batches available.
                            Create your first batch to
                            get started.
                        </p>

                        <button
                            type="button"
                            className="bmp-empty-create-btn"
                            onClick={
                                handleCreateBatch
                            }
                        >
                            + Create Batch
                        </button>
                    </div>
                ) : (
                    <div className="bmp-grid">
                        {batches.map(
                            (batch) => (
                                <article
                                    key={
                                        batch.batch_id
                                    }
                                    className="bmp-card"
                                >
                                    {/* ==================================
                                        Card Header
                                    ================================== */}

                                    <div className="bmp-card-header">
                                        <div className="bmp-card-heading">
                                            <span className="bmp-card-label">
                                                Batch
                                            </span>

                                            <h2 className="bmp-card-name">
                                                {
                                                    batch.batch_name
                                                }
                                            </h2>
                                        </div>

                                        <span
                                            className={`bmp-status-badge bmp-status-${batch.status
                                                .toLowerCase()
                                                .replace(
                                                    /\s+/g,
                                                    "-"
                                                )}`}
                                        >
                                            {
                                                batch.status
                                            }
                                        </span>
                                    </div>

                                    {/* ==================================
                                        Description
                                    ================================== */}

                                    <p className="bmp-card-description">
                                        {
                                            batch.description ||
                                            "No description provided for this batch."
                                        }
                                    </p>

                                    {/* ==================================
                                        Batch Information
                                    ================================== */}

                                    <div className="bmp-info-grid">
                                        <div className="bmp-info-item">
                                            <span>
                                                Technology
                                            </span>

                                            <strong>
                                                {
                                                    batch.technology
                                                }
                                            </strong>
                                        </div>

                                        <div className="bmp-info-item">
                                            <span>
                                                Trainer
                                            </span>

                                            <strong>
                                                {
                                                    batch.trainer_name
                                                }
                                            </strong>
                                        </div>

                                        <div className="bmp-info-item">
                                            <span>
                                                Candidates
                                            </span>

                                            <strong>
                                                {
                                                    batch.candidate_count
                                                }
                                            </strong>
                                        </div>

                                        <div className="bmp-info-item">
                                            <span>
                                                Assignments
                                            </span>

                                            <strong>
                                                {
                                                    batch.assignment_count
                                                }
                                            </strong>
                                        </div>

                                        <div className="bmp-info-item bmp-info-item-wide">
                                            <span>
                                                Duration
                                            </span>

                                            <strong>
                                                {
                                                    batch.start_date
                                                }
                                                {" — "}
                                                {
                                                    batch.end_date
                                                }
                                            </strong>
                                        </div>
                                    </div>

                                    {/* ==================================
                                        Actions
                                    ================================== */}

                                    <div className="bmp-actions">
                                        <button
                                            type="button"
                                            className="bmp-details-btn"
                                            onClick={() =>
                                                handleViewDetails(
                                                    batch.batch_id
                                                )
                                            }
                                        >
                                            View Details
                                        </button>

                                        <button
                                            type="button"
                                            className="bmp-edit-btn"
                                            onClick={() =>
                                                handleEditBatch(
                                                    batch.batch_id
                                                )
                                            }
                                        >
                                            Edit
                                        </button>

                                        <button
                                            type="button"
                                            className="bmp-delete-btn"
                                            onClick={() =>
                                                handleDeleteBatch(
                                                    batch.batch_id
                                                )
                                            }
                                            disabled={
                                                isActionActive(
                                                    "delete",
                                                    batch.batch_id
                                                )
                                            }
                                        >
                                            {isActionActive(
                                                "delete",
                                                batch.batch_id
                                            )
                                                ? "Deleting..."
                                                : "Delete"}
                                        </button>
                                    </div>
                                </article>
                            )
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

export default BatchManagementPage;