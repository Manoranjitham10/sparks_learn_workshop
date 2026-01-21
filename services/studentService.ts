import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "./firebase";
import { Student, College } from "../types";

export interface RegistrationResult {
    success: boolean;
    error?: string;
    studentId?: string;
}

// 0. Audit Helper
const logAudit = async (action: string, details: any, status: 'SUCCESS' | 'FAILURE', error?: string) => {
    try {
        await setDoc(doc(collection(db, "audit_logs")), {
            action,
            timestamp: new Date().toISOString(),
            details,
            status,
            error: error || null,
            performedBy: 'admin' // In a real app we'd grab the current user's ID
        });
    } catch (e) {
        console.error("Failed to write audit log:", e);
    }
};

// Helper to get a secondary app for admin operations (creating users without signing out admin)
import { initializeApp, getApp, deleteApp, getApps } from "firebase/app";
import { getAuth as getAuthSecondary, createUserWithEmailAndPassword as createUserSecondary, signOut as signOutSecondary } from "firebase/auth";
import { firebaseConfig } from "./firebase";

export const registerStudentInFirebase = async (student: Student): Promise<RegistrationResult> => {
    let secondaryApp;
    const normalizedEmail = student.email.toLowerCase().trim();

    try {
        // 1. Initialize a secondary app to avoid changing the current user's auth state
        const appName = "SecondaryAppForCreation";
        if (getApps().some(app => app.name === appName)) {
            secondaryApp = getApp(appName);
        } else {
            secondaryApp = initializeApp(firebaseConfig, appName);
        }

        const secondaryAuth = getAuthSecondary(secondaryApp);

        // 2. Create User in Firebase Auth using the secondary auth instance
        // Default password strategy: Student@<RollNo>
        const password = `Student@${student.roll_no || '12345'}`;

        let userCredential;
        try {
            userCredential = await createUserSecondary(secondaryAuth, normalizedEmail, password);
        } catch (authErr: any) {
            // If Auth fails, we abort immediately (Atomic: nothing happened in DB yet)
            await logAudit('AUTH_ACCOUNT_CREATE', { email: normalizedEmail, roll_no: student.roll_no }, 'FAILURE', authErr.message);
            throw authErr;
        }

        const user = userCredential.user;

        // 3. Create Student Document in Firestore (Atomic Link)
        try {
            await setDoc(doc(db, "students", user.uid), {
                ...student,
                email: normalizedEmail, // Ensure stored email is normalized
                uid: user.uid,
                createdAt: new Date().toISOString(),
                role: 'student',
                auth_provider: 'email_password'
            });

            await logAudit('AUTH_ACCOUNT_CREATED', { uid: user.uid, email: normalizedEmail }, 'SUCCESS');

        } catch (dbError: any) {
            // ROLLBACK POLICY: If Student Record fails, rollback Auth Account
            console.error("DB Write Failed. Rolling back Auth User...");
            try {
                await user.delete(); // Delete the just-created user
                await logAudit('AUTH_ROLLBACK', { uid: user.uid, reason: "DB_WRITE_FAIL" }, 'SUCCESS');
            } catch (rollbackError) {
                console.error("CRITICAL: Rollback failed. Orphaned Auth User:", user.uid);
                await logAudit('AUTH_ROLLBACK', { uid: user.uid, reason: "ROLLBACK_FAILED" }, 'FAILURE');
            }
            throw new Error(`Database write failed (${dbError.message}). Auth account rolled back.`);
        }

        // 4. Cleanup Secondary Auth
        await signOutSecondary(secondaryAuth);

        return { success: true, studentId: user.uid };

    } catch (error: any) {
        console.error("Error registering student:", error);

        if (error.code === 'auth/email-already-in-use') {
            // Try to recover UID from Firestore
            try {
                const q = query(collection(db, "students"), where("email", "==", normalizedEmail));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const existingDoc = querySnapshot.docs[0];
                    return { success: true, studentId: existingDoc.id, error: "Already registered (UID recovered)" };
                } else {
                    // Consistency Error: Auth exists, but DB does not.
                    return { success: false, error: `Consistency Violation: Auth account exists for ${normalizedEmail}, but no Student Profile found. Cannot link.` };
                }
            } catch (fetchError) {
                console.error("Error fetching existing student:", fetchError);
            }
            return { success: false, error: `Email ${normalizedEmail} is already registered.` };
        }

        return { success: false, error: error.message };
    }
};

export const deleteStudentFromFirebase = async (studentId: string, email?: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const normalizedEmail = email?.toLowerCase().trim();

        // 1. Try deleting by ID directly
        if (!studentId.startsWith('s-')) {
            await deleteDoc(doc(db, "students", studentId));
            // Note: We cannot programmatically delete the User from Auth using the Client SDK 
            // unless we act as that user or use the Admin SDK. 
            // In a real Admin SDK environment, we would do: admin.auth().deleteUser(studentId).
            // Here, we just delete the profile.
            await logAudit('STUDENT_PROFILE_DELETED', { uid: studentId, email: normalizedEmail }, 'SUCCESS');
            return { success: true };
        }

        // 2. If ID is local, try by Email
        if (normalizedEmail) {
            const q = query(collection(db, "students"), where("email", "==", normalizedEmail));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const deletePromises = querySnapshot.docs.map(d => {
                    logAudit('STUDENT_PROFILE_DELETED', { uid: d.id, email: normalizedEmail }, 'SUCCESS');
                    return deleteDoc(d.ref)
                });
                await Promise.all(deletePromises);
                return { success: true };
            } else {
                return { success: true };
            }
        }

        return { success: true };
    } catch (error: any) {
        await logAudit('STUDENT_DELETE_FAILED', { uid: studentId, error: error.message }, 'FAILURE');

        // Suppress console error for permission issues
        if (error.code === 'permission-denied' || error.message.includes('Missing or insufficient permissions')) {
            return { success: false, error: "Permission denied: Ensure your Firestore Rules allow writes." };
        }
        return { success: true, error: error.message };
    }
};

export const fetchStudentsFromFirebase = async (collegeId: string): Promise<Student[]> => {
    try {
        const q = query(collection(db, "students"), where("collegeId", "==", collegeId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
    } catch (error) {
        console.error("Error fetching students from Firebase:", error);
        return [];
    }
};

export const fetchCollegesFromFirebase = async (): Promise<College[]> => {
    try {
        const q = query(collection(db, "colleges"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as College));
    } catch (error) {
        console.error("Error fetching colleges", error);
        return [];
    }
};

export const registerCollegeInFirebase = async (college: College): Promise<boolean> => {
    try {
        await setDoc(doc(db, "colleges", college.id), college);
        return true;
    } catch (error) {
        console.error("Error creating college", error);
        return false;
    }
};
