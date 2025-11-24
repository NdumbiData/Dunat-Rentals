'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '@prisma/client';
import { getCurrentUser, logout as logoutAction } from '@/app/actions/auth';

interface AuthContextType {
    user: User | null;
    logout: () => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const currentUser = await getCurrentUser();
                if (currentUser) {
                    setUser(currentUser as User);
                }
            } catch (error) {
                console.error('Session check failed:', error);
            } finally {
                setLoading(false);
            }
        };
        checkSession();
    }, []);

    const logout = async () => {
        await logoutAction();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, logout, loading }}>
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
