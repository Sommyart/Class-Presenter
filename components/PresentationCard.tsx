import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  FileText,
  Presentation as PptxIcon,
  Link2,
  MoreVertical,
  Pencil,
  Play,
  Trash2,
  Clock3,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./DropdownMenu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./Dialog";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Spinner } from "./Spinner";
import { presentationAdapters } from "../helpers/presentationAdapters";
import { formatBytes } from "../helpers/storageConfig";
import { useDeletePresentation } from "../helpers/usePresentationQueries";
import type { PresentationListItem } from "../endpoints/presentations/list_GET.schema";
import type { PresentationSourceType } from "../helpers/schema";
import styles from "./PresentationCard.module.css";

const SOURCE_ICON: Record<PresentationSourceType, React.ComponentType<{ className?: string }>> = {
  pptx: PptxIcon,
  pdf: FileText,
  canva: Link2,
  google_slides: Link2,
};

function formatRelative(value: Date | null): string {
  if (!value) return "Never";
  const date = new Date(value);
  const days = Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.round(days / 7)}w ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface PresentationCardProps {
  presentation: PresentationListItem;
  className?: string;
}

export const PresentationCard = ({ presentation, className }: PresentationCardProps) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const deleteMutation = useDeletePresentation();
  const adapter = presentationAdapters[presentation.sourceType];
  const Icon = SOURCE_ICON[presentation.sourceType];

  const handleDelete = () => {
    deleteMutation.mutate(presentation.id, {
      onSuccess: (result) => {
        setConfirmOpen(false);
        if (result.assetsFailed > 0) {
          // Don't claim a clean sweep when some files resisted deletion.
          toast.warning(
            `Deleted "${presentation.title}", but ${result.assetsFailed} file(s) couldn't be removed from storage.`,
          );
        } else {
          toast.success(`Deleted "${presentation.title}" — ${formatBytes(presentation.fileSizeBytes)} freed.`);
        }
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Could not delete the presentation.");
      },
    });
  };

  return (
    <div className={`${styles.card} ${className ?? ""}`}>
      <Link to={`/presentations/${presentation.id}/edit`} className={styles.thumb}>
        {presentation.thumbnailUrl ? (
          <img
            src={presentation.thumbnailUrl}
            alt=""
            className={styles.thumbImage}
            loading="lazy"
          />
        ) : (
          <Icon className={styles.thumbIcon} />
        )}
      </Link>

      <div className={styles.body}>
        <div className={styles.titleRow}>
          <h3 className={styles.title} title={presentation.title}>{presentation.title}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="More actions">
                <MoreVertical className={styles.moreIcon} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/presentations/${presentation.id}/edit`}>
                  <Pencil className={styles.menuIcon} />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/present/${presentation.id}`}>
                  <Play className={styles.menuIcon} />
                  Present
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setConfirmOpen(true)} className={styles.deleteItem}>
                <Trash2 className={styles.menuIcon} />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className={styles.metaRow}>
          <Badge variant="secondary" className={styles.sourceBadge}>{adapter.label}</Badge>
          <span className={styles.metaText}>{presentation.slideCount} slides</span>
          <span className={styles.metaText}>{formatBytes(presentation.fileSizeBytes)}</span>
          {presentation.slideTimersConfigured > 0 && (
            <span className={styles.metaText}>
              <Clock3 className={styles.metaIcon} />
              {presentation.slideTimersConfigured} timed
            </span>
          )}
        </div>

        <div className={styles.dateRow}>
          <span>Added {formatRelative(presentation.createdAt)}</span>
          <span>·</span>
          <span>Presented {formatRelative(presentation.lastPresentedAt)}</span>
        </div>

        <div className={styles.actions}>
          <Button asChild variant="primary" size="sm" className={styles.presentButton}>
            <Link to={`/present/${presentation.id}`}>
              <Play className={styles.presentIcon} />
              Present
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to={`/presentations/${presentation.id}/edit`}>Edit</Link>
          </Button>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={(o) => !deleteMutation.isPending && setConfirmOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this presentation?</DialogTitle>
            <DialogDescription>
              "{presentation.title}" and its slide thumbnails will be permanently deleted from
              cloud storage, freeing {formatBytes(presentation.fileSizeBytes)}. This can't be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <Spinner size="sm" /> : <Trash2 className={styles.menuIcon} />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
