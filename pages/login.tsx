import React from "react";
import { Link } from "react-router-dom";
import { Clock3 } from "lucide-react";
import { PasswordLoginForm } from "../components/PasswordLoginForm";
import { OAuthButtonGroup } from "../components/OAuthButtonGroup";
import styles from "./login.module.css";

export default function LoginPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Link to="/" className={styles.brand}>
          <Clock3 className={styles.brandIcon} />
          <span>
            <span className={styles.brandName}>Class</span>
            <span className={styles.brandAccent}>Presenter</span>
          </span>
        </Link>
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>Log in to your presentation library.</p>

        <OAuthButtonGroup />

        <div className={styles.divider}>
          <span>or</span>
        </div>

        <PasswordLoginForm />

        <p className={styles.switchLine}>
          Don't have an account? <Link to="/register" className={styles.switchLink}>Create one</Link>
        </p>
      </div>
    </div>
  );
}
