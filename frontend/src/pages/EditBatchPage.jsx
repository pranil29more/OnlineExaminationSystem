import { useEffect, useState } from "react";
import {
    useNavigate,
    useParams,
} from "react-router-dom";
import API_BASE_URL from "../services/api";
import Navbar from "../components/Navbar";
import "../styles/EditBatchPage.css";

function EditBatchPage() {
    const { batchId } = useParams();

    const navigate = useNavigate();

    const [batchName, setBatchName] =
        useState("");

    const [technology, setTechnology] =
        useState("");

    const [trainerName, setTrainerName] =
        useState("");

    const [description, setDescription] =
        useState("");

    const [startDate, setStartDate] =
        useState("");

    const [endDate, setEndDate] =
        useState("");

    const [batchUpdating, setBatchUpdating] =
        useState(false);

    // =========================================================
    // Fetch Batch
    // =========================================================

    useEffect(() => {
        fetchBatch();
    }, []);

    const fetchBatch = async () => {
        try {
            const token =
                localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/batch/${batchId}`,
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
                        "Unable to load batch."
                );

                return;
            }

            setBatchName(
                data.batch_name || ""
            );

            setTechnology(
                data.technology || ""
            );

            setTrainerName(
                data.trainer_name || ""
            );

            setDescription(
                data.description || ""
            );

            setStartDate(
                data.start_date || ""
            );

            setEndDate(
                data.end_date || ""
            );
        } catch (error) {
            console.error(error);
        }
    };

    // =========================================================
    // Update Batch
    // =========================================================

    const handleUpdateBatch = async (e) => {
        e.preventDefault();

        if (batchUpdating) {
            return;
        }

        if (endDate < startDate) {
            alert(
                "End date cannot be before the start date."
            );

            return;
        }

        try {
            setBatchUpdating(true);

            const token =
                localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/update-batch/${batchId}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        batch_name:
                            batchName,

                        technology,

                        trainer_name:
                            trainerName,

                        description,

                        start_date:
                            startDate,

                        end_date:
                            endDate,
                    }),
                }
            );

            const data =
                await response.json();

            if (response.ok) {
                alert(
                    "Batch updated successfully!"
                );

                navigate(
                    "/batch-management"
                );
            } else {
                alert(
                    data.message ||
                        "Unable to update batch."
                );
            }
        } catch (error) {
            console.error(error);

            alert(
                "Unable to update batch."
            );
        } finally {
            setBatchUpdating(false);
        }
    };

    return (
        <div className="ebp-page">
            <Navbar />

            <main className="ebp-container">
                <header className="ebp-header">
                    <span className="ebp-eyebrow">
                        BATCH MANAGEMENT
                    </span>

                    <h1 className="ebp-title">
                        Edit Batch
                    </h1>

                    <p className="ebp-description">
                        Update the batch details,
                        trainer information, technology,
                        and training schedule.
                    </p>
                </header>

                <form
                    className="ebp-form-card"
                    onSubmit={handleUpdateBatch}
                >
                    <div className="ebp-form-section">
                        <div className="ebp-section-heading">
                            <span className="ebp-section-eyebrow">
                                BATCH CONFIGURATION
                            </span>

                            <h2 className="ebp-section-title">
                                Batch Information
                            </h2>

                            <p className="ebp-section-description">
                                Modify the details
                                configured for this
                                training batch.
                            </p>
                        </div>

                        {/* =================================================
                            Batch Name
                        ================================================= */}

                        <div className="ebp-field">
                            <label
                                className="ebp-field-label"
                                htmlFor="edit-batch-name"
                            >
                                Batch Name
                            </label>

                            <input
                                id="edit-batch-name"
                                className="ebp-form-input"
                                type="text"
                                placeholder="Enter batch name"
                                value={batchName}
                                onChange={(e) =>
                                    setBatchName(
                                        e.target.value
                                    )
                                }
                                disabled={
                                    batchUpdating
                                }
                                required
                            />
                        </div>

                        {/* =================================================
                            Technology
                        ================================================= */}

                        <div className="ebp-field">
                            <label
                                className="ebp-field-label"
                                htmlFor="edit-technology"
                            >
                                Technology
                            </label>

                            <input
                                id="edit-technology"
                                className="ebp-form-input"
                                type="text"
                                placeholder="Enter technology"
                                value={technology}
                                onChange={(e) =>
                                    setTechnology(
                                        e.target.value
                                    )
                                }
                                disabled={
                                    batchUpdating
                                }
                                required
                            />
                        </div>

                        {/* =================================================
                            Trainer Name
                        ================================================= */}

                        <div className="ebp-field">
                            <label
                                className="ebp-field-label"
                                htmlFor="edit-trainer-name"
                            >
                                Trainer Name
                            </label>

                            <input
                                id="edit-trainer-name"
                                className="ebp-form-input"
                                type="text"
                                placeholder="Enter trainer name"
                                value={trainerName}
                                onChange={(e) =>
                                    setTrainerName(
                                        e.target.value
                                    )
                                }
                                disabled={
                                    batchUpdating
                                }
                                required
                            />
                        </div>

                        {/* =================================================
                            Description
                        ================================================= */}

                        <div className="ebp-field">
                            <label
                                className="ebp-field-label"
                                htmlFor="edit-description"
                            >
                                Description
                            </label>

                            <textarea
                                id="edit-description"
                                className="ebp-form-textarea"
                                rows="5"
                                placeholder="Enter batch description"
                                value={description}
                                onChange={(e) =>
                                    setDescription(
                                        e.target.value
                                    )
                                }
                                disabled={
                                    batchUpdating
                                }
                                required
                            />
                        </div>

                        {/* =================================================
                            Training Schedule
                        ================================================= */}

                        <div className="ebp-date-heading">
                            Training Schedule
                        </div>

                        <div className="ebp-date-grid">
                            <div className="ebp-field">
                                <label
                                    className="ebp-field-label"
                                    htmlFor="edit-start-date"
                                >
                                    Start Date
                                </label>

                                <input
                                    id="edit-start-date"
                                    className="ebp-form-input"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => {
                                        const newStartDate =
                                            e.target.value;

                                        setStartDate(
                                            newStartDate
                                        );

                                        if (
                                            endDate &&
                                            newStartDate >
                                                endDate
                                        ) {
                                            setEndDate("");
                                        }
                                    }}
                                    disabled={
                                        batchUpdating
                                    }
                                    required
                                />
                            </div>

                            <div className="ebp-field">
                                <label
                                    className="ebp-field-label"
                                    htmlFor="edit-end-date"
                                >
                                    End Date
                                </label>

                                <input
                                    id="edit-end-date"
                                    className="ebp-form-input"
                                    type="date"
                                    min={
                                        startDate ||
                                        undefined
                                    }
                                    value={endDate}
                                    onChange={(e) =>
                                        setEndDate(
                                            e.target.value
                                        )
                                    }
                                    disabled={
                                        batchUpdating
                                    }
                                    required
                                />
                            </div>
                        </div>

                        {/* =================================================
                            Update Button
                        ================================================= */}

                        <button
                            type="submit"
                            className="ebp-update-btn"
                            disabled={
                                batchUpdating
                            }
                        >
                            {batchUpdating
                                ? "Updating Batch..."
                                : "Update Batch"}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}

export default EditBatchPage;