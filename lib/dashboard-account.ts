import { GoogleAuthProvider, getAuth, signInWithPopup, signOut } from 'firebase/auth';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { app, db } from './firebase';
import { applyCourseSelection, readCourseIds } from './dashboard-data';

export const auth = getAuth(app);
export const dashboardRef = (uid: string) => doc(db, 'studentDashboards', uid);

export async function signInToDashboard() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  await signInWithPopup(auth, provider);
}

export const signOutOfDashboard = () => signOut(auth);

export async function saveDashboardCourses(uid: string, original: string[], draft: string[]) {
  if (auth.currentUser?.uid !== uid) throw new Error('Your account changed. Please sign in again.');
  if (typeof navigator !== 'undefined' && !navigator.onLine) throw new Error('You are offline. Reconnect to save your courses.');
  const ref = dashboardRef(uid);
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    const courseIds = applyCourseSelection(readCourseIds(snapshot.data()?.courseIds), original, draft);
    transaction.set(ref, { courseIds, updatedAt: serverTimestamp() });
  });
}

export function dashboardError(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return 'Sign-in was cancelled. You can try again whenever you’re ready.';
  if (code === 'auth/popup-blocked') return 'Allow pop-ups for this site, then try signing in again.';
  if (code === 'auth/unauthorized-domain') return 'Sign-in is not enabled for this website address yet. Please contact the site owner.';
  if (code === 'permission-denied') return 'Your course list could not be accessed. The site owner needs to enable dashboard access. Please retry after setup.';
  if (code === 'unavailable' || code === 'auth/network-request-failed') return 'Could not connect. Check your internet connection and try again.';
  if (code.startsWith('auth/')) return 'Google sign-in is unavailable right now. Please try again.';
  return error instanceof Error && !code ? error.message : 'Could not save your courses. Please try again.';
}
