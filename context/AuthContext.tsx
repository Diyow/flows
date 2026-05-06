'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
    User,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    Auth
} from 'firebase/auth';
import {
    doc,
    onSnapshot,
    updateDoc,
    setDoc,
    deleteDoc,
    collection,
    query,
    where,
    getDocs,
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
    const roleUnsubscribeRef = useRef<(() => void) | null>(null);
    const lastAccessUpdatedRef = useRef(false);

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
        const unsubscribe = onAuthStateChanged(authInstance, (authUser) => {
            setUser(authUser);

            // Clean up previous role listener
            if (roleUnsubscribeRef.current) {
                roleUnsubscribeRef.current();
                roleUnsubscribeRef.current = null;
            }
            // Reset lastAccess guard for new user
            lastAccessUpdatedRef.current = false;

            if (authUser && dbInstance) {
                // Subscribe to admin role in real-time so role changes are reflected immediately
                const adminDocRef = doc(dbInstance, 'admins', authUser.uid);

                roleUnsubscribeRef.current = onSnapshot(adminDocRef, async (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        const role = data.role || 'admin';
                        console.log('[AuthContext] Admin role resolved:', role, 'for UID:', authUser.uid);
                        setAdminRole(role);

                        // Update lastAccess ONCE per session to avoid infinite loop
                        // (writing to a doc we're listening on would re-trigger the snapshot)
                        if (!lastAccessUpdatedRef.current) {
                            lastAccessUpdatedRef.current = true;
                            updateDoc(adminDocRef, {
                                lastAccess: Timestamp.now(),
                            }).catch(console.error);
                        }
                    } else {
                        // No document by UID — try to find by email (handles legacy data where doc ID ≠ UID)
                        console.warn('[AuthContext] No admin document for UID:', authUser.uid, '— searching by email...');
                        try {
                            const adminsRef = collection(dbInstance, 'admins');
                            const q = query(adminsRef, where('email', '==', authUser.email));
                            const snapshot = await getDocs(q);

                            if (!snapshot.empty) {
                                const existingDoc = snapshot.docs[0];
                                const data = existingDoc.data();
                                const role = data.role || 'admin';
                                console.log('[AuthContext] Found admin by email with role:', role, '— migrating document to UID:', authUser.uid);

                                // Migrate: copy document to UID-keyed doc and delete old one
                                await setDoc(adminDocRef, {
                                    ...data,
                                    lastAccess: Timestamp.now(),
                                });
                                if (existingDoc.id !== authUser.uid) {
                                    await deleteDoc(doc(dbInstance, 'admins', existingDoc.id));
                                }

                                setAdminRole(role);
                            } else {
                                console.warn('[AuthContext] No admin document found by email either — defaulting to admin role');
                                setAdminRole('admin');
                            }
                        } catch (migrationErr) {
                            console.error('[AuthContext] Error during email fallback lookup:', migrationErr);
                            setAdminRole('admin');
                        }
                    }
                    setLoading(false);
                }, (err) => {
                    console.error('[AuthContext] Error watching admin role:', err);
                    setAdminRole(null);
                    setLoading(false);
                });
            } else {
                setAdminRole(null);
                setLoading(false);
            }
        });

        return () => {
            unsubscribe();
            if (roleUnsubscribeRef.current) {
                roleUnsubscribeRef.current();
            }
        };
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
