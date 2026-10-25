import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Plus, ArrowRight, Library, Timer, Presentation as PresentIcon } from "lucide-react";
import { Button } from "../components/Button";
import { Skeleton } from "../components/Skeleton";
import { PresentationCard } from "../components/PresentationCard";
import { AddPresentationDialog } from "../components/AddPresentationDialog";
import { StorageIndicator } from "../components/StorageIndicator";
import { usePresentations } from "../helpers/usePresentationQueries";
import { useAuth } from "../helpers/useAuth";
import styles from "./dashboard.module.css";

function greetingForNow(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}` : `${pad(m)}:00`;
}

export default function DashboardPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [dialogTab, setDialogTab] = useState<"upload" | "link">("upload");
  const [searchParams, setSearchParams] = useSearchParams();

  // Result of the Canva connection redirect.
  useEffect(() => {
    const result = searchParams.get("canva");
    if (!result) return;
    if (result === "connected") {
      toast.success("Canva connected. Paste a design link to import it.");
      setDialogTab("link");
      setAddOpen(true);
    } else if (result === "denied") {
      toast.error("Canva access was not granted.");
    } else if (result === "not_configured") {
      toast.error("Canva import is not set up on this deployment yet.");
    } else {
      toast.error("Could not connect Canva. Please try again.");
    }
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);
  const { data, isLoading } = usePresentations();
  const { authState } = useAuth();

  const firstName =
    authState.type === "authenticated" ? authState.user.displayName.split(" ")[0] : null;

  const presentations = data?.presentations ?? [];

  const stats = useMemo(() => {
    const total = presentations.length;
    const totalSlides = presentations.reduce((sum, p) => sum + p.slideCount, 0);
    const timed = presentations.reduce((sum, p) => sum + p.slideTimersConfigured, 0);
    return { total, totalSlides, timed };
  }, [presentations]);

  const recent = [...presentations]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroTop}>
          <div>
            <span className={styles.eyebrow}>Presentation studio</span>
            <h1 className={styles.greeting}>
              {greetingForNow()}
              {firstName ? `, ${firstName}` : ""}
              <span className={styles.greetingDot}>.</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Keep your timing on track, from first slide to last.
            </p>
          </div>
          <div className={styles.heroActions}>
            <Button variant="secondary" size="lg" onClick={() => setAddOpen(true)}>
              <Plus className={styles.actionIcon} />
              Upload presentation
            </Button>
          </div>
        </div>

        <div className={styles.statGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIconWrap}>
              <Library className={styles.statIcon} />
            </div>
            <div className={styles.statBody}>
              <span className={styles.statValue}>{isLoading ? "—" : stats.total}</span>
              <span className={styles.statLabel}>Presentations</span>
            </div>
            <span className={styles.statCaption}>In your library</span>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconWrap}>
              <PresentIcon className={styles.statIcon} />
            </div>
            <div className={styles.statBody}>
              <span className={styles.statValue}>{isLoading ? "—" : stats.totalSlides}</span>
              <span className={styles.statLabel}>Slides</span>
            </div>
            <span className={styles.statCaption}>Across all decks</span>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconWrap}>
              <Timer className={styles.statIcon} />
            </div>
            <div className={styles.statBody}>
              <span className={styles.statValue}>{isLoading ? "—" : stats.timed}</span>
              <span className={styles.statLabel}>Timed slides</span>
            </div>
            <span className={styles.statCaption}>With a timer set</span>
          </div>
        </div>
      </section>

      <StorageIndicator />

      <section className={styles.recentSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Your presentations</h2>
          <Link to="/presentations" className={styles.viewAll}>
            View all
            <ArrowRight className={styles.viewAllIcon} />
          </Link>
        </div>
        <p className={styles.sectionSubtitle}>
          Upload a deck to start your next focused session.
        </p>

        {isLoading ? (
          <div className={styles.grid}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} style={{ height: "17rem", borderRadius: "var(--radius-md)" }} />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>No presentations yet.</p>
            <p className={styles.emptyBody}>Upload your first presentation to get started.</p>
            <Button variant="primary" onClick={() => setAddOpen(true)}>
              <Plus className={styles.actionIcon} />
              Upload presentation
            </Button>
          </div>
        ) : (
          <div className={styles.grid}>
            {recent.map((p) => (
              <PresentationCard key={p.id} presentation={p} />
            ))}
          </div>
        )}
      </section>

      <AddPresentationDialog key={dialogTab} open={addOpen} onOpenChange={setAddOpen} defaultTab={dialogTab} />
    </div>
  );
}
