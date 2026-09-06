import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/");
    } catch {
      setError("Incorrect username or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
      <form onSubmit={handleSubmit} className="bg-surface border border-border shadow-card rounded-2xl p-8 w-full max-w-sm">
        <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-white font-bold mb-4">
          AH
        </div>
        <h1 className="text-xl font-bold tracking-tight">Apna Hisab</h1>
        <p className="text-sm text-ink-muted mt-1 mb-6">Sign in to see your money, clearly.</p>
        <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full border border-border rounded-lg px-3.5 py-2.5 mb-4 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-shadow"
          autoComplete="username"
        />
        <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-border rounded-lg px-3.5 py-2.5 mb-5 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-shadow"
          autoComplete="current-password"
        />
        {error && <p className="text-sm text-bad mb-4">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent hover:bg-accent-ink text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
