import { useEffect, useRef, useState } from "react";
import { t } from "../content";
import { streamAgent } from "../agent/client";
import { runTool } from "../agent/tools";
import type { ChatMessage } from "../agent/types";
import { ui } from "../i18n/ui";
import { chapters } from "../scene/chapters";
import { useSite } from "../state/store";
import { useDialog } from "./useDialog";

interface Line {
  role: "user" | "assistant";
  text: string;
  note?: string;
}

function Chat() {
  const { lang, active, mode } = useSite();
  const close = () => useSite.getState().setAgentOpen(false);
  const { container, firstFocus } = useDialog(close);
  const [lines, setLines] = useState<Line[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const log = useRef<HTMLDivElement>(null);

  useEffect(() => () => abort.current?.abort(), []);
  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [lines]);

  const send = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    setError(null);
    setDraft("");
    const history: ChatMessage[] = [...lines.map((l) => ({ role: l.role, content: l.text })).filter((m) => m.content), { role: "user", content: q }];
    setLines((ls) => [...ls, { role: "user", text: q }, { role: "assistant", text: "" }]);
    setBusy(true);
    abort.current = new AbortController();
    const station = mode === "journey" ? chapters[active]?.id : undefined;
    await streamAgent(
      history.slice(-12),
      lang,
      station,
      {
        onText: (delta) => setLines((ls) => ls.map((l, i) => (i === ls.length - 1 ? { ...l, text: l.text + delta } : l))),
        onTool: (call) => {
          const note = runTool(call);
          if (note) setLines((ls) => ls.map((l, i) => (i === ls.length - 1 ? { ...l, note } : l)));
        },
        onError: (message) => setError(message),
      },
      abort.current.signal,
    );
    setLines((ls) => ls.filter((l, i) => !(i === ls.length - 1 && l.role === "assistant" && !l.text && !l.note)));
    setBusy(false);
  };

  return (
    <div className="chat" role="dialog" aria-modal="true" aria-label={t(ui.askMarwan, lang)} ref={container}>
      <header className="chat-head">
        <div>
          <h2>{t(ui.aiLabel, lang)}</h2>
          <p className="note">{t(ui.aiNote, lang)}</p>
        </div>
        <button type="button" className="btn btn-small" ref={firstFocus} onClick={close}>{t(ui.close, lang)}</button>
      </header>

      <div className="chat-log" ref={log} role="log" aria-live="polite">
        {lines.length === 0 && (
          <div>
            <p className="note">{t(ui.chatSuggestions, lang)}:</p>
            <div className="flows">
              {[ui.chatSuggest1, ui.chatSuggest2, ui.chatSuggest3].map((s, i) => (
                <button key={i} type="button" className="btn btn-small" onClick={() => send(t(s, lang))}>{t(s, lang)}</button>
              ))}
            </div>
          </div>
        )}
        {lines.map((l, i) => (
          <div key={i} className={`line line-${l.role}`}>
            <span className="sr-only">{l.role === "user" ? "You: " : `${t(ui.aiLabel, lang)}: `}</span>
            {l.text || (busy && i === lines.length - 1 ? <span className="note">{t(ui.chatWorking, lang)}…</span> : null)}
            {l.note && <p className="note">{l.note}</p>}
          </div>
        ))}
        {error && <p className="chat-error" role="alert">{error}</p>}
      </div>

      <form className="chat-form" onSubmit={(e) => { e.preventDefault(); void send(draft); }}>
        <label htmlFor="chat-input" className="sr-only">{t(ui.chatLabel, lang)}</label>
        <input id="chat-input" value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={2000} autoComplete="off" placeholder={t(ui.chatLabel, lang)} disabled={busy} />
        <button type="submit" className="btn btn-solid" disabled={busy || !draft.trim()}>{t(ui.chatSend, lang)}</button>
      </form>
    </div>
  );
}

export function AgentPanel() {
  const open = useSite((s) => s.agentOpen);
  return open ? <Chat /> : null;
}
