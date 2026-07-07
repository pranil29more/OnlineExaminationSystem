import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import API_BASE_URL from "../services/api";

import Navbar from "../components/Navbar";

import "../styles/ProfilePage.css";

function ProfilePage() {

  const [profile, setProfile] = useState(null);

  const navigate = useNavigate();

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

      setProfile(data);

    } catch (error) {

      console.error(error);

    }

  };

  const handleLogout = () => {

    localStorage.removeItem("token");

    navigate("/");

  };

  if (!profile) {

    return <h2>Loading Profile...</h2>;

  }

  return (

    <div>

      <Navbar />

      <div className="page-container">

        <h1 className="page-title">
          My Profile
        </h1>

        <div className="profile-card">

          <div className="profile-info">

            <span className="profile-label">
              Name:
            </span>

            {" "}

            {profile.name}

          </div>

          <div className="profile-info">

            <span className="profile-label">
              Email:
            </span>

            {" "}

            {profile.email}

          </div>

          <div className="profile-info">

            <span className="profile-label">
              Role:
            </span>

            {" "}

            {profile.role}

          </div>

          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </div>

    </div>

  );

}

export default ProfilePage;