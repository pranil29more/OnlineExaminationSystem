import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import API_BASE_URL from "../services/api";

import Navbar from "../components/Navbar";

import "../styles/ResultsPage.css";

function ResultsPage() {

  const [results, setResults] = useState([]);

  const [search, setSearch] = useState("");

  useEffect(() => {

    fetchResults();

  }, []);

  const fetchResults = async () => {

    try {

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/results`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      setResults(data);

    } catch (error) {

      console.error(error);

    }

  };

const filteredResults = results.filter((result) => {

  const searchText = search.toLowerCase();

  return (

    String(result.submission_id)
      .includes(searchText) ||

    (result.exam_title || "")
      .toLowerCase()
      .includes(searchText) ||

    (result.candidate_name || "")
      .toLowerCase()
      .includes(searchText)

  );

});

return (

  <div>

    <Navbar />

    <div className="page-container">

      <h1 className="page-title">
        Submissions & Results
      </h1>

      <input
        type="text"
        className="search-input"
        placeholder={
  results.some(result => result.candidate_name)
    ? "Search by candidate, exam or submission ID..."
    : "Search by exam or submission ID..."
}
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
      />

      <div className="results-grid">

        {filteredResults.map((result) => (

          <div
            key={result.submission_id}
            className="result-card"
          >

            <h3 className="result-title">
              Submission #{result.submission_id}
            </h3>

            {result.candidate_name && (

              <p className="result-info">
                Candidate: {result.candidate_name}
              </p>

            )}

            {result.exam_title ? (

              <p className="result-info">
                Exam: {result.exam_title}
              </p>

            ) : (

              <p className="result-info">
                Exam ID: {result.exam_id}
              </p>

            )}

            <p className="result-info">
  Score: {result.score} / {result.total_marks}
</p>

<p className="summary-info">

    <strong>

        Status:

    </strong>

    {" "}

    <span
        className={
            result.score >= result.passing_marks
                ? "status-pass"
                : "status-fail"
        }
    >
        {
            result.score >= result.passing_marks
                ? "Pass"
                : "Fail"
        }
    </span>

</p>

            <p className="result-info">
              Submitted: {result.submitted_at}
            </p>

            <div className="result-actions">

              <Link
                to={`/result/${result.submission_id}`}
              >
                View Result
              </Link>

            </div>

          </div>

        ))}

        {filteredResults.length === 0 && (

          <h3
            style={{
              textAlign: "center",
              gridColumn: "1 / -1",
              marginTop: "30px"
            }}
          >
            No matching results found.
          </h3>

        )}

      </div>

    </div>

  </div>

);

}

export default ResultsPage;