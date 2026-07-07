import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import API_BASE_URL from "../services/api";

import Navbar from "../components/Navbar";

import "../styles/ExamAnalyticsPage.css";

function ExamAnalyticsPage() {

  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {

    fetchAnalytics();

  }, []);

  const fetchAnalytics = async () => {

    try {

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/exam-analytics`,
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

          Exam Analytics

        </h1>

        <div className="summary-card">

          <div className="summary-title">

            Total Exams

          </div>

          <div className="summary-value">

            {analytics.total_exams}

          </div>

        </div>

        <h2 className="section-title">

          Exam Library

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
                    Questions
                  </span>

                  <strong>
                    {exam.questions}
                  </strong>

                </div>

                <div className="stat-row">

                  <span>
                    Submissions
                  </span>

                  <strong>
                    {exam.submissions}
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

              </div>

              <Link
                className="open-btn"
                to={`/edit-exam/${exam.exam_id}`}
              >
                Manage Exam
              </Link>

            </div>

          ))}

        </div>

      </div>

    </div>

  );

}

export default ExamAnalyticsPage;