import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { IoEyeOutline } from "react-icons/io5";

import API_BASE_URL from "../services/api";
import Navbar from "../components/Navbar";

import "../styles/UsersPage.css";

function UsersPage() {

    const [users, setUsers] =
        useState([]);

    const [examinerSearch, setExaminerSearch] =
        useState("");

    const [candidateSearch, setCandidateSearch] =
        useState("");

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

        navigate("/create-user");

    };


    const handleViewHistory = (
        userId
    ) => {

        navigate(
            `/candidate-results/${userId}`
        );

    };


    const handleToggleStatus = async (
        userId
    ) => {

        const selectedUser =
            users.find(
                (user) =>
                    user.user_id === userId
            );

        if (
            !selectedUser ||
            selectedUser.account_status ===
                "Pending"
        ) {

            return;

        }

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


    const handleCancelActivation = async (
        userId
    ) => {

        const confirmCancel =
            window.confirm(
                "Are you sure you want to cancel this account activation?"
            );

        if (!confirmCancel) {

            return;

        }

        setLoadingAction(
            `cancel-${userId}`
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
                    "Unable to cancel account activation."
                );

                return;
            }

            alert(
                "Activation cancelled successfully."
            );

            await fetchUsers();

        } catch (error) {

            console.error(error);

            alert(
                "Unable to cancel account activation."
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


    const examiners =
        users.filter(
            (user) =>
                user.role === "Examiner"
        );


    const candidates =
        users.filter(
            (user) =>
                user.role === "Candidate"
        );


    const examinerSearchTerm =
        examinerSearch
            .toLowerCase()
            .trim();


    const candidateSearchTerm =
        candidateSearch
            .toLowerCase()
            .trim();


    const filteredExaminers =
        examiners.filter((user) => {

            const userName =
                (user.name || "")
                    .toLowerCase();

            const userEmail =
                (user.email || "")
                    .toLowerCase();

            return (
                userName.includes(
                    examinerSearchTerm
                ) ||
                userEmail.includes(
                    examinerSearchTerm
                )
            );

        });


    const filteredCandidates =
        candidates.filter((user) => {

            const userName =
                (user.name || "")
                    .toLowerCase();

            const userEmail =
                (user.email || "")
                    .toLowerCase();

            return (
                userName.includes(
                    candidateSearchTerm
                ) ||
                userEmail.includes(
                    candidateSearchTerm
                )
            );

        });


    const activeExaminers =
        filteredExaminers.filter(
            (user) =>
                user.account_status ===
                "Active"
        );


    const pendingExaminers =
        filteredExaminers.filter(
            (user) =>
                user.account_status ===
                "Pending"
        );


    const activeCandidates =
        filteredCandidates.filter(
            (user) =>
                user.account_status ===
                "Active"
        );


    const pendingCandidates =
        filteredCandidates.filter(
            (user) =>
                user.account_status ===
                "Pending"
        );


    const getStatusClass = (
        user
    ) => {

        if (
            user.account_status ===
            "Pending"
        ) {

            return "pending";

        }

        if (
            user.account_status ===
                "Active" &&
            Boolean(user.is_active)
        ) {

            return "active";

        }

        return "inactive";

    };


    const getStatusLabel = (
        user
    ) => {

        if (
            user.account_status ===
            "Pending"
        ) {

            return "PENDING";

        }

        if (
            user.account_status ===
                "Active" &&
            Boolean(user.is_active)
        ) {

            return "ACTIVE";

        }

        return "DEACTIVATED";

    };


    const renderUserTable = (
        userList,
        type
    ) => {

        const isPendingTable =
            type === "pending";

        const emptyMessage =
            isPendingTable
                ? "No pending accounts found."
                : "No active accounts found.";

        return (

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

                        {userList.length === 0 ? (

                            <tr>

                                <td
                                    colSpan="4"
                                    className="ump-table-empty"
                                >
                                    {emptyMessage}
                                </td>

                            </tr>

                        ) : (

                            userList.map(
                                (user) => {

                                    const statusLoading =
                                        loadingAction ===
                                        `status-${user.user_id}`;

                                    const deleteLoading =
                                        loadingAction ===
                                        `delete-${user.user_id}`;

                                    const cancelLoading =
                                        loadingAction ===
                                        `cancel-${user.user_id}`;

                                    const isActive =
                                        Boolean(
                                            user.is_active
                                        );

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
                                                    className={`ump-status-badge ${getStatusClass(
                                                        user
                                                    )}`}
                                                >
                                                    {getStatusLabel(
                                                        user
                                                    )}
                                                </span>

                                            </td>


                                            <td>

                                                <div className="ump-table-actions">

                                                    {isPendingTable ? (

                                                        <button
                                                            type="button"
                                                            className="ump-cancel-activation-btn"
                                                            onClick={() =>
                                                                handleCancelActivation(
                                                                    user.user_id
                                                                )
                                                            }
                                                            disabled={
                                                                cancelLoading
                                                            }
                                                        >
                                                            {cancelLoading
                                                                ? "Cancelling..."
                                                                : "Cancel Activation"}
                                                        </button>

                                                    ) : (

                                                        <>

                                                            {user.role ===
                                                                "Candidate" && (

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

                                                            )}


                                                            <button
                                                                type="button"
                                                                className={
                                                                    isActive
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
                                                                    ? isActive
                                                                        ? "Deactivating..."
                                                                        : "Activating..."
                                                                    : isActive
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

                                                        </>

                                                    )}

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

        );

    };


    return (

        <div className="ump-page">

            <Navbar />


            <main className="ump-page-container">


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


                <section className="ump-section">

                    <div className="ump-section-header">

                        <div>

                            <h2 className="ump-section-title">
                                Examiners
                            </h2>

                            <p className="ump-section-description">
                                Manage examiner
                                accounts and
                                account activation
                                status.
                            </p>

                        </div>


                        <span className="ump-count-badge">
                            {examiners.length}{" "}
                            {examiners.length === 1
                                ? "Examiner"
                                : "Examiners"}
                        </span>

                    </div>


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

                    </div>


                    <div className="ump-subsection">

                        <div className="ump-subsection-header">

                            <div>

                                <span className="ump-subsection-eyebrow">
                                    ACCOUNT STATUS
                                </span>

                                <h3 className="ump-subsection-title">
                                    Active Examiners
                                </h3>

                                <p className="ump-subsection-description">
                                    Activated examiner
                                    accounts currently
                                    available in the
                                    system.
                                </p>

                            </div>

                            <span className="ump-subsection-count active">
                                {activeExaminers.length}
                            </span>

                        </div>


                        {renderUserTable(
                            activeExaminers,
                            "active"
                        )}

                    </div>


                    <div className="ump-subsection">

                        <div className="ump-subsection-header">

                            <div>

                                <span className="ump-subsection-eyebrow pending">
                                    ACCOUNT ACTIVATION
                                </span>

                                <h3 className="ump-subsection-title">
                                    Pending Examiners
                                </h3>

                                <p className="ump-subsection-description">
                                    Examiner accounts
                                    waiting for email
                                    activation.
                                </p>

                            </div>

                            <span className="ump-subsection-count pending">
                                {pendingExaminers.length}
                            </span>

                        </div>


                        {renderUserTable(
                            pendingExaminers,
                            "pending"
                        )}

                    </div>

                </section>


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

                    </div>


                    <div className="ump-subsection">

                        <div className="ump-subsection-header">

                            <div>

                                <span className="ump-subsection-eyebrow">
                                    ACCOUNT STATUS
                                </span>

                                <h3 className="ump-subsection-title">
                                    Active Candidates
                                </h3>

                                <p className="ump-subsection-description">
                                    Activated candidate
                                    accounts currently
                                    available in the
                                    system.
                                </p>

                            </div>

                            <span className="ump-subsection-count active">
                                {activeCandidates.length}
                            </span>

                        </div>


                        {renderUserTable(
                            activeCandidates,
                            "active"
                        )}

                    </div>


                    <div className="ump-subsection">

                        <div className="ump-subsection-header">

                            <div>

                                <span className="ump-subsection-eyebrow pending">
                                    ACCOUNT ACTIVATION
                                </span>

                                <h3 className="ump-subsection-title">
                                    Pending Candidates
                                </h3>

                                <p className="ump-subsection-description">
                                    Candidate accounts
                                    waiting for email
                                    activation.
                                </p>

                            </div>

                            <span className="ump-subsection-count pending">
                                {pendingCandidates.length}
                            </span>

                        </div>


                        {renderUserTable(
                            pendingCandidates,
                            "pending"
                        )}

                    </div>

                </section>

            </main>

        </div>

    );

}

export default UsersPage;