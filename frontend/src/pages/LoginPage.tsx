import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <section className="login-page">
      <article className="login-card">
        <img className="app-logo app-logo--login" src="/zito-logo.png" alt="Жито маркети" />
        <h2>Најава во системот</h2>
        <p>Внеси корисничко име и лозинка за да пристапиш во системот.</p>

        <div className="master-form">
          <input
            value={username}
            placeholder="Корисничко име"
            autoComplete="username"
            onChange={(event) => setUsername(event.target.value)}
          />
          <input
            type="password"
            value={password}
            placeholder="Лозинка"
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
          />
          {error && <div className="form-error">{error}</div>}
          <button
            className="action-button"
            type="button"
            disabled={submitting}
            onClick={async () => {
              setSubmitting(true);
              setError(null);

              try {
                await login({ username, password });
                navigate("/");
              } catch (loginError) {
                setError((loginError as Error).message);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {submitting ? "Најава..." : "Најави се"}
          </button>
        </div>
      </article>
    </section>
  );
}
