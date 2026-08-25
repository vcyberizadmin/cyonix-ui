import {
  AxisBars, Donut, FunnelFlow, Gauge, Heatmap, ProportionBar, RankedBars,
  Sparkline, StepArea,
} from "@vcyberizadmin/ui/charts";
import { Demo, Section, Spec } from "../chrome.js";

const VOLUME = [42, 48, 44, 58, 52, 66, 60, 74, 71, 88, 82, 95];

const SEVERITY = [
  { label: "Critical", value: 4 },
  { label: "High", value: 12 },
  { label: "Medium", value: 9 },
  { label: "Low", value: 6 },
];

const SOURCES = [
  { label: "WIN-PS-022", value: 91 },
  { label: "AWS CloudTrail", value: 64 },
  { label: "Okta", value: 38 },
  { label: "CrowdStrike", value: 22 },
  { label: "Zscaler", value: 11 },
];

const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);
const VOLUME_24 = [38,35,31,29,27,30,44,58,72,81,77,69,74,88,92,86,79,71,64,58,51,47,43,40];

const TACTICS = ["Initial access","Execution","Persistence","Priv-esc","Defence evasion","Credential access","Exfiltration"];
const WEEKS = ["W1","W2","W3","W4","W5"];
const COVERAGE: (number | null)[][] = [
  [2, 5, 1, 0, 7, 9, 1],
  [1, 4, 0, 2, 6, 11, 0],
  [3, 6, 2, 1, 8, 7, 2],
  [0, 3, 1, 0, 5, 6, null],
  [1, 2, 0, 1, 4, 8, 1],
];

const TRIAGE = [
  { label: "Ingested", value: 1284 },
  { label: "Auto-triaged", value: 1043 },
  { label: "To an analyst", value: 241 },
  { label: "Escalated", value: 141 },
];

export function Charts() {
  return (
    <Section
      id="charts"
      title="Charts"
      lede="Five primitives, no chart library. Each one answers a single question, and each states its numbers in words as well as in pixels — a width alone is not readable."
    >
      <div className="space-y-4">
        <Demo label="StepArea · a sampled metric over time">
          <StepArea
            series={VOLUME_24}
            labels={HOURS}
            label="Alert volume over 24 hours"
            format={(v) => String(v)}
          />
          <p className="mt-4 max-w-[70ch] text-[13px] text-fg-2">
            Hover it. A line between two samples asserts the value moved smoothly
            between them, which for a polled metric is a fiction — nothing was measured
            in the gap. The step holds each reading flat and joins them with a short
            S-curve, so the shape says <em>sampled</em>. This is the one chart in the
            set that is not server-safe; it lives in its own file so that fact does not
            leak into the others.
          </p>
        </Demo>

        <div className="grid gap-4 lg:grid-cols-2">
          <Demo label="AxisBars · a window worth looking at">
            <AxisBars
              points={HOURS.map((label, i) => ({ label, value: VOLUME_24[i]! }))}
              highlight={[12, 13, 14, 15]}
              unit="alerts"
            />
            <p className="mt-4"><Spec>only the focus window is full contrast</Spec></p>
          </Demo>

          <Demo label="Gauge · a level, not a split">
            <Gauge slices={SEVERITY} totalLabel="open" size={240} />
            <p className="mt-4"><Spec>an arch has a floor and a ceiling; a ring does not</Spec></p>
          </Demo>
        </div>

        <Demo label="Heatmap · a matrix of intensities">
          <Heatmap
            rows={WEEKS}
            columns={TACTICS}
            values={COVERAGE}
            caption="Confirmed MITRE tactic hits over five weeks"
            scale={{ low: "None", high: "Many" }}
          />
          <p className="mt-4 max-w-[70ch] text-[13px] text-fg-2">
            A real table, not a grid of divs — a matrix is tabular, and the row and
            column headers carry the meaning. The dashed cell is <code className="font-mono text-[12px]">null</code>:
            “we saw nothing” and “we did not look” are different findings, and a heatmap
            that renders both as the bottom of the ramp is worse than no heatmap.
          </p>
        </Demo>

        <div className="grid gap-4 lg:grid-cols-2">
          <Demo label="Sparkline · trend, no axis">
            <div className="space-y-4">
              <Sparkline series={VOLUME} label="Alert volume, last 12 hours" area />
              <Sparkline series={[...VOLUME].reverse()} label="False positives, last 12 hours" />
            </div>
            <p className="mt-4">
              <Spec>server-safe · no hover readout by contract</Spec>
            </p>
          </Demo>

          <Demo label="Donut · parts of a known total">
            <Donut slices={SEVERITY} totalLabel="open" />
            <p className="mt-4">
              <Spec>the centre carries the total, so nobody adds up the legend</Spec>
            </p>
          </Demo>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Demo label="RankedBars · where the effort goes">
            <RankedBars items={SOURCES} />
            <p className="mt-4">
              <Spec>sorted by value · the question is “which is worst”</Spec>
            </p>
          </Demo>

          <Demo label="ProportionBar · one stacked bar">
            <div className="space-y-5">
              <ProportionBar slices={SEVERITY} />
              <ProportionBar slices={SEVERITY} size="sm" legend={false} />
            </div>
            <p className="mt-4">
              <Spec>the cheapest chart in the set — needs no chart library at all</Spec>
            </p>
          </Demo>
        </div>

        <Demo label="FunnelFlow · a pipeline, with the drop-off named">
          <FunnelFlow stages={TRIAGE} />
          <p className="mt-4 max-w-[70ch] text-[13px] text-fg-2">
            Descending bars rather than a Sankey, deliberately. A Sankey’s ribbons encode
            the same single number as a bar’s width while being far harder to read
            precisely, and the question here — <em>where are we losing them</em> — is
            answered by the drop-off figure between stages, which this states in words.
          </p>
        </Demo>

        <Demo label="Not in the set yet">
          <p className="max-w-[70ch] text-[13px] text-fg-2">
            Still to come: a dual-series comparison, a radar, a squircle ring, a liquid
            fill, and a Sankey. The Sankey is the interesting one — <code className="font-mono text-[12px]">FunnelFlow</code>{" "}
            exists precisely because a Sankey’s ribbons encode the same single number as a
            bar’s width while being far harder to read. Building one is a deliberate
            reversal of that call, not a gap being filled.
          </p>
        </Demo>
      </div>
    </Section>
  );
}
