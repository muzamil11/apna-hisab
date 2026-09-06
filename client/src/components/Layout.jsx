import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const links = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/transactions", label: "Transactions" },
  { to: "/accounts", label: "Accounts" },
  { to: "/udhar", label: "Udhar" },
  { to: "/budgets", label: "Budgets" },
  { to: "/reports", label: "Reports" },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <header className="md:w-56 md:min-h-screen bg-white border-b md:border-b-0 md:border-r border-slate-200 flex md:flex-col">
        <div className="px-4 py-4 font-semibold text-lg text-ink hidden md:block">Apna Hisab</div>
        <nav className="flex md:flex-col overflow-x-auto md:overflow-visible flex-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 md:border-b-0 md:border-l-2 ${
                  isActive
                    ? "border-accent text-accent bg-blue-50/50"
                    : "border-transparent text-slate-500 hover:text-ink"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden md:block px-4 py-4 text-sm text-slate-500 border-t border-slate-200">
          <div className="mb-2">{user?.displayName}</div>
          <button onClick={logout} className="text-accent hover:underline">
            Logout
          </button>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-8 max-w-5xl">
        <Outlet />
      </main>
    </div>
  );
}
