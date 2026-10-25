import React, { useState } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/Select";
import { Switch } from "../components/Switch";
import { Separator } from "../components/Separator";
import { Button } from "../components/Button";
import styles from "./settings.module.css";

type TimerDisplay = "global" | "slide" | "both" | "none";
type TimerStyle = "minimal" | "digital" | "compact";
type TimerPosition =
  | "top-left" | "top-center" | "top-right"
  | "bottom-left" | "bottom-center" | "bottom-right";

const POSITIONS: { value: TimerPosition; label: string }[] = [
  { value: "top-left", label: "Top left" },
  { value: "top-center", label: "Top center" },
  { value: "top-right", label: "Top right" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "bottom-center", label: "Bottom center" },
  { value: "bottom-right", label: "Bottom right" },
];

export default function SettingsPage() {
  const [timerDisplay, setTimerDisplay] = useState<TimerDisplay>("both");
  const [timerStyle, setTimerStyle] = useState<TimerStyle>("digital");
  const [position, setPosition] = useState<TimerPosition>("top-right");
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [resumeOnRevisit, setResumeOnRevisit] = useState(true);
  const [autoFullscreen, setAutoFullscreen] = useState(true);
  const [warningsEnabled, setWarningsEnabled] = useState(true);

  const handleSave = () => {
    toast("Settings saved — defaults apply the next time you present.");
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>Defaults for how presentations and timers behave.</p>
      </div>

      <div className={styles.panel}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Timer display</h2>
          <p className={styles.sectionBody}>Choose what's shown prominently while you present.</p>

          <div className={styles.row}>
            <div className={styles.rowLabel}>
              <span className={styles.rowTitle}>Default display</span>
              <span className={styles.rowHint}>Global timer, slide timer, both, or none</span>
            </div>
            <Select value={timerDisplay} onValueChange={(v) => setTimerDisplay(v as TimerDisplay)}>
              <SelectTrigger className={styles.control}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Global timer</SelectItem>
                <SelectItem value="slide">Slide timer</SelectItem>
                <SelectItem value="both">Both</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className={styles.row}>
            <div className={styles.rowLabel}>
              <span className={styles.rowTitle}>Timer style</span>
              <span className={styles.rowHint}>Minimal, Digital, or Compact</span>
            </div>
            <Select value={timerStyle} onValueChange={(v) => setTimerStyle(v as TimerStyle)}>
              <SelectTrigger className={styles.control}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minimal">Minimal</SelectItem>
                <SelectItem value="digital">Digital</SelectItem>
                <SelectItem value="compact">Compact</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className={styles.row}>
            <div className={styles.rowLabel}>
              <span className={styles.rowTitle}>Timer position</span>
              <span className={styles.rowHint}>Where the timer sits on your slides</span>
            </div>
            <Select value={position} onValueChange={(v) => setPosition(v as TimerPosition)}>
              <SelectTrigger className={styles.control}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POSITIONS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className={styles.row}>
            <div className={styles.rowLabel}>
              <span className={styles.rowTitle}>Time warnings</span>
              <span className={styles.rowHint}>Subtle visual cue as a slide timer runs low</span>
            </div>
            <Switch checked={warningsEnabled} onCheckedChange={setWarningsEnabled} />
          </div>
        </section>

        <Separator className={styles.divider} />

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Slide timer behavior</h2>
          <p className={styles.sectionBody}>How slide-specific timers act as you move around.</p>

          <div className={styles.row}>
            <div className={styles.rowLabel}>
              <span className={styles.rowTitle}>Auto Advance</span>
              <span className={styles.rowHint}>Move to the next slide when its timer hits zero</span>
            </div>
            <Switch checked={autoAdvance} onCheckedChange={setAutoAdvance} />
          </div>

          <div className={styles.row}>
            <div className={styles.rowLabel}>
              <span className={styles.rowTitle}>Resume on revisit</span>
              <span className={styles.rowHint}>Continue a slide's timer from where it stopped, rather than restarting it</span>
            </div>
            <Switch checked={resumeOnRevisit} onCheckedChange={setResumeOnRevisit} />
          </div>
        </section>

        <Separator className={styles.divider} />

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Full screen</h2>
          <p className={styles.sectionBody}>Behavior when you click Start Presentation.</p>

          <div className={styles.row}>
            <div className={styles.rowLabel}>
              <span className={styles.rowTitle}>Enter full screen automatically</span>
              <span className={styles.rowHint}>Skip the extra click when presenting</span>
            </div>
            <Switch checked={autoFullscreen} onCheckedChange={setAutoFullscreen} />
          </div>
        </section>

        <div className={styles.footer}>
          <Button variant="primary" onClick={handleSave}>Save changes</Button>
        </div>
      </div>
    </div>
  );
}
