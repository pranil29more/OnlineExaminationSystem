import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PageLoader from "../components/PageLoader";

function RoleRoute({
    children,
    allowedRoles
}) {
    const {
        role,
        loading
    } = useAuth();

    if (loading) {
        return (
            <PageLoader
                message="Verifying Access..."
            />
        );
    }

    if (!role) {
        return (
            <Navigate
                to="/"
                replace
            />
        );
    }

    if (
        !allowedRoles.includes(role)
    ) {
        return (
            <Navigate
                to="/exams"
                replace
            />
        );
    }

    return children;
}

export default RoleRoute;
