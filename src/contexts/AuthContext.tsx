import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminService, AdminUser } from '../services/adminService';

interface AuthContextType {
    user: AdminUser | null;
    isLoggedIn: boolean;
    userRole: string;
    login: (role: string, userId: string) => void;
    logout: () => void;
    refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AdminUser | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("isLoggedIn") === "true");
    const [userRole, setUserRole] = useState(() => localStorage.getItem("userRole") || "student");
    const [userId, setUserId] = useState(() => localStorage.getItem("userId") || "");

    useEffect(() => {
        if (isLoggedIn && userId) {
            const fetchedUser = adminService.getUser(userId);
            if (fetchedUser) {
                setUser(fetchedUser);
            } else {
                logout(); // User no longer exists
            }
        }
    }, [isLoggedIn, userId]);

    const login = (role: string, id: string) => {
        setIsLoggedIn(true);
        setUserRole(role);
        setUserId(id);
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userRole", role);
        localStorage.setItem("userId", id);

        const fetchedUser = adminService.getUser(id);
        if (fetchedUser) setUser(fetchedUser);
    };

    const logout = () => {
        setIsLoggedIn(false);
        setUserRole("student");
        setUserId("");
        setUser(null);
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userId");
    };

    const refreshUser = () => {
        if (userId) {
            const fetchedUser = adminService.getUser(userId);
            if (fetchedUser) setUser(fetchedUser);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoggedIn, userRole, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
