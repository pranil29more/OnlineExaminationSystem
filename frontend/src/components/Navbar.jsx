import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import "../styles/Navbar.css";

function Navbar() {

    const { role } = useAuth();

    const navigate = useNavigate();
    const location = useLocation();

    const handleNavigation = (path) => {

        navigate(path);

    };

    const isDashboardActive = () => {

        const dashboardPaths = [
            "/dashboard",
            "/users",
            "/create-user",
            "/exam-analytics",
            "/submission-analytics",
            "/batch-management",
            "/create-batch",
            "/edit-batch",
            "/batch-details",
            "/candidate-results",
            "/results/exam"
        ];

        const isDashboardRoute =
            dashboardPaths.some((path) =>
                location.pathname.startsWith(path)
            );

        const isEditExamRoute =
            location.pathname.startsWith(
                "/edit-exam/"
            );

        const isEditQuestionRoute =
            location.pathname.startsWith(
                "/edit-question/"
            );

        const isAddQuestionFromEditExam =
            location.pathname === "/add-question" &&
            location.state?.from === "edit-exam";

        return (
            isDashboardRoute ||
            isEditExamRoute ||
            isEditQuestionRoute ||
            isAddQuestionFromEditExam
        );

    };

    const isExamsActive = () => {

        return (
            location.pathname === "/exams" ||

            location.pathname.startsWith("/exam/")
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
            ? "nb-nav-item nb-active"
            : "nb-nav-item";

    return (

        <nav className="nb-navbar">

            <div
                className="nb-logo"
                onClick={() =>
                    handleNavigation("/dashboard")
                }
            >
                Online Examination System
            </div>


            <div className="nb-nav-links">

                {role === "Admin" && (

                    <button
                        type="button"
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
                    type="button"
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
                        type="button"
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
                        type="button"
                        className={navClass(
                            isCreateExamActive()
                        )}
                        onClick={() =>
                            handleNavigation(
                                "/create-exam"
                            )
                        }
                    >
                        Create Exam
                    </button>

                )}


                <button
                    type="button"
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
                    type="button"
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