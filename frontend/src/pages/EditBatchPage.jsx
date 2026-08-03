import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API_BASE_URL from "../services/api";
import Navbar from "../components/Navbar";
import "../styles/CreateBatchPage.css";

function EditBatchPage() {
    const { batchId } = useParams();

    const navigate = useNavigate();

    const [batchName, setBatchName] = useState("");
    const [technology, setTechnology] = useState("");
    const [trainerName, setTrainerName] = useState("");
    const [description, setDescription] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [status, setStatus] = useState("");

    useEffect(() => {
        fetchBatch();
    }, []);

    const fetchBatch = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/batch/${batchId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            setBatchName(data.batch_name);
            setTechnology(data.technology);
            setTrainerName(data.trainer_name);
            setDescription(data.description);
            setStartDate(data.start_date);
            setEndDate(data.end_date);
            setStatus(data.status);
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpdateBatch = async (e) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/update-batch/${batchId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type":
                            "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        batch_name: batchName,
                        technology,
                        trainer_name: trainerName,
                        description,
                        start_date: startDate,
                        end_date: endDate,
                        status,
                    }),
                }
            );

            const data = await response.json();

            if (response.ok) {
                alert("Batch updated successfully!");
                navigate("/batch-management");
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div>
            <Navbar />

            <div className="page-container">
                <h1 className="page-title">
                    Edit Batch
                </h1>

                <form
                    className="batch-form"
                    onSubmit={handleUpdateBatch}
                >
                    <label>
                        Batch Name
                    </label>

                    <input
                        type="text"
                        value={batchName}
                        onChange={(e) =>
                            setBatchName(e.target.value)
                        }
                        required
                    />

                    <label>
                        Technology
                    </label>

                    <input
                        type="text"
                        value={technology}
                        onChange={(e) =>
                            setTechnology(
                                e.target.value
                            )
                        }
                        required
                    />

                    <label>
                        Trainer Name
                    </label>

                    <input
                        type="text"
                        value={trainerName}
                        onChange={(e) =>
                            setTrainerName(
                                e.target.value
                            )
                        }
                        required
                    />

                    <label>
                        Description
                    </label>

                    <textarea
                        rows="5"
                        value={description}
                        onChange={(e) =>
                            setDescription(
                                e.target.value
                            )
                        }
                        required
                    />

                    <div className="date-row">
                        <div className="date-field">
                            <label>
                                Start Date
                            </label>

                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) =>
                                    setStartDate(
                                        e.target.value
                                    )
                                }
                                required
                            />
                        </div>

                        <div className="date-field">
                            <label>
                                End Date
                            </label>

                            <input
                                type="date"
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

                    <label>
                        Status
                    </label>

                    <select
                        value={status}
                        onChange={(e) =>
                            setStatus(e.target.value)
                        }
                    >
                        <option>
                            Upcoming
                        </option>
                        <option>
                            Active
                        </option>
                        <option>
                            Completed
                        </option>
                    </select>

                    <button
                        type="submit"
                        className="create-btn"
                    >
                        Update Batch
                    </button>
                </form>
            </div>
        </div>
    );
}

export default EditBatchPage;
