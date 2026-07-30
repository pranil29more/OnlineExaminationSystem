import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API_BASE_URL from "../services/api";
import PageLoader from "../components/PageLoader";

function AdminRoute({
  children
}) {

  const [loading, setLoading] = useState(true);

  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {

    checkAccess();

  }, []);

  const checkAccess = async () => {

    try {

      const token = localStorage.getItem("token");

      if (!token) {

        setLoading(false);

        return;

      }

      const response = await fetch(
        `${API_BASE_URL}/profile`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (
        data.role === "Admin" ||
        data.role === "Examiner"
      ) {
        setAuthorized(true);
      }

    } catch (error) {

      console.error(error);

    }

    setLoading(false);

  };

  if (loading) {

    return (

        <PageLoader message="Verifying Access..." />

    );

}

  if (!authorized) {
    return <Navigate to="/exams" replace />;
  }

  return children;

}

export default AdminRoute;
