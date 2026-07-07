import { useState } from "react";

import { useNavigate } from "react-router-dom";

import API_BASE_URL from "../services/api";
import Navbar from "../components/Navbar";

import "../styles/CreateBatchPage.css";

function CreateBatchPage() {

  const navigate = useNavigate();

  const [batchName, setBatchName] = useState("");

  const [technology, setTechnology] = useState("");

  const [trainerName, setTrainerName] = useState("");

  const [description, setDescription] = useState("");

  const [startDate, setStartDate] = useState("");

  const [endDate, setEndDate] = useState("");

  const [status, setStatus] = useState("Upcoming");

  const handleCreateBatch = async (e) => {

    e.preventDefault();

    try {

      const token = localStorage.getItem("token");

      const response = await fetch(

        `${API_BASE_URL}/create-batch`,

        {

          method: "POST",

          headers: {

            "Content-Type": "application/json",

            Authorization: `Bearer ${token}`

          },

          body: JSON.stringify({

            batch_name: batchName,

            technology: technology,

            trainer_name: trainerName,

            description: description,

            start_date: startDate,

            end_date: endDate,

            status: status

          })

        }

      );

      const data = await response.json();

      if (response.ok) {

        alert("Batch created successfully!");

        navigate("/batch-management");

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

      <div className="page-container">

        <h1 className="page-title">

          Create Batch

        </h1>

        <form

          className="batch-form"

          onSubmit={handleCreateBatch}

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

              setTechnology(e.target.value)

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

              setTrainerName(e.target.value)

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

              setDescription(e.target.value)

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
        setStartDate(e.target.value)
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
        setEndDate(e.target.value)
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

            Create Batch

          </button>

        </form>

      </div>

    </div>

  );

}

export default CreateBatchPage;