'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    Auth
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { isFirebaseConfigured, initializeFirebase } from '@/lib/firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    isConfigured: boolean;
    isDisabled: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isConfigured, setIsConfigured] = useState(false);
    const [isDisabled, setIsDisabled] = useState(false);
    const [firebaseAuth, setFirebaseAuth] = useState<Auth | null>(null);

    useEffect(() => {
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
        const unsubscribe = onAuthStateChanged(authInstance, async (firebaseUser) => {
            if (firebaseUser) {
                // Check if user is disabled
                const disabled = await checkUserDisabled(firebaseUser.uid);
                setIsDisabled(disabled);

                if (!disabled) {
                    setUser(firebaseUser);
                    // Ensure admin record exists and update last access
                    await ensureAdminRecord(firebaseUser);
                } else {
                    // Sign out disabled users
                    await firebaseSignOut(authInstance);
                    setUser(null);
                }
            } else {
                setUser(null);
                setIsDisabled(false);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Check if user is disabled in Firestore
    const checkUserDisabled = async (uid: string): Promise<boolean> => {
        const { db } = initializeFirebase();
        if (!db) return false;

        try {
            const adminRef = doc(db, 'admins', uid);
            const adminDoc = await getDoc(adminRef);

            if (adminDoc.exists()) {
                return adminDoc.data()?.disabled === true;
            }
            return false; // New users aren't disabled by default
        } catch (err) {
            console.error('Error checking disabled status:', err);
            return false;
        }
    };

    // Ensure admin record exists in Firestore (for existing Auth users)
    const ensureAdminRecord = async (firebaseUser: User) => {
        const { db } = initializeFirebase();
        if (!db) return;

        try {
            const adminRef = doc(db, 'admins', firebaseUser.uid);
            const adminDoc = await getDoc(adminRef);

            if (!adminDoc.exists()) {
                // Create admin record for existing Firebase Auth user
                await setDoc(adminRef, {
                    email: firebaseUser.email || 'Unknown',
                    createdAt: serverTimestamp(),
                    lastAccess: serverTimestamp(),
                    disabled: false,
                    createdBy: 'System (existing account)',
                });
            } else {
                // Update last access time
                await updateDoc(adminRef, {
                    lastAccess: serverTimestamp(),
                });
            }
        } catch (err) {
            console.error('Error ensuring admin record:', err);
        }
    };

    const signIn = async (email: string, password: string) => {
        if (!firebaseAuth) {
            throw new Error('Firebase Auth is not configured');
        }

        const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);

        // Check if user is disabled before completing login
        const disabled = await checkUserDisabled(userCredential.user.uid);
        if (disabled) {
            await firebaseSignOut(firebaseAuth);
            throw new Error('Account is disabled. Contact an administrator.');
        }
    };

    const signOut = async () => {
        if (!firebaseAuth) {
            throw new Error('Firebase Auth is not configured');
        }
        await firebaseSignOut(firebaseAuth);
    };

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signOut, isConfigured, isDisabled }}>
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
