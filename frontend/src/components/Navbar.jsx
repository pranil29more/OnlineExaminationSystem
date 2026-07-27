import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import API_BASE_URL from "../services/api";

import "../styles/Navbar.css";

function Navbar() {

  const [role, setRole] = useState("");

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
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      setRole(data.role);

    } catch (error) {

      console.error(error);

    }

  };

  return (

    <nav className="navbar">

      <div className="logo">
        Online Examination System
      </div>

      <div className="nav-links">

        {role === "Admin" && (
          <Link to="/dashboard">
            Dashboard
          </Link>
        )}

        <Link to="/exams">
          Exams
        </Link>

        {(role === "Candidate" || role === "Admin" || role === "Examiner") && (
          <Link to="/results">
            Results
          </Link>
        )}

        {(role === "Examiner" || role === "Admin") && (
          <Link to="/create-exam">
            Create Exam
          </Link>
        )}

        <Link to="/chatbot">
  AI Assistant
</Link>

<Link to="/profile">
  Profile
</Link>

      </div>

    </nav>

  );

}

export default Navbar;