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
        checkAccess();
    }, []);

    const checkAccess = async () => {
        try {
            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/");
                return;
            }

            const profileResponse = await fetch(
                `${API_BASE_URL}/profile`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const profile = await profileResponse.json();

            if (profile.role !== "Admin") {
                navigate("/exams");
                return;
            }

            await fetchDashboard();
        } catch (error) {
            console.error(error);
            navigate("/");
        }
    };

    const fetchDashboard = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/dashboard`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 403) {
                navigate("/exams");
                return;
            }

            const data = await response.json();
            setDashboard(data);
        } catch (error) {
            console.error(error);
        }
    };

    if (!dashboard) {
        return (
            <div>
                <Navbar />
                <PageLoader message="Loading Dashboard..." />
            </div>
        );
    }

    return (
        <div>
            <Navbar />

            <div className="dashboard-container">
                <h1 className="page-title">
                    Admin Dashboard
                </h1>

                <div className="dashboard-wrapper">
                    <div className="dashboard-circle">
                        <div
                            className="dashboard-quarter users"
                            onClick={() =>
                                navigate("/users")
                            }
                        >
                            <div className="quarter-content">
                                <div className="quarter-label">
                                    USERS
                                </div>

                                <div className="quarter-number">
                                    {dashboard.total_users}
                                </div>
                            </div>
                        </div>

                        <div
                            className="dashboard-quarter exams"
                            onClick={() =>
                                navigate(
                                    "/exam-analytics"
                                )
                            }
                        >
                            <div className="quarter-content">
                                <div className="quarter-label">
                                    EXAMS
                                </div>

                                <div className="quarter-number">
                                    {dashboard.total_exams}
                                </div>
                            </div>
                        </div>

                        <div
                            className="dashboard-quarter questions"
                            onClick={() =>
                                navigate(
                                    "/batch-management"
                                )
                            }
                        >
                            <div className="quarter-content">
                                <div className="quarter-label">
                                    BATCHES
                                </div>

                                <div className="quarter-number">
                                    {dashboard.total_batches}
                                </div>
                            </div>
                        </div>

                        <div
                            className="dashboard-quarter submissions"
                            onClick={() =>
                                navigate(
                                    "/submission-analytics"
                                )
                            }
                        >
                            <div className="quarter-content">
                                <div className="quarter-label">
                                    SUBMISSIONS
                                </div>

                                <div className="quarter-number">
                                    {
                                        dashboard.total_submissions
                                    }
                                </div>
                            </div>
                        </div>

                        <div className="dashboard-center">
                            <span></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DashboardPage;
