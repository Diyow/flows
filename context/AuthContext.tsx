'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    Auth
} from 'firebase/auth';
import {
    doc,
    getDoc,
    getDocs,
    updateDoc,
    collection,
    query,
    where,
    Timestamp,
    Firestore
} from 'firebase/firestore';
import { isFirebaseConfigured, initializeFirebase } from '@/lib/firebase';

export type AdminRole = 'super_admin' | 'admin';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    adminRole: AdminRole | null;
    isSuperAdmin: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
    const [isConfigured, setIsConfigured] = useState(false);
    const [firebaseAuth, setFirebaseAuth] = useState<Auth | null>(null);
    const [firebaseDb, setFirebaseDb] = useState<Firestore | null>(null);

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

        const { auth: authInstance, db: dbInstance } = initializeFirebase();

        if (!authInstance) {
            setLoading(false);
            return;
        }

        setFirebaseAuth(authInstance);
        setFirebaseDb(dbInstance);

        // Listen for auth state changes
        const unsubscribe = onAuthStateChanged(authInstance, async (authUser) => {
            setUser(authUser);

            if (authUser && dbInstance) {
                // Fetch admin role from Firestore by email
                try {
                    const adminsQuery = query(
                        collection(dbInstance, 'admins'),
                        where('email', '==', authUser.email)
                    );
                    const querySnapshot = await getDocs(adminsQuery);

                    if (!querySnapshot.empty) {
                        const adminDoc = querySnapshot.docs[0];
                        const data = adminDoc.data();
                        setAdminRole(data.role || 'admin');

                        // Update lastAccess timestamp
                        updateDoc(doc(dbInstance, 'admins', adminDoc.id), {
                            lastAccess: Timestamp.now(),
                        }).catch(console.error);
                    } else {
                        // User exists in Auth but not in admins collection
                        setAdminRole('admin');
                    }
                } catch (err) {
                    console.error('Error fetching admin role:', err);
                    setAdminRole(null);
                }
            } else {
                setAdminRole(null);
            }

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

    const isSuperAdmin = adminRole === 'super_admin';

    return (
        <AuthContext.Provider value={{ user, loading, adminRole, isSuperAdmin, signIn, signOut, isConfigured }}>
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
