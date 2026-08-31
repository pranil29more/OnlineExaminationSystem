import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaUser,
    FaEnvelope,
    FaUserShield,
} from "react-icons/fa";
import API_BASE_URL from "../services/api";
import Navbar from "../components/Navbar";
import PageLoader from "../components/PageLoader";
import "../styles/ProfilePage.css";

function ProfilePage() {
    const [profile, setProfile] =
        useState(null);

    const navigate = useNavigate();

    // =========================================================
    // Fetch Profile
    // =========================================================

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token =
                localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/profile`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            const data =
                await response.json();

            setProfile(data);
        } catch (error) {
            console.error(error);
        }
    };

    // =========================================================
    // Logout
    // =========================================================

    const handleLogout = () => {
        localStorage.removeItem("token");

        localStorage.removeItem(
            "userEmail"
        );

        navigate("/");
    };

    // =========================================================
    // Loading
    // =========================================================

    if (!profile) {
        return (
            <div className="pp-page">
                <Navbar />

                <PageLoader
                    message="Loading Profile..."
                />
            </div>
        );
    }

    // =========================================================
    // Render
    // =========================================================

    return (
        <div className="pp-page">
            <Navbar />

            <main className="pp-page-container">

                {/* =================================================
                    Page Header
                ================================================= */}

                <header className="pp-page-header">
                    <div>
                        <span className="pp-page-eyebrow">
                            ACCOUNT
                        </span>

                        <h1 className="pp-page-title">
                            My Profile
                        </h1>

                        <p className="pp-page-description">
                            View your account
                            information and profile
                            details.
                        </p>
                    </div>
                </header>

                {/* =================================================
                    Profile Section
                ================================================= */}

                <section className="pp-profile-section">

                    {/* =================================================
                        Profile Header
                    ================================================= */}

                    <div className="pp-profile-header">
                        <div className="pp-profile-avatar">
                            {profile.name
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <div className="pp-profile-identity">
                            <h2 className="pp-profile-name">
                                {profile.name}
                            </h2>

                            <span className="pp-profile-role-badge">
                                {profile.role}
                            </span>
                        </div>
                    </div>

                    {/* =================================================
                        Profile Details
                    ================================================= */}

                    <div className="pp-profile-details">

                        <div className="pp-profile-item">
                            <FaUser
                                className="pp-profile-icon"
                            />

                            <div className="pp-profile-item-content">
                                <p className="pp-profile-item-title">
                                    Full Name
                                </p>

                                <p className="pp-profile-item-value">
                                    {profile.name}
                                </p>
                            </div>
                        </div>

                        <div className="pp-profile-item">
                            <FaEnvelope
                                className="pp-profile-icon"
                            />

                            <div className="pp-profile-item-content">
                                <p className="pp-profile-item-title">
                                    Email Address
                                </p>

                                <p className="pp-profile-item-value">
                                    {profile.email}
                                </p>
                            </div>
                        </div>

                        <div className="pp-profile-item">
                            <FaUserShield
                                className="pp-profile-icon"
                            />

                            <div className="pp-profile-item-content">
                                <p className="pp-profile-item-title">
                                    Role
                                </p>

                                <p className="pp-profile-item-value">
                                    {profile.role}
                                </p>
                            </div>
                        </div>

                    </div>

                    {/* =================================================
                        Actions
                    ================================================= */}

                    <div className="pp-profile-actions">
                        <button
                            type="button"
                            className="pp-logout-btn"
                            onClick={
                                handleLogout
                            }
                        >
                            Logout
                        </button>
                    </div>

                </section>

            </main>
        </div>
    );
}

export default ProfilePage;