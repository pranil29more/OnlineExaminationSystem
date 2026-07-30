import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaUser,
  FaEnvelope,
  FaUserShield
} from "react-icons/fa";

import API_BASE_URL from "../services/api";

import Navbar from "../components/Navbar";

import PageLoader from "../components/PageLoader";

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

    }

    catch (error) {

      console.error(error);

    }

  };

  const handleLogout = () => {

    localStorage.removeItem("token");

    localStorage.removeItem("userEmail");

    navigate("/");

  };

  if (!profile) {

    return (

        <div>

            <Navbar />

            <PageLoader message="Loading Profile..." />

        </div>

    );

}

  return (

    <div>

      <Navbar />

      <div className="page-container">

        <h1 className="page-title">

          My Profile

        </h1>

        <div className="profile-card">

          <div className="profile-avatar">

            {profile.name.charAt(0).toUpperCase()}

          </div>

          <h2 className="profile-name">

            {profile.name}

          </h2>

          <span className="profile-role-badge">

            {profile.role}

          </span>

          <div className="profile-details">

            <div className="profile-item">

              <FaUser className="profile-icon" />

              <div>

                <p className="profile-item-title">

                  Full Name

                </p>

                <p className="profile-item-value">

                  {profile.name}

                </p>

              </div>

            </div>

            <div className="profile-item">

              <FaEnvelope className="profile-icon" />

              <div>

                <p className="profile-item-title">

                  Email Address

                </p>

                <p className="profile-item-value">

                  {profile.email}

                </p>

              </div>

            </div>

            <div className="profile-item">

              <FaUserShield className="profile-icon" />

              <div>

                <p className="profile-item-title">

                  Role

                </p>

                <p className="profile-item-value">

                  {profile.role}

                </p>

              </div>

            </div>

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