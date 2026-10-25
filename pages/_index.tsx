import React from "react";
import { Link } from "react-router-dom";
import {
  Clock3,
  Upload,
  Timer,
  Presentation,
  MonitorPlay,
  Users,
  ShieldCheck,
  LineChart,
  BellRing,
  Palette,
  GraduationCap,
  Mic2,
  Church,
  Briefcase,
  Users2,
  BookOpen,
  Wrench,
  Sparkles,
  FileText,
  Link2,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/Accordion";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { useScrollReveal } from "../helpers/useScrollReveal";
import styles from "./_index.module.css";

const FEATURES = [
  {
    icon: Timer,
    title: "A timer that never resets",
    body: "Countdown or count-up, running independently from your slides — changing slides, going full screen, or losing focus never touches it.",
  },
  {
    icon: Clock3,
    title: "Per-slide timers",
    body: "Give any slide its own time budget. The moment you land on it, its timer starts; leave it, and the timer stops — automatically.",
  },
  {
    icon: MonitorPlay,
    title: "Global + slide timers together",
    body: "Track the whole presentation and the current slide at once, or show just the one you care about.",
  },
  {
    icon: BellRing,
    title: "Time warnings",
    body: "Set a warning point — like 1 minute left on a slide — with a subtle visual cue, never a jarring alarm.",
  },
  {
    icon: FileText,
    title: "PPTX, PDF, Canva & Google Slides",
    body: "Upload a file or import a link — every source feeds into the same clean presentation viewer.",
  },
  {
    icon: Palette,
    title: "Minimal, Digital, or Compact styles",
    body: "Pick a timer style that fits the room, positioned wherever it stays out of your slide's way.",
  },
];

const STEPS = [
  { icon: Upload, title: "Add your presentation", body: "Upload a .pptx or .pdf, or paste a Canva or Google Slides link." },
  { icon: Clock3, title: "Configure slide timers", body: "Open any slide's settings and give it its own duration — or set one global timer for the whole talk." },
  { icon: Presentation, title: "Start presenting", body: "One click opens full screen with timers already running, right on schedule." },
  { icon: Timer, title: "Present, distraction-free", body: "Controls fade away automatically; your slide and your time stay the only things on screen." },
];

const USE_CASES = [
  { icon: GraduationCap, title: "Teachers", body: "Give each part of a lesson its own time budget and keep the whole period on pace." },
  { icon: BookOpen, title: "Lecturers", body: "Hold a 50-minute lecture to 50 minutes, slide by slide." },
  { icon: Wrench, title: "Trainers", body: "Run structured modules back to back without losing the room." },
  { icon: Mic2, title: "Tutors", body: "Give every session the same shape, session after session." },
  { icon: Church, title: "Church teachers", body: "Teach a study or message and still land the close on time." },
  { icon: Users, title: "Workshop facilitators", body: "Time each activity precisely, with auto-advance if you want it." },
  { icon: Briefcase, title: "Corporate presenters", body: "Walk into a stakeholder review knowing exactly how much runway is left." },
  { icon: Sparkles, title: "Coaches", body: "Time drills and segments precisely, without breaking eye contact to check a phone." },
];

const FAQ = [
  {
    q: "Do I need to install anything?",
    a: "No — ClassPresenter runs in your browser. A desktop companion is planned for a true always-on-top timer that stays visible over other applications.",
  },
  {
    q: "What happens when a slide timer hits zero?",
    a: "It stops at 00:00 and shows a subtle visual cue — it never counts into negative numbers, and it only advances to the next slide if you've turned Auto Advance on.",
  },
  {
    q: "What if I jump back to a slide I already presented?",
    a: "Its timer resumes from where it left off, rather than restarting — so a slide you glance back at doesn't quietly get extra time.",
  },
  {
    q: "Which presentation formats are supported?",
    a: "PPTX and PDF upload directly. Canva and Google Slides are supported via link import where the required integration is available — we never fake an import we can't actually render.",
  },
  {
    q: "Can I use it for a live lecture with slides I don't fully control?",
    a: "Yes — the timer runs independently of your slides, so changing slides, going full screen, or briefly losing focus never resets it.",
  },
];

export default function LandingPage() {
  const heroRef = useScrollReveal();
  const problemRef = useScrollReveal();
  const solutionRef = useScrollReveal();
  const featuresRef = useScrollReveal();
  const stepsRef = useScrollReveal();
  const useCasesRef = useScrollReveal();
  const faqRef = useScrollReveal();
  const ctaRef = useScrollReveal();

  return (
    <div className={styles.page}>
      <header className={styles.nav}>
        <div className={styles.navInner}>
          <Link to="/" className={styles.brand}>
            <Clock3 className={styles.brandIcon} />
            <span>ClassPresenter</span>
          </Link>
          <nav className={styles.navLinks}>
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className={styles.navActions}>
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard">Open App</Link>
            </Button>
            <Button asChild variant="primary" size="sm">
              <Link to="/presentations">Start Presenting</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className={styles.hero}>
          <div ref={heroRef} className={styles.heroReveal} data-revealed="false">
            <Badge variant="secondary" className={styles.heroBadge}>
              For teachers, trainers, coaches &amp; presenters
            </Badge>
            <h1 className={styles.heroTitle}>
              Present with confidence.
              <br />
              Keep your time in sight.
            </h1>
            <p className={styles.heroSubtitle}>
              Upload your slides, give any of them their own timer, and start
              presenting — with your time visible the entire way through,
              independent of your slides, so you always know exactly where
              you stand.
            </p>
            <div className={styles.heroActions}>
              <Button asChild variant="primary" size="lg">
                <Link to="/presentations">Start Presenting</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#how-it-works">See How It Works</a>
              </Button>
            </div>

            <div className={styles.heroMock} aria-hidden="true">
              <div className={styles.heroMockBar}>
                <span className={styles.heroMockDot} />
                <span className={styles.heroMockDot} />
                <span className={styles.heroMockDot} />
              </div>
              <div className={styles.heroMockSlide}>
                <span className={styles.heroMockSlideText}>Q3 Results — Slide 4 / 12</span>
                <div className={styles.heroMockTimer}>18:24</div>
              </div>
            </div>
          </div>
        </section>

        {/* PROBLEM */}
        <section className={styles.section}>
          <div ref={problemRef} className={styles.reveal} data-revealed="false">
            <span className={styles.eyebrow}>The problem</span>
            <h2 className={styles.sectionTitle}>
              Presentation tools show your slides. None of them keep your time.
            </h2>
            <p className={styles.sectionBody}>
              A phone on the podium gets ignored. A wall clock is never in
              your eyeline. Presentation software has no idea how much time
              you have left on this slide or the whole talk — so lessons
              run long, workshops overrun their slots, and talks end in a
              rush through the last third of the slides.
            </p>
          </div>
        </section>

        {/* SOLUTION */}
        <section className={styles.sectionAlt}>
          <div ref={solutionRef} className={styles.reveal} data-revealed="false">
            <span className={styles.eyebrow}>The solution</span>
            <h2 className={styles.sectionTitle}>
              A timer built into every slide — and the whole presentation.
            </h2>
            <p className={styles.sectionBody}>
              ClassPresenter overlays a persistent timer on top of your
              slides, running the whole way through. Give individual slides
              their own time budget and the timer starts and stops
              automatically as you move between them — completely
              independent of slide rendering.
            </p>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className={styles.section}>
          <div ref={featuresRef} data-revealed="false" className={styles.reveal}>
            <span className={styles.eyebrow}>Features</span>
            <h2 className={styles.sectionTitle}>Everything a presenter actually needs</h2>
          </div>
          <div className={styles.featureGrid}>
            {FEATURES.map((f) => (
              <div key={f.title} className={styles.featureCard}>
                <f.icon className={styles.featureIcon} />
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureBody}>{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className={styles.sectionAlt}>
          <div ref={stepsRef} data-revealed="false" className={styles.reveal}>
            <span className={styles.eyebrow}>How it works</span>
            <h2 className={styles.sectionTitle}>From upload to presenting in under a minute</h2>
          </div>
          <div className={styles.stepsGrid}>
            {STEPS.map((s, i) => (
              <div key={s.title} className={styles.stepCard}>
                <div className={styles.stepNumber}>{String(i + 1).padStart(2, "0")}</div>
                <s.icon className={styles.stepIcon} />
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepBody}>{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* USE CASES */}
        <section className={styles.section}>
          <div ref={useCasesRef} data-revealed="false" className={styles.reveal}>
            <span className={styles.eyebrow}>Who it's for</span>
            <h2 className={styles.sectionTitle}>Built for anyone who presents on a clock</h2>
          </div>
          <div className={styles.useCaseGrid}>
            {USE_CASES.map((u) => (
              <div key={u.title} className={styles.useCaseCard}>
                <u.icon className={styles.useCaseIcon} />
                <h3 className={styles.useCaseTitle}>{u.title}</h3>
                <p className={styles.useCaseBody}>{u.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className={styles.section}>
          <div ref={faqRef} data-revealed="false" className={styles.reveal}>
            <span className={styles.eyebrow}>FAQ</span>
            <h2 className={styles.sectionTitle}>Questions, answered</h2>
            <div className={styles.faqWrap}>
              <Accordion type="single" collapsible>
                {FAQ.map((item, i) => (
                  <AccordionItem key={item.q} value={`faq-${i}`}>
                    <AccordionTrigger>{item.q}</AccordionTrigger>
                    <AccordionContent>{item.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className={styles.finalCta}>
          <div ref={ctaRef} data-revealed="false" className={styles.reveal}>
            <ShieldCheck className={styles.finalCtaIcon} />
            <h2 className={styles.finalCtaTitle}>Your next presentation deserves a timer that works.</h2>
            <div className={styles.heroActions}>
              <Button asChild variant="primary" size="lg">
                <Link to="/presentations">Start Presenting</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#how-it-works">See How It Works</a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.brand}>
            <Clock3 className={styles.brandIcon} />
            <span>ClassPresenter</span>
          </div>
          <p>© {new Date().getFullYear()} ClassPresenter. Present with confidence.</p>
        </div>
      </footer>
    </div>
  );
}
