import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, ArrowLeftRight, Wallet, HandCoins, PiggyBank, BarChart3, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const links = [
  { to: "/", label: "Dashboard", end: true, icon: LayoutDashboard },
  { to: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { to: "/accounts", label: "Accounts", icon: Wallet },
  { to: "/udhar", label: "Lending", icon: HandCoins },
  { to: "/budgets", label: "Budgets", icon: PiggyBank },
  { to: "/reports", label: "Reports", icon: BarChart3 },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 bg-surface border-r border-border">
        <div className="px-6 py-5 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-sm">
            AH
          </div>
          <span className="font-bold text-lg tracking-tight">Apna Hisab</span>
        </div>
        <nav className="flex-1 px-3 space-y-0.5">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-accent-soft text-accent-ink" : "text-ink-muted hover:bg-canvas hover:text-ink"
                }`
              }
            >
              <link.icon size={18} strokeWidth={2} />
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-border">
          <div className="flex items-center justify-between px-3 py-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{user?.displayName}</p>
              <p className="text-xs text-ink-faint truncate">@{user?.username}</p>
            </div>
            <button
              onClick={logout}
              aria-label="Log out"
              className="text-ink-faint hover:text-bad transition-colors shrink-0"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center text-white font-bold text-xs">
            AH
          </div>
          <span className="font-bold tracking-tight">Apna Hisab</span>
        </div>
        <button onClick={logout} aria-label="Log out" className="text-ink-faint">
          <LogOut size={18} />
        </button>
      </header>

      <main className="md:ml-60 flex-1 px-4 py-5 md:px-8 md:py-8 pb-24 md:pb-8 max-w-4xl">
        <Outlet />
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-surface border-t border-border flex">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
                isActive ? "text-accent-ink" : "text-ink-faint"
              }`
            }
          >
            <link.icon size={20} strokeWidth={2} />
            {link.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
