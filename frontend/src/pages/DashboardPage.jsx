import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import API_BASE_URL from "../services/api";
import Navbar from "../components/Navbar";
import PageLoader from "../components/PageLoader";

import "../styles/DashboardPage.css";

function DashboardPage() {
    const [dashboard, setDashboard] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const token =
                localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/dashboard`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 403) {
                navigate("/exams");
                return;
            }

            const data =
                await response.json();

            setDashboard(data);
        } catch (error) {
            console.error(error);
        }
    };

    if (!dashboard) {
        return (
            <div className="adp-page">

                <Navbar />

                <PageLoader
                    message="Loading Dashboard..."
                />

            </div>
        );
    }

    return (
        <div className="adp-page">

            <Navbar />

            <main className="adp-dashboard-container">

                {/* =================================================
                    Page Header
                ================================================= */}

                <header className="adp-page-header">

                    <span className="adp-page-eyebrow">
                        ADMINISTRATION
                    </span>

                    <h1 className="adp-page-title">
                        Admin Dashboard
                    </h1>

                    <p className="adp-page-description">
                        Monitor users, examinations,
                        batches, and submission activity
                        from a single overview.
                    </p>

                </header>


                {/* =================================================
                    Dashboard Statistics
                ================================================= */}

                <div className="adp-dashboard-wrapper">

                    <div className="adp-dashboard-circle">

                        <div
                            className="adp-dashboard-quarter adp-users"
                            onClick={() =>
                                navigate("/users")
                            }
                        >

                            <div className="adp-quarter-content">

                                <div className="adp-quarter-label">
                                    USERS
                                </div>

                                <div className="adp-quarter-number">
                                    {
                                        dashboard.total_users
                                    }
                                </div>

                            </div>

                        </div>


                        <div
                            className="adp-dashboard-quarter adp-exams"
                            onClick={() =>
                                navigate(
                                    "/exam-analytics"
                                )
                            }
                        >

                            <div className="adp-quarter-content">

                                <div className="adp-quarter-label">
                                    EXAMS
                                </div>

                                <div className="adp-quarter-number">
                                    {
                                        dashboard.total_exams
                                    }
                                </div>

                            </div>

                        </div>


                        <div
                            className="adp-dashboard-quarter adp-questions"
                            onClick={() =>
                                navigate(
                                    "/batch-management"
                                )
                            }
                        >

                            <div className="adp-quarter-content">

                                <div className="adp-quarter-label">
                                    BATCHES
                                </div>

                                <div className="adp-quarter-number">
                                    {
                                        dashboard.total_batches
                                    }
                                </div>

                            </div>

                        </div>


                        <div
                            className="adp-dashboard-quarter adp-submissions"
                            onClick={() =>
                                navigate(
                                    "/submission-analytics"
                                )
                            }
                        >

                            <div className="adp-quarter-content">

                                <div className="adp-quarter-label">
                                    SUBMISSIONS
                                </div>

                                <div className="adp-quarter-number">
                                    {
                                        dashboard.total_submissions
                                    }
                                </div>

                            </div>

                        </div>


                        <div className="adp-dashboard-center">
                            <span></span>
                        </div>

                    </div>

                </div>

            </main>

        </div>
    );
}

export default DashboardPage;