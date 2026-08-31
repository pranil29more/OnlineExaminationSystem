import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API_BASE_URL from "../services/api";
import "../styles/LoginPage.css";

function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loginLoading, setLoginLoading] =
        useState(false);

    const [registerLoading, setRegisterLoading] =
        useState(false);

    const navigate = useNavigate();

    const { login } = useAuth();

    const handleLogin = async () => {
        try {
            setLoginLoading(true);

            const response = await fetch(
                `${API_BASE_URL}/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            const data =
                await response.json();

            if (response.ok) {
                login(
                    data.token,
                    data.user
                );

                if (
                    data.user.role === "Admin"
                ) {
                    navigate("/dashboard");
                } else {
                    navigate("/exams");
                }
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoginLoading(false);
        }
    };

    const handleRegister = () => {
        setRegisterLoading(true);

        navigate("/register");
    };

    return (
        <div className="lpg-page">
            <main className="lpg-container">
                <section className="lpg-card">
                    <div className="lpg-header">
                        <span className="lpg-eyebrow">
                            Online Examination System
                        </span>

                        <h1 className="lpg-title">
                            Welcome
                        </h1>

                        <p className="lpg-subtitle">
                            Login to continue to your account.
                        </p>
                    </div>

                    <div className="lpg-form">
                        <div className="lpg-field">
                            <label
                                htmlFor="lpg-email"
                                className="lpg-label"
                            >
                                Email Address
                            </label>

                            <input
                                id="lpg-email"
                                className="lpg-input"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(
                                        e.target.value
                                    )
                                }
                                disabled={loginLoading}
                            />
                        </div>

                        <div className="lpg-field">
                            <label
                                htmlFor="lpg-password"
                                className="lpg-label"
                            >
                                Password
                            </label>

                            <input
                                id="lpg-password"
                                className="lpg-input"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(
                                        e.target.value
                                    )
                                }
                                disabled={loginLoading}
                            />
                        </div>

                        <button
                            type="button"
                            className="lpg-login-btn"
                            onClick={handleLogin}
                            disabled={
                                loginLoading ||
                                registerLoading
                            }
                        >
                            {loginLoading
                                ? "Logging in..."
                                : "Login"}
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default LoginPage;