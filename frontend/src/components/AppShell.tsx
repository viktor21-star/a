import { NavLink, Outlet } from "react-router-dom";
import { useTheme } from "../lib/theme";
import { useAuth } from "../lib/auth";

const navItems = [
  { to: "/", label: "Контролна табла" },
  { to: "/planning", label: "План на печење" },
  { to: "/production", label: "Реално печење" },
  { to: "/alerts", label: "Аларми" },
  { to: "/reports", label: "Извештаи" },
  { to: "/master-data", label: "Шифарници" },
  { to: "/user-access", label: "Корисници" },
  { to: "/integrations", label: "Интеграции" }
];

export function AppShell() {
  const { mode, toggle } = useTheme();
  const { user, logout } = useAuth();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">П</div>
          <div>
            <p className="brand-eyebrow">Enterprise Suite</p>
            <h1>Контрола на печење</h1>
          </div>
        </div>

        <nav className="nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link${isActive ? " nav-link--active" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <p className="topbar-eyebrow">Малопродажен синџир</p>
            <h2>Оперативен надзор и KPI</h2>
          </div>

          <div className="topbar-actions">
            <div className="user-chip">
              <strong>{user?.fullName ?? "Гостин"}</strong>
              <span>{user?.role ?? "unauthenticated"}</span>
            </div>
            <button className="theme-toggle" type="button" onClick={toggle}>
              {mode === "light" ? "Dark mode" : "Light mode"}
            </button>
            <button className="ghost-button" type="button" onClick={logout}>
              Одјава
            </button>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}
