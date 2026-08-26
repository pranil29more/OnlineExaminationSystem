import { useState } from "react";
import { useNavigate } from "react-router-dom";

import API_BASE_URL from "../services/api";
import Navbar from "../components/Navbar";

import "../styles/CreateUserPage.css";

function CreateUserPage() {

    const [name, setName] =
        useState("");

    const [email, setEmail] =
        useState("");

    const [role, setRole] =
        useState("Candidate");

    const [entryMode, setEntryMode] =
        useState("manual");

    const [bulkFile, setBulkFile] =
        useState(null);

    const [userCreating, setUserCreating] =
        useState(false);

    const [bulkUploading, setBulkUploading] =
        useState(false);

    const navigate = useNavigate();


    // =========================================================
    // Manual User Creation
    // =========================================================

    const handleCreateUser = async (event) => {

        event.preventDefault();

        if (
            userCreating ||
            bulkUploading
        ) {
            return;
        }

        if (!name.trim() || !email.trim()) {

            alert(
                "Please fill all required fields."
            );

            return;
        }

        try {

            setUserCreating(true);

            const token =
                localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/admin/create-user`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        name:
                            name.trim(),

                        email:
                            email.trim(),

                        role,
                    }),
                }
            );

            const data =
                await response.json();

            if (!response.ok) {

                alert(
                    data.message ||
                    "Unable to create user."
                );

                return;
            }

            alert(
                data.message ||
                "User created successfully. Account activation is pending."
            );

            setName("");

            setEmail("");

            setRole("Candidate");

            navigate("/users");

        } catch (error) {

            console.error(error);

            alert(
                "Unable to create user."
            );

        } finally {

            setUserCreating(false);
        }
    };


    // =========================================================
    // Bulk File Selection
    // =========================================================

    const handleBulkFileChange = (
        event
    ) => {

        const selectedFile =
            event.target.files[0];

        if (!selectedFile) {

            setBulkFile(null);

            return;
        }

        const fileName =
            selectedFile.name.toLowerCase();

        if (
            !fileName.endsWith(".xlsx")
        ) {

            alert(
                "Please select an .xlsx Excel file."
            );

            event.target.value = "";

            setBulkFile(null);

            return;
        }

        setBulkFile(selectedFile);
    };


    // =========================================================
    // Bulk Upload Users
    // =========================================================

    const handleBulkUpload = async () => {

        if (
            bulkUploading ||
            userCreating
        ) {
            return;
        }

        if (!bulkFile) {

            alert(
                "Please select an Excel file."
            );

            return;
        }

        try {

            setBulkUploading(true);

            const token =
                localStorage.getItem("token");

            const formData =
                new FormData();

            formData.append(
                "role",
                role
            );

            formData.append(
                "file",
                bulkFile
            );

            const response = await fetch(
                `${API_BASE_URL}/admin/bulk-upload-users`,
                {
                    method: "POST",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },

                    body: formData,
                }
            );

            const data =
                await response.json();

            if (!response.ok) {

                alert(
                    data.message ||
                    "Unable to upload users."
                );

                return;
            }

            alert(
                data.message ||
                "Users uploaded successfully."
            );

            setBulkFile(null);

            const fileInput =
                document.getElementById(
                    "bulk-user-file"
                );

            if (fileInput) {

                fileInput.value = "";
            }

            navigate("/users");

        } catch (error) {

            console.error(error);

            alert(
                "Unable to upload users."
            );

        } finally {

            setBulkUploading(false);
        }
    };


    return (

        <div className="cup-page">

            <Navbar />

            <main className="cup-container">

                {/* =================================================
                    Page Header
                ================================================= */}

                <header className="cup-header">

                    <span className="cup-eyebrow">
                        CONFIGURATION
                    </span>

                    <h1 className="cup-title">
                        Create User
                    </h1>

                    <p className="cup-description">
                        Create users manually or upload
                        multiple users using the prescribed
                        Excel format.
                    </p>

                </header>


                {/* =================================================
                    Main Card
                ================================================= */}

                <div className="cup-form-card">

                    {/* =================================================
                        Entry Mode
                    ================================================= */}

                    <div className="cup-mode-switch">

                        <button
                            type="button"
                            className={`cup-mode-btn ${
                                entryMode === "manual"
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() =>
                                setEntryMode(
                                    "manual"
                                )
                            }
                            disabled={
                                userCreating ||
                                bulkUploading
                            }
                        >
                            Manual Entry
                        </button>

                        <button
                            type="button"
                            className={`cup-mode-btn ${
                                entryMode === "bulk"
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() =>
                                setEntryMode(
                                    "bulk"
                                )
                            }
                            disabled={
                                userCreating ||
                                bulkUploading
                            }
                        >
                            Bulk Upload
                        </button>

                    </div>


                    {/* =================================================
                        Manual Entry
                    ================================================= */}

                    {entryMode === "manual" && (

                        <form
                            className="cup-mode-content"
                            onSubmit={
                                handleCreateUser
                            }
                        >

                            <div className="cup-section-heading">

                                <span className="cup-section-eyebrow">
                                    ACCOUNT SETUP
                                </span>

                                <h2 className="cup-section-title">
                                    Create User Manually
                                </h2>

                                <p className="cup-section-description">
                                    Enter the user's basic
                                    information and assign
                                    a system role. The user
                                    will create their password
                                    during account activation.
                                </p>

                            </div>


                            {/* =================================================
                                User Type Selector
                            ================================================= */}

                            <div className="cup-field">

                                <label className="cup-field-label">
                                    Select User Type
                                </label>

                                <div className="cup-role-switch">

                                    <button
                                        type="button"
                                        className={`cup-role-btn ${
                                            role === "Candidate"
                                                ? "active"
                                                : ""
                                        }`}
                                        onClick={() =>
                                            setRole(
                                                "Candidate"
                                            )
                                        }
                                        disabled={
                                            userCreating ||
                                            bulkUploading
                                        }
                                    >
                                        Candidate
                                    </button>

                                    <button
                                        type="button"
                                        className={`cup-role-btn ${
                                            role === "Examiner"
                                                ? "active"
                                                : ""
                                        }`}
                                        onClick={() =>
                                            setRole(
                                                "Examiner"
                                            )
                                        }
                                        disabled={
                                            userCreating ||
                                            bulkUploading
                                        }
                                    >
                                        Examiner
                                    </button>

                                </div>

                            </div>


                            {/* =================================================
                                Full Name
                            ================================================= */}

                            <div className="cup-field">

                                <label
                                    className="cup-field-label"
                                    htmlFor="user-name"
                                >
                                    Full Name
                                </label>

                                <input
                                    id="user-name"
                                    className="cup-form-input"
                                    type="text"
                                    placeholder="Enter full name"
                                    value={name}
                                    onChange={(event) =>
                                        setName(
                                            event.target.value
                                        )
                                    }
                                    disabled={
                                        userCreating ||
                                        bulkUploading
                                    }
                                    required
                                />

                            </div>


                            {/* =================================================
                                Email
                            ================================================= */}

                            <div className="cup-field">

                                <label
                                    className="cup-field-label"
                                    htmlFor="user-email"
                                >
                                    Email Address
                                </label>

                                <input
                                    id="user-email"
                                    className="cup-form-input"
                                    type="email"
                                    placeholder="Enter email address"
                                    value={email}
                                    onChange={(event) =>
                                        setEmail(
                                            event.target.value
                                        )
                                    }
                                    disabled={
                                        userCreating ||
                                        bulkUploading
                                    }
                                    required
                                />

                            </div>


                            <p className="cup-form-hint">
                                The account will be created
                                with a Pending status. The
                                user will set their password
                                through the activation link
                                sent to their email address.
                            </p>


                            {/* =================================================
                                Create Button
                            ================================================= */}

                            <button
                                type="submit"
                                className="cup-create-btn"
                                disabled={
                                    userCreating ||
                                    bulkUploading
                                }
                            >
                                {userCreating
                                    ? "Creating User..."
                                    : "Create User"}
                            </button>

                        </form>

                    )}


                    {/* =================================================
                        Bulk Upload
                    ================================================= */}

                    {entryMode === "bulk" && (

                        <div className="cup-mode-content">

                            <div className="cup-section-heading">

                                <span className="cup-section-eyebrow">
                                    USER IMPORT
                                </span>

                                <h2 className="cup-section-title">
                                    Bulk Upload Users
                                </h2>

                                <p className="cup-section-description">
                                    Upload multiple Candidates
                                    or Examiners using the
                                    prescribed Excel format.
                                </p>

                            </div>


                            {/* =================================================
                                User Type
                            ================================================= */}

                            <div className="cup-field">

                                <label className="cup-field-label">
                                    Select User Type
                                </label>

                                <div className="cup-role-switch">

                                    <button
                                        type="button"
                                        className={`cup-role-btn ${
                                            role === "Candidate"
                                                ? "active"
                                                : ""
                                        }`}
                                        onClick={() =>
                                            setRole(
                                                "Candidate"
                                            )
                                        }
                                        disabled={
                                            bulkUploading ||
                                            userCreating
                                        }
                                    >
                                        Candidate
                                    </button>

                                    <button
                                        type="button"
                                        className={`cup-role-btn ${
                                            role === "Examiner"
                                                ? "active"
                                                : ""
                                        }`}
                                        onClick={() =>
                                            setRole(
                                                "Examiner"
                                            )
                                        }
                                        disabled={
                                            bulkUploading ||
                                            userCreating
                                        }
                                    >
                                        Examiner
                                    </button>

                                </div>

                            </div>


                            {/* =================================================
                                Excel Format
                            ================================================= */}

                            <div className="cup-format-card">

                                <div className="cup-format-title">
                                    Required Excel Columns
                                </div>

                                <div className="cup-column-list">

                                    <span>
                                        Name
                                    </span>

                                    <span>
                                        Email
                                    </span>

                                </div>

                                <p className="cup-format-note">
                                    The selected role will be
                                    assigned to every user in
                                    the uploaded file. Each email
                                    address must be unique and
                                    valid.
                                </p>

                            </div>


                            {/* =================================================
                                File Upload
                            ================================================= */}

                            <label className="cup-field-label">
                                Users Excel File
                            </label>

                            <div className="cup-upload-box">

                                <input
                                    id="bulk-user-file"
                                    className="cup-file-input"
                                    type="file"
                                    accept=".xlsx"
                                    onChange={
                                        handleBulkFileChange
                                    }
                                    disabled={
                                        bulkUploading ||
                                        userCreating
                                    }
                                />

                                <label
                                    htmlFor="bulk-user-file"
                                    className="cup-file-label"
                                >
                                    Choose Excel File
                                </label>

                                <div className="cup-file-info">

                                    {bulkFile ? (

                                        <>
                                            <strong>
                                                {
                                                    bulkFile.name
                                                }
                                            </strong>

                                            <span>
                                                Excel file
                                                ready for
                                                upload
                                            </span>
                                        </>

                                    ) : (

                                        <>
                                            <strong>
                                                No file selected
                                            </strong>

                                            <span>
                                                Only .xlsx
                                                files are
                                                supported
                                            </span>
                                        </>

                                    )}

                                </div>

                            </div>


                            {/* =================================================
                                Upload Button
                            ================================================= */}

                            <button
                                type="button"
                                className="cup-upload-btn"
                                onClick={
                                    handleBulkUpload
                                }
                                disabled={
                                    bulkUploading ||
                                    userCreating
                                }
                            >
                                {bulkUploading
                                    ? "Uploading Users..."
                                    : "Upload Users"}
                            </button>

                        </div>

                    )}

                </div>

            </main>

        </div>
    );
}

export default CreateUserPage;