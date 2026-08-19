import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../lib/authStore";

const commonLinks = [
  { to: "/marketplace", label: "Shop" },
  { to: "/local", label: "Local" },
  { to: "/pc-builder", label: "PC Builder" },
  { to: "/compare", label: "Compare" },
  { to: "/advisor", label: "Advisor" },
  { to: "/repair", label: "Repair" },
];

const roleLinks = {
  vendor: [{ to: "/vendor/dashboard", label: "Vendor Dashboard" }],
  technician: [{ to: "/technician/dashboard", label: "Technician Dashboard" }],
  admin: [{ to: "/admin", label: "Admin" }],
};

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const links = [...commonLinks, ...(user ? roleLinks[user.role] || [] : [])];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
          <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-circuit text-[11px] font-bold text-white">
            L
          </span>
          LOCALYNC
        </Link>

        <nav className="hidden items-center gap-6 font-body text-[13px] text-subink lg:flex">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="whitespace-nowrap transition hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              {user.role === "customer" && (
                <>
                  <Link to="/cart" className="rounded-full border border-line px-3.5 py-2 text-xs transition hover:border-ink">
                    Cart
                  </Link>
                  <Link to="/orders" className="hidden text-xs text-subink hover:text-ink sm:inline">
                    Orders
                  </Link>
                </>
              )}
              <span className="hidden font-mono text-xs text-subink sm:inline">
                {user.name.split(" ")[0]} · {user.role}
              </span>
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="rounded-full border border-line px-4 py-2 text-sm transition hover:border-ink"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full px-4 py-2 text-sm text-subink transition hover:text-ink"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-circuit"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
