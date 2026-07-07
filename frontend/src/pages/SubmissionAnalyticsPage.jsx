import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import API_BASE_URL from "../services/api";
import Navbar from "../components/Navbar";

import "../styles/SubmissionAnalyticsPage.css";

function SubmissionAnalyticsPage() {

  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {

    fetchAnalytics();

  }, []);

  const fetchAnalytics = async () => {

    try {

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/submission-analytics`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      setAnalytics(data);

    } catch (error) {

      console.error(error);

    }

  };

  if (!analytics) {

    return <h2>Loading...</h2>;

  }

  return (

    <div>

      <Navbar />

      <div className="page-container">

        <h1 className="page-title">

          Submission Analytics

        </h1>

        <div className="summary-card">

          <div className="summary-title">

            Total Submissions

          </div>

          <div className="summary-value">

            {analytics.total_submissions}

          </div>

        </div>

        <h2 className="section-title">

          Exam Performance

        </h2>

        <div className="exam-grid">
            {analytics.exam_wise.map((exam) => (

            <div
              key={exam.exam_id}
              className="exam-card"
            >

              <h3 className="exam-title">

                {exam.title}

              </h3>

              <div className="exam-stats">

                <div className="stat-row">

                  <span>

                    Attempts

                  </span>

                  <strong>

                    {exam.attempts}

                  </strong>

                </div>

                <div className="stat-row">

                  <span>

                    Average Score

                  </span>

                  <strong>

                    {exam.average_score}

                  </strong>

                </div>

                <div className="stat-row">

                  <span>

                    Highest Score

                  </span>

                  <strong>

                    {exam.highest_score}
                    {/* {" "}
                    ({exam.highest_scorer}) */}

                  </strong>

                </div>

              </div>

              <Link
                className="view-btn"
                to={`/results/exam/${exam.exam_id}`}
              >

                View Results

              </Link>

            </div>

          ))}

        </div>

      </div>

    </div>

  );

}

export default SubmissionAnalyticsPage;