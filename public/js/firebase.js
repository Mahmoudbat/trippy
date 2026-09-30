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
    watchVisitCount(placeId, callback) {
      return dbSDK.onSnapshot(dbSDK.doc(db, "places", placeId), snapshot =>
        callback(Number(snapshot.data()?.visitCount) || 0));
    },
    async hasVisited(uid, placeId) {
      const snapshot = await dbSDK.getDoc(dbSDK.doc(db, "visits", `${uid}_${placeId}`));
      return snapshot.exists();
    },
    async markPlaceVisited(placeId, comment = "") {
      if (!auth.currentUser) throw Object.assign(new Error("Sign in first"), { code: "unauthenticated" });
      const uid = auth.currentUser.uid;
      const visitRef = dbSDK.doc(db, "visits", `${uid}_${placeId}`);
      const placeRef = dbSDK.doc(db, "places", placeId);
      const newVisitCount = await dbSDK.runTransaction(db, async transaction => {
        const visit = await transaction.get(visitRef);
        const place = await transaction.get(placeRef);
        if (visit.exists()) throw Object.assign(new Error("Already visited"), { code: "already-exists" });
        if (!place.exists()) throw Object.assign(new Error("Place not found"), { code: "not-found" });
        const count = Number(place.data().visitCount) || 0;
        transaction.set(visitRef, { userId: uid, placeId, createdAt: dbSDK.serverTimestamp() });
        transaction.update(placeRef, { visitCount: dbSDK.increment(1) });
        return count + 1;
      });
      if (comment.trim()) await this.addVisitComment(placeId, comment);
      return { success: true, newVisitCount };
    },
    async addVisitComment(placeId, text) {
      if (!auth.currentUser) throw Object.assign(new Error("Sign in first"), { code: "unauthenticated" });
      const comment = String(text || "").trim();
      if (!comment || comment.length > 500) throw Object.assign(new Error("Invalid comment"), { code: "invalid-argument" });
      const uid = auth.currentUser.uid;
      const visit = await dbSDK.getDoc(dbSDK.doc(db, "visits", `${uid}_${placeId}`));
      if (!visit.exists()) throw Object.assign(new Error("Visit required"), { code: "failed-precondition" });
      await dbSDK.addDoc(dbSDK.collection(db, "comments"), {
        placeId,
        userId: uid,
        userDisplayName: (auth.currentUser.displayName || auth.currentUser.email?.split("@")[0] || "Jordan explorer").slice(0, 80),
        text: comment,
        createdAt: dbSDK.serverTimestamp(),
        status: "visible",
      });
      return { success: true };
    },
    async reportComment(commentId) {
      if (!auth.currentUser) throw Object.assign(new Error("Sign in first"), { code: "unauthenticated" });
      await dbSDK.updateDoc(dbSDK.doc(db, "comments", commentId), {
        reportedBy: dbSDK.arrayUnion(auth.currentUser.uid),
      });
      return { success: true };
    },
    async comments(placeId, cursor = null) {
      const constraints = [
        dbSDK.where("placeId", "==", placeId),
        dbSDK.where("status", "==", "visible"),
        dbSDK.orderBy("createdAt", "desc"),
      ];
      if (cursor) constraints.push(dbSDK.startAfter(cursor));
      constraints.push(dbSDK.limit(10));
      const snapshot = await dbSDK.getDocs(dbSDK.query(dbSDK.collection(db, "comments"), ...constraints));
      return {
        items: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        cursor: snapshot.docs.at(-1) || null,
        hasMore: snapshot.size === 10,
      };
    },
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
          batch.set(dbSDK.doc(db, "places", place.id), { ...place, visitCount: 0 });
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
