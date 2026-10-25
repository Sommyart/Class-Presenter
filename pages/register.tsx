import React from "react";
import { Link } from "react-router-dom";
import { Clock3 } from "lucide-react";
import { PasswordRegisterForm } from "../components/PasswordRegisterForm";
import { OAuthButtonGroup } from "../components/OAuthButtonGroup";
import styles from "./login.module.css";

export default function RegisterPage() {
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
        <h1 className={styles.title}>Create your account</h1>
        <p className={styles.subtitle}>1 GB of storage for your presentations, free to start.</p>

        <OAuthButtonGroup />

        <div className={styles.divider}>
          <span>or</span>
        </div>

        <PasswordRegisterForm />

        <p className={styles.switchLine}>
          Already have an account? <Link to="/login" className={styles.switchLink}>Log in</Link>
        </p>
      </div>
    </div>
  );
}
