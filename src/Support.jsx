import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Headphones, Globe, Clock, CheckCircle, AlertCircle, MessageSquare, Send, Zap } from "lucide-react";

const REGIONS = [
  {
    name: "Asia-Pacific",
    timezone: "IST / SGT / JST",
    utc: "UTC+5:30 to UTC+9",
    hours: "06:00 – 22:00 IST",
    online: () => { const h = new Date().getUTCHours(); return h >= 0 && h < 17; },
    flag: "🌏",
    countries: "India, Singapore, Japan, Philippines, Indonesia, Thailand, Malaysia",
    team: "support-apac",
  },
  {
    name: "Europe / Middle East / Africa",
    timezone: "GMT / CET / GST",
    utc: "UTC+0 to UTC+4",
    hours: "08:00 – 00:00 GMT",
    online: () => { const h = new Date().getUTCHours(); return h >= 8 && h < 24; },
    flag: "🌍",
    countries: "UK, Germany, France, UAE, Saudi Arabia, South Africa, Turkey, Nigeria, Kenya",
    team: "support-emea",
  },
  {
    name: "Americas",
    timezone: "EST / CST / PST",
    utc: "UTC-5 to UTC-8",
    hours: "09:00 – 23:00 EST",
    online: () => { const h = new Date().getUTCHours(); return h >= 14 || h < 4; },
    flag: "🌎",
    countries: "USA, Canada, Brazil, Mexico, Colombia, Argentina",
    team: "support-americas",
  },
];

const CATEGORIES = [
  { value: "dispute", label: "Trade Dispute", icon: "⚔️" },
  { value: "appeal", label: "Trade Appeal", icon: "📋" },
  { value: "kyc", label: "KYC Verification", icon: "🪪" },
  { value: "payment", label: "Payment Issue", icon: "💳" },
  { value: "withdrawal", label: "Withdrawal Issue", icon: "💸" },
  { value: "account", label: "Account Issue", icon: "👤" },
  { value: "other", label: "Other", icon: "❓" },
];

const PRIORITY_COLORS = { low: "bg-muted text-muted-foreground", medium: "bg-blue-500/10 text-blue-500", high: "bg-orange-500/10 text-orange-500", urgent: "bg-red-500/10 text-red-500" };
const STATUS_COLORS = { open: "bg-yellow-500/10 text-yellow-500", in_progress: "bg-blue-500/10 text-blue-500", resolved: "bg-green-500/10 text-green-500", closed: "bg-muted text-muted-foreground" };

export default function Support() {
  const [user, setUser] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("new");
  const [form, setForm] = useState({ subject: "", category: "", description: "", trade_id: "", priority: "medium" });
  const [replyTicket, setReplyTicket] = useState(null);
  const [replyMsg, setReplyMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      const u = await base44.auth.me();
      setUser(u);
      const t = await base44.entities.SupportTicket.filter({ user_email: u.email }, "-created_date", 50);
      setTickets(t);
      setLoading(false);
    };
    load();
  }, []);

  // Detect user region from timezone
  const detectRegion = () => {
    const offset = -new Date().getTimezoneOffset() / 60;
    if (offset >= 5 && offset <= 12) return "Asia-Pacific";
    if (offset >= 0 && offset <= 4) return "Europe / Middle East / Africa";
    return "Americas";
  };

  const handleSubmit = async () => {
    if (!form.subject || !form.category || !form.description) { toast.error("Fill all required fields"); return; }
    setSubmitting(true);
    const region = detectRegion();
    const regionInfo = REGIONS.find((r) => r.name === region);
    const ticket = await base44.entities.SupportTicket.create({
      ...form,
      user_email: user.email,
      user_name: user.display_name || user.full_name,
      status: "open",
      region,
      assigned_team: regionInfo?.team || "support-global",
    });
    // Email confirmation
    base44.integrations.Core.SendEmail({
      to: user.email,
      subject: `Support Ticket #${ticket.id?.slice(-6)} Received — CryptoP2P`,
      body: `Hi ${user.display_name || user.full_name},\n\nYour support ticket has been received.\n\nTicket ID: #${ticket.id?.slice(-6)}\nCategory: ${form.category}\nSubject: ${form.subject}\nAssigned Team: ${region}\n\nExpected response time:\n• Urgent: < 1 hour\n• High: < 4 hours\n• Medium: < 12 hours\n• Low: < 24 hours\n\nWe'll get back to you shortly.\n\n— CryptoP2P Support`,
    }).catch(() => {});
    toast.success("Ticket submitted! Check your email for confirmation.");
    setForm({ subject: "", category: "", description: "", trade_id: "", priority: "medium" });
    setSubmitting(false);
    const t = await base44.entities.SupportTicket.filter({ user_email: user.email }, "-created_date", 50);
    setTickets(t);
    setActiveTab("my-tickets");
  };

  const sendReply = async (ticket) => {
    if (!replyMsg.trim()) return;
    const msg = { sender: user.email, sender_name: user.display_name || user.full_name, message: replyMsg.trim(), timestamp: new Date().toISOString(), is_admin: false };
    const updated = [...(ticket.messages || []), msg];
    await base44.entities.SupportTicket.update(ticket.id, { messages: updated });
    toast.success("Message sent");
    setReplyMsg(""); setReplyTicket(null);
    const t = await base44.entities.SupportTicket.filter({ user_email: user.email }, "-created_date", 50);
    setTickets(t);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
          <Headphones className="h-3.5 w-3.5" />24/7 Customer Support
        </div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Support Center</h1>
        <p className="text-muted-foreground mt-2">Regional teams available around the clock for disputes, appeals &amp; account issues</p>
      </div>

      {/* Regional Teams Status */}
      <div className="grid gap-3 mb-8">
        {REGIONS.map((r) => {
          const online = r.online();
          return (
            <div key={r.name} className={`border rounded-2xl p-4 ${online ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{r.flag}</span>
                  <div>
                    <div className="font-semibold text-foreground text-sm">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.timezone} · {r.hours}</div>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${online ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"}`}>
                  <div className={`h-1.5 w-1.5 rounded-full ${online ? "bg-green-500 animate-pulse" : "bg-muted-foreground"}`} />
                  {online ? "Online Now" : "Offline"}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">{r.countries}</div>
            </div>
          );
        })}
      </div>

      {/* SLA Info */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-8">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Zap className="h-4 w-4 text-accent" />Response Time SLA</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {[["🔴 Urgent (Disputes)", "< 1 hour"], ["🟠 High Priority", "< 4 hours"], ["🟡 Medium", "< 12 hours"], ["⚪ Low", "< 24 hours"]].map(([k, v]) => (
            <div key={k} className="flex justify-between bg-muted/50 rounded-xl px-3 py-2">
              <span className="text-foreground text-xs">{k}</span>
              <span className="font-semibold text-primary text-xs">{v}</span>
            </div>
          ))}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 rounded-xl h-11 mb-6">
          <TabsTrigger value="new" className="rounded-lg font-semibold">New Ticket</TabsTrigger>
          <TabsTrigger value="my-tickets" className="rounded-lg font-semibold">My Tickets ({tickets.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="new">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="space-y-2">
              <Label>Category *</Label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((c) => (
                  <button key={c.value} onClick={() => setForm({ ...form, category: c.value })}
                    className={`h-10 px-3 rounded-xl text-sm font-medium border-2 text-left flex items-center gap-2 transition-all ${form.category === c.value ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground"}`}>
                    <span>{c.icon}</span>{c.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Priority *</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Trade ID (optional)</Label>
                <Input value={form.trade_id} onChange={(e) => setForm({ ...form, trade_id: e.target.value })} placeholder="Last 6 chars" className="h-10 rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Brief summary of your issue" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe your issue in detail. Include any relevant information..." className="rounded-xl min-h-[120px]" />
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-xs text-muted-foreground">
              <Globe className="h-3.5 w-3.5 inline mr-1" />Your ticket will be auto-routed to the <strong className="text-foreground">{detectRegion()}</strong> team based on your timezone.
            </div>
            <Button onClick={handleSubmit} disabled={submitting} className="w-full h-11 rounded-xl font-semibold">
              <Send className="h-4 w-4 mr-2" />{submitting ? "Submitting..." : "Submit Ticket"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="my-tickets">
          <div className="space-y-3">
            {tickets.length === 0 ? (
              <div className="text-center py-16"><MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No support tickets yet</p></div>
            ) : tickets.map((t) => (
              <div key={t.id} className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="font-semibold text-foreground text-sm">{t.subject}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">#{t.id?.slice(-6)} · {t.category} · {t.region}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-lg font-semibold ${STATUS_COLORS[t.status]}`}>{t.status?.replace("_", " ")}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-lg ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</span>
                  </div>
                </div>
                {t.admin_response && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-3">
                    <div className="text-xs font-semibold text-primary mb-1">🛡 Admin Response</div>
                    <div className="text-sm text-foreground">{t.admin_response}</div>
                  </div>
                )}
                {(t.messages || []).length > 0 && (
                  <div className="space-y-2 mb-3 max-h-36 overflow-y-auto">
                    {t.messages.map((m, i) => (
                      <div key={i} className={`text-xs rounded-xl px-3 py-2 ${m.is_admin ? "bg-accent/10 border border-accent/20" : "bg-muted"}`}>
                        <span className="font-semibold">{m.is_admin ? "🛡 Admin" : m.sender_name}: </span>{m.message}
                      </div>
                    ))}
                  </div>
                )}
                {t.status !== "closed" && (
                  replyTicket === t.id ? (
                    <div className="flex gap-2">
                      <Input value={replyMsg} onChange={(e) => setReplyMsg(e.target.value)} placeholder="Type reply..." className="h-9 rounded-xl text-sm flex-1" onKeyDown={(e) => e.key === "Enter" && sendReply(t)} />
                      <Button size="sm" onClick={() => sendReply(t)} className="rounded-xl h-9 px-3"><Send className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => setReplyTicket(null)} className="rounded-xl h-9 px-3">Cancel</Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setReplyTicket(t.id)} className="rounded-xl h-8 text-xs">Reply to ticket</Button>
                  )
                )}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}