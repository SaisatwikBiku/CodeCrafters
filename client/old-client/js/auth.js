/**
 * auth.js – handles login, register, token storage
 */

const AUTH = {
  getToken() {
    return localStorage.getItem("cc_token");
  },
  getUsername() {
    return localStorage.getItem("cc_username");
  },
  setAuth(token, username) {
    localStorage.setItem("cc_token", token);
    localStorage.setItem("cc_username", username);
  },
  clearAuth() {
    localStorage.removeItem("cc_token");
    localStorage.removeItem("cc_username");
  },
  isLoggedIn() {
    return !!this.getToken();
  },
  authHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.getToken()}`,
    };
  },
};

// ── On page load – check if already logged in ──────────────
document.addEventListener("DOMContentLoaded", async () => {
  if (AUTH.isLoggedIn()) {
    const res = await fetch("/api/auth/me", { headers: AUTH.authHeaders() });
    if (res.ok) {
      showLobby();
      return;
    } else {
      AUTH.clearAuth();
    }
  }
  showScreen("login");
});

// ── Login ──────────────────────────────────────────────────
document.getElementById("btn-login").addEventListener("click", async () => {
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value.trim();
  const errorEl = document.getElementById("login-error");

  if (!username || !password) {
    errorEl.textContent = "Please fill in all fields.";
    errorEl.classList.remove("hidden");
    return;
  }

  const btn = document.getElementById("btn-login");
  btn.disabled = true;
  btn.textContent = "Logging in...";

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      errorEl.textContent = data.error;
      errorEl.classList.remove("hidden");
      return;
    }
    AUTH.setAuth(data.token, data.username);
    showLobby();
  } catch (err) {
    errorEl.textContent = "Could not connect to server.";
    errorEl.classList.remove("hidden");
  } finally {
    btn.disabled = false;
    btn.textContent = "▶ PLAY NOW!";
  }
});

// ── Register ───────────────────────────────────────────────
document.getElementById("btn-register").addEventListener("click", async () => {
  const username = document.getElementById("reg-username").value.trim();
  const password = document.getElementById("reg-password").value.trim();
  const errorEl = document.getElementById("register-error");

  if (!username || !password) {
    errorEl.textContent = "Please fill in all fields.";
    errorEl.classList.remove("hidden");
    return;
  }

  const btn = document.getElementById("btn-register");
  btn.disabled = true;
  btn.textContent = "Registering...";

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      errorEl.textContent = data.error;
      errorEl.classList.remove("hidden");
      return;
    }
    AUTH.setAuth(data.token, data.username);
    showLobby();
  } catch (err) {
    errorEl.textContent = "Could not connect to server.";
    errorEl.classList.remove("hidden");
  } finally {
    btn.disabled = false;
    btn.textContent = "🚀 Let's Go!";
  }
});

// ── Show lobby after login ─────────────────────────────────
async function showLobby() {
  document.getElementById("lobby-username").textContent = AUTH.getUsername();
  showScreen("lobby");

  const res = await fetch("/api/game/active", { headers: AUTH.authHeaders() });
  if (res.ok) {
    const { session } = await res.json();
    if (session) {
      document.getElementById("active-session-id").textContent = session.id;
      document.getElementById("active-session-stage").textContent =
        session.stage;
      document
        .getElementById("active-session-banner")
        .classList.remove("hidden");
      window._activeSession = session;
    }
  }
}

// ── Logout ─────────────────────────────────────────────────
document.getElementById("btn-logout").addEventListener("click", () => {
  AUTH.clearAuth();
  showScreen("login");
});

// ── Rejoin active session ──────────────────────────────────
document.getElementById("btn-rejoin").addEventListener("click", async () => {
  const session = window._activeSession;
  if (!session) return;

  const res = await fetch("/api/game/join", {
    method: "POST",
    headers: AUTH.authHeaders(),
    body: JSON.stringify({ sessionId: session.id }),
  });
  const data = await res.json();
  if (!res.ok) return alert(data.error);

  window._pendingJoin = {
    sessionId: session.id,
    role: data.role,
    stage: data.stage,
  };
  connectSocket();
});
