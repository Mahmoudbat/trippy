import { connectFirebase, friendlyError } from "./firebase.js";
const message = document.querySelector("#admin-status"),
  seed = document.querySelector("#seed");
let service;
try {
  service = await connectFirebase();
  if (!service)
    message.textContent =
      "Firebase is not configured. Follow README before seeding.";
  else
    service.observeUser(async (user) => {
      seed.disabled = true;
      if (!user) {
        message.textContent = "Sign in with your catalog admin account.";
        return;
      }
      try {
        const allowed = await service.isAdmin();
        seed.disabled = !allowed;
        message.textContent = allowed
          ? "Admin verified. Ready to add missing places."
          : `This account has no catalog admin role. UID: ${user.uid}`;
      } catch (error) {
        message.textContent = friendlyError(error);
      }
    });
} catch (error) {
  message.textContent = friendlyError(error);
}
document
  .querySelector("#admin-login")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!service) return;
    const form = event.target,
      data = new FormData(form),
      button = form.querySelector("button");
    button.disabled = true;
    try {
      await service.signIn(
        String(data.get("email")).trim(),
        String(data.get("password")),
      );
      form.reset();
    } catch (error) {
      message.textContent = friendlyError(error);
    } finally {
      button.disabled = false;
    }
  });
seed.addEventListener("click", async () => {
  seed.disabled = true;
  message.textContent = "Adding missing places…";
  try {
    const response = await fetch("data/catalog.json");
    if (!response.ok) throw new Error("catalog");
    const data = await response.json();
    const count = await service.seed(data.places);
    message.textContent = `Complete. Added ${count} places; existing records were preserved.`;
  } catch (error) {
    message.textContent = friendlyError(error);
  } finally {
    seed.disabled = false;
  }
});
