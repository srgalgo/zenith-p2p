import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Shield, Users, TrendingUp, AlertTriangle, CheckCircle, Clock, DollarSign, Check, Send, Settings, Lock, Unlock, Eye } from "lucide-react";

const TABS = [
  ["overview","Overview"],["active","Active Trades"],["disputes","Disputes"],
  ["escrow","Escrow Monitor"],["kyc","KYC"],["wallets","Wallet Addresses"],["users","Users"]
];

const STATUS_COLORS = {
  pending:"bg-yellow-500/10 text-yellow-500", escrow_held:"bg-blue-500/10 text-blue-500",
  payment_sent:"bg-orange-500/10 text-orange-500", completed:"bg-green-500/10 text-green-500",
  disputed:"bg-red-500/10 text-red-500", cancelled:"bg-muted text-muted-foreground",
};

export default function AdminPanel() {
  const [user, setUser] = useState(null);
  const [trades, setTrades] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [users, setUsers] = useState([]);
  const [walletSettings, setWalletSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [disputeMessages, setDisputeMessages] = useState({});
  const [expandedDispute, setExpandedDispute] = useState(null);
  const [walletEdit, setWalletEdit] = useState({});

  const WALLET_KEYS = [
    { key: "deposit_USDT_TRC20", label: "USDT — TRC20 (Tron)" },
    { key: "deposit_USDT_ERC20", label: "USDT — ERC20 (Ethereum)" },
    { key: "deposit_USDT_BEP20", label: "USDT — BEP20 (BSC)" },
    { key: "deposit_USDC_ERC20", label: "USDC — ERC20 (Ethereum)" },
    { key: "deposit_USDC_BEP20", label: "USDC — BEP20 (BSC)" },
  ];

  const loadAll = async () => {
    const u = await base44.auth.me();
    if (u.role !== "admin") { window.location.href = "/"; return; }
    setUser(u);
    const [t, d, us, ws] = await Promise.all([
      base44.entities.Trade.list("-created_date", 200),
      base44.entities.Dispute.list("-created_date", 100),
      base44.entities.User.list(),
      base44.entities.PlatformSettings.list(),
    ]);
    setTrades(t); setDisputes(d); setUsers(us); setWalletSettings(ws);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const getWalletValue = (key) => walletSettings.find((s) => s.key === key)?.value || "";

  const saveWalletAddress = async (key, label) => {
    const val = walletEdit[key];
    if (!val?.trim()) { toast.error("Enter a wallet address"); return; }
    const existing = walletSettings.find((s) => s.key === key);
    if (existing) {
      await base44.entities.PlatformSettings.update(existing.id, { value: val.trim() });
    } else {
      await base44.entities.PlatformSettings.create({ key, value: val.trim(), label });
    }
    toast.success("Address saved!");
    const ws = await base44.entities.PlatformSettings.list();
    setWalletSettings(ws);
    setWalletEdit((p) => ({ ...p, [key]: undefined }));
  };

  const updateTrade = async (id, data) => {
    await base44.entities.Trade.update(id, data);
    const t = await base44.entities.Trade.list("-created_date", 200);
    setTrades(t);
    toast.success("Trade updated");
  };

  const resolveDispute = async (disputeId, status, tradeId, releaseToRole) => {
    await base44.entities.Dispute.update(disputeId, { status, admin_assigned: user.email });
    if (releaseToRole && tradeId) {
      const escrow = releaseToRole === "buyer" ? "released" : "refunded";
      await base44.entities.Trade.update(tradeId, { status: "completed", escrow_status: escrow });
    }
    const [d, t] = await Promise.all([base44.entities.Dispute.list("-created_date", 100), base44.entities.Trade.list("-created_date", 200)]);
    setDisputes(d); setTrades(t);
    toast.success(`Dispute resolved → ${releaseToRole || "closed"}`);
  };

  const sendDisputeMessage = async (dispute) => {
    const msg = disputeMessages[dispute.id];
    if (!msg?.trim()) return;
    const newMsg = { sender: user.email, sender_name: "Admin", message: msg.trim(), timestamp: new Date().toISOString(), is_admin: true };
    const msgs = [...(dispute.messages || []), newMsg];
    await base44.entities.Dispute.update(dispute.id, { messages: msgs });
    setDisputeMessages((p) => ({ ...p, [dispute.id]: "" }));
    const d = await base44.entities.Dispute.list("-created_date", 100);
    setDisputes(d);
    toast.success("Message sent");
  };

  const updateKyc = async (userId, status) => {
    await base44.entities.User.update(userId, { kyc_status: status });
    const us = await base44.entities.User.list();
    setUsers(us);
    toast.success(`KYC ${status}`);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  const activeTrades = trades.filter((t) => ["escrow_held","payment_sent"].includes(t.status));
  const disputedTrades = trades.filter((t) => t.status === "disputed");
  const openDisputes = disputes.filter((d) => d.status === "open" || d.status === "under_review");
  const completedTrades = trades.filter((t) => t.status === "completed");
  const totalVolume = completedTrades.reduce((s, t) => s + (t.fiat_amount || 0), 0);
  const escrowTrades = trades.filter((t) => ["escrow_held","payment_sent","disputed"].includes(t.status));
  const kycPending = users.filter((u) => u.kyc_status === "pending");
  const kycAll = users.filter((u) => u.kyc_status);

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><Shield className="h-5 w-5 text-primary" /></div>
        <div><h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1><p className="text-muted-foreground text-sm">Full platform control &amp; moderation</p></div>
      </div>

      {/* Tab Nav */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${tab === v ? "bg-primary text-white border-primary" : "bg-card border-slate-600 text-slate-300 hover:text-white"}`}>
            {l}{v === "kyc" && kycPending.length > 0 ? ` (${kycPending.length})` : ""}{v === "disputes" && openDisputes.length > 0 ? ` (${openDisputes.length})` : ""}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Active Trades", value: activeTrades.length, icon: Clock, color: "text-blue-400" },
              { label: "Open Disputes", value: openDisputes.length, icon: AlertTriangle, color: "text-red-400" },
              { label: "Disputed Trades", value: disputedTrades.length, icon: AlertTriangle, color: "text-orange-400" },
              { label: "Volume (Fiat)", value: `$${totalVolume.toFixed(0)}`, icon: DollarSign, color: "text-green-400" },
            ].map((s) => { const Icon = s.icon; return (
              <div key={s.label} className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2"><Icon className={`h-4 w-4 ${s.color}`} /><span className="text-xs text-muted-foreground">{s.label}</span></div>
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              </div>
            );})}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-foreground mb-3">Needs Attention</h3>
              {openDisputes.slice(0,4).map((d) => (
                <div key={d.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div><div className="text-sm font-medium text-foreground">Trade #{d.trade_id?.slice(-6)}</div><div className="text-xs text-muted-foreground">{d.raised_by}</div></div>
                  <button onClick={() => setTab("disputes")} className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-lg hover:bg-red-500/20">Review →</button>
                </div>
              ))}
              {openDisputes.length === 0 && <p className="text-sm text-muted-foreground py-4">✓ No open disputes</p>}
            </div>
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-foreground mb-3">Platform Summary</h3>
              {[["Total Users", users.length],["Total Trades", trades.length],["Completed", completedTrades.length],["Escrow Active", escrowTrades.length],["KYC Pending", kycPending.length]].map(([k,v]) => (
                <div key={k} className="flex justify-between py-1.5 border-b border-border last:border-0 text-sm">
                  <span className="text-muted-foreground">{k}</span><span className="font-semibold text-foreground">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE TRADES */}
      {tab === "active" && (
        <div className="space-y-3">
          {activeTrades.length === 0 && <div className="text-center py-16 text-muted-foreground">No active trades</div>}
          {activeTrades.map((t) => (
            <div key={t.id} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="font-semibold text-foreground">Trade #{t.id?.slice(-6)}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{t.crypto_amount} {t.crypto_asset} · {t.fiat_amount?.toLocaleString()} {t.fiat_currency}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-lg font-semibold ${STATUS_COLORS[t.status]}`}>{t.status?.replace("_"," ")}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                <div>Buyer: <span className="text-foreground font-medium">{t.buyer_name || t.buyer_email}</span></div>
                <div>Seller: <span className="text-foreground font-medium">{t.seller_name || t.seller_email}</span></div>
                <div>Escrow: <span className={`font-semibold ${t.escrow_status === "held" ? "text-blue-400" : "text-green-400"}`}>{t.escrow_status}</span></div>
                <div>Payment: <span className="text-foreground">{t.payment_method}</span></div>
              </div>
              {t.payment_proof_url && (
                <a href={t.payment_proof_url} target="_blank" rel="noreferrer" className="text-xs text-primary underline flex items-center gap-1 mb-3"><Eye className="h-3 w-3" />View Payment Proof</a>
              )}
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" onClick={() => updateTrade(t.id, { status: "completed", escrow_status: "released" })} className="rounded-lg text-xs bg-green-600 hover:bg-green-700 h-8">
                  <Unlock className="h-3 w-3 mr-1" />Force Complete
                </Button>
                <Button size="sm" variant="outline" onClick={() => updateTrade(t.id, { status: "cancelled", escrow_status: "refunded" })} className="rounded-lg text-xs text-destructive border-destructive/30 h-8">
                  <Lock className="h-3 w-3 mr-1" />Cancel &amp; Refund
                </Button>
                <Button size="sm" variant="outline" onClick={() => updateTrade(t.id, { status: "disputed" })} className="rounded-lg text-xs h-8">
                  <AlertTriangle className="h-3 w-3 mr-1" />Mark Disputed
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DISPUTES */}
      {tab === "disputes" && (
        <div className="space-y-4">
          {disputes.length === 0 && <div className="text-center py-16 text-muted-foreground">No disputes</div>}
          {disputes.map((d) => {
            const trade = trades.find((t) => t.id === d.trade_id);
            const isExpanded = expandedDispute === d.id;
            return (
              <div key={d.id} className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="font-semibold text-foreground">Trade #{d.trade_id?.slice(-6)}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">By: {d.raised_by} · Against: {d.against}</div>
                    {trade && <div className="text-xs text-muted-foreground">{trade.crypto_amount} {trade.crypto_asset} · {trade.fiat_amount?.toLocaleString()} {trade.fiat_currency}</div>}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-lg font-semibold ${d.status === "open" || d.status === "under_review" ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"}`}>{d.status?.replace("_"," ")}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{d.reason}</p>
                {trade?.payment_proof_url && (
                  <a href={trade.payment_proof_url} target="_blank" rel="noreferrer" className="text-xs text-primary underline flex items-center gap-1 mb-3"><Eye className="h-3 w-3" />View Payment Proof</a>
                )}
                {(d.status === "open" || d.status === "under_review") && (
                  <div className="flex gap-2 flex-wrap mb-3">
                    <Button size="sm" onClick={() => resolveDispute(d.id, "resolved_buyer", d.trade_id, "buyer")} className="rounded-lg text-xs bg-blue-600 hover:bg-blue-700 h-8 flex-1">
                      ✓ Release to Buyer
                    </Button>
                    <Button size="sm" onClick={() => resolveDispute(d.id, "resolved_seller", d.trade_id, "seller")} className="rounded-lg text-xs bg-orange-600 hover:bg-orange-700 h-8 flex-1">
                      ↩ Refund to Seller
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => resolveDispute(d.id, "under_review", null, null)} className="rounded-lg text-xs h-8">
                      Under Review
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => resolveDispute(d.id, "closed", null, null)} className="rounded-lg text-xs h-8 text-muted-foreground">
                      Close
                    </Button>
                  </div>
                )}
                <button onClick={() => setExpandedDispute(isExpanded ? null : d.id)} className="text-xs text-primary underline mb-2">
                  {isExpanded ? "Hide" : "View"} Chat ({(d.messages||[]).length} messages)
                </button>
                {isExpanded && (
                  <div className="border border-border rounded-xl overflow-hidden mt-2">
                    <div className="max-h-48 overflow-y-auto p-3 space-y-2 bg-muted/20">
                      {(d.messages||[]).length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No messages</p>}
                      {(d.messages||[]).map((m, i) => (
                        <div key={i} className={`text-xs p-2 rounded-lg ${m.is_admin ? "bg-accent/20 text-foreground" : "bg-muted text-muted-foreground"}`}>
                          <span className="font-semibold">{m.is_admin ? "🛡 Admin" : m.sender_name || m.sender}: </span>{m.message}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 p-2 border-t border-border">
                      <Input value={disputeMessages[d.id] || ""} onChange={(e) => setDisputeMessages((p)=>({...p,[d.id]:e.target.value}))} placeholder="Admin message to both parties..." className="h-8 rounded-lg text-xs" />
                      <Button size="sm" onClick={() => sendDisputeMessage(d)} className="h-8 rounded-lg px-3">
                        <Send className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ESCROW MONITOR */}
      {tab === "escrow" && (
        <div className="space-y-3">
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-2">
            <p className="text-sm text-foreground font-medium">Escrow Monitor — Real-time view of all funds currently locked</p>
            <p className="text-xs text-muted-foreground mt-1">Total funds in escrow: <strong>{escrowTrades.reduce((s,t)=>s+(t.crypto_amount||0),0).toFixed(2)} (mixed assets)</strong></p>
          </div>
          {escrowTrades.length === 0 && <div className="text-center py-16 text-muted-foreground">No funds in escrow</div>}
          {escrowTrades.map((t) => (
            <div key={t.id} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-foreground">Trade #{t.id?.slice(-6)}</div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-lg ${STATUS_COLORS[t.status]}`}>{t.status?.replace("_"," ")}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-lg font-semibold ${t.escrow_status === "held" ? "bg-blue-500/10 text-blue-400" : "bg-green-500/10 text-green-400"}`}>
                    escrow: {t.escrow_status}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                <div>🔒 Locked: <span className="font-bold text-foreground">{t.crypto_amount} {t.crypto_asset}</span></div>
                <div>💵 Fiat: <span className="text-foreground">{t.fiat_amount?.toLocaleString()} {t.fiat_currency}</span></div>
                <div>Buyer: {t.buyer_email}</div>
                <div>Seller: {t.seller_email}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => updateTrade(t.id, { status: "completed", escrow_status: "released" })} className="rounded-lg text-xs bg-green-600 hover:bg-green-700 h-8">
                  <Unlock className="h-3 w-3 mr-1" />Release to Buyer
                </Button>
                <Button size="sm" variant="outline" onClick={() => updateTrade(t.id, { status: "cancelled", escrow_status: "refunded" })} className="rounded-lg text-xs text-orange-400 border-orange-400/30 h-8">
                  ↩ Refund to Seller
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KYC */}
      {tab === "kyc" && (
        <div className="space-y-4">
          {kycAll.length === 0 && <div className="text-center py-16 text-muted-foreground">No KYC submissions yet</div>}
          {kycAll.map((u) => (
            <div key={u.id} className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="font-semibold text-foreground">{u.full_name}</div>
                  <div className="text-xs text-muted-foreground">{u.email} · {u.phone} · {u.country}</div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${u.kyc_status === "verified" ? "bg-green-500/10 text-green-400" : u.kyc_status === "pending" ? "bg-yellow-500/10 text-yellow-400" : "bg-red-500/10 text-red-400"}`}>{u.kyc_status}</span>
              </div>
              {u.kyc_document_url && <img src={u.kyc_document_url} alt="KYC" className="w-full max-h-64 object-contain rounded-xl border border-border mb-4" />}
              <div className="flex gap-2">
                {u.kyc_status !== "verified" && <Button size="sm" onClick={() => updateKyc(u.id, "verified")} className="rounded-lg bg-green-600 hover:bg-green-700 text-white flex-1 h-8"><Check className="h-3 w-3 mr-1" />Approve</Button>}
                {u.kyc_status !== "rejected" && <Button size="sm" variant="outline" onClick={() => updateKyc(u.id, "rejected")} className="rounded-lg text-destructive border-destructive/30 flex-1 h-8">Reject</Button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* WALLET ADDRESSES */}
      {tab === "wallets" && (
        <div className="space-y-4">
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1"><Settings className="h-4 w-4 text-primary" /><span className="font-semibold text-foreground">Platform Deposit Addresses</span></div>
            <p className="text-xs text-muted-foreground">These are the wallet addresses shown to users when they deposit. Set and update them here.</p>
          </div>
          {WALLET_KEYS.map(({ key, label }) => {
            const current = getWalletValue(key);
            const editing = walletEdit[key] !== undefined;
            return (
              <div key={key} className="bg-card border border-border rounded-2xl p-5">
                <div className="font-semibold text-foreground text-sm mb-1">{label}</div>
                {current && !editing ? (
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-mono text-xs text-muted-foreground bg-muted px-3 py-2 rounded-xl flex-1 truncate">{current}</div>
                    <Button size="sm" variant="outline" onClick={() => setWalletEdit((p)=>({...p,[key]:current}))} className="rounded-xl h-8 px-3 text-xs">Edit</Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input value={walletEdit[key] || ""} onChange={(e) => setWalletEdit((p)=>({...p,[key]:e.target.value}))} placeholder={`Enter ${label} address`} className="h-10 rounded-xl font-mono text-xs" />
                    <Button size="sm" onClick={() => saveWalletAddress(key, label)} className="rounded-xl h-10 px-4">Save</Button>
                    {current && <Button size="sm" variant="ghost" onClick={() => setWalletEdit((p)=>({...p,[key]:undefined}))} className="rounded-xl h-10 px-3 text-xs">Cancel</Button>}
                  </div>
                )}
                {!current && !editing && <p className="text-xs text-muted-foreground mt-1">⚠ No address set — users cannot deposit {label}</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* USERS */}
      {tab === "users" && (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{(u.full_name||"U")[0]}</span>
                </div>
                <div>
                  <div className="font-semibold text-foreground text-sm">{u.full_name}</div>
                  <div className="text-xs text-muted-foreground">{u.email} · {u.country || "—"}</div>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-xs px-2 py-0.5 rounded-lg ${u.role === "admin" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`}>{u.role}</span>
                {u.is_profile_complete && <div className="text-xs text-primary mt-1 flex items-center gap-1 justify-end"><CheckCircle className="h-3 w-3" />Profile OK</div>}
                {u.kyc_status === "verified" && <div className="text-xs text-green-400 mt-0.5 flex items-center gap-1 justify-end"><Shield className="h-3 w-3" />KYC Verified</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}