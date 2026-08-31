import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import ActivateAccountPage from "../pages/ActivateAccountPage";
import DashboardPage from "../pages/DashboardPage";
import UsersPage from "../pages/UsersPage";
import ExamAnalyticsPage from "../pages/ExamAnalyticsPage";
import ExamsPage from "../pages/ExamsPage";
import ExamDetailsPage from "../pages/ExamDetailsPage";
import ResultsPage from "../pages/ResultsPage";
import ResultDetailsPage from "../pages/ResultDetailsPage";
import ProfilePage from "../pages/ProfilePage";
import ChatbotPage from "../pages/ChatbotPage";
import CreateExamPage from "../pages/CreateExamPage";
import AddQuestionPage from "../pages/AddQuestionPage";
import AdminRoute from "./AdminRoute";
import RoleRoute from "./RoleRoute";
import EditExamPage from "../pages/EditExamPage";
import EditQuestionPage from "../pages/EditQuestionPage";
import ExamResultsPage from "../pages/ExamResultsPage";
import SubmissionAnalyticsPage from "../pages/SubmissionAnalyticsPage";
import BatchManagementPage from "../pages/BatchManagementPage";
import CreateBatchPage from "../pages/CreateBatchPage";
import EditBatchPage from "../pages/EditBatchPage";
import BatchDetailsPage from "../pages/BatchDetailsPage";
import CandidateResultsPage from "../pages/CandidateResultsPage";
import ScrollToTop from "../components/ScrollToTop";
import CreateUserPage from "../pages/CreateUserPage";

function AppRoutes() {
    return (
        <BrowserRouter>

            <ScrollToTop />

            <Routes>

                {/* ==========================================
                    Public Routes
                ========================================== */}

                <Route
                    path="/"
                    element={
                        <LoginPage />
                    }
                />

                <Route
                    path="/activate-account/:activationToken"
                    element={
                        <ActivateAccountPage />
                    }
                />

                {/* ==========================================
                    Admin Only
                ========================================== */}

                <Route
                    path="/dashboard"
                    element={
                        <RoleRoute
                            allowedRoles={[
                                "Admin"
                            ]}
                        >
                            <DashboardPage />
                        </RoleRoute>
                    }
                />

                <Route
                    path="/users"
                    element={
                        <RoleRoute
                            allowedRoles={[
                                "Admin"
                            ]}
                        >
                            <UsersPage />
                        </RoleRoute>
                    }
                />

                <Route
                    path="/create-user"
                    element={
                        <RoleRoute
                            allowedRoles={[
                                "Admin"
                            ]}
                        >
                            <CreateUserPage />
                        </RoleRoute>
                    }
                />

                <Route
                    path="/submission-analytics"
                    element={
                        <RoleRoute
                            allowedRoles={[
                                "Admin"
                            ]}
                        >
                            <SubmissionAnalyticsPage />
                        </RoleRoute>
                    }
                />

                <Route
                    path="/exam-analytics"
                    element={
                        <RoleRoute
                            allowedRoles={[
                                "Admin"
                            ]}
                        >
                            <ExamAnalyticsPage />
                        </RoleRoute>
                    }
                />

                <Route
                    path="/batch-management"
                    element={
                        <RoleRoute
                            allowedRoles={[
                                "Admin"
                            ]}
                        >
                            <BatchManagementPage />
                        </RoleRoute>
                    }
                />

                <Route
                    path="/create-batch"
                    element={
                        <RoleRoute
                            allowedRoles={[
                                "Admin"
                            ]}
                        >
                            <CreateBatchPage />
                        </RoleRoute>
                    }
                />

                <Route
                    path="/edit-batch/:batchId"
                    element={
                        <RoleRoute
                            allowedRoles={[
                                "Admin"
                            ]}
                        >
                            <EditBatchPage />
                        </RoleRoute>
                    }
                />

                <Route
                    path="/batch-details/:batchId"
                    element={
                        <RoleRoute
                            allowedRoles={[
                                "Admin"
                            ]}
                        >
                            <BatchDetailsPage />
                        </RoleRoute>
                    }
                />

                <Route
                    path="/candidate-results/:userId"
                    element={
                        <RoleRoute
                            allowedRoles={[
                                "Admin"
                            ]}
                        >
                            <CandidateResultsPage />
                        </RoleRoute>
                    }
                />

                {/* ==========================================
                    Admin + Examiner
                ========================================== */}

                <Route
                    path="/create-exam"
                    element={
                        <AdminRoute>
                            <CreateExamPage />
                        </AdminRoute>
                    }
                />

                <Route
                    path="/edit-exam/:examId"
                    element={
                        <AdminRoute>
                            <EditExamPage />
                        </AdminRoute>
                    }
                />

                <Route
                    path="/add-question"
                    element={
                        <AdminRoute>
                            <AddQuestionPage />
                        </AdminRoute>
                    }
                />

                <Route
                    path="/edit-question/:questionId"
                    element={
                        <AdminRoute>
                            <EditQuestionPage />
                        </AdminRoute>
                    }
                />

                <Route
                    path="/results/exam/:examId"
                    element={
                        <AdminRoute>
                            <ExamResultsPage />
                        </AdminRoute>
                    }
                />

                {/* ==========================================
                    Admin + Examiner + Candidate
                ========================================== */}

                <Route
                    path="/exams"
                    element={
                        <RoleRoute
                            allowedRoles={[
                                "Admin",
                                "Examiner",
                                "Candidate"
                            ]}
                        >
                            <ExamsPage />
                        </RoleRoute>
                    }
                />

                <Route
                    path="/exam/:examId"
                    element={
                        <RoleRoute
                            allowedRoles={[
                                "Admin",
                                "Examiner",
                                "Candidate"
                            ]}
                        >
                            <ExamDetailsPage />
                        </RoleRoute>
                    }
                />

                <Route
                    path="/results"
                    element={
                        <RoleRoute
                            allowedRoles={[
                                "Admin",
                                "Examiner",
                                "Candidate"
                            ]}
                        >
                            <ResultsPage />
                        </RoleRoute>
                    }
                />

                <Route
                    path="/result/:submissionId"
                    element={
                        <RoleRoute
                            allowedRoles={[
                                "Admin",
                                "Examiner",
                                "Candidate"
                            ]}
                        >
                            <ResultDetailsPage />
                        </RoleRoute>
                    }
                />

                <Route
                    path="/profile"
                    element={
                        <RoleRoute
                            allowedRoles={[
                                "Admin",
                                "Examiner",
                                "Candidate"
                            ]}
                        >
                            <ProfilePage />
                        </RoleRoute>
                    }
                />

                {/* ==========================================
                    Admin Only — Chatbot
                ========================================== */}

                <Route
                    path="/chatbot"
                    element={
                        <RoleRoute
                            allowedRoles={[
                                "Admin"
                            ]}
                        >
                            <ChatbotPage />
                        </RoleRoute>
                    }
                />

            </Routes>

        </BrowserRouter>
    );
}

export default AppRoutes;
