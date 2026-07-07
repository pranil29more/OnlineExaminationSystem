import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import API_BASE_URL from "../services/api";
import Navbar from "../components/Navbar";

import "../styles/ResultDetailsPage.css";

function ResultDetailsPage() {

    const { submissionId } = useParams();

    const [result, setResult] = useState(null);

    useEffect(() => {

        fetchResult();

    }, []);

    const fetchResult = async () => {

        try {

            const token =
                localStorage.getItem("token");

            const response =
                await fetch(

                    `${API_BASE_URL}/result/${submissionId}`,

                    {

                        headers: {

                            Authorization:
                                `Bearer ${token}`

                        }

                    }

                );

            const data =
                await response.json();

            setResult(data);

        }

        catch (error) {

            console.error(error);

        }

    };

    if (!result) {

        return <h2>Loading Result...</h2>;

    }

    return (

        <div>

            <Navbar />

            <div className="page-container">

                <h1 className="page-title">

                    Result Details

                </h1>

                <div className="result-summary-card">

                    <h2 className="summary-title">

                        Result Summary

                    </h2>

                    <p className="summary-info">

                        <strong>

                            Submission ID:

                        </strong>

                        {" "}

                        {result.submission_id}

                    </p>

                    {result.candidate_name && (

                        <p className="summary-info">

                            <strong>

                                Candidate:

                            </strong>

                            {" "}

                            {result.candidate_name}

                        </p>

                    )}

                    <p className="summary-info">

                        <strong>

                            Batch:

                        </strong>

                        {" "}

                        {result.batch_name}

                    </p>

                    <p className="summary-info">

                        <strong>

                            Exam:

                        </strong>

                        {" "}

                        {result.exam_title}

                    </p>

                    <p className="summary-info">

                        <strong>

                            Score:

                        </strong>

                        {" "}

                        {result.score} / {result.total_marks}

                    </p>

                    <p className="summary-info">

                        <strong>

                            Percentage:

                        </strong>

                        {" "}

                        {result.percentage}%

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

                    <p className="summary-info">

                        <strong>

                            Submitted:

                        </strong>

                        {" "}

                        {result.submitted_at}

                    </p>

                </div>

                <div className="answers-grid">

                    {

                        result.answers.map((answer, index) => (

                            <div

                                key={index}

                                className="answer-card"

                            >

                                <h3 className="question-title">

                                    Question {index + 1}

                                </h3>

                                <p className="answer-info">

                                    {answer.question_text}

                                </p>

                                <p className="answer-info">

                                    <strong>

                                        Selected Answer:

                                    </strong>

                                    {" "}

                                    {answer.answer_text}

                                </p>

                                <p

                                    className={

                                        answer.is_correct

                                            ? "correct-status"

                                            : "incorrect-status"

                                    }

                                >

                                    {

                                        answer.is_correct

                                            ? "✅ Correct"

                                            : "❌ Incorrect"

                                    }

                                </p>

                            </div>

                        ))

                    }

                </div>

            </div>

        </div>

    );

}

export default ResultDetailsPage;