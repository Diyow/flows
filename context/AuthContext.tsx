'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    Auth
} from 'firebase/auth';
import { auth, isFirebaseConfigured, initializeFirebase } from '@/lib/firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isConfigured, setIsConfigured] = useState(false);
    const [firebaseAuth, setFirebaseAuth] = useState<Auth | null>(null);

    useEffect(() => {
        // Initialize Firebase and get auth instance
        if (typeof window === 'undefined') {
            setLoading(false);
            return;
        }

        const configured = isFirebaseConfigured();
        setIsConfigured(configured);

        if (!configured) {
            setLoading(false);
            return;
        }

        const { auth: authInstance } = initializeFirebase();

        if (!authInstance) {
            setLoading(false);
            return;
        }

        setFirebaseAuth(authInstance);

        // Listen for auth state changes
        const unsubscribe = onAuthStateChanged(authInstance, (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        if (!firebaseAuth) {
            throw new Error('Firebase Auth is not configured');
        }
        await signInWithEmailAndPassword(firebaseAuth, email, password);
    };

    const signOut = async () => {
        if (!firebaseAuth) {
            throw new Error('Firebase Auth is not configured');
        }
        await firebaseSignOut(firebaseAuth);
    };

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signOut, isConfigured }}>
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
