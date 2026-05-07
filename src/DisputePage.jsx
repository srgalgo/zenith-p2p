import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { AlertTriangle, MessageSquare, Send, Clock, CheckCircle } from "lucide-react";

const STATUS_COLORS = {
  open: "bg-red-500/10 text-red-500",
  under_review: "bg-yellow-500/10 text-yellow-500",
  resolved_buyer: "bg-blue-500/10 text-blue-500",
  resolved_seller: "bg-blue-500/10 text-blue-500",
  closed: "bg-muted text-muted-foreground",
};

export default function DisputePage() {
  const [user, setUser] = useState(null);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const loadDisputes = async () => {
    const u = await base44.auth.me();
    setUser(u);
    const all = await base44.entities.Dispute.list("-created_date", 50);
    const mine = all.filter((d) => d.raised_by === u.email || d.against === u.email);
    setDisputes(mine);
    setLoading(false);
  };

  useEffect(() => { loadDisputes(); }, []);

  const sendMessage = async () => {
    if (!message.trim() || !selected) return;
    setSending(true);
    const msg = {
      sender: user.email,
      sender_name: user.display_name || user.full_name,
      message: message.trim(),
      timestamp: new Date().toISOString(),
      is_admin: false,
    };
    const updated = [...(selected.messages || []), msg];
    await base44.entities.Dispute.update(selected.id, { messages: updated });
    setSelected({ ...selected, messages: updated });
    setDisputes((prev) => prev.map((d) => d.id === selected.id ? { ...d, messages: updated } : d));
    setMessage("");
    setSending(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><AlertTriangle className="h-6 w-6 text-destructive" />My Disputes</h1>
        <p className="text-muted-foreground mt-1">View and respond to your active trade disputes</p>
      </div>

      {disputes.length === 0 ? (
        <div className="text-center py-20">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <h3 className="font-semibold text-foreground">No Disputes</h3>
          <p className="text-sm text-muted-foreground mt-1">You have no open or past disputes</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {/* List */}
          <div className="space-y-3">
            {disputes.map((d) => (
              <button key={d.id} onClick={() => setSelected(d)}
                className={`w-full text-left bg-card border rounded-2xl p-4 transition-all ${selected?.id === d.id ? "border-primary" : "border-border hover:border-primary/40"}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-foreground">Trade #{d.trade_id?.slice(-6)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-lg font-semibold ${STATUS_COLORS[d.status] || "bg-muted text-muted-foreground"}`}>{d.status?.replace("_"," ")}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{d.reason}</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <MessageSquare className="h-3 w-3" />{(d.messages || []).length} messages
                </div>
              </button>
            ))}
          </div>

          {/* Detail */}
          {selected ? (
            <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col" style={{ maxHeight: 520 }}>
              <div className="p-4 border-b border-border bg-muted/30">
                <div className="font-semibold text-foreground">Dispute — Trade #{selected.trade_id?.slice(-6)}</div>
                <p className="text-xs text-muted-foreground mt-1">{selected.reason}</p>
                <span className={`inline-flex mt-2 text-xs px-2 py-0.5 rounded-lg font-semibold ${STATUS_COLORS[selected.status] || ""}`}>{selected.status?.replace("_"," ")}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: 200 }}>
                {(selected.messages || []).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No messages yet. Explain your situation.</p>
                )}
                {(selected.messages || []).map((msg, i) => {
                  const isMe = msg.sender === user?.email;
                  return (
                    <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${isMe ? "bg-primary text-primary-foreground" : msg.is_admin ? "bg-accent/20 border border-accent/30 text-foreground" : "bg-muted text-foreground"}`}>
                        {!isMe && <div className="text-xs font-semibold mb-1 opacity-70">{msg.is_admin ? "🛡 Admin" : msg.sender_name}</div>}
                        {msg.message}
                        <div className="text-[10px] opacity-60 mt-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {["open","under_review"].includes(selected.status) && (
                <div className="p-3 border-t border-border flex gap-2">
                  <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe your issue with evidence..." className="rounded-xl text-sm min-h-[60px] resize-none" />
                  <Button onClick={sendMessage} disabled={sending || !message.trim()} size="icon" className="h-10 w-10 rounded-xl flex-shrink-0 self-end">
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
              {["resolved_buyer","resolved_seller","closed"].includes(selected.status) && (
                <div className="p-3 border-t border-border text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Clock className="h-3 w-3" />Dispute resolved by admin
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl flex items-center justify-center py-20 text-muted-foreground text-sm">
              Select a dispute to view
            </div>
          )}
        </div>
      )}
    </div>
  );
}