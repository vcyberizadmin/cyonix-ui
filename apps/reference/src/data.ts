/**
 * The reference console's own fixture data, transcribed so the two screens can
 * be diffed on layout rather than on content. Numbers match the reference's
 * `METRICS.all` and `AUTONOMY.all`.
 */
export const KPIS = [
  { label: "Open alerts", value: "128", unit: "", sub: "9 critical unassigned", good: false, delta: "+14", tone: "warning" as const },
  { label: "MTTD", value: "7.4", unit: "min", sub: "detect", good: true, delta: "−1.2 min", tone: "info" as const },
  { label: "MTTR", value: "38", unit: "min", sub: "contain", good: true, delta: "−6 min", tone: "ai" as const },
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
  { id: "CS-118", tenant: "Northwind Bank", title: "Suspected credential theft — finance segment", severity: "Critical" as const, status: "Investigating", owner: "You", alerts: 2, at: "18 Aug 2026, 12:44", sla: 62, slaLabel: "2h 43m left", needs: "Approve containment of FIN-WS-2214" },
  { id: "CS-117", tenant: "Meridian Health", title: "Ransomware staging on HR file share", severity: "High" as const, status: "Contained", owner: "A. Voss", alerts: 1, at: "18 Aug 2026, 10:33", sla: 48, slaLabel: "3h 17m left", needs: "Confirm restore from 03:00 snapshot" },
];
