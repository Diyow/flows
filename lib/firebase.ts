import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
    initializeFirestore,
    getFirestore,
    Firestore,
    persistentLocalCache,
    persistentMultipleTabManager,
} from 'firebase/firestore';
import { getAuth, Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if Firebase is properly configured
export const isFirebaseConfigured = (): boolean => {
    return !!(
        firebaseConfig.apiKey &&
        firebaseConfig.apiKey !== 'your_api_key_here' &&
        firebaseConfig.projectId &&
        firebaseConfig.projectId !== 'your_project_id'
    );
};

// Singleton instances
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let initialized = false;

// Initialize Firebase - can be called from anywhere
export const initializeFirebase = (): { app: FirebaseApp | null; db: Firestore | null; auth: Auth | null } => {
    if (typeof window === 'undefined') {
        return { app: null, db: null, auth: null };
    }

    if (initialized) {
        return { app, db, auth };
    }

    if (!isFirebaseConfigured()) {
        return { app: null, db: null, auth: null };
    }

    try {
        app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

        // Use initializeFirestore with persistent cache (replaces deprecated enableMultiTabIndexedDbPersistence).
        // This caches Firestore data locally so subsequent reads are served from IndexedDB,
        // massively reducing billable network reads on page reloads.
        try {
            db = initializeFirestore(app, {
                localCache: persistentLocalCache({
                    tabManager: persistentMultipleTabManager(),
                }),
            });
        } catch {
            // If already initialized (e.g. HMR), fall back to getFirestore
            db = getFirestore(app);
        }

        auth = getAuth(app);

        // Set persistence to LOCAL (survives browser restarts)
        if (auth) {
            setPersistence(auth, browserLocalPersistence).catch(console.error);
        }

        initialized = true;
    } catch (error) {
        console.error('Firebase initialization error:', error);
    }

    return { app, db, auth };
};

// Auto-initialize on import (client-side only)
if (typeof window !== 'undefined') {
    initializeFirebase();
}

export { db, auth };
export default app;
