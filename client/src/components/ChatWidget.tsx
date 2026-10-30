import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bot, MessageCircle, Send, X, MapPin, RotateCcw } from "lucide-react";
import { api, type Job } from "../lib/api";

interface Msg { role: "user" | "assistant"; content: string; jobs?: Job[]; suggestions?: string[] }
const welcome: Msg = { role: "assistant", content: "Hi! 👋 I'm the **MBONO Assistant**. Ask me about vacancies, applying, uploading your CV or contacting us.", suggestions: ["Show me IT jobs", "Jobs in Gqeberha", "How do I apply?", "Contact details"] };

/** Renders **bold** and line breaks safely (no HTML injection). */
function Rich({ text }: { text: string }) {
  return <>{text.split("\n").map((line, i) => (
    <p key={i} className={i ? "mt-1" : ""}>{line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => part.startsWith("**") && part.endsWith("**") ? <strong key={j}>{part.slice(2, -2)}</strong> : <span key={j}>{part}</span>)}</p>
  ))}</>;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([welcome]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  const send = async (text: string) => {
    const t = text.trim(); if (!t || busy) return;
    const history = msgs.map(m => ({ role: m.role, content: m.content }));
    setMsgs(m => [...m, { role: "user", content: t }]); setInput(""); setBusy(true);
    try {
      const r = await api<{ reply: string; jobs: Job[]; suggestions: string[] }>("/chat", { method: "POST", json: { message: t, history } });
      setMsgs(m => [...m, { role: "assistant", content: r.reply, jobs: r.jobs, suggestions: r.suggestions }]);
    } catch (e) {
      setMsgs(m => [...m, { role: "assistant", content: `Sorry, I couldn't respond: ${(e as Error).message}` }]);
    } finally { setBusy(false); }
  };
  const last = msgs[msgs.length - 1];

  return (
    <>
      <button onClick={() => setOpen(!open)} aria-label={open ? "Close chat" : "Chat with MBONO Assistant"}
        className="fixed bottom-5 right-5 z-[55] grid h-14 w-14 place-items-center rounded-full bg-brand-700 text-white shadow-xl shadow-brand-900/30 transition hover:scale-105 hover:bg-brand-800">
        {open ? <X /> : <MessageCircle />}
        {!open && <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-brand-400 dark:border-ink-950" />}
      </button>
      {open && (
        <section aria-label="MBONO Assistant chat" className="fixed bottom-24 right-4 z-[55] flex h-[min(600px,calc(100vh-8rem))] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-2xl animate-fade-up dark:border-ink-700 dark:bg-ink-900">
          <header className="flex items-center gap-3 bg-gradient-to-r from-brand-800 to-brand-600 px-4 py-3 text-white">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white/15"><Bot size={20} /></span>
            <div className="flex-1"><p className="font-semibold leading-tight">MBONO Assistant</p><p className="flex items-center gap-1.5 text-xs text-brand-100"><span className="h-2 w-2 rounded-full bg-brand-300" />Online · replies instantly</p></div>
            <button onClick={() => setMsgs([welcome])} aria-label="Restart conversation" title="Restart" className="rounded-md p-1.5 hover:bg-white/15"><RotateCcw size={16} /></button>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto bg-ink-50 p-4 dark:bg-ink-950" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
                <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "rounded-br-sm bg-brand-700 text-white" : "rounded-bl-sm border border-ink-200 bg-white text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100"}`}>
                  <Rich text={m.content} />
                  {!!m.jobs?.length && (
                    <ul className="mt-2.5 space-y-2">
                      {m.jobs.map(j => (
                        <li key={j.id}>
                          <Link to={`/vacancies/${j.id}`} onClick={() => setOpen(false)} className="block rounded-lg border border-ink-200 bg-ink-50 p-2.5 transition hover:border-brand-500 dark:border-ink-600 dark:bg-ink-900">
                            <p className="font-semibold text-brand-800 dark:text-brand-300">{j.title}</p>
                            <p className="flex items-center gap-1 text-xs muted"><MapPin size={11} />{j.company} · {j.location}</p>
                          </Link>
                        </li>
                      ))}
                      <li><Link to="/vacancies" onClick={() => setOpen(false)} className="text-xs font-semibold text-brand-700 hover:underline dark:text-brand-400">See all vacancies →</Link></li>
                    </ul>
                  )}
                </div>
              </div>
            ))}
            {busy && <div className="flex gap-1 px-2 py-1" aria-label="Assistant is typing">{[0, 1, 2].map(i => <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-brand-600" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>}
            <div ref={end} />
          </div>
          {last.role === "assistant" && !!last.suggestions?.length && !busy && (
            <div className="flex gap-2 overflow-x-auto border-t border-ink-100 bg-white px-3 py-2 dark:border-ink-800 dark:bg-ink-900">
              {last.suggestions.map(s => <button key={s} onClick={() => send(s)} className="shrink-0 rounded-full border border-brand-200 px-3 py-1 text-xs font-medium text-brand-800 transition hover:bg-brand-50 dark:border-brand-800 dark:text-brand-300 dark:hover:bg-brand-900/40">{s}</button>)}
            </div>
          )}
          <form onSubmit={e => { e.preventDefault(); send(input); }} className="flex gap-2 border-t border-ink-200 bg-white p-3 dark:border-ink-800 dark:bg-ink-900">
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} maxLength={1000} placeholder="Ask about jobs, CVs, applying…" className="input py-2" aria-label="Message" />
            <button className="btn-primary px-3" disabled={!input.trim() || busy} aria-label="Send"><Send size={17} /></button>
          </form>
        </section>
      )}
    </>
  );
}
