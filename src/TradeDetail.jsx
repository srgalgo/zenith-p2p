import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Check, AlertTriangle, Clock, Camera, FileText } from "lucide-react";
import TradeChat from "../components/TradeChat";
import RateTradeModal from "../components/RateTradeModal";
import TradeTimer from "../components/TradeTimer";

const STATUS_LABELS = { pending:"Pending", escrow_held:"Escrow Held", payment_sent:"Payment Sent", payment_confirmed:"Confirmed", completed:"Completed", disputed:"Disputed", cancelled:"Cancelled", expired:"Expired" };
const STATUS_COLORS = { pending:"bg-yellow-500/10 text-yellow-500", escrow_held:"bg-blue-500/10 text-blue-500", payment_sent:"bg-orange-500/10 text-orange-500", completed:"bg-green-500/10 text-green-500", disputed:"bg-red-500/10 text-red-500", cancelled:"bg-muted text-muted-foreground", expired:"bg-muted text-muted-foreground" };
const PM_LABELS = { upi:"UPI", imps:"IMPS", bank_transfer:"Bank Transfer", cash_deposit:"Cash Deposit", paypal:"PayPal", wise:"Wise", revolut:"Revolut", skrill:"Skrill", zelle:"Zelle", venmo:"Venmo", sepa:"SEPA", pix:"PIX", gcash:"GCash", paytm:"Paytm", phonepe:"PhonePe", googlepay:"Google Pay" };

export default function TradeDetail() {
  const { tradeId } = useParams();
  const navigate = useNavigate();
  const [trade, setTrade] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [proof, setProof] = useState({ transaction_id:"", reference_id:"", amount_paid:"", payment_date:"", payment_time:"", sender_name:"", sender_account:"" });

  const prevStatusRef = useState(null);
  const fetchTrade = async () => {
    const [t, u] = await Promise.all([base44.entities.Trade.get(tradeId), base44.auth.me()]);
    setTrade((prev) => {
      if (prev && prev.status !== t.status) {
        const msgs = { escrow_held: "⏳ Escrow locked — awaiting payment", payment_sent: "💳 Buyer submitted payment proof", completed: "✅ Trade completed!", disputed: "⚠️ Dispute raised — admin will review", cancelled: "Trade cancelled" };
        if (msgs[t.status]) toast(msgs[t.status]);
      }
      return t;
    });
    setUser(u); setLoading(false);
  };
  useEffect(() => { fetchTrade(); const iv = setInterval(fetchTrade, 10000); return () => clearInterval(iv); }, [tradeId]);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  if (!trade) return <div className="text-center py-20 text-muted-foreground">Trade not found</div>;

  const isBuyer = user?.email === trade.buyer_email;
  const isSeller = user?.email === trade.seller_email;
  const isActive = ["escrow_held","payment_sent"].includes(trade.status);

  const handleUploadProof = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (!proof.transaction_id) { toast.error("Enter Transaction ID first"); return; }
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.Trade.update(trade.id, { payment_proof_url: file_url, payment_proof_details: { ...proof, amount_paid: Number(proof.amount_paid) || trade.fiat_amount }, status: "payment_sent" });
    toast.success("Payment proof uploaded!");
    setUploading(false); fetchTrade();
  };

  const handleConfirm = async () => {
    await base44.entities.Trade.update(trade.id, { status: "completed", escrow_status: "released" });
    toast.success("Payment confirmed! Crypto released.");
    fetchTrade();
  };

  const handleDispute = async () => {
    await base44.entities.Trade.update(trade.id, { status: "disputed" });
    await base44.entities.Dispute.create({ trade_id: trade.id, raised_by: user.email, against: isBuyer ? trade.seller_email : trade.buyer_email, reason: "Payment dispute", status: "open", messages: [] });
    toast.success("Dispute raised. Admin will review.");
    fetchTrade();
  };

  const handleCancel = async () => {
    await base44.entities.Trade.update(trade.id, { status: "cancelled", escrow_status: "refunded" });
    toast.success("Trade cancelled."); fetchTrade();
  };

  return (
    <div className="max-w-lg mx-auto">
      <Button variant="ghost" onClick={() => navigate("/my-trades")} className="mb-4 -ml-2"><ArrowLeft className="h-4 w-4 mr-2" />My Trades</Button>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Trade #{trade.id?.slice(-6)}</h1>
          <p className="text-sm text-muted-foreground">{isBuyer ? "Buying" : "Selling"} {trade.crypto_asset}</p>
        </div>
        {isActive && trade.trade_expires_at && <TradeTimer expiresAt={trade.trade_expires_at} />}
      </div>
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold mb-4 ${STATUS_COLORS[trade.status] || "bg-muted text-muted-foreground"}`}>
        {trade.status === "completed" ? <Check className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
        {STATUS_LABELS[trade.status]}
      </div>

      {/* Trade Details */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-4 space-y-3 text-sm">
        {[
          ["Crypto Amount", `${trade.crypto_amount} ${trade.crypto_asset}`],
          ["Fiat Amount", `${trade.fiat_amount?.toLocaleString()} ${trade.fiat_currency}`],
          ["Price", `${trade.price_per_unit} ${trade.fiat_currency}/${trade.crypto_asset}`],
          ["Payment Method", PM_LABELS[trade.payment_method] || trade.payment_method],
          ["Fee", `${isBuyer ? trade.buyer_fee : trade.seller_fee} ${trade.crypto_asset} (${trade.fee_percentage}%)`],
          ["Counterparty", isBuyer ? trade.seller_name : trade.buyer_name],
          ["Escrow", trade.escrow_status?.charAt(0).toUpperCase() + trade.escrow_status?.slice(1)],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between">
            <span className="text-muted-foreground">{k}</span>
            <span className="font-medium text-foreground">{v}</span>
          </div>
        ))}
      </div>

      {/* Payment Proof Form (Buyer) */}
      {isBuyer && trade.status === "escrow_held" && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><FileText className="h-4 w-4" />Submit Payment Proof</h3>
          <p className="text-sm text-muted-foreground mb-2">Pay via {PM_LABELS[trade.payment_method]} and fill all details below</p>
          {["bank_transfer","imps","upi","sepa","pix","gcash","paytm","phonepe","googlepay"].includes(trade.payment_method) && (
           <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-3 text-xs text-red-400">
             ⚠️ <strong>Important:</strong> Do NOT use words like "crypto", "bitcoin", "USDT", "USDC", "coin", or any crypto-related terms in the payment description/remarks. Write something neutral like <em>"Payment"</em> or <em>"Transfer"</em> to avoid bank flags.
           </div>
          )}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[["Transaction ID *","transaction_id","TXN123456"],["Reference ID","reference_id","REF789"]].map(([l,k,ph]) => (
                <div key={k} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{l}</Label>
                  <Input value={proof[k]} onChange={(e) => setProof({...proof,[k]:e.target.value})} placeholder={ph} className="h-10 rounded-lg text-sm" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">Amount Paid *</Label><Input type="number" value={proof.amount_paid} onChange={(e)=>setProof({...proof,amount_paid:e.target.value})} placeholder={String(trade.fiat_amount)} className="h-10 rounded-lg text-sm" /></div>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">Date *</Label><Input type="date" value={proof.payment_date} onChange={(e)=>setProof({...proof,payment_date:e.target.value})} className="h-10 rounded-lg text-sm" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">Time</Label><Input type="time" value={proof.payment_time} onChange={(e)=>setProof({...proof,payment_time:e.target.value})} className="h-10 rounded-lg text-sm" /></div>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">Sender Name</Label><Input value={proof.sender_name} onChange={(e)=>setProof({...proof,sender_name:e.target.value})} placeholder="Your name" className="h-10 rounded-lg text-sm" /></div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Sender Account / UPI ID</Label>
              <Input value={proof.sender_account} onChange={(e)=>setProof({...proof,sender_account:e.target.value})} placeholder="e.g. user@upi or account number" className="h-10 rounded-lg text-sm" />
            </div>
            <label className="flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-dashed border-primary/30 text-primary cursor-pointer hover:bg-primary/5 transition-all">
              <Camera className="h-4 w-4" />
              <span className="text-sm font-medium">{uploading ? "Uploading..." : "Upload Payment Screenshot *"}</span>
              <input type="file" accept="image/*" onChange={handleUploadProof} className="hidden" disabled={uploading} />
            </label>
          </div>
        </div>
      )}

      {/* Payment Proof View */}
      {trade.status === "payment_sent" && trade.payment_proof_url && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><FileText className="h-4 w-4" />Payment Proof</h3>
          <img src={trade.payment_proof_url} alt="Payment proof" className="w-full rounded-xl mb-3 border border-border" />
          {trade.payment_proof_details && (
            <div className="bg-muted rounded-xl p-3 space-y-1.5 text-sm">
              {Object.entries(trade.payment_proof_details).filter(([,v])=>v).map(([k,v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-muted-foreground capitalize">{k.replace(/_/g," ")}</span>
                  <span className="font-mono text-foreground">{String(v)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Live Trade Chat */}
      {["escrow_held","payment_sent","disputed"].includes(trade.status) && (
        <div className="mb-4">
          <TradeChat trade={trade} user={user} />
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {isSeller && trade.status === "payment_sent" && (
          <Button onClick={handleConfirm} className="w-full h-12 rounded-xl font-semibold bg-green-600 hover:bg-green-700">
            <Check className="h-4 w-4 mr-2" />
            Confirm Payment &amp; Release Crypto
          </Button>
        )}
        {isActive && (
          <Button variant="outline" onClick={handleDispute} className="w-full h-11 rounded-xl text-destructive border-destructive/30 hover:bg-destructive/5">
            <AlertTriangle className="h-4 w-4 mr-2" />Raise Dispute
          </Button>
        )}
        {isBuyer && trade.status === "escrow_held" && (
          <Button variant="ghost" onClick={handleCancel} className="w-full h-11 rounded-xl text-muted-foreground">Cancel Trade</Button>
        )}
        {trade.status === "completed" && showRating && (
          <div className="mb-4">
            <RateTradeModal trade={trade} user={user} onDone={() => setShowRating(false)} />
          </div>
        )}
        {trade.status === "completed" && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5 text-center">
            <Check className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <div className="font-semibold text-green-500">Trade Completed!</div>
            <p className="text-sm text-muted-foreground mt-1">{isBuyer ? "Crypto released to your wallet" : "Payment confirmed, trade complete"}</p>
            {!showRating && <button onClick={() => setShowRating(true)} className="mt-3 text-xs text-primary underline">Rate this trader</button>}
          </div>
        )}
        {trade.status === "disputed" && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <div className="font-semibold text-red-500">Under Dispute</div>
            <p className="text-sm text-muted-foreground mt-1">Admin reviewing. You will be notified of resolution.</p>
          </div>
        )}
      </div>
    </div>
  );
}