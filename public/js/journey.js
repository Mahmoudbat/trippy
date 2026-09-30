import { cleanEntry, cleanProfile } from "./domain.js";
const key = "discover-jordan-guest-v1";
const profileKey = "discover-jordan-profile-v1";
export function readGuest() {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || "{}");
    return Object.fromEntries(
      Object.entries(raw)
        .filter(([id]) => /^[a-z0-9-]{1,80}$/.test(id))
        .map(([id, value]) => [id, cleanEntry(value)]),
    );
  } catch {
    return {};
  }
}
export function writeGuest(entries) {
  localStorage.setItem(key, JSON.stringify(entries));
}
export function readProfile() {
  try {
    return cleanProfile(JSON.parse(localStorage.getItem(profileKey) || "{}"));
  } catch {
    return cleanProfile();
  }
}
export function writeProfile(profile) {
  const clean = cleanProfile(profile);
  localStorage.setItem(profileKey, JSON.stringify(clean));
  return clean;
}
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
