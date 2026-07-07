import { useState } from "react";
import { useNavigate } from "react-router-dom";

import API_BASE_URL from "../services/api";

import "../styles/LoginPage.css";

function LoginPage() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleLogin = async () => {

    try {

      const response = await fetch(
        `${API_BASE_URL}/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            password
          })
        }
      );

      const data = await response.json();

      if (response.ok) {

        localStorage.setItem(
          "token",
          data.token
        );

        const profileResponse = await fetch(
          `${API_BASE_URL}/profile`,
          {
            headers: {
              Authorization:
                `Bearer ${data.token}`
            }
          }
        );

        const profileData =
          await profileResponse.json();

        if (profileData.role === "Admin") {

          navigate("/dashboard");

        } else {

          navigate("/exams");

        }

      } else {

        alert(data.message);

      }

    } catch (error) {

      console.error(error);

    }

  };

  return (

    <div className="login-container">

      <div className="login-card">

        <h1 className="login-title">
          Online Examination System
        </h1>

        <p className="login-subtitle">
          Sign in to continue
        </p>

        <input
          className="login-input"
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <input
          className="login-input"
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
        />

        <button
          className="login-btn"
          onClick={handleLogin}
        >
          Login
        </button>

        <div className="register-section">

          <p className="register-text">
            Don't have an account?
          </p>

          <button
            className="register-link"
            onClick={() => navigate("/register")}
          >
            Create New Account
          </button>

        </div>

      </div>

    </div>

  );

}

export default LoginPage;