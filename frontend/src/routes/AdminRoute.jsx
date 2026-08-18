import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PageLoader from "../components/PageLoader";

function AdminRoute({ children }) {
    const { role, loading } = useAuth();

    if (loading) {
        return <PageLoader message="Verifying Access..." />;
    }

    if (role !== "Admin" && role !== "Examiner") {
        return <Navigate to="/exams" replace />;
    }

    return children;
}

export default AdminRoute;