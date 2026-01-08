'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    collection,
    doc,
    getDocs,
    setDoc,
    updateDoc,
    onSnapshot,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeFirebase } from '@/lib/firebase';

export interface AdminUser {
    uid: string;
    email: string;
    lastAccess: Date | null;
    createdAt: Date;
    disabled: boolean;
    createdBy: string;
}

export function useAdminUsers() {
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch admin users from Firestore
    useEffect(() => {
        const { db } = initializeFirebase();

        if (!db) {
            setLoading(false);
            return;
        }

        const adminsRef = collection(db, 'admins');

        const unsubscribe = onSnapshot(adminsRef, (snapshot) => {
            const adminList: AdminUser[] = [];

            snapshot.forEach((doc) => {
                const data = doc.data();
                adminList.push({
                    uid: doc.id,
                    email: data.email || '',
                    lastAccess: data.lastAccess ? (data.lastAccess as Timestamp).toDate() : null,
                    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
                    disabled: data.disabled || false,
                    createdBy: data.createdBy || 'Unknown',
                });
            });

            // Sort by createdAt descending (newest first)
            adminList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

            setAdmins(adminList);
            setLoading(false);
        }, (err) => {
            console.error('Error fetching admins:', err);
            setError('Failed to load admin users');
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Add new admin user
    const addAdmin = useCallback(async (
        email: string,
        password: string,
        createdByEmail: string
    ): Promise<{ success: boolean; error?: string }> => {
        const { auth, db } = initializeFirebase();

        if (!auth || !db) {
            return { success: false, error: 'Firebase not configured' };
        }

        try {
            // Create Firebase Auth user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Add to Firestore admins collection
            await setDoc(doc(db, 'admins', user.uid), {
                email: email,
                createdAt: serverTimestamp(),
                lastAccess: null,
                disabled: false,
                createdBy: createdByEmail,
            });

            return { success: true };
        } catch (err: unknown) {
            console.error('Error adding admin:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to create admin';

            // Handle common Firebase Auth errors
            if (errorMessage.includes('email-already-in-use')) {
                return { success: false, error: 'Email already registered' };
            }
            if (errorMessage.includes('weak-password')) {
                return { success: false, error: 'Password must be at least 6 characters' };
            }
            if (errorMessage.includes('invalid-email')) {
                return { success: false, error: 'Invalid email address' };
            }

            return { success: false, error: errorMessage };
        }
    }, []);

    // Toggle admin disabled status
    const toggleAdminStatus = useCallback(async (
        uid: string,
        currentUserUid: string
    ): Promise<{ success: boolean; error?: string }> => {
        const { db } = initializeFirebase();

        if (!db) {
            return { success: false, error: 'Firebase not configured' };
        }

        // Prevent self-disable
        if (uid === currentUserUid) {
            return { success: false, error: 'You cannot disable your own account' };
        }

        // Find current admin
        const admin = admins.find(a => a.uid === uid);
        if (!admin) {
            return { success: false, error: 'Admin not found' };
        }

        // Check if this is the last active admin
        const activeAdmins = admins.filter(a => !a.disabled);
        if (activeAdmins.length === 1 && !admin.disabled) {
            return { success: false, error: 'Cannot disable the last active admin' };
        }

        try {
            const adminRef = doc(db, 'admins', uid);
            await updateDoc(adminRef, {
                disabled: !admin.disabled,
            });

            return { success: true };
        } catch (err) {
            console.error('Error toggling admin status:', err);
            return { success: false, error: 'Failed to update admin status' };
        }
    }, [admins]);

    // Update last access time (called on login)
    const updateLastAccess = useCallback(async (uid: string) => {
        const { db } = initializeFirebase();

        if (!db) return;

        try {
            const adminRef = doc(db, 'admins', uid);
            await updateDoc(adminRef, {
                lastAccess: serverTimestamp(),
            });
        } catch (err) {
            console.error('Error updating last access:', err);
        }
    }, []);

    // Check if user is disabled
    const isUserDisabled = useCallback((uid: string): boolean => {
        const admin = admins.find(a => a.uid === uid);
        return admin?.disabled || false;
    }, [admins]);

    return {
        admins,
        loading,
        error,
        addAdmin,
        toggleAdminStatus,
        updateLastAccess,
        isUserDisabled,
    };
}
