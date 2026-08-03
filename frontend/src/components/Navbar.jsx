import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API_BASE_URL from "../services/api";
import "../styles/Navbar.css";

function Navbar() {
    const [role, setRole] = useState("");

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/profile`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            setRole(data.role);
        } catch (error) {
            console.error(error);
        }
    };

    const handleNavigation = (path) => {
        navigate(path);
    };

    const isDashboardActive = () => {
        const dashboardPaths = [
            "/dashboard",
            "/users",
            "/exam-analytics",
            "/submission-analytics",
            "/batch-management",
            "/create-batch",
            "/edit-batch",
            "/batch-details",
            "/candidate-results",
            "/results/exam",
        ];

        return dashboardPaths.some((path) =>
            location.pathname.startsWith(path)
        );
    };

    const isExamsActive = () => {
        return (
            location.pathname === "/exams" ||
            location.pathname.startsWith("/exam/") ||
            location.pathname.startsWith("/edit-exam/") ||
            location.pathname.startsWith("/edit-question/") ||
            (
                location.pathname === "/add-question" &&
                location.state?.from === "edit-exam"
            )
        );
    };

    const isResultsActive = () => {
        return (
            location.pathname === "/results" ||
            location.pathname.startsWith("/result/")
        );
    };

    const isCreateExamActive = () => {
        return (
            location.pathname === "/create-exam" ||
            (
                location.pathname === "/add-question" &&
                location.state?.from !== "edit-exam"
            )
        );
    };

    const navClass = (active) =>
        active
            ? "nav-item active"
            : "nav-item";

    return (
        <nav className="navbar">
            <div
                className="logo"
                onClick={() =>
                    handleNavigation("/dashboard")
                }
            >
                Online Examination System
            </div>

            <div className="nav-links">
                {role === "Admin" && (
                    <button
                        className={navClass(
                            isDashboardActive()
                        )}
                        onClick={() =>
                            handleNavigation("/dashboard")
                        }
                    >
                        Dashboard
                    </button>
                )}

                <button
                    className={navClass(
                        isExamsActive()
                    )}
                    onClick={() =>
                        handleNavigation("/exams")
                    }
                >
                    Exams
                </button>

                {(role === "Candidate" ||
                    role === "Admin" ||
                    role === "Examiner") && (
                    <button
                        className={navClass(
                            isResultsActive()
                        )}
                        onClick={() =>
                            handleNavigation("/results")
                        }
                    >
                        Results
                    </button>
                )}

                {(role === "Examiner" ||
                    role === "Admin") && (
                    <button
                        className={navClass(
                            isCreateExamActive()
                        )}
                        onClick={() =>
                            handleNavigation("/create-exam")
                        }
                    >
                        Create Exam
                    </button>
                )}

                <button
                    className={navClass(
                        location.pathname === "/chatbot"
                    )}
                    onClick={() =>
                        handleNavigation("/chatbot")
                    }
                >
                    AI Assistant
                </button>

                <button
                    className={navClass(
                        location.pathname === "/profile"
                    )}
                    onClick={() =>
                        handleNavigation("/profile")
                    }
                >
                    Profile
                </button>
            </div>
        </nav>
    );
}

export default Navbar;
