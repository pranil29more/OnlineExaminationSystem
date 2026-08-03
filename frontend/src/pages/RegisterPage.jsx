import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../services/api";
import "../styles/RegisterPage.css";

function RegisterPage() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState("Candidate");

    const handleRegister = async () => {
        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    role,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert("Account created successfully!");
                navigate("/");
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="register-container">
            <div className="register-card">
                <h1 className="register-title">
                    Create Account
                </h1>

                <p className="register-subtitle">
                    Join the Online Examination System
                </p>

                <input
                    className="register-input"
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />

                <input
                    className="register-input"
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    className="register-input"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <input
                    className="register-input"
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) =>
                        setConfirmPassword(e.target.value)
                    }
                />

                <select
                    className="register-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                >
                    <option value="Candidate">
                        Candidate
                    </option>

                    <option value="Examiner">
                        Examiner
                    </option>
                </select>

                <button
                    className="register-btn"
                    onClick={handleRegister}
                >
                    Create Account
                </button>

                <div className="login-section">
                    <p className="login-text">
                        Already have an account?
                    </p>

                    <button
                        className="login-link"
                        onClick={() => navigate("/")}
                    >
                        Login
                    </button>
                </div>
            </div>
        </div>
    );
}

export default RegisterPage;
