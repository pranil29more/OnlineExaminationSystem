import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.jsx";

import {
    AuthProvider,
    useAuth
} from "./context/AuthContext";

import PageLoader from "./components/PageLoader";

import "./index.css";

function AppInitializer() {
    const { loading } = useAuth();

    if (loading) {
        return (
            <PageLoader
                message="Loading Application..."
            />
        );
    }

    return <App />;
}

createRoot(
    document.getElementById("root")
).render(
    <StrictMode>
        <AuthProvider>
            <AppInitializer />
        </AuthProvider>
    </StrictMode>
);