import React from "react";
import { Link } from "react-router-dom";
import { HardDrive, AlertTriangle } from "lucide-react";
import { Progress } from "./Progress";
import { Button } from "./Button";
import { Skeleton } from "./Skeleton";
import { useStorageUsage } from "../helpers/usePresentationQueries";
import { formatBytes, getStorageState, getStorageMessage } from "../helpers/storageConfig";
import styles from "./StorageIndicator.module.css";

export const StorageIndicator = ({ className }: { className?: string }) => {
  const { data, isLoading, isError } = useStorageUsage();

  if (isLoading) {
    return (
      <div className={`${styles.card} ${className ?? ""}`}>
        <Skeleton style={{ height: "1rem", width: "60%" }} />
        <Skeleton style={{ height: "0.5rem", width: "100%", marginTop: "0.75rem" }} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={`${styles.card} ${className ?? ""}`}>
        <span className={styles.label}>Storage</span>
        <p className={styles.errorText}>Couldn't load your storage usage.</p>
      </div>
    );
  }

  const state = getStorageState(data.usedBytes, data.quotaBytes);
  const message = getStorageMessage(state);
  const percent = Math.min(100, Math.round((data.usedBytes / data.quotaBytes) * 100));

  return (
    <div className={`${styles.card} ${styles[state]} ${className ?? ""}`}>
      <div className={styles.header}>
        <span className={styles.label}>
          <HardDrive className={styles.labelIcon} />
          Storage
        </span>
        <span className={styles.amount}>
          {formatBytes(data.usedBytes)} / {formatBytes(data.quotaBytes)}
        </span>
      </div>

      <Progress value={percent} className={styles.bar} />

      <div className={styles.footer}>
        <span className={styles.remaining}>{formatBytes(data.remainingBytes)} remaining</span>
        {state === "full" && (
          <Button asChild variant="outline" size="sm">
            <Link to="/presentations">View History</Link>
          </Button>
        )}
      </div>

      {message && (
        <p className={styles.message}>
          <AlertTriangle className={styles.messageIcon} />
          {message}
        </p>
      )}
    </div>
  );
};
