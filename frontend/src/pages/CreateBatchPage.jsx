import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../services/api";
import Navbar from "../components/Navbar";
import "../styles/CreateBatchPage.css";

function CreateBatchPage() {
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

    const [batchCreating, setBatchCreating] =
        useState(false);

    // =========================================================
    // Create Batch
    // =========================================================

    const handleCreateBatch = async (e) => {
        e.preventDefault();

        if (batchCreating) {
            return;
        }

        if (endDate < startDate) {
            alert(
                "End date cannot be before the start date."
            );

            return;
        }

        try {
            setBatchCreating(true);

            const token =
                localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/create-batch`,
                {
                    method: "POST",

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
                    "Batch created successfully!"
                );

                navigate(
                    "/batch-management"
                );
            } else {
                alert(
                    data.message ||
                        "Unable to create batch."
                );
            }
        } catch (error) {
            console.error(error);

            alert(
                "Unable to create batch."
            );
        } finally {
            setBatchCreating(false);
        }
    };

    return (
        <div className="cbp-page">
            <Navbar />

            <main className="cbp-container">
                <header className="cbp-header">
                    <span className="cbp-eyebrow">
                        CONFIGURATION
                    </span>

                    <h1 className="cbp-title">
                        Create Batch
                    </h1>

                    <p className="cbp-description">
                        Configure the batch details,
                        trainer information, technology,
                        and training schedule.
                    </p>
                </header>

                <form
                    className="cbp-form-card"
                    onSubmit={
                        handleCreateBatch
                    }
                >
                    <div className="cbp-form-section">
                        <div className="cbp-section-heading">
                            <span className="cbp-section-eyebrow">
                                BATCH SETUP
                            </span>

                            <h2 className="cbp-section-title">
                                Batch Information
                            </h2>

                            <p className="cbp-section-description">
                                Enter the basic details
                                required to create the
                                training batch.
                            </p>
                        </div>

                        {/* =================================================
                            Batch Name
                        ================================================= */}

                        <div className="cbp-field">
                            <label
                                className="cbp-field-label"
                                htmlFor="batch-name"
                            >
                                Batch Name
                            </label>

                            <input
                                id="batch-name"
                                className="cbp-form-input"
                                type="text"
                                placeholder="Enter batch name"
                                value={batchName}
                                onChange={(e) =>
                                    setBatchName(
                                        e.target.value
                                    )
                                }
                                required
                            />
                        </div>

                        {/* =================================================
                            Technology
                        ================================================= */}

                        <div className="cbp-field">
                            <label
                                className="cbp-field-label"
                                htmlFor="technology"
                            >
                                Technology
                            </label>

                            <input
                                id="technology"
                                className="cbp-form-input"
                                type="text"
                                placeholder="Enter technology"
                                value={technology}
                                onChange={(e) =>
                                    setTechnology(
                                        e.target.value
                                    )
                                }
                                required
                            />
                        </div>

                        {/* =================================================
                            Trainer Name
                        ================================================= */}

                        <div className="cbp-field">
                            <label
                                className="cbp-field-label"
                                htmlFor="trainer-name"
                            >
                                Trainer Name
                            </label>

                            <input
                                id="trainer-name"
                                className="cbp-form-input"
                                type="text"
                                placeholder="Enter trainer name"
                                value={trainerName}
                                onChange={(e) =>
                                    setTrainerName(
                                        e.target.value
                                    )
                                }
                                required
                            />
                        </div>

                        {/* =================================================
                            Description
                        ================================================= */}

                        <div className="cbp-field">
                            <label
                                className="cbp-field-label"
                                htmlFor="description"
                            >
                                Description
                            </label>

                            <textarea
                                id="description"
                                className="cbp-form-textarea"
                                rows="5"
                                placeholder="Enter batch description"
                                value={description}
                                onChange={(e) =>
                                    setDescription(
                                        e.target.value
                                    )
                                }
                                required
                            />
                        </div>

                        {/* =================================================
                            Training Schedule
                        ================================================= */}

                        <div className="cbp-date-heading">
                            Training Schedule
                        </div>

                        <div className="cbp-date-grid">
                            <div className="cbp-field">
                                <label
                                    className="cbp-field-label"
                                    htmlFor="start-date"
                                >
                                    Start Date
                                </label>

                                <input
                                    id="start-date"
                                    className="cbp-form-input"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => {
                                        setStartDate(
                                            e.target.value
                                        );

                                        if (
                                            endDate &&
                                            e.target.value >
                                                endDate
                                        ) {
                                            setEndDate("");
                                        }
                                    }}
                                    required
                                />
                            </div>

                            <div className="cbp-field">
                                <label
                                    className="cbp-field-label"
                                    htmlFor="end-date"
                                >
                                    End Date
                                </label>

                                <input
                                    id="end-date"
                                    className="cbp-form-input"
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
                                    required
                                />
                            </div>
                        </div>

                        {/* =================================================
                            Create Batch Button
                        ================================================= */}

                        <button
                            type="submit"
                            className="cbp-create-btn"
                            disabled={
                                batchCreating
                            }
                        >
                            {batchCreating
                                ? "Creating Batch..."
                                : "Create Batch"}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}

export default CreateBatchPage;