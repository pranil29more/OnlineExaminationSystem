import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { IoEyeOutline } from "react-icons/io5";

import API_BASE_URL from "../services/api";
import Navbar from "../components/Navbar";

import "../styles/UsersPage.css";

function UsersPage() {
    const [users, setUsers] = useState([]);

    const [examinerSearch, setExaminerSearch] =
        useState("");

    const [candidateSearch, setCandidateSearch] =
        useState("");

    const [examinerStatus, setExaminerStatus] =
        useState("All");

    const [candidateStatus, setCandidateStatus] =
        useState("All");

    const [loadingAction, setLoadingAction] =
        useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token =
                localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/users`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                alert(
                    data.message ||
                        "Unable to load users."
                );

                return;
            }

            setUsers(data);
        } catch (error) {
            console.error(error);

            alert(
                "Unable to load users."
            );
        }
    };

    const handleCreateUser = () => {
        setLoadingAction(
            "create-user"
        );

        navigate("/create-user");
    };

    const handleViewHistory = (
        userId
    ) => {
        setLoadingAction(
            `history-${userId}`
        );

        navigate(
            `/candidate-results/${userId}`
        );
    };

    const handleToggleStatus = async (
        userId
    ) => {
        setLoadingAction(
            `status-${userId}`
        );

        try {
            const token =
                localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/toggle-user-status/${userId}`,
                {
                    method: "PUT",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                alert(
                    data.message ||
                        "Unable to update user status."
                );

                return;
            }

            alert(
                data.message ||
                    "User status updated successfully."
            );

            await fetchUsers();
        } catch (error) {
            console.error(error);

            alert(
                "Unable to update user status."
            );
        } finally {
            setLoadingAction(null);
        }
    };

    const handleDeleteUser = async (
        userId
    ) => {
        const confirmDelete =
            window.confirm(
                "Are you sure you want to delete this user?"
            );

        if (!confirmDelete) {
            return;
        }

        setLoadingAction(
            `delete-${userId}`
        );

        try {
            const token =
                localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/delete-user/${userId}`,
                {
                    method: "DELETE",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                alert(
                    data.message ||
                        "Unable to delete user."
                );

                return;
            }

            alert(
                data.message ||
                    "User deleted successfully."
            );

            await fetchUsers();
        } catch (error) {
            console.error(error);

            alert(
                "Unable to delete user."
            );
        } finally {
            setLoadingAction(null);
        }
    };

    const examiners = users.filter(
        (user) =>
            user.role === "Examiner"
    );

    const candidates = users.filter(
        (user) =>
            user.role === "Candidate"
    );

    const filteredExaminers =
        examiners.filter((user) => {
            const matchesSearch =
                user.name
                    .toLowerCase()
                    .includes(
                        examinerSearch.toLowerCase()
                    ) ||
                user.email
                    .toLowerCase()
                    .includes(
                        examinerSearch.toLowerCase()
                    );

            const matchesStatus =
                examinerStatus === "All" ||
                (examinerStatus === "Active" &&
                    user.is_active) ||
                (examinerStatus === "Inactive" &&
                    !user.is_active);

            return (
                matchesSearch &&
                matchesStatus
            );
        });

    const filteredCandidates =
        candidates.filter((user) => {
            const matchesSearch =
                user.name
                    .toLowerCase()
                    .includes(
                        candidateSearch.toLowerCase()
                    ) ||
                user.email
                    .toLowerCase()
                    .includes(
                        candidateSearch.toLowerCase()
                    );

            const matchesStatus =
                candidateStatus === "All" ||
                (candidateStatus === "Active" &&
                    user.is_active) ||
                (candidateStatus === "Inactive" &&
                    !user.is_active);

            return (
                matchesSearch &&
                matchesStatus
            );
        });

    return (
        <div className="ump-page">

            <Navbar />


            <main className="ump-page-container">

                {/* =================================================
                    Page Header
                ================================================= */}

                <div className="ump-page-header">

                    <div>

                        <span className="ump-page-eyebrow">
                            ACCESS CONTROL
                        </span>

                        <h1 className="ump-page-title">
                            User Management
                        </h1>

                        <p className="ump-page-description">
                            Manage examiners and
                            candidates, control
                            account status, and
                            review candidate
                            assessment history.
                        </p>

                    </div>


                    <button
    type="button"
    className="ump-create-user-btn"
    onClick={
        handleCreateUser
    }
>
    + Create User
</button>

                </div>


                {/* =================================================
                    Examiners
                ================================================= */}

                <section className="ump-section">

                    <div className="ump-section-header">

                        <div>

                            <h2 className="ump-section-title">
                                Examiners
                            </h2>

                            <p className="ump-section-description">
                                Manage examiner
                                accounts and
                                account status.
                            </p>

                        </div>


                        <span className="ump-count-badge">
                            {examiners.length}{" "}
                            {examiners.length === 1
                                ? "Examiner"
                                : "Examiners"}
                        </span>

                    </div>


                    {/* =================================================
                        Examiner Controls
                    ================================================= */}

                    <div className="ump-table-controls">

                        <input
                            type="text"
                            className="ump-search"
                            placeholder="🔍 Search examiner by name or email..."
                            value={
                                examinerSearch
                            }
                            onChange={(event) =>
                                setExaminerSearch(
                                    event.target.value
                                )
                            }
                        />


                        <select
                            className="ump-status-filter"
                            value={
                                examinerStatus
                            }
                            onChange={(event) =>
                                setExaminerStatus(
                                    event.target.value
                                )
                            }
                        >

                            <option value="All">
                                All Status
                            </option>

                            <option value="Active">
                                Active
                            </option>

                            <option value="Inactive">
                                Inactive
                            </option>

                        </select>

                    </div>


                    {/* =================================================
                        Examiner Table
                    ================================================= */}

                    <div className="ump-table-wrapper">

                        <table className="ump-table">

                            <thead>

                                <tr>

                                    <th>
                                        Name
                                    </th>

                                    <th>
                                        Email
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Actions
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {filteredExaminers.length ===
                                0 ? (

                                    <tr>

                                        <td
                                            colSpan="4"
                                            className="ump-table-empty"
                                        >
                                            No examiners
                                            match your
                                            search or
                                            selected
                                            status.
                                        </td>

                                    </tr>

                                ) : (

                                    filteredExaminers.map(
                                        (user) => {

                                            const statusLoading =
                                                loadingAction ===
                                                `status-${user.user_id}`;

                                            const deleteLoading =
                                                loadingAction ===
                                                `delete-${user.user_id}`;

                                            return (

                                                <tr
                                                    key={
                                                        user.user_id
                                                    }
                                                >

                                                    <td>

                                                        <strong className="ump-user-name">
                                                            {
                                                                user.name
                                                            }
                                                        </strong>

                                                    </td>


                                                    <td>

                                                        <span className="ump-user-email">
                                                            {
                                                                user.email
                                                            }
                                                        </span>

                                                    </td>


                                                    <td>

                                                        <span
                                                            className={`ump-status-badge ${
                                                                user.is_active
                                                                    ? "active"
                                                                    : "inactive"
                                                            }`}
                                                        >
                                                            {user.is_active
                                                                ? "ACTIVE"
                                                                : "INACTIVE"}
                                                        </span>

                                                    </td>


                                                    <td>

                                                        <div className="ump-table-actions">

                                                            <button
                                                                type="button"
                                                                className={
                                                                    user.is_active
                                                                        ? "ump-deactivate-btn"
                                                                        : "ump-activate-btn"
                                                                }
                                                                onClick={() =>
                                                                    handleToggleStatus(
                                                                        user.user_id
                                                                    )
                                                                }
                                                                disabled={
                                                                    statusLoading ||
                                                                    deleteLoading
                                                                }
                                                            >
                                                                {statusLoading
                                                                    ? user.is_active
                                                                        ? "Deactivating..."
                                                                        : "Activating..."
                                                                    : user.is_active
                                                                        ? "Deactivate"
                                                                        : "Activate"}
                                                            </button>


                                                            <button
                                                                type="button"
                                                                className="ump-delete-btn"
                                                                onClick={() =>
                                                                    handleDeleteUser(
                                                                        user.user_id
                                                                    )
                                                                }
                                                                disabled={
                                                                    statusLoading ||
                                                                    deleteLoading
                                                                }
                                                            >
                                                                {deleteLoading
                                                                    ? "Deleting..."
                                                                    : "Delete"}
                                                            </button>

                                                        </div>

                                                    </td>

                                                </tr>

                                            );
                                        }
                                    )

                                )}

                            </tbody>

                        </table>

                    </div>

                </section>


                {/* =================================================
                    Candidates
                ================================================= */}

                <section className="ump-section">

                    <div className="ump-section-header">

                        <div>

                            <h2 className="ump-section-title">
                                Candidates
                            </h2>

                            <p className="ump-section-description">
                                Manage candidate
                                accounts and
                                review their
                                complete
                                assessment history.
                            </p>

                        </div>


                        <span className="ump-count-badge">
                            {candidates.length}{" "}
                            {candidates.length === 1
                                ? "Candidate"
                                : "Candidates"}
                        </span>

                    </div>


                    {/* =================================================
                        Candidate Controls
                    ================================================= */}

                    <div className="ump-table-controls">

                        <input
                            type="text"
                            className="ump-search"
                            placeholder="🔍 Search candidate by name or email..."
                            value={
                                candidateSearch
                            }
                            onChange={(event) =>
                                setCandidateSearch(
                                    event.target.value
                                )
                            }
                        />


                        <select
                            className="ump-status-filter"
                            value={
                                candidateStatus
                            }
                            onChange={(event) =>
                                setCandidateStatus(
                                    event.target.value
                                )
                            }
                        >

                            <option value="All">
                                All Status
                            </option>

                            <option value="Active">
                                Active
                            </option>

                            <option value="Inactive">
                                Inactive
                            </option>

                        </select>

                    </div>


                    {/* =================================================
                        Candidate Table
                    ================================================= */}

                    <div className="ump-table-wrapper">

                        <table className="ump-table">

                            <thead>

                                <tr>

                                    <th>
                                        Name
                                    </th>

                                    <th>
                                        Email
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Actions
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {filteredCandidates.length ===
                                0 ? (

                                    <tr>

                                        <td
                                            colSpan="4"
                                            className="ump-table-empty"
                                        >
                                            No candidates
                                            match your
                                            search or
                                            selected
                                            status.
                                        </td>

                                    </tr>

                                ) : (

                                    filteredCandidates.map(
                                        (user) => {

                                            const historyLoading =
                                                loadingAction ===
                                                `history-${user.user_id}`;

                                            const statusLoading =
                                                loadingAction ===
                                                `status-${user.user_id}`;

                                            const deleteLoading =
                                                loadingAction ===
                                                `delete-${user.user_id}`;

                                            return (

                                                <tr
                                                    key={
                                                        user.user_id
                                                    }
                                                >

                                                    <td>

                                                        <strong className="ump-user-name">
                                                            {
                                                                user.name
                                                            }
                                                        </strong>

                                                    </td>


                                                    <td>

                                                        <span className="ump-user-email">
                                                            {
                                                                user.email
                                                            }
                                                        </span>

                                                    </td>


                                                    <td>

                                                        <span
                                                            className={`ump-status-badge ${
                                                                user.is_active
                                                                    ? "active"
                                                                    : "inactive"
                                                            }`}
                                                        >
                                                            {user.is_active
                                                                ? "ACTIVE"
                                                                : "INACTIVE"}
                                                        </span>

                                                    </td>


                                                    <td>

                                                        <div className="ump-table-actions">

                                                            <button
    type="button"
    className="ump-history-btn"
    onClick={() =>
        handleViewHistory(
            user.user_id
        )
    }
    disabled={
        statusLoading ||
        deleteLoading
    }
>
    <IoEyeOutline
        className="ump-history-icon"
    />

    <span>
        View History
    </span>
</button>


                                                            <button
                                                                type="button"
                                                                className={
                                                                    user.is_active
                                                                        ? "ump-deactivate-btn"
                                                                        : "ump-activate-btn"
                                                                }
                                                                onClick={() =>
                                                                    handleToggleStatus(
                                                                        user.user_id
                                                                    )
                                                                }
                                                                disabled={
                                                                    historyLoading ||
                                                                    statusLoading ||
                                                                    deleteLoading
                                                                }
                                                            >
                                                                {statusLoading
                                                                    ? user.is_active
                                                                        ? "Deactivating..."
                                                                        : "Activating..."
                                                                    : user.is_active
                                                                        ? "Deactivate"
                                                                        : "Activate"}
                                                            </button>


                                                            <button
                                                                type="button"
                                                                className="ump-delete-btn"
                                                                onClick={() =>
                                                                    handleDeleteUser(
                                                                        user.user_id
                                                                    )
                                                                }
                                                                disabled={
                                                                    historyLoading ||
                                                                    statusLoading ||
                                                                    deleteLoading
                                                                }
                                                            >
                                                                {deleteLoading
                                                                    ? "Deleting..."
                                                                    : "Delete"}
                                                            </button>

                                                        </div>

                                                    </td>

                                                </tr>

                                            );
                                        }
                                    )

                                )}

                            </tbody>

                        </table>

                    </div>

                </section>

            </main>

        </div>
    );
}

export default UsersPage;