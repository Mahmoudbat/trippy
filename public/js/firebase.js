import { firebaseConfig } from "./config.js";
import { validPlace, cleanEntry, cleanProfile } from "./domain.js";
let servicePromise;
export function connectFirebase() {
  return (servicePromise ||= initialize());
}
async function initialize() {
  let config = firebaseConfig;
  if (!config && /\.(web\.app|firebaseapp\.com)$/.test(location.hostname)) {
    const response = await fetch("/__/firebase/init.json");
    if (response.ok) config = await response.json();
  }
  if (!config?.apiKey || !config?.projectId || !config?.appId) return null;
  const [core, authSDK, dbSDK] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"),
  ]);
  const app = core.initializeApp(config),
    auth = authSDK.getAuth(app),
    db = dbSDK.getFirestore(app);
  await authSDK.setPersistence(auth, authSDK.browserLocalPersistence);
  return {
    auth,
    observeUser: (callback) => authSDK.onAuthStateChanged(auth, callback),
    signIn: (email, password) =>
      authSDK.signInWithEmailAndPassword(auth, email, password),
    register: (email, password) =>
      authSDK.createUserWithEmailAndPassword(auth, email, password),
    signOut: () => authSDK.signOut(auth),
    reset: (email) => authSDK.sendPasswordResetEmail(auth, email),
    async saveTrip(uid, route, shared = false) {
      const ref = dbSDK.doc(dbSDK.collection(db, 'users', uid, 'trips'));
      const value = { ...route, ownerId: uid, updatedAt: dbSDK.serverTimestamp() };
      const batch = dbSDK.writeBatch(db);
      batch.set(ref, value);
      if (shared) batch.set(dbSDK.doc(db, 'sharedPlans', ref.id), value);
      await batch.commit();
      return ref.id;
    },
    async trips(uid) {
      const snapshot = await dbSDK.getDocs(dbSDK.collection(db, 'users', uid, 'trips'));
      return snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
    },
    async sharedTrip(id) {
      const snapshot = await dbSDK.getDoc(dbSDK.doc(db, 'sharedPlans', id));
      if (!snapshot.exists()) throw new Error('Trip unavailable');
      return snapshot.data();
    },
    async deleteTrip(uid, id) {
      const batch = dbSDK.writeBatch(db);
      batch.delete(dbSDK.doc(db, 'sharedPlans', id));
      batch.delete(dbSDK.doc(db, 'users', uid, 'trips', id));
      await batch.commit();
    },
    async places() {
      const snapshot = await dbSDK.getDocs(dbSDK.collection(db, "places"));
      const records = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
      if (!records.length || !records.every(validPlace))
        throw new Error(
          "The cloud catalog is empty or contains invalid place records.",
        );
      return records;
    },
    async entries(uid) {
      const snapshot = await dbSDK.getDocs(
        dbSDK.collection(db, "users", uid, "journey"),
      );
      return Object.fromEntries(
        snapshot.docs.map((d) => [d.id, cleanEntry(d.data())]),
      );
    },
    async profile(uid) {
      const snapshot = await dbSDK.getDoc(
        dbSDK.doc(db, "users", uid, "profile", "preferences"),
      );
      return snapshot.exists() ? cleanProfile(snapshot.data()) : null;
    },
    async saveProfile(uid, value) {
      await dbSDK.setDoc(
        dbSDK.doc(db, "users", uid, "profile", "preferences"),
        { ...cleanProfile(value), updatedAt: dbSDK.serverTimestamp() },
      );
    },
    async saveEntry(uid, id, value) {
      await dbSDK.setDoc(dbSDK.doc(db, "users", uid, "journey", id), {
        ...cleanEntry(value),
        updatedAt: dbSDK.serverTimestamp(),
      });
    },
    async isAdmin() {
      if (!auth.currentUser) return false;
      const snapshot = await dbSDK.getDoc(
        dbSDK.doc(db, "admins", auth.currentUser.uid),
      );
      return snapshot.exists() && snapshot.data().active === true;
    },
    async seed(places) {
      if (!(await this.isAdmin()))
        throw new Error(
          "This account is not an authorized catalog administrator.",
        );
      const existing = await dbSDK.getDocs(dbSDK.collection(db, "places"));
      const ids = new Set(existing.docs.map((d) => d.id));
      const batch = dbSDK.writeBatch(db);
      let count = 0;
      for (const place of places)
        if (!ids.has(place.id)) {
          if (!validPlace(place)) throw new Error("Invalid place: " + place.id);
          batch.set(dbSDK.doc(db, "places", place.id), place);
          count++;
        }
      await batch.commit();
      return count;
    },
  };
}
export function friendlyError(error) {
  const messages = {
    "auth/account-changed":
      "Your account changed while saving. Check the journal for the account now signed in.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/email-already-in-use":
      "An account already uses this email. Try signing in.",
    "auth/weak-password": "Use a stronger password with at least 8 characters.",
    "auth/password-does-not-meet-requirements":
      "This password does not meet the Firebase password policy. Use at least 8 characters and follow the enabled policy.",
    "auth/missing-password": "Enter a password with at least 8 characters.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/network-request-failed":
      "Connection failed. Check your internet and try again.",
    "auth/operation-not-allowed":
      "Email/password sign-in must be enabled in Firebase.",
    "auth/configuration-not-found":
      "Firebase Authentication is not configured yet. Enable Email/Password in the Firebase console.",
    "auth/unauthorized-domain":
      "This website address is not authorized in Firebase. Add 127.0.0.1 and localhost under Authentication settings.",
    "auth/admin-restricted-operation":
      "Account creation is disabled in Firebase Authentication settings.",
    "auth/invalid-api-key":
      "The Firebase web configuration is invalid. Check the registered web app settings.",
    "permission-denied":
      "Access was denied. Check the deployed Firestore rules and your account.",
    unavailable: "Cloud service is unavailable. Please try again.",
  };
  return (
    messages[error?.code] ||
    "The request could not be completed. Please try again."
  );
}
