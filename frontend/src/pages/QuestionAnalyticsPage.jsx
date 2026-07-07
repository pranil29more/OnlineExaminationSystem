import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";

import API_BASE_URL from "../services/api";

import "../styles/QuestionAnalyticsPage.css";

function QuestionAnalyticsPage() {

  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {

    fetchAnalytics();

  }, []);

  const fetchAnalytics = async () => {

    try {

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/question-analytics`,
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

    return <h2>Loading Analytics...</h2>;

  }

  return (

    <div>

      <Navbar />

      <div className="page-container">

        <h1 className="page-title">
          Question Analytics
        </h1>

        <div className="summary-card">

          <h2>Total Questions</h2>

          <div className="summary-value">

            {analytics.total_questions}

          </div>

        </div>

        <h2 className="section-title">

          Difficulty Distribution

        </h2>

        <div className="difficulty-grid">

          <div className="difficulty-card easy">

            <h3>Easy</h3>

            <div className="difficulty-count">

              {analytics.difficulty.Easy}

            </div>

          </div>

          <div className="difficulty-card medium">

            <h3>Medium</h3>

            <div className="difficulty-count">

              {analytics.difficulty.Medium}

            </div>

          </div>

          <div className="difficulty-card hard">

            <h3>Hard</h3>

            <div className="difficulty-count">

              {analytics.difficulty.Hard}

            </div>

          </div>

        </div>

        <h2 className="section-title">

          Questions Per Exam

        </h2>

        <div className="exam-grid">
            
            {analytics.exam_wise.map((exam, index) => (

            <div
              key={index}
              className="exam-card"
            >

              <h3 className="exam-title">

                {exam.title}

              </h3>

              <p className="exam-count">

                {exam.questions}
                {" "}
                Questions

              </p>

            </div>

          ))}

        </div>

      </div>

    </div>

  );

}

export default QuestionAnalyticsPage;