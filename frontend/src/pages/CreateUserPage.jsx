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

    const navigate = useNavigate();

    const handleCreateUser = async () => {

        if (
            !name ||
            !email ||
            !password ||
            !confirmPassword
        ) {

            alert("Please fill all fields.");

            return;

        }

        if (password !== confirmPassword) {

            alert("Passwords do not match.");

            return;

        }

        try {

            const token = localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/admin/create-user`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        name,
                        email,
                        password,
                        role,
                    }),
                }
            );

            const data = await response.json();

            if (response.ok) {

                alert("User created successfully.");

                navigate("/users");

            } else {

                alert(data.message);

            }

        } catch (error) {

            console.error(error);

            alert("Unable to create user.");

        }

    };

    return (
        <div>

            <Navbar />

            <div className="page-container">

                <h1 className="page-title">
                    Create User
                </h1>

                <div className="create-user-card">

                    <input
                        className="create-user-input"
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) =>
                            setName(e.target.value)
                        }
                    />

                    <input
                        className="create-user-input"
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) =>
                            setEmail(e.target.value)
                        }
                    />

                    <input
                        className="create-user-input"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                    />

                    <input
                        className="create-user-input"
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) =>
                            setConfirmPassword(e.target.value)
                        }
                    />

                    <select
                        className="create-user-input"
                        value={role}
                        onChange={(e) =>
                            setRole(e.target.value)
                        }
                    >
                        <option value="Candidate">
                            Candidate
                        </option>

                        <option value="Examiner">
                            Examiner
                        </option>
                    </select>

                    <button
                        className="create-user-btn"
                        onClick={handleCreateUser}
                    >
                        Create User
                    </button>

                </div>

            </div>

        </div>
    );

}

export default CreateUserPage;