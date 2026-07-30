import { useEffect, useRef, useState } from "react";
import {
  useNavigate,
  useParams
} from "react-router-dom";

import API_BASE_URL from "../services/api";
import Navbar from "../components/Navbar";

import PageLoader from "../components/PageLoader";

import "../styles/ExamDetailsPage.css";

function ExamDetailsPage() {

  const { examId } = useParams();

  const navigate = useNavigate();

  const [exam, setExam] = useState(null);

  const [answers, setAnswers] = useState({});

  const [role, setRole] = useState("");

  const [timeLeft, setTimeLeft] = useState("");

  const [submissionId, setSubmissionId] =
    useState(null);

  const [endTime, setEndTime] =
  useState(null);

  const hasAutoSubmitted =
    useRef(false);

  useEffect(() => {

    fetchExam();

  }, []);

  useEffect(() => {

  if (!endTime) {

    return;

  }

  const updateTimer = () => {

    const remaining =
      endTime - Date.now();

    if (remaining <= 0) {

      setTimeLeft("00:00");

      if (!hasAutoSubmitted.current) {

        hasAutoSubmitted.current = true;

        handleSubmitExam();

      }

      return;

    }

    const minutes =
      Math.floor(
        remaining / 60000
      );

    const seconds =
      Math.floor(
        (remaining % 60000) / 1000
      );

    setTimeLeft(

      `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`

    );

  };

  updateTimer();

  const timer = setInterval(
    updateTimer,
    1000
  );

  return () => {

    clearInterval(timer);

  };

}, [endTime]);

  const fetchExam = async () => {

    try {

      const token =
        localStorage.getItem("token");

      /* ==========================
         Fetch Exam Details
      ========================== */

      const examResponse =
        await fetch(

          `${API_BASE_URL}/exam/${examId}`,

          {

            headers: {

              Authorization:
                `Bearer ${token}`

            }

          }

        );

      const examData =
        await examResponse.json();

      setExam(examData);

      /* ==========================
         Fetch User Profile
      ========================== */

      const profileResponse =
        await fetch(

          `${API_BASE_URL}/profile`,

          {

            headers: {

              Authorization:
                `Bearer ${token}`

            }

          }

        );

      const profileData =
        await profileResponse.json();

      setRole(profileData.role);

      /* ==========================
         Candidate Session
      ========================== */

      if (
        profileData.role === "Candidate"
      ) {

        const sessionResponse =
          await fetch(

            `${API_BASE_URL}/exam-session/${examId}`,

            {

              headers: {

                Authorization:
                  `Bearer ${token}`

              }

            }

          );

        const sessionData =
          await sessionResponse.json();

          console.log("Raw Session:", sessionData);
console.log("Start Time String:", sessionData.start_time);
console.log("Parsed Timestamp:", new Date(sessionData.start_time).getTime());
console.log("Current Timestamp:", Date.now());

        if (
          sessionData.status ===
          "Not Started"
        ) {

          return;

        }

        setSubmissionId(
          sessionData.submission_id
        );

        /* ==========================
           Restore Saved Answers
        ========================== */

        if (sessionData.answers) {

          const restoredAnswers = {};

          sessionData.answers.forEach(
            (answer) => {

              restoredAnswers[
                answer.question_id
              ] = answer.answer_text;

            }
          );

          setAnswers(
            restoredAnswers
          );

        }

        /* ==========================
           Resume Timer
        ========================== */

        const start =
  new Date(sessionData.start_time).getTime();

const end =
  start + (sessionData.duration * 60 * 1000);

console.log("Session Data:", sessionData);
console.log("Start Time:", sessionData.start_time);
console.log("Parsed Start:", start);
console.log("Current Time:", Date.now());
console.log("End Time:", end);
console.log("Remaining:", end - Date.now());

setEndTime(end);

      }

    } catch (error) {

      console.error(error);

    }

  };

  /* =====================================================
   Save Answer
===================================================== */

const handleAnswerChange = async (

  questionId,

  optionText

) => {

  setAnswers((prev) => ({

    ...prev,

    [questionId]: optionText

  }));

  try {

    const token =
      localStorage.getItem("token");

    await fetch(

      `${API_BASE_URL}/save-answer`,

      {

        method: "POST",

        headers: {

          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${token}`

        },

        body: JSON.stringify({

          submission_id:
            submissionId,

          question_id:
            questionId,

          answer_text:
            optionText

        })

      }

    );

  } catch (error) {

    console.error(error);

  }

};

/* =====================================================
   Submit Exam
===================================================== */

const handleSubmitExam = async () => {

  try {

    const token =
      localStorage.getItem("token");

    const response =
      await fetch(

        `${API_BASE_URL}/submit-exam`,

        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`

          },

          body: JSON.stringify({

            exam_id:
              Number(examId)

          })

        }

      );

    const data =
      await response.json();

    if (response.ok) {

      alert(
        "Exam Submitted Successfully!"
      );

      navigate("/results");

    } else {

      alert(data.message);

    }

  } catch (error) {

    console.error(error);

  }

};

if (!exam) {

  return (

    <div>

      <Navbar />

      <PageLoader message="Loading Exam..." />

    </div>

  );

}

return (

  <div>

    <Navbar />

    <div className="page-container">

      <div className="exam-header-card">

        <div className="exam-title-row">

          <h1 className="exam-title">
            {exam.exam.title}
          </h1>

          {role === "Candidate" && (

            <h2 className="exam-timer">

              ⏳ {timeLeft}

            </h2>

          )}

        </div>

        <p className="exam-info">
          Duration: {exam.exam.duration} mins
        </p>

        <p className="exam-info">
          Total Marks: {exam.exam.total_marks}
        </p>

        <p className="exam-info">
          Passing Marks: {exam.exam.passing_marks}
        </p>

        <p className="exam-info">
          Questions: {exam.questions.length}
        </p>

      </div>

      <div className="questions-grid">

        {exam.questions.map((question) => (

          <div
            key={question.question_id}
            className="question-card"
          >

            <div className="question-header">

              <h3 className="question-title">
                {question.question_text}
              </h3>

              <span className="question-marks">
                {question.marks} Marks
              </span>

            </div>

            <div className="options-container">

              {question.options.map((option) => (

                <div
                  key={option.option_id}
                  className="option-row"
                >

                  {role === "Candidate" && (

                    <input
                      type="radio"
                      name={`question-${question.question_id}`}
                      value={option.option_text}
                      checked={
                        answers[
                          question.question_id
                        ] === option.option_text
                      }
                      onChange={() =>
                        handleAnswerChange(
                          question.question_id,
                          option.option_text
                        )
                      }
                    />

                  )}

                  <span>
                    {option.option_text}
                  </span>

                </div>

              ))}

            </div>

          </div>

        ))}

      </div>

      {role === "Candidate" && (

        <div className="submit-section">

          <button
            className="submit-btn"
            onClick={handleSubmitExam}
          >
            Submit Exam
          </button>

        </div>

      )}

    </div>

  </div>

);

}

export default ExamDetailsPage;