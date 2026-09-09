/**
 * The reference console's own fixture data, transcribed so the two screens can
 * be diffed on layout rather than on content. Numbers match the reference's
 * `METRICS.all` and `AUTONOMY.all`.
 */
export const KPIS = [
  { label: "Open alerts", value: "128", unit: "", sub: "9 critical unassigned", good: false, delta: "+14", tone: "high" as const },
  { label: "MTTD", value: "7.4", unit: "min", sub: "detect", good: true, delta: "−1.2 min", tone: "med" as const },
  { label: "MTTR", value: "38", unit: "min", sub: "contain", good: true, delta: "−6 min", tone: "violet" as const },
  { label: "False positive rate", value: "34", unit: "%", sub: "of closed alerts", good: true, delta: "−5 pts", tone: "neutral" as const },
];

/** 24h of alert volume, the shape the reference's step area draws. */
export const VOLUME = [
  38, 38, 38, 41, 41, 44, 48, 48, 44, 41, 38, 38, 42, 58, 66, 68, 68, 62, 58,
  52, 52, 58, 64, 70, 68, 62, 58, 60, 66, 72, 70, 64, 58, 56, 62, 68,
];

export const VOLUME_LABELS = ["00:00", "06:00", "12:00", "18:00", "now"];

export const SEVERITY_SLICES = [
  { label: "Critical", value: 9 },
  { label: "High", value: 31 },
  { label: "Medium", value: 48 },
  { label: "Low", value: 40 },
];

/* Tones exactly as the reference assigns them: SRC_COLOR gives EDR the high
   mark, Identity the medium one, Network its violet accent and Cloud the low
   mark; the decision and outcome nodes take ok / high and low / medium /
   critical. */
export const FLOW_NODES = [
  { id: "edr", column: 0, label: "EDR", tone: "high" as const },
  { id: "identity", column: 0, label: "Identity", tone: "med" as const },
  { id: "network", column: 0, label: "Network", tone: "violet" as const },
  { id: "cloud", column: 0, label: "Cloud", tone: "low" as const },
  { id: "auto", column: 1, label: "Closed by agent", tone: "ok" as const },
  { id: "human", column: 1, label: "To an analyst", tone: "high" as const },
  { id: "benign", column: 2, label: "Benign", tone: "low" as const },
  { id: "tuned", column: 2, label: "Sent to tuning", tone: "med" as const },
  { id: "case", column: 2, label: "Escalated to client", tone: "crit" as const },
];

export const FLOW_LINKS = [
  { from: "edr", to: "auto", value: 424 },
  { from: "edr", to: "human", value: 62 },
  { from: "identity", to: "auto", value: 268 },
  { from: "identity", to: "human", value: 63 },
  { from: "network", to: "auto", value: 302 },
  { from: "network", to: "human", value: 48 },
  { from: "cloud", to: "auto", value: 158 },
  { from: "cloud", to: "human", value: 32 },
  { from: "auto", to: "benign", value: 899 },
  { from: "auto", to: "tuned", value: 253 },
  { from: "human", to: "case", value: 119 },
  { from: "human", to: "benign", value: 56 },
  { from: "human", to: "tuned", value: 30 },
];

export const TENANTS = [
  { id: "all", name: "All" },
  { id: "nwb", name: "Northwind Bank" },
  { id: "mrh", name: "Meridian Health" },
  { id: "vtx", name: "Vertex Logistics" },
];

export const ALERTS = [
  { id: "AL-2291", title: "Credential dumping via LSASS memory access", severity: "Critical" as const, verdict: "True positive", status: "New", rule: "WIN-CRED-014", source: "CrowdStrike Falcon", host: "FIN-WS-2214", user: "a.voss", confidence: 94, owner: "You", ago: "6m ago" },
  { id: "AL-2288", title: "Beaconing to newly registered domain", severity: "Critical" as const, verdict: "True positive", status: "Investigating", rule: "NET-BCN-007", source: "Zeek", host: "FIN-WS-2214", user: "a.voss", confidence: 89, owner: "You", ago: "3m ago" },
  { id: "AL-2298", title: "Impossible travel — two regions in 14 minutes", severity: "High" as const, verdict: "Needs human", status: "New", rule: "IDP-GEO-002", source: "Microsoft Entra ID", host: "—", user: "m.kurisu", confidence: 61, owner: "Unassigned", ago: "19m ago" },
  { id: "AL-2281", title: "Mass file rename consistent with ransomware staging", severity: "High" as const, verdict: "True positive", status: "Contained", rule: "FS-RANSOM-003", source: "CrowdStrike Falcon", host: "HR-FS-01", user: "svc-backup", confidence: 78, owner: "A. Voss", ago: "2h ago" },
  { id: "AL-2285", title: "Repeated failed sudo attempts on build server", severity: "Medium" as const, verdict: "Likely benign", status: "New", rule: "LNX-PRIV-011", source: "auditd", host: "BLD-SRV-04", user: "ci-runner", confidence: 71, owner: "Unassigned", ago: "55m ago" },
  { id: "AL-2274", title: "OAuth consent granted to unverified application", severity: "Medium" as const, verdict: "Needs human", status: "New", rule: "IDP-OAUTH-005", source: "Microsoft Entra ID", host: "—", user: "n.lindqvist", confidence: 66, owner: "N. Lindqvist", ago: "4h ago" },
  { id: "AL-2270", title: "Encoded PowerShell from patch tooling", severity: "Low" as const, verdict: "Likely benign", status: "False positive", rule: "WIN-PS-022", source: "CrowdStrike Falcon", host: "IT-MGT-09", user: "svc-patch", confidence: 96, owner: "M. Kurisu", ago: "5h ago" },
];

export const CASES = [
  { id: "CS-118", tenant: "Northwind Bank", title: "Suspected credential theft — finance segment", severity: "Critical" as const, status: "Investigating", owner: "You", alerts: 2, at: "18 Aug 2026, 12:44", sla: 62, slaLabel: "2h 43m left", slaTarget: "Containment in 8h", needs: "Approve containment of FIN-WS-2214" },
  { id: "CS-117", tenant: "Meridian Health", title: "Ransomware staging on HR file share", severity: "High" as const, status: "Contained", owner: "A. Voss", alerts: 1, at: "18 Aug 2026, 10:33", sla: 48, slaLabel: "3h 17m left", slaTarget: "Resolution in 24h", needs: "Confirm restore from 03:00 snapshot" },
];

/* --- AI investigation ------------------------------------------------- */
export const AUTONOMY = { handled: 1357, auto: 1152, human: 205 };

/* Names and tints exactly as the reference's AGENTS map has them: triage takes
   the medium mark, investigation its violet accent, the dispatcher the ok mark
   and containment the high one. */
export const AGENTS = [
  { key: "triage", name: "Triage Agent", runs: 1421, avg: "0.8s", tone: "med" as const },
  { key: "invest", name: "Investigation Agent", runs: 1284, avg: "2.1s", tone: "violet" as const },
  { key: "assign", name: "Dispatcher Agent", runs: 486, avg: "6.4s", tone: "ok" as const },
  { key: "contain", name: "Containment Agent", runs: 205, avg: "3.7s", tone: "high" as const },
];

/* --- False positives by source ---------------------------------------- */
/* [name, total alerts, false-positive rate as a percentage] */
export const FP_BY_SOURCE: [string, number, number][] = [
  ["Zeek", 350, 58],
  ["auditd", 190, 41],
  ["CrowdStrike Falcon", 486, 27],
  ["Microsoft Entra ID", 331, 18],
];

/* --- Assigned to analysts --------------------------------------------- */
export const QUEUE: [string, number][] = [
  ["Unassigned", 17],
  ["A. Voss", 12],
  ["M. Kurisu", 9],
  ["N. Lindqvist", 6],
  ["You", 4],
];

/* --- Alert detail ------------------------------------------------------
   The reference's AL-2291 in full: an alert carries not just its own facts but
   the agent's whole investigation, which is what the detail screen is for. */
export const ALERT_DETAIL = {
  id: "AL-2291",
  severity: "Critical" as const,
  status: "New",
  title: "Credential dumping via LSASS memory access",
  rule: "WIN-CRED-014",
  sensor: "CrowdStrike Falcon",
  time: "12:41",
  ago: "6m ago",
  assignee: null as string | null,
  case: "CS-118",
  tactic: "Credential Access",
  tech: "T1003.001",
  fpRate: 6,
  summary:
    "A non-standard process opened a handle to lsass.exe with PROCESS_VM_READ. The parent chain traces back to an Office macro, and the same host began beaconing ninety seconds later.",
  ai: {
    verdict: "True positive",
    confidence: 94,
    took: "38s",
    agent: "invest" as const,
    assignedBy: "assign" as const,
    assignedTo: "You",
    why: "Tier 1 finance asset with credential access — routed to the on-shift lead.",
    reasoning:
      "Macro-spawned rundll32 opened LSASS with read access, then the same host contacted a four-day-old domain 90 seconds later. Rule WIN-CRED-014 has a 6% false-positive history and the parent chain has no signed provenance. Every indicator points one way.",
    recommendation: "Escalate to case",
    recTarget: "CS-118",
    steps: [
      { t: "+0.8s", k: "Scored and de-duplicated", d: "Matched no open suppression; severity kept at Critical" },
      { t: "+6s", k: "Pulled identity context", d: "a.voss — Finance, standard + local admin, sign-in baseline normal" },
      { t: "+11s", k: "Pulled asset context", d: "FIN-WS-2214 — Tier 1, production, patched 2 days ago" },
      { t: "+19s", k: "Queried threat intel", d: "185.42.11.7 and cdn-update-svc.net both flagged malicious" },
      { t: "+27s", k: "Correlated same-entity alerts", d: "Found AL-2288 on the same host inside the window" },
      { t: "+38s", k: "Reached verdict", d: "True positive, 94% confidence — recommending escalation" },
    ],
  },
  events: [
    { t: "12:38", k: "Macro executed", d: "Invoice_Q3.docm ran an AutoOpen macro on FIN-WS-2214." },
    { t: "12:40", k: "rundll32 spawned", d: "Unsigned rundll32.exe launched from the Office process tree." },
    { t: "12:41", k: "LSASS opened for read", d: "PROCESS_VM_READ handle acquired against lsass.exe." },
    { t: "12:42", k: "Outbound beacon", d: "TLS to cdn-update-svc.net, 185.42.11.7 — registered four days ago." },
  ],
  logic: [
    'process.name == "lsass.exe"',
    "and access.mask has PROCESS_VM_READ",
    'and caller.signed == false',
    "and caller.parent in (winword.exe, excel.exe, powerpnt.exe)",
    "and not caller.path in $lsass_read_allowlist",
  ],
  intel: [
    ["185.42.11.7", "malicious", "Registered 4 days ago · 3 vendors"],
    ["cdn-update-svc.net", "malicious", "Newly registered domain"],
    ["a41f…9c2e", "suspicious", "Macro document — 2 vendors"],
  ] as [string, string, string][],
  correlated: ["AL-2288"],
};

/* --- Case detail ------------------------------------------------------- */
export const CASE_DETAIL = {
  id: "CS-118",
  tenant: "Northwind Bank",
  severity: "Critical" as const,
  status: "Investigating",
  title: "Suspected credential theft — finance segment",
  owner: "You",
  openedBy: "assign" as const,
  at: "18 Aug 2026, 12:44",
  updated: "18 Aug 2026, 13:31",
  sla: 62,
  slaLabel: "2h 43m left",
  /* What the clock is actually counting down to. The reference hangs this off
     the bar as a tooltip, so "2h 43m left" has something to be left OF. */
  slaTarget: "Containment in 8h",
  needs: "Approve containment of FIN-WS-2214",
  mitre: [
    ["T1003.001", "LSASS Memory"],
    ["T1566.001", "Spearphishing Attachment"],
    ["T1071.001", "Web Protocols"],
  ] as [string, string][],
  exec: "A macro-borne loader on FIN-WS-2214 read LSASS memory and began beaconing to cdn-update-svc.net within two minutes. The account a.voss holds local admin on a Tier 1 finance asset, so credential theft here reaches the payment approval chain directly.",
  conclusion: "Confirmed credential access on FIN-WS-2214. Containment is drafted and waiting on approval; a.voss should be reset regardless of the containment decision.",
  verdict: { ai: "True positive", provisional: true },
  /* The nouns in the narrative above that carry an explanation. */
  entities: [
    { term: "FIN-WS-2214", kind: "Asset", tone: "med" as const, note: "Tier 1 finance workstation, production, patched 2 days ago.", intel: null },
    { term: "cdn-update-svc.net", kind: "Domain", tone: "crit" as const, note: "Registered four days ago; no legitimate ownership record.", intel: "malicious" },
    { term: "a.voss", kind: "Identity", tone: "high" as const, note: "Financial Controller — standard account plus local admin.", intel: null },
  ],
  findings: [
    { k: "Macro delivered the loader", d: "Invoice_Q3.docm arrived from a look-alike supplier domain and ran on open." },
    { k: "LSASS read succeeded", d: "An unsigned rundll32 took a PROCESS_VM_READ handle; no EDR block fired." },
    { k: "Beacon established", d: "TLS to 185.42.11.7 every 90s with jitter, consistent with a commodity loader." },
    { k: "No lateral movement yet", d: "No SMB or WinRM from the host in the window; the blast radius is still one asset." },
  ],
  actions: [
    { t: "12:44", k: "Case opened", d: "Dispatcher Agent escalated AL-2291 and linked AL-2288." },
    { t: "12:51", k: "Host isolated (pending)", d: "Containment drafted for FIN-WS-2214, waiting on approval." },
    { t: "13:02", k: "Credentials flagged", d: "a.voss queued for a forced reset once containment lands." },
    { t: "13:31", k: "Awaiting your approval", d: "No further automated action until containment is approved." },
  ],
  linked: ["AL-2291", "AL-2288"],
};
