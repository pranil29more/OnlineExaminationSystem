import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import API_BASE_URL from "../services/api";
import Navbar from "../components/Navbar";

import PageLoader from "../components/PageLoader";

import "../styles/ExamResultsPage.css";

function ExamResultsPage() {

  const { examId } = useParams();

  const [exam, setExam] = useState(null);

  const [results, setResults] = useState([]);

  useEffect(() => {

    fetchResults();

  }, []);

  const fetchResults = async () => {

    try {

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/exam-results/${examId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      setExam(data.exam);

      setResults(data.results);

    } catch (error) {

      console.error(error);

    }

  };

  if (!exam) {

    return (

        <div>

            <Navbar />

            <PageLoader message="Loading Exam Results..." />

        </div>

    );

}

  return (

    <div>

      <Navbar />

      <div className="page-container">

        <h1 className="page-title">

          Exam Results

        </h1>

        <div className="summary-card">

          <div className="summary-title">

            {exam.title}

          </div>

        </div>

        <h2 className="section-title">

          Student Results

        </h2>

        <div className="results-table-container">

  <table className="results-table">

    <thead>

      <tr>

        <th>Name</th>

        <th>Score</th>

        <th>Status</th>

        <th>Submitted</th>

        <th>Action</th>

      </tr>

    </thead>

    <tbody>

      {results.map((result) => {

        const status =
  Number(result.score) >=
  Number(exam.passing_marks)
    ? "Pass"
    : "Fail";

        const submittedDate =
          new Date(
            result.submitted_at
          ).toLocaleDateString("en-GB");

        return (

          <tr key={result.submission_id}>

            <td>

              {result.candidate_name}

            </td>

            <td>

              {result.score}/{exam.total_marks}

            </td>

            <td>

              <span
                className={
                  status === "Pass"
                    ? "status-pass"
                    : "status-fail"
                }
              >

                {status}

              </span>

            </td>

            <td>

              {submittedDate}

            </td>

            <td>

              <Link
                className="uni-view-btn"
                to={`/result/${result.submission_id}`}
              >

                View Details

              </Link>

            </td>

          </tr>

        );

      })}

    </tbody>

  </table>

</div>

      </div>

    </div>

  );

}

export default ExamResultsPage;