import { useEffect, useState } from "react";

import {
    useNavigate,
    useLocation
} from "react-router-dom";

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

            const token =
                localStorage.getItem("token");

            const response =
                await fetch(

                    `${API_BASE_URL}/profile`,

                    {

                        headers: {

                            Authorization:
                                `Bearer ${token}`

                        }

                    }

                );

            const data =
                await response.json();

            setRole(data.role);

        }

        catch (error) {

            console.error(error);

        }

    };

    const handleNavigation = (path) => {

        navigate(path);

    };

    const navClass = (path) =>

        location.pathname === path

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

                {

                    role === "Admin" && (

                        <button

                            className={

                                navClass("/dashboard")

                            }

                            onClick={() =>

                                handleNavigation("/dashboard")

                            }

                        >

                            Dashboard

                        </button>

                    )

                }

                <button

                    className={

                        navClass("/exams")

                    }

                    onClick={() =>

                        handleNavigation("/exams")

                    }

                >

                    Exams

                </button>

                {

                    (

                        role === "Candidate" ||

                        role === "Admin" ||

                        role === "Examiner"

                    ) && (

                        <button

                            className={

                                navClass("/results")

                            }

                            onClick={() =>

                                handleNavigation("/results")

                            }

                        >

                            Results

                        </button>

                    )

                }

                {

                    (

                        role === "Examiner" ||

                        role === "Admin"

                    ) && (

                        <button

                            className={

                                navClass("/create-exam")

                            }

                            onClick={() =>

                                handleNavigation("/create-exam")

                            }

                        >

                            Create Exam

                        </button>

                    )

                }

                <button

                    className={

                        navClass("/chatbot")

                    }

                    onClick={() =>

                        handleNavigation("/chatbot")

                    }

                >

                    AI Assistant

                </button>

                <button

                    className={

                        navClass("/profile")

                    }

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