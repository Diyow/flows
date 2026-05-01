'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    collection,
    doc,
    onSnapshot,
    deleteDoc,
    updateDoc,
    setDoc,
    Timestamp,
    Firestore,
    query,
    orderBy
} from 'firebase/firestore';
import {
    createUserWithEmailAndPassword,
    getAuth,
    Auth
} from 'firebase/auth';
import { initializeApp, deleteApp, FirebaseApp } from 'firebase/app';
import { isFirebaseConfigured, initializeFirebase } from '@/lib/firebase';

export type AdminRole = 'super_admin' | 'admin';

export interface AdminData {
    id: string;
    email: string;
    role: AdminRole;
    disabled: boolean;
    createdAt: Date;
    createdBy: string;
    lastAccess: Date;
}

export function useAdmins(currentUserEmail: string | null | undefined) {
    const [admins, setAdmins] = useState<AdminData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [firebaseDb, setFirebaseDb] = useState<Firestore | null>(null);

    // Initialize Firebase
    useEffect(() => {
        if (typeof window !== 'undefined' && isFirebaseConfigured()) {
            const { db } = initializeFirebase();
            if (db) {
                setFirebaseDb(db);
            } else {
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    }, []);

    // Subscribe to admins collection in real-time
    useEffect(() => {
        if (!firebaseDb) return;

        const adminsQuery = query(
            collection(firebaseDb, 'admins'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(
            adminsQuery,
            (snapshot) => {
                const adminList: AdminData[] = [];
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    adminList.push({
                        id: doc.id,
                        email: data.email || '',
                        role: data.role || 'admin',
                        disabled: data.disabled || false,
                        createdAt: data.createdAt?.toDate() || new Date(),
                        createdBy: data.createdBy || 'Unknown',
                        lastAccess: data.lastAccess?.toDate() || new Date(),
                    });
                });
                setAdmins(adminList);
                setLoading(false);
            },
            (err) => {
                console.error('Error fetching admins:', err);
                setError('Failed to load admins');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [firebaseDb]);

    // Get current user's role
    const currentAdmin = admins.find(
        (a) => a.email === currentUserEmail
    );
    const currentAdminRole: AdminRole | null = currentAdmin?.role || null;
    const isSuperAdmin = currentAdminRole === 'super_admin';

    // Invite a new admin
    const inviteAdmin = useCallback(
        async (email: string, password: string, role: AdminRole = 'admin') => {
            if (!firebaseDb) throw new Error('Firebase not configured');

            setError(null);

            try {
                // Create a secondary Firebase app to avoid logging out current user
                const firebaseConfig = {
                    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
                    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
                    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
                    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
                    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
                };

                let secondaryApp: FirebaseApp | null = null;
                let secondaryAuth: Auth | null = null;

                try {
                    secondaryApp = initializeApp(firebaseConfig, 'SecondaryApp');
                    secondaryAuth = getAuth(secondaryApp);

                    // Create the new user via the secondary app
                    const userCredential = await createUserWithEmailAndPassword(
                        secondaryAuth,
                        email,
                        password
                    );

                    const newUserId = userCredential.user.uid;

                    // Write admin document to Firestore
                    await setDoc(doc(firebaseDb, 'admins', newUserId), {
                        email,
                        role,
                        disabled: false,
                        createdAt: Timestamp.now(),
                        createdBy: currentUserEmail || 'Unknown',
                        lastAccess: Timestamp.now(),
                    });
                } finally {
                    // Always clean up the secondary app
                    if (secondaryApp) {
                        await deleteApp(secondaryApp);
                    }
                }
            } catch (err: unknown) {
                const errorMessage =
                    err instanceof Error ? err.message : 'Failed to invite admin';
                setError(errorMessage);
                throw err;
            }
        },
        [firebaseDb, currentUserEmail]
    );

    // Remove an admin (super_admin only)
    const removeAdmin = useCallback(
        async (adminId: string) => {
            if (!firebaseDb) throw new Error('Firebase not configured');
            if (!isSuperAdmin) throw new Error('Only super admins can remove admins');

            // Prevent self-removal
            if (currentAdmin?.id === adminId) {
                throw new Error('You cannot remove yourself');
            }

            try {
                await deleteDoc(doc(firebaseDb, 'admins', adminId));
            } catch (err: unknown) {
                const errorMessage =
                    err instanceof Error ? err.message : 'Failed to remove admin';
                setError(errorMessage);
                throw err;
            }
        },
        [firebaseDb, isSuperAdmin, currentAdmin]
    );

    // Toggle admin disabled status (super_admin only)
    const toggleAdminDisabled = useCallback(
        async (adminId: string, disabled: boolean) => {
            if (!firebaseDb) throw new Error('Firebase not configured');
            if (!isSuperAdmin) throw new Error('Only super admins can modify admins');

            // Prevent self-disable
            if (currentAdmin?.id === adminId) {
                throw new Error('You cannot disable yourself');
            }

            try {
                await updateDoc(doc(firebaseDb, 'admins', adminId), { disabled });
            } catch (err: unknown) {
                const errorMessage =
                    err instanceof Error ? err.message : 'Failed to update admin';
                setError(errorMessage);
                throw err;
            }
        },
        [firebaseDb, isSuperAdmin, currentAdmin]
    );

    return {
        admins,
        loading,
        error,
        currentAdminRole,
        isSuperAdmin,
        inviteAdmin,
        removeAdmin,
        toggleAdminDisabled,
        clearError: () => setError(null),
    };
}
