import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import API_BASE_URL from "../services/api";

import Navbar from "../components/Navbar";

import "../styles/ExamsPage.css";

function ExamsPage() {

  const [exams, setExams] = useState([]);
  const [role, setRole] = useState("");

  const [selectedExam, setSelectedExam] =
  useState(null);

  const [showModal, setShowModal] =
  useState(false);

  const [modalMode, setModalMode] =
  useState("start");

  const navigate = useNavigate();

  useEffect(() => {

    fetchExams();
    fetchProfile();

  }, []);

  const fetchProfile = async () => {

    try {

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      setRole(data.role);

    } catch (error) {

      console.error(error);

    }

  };

  const fetchExams = async () => {

    try {

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/exams`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      setExams(data);

    } catch (error) {

      console.error(error);

    }

  };

  const handleDeleteExam = async (examId) => {

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this exam?"
    );

    if (!confirmDelete) {
      return;
    }

    try {

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/delete-exam/${examId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {

        alert("Exam Deleted Successfully");

        fetchExams();

      } else {

        alert(data.message);

      }

    } catch (error) {

      console.error(error);

    }

  };

const handleExamClick = async (exam) => {

  if (
    role === "Admin" ||
    role === "Examiner"
  ) {

    navigate(`/exam/${exam.exam_id}`);

    return;

  }

  try {

    const token =
      localStorage.getItem("token");

    const response = await fetch(

      `${API_BASE_URL}/exam-session/${exam.exam_id}`,

      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }

    );

    const session =
      await response.json();

    setSelectedExam(exam);

    if (
      session.status ===
      "Not Started"
    ) {

      setModalMode("start");

      setShowModal(true);

      return;

    }

    if (
      session.status ===
      "In Progress"
    ) {

      setModalMode("resume");

setShowModal(true);

return;

      if (resume) {

        navigate(
          `/exam/${exam.exam_id}`
        );

      }

      return;

    }

    if (
      session.status ===
      "Completed" ||
      session.status ===
      "Auto Submitted"
    ) {

      setModalMode("completed");

setShowModal(true);

return;
    }

  } catch (error) {

    console.error(error);

    alert(
      "Unable to load exam session."
    );

  }

};

const handleStartExam = async () => {

  try {

    const token =
      localStorage.getItem("token");

    const response = await fetch(
      `${API_BASE_URL}/start-exam`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          exam_id: selectedExam.exam_id
        })
      }
    );

    const data = await response.json();

    if (response.ok) {

      setShowModal(false);

      navigate(
        `/exam/${selectedExam.exam_id}`
      );

    } else {

      alert(data.message);

    }

  } catch (error) {

    console.error(error);

    alert("Unable to start exam.");

  }

};

  return (

    <div>

      <Navbar />

      <div className="page-container">

        <h1 className="page-title">
          Available Exams
        </h1>

        <div className="exams-grid">

          {exams.map((exam) => (

            <div
              key={exam.exam_id}
              className="exam-card"
              onClick={() =>
                handleExamClick(exam)
              }
            >

              <h3 className="exam-title">
                {exam.title}
              </h3>

              <p className="exam-info">
                Duration:
                {" "}
                {exam.duration}
                {" "}
                mins
              </p>

              <p className="exam-info">
                Total Marks:
                {" "}
                {exam.total_marks}
              </p>

              <p className="exam-info">
                Passing Marks:
                {" "}
                {exam.passing_marks}
              </p>

              {(role === "Admin" ||
                role === "Examiner") && (

                <div className="exam-actions">

                  <Link
                    className="action-link"
                    to={`/edit-exam/${exam.exam_id}`}
                    onClick={(event) =>
                      event.stopPropagation()
                    }
                  >
                    Edit Exam
                  </Link>

                  <button
                    onClick={(event) => {

                      event.stopPropagation();

                      handleDeleteExam(
                        exam.exam_id
                      );

                    }}
                  >
                    Delete
                  </button>

                </div>

              )}

            </div>

          ))}

        </div>

        {showModal && selectedExam && (

  <div className="modal-overlay">

    <div className="start-exam-modal">

      <h2>

{modalMode === "start"
  ? "Start Exam"
  : modalMode === "resume"
  ? "Resume Exam"
  : "Exam Already Attempted"}

</h2>

      <h3>
        {selectedExam.title}
      </h3>

      <p>
        Duration:
        {" "}
        {selectedExam.duration}
        {" "}
        mins
      </p>

      <p>
        Total Marks:
        {" "}
        {selectedExam.total_marks}
      </p>

      <p>
        Passing Marks:
        {" "}
        {selectedExam.passing_marks}
      </p>

      <div className="modal-warning">

{modalMode === "start" && (

<>

⚠ Once you click
<strong> Start Exam</strong>,
the timer will begin immediately.

<br /><br />

You cannot pause or restart
the examination.

</>

)}

{modalMode === "resume" && (

<>

Your examination is already
in progress.

<br /><br />

The timer has continued
running.

Click Resume to continue.

</>

)}

{modalMode === "completed" && (

<>

You have already attempted
this examination.

Multiple attempts are not
allowed.

</>

)}

</div>

      <div className="modal-buttons">

<button
className="cancel-btn"
onClick={() => {

setShowModal(false);

setSelectedExam(null);

}}
>
Close
</button>

{modalMode === "start" && (

<button
className="start-btn"
onClick={handleStartExam}
>
Start Exam
</button>

)}

{modalMode === "resume" && (

<button
className="start-btn"
onClick={() =>
navigate(
`/exam/${selectedExam.exam_id}`
)
}
>
Resume Exam
</button>

)}

</div>

    </div>

  </div>

)}

      </div>

    </div>

  );

}

export default ExamsPage;