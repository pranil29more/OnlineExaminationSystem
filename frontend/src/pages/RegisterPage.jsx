import { useState } from "react";
import { useNavigate } from "react-router-dom";

import API_BASE_URL from "../services/api";

import "../styles/RegisterPage.css";

function RegisterPage() {

    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [registerLoading, setRegisterLoading] =
        useState(false);

    const [loginLoading, setLoginLoading] =
        useState(false);

    const handleRegister = async () => {

        if (password !== confirmPassword) {

            alert("Passwords do not match.");

            return;

        }

        try {

            setRegisterLoading(true);

            const response = await fetch(
                `${API_BASE_URL}/register`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        name,
                        email,
                        password,
                        role: "Candidate",
                    }),
                }
            );

            const data =
                await response.json();

            if (response.ok) {

                alert(
                    "Account created successfully!"
                );

                navigate("/");

            } else {

                alert(data.message);

            }

        } catch (error) {

            console.error(error);

        } finally {

            setRegisterLoading(false);

        }

    };

    const handleLogin = () => {

        setLoginLoading(true);

        navigate("/");

    };

    return (

        <div className="rpg-page">

            <main className="rpg-container">

                <section className="rpg-card">

                    <div className="rpg-header">

                        <span className="rpg-eyebrow">
                            Online Examination System
                        </span>

                        <h1 className="rpg-title">
                            Create Account
                        </h1>

                        <p className="rpg-subtitle">
                            Join the examination
                            platform and get started.
                        </p>

                    </div>


                    <div className="rpg-form">

                        <div className="rpg-field">

                            <label
                                htmlFor="rpg-name"
                                className="rpg-label"
                            >
                                Full Name
                            </label>

                            <input
                                id="rpg-name"
                                className="rpg-input"
                                type="text"
                                placeholder="Enter your full name"
                                value={name}
                                onChange={(e) =>
                                    setName(
                                        e.target.value
                                    )
                                }
                                disabled={
                                    registerLoading
                                }
                            />

                        </div>


                        <div className="rpg-field">

                            <label
                                htmlFor="rpg-email"
                                className="rpg-label"
                            >
                                Email Address
                            </label>

                            <input
                                id="rpg-email"
                                className="rpg-input"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(
                                        e.target.value
                                    )
                                }
                                disabled={
                                    registerLoading
                                }
                            />

                        </div>


                        <div className="rpg-field">

                            <label
                                htmlFor="rpg-password"
                                className="rpg-label"
                            >
                                Password
                            </label>

                            <input
                                id="rpg-password"
                                className="rpg-input"
                                type="password"
                                placeholder="Create a password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(
                                        e.target.value
                                    )
                                }
                                disabled={
                                    registerLoading
                                }
                            />

                        </div>


                        <div className="rpg-field">

                            <label
                                htmlFor="rpg-confirm-password"
                                className="rpg-label"
                            >
                                Confirm Password
                            </label>

                            <input
                                id="rpg-confirm-password"
                                className="rpg-input"
                                type="password"
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(
                                        e.target.value
                                    )
                                }
                                disabled={
                                    registerLoading
                                }
                            />

                        </div>


                        <button
                            type="button"
                            className="rpg-register-btn"
                            onClick={handleRegister}
                            disabled={
                                registerLoading ||
                                loginLoading
                            }
                        >
                            {registerLoading
                                ? "Creating Account..."
                                : "Create Account"}
                        </button>

                    </div>


                    <div className="rpg-login-section">

                        <p className="rpg-login-text">
                            Already have an account?
                        </p>

                        <button
                            type="button"
                            className="rpg-login-link"
                            onClick={handleLogin}
                            disabled={
                                registerLoading ||
                                loginLoading
                            }
                        >
                            {loginLoading
                                ? "Loading..."
                                : "Login"}
                        </button>

                    </div>

                </section>

            </main>

        </div>

    );
}

export default RegisterPage;