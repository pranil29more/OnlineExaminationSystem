import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import API_BASE_URL from "../services/api";
import Navbar from "../components/Navbar";

import "../styles/BatchManagementPage.css";

function BatchManagementPage() {

  const navigate = useNavigate();

  const [batches, setBatches] = useState([]);

  useEffect(() => {

    fetchBatches();

  }, []);

  const fetchBatches = async () => {

    try {

      const token = localStorage.getItem("token");

      const response = await fetch(

        `${API_BASE_URL}/batches`,

        {

          headers: {

            Authorization: `Bearer ${token}`

          }

        }

      );

      const data = await response.json();

      setBatches(data);

    } catch (error) {

      console.error(error);

    }

  };

  const handleDeleteBatch = async (batchId) => {

    const confirmDelete = window.confirm(

      "Are you sure you want to delete this batch?"

    );

    if (!confirmDelete) {

      return;

    }

    try {

      const token = localStorage.getItem("token");

      const response = await fetch(

        `${API_BASE_URL}/delete-batch/${batchId}`,

        {

          method: "DELETE",

          headers: {

            Authorization: `Bearer ${token}`

          }

        }

      );

      const data = await response.json();

      if (response.ok) {

        alert("Batch deleted successfully.");

        fetchBatches();

      }

      else {

        alert(data.message);

      }

    }

    catch (error) {

      console.error(error);

    }

  };

  return (

    <div>

        <Navbar />

        <div className="batch-management-container">

            <div className="batch-management-header">

                <h1 className="batch-management-title">

                    Batch Management

                </h1>

                <button

                    className="create-btn"

                    onClick={() =>
                        navigate("/create-batch")
                    }

                >

                    + Create Batch

                </button>

            </div>

            <div className="batch-management-grid">
              
              {

                    batches.map((batch) => (

                        <div

                            key={batch.batch_id}

                            className="batch-management-card"

                        >

                            <h2 className="batch-management-name">

                                {batch.batch_name}

                            </h2>

                            <p className="batch-management-description">

                                {batch.description}

                            </p>

                            <p className="batch-management-info">

                                <strong>Technology:</strong>{" "}

                                {batch.technology}

                            </p>

                            <p className="batch-management-info">

                                <strong>Trainer:</strong>{" "}

                                {batch.trainer_name}

                            </p>

                            <p className="batch-management-info">

                                <strong>Candidates:</strong>{" "}

                                {batch.candidate_count}

                            </p>

                            <p className="batch-management-info">

                                <strong>Duration:</strong>{" "}

                                {batch.start_date}

                                {" - "}

                                {batch.end_date}

                            </p>

                            <p className="batch-management-info">

                                <strong>Status:</strong>

                                <span
                                    className={`status-badge status-${batch.status.toLowerCase()}`}
                                >

                                    {batch.status}

                                </span>

                            </p>

                            <div className="batch-management-actions">

                                <button

                                    className="details-btn"

                                    onClick={() =>
                                        navigate(
                                            `/batch-details/${batch.batch_id}`
                                        )
                                    }

                                >

                                    View Details

                                </button>

                                <button

                                    className="edit-btn"

                                    onClick={() =>
                                        navigate(
                                            `/edit-batch/${batch.batch_id}`
                                        )
                                    }

                                >

                                    Edit

                                </button>

                                <button

                                    className="delete-btn"

                                    onClick={() =>
                                        handleDeleteBatch(
                                            batch.batch_id
                                        )
                                    }

                                >

                                    Delete

                                </button>

                            </div>

                        </div>

                    ))

                }

            </div>

        </div>

    </div>

);

}

export default BatchManagementPage;