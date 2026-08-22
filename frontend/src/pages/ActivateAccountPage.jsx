import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import API_BASE_URL from "../services/api";

import "../styles/ActivateAccountPage.css";

function ActivateAccountPage() {

    const { activationToken } =
        useParams();

    const navigate =
        useNavigate();

    const [account, setAccount] =
        useState(null);

    const [password, setPassword] =
        useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [activating, setActivating] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");


    useEffect(() => {

        verifyActivationToken();

    }, [activationToken]);


    const verifyActivationToken = async () => {

        if (!activationToken) {

            setError(
                "Invalid activation link."
            );

            setLoading(false);

            return;
        }

        try {

            setLoading(true);

            setError("");

            setAccount(null);

            const response =
                await fetch(
                    `${API_BASE_URL}/activate-account/${activationToken}`
                );

            const data =
                await response.json();

            if (!response.ok) {

                setError(
                    data.message ||
                    "Invalid or expired activation link."
                );

                return;
            }

            setAccount(data);

        } catch (error) {

            console.error(error);

            setError(
                "Unable to verify activation link."
            );

        } finally {

            setLoading(false);

        }

    };


    const handleActivateAccount =
        async () => {

            if (
                activating ||
                !account
            ) {

                return;

            }

            setError("");

            setSuccess("");


            if (
                !password ||
                !confirmPassword
            ) {

                setError(
                    "Please enter and confirm your password."
                );

                return;

            }


            if (
                password !==
                confirmPassword
            ) {

                setError(
                    "Passwords do not match."
                );

                return;

            }


            if (
                password.length < 8
            ) {

                setError(
                    "Password must be at least 8 characters long."
                );

                return;

            }


            try {

                setActivating(true);

                const response =
                    await fetch(
                        `${API_BASE_URL}/activate-account/${activationToken}`,
                        {
                            method:
                                "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",
                            },

                            body:
                                JSON.stringify({
                                    password:
                                        password,
                                }),
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {

                    setError(
                        data.message ||
                        "Unable to activate account."
                    );

                    return;

                }

                setSuccess(
                    data.message ||
                    "Account activated successfully."
                );

                setAccount((previousAccount) => ({
    ...previousAccount,
    account_status: "Active",
}));

                setPassword("");

                setConfirmPassword("");

            } catch (error) {

                console.error(error);

                setError(
                    "Unable to activate account."
                );

            } finally {

                setActivating(false);

            }

        };


    if (loading) {

        return (

            <div className="aap-page">

                <main className="aap-container">

                    <section className="aap-status-card">

                        <div className="aap-status-indicator">
                            <span></span>
                        </div>

                        <span className="aap-eyebrow">
                            ACCOUNT ACTIVATION
                        </span>

                        <h1 className="aap-status-title">
                            Verifying Activation Link
                        </h1>

                        <p className="aap-status-description">
                            Please wait while we verify
                            your account activation link.
                        </p>

                    </section>

                </main>

            </div>

        );

    }


    if (
        error &&
        !account
    ) {

        return (

            <div className="aap-page">

                <main className="aap-container">

                    <section className="aap-status-card">

                        <div className="aap-error-icon">
                            !
                        </div>

                        <span className="aap-eyebrow">
                            ACCOUNT ACTIVATION
                        </span>

                        <h1 className="aap-status-title">
                            Activation Unavailable
                        </h1>

                        <p className="aap-status-description">
                            {error}
                        </p>

                        <button
                            type="button"
                            className="aap-secondary-btn"
                            onClick={() =>
                                navigate("/")
                            }
                        >
                            Return to Login
                        </button>

                    </section>

                </main>

            </div>

        );

    }


    return (

        <div className="aap-page">

            <main className="aap-container">

                <header className="aap-header">

                    <span className="aap-eyebrow">
                        ACCOUNT ACTIVATION
                    </span>

                    <h1 className="aap-title">
                        Activate Your Account
                    </h1>

                    <p className="aap-description">
                        Complete your account setup by
                        creating a secure password for
                        your Online Examination System
                        account.
                    </p>

                </header>


                <section className="aap-card">

                    <div className="aap-section-heading">

                        <span className="aap-section-eyebrow">
                            ACCOUNT SETUP
                        </span>

                        <h2 className="aap-section-title">
                            Welcome, {account.name}
                        </h2>

                        <p className="aap-section-description">
                            Your account has been created
                            by an administrator. Set your
                            password below to complete
                            activation.
                        </p>

                    </div>


                    <div className="aap-account-details">

                        <div className="aap-account-detail">

                            <span className="aap-detail-label">
                                EMAIL ADDRESS
                            </span>

                            <span className="aap-detail-value">
                                {account.email}
                            </span>

                        </div>


                        <div className="aap-account-detail">

                            <span className="aap-detail-label">
                                USER ROLE
                            </span>

                            <span className="aap-role-badge">
                                {account.role}
                            </span>

                        </div>


                        <div className="aap-account-detail">

                            <span className="aap-detail-label">
                                ACCOUNT STATUS
                            </span>

                            <span
    className={
        account.account_status === "Active"
            ? "aap-active-badge"
            : "aap-pending-badge"
    }
>
    {account.account_status === "Active"
        ? "ACTIVE"
        : "PENDING ACTIVATION"}
</span>

                        </div>

                    </div>


                    {!success && (

                        <div className="aap-form">

                            <div className="aap-form-heading">

                                <h3 className="aap-form-title">
                                    Create Password
                                </h3>

                                <p className="aap-form-description">
                                    Your password must contain
                                    at least 8 characters.
                                </p>

                            </div>


                            <div className="aap-field">

                                <label
                                    className="aap-field-label"
                                    htmlFor="aap-password"
                                >
                                    New Password
                                </label>

                                <input
                                    id="aap-password"
                                    className="aap-form-input"
                                    type="password"
                                    placeholder="Create a secure password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(
                                            e.target.value
                                        )
                                    }
                                    disabled={
                                        activating
                                    }
                                    autoComplete="new-password"
                                />

                            </div>


                            <div className="aap-field">

                                <label
                                    className="aap-field-label"
                                    htmlFor="aap-confirm-password"
                                >
                                    Confirm Password
                                </label>

                                <input
                                    id="aap-confirm-password"
                                    className="aap-form-input"
                                    type="password"
                                    placeholder="Re-enter your password"
                                    value={
                                        confirmPassword
                                    }
                                    onChange={(e) =>
                                        setConfirmPassword(
                                            e.target.value
                                        )
                                    }
                                    disabled={
                                        activating
                                    }
                                    autoComplete="new-password"
                                />

                            </div>


                            {error && (

                                <div className="aap-error-message">

                                    <span className="aap-error-message-icon">
                                        !
                                    </span>

                                    <span>
                                        {error}
                                    </span>

                                </div>

                            )}


                            <button
                                type="button"
                                className="aap-activate-btn"
                                onClick={
                                    handleActivateAccount
                                }
                                disabled={
                                    activating
                                }
                            >
                                {activating
                                    ? "Activating Account..."
                                    : "Activate Account"}
                            </button>

                        </div>

                    )}


                    {success && (

                        <div className="aap-success-section">

                            <div className="aap-success-icon">
                                ✓
                            </div>

                            <span className="aap-success-eyebrow">
                                ACTIVATION COMPLETE
                            </span>

                            <h3 className="aap-success-title">
                                Account Activated
                            </h3>

                            <p className="aap-success-description">
                                {success}
                            </p>

                            <button
                                type="button"
                                className="aap-login-btn"
                                onClick={() =>
                                    navigate("/")
                                }
                            >
                                Go to Login
                            </button>

                        </div>

                    )}

                </section>

            </main>

        </div>

    );

}

export default ActivateAccountPage;