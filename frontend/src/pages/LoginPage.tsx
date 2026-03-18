import { useNavigate } from "react-router-dom";
import { DEMO_USERS, useAuth } from "../lib/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const { loginDemo } = useAuth();

  const handleLogin = (userId: number) => {
    loginDemo(userId);
    navigate("/");
  };

  return (
    <section className="login-page">
      <article className="login-card">
        <p className="topbar-eyebrow">Enterprise Access</p>
        <h2>Најава во системот</h2>
        <p>Избери demo корисник за да ја тестираш апликацијата според улога и права по локација.</p>
        <div className="login-actions">
          {DEMO_USERS.map((user) => (
            <button
              key={user.id}
              className="login-user-card"
              type="button"
              onClick={() => handleLogin(user.id)}
            >
              <strong>{user.fullName}</strong>
              <span>{user.role}</span>
            </button>
          ))}
        </div>
      </article>
    </section>
  );
}
