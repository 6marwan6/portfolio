import { useEffect, useRef, useState } from "react";
import { t } from "../content";
import type { Lang, SystemView } from "../content";
import { NODE_H, NODE_W } from "../content/layout-types";
import { ui } from "../i18n/ui";
import { useSite } from "../state/store";
import { edgePath, flowPath, placeNodes } from "./graphGeometry";
import { getLayout } from "./layout";

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => (typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false));
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

function useElementWidth(ref: React.RefObject<HTMLElement>): number {
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.clientWidth);
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

interface GraphProps {
  projectId: string;
  view: SystemView;
  lang: Lang;
  selected: string | null;
  onSelect: (id: string) => void;
  flowId: string | null;
  reduced: boolean;
}

/** The animated architecture graph: build-time layout, HTML nodes, SVG edges, and dots that travel along a chosen flow. */
export function SystemGraph({ projectId, view, lang, selected, onSelect, flowId, reduced }: GraphProps) {
  const layout = getLayout(projectId, view);
  const pos = placeNodes(layout, lang === "ar");
  const outer = useRef<HTMLDivElement>(null);
  const width = useElementWidth(outer);
  const scale = width > 0 ? Math.min(1, width / layout.width) : 1;
  const flow = view.flows?.find((f) => f.id === flowId);
  const inFlow = new Set(flow?.path ?? []);
  const flowEdge = (from: string, to: string) => {
    if (!flow) return false;
    for (let i = 0; i < flow.path.length - 1; i++) if (flow.path[i] === from && flow.path[i + 1] === to) return true;
    return false;
  };
  const dotPath = flow ? flowPath(flow.path, pos) : "";
  const dur = flow ? Math.max(3, flow.path.length * 0.9) : 0;

  return (
    <div className="graph-outer" ref={outer}>
      <div className="graph-box" style={{ width: layout.width * scale, height: layout.height * scale }}>
        <div className="graph" dir="ltr" style={{ width: layout.width, height: layout.height, transform: `scale(${scale})` }}>
          <svg className="graph-edges" width={layout.width} height={layout.height} viewBox={`0 0 ${layout.width} ${layout.height}`} aria-hidden="true">
            {view.edges.map((e, i) => {
              const a = pos[e.from];
              const b = pos[e.to];
              if (!a || !b) return null;
              return <path key={`${e.from}-${e.to}`} d={edgePath(a, b)} pathLength={1} className={flowEdge(e.from, e.to) ? "edge edge-on" : "edge"} style={{ ["--i" as string]: i }} />;
            })}
            {flow && !reduced && dotPath &&
              [0, 1, 2].map((k) => (
                <circle key={`${flow.id}-${k}`} r="5" className="flow-dot">
                  <animateMotion dur={`${dur}s`} begin={`${(k * dur) / 3}s`} repeatCount="indefinite" path={dotPath} />
                </circle>
              ))}
          </svg>
          {view.nodes.map((n, i) => {
            const p = pos[n.id];
            if (!p) return null;
            const credit = view.credit === "shared" ? n.credit : view.credit === "team" ? "team" : view.credit;
            return (
              <button
                key={n.id}
                type="button"
                className={`gnode${inFlow.has(n.id) ? " gnode-on" : ""}${selected === n.id ? " gnode-selected" : ""}`}
                data-credit={credit}
                aria-pressed={selected === n.id}
                dir={lang === "ar" ? "rtl" : "ltr"}
                style={{ left: p.x - NODE_W / 2, top: p.y - NODE_H / 2, width: NODE_W, height: NODE_H, ["--i" as string]: i }}
                title={t(n.label, lang)}
                onClick={() => onSelect(n.id)}
              >
                <span className="gnode-text">{t(n.label, lang)}</span>
                <span className="sr-only"> ({t(ui.builtBy[credit === "team" ? "team" : "me"], lang)})</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Graph plus its controls: credit and illustrative labels, flow player, legend and the selected-step card. */
export function ViewExplorer({ projectId, view, lang }: { projectId: string; view: SystemView; lang: Lang }) {
  const reduced = usePrefersReducedMotion();
  const [selected, setSelected] = useState<string | null>(null);
  const [flowId, setFlowId] = useState<string | null>(view.flows?.[0]?.id ?? null);
  const highlight = useSite((s) => s.highlight);
  useEffect(() => {
    if (highlight && highlight.projectId === projectId && highlight.viewId === view.id) setSelected(highlight.nodeId);
  }, [highlight, projectId, view.id]);
  const node = view.nodes.find((n) => n.id === selected);
  const callouts = view.callouts?.filter((c) => c.nodeId === selected) ?? [];
  const nodeCredit = node ? (view.credit === "shared" ? node.credit : view.credit === "team" ? "team" : "me") : undefined;

  return (
    <div className="explorer">
      <SystemGraph projectId={projectId} view={view} lang={lang} selected={selected} onSelect={setSelected} flowId={flowId} reduced={reduced} />

      <p className="tags">
        <span className="tag">{t(ui.builtBy[view.credit], lang)}</span>
        {view.illustrative && <span className="tag tag-warn">{t(ui.illustrative, lang)}</span>}
      </p>

      {view.flows && view.flows.length > 0 && (
        <div className="flows" role="group" aria-label={t(ui.flows, lang)}>
          {view.flows.map((f) => (
            <button key={f.id} type="button" className="btn btn-small" aria-pressed={flowId === f.id} onClick={() => setFlowId(flowId === f.id ? null : f.id)}>
              {flowId === f.id ? t(ui.stopFlow, lang) : t(ui.playFlow, lang)}: {t(f.label, lang)}
            </button>
          ))}
        </div>
      )}

      {view.credit === "shared" && (
        <p className="note legend">
          {t(ui.legendSolid, lang)}. {t(ui.legendDashed, lang)}.
        </p>
      )}

      <div className="detail" aria-live="polite">
        {node ? (
          <>
            <h4>{t(node.label, lang)}</h4>
            {nodeCredit && view.credit === "shared" && <p className="tags"><span className="tag">{t(ui.builtBy[nodeCredit === "team" ? "team" : "me"], lang)}</span></p>}
            {node.detail && <p>{t(node.detail, lang)}</p>}
            {callouts.map((c, i) => <p key={i} className="callout">{t(c.text, lang)}</p>)}
          </>
        ) : (
          <p className="note">{t(ui.pickStep, lang)}</p>
        )}
      </div>
    </div>
  );
}
