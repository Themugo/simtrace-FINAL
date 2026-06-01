"use client";
import { useState, useRef, useEffect } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import SimTraceLogo from "../../components/SimTraceLogo";

const STARTERS = [
  "What does a risk score of 80 mean?",
  "My phone was stolen — what should I do right now?",
  "What is a SIM swap attack and how can I protect myself?",
  "How does SimTrace detect impossible location jumps?",
  "How do I register my device on SimTrace?",
  "Explain the difference between IMEI blacklisting and graylisting.",
];

interface Message {
  role: string;
  content: string;
  loading?: boolean;
  streaming?: boolean;
}

interface MessageProps {
  msg: Message;
}

function MessageBubble({ msg }: MessageProps) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display:"flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom:"0.85rem" }}>
      {!isUser && (
        <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,var(--sky),var(--indigo))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.75rem", fontWeight:800, color:"#fff", flexShrink:0, marginRight:"0.6rem", marginTop:2 }}>
          AI
        </div>
      )}
      <div style={{
        maxWidth:"76%",
        background: isUser ? "var(--surface)" : "var(--bg2)",
        border:`1px solid ${isUser ? "var(--indigo)" : "var(--border)"}`,
        borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        padding:"0.7rem 1rem", fontSize:"0.92rem", lineHeight:1.65,
        color:"var(--text)", whiteSpace:"pre-wrap",
      }}>
        {msg.content}
        {msg.streaming && (
          <span style={{ display:"inline-block", width:8, height:14, background:"var(--sky)", borderRadius:2, marginLeft:3, animation:"blink 0.9s infinite", verticalAlign:"middle" }} />
        )}
        {msg.loading && !msg.streaming && (
          <span style={{ display:"inline-flex", gap:3, marginLeft:4, verticalAlign:"middle" }}>
            {[0,1,2].map(i => (
              <span key={i} style={{ width:5, height:5, borderRadius:"50%", background:"var(--muted)", animation:`pulse 1.2s ${i*0.2}s infinite`, display:"inline-block" }} />
            ))}
          </span>
        )}
      </div>
    </div>
  );
}

export default function AIAssistantPage() {
  const { user } = useAuth();
  const [messages,  setMessages]  = useState<Message[]>([]);
  const [input,     setInput]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [streaming, setStreaming]  = useState(false);
  const [charCount, setCharCount]  = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef  = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages]);

  async function send(text?: string) {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput(""); setCharCount(0);

    const history     = [...messages, { role:"user", content:userMsg }];
    const apiMessages = history.map(m => ({ role:m.role, content:m.content }));
    setMessages(history);
    setLoading(true);

    // Optimistic streaming placeholder
    setMessages(m => [...m, { role:"assistant", content:"", loading:true }]);

    try {
      const BASE  = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const token = localStorage.getItem("simtrace_token");

      const controller = new AbortController();
      abortRef.current = controller;

      // SSE streaming endpoint — response is text/event-stream
      const res = await fetch(`${BASE}/api/ai/chat/stream`, {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body:   JSON.stringify({ messages: apiMessages }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const reader  = res.body?.getReader();
      if (!reader) throw new Error("No response body");
      const decoder = new TextDecoder();
      let accumulated = "";
      setStreaming(true);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream:true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.delta) {
              accumulated += evt.delta;
              setMessages(m => [
                ...m.slice(0,-1),
                { role:"assistant", content:accumulated, streaming:true },
              ]);
            }
            if (evt.done) {
              setMessages(m => [
                ...m.slice(0,-1),
                { role:"assistant", content:accumulated },
              ]);
            }
            if (evt.error) throw new Error(evt.error);
          } catch { /* skip malformed chunk */ }
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        setMessages(m => [...m.slice(0,-1), { role:"assistant", content:"[Response cancelled]" }]);
      } else {
        // Fallback to non-streaming
        try {
          const { reply } = await api.aiChat(messages.concat({ role:"user", content:userMsg }).map(m => ({ role:m.role, content:m.content })));
          setMessages(m => [...m.slice(0,-1), { role:"assistant", content:reply }]);
        } catch (e2: any) {
          setMessages(m => [...m.slice(0,-1), { role:"assistant", content:`Sorry, I couldn't connect. ${e2.message}` }]);
        }
      }
    } finally {
      setLoading(false);
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  function clearChat() {
    setMessages([]);
  }

  return (
    <div style={{ maxWidth:720, margin:"0 auto", display:"flex", flexDirection:"column", height:"calc(100vh - 100px)" }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:.3} 50%{opacity:1} }
        @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"0.85rem", flexWrap:"wrap", gap:"0.5rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
          <div style={{ width:38, height:38, borderRadius:"50%", background:"linear-gradient(135deg,var(--sky),var(--indigo))", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:"#fff", fontSize:"0.85rem" }}>AI</div>
          <div>
            <h1 style={{ fontSize:"1.2rem", marginBottom:0 }}>SimTrace AI Assistant</h1>
            <p style={{ color:"var(--muted)", fontSize:"0.78rem", margin:0 }}>
              Powered by Claude · {streaming ? <span style={{ color:"var(--sky)" }}>● Streaming…</span> : "Security & device intelligence"}
            </p>
          </div>
        </div>
        <div style={{ display:"flex", gap:"0.5rem" }}>
          {messages.length > 0 && (
            <button onClick={clearChat} className="btn-ghost" style={{ fontSize:"0.8rem", padding:"4px 12px" }}>
              Clear chat
            </button>
          )}
          {streaming && (
            <button onClick={stop} style={{ background:"var(--rose)", color:"#fff", border:"none", borderRadius:8, padding:"4px 14px", fontSize:"0.8rem", fontWeight:600, cursor:"pointer" }}>
              ■ Stop
            </button>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div style={{ flex:1, overflowY:"auto", padding:"1rem", background:"var(--bg2)", borderRadius:12, border:"1px solid var(--border)", marginBottom:"0.75rem" }}>
        {messages.length === 0 ? (
          <div style={{ height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"1.5rem" }}>
            <div style={{ textAlign:"center" }}>
              <SimTraceLogo size={52} showText={false} />
              <h2 style={{ fontSize:"1.15rem", margin:"1rem 0 0.4rem" }}>How can I help you today?</h2>
              <p style={{ color:"var(--muted)", fontSize:"0.88rem" }}>
                {user ? `Hi ${user.name?.split(" ")[0]} — ` : ""}Ask me anything about device security.
              </p>
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"0.5rem", justifyContent:"center", maxWidth:580 }}>
              {STARTERS.map(s => (
                <button key={s} onClick={() => send(s)}
                  style={{ background:"var(--bg)", border:"1px solid var(--border)", color:"var(--text2)", borderRadius:20, padding:"0.4rem 0.9rem", fontSize:"0.82rem", cursor:"pointer", transition:"all 0.15s", textAlign:"left" }}
                  onMouseOver={e => { e.currentTarget.style.borderColor="var(--sky)"; e.currentTarget.style.color="var(--text)"; }}
                  onMouseOut={e  => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.color="var(--text2)"; }}
                >{s}</button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((m,i) => <MessageBubble key={i} msg={m} />)}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input bar */}
      <div style={{ display:"flex", gap:"0.6rem", alignItems:"flex-end" }}>
        <div style={{ flex:1, position:"relative" }}>
          <textarea
            value={input}
            onChange={e => { setInput(e.target.value); setCharCount(e.target.value.length); }}
            onKeyDown={handleKey}
            placeholder="Ask about device security, IMEI checks, SIM swap attacks… (Enter to send)"
            disabled={loading}
            rows={2}
            maxLength={4000}
            style={{ width:"100%", resize:"none", fontSize:"0.92rem", padding:"0.7rem 1rem", borderRadius:10, lineHeight:1.5, paddingRight:"3rem" }}
          />
          {charCount > 100 && (
            <span style={{ position:"absolute", bottom:8, right:10, fontSize:"0.65rem", color: charCount > 3500 ? "var(--rose)" : "var(--dim)" }}>
              {charCount}/4000
            </span>
          )}
        </div>
        <button
          onClick={streaming ? stop : () => send()}
          disabled={!streaming && (loading || !input.trim())}
          style={{
            alignSelf:"flex-end", padding:"0.7rem 1.1rem", borderRadius:10, fontSize:"1.1rem", fontWeight:700,
            background: streaming ? "var(--rose)" : "linear-gradient(135deg,var(--sky),var(--indigo))",
            color:"#fff", border:"none", cursor:"pointer", minWidth:44, height:44,
          }}>
          {streaming ? "■" : "↑"}
        </button>
      </div>
      <p style={{ fontSize:"0.7rem", color:"var(--muted)", textAlign:"center", marginTop:"0.4rem" }}>
        AI responses are informational only — contact law enforcement for emergencies.
      </p>
    </div>
  );
}
