import { useEffect, useState } from "react";

export default function AuthPanel({
  user,
  onLogin,
  onSignup,
  onLogout,
  authError,
  onClearAuthError,
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");

  useEffect(() => {
    if (!authError) return;
    setUsername("");
    setPassword("");
  }, [authError]);

  if (user) {
    return (
      <div className="mb-4 flex flex-col items-start justify-between gap-2 rounded-lg bg-white p-3 shadow dark:bg-gray-900 sm:flex-row sm:items-center">
        <p className="text-sm">
          Signed in as <span className="font-semibold">{user.username}</span>
        </p>
        <button
          onClick={onLogout}
          className="rounded bg-gray-700 px-3 py-1 text-sm text-white dark:bg-gray-600"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (username.trim() && password.trim()) {
          const creds = { username: username.trim(), password: password.trim() };
          if (mode === "login") onLogin(creds);
          else onSignup(creds);
        }
      }}
      className="mb-4 grid gap-2 rounded-lg bg-white p-3 shadow dark:bg-gray-900 md:grid-cols-[1fr_1fr_auto]"
    >
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        className="flex-1 rounded border p-2 dark:border-gray-700 dark:bg-gray-800"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="flex-1 rounded border p-2 dark:border-gray-700 dark:bg-gray-800"
      />
      <button
        type="submit"
        className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        disabled={!username.trim() || !password.trim()}
      >
        {mode === "login" ? "Login" : "Signup"}
      </button>
      <button
        type="button"
        onClick={() => {
          setMode((prev) => (prev === "login" ? "signup" : "login"));
          onClearAuthError?.();
        }}
        className="rounded border px-3 py-2 text-sm dark:border-gray-700 md:col-span-3"
      >
        Switch to {mode === "login" ? "Signup" : "Login"}
      </button>
    </form>
  );
}
