import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";
import API_BASE_URL from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({
    children
}) {
    const [user, setUser] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        const token =
            localStorage.getItem("token");

        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(
                `${API_BASE_URL}/profile`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                setUser(null);
                setLoading(false);
                return;
            }

            const data =
                await response.json();

            setUser(data);
        } catch (error) {
            console.error(error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = (
        token,
        userData
    ) => {
        localStorage.setItem(
            "token",
            token
        );

        localStorage.setItem(
            "userEmail",
            userData.email
        );

        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem(
            "token"
        );

        localStorage.removeItem(
            "userEmail"
        );

        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                role: user?.role || "",
                loading,
                login,
                logout,
                loadUser
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(
        AuthContext
    );
}