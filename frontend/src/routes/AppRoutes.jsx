import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import DashboardPage from "../pages/DashboardPage";
import UsersPage from "../pages/UsersPage";
import QuestionAnalyticsPage from "../pages/QuestionAnalyticsPage";
import ExamAnalyticsPage from "../pages/ExamAnalyticsPage";
import ExamsPage from "../pages/ExamsPage";
import ExamDetailsPage from "../pages/ExamDetailsPage";
import ResultsPage from "../pages/ResultsPage";
import ResultDetailsPage from "../pages/ResultDetailsPage";
import ProfilePage from "../pages/ProfilePage";

import CreateExamPage from "../pages/CreateExamPage";
import AddQuestionPage from "../pages/AddQuestionPage";

import AdminRoute from "./AdminRoute";
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

function AppRoutes() {

  return (

    <BrowserRouter>

      <ScrollToTop />

      <Routes>

        <Route
          path="/"
          element={<LoginPage />}
        />

        <Route
          path="/register"
          element={<RegisterPage />}
        />

        <Route
          path="/dashboard"
          element={
            <AdminRoute>
              <DashboardPage />
            </AdminRoute>
          }
        />

        <Route
          path="/users"
          element={
            <AdminRoute>
              <UsersPage />
            </AdminRoute>
          }
        />

        {/* <Route
          path="/question-analytics"
          element={
            <AdminRoute>
              <QuestionAnalyticsPage />
            </AdminRoute>
          }
        /> */}

        <Route
          path="/submission-analytics"
          element={
            <AdminRoute>
              <SubmissionAnalyticsPage />
            </AdminRoute>
          }
        />

        <Route
          path="/exam-analytics"
          element={
            <AdminRoute>
              <ExamAnalyticsPage />
            </AdminRoute>
          }
        />

        <Route
          path="/exams"
          element={<ExamsPage />}
        />

        <Route
          path="/exam/:examId"
          element={<ExamDetailsPage />}
        />

        <Route
          path="/results"
          element={<ResultsPage />}
        />

        <Route
          path="/result/:submissionId"
          element={<ResultDetailsPage />}
        />

        <Route
          path="/results/exam/:examId"
          element={
            <AdminRoute>
              <ExamResultsPage />
            </AdminRoute>
          }
        />

        <Route
          path="/profile"
          element={<ProfilePage />}
        />

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
          path="/batch-management"
          element={
            <AdminRoute>
              <BatchManagementPage />
            </AdminRoute>
          }
        />

        <Route
          path="/create-batch"
          element={
            <AdminRoute>
              <CreateBatchPage />
            </AdminRoute>
          }
        />

        <Route
          path="/edit-batch/:batchId"
          element={
            <AdminRoute>
              <EditBatchPage />
            </AdminRoute>
          }
        />

        <Route
          path="/batch-details/:batchId"
          element={
            <AdminRoute>
              <BatchDetailsPage />
            </AdminRoute>
          }
        />

        <Route
          path="/candidate-results/:userId"
          element={
            <AdminRoute>
              <CandidateResultsPage />
            </AdminRoute>
          }
        />

      </Routes>

    </BrowserRouter>

  );

}

export default AppRoutes;