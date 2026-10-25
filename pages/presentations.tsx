import React, { useMemo, useState } from "react";
import { Search, Plus, AlertCircle } from "lucide-react";
import { Input } from "../components/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/Select";
import { Button } from "../components/Button";
import { Skeleton } from "../components/Skeleton";
import { PresentationCard } from "../components/PresentationCard";
import { AddPresentationDialog } from "../components/AddPresentationDialog";
import { StorageIndicator } from "../components/StorageIndicator";
import { usePresentations } from "../helpers/usePresentationQueries";
import styles from "./presentations.module.css";

type SortKey = "modified" | "presented" | "alpha";

export default function PresentationsPage() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("modified");
  const [addOpen, setAddOpen] = useState(false);

  const { data, isLoading, isError, error } = usePresentations();

  const visible = useMemo(() => {
    let list = data?.presentations ?? [];
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q));
    }
    list = [...list];
    if (sort === "modified") {
      list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } else if (sort === "presented") {
      list.sort(
        (a, b) =>
          new Date(b.lastPresentedAt ?? 0).getTime() - new Date(a.lastPresentedAt ?? 0).getTime(),
      );
    } else {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
  }, [data, query, sort]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Presentations</h1>
          <p className={styles.subtitle}>Your presentation library and storage.</p>
        </div>
        <Button variant="primary" onClick={() => setAddOpen(true)}>
          <Plus className={styles.addIcon} />
          Add Presentation
        </Button>
      </div>

      <StorageIndicator />

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search className={styles.searchIcon} />
          <Input
            placeholder="Search presentations…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className={styles.sortTrigger}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="modified">Recently modified</SelectItem>
            <SelectItem value="presented">Recently presented</SelectItem>
            <SelectItem value="alpha">Alphabetical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className={styles.grid}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} style={{ height: "17rem", borderRadius: "var(--radius-md)" }} />
          ))}
        </div>
      ) : isError ? (
        <div className={styles.errorState}>
          <AlertCircle className={styles.errorIcon} />
          <p className={styles.emptyTitle}>Couldn't load your presentations.</p>
          <p className={styles.emptyBody}>
            {error instanceof Error ? error.message : "Please try again."}
          </p>
        </div>
      ) : visible.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>
            {query.trim() ? "No presentations match that search." : "No presentations yet."}
          </p>
          <p className={styles.emptyBody}>
            {query.trim()
              ? "Try a different search term."
              : "Upload your first presentation to get started."}
          </p>
          {!query.trim() && (
            <Button variant="primary" onClick={() => setAddOpen(true)} className={styles.emptyButton}>
              <Plus className={styles.addIcon} />
              Add Presentation
            </Button>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {visible.map((p) => (
            <PresentationCard key={p.id} presentation={p} />
          ))}
        </div>
      )}

      <AddPresentationDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
