import { useEffect, useState } from "react";

import API_BASE_URL from "../services/api";
import Navbar from "../components/Navbar";

import "../styles/UsersPage.css";

function UsersPage() {

  const [users, setUsers] = useState([]);

  useEffect(() => {

    fetchUsers();

  }, []);

  const fetchUsers = async () => {

    try {

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/users`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      setUsers(data);

    } catch (error) {

      console.error(error);

    }

  };

  const handleDeleteUser = async (userId) => {

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user?"
    );

    if (!confirmDelete) {

      return;

    }

    try {

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/delete-user/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {

        alert("User deleted successfully");

        fetchUsers();

      } else {

        alert(data.message);

      }

    } catch (error) {

      console.error(error);

    }

  };

  const admins = users.filter(
    (user) => user.role === "Admin"
  );

  const examiners = users.filter(
    (user) => user.role === "Examiner"
  );

  const candidates = users.filter(
    (user) => user.role === "Candidate"
  );

  return (

  <div>

    <Navbar />

    <div className="page-container">

      <h1 className="page-title">
        User Management
      </h1>

      {/* ================= Admin ================= */}

      <h2 className="section-title">
        Admin
      </h2>

      <div className="users-grid">

        {admins.map((user) => (

          <div
            key={user.user_id}
            className="user-card"
          >

            <h2 className="user-name">
              {user.name}
            </h2>

            <p className="user-info">
              Email: {user.email}
            </p>

            <p className="user-info">

              Role:{" "}

              <span
                className={`role-badge ${user.role.toLowerCase()}`}
              >
                {user.role}
              </span>

            </p>

            <div className="user-actions">

              <button
                className="admin-btn"
                disabled
              >
                Admin Account
              </button>

            </div>

          </div>

        ))}

      </div>

      {/* ================= Examiners ================= */}

      <h2 className="section-title">
        Examiners
      </h2>

      <div className="users-grid">

        {examiners.map((user) => (

          <div
            key={user.user_id}
            className="user-card"
          >

            <h2 className="user-name">
              {user.name}
            </h2>

            <p className="user-info">
              Email: {user.email}
            </p>

            <p className="user-info">

              Role:{" "}

              <span
                className={`role-badge ${user.role.toLowerCase()}`}
              >
                {user.role}
              </span>

            </p>

            <div className="user-actions">

              <button
                className="delete-btn"
                onClick={() =>
                  handleDeleteUser(user.user_id)
                }
              >
                Delete User
              </button>

            </div>

          </div>

        ))}

      </div>

      {/* ================= Candidates ================= */}

      <h2 className="section-title">
        Candidates
      </h2>

      <div className="users-grid">

        {candidates.map((user) => (

          <div
            key={user.user_id}
            className="user-card"
          >

            <h2 className="user-name">
              {user.name}
            </h2>

            <p className="user-info">
              Email: {user.email}
            </p>

            <p className="user-info">

              Role:{" "}

              <span
                className={`role-badge ${user.role.toLowerCase()}`}
              >
                {user.role}
              </span>

            </p>

            <div className="user-actions">

              <button
                className="delete-btn"
                onClick={() =>
                  handleDeleteUser(user.user_id)
                }
              >
                Delete User
              </button>

            </div>

          </div>

        ))}

      </div>

    </div>

  </div>

);

}

export default UsersPage;