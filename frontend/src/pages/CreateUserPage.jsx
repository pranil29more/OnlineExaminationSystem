import { useState } from "react";
import { useNavigate } from "react-router-dom";

import API_BASE_URL from "../services/api";
import Navbar from "../components/Navbar";

import "../styles/CreateUserPage.css";

function CreateUserPage() {

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState("Candidate");

    const [userCreating, setUserCreating] =
        useState(false);

    const navigate = useNavigate();


    // =========================================================
    // Create User
    // =========================================================

    const handleCreateUser = async (e) => {

        e.preventDefault();

        if (userCreating) {
            return;
        }

        if (
            !name ||
            !email ||
            !password ||
            !confirmPassword
        ) {

            alert(
                "Please fill all fields."
            );

            return;
        }

        if (password !== confirmPassword) {

            alert(
                "Passwords do not match."
            );

            return;
        }

        try {

            setUserCreating(true);

            const token =
                localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/admin/create-user`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        name,
                        email,
                        password,
                        role,
                    }),
                }
            );

            const data =
                await response.json();

            if (response.ok) {

                alert(
                    "User created successfully."
                );

                navigate("/users");

            } else {

                alert(
                    data.message ||
                    "Unable to create user."
                );

            }

        } catch (error) {

            console.error(error);

            alert(
                "Unable to create user."
            );

        } finally {

            setUserCreating(false);

        }
    };


    return (

        <div className="cup-page">

            <Navbar />

            <main className="cup-container">

                <header className="cup-header">

                    <span className="cup-eyebrow">
                        CONFIGURATION
                    </span>

                    <h1 className="cup-title">
                        Create User
                    </h1>

                    <p className="cup-description">
                        Create a new user account and
                        configure the user's credentials
                        and system role.
                    </p>

                </header>


                <form
                    className="cup-form-card"
                    onSubmit={handleCreateUser}
                >

                    <div className="cup-form-section">

                        <div className="cup-section-heading">

                            <span className="cup-section-eyebrow">
                                ACCOUNT SETUP
                            </span>

                            <h2 className="cup-section-title">
                                User Information
                            </h2>

                            <p className="cup-section-description">
                                Enter the user's basic
                                information, login credentials,
                                and access role.
                            </p>

                        </div>


                        {/* =================================================
                            Full Name
                        ================================================= */}

                        <div className="cup-field">

                            <label
                                className="cup-field-label"
                                htmlFor="user-name"
                            >
                                Full Name
                            </label>

                            <input
                                id="user-name"
                                className="cup-form-input"
                                type="text"
                                placeholder="Enter full name"
                                value={name}
                                onChange={(e) =>
                                    setName(
                                        e.target.value
                                    )
                                }
                                required
                            />

                        </div>


                        {/* =================================================
                            Email
                        ================================================= */}

                        <div className="cup-field">

                            <label
                                className="cup-field-label"
                                htmlFor="user-email"
                            >
                                Email Address
                            </label>

                            <input
                                id="user-email"
                                className="cup-form-input"
                                type="email"
                                placeholder="Enter email address"
                                value={email}
                                onChange={(e) =>
                                    setEmail(
                                        e.target.value
                                    )
                                }
                                required
                            />

                        </div>


                        {/* =================================================
                            Password
                        ================================================= */}

                        <div className="cup-field">

                            <label
                                className="cup-field-label"
                                htmlFor="user-password"
                            >
                                Password
                            </label>

                            <input
                                id="user-password"
                                className="cup-form-input"
                                type="password"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(
                                        e.target.value
                                    )
                                }
                                required
                            />

                        </div>


                        {/* =================================================
                            Confirm Password
                        ================================================= */}

                        <div className="cup-field">

                            <label
                                className="cup-field-label"
                                htmlFor="confirm-password"
                            >
                                Confirm Password
                            </label>

                            <input
                                id="confirm-password"
                                className="cup-form-input"
                                type="password"
                                placeholder="Re-enter password"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(
                                        e.target.value
                                    )
                                }
                                required
                            />

                        </div>


                        {/* =================================================
                            User Role
                        ================================================= */}

                        <div className="cup-field">

                            <label
                                className="cup-field-label"
                                htmlFor="user-role"
                            >
                                User Role
                            </label>

                            <select
                                id="user-role"
                                className="cup-form-input"
                                value={role}
                                onChange={(e) =>
                                    setRole(
                                        e.target.value
                                    )
                                }
                            >

                                <option value="Candidate">
                                    Candidate
                                </option>

                                <option value="Examiner">
                                    Examiner
                                </option>

                            </select>

                        </div>


                        {/* =================================================
                            Create User Button
                        ================================================= */}

                        <button
                            type="submit"
                            className="cup-create-btn"
                            disabled={userCreating}
                        >
                            {userCreating
                                ? "Creating User..."
                                : "Create User"}
                        </button>

                    </div>

                </form>

            </main>

        </div>

    );
}

export default CreateUserPage;