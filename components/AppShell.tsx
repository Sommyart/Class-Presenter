import React, { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Clock3, LayoutGrid, Presentation, Settings as SettingsIcon, LogOut } from "lucide-react";
import { ThemeModeSwitch } from "./ThemeModeSwitch";
import { Button } from "./Button";
import { useAuth } from "../helpers/useAuth";
import styles from "./AppShell.module.css";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/presentations", label: "Presentations", icon: Presentation },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export const AppShell = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { authState, logout } = useAuth();
  const displayName = authState.type === "authenticated" ? authState.user.displayName : "";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link to="/" className={styles.brand}>
          <Clock3 className={styles.brandIcon} />
          <span>
            <span className={styles.brandName}>Class</span>
            <span className={styles.brandAccent}>Presenter</span>
          </span>
        </Link>

        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => {
            const active = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
              >
                <item.icon className={styles.navIcon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          {displayName && <span className={styles.userName}>{displayName}</span>}
          <div className={styles.sidebarFooterRow}>
            <ThemeModeSwitch />
            <Button variant="ghost" size="icon-sm" onClick={handleLogout} aria-label="Log out">
              <LogOut className={styles.logoutIcon} />
            </Button>
          </div>
        </div>
      </aside>

      <div className={styles.contentColumn}>
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
};
