CLASSPRESENTER DESIGN PRINCIPLES (v2 — "the focused workspace")

SUPERSEDES v1 ("the steady instrument" — amber/terracotta, serif display,
hairline borders). The user supplied a concrete visual reference to match:
purple/lavender, bold rounded-geometric display type, fully pill-shaped
buttons and inputs, a greeting-led dashboard with a tinted hero panel and
stat cards. Match that reference; the notes below describe it as a system.

THREAD: "the focused workspace." ClassPresenter should feel like a calm,
premium productivity tool built for one clear session at a time — closer
to a modern writing/focus app than to enterprise SaaS. Soft lavender
surfaces, pill-shaped controls (radius-full on every button, input, and
badge), and one confident violet accent against a mostly white/near-black
neutral base. Cards float on white with soft, tinted shadows rather than
hairline borders — the previous system's "precision instrument" hairlines
are gone.

MODES: both light and dark. Light is the primary/reference mode (matches
the supplied screenshot exactly). Dark inverts the neutrals while keeping
the same violet accent, slightly brightened for contrast.

PACING: generous throughout, not just on the landing page — big greeting
headline, roomy stat cards, comfortable gaps between sections. This system
trades the old "dense dashboard" register for an airier, friendlier one.

SURFACE: white page background. A tinted lavender panel is used for
hero/emphasis blocks (e.g. the dashboard greeting area) with white cards
floating on top of it. Elsewhere (library, settings) cards float directly
on white. Borders are rare; separation comes from soft shadow + the
lavender tint, not hairlines.

TYPE: Sora for display/headings — bold, geometric, rounded enough to feel
approachable at very large sizes (the "Good morning, Alex." treatment).
Inter for UI/body text — quiet and highly legible at small dashboard
sizes. JetBrains Mono stays for every timer/duration value — tabular
figures so ticking seconds never reflow the layout.

ACCENT USAGE: violet is reserved for primary actions (pill buttons),
active nav/tab states, links like "Timer presets" / "Session analytics",
and the timer digits themselves. A second neutral pill button style
(near-black fill, white text — the --secondary token) is used for the
other primary-weight action on a screen (e.g. "Upload presentation" next
to "Import link") so two strong actions can sit side by side without both
being violet.
