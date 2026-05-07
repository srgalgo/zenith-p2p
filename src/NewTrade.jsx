import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Shield, Clock } from "lucide-react";

const FEE = 0.5;
const PM_LABELS = { upi:"UPI", imps:"IMPS", bank_transfer:"Bank Transfer", cash_deposit:"Cash Deposit", paypal:"PayPal", wise:"Wise", revolut:"Revolut", skrill:"Skrill", zelle:"Zelle", venmo:"Venmo", sepa:"SEPA", pix:"PIX", gcash:"GCash", paytm:"Paytm", phonepe:"PhonePe", googlepay:"Google Pay" };

export default function NewTrade() {
  const navigate = useNavigate();
  const adId = new URLSearchParams(window.location.search).get("ad");
  const [ad, setAd] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fiatAmount, setFiatAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [restrictionMsg, setRestrictionMsg] = useState("");

  useEffect(() => {
    Promise.all([base44.entities.TradeAd.get(adId), base44.auth.me()]).then(async ([a, u]) => {
      setAd(a); setUser(u);
      const recent = await base44.entities.Trade.list("-updated_date", 10);
      const mine = recent.filter((t) => t.buyer_email === u.email).slice(0, 3);
      if (mine.length === 3 && mine.every((t) => ["cancelled","expired"].includes(t.status))) {
        const lastTime = new Date(mine[0].updated_date);
        const hoursAgo = (Date.now() - lastTime) / 3600000;
        if (hoursAgo < 24) setRestrictionMsg(`Account restricted for ${(24 - hoursAgo).toFixed(1)}h due to 3 consecutive cancellations.`);
      }
      setLoading(false);
    });
  }, [adId]);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  if (!ad) return <div className="text-center py-20 text-muted-foreground">Ad not found</div>;

  const cryptoAmount = fiatAmount ? Number(fiatAmount) / ad.price_per_unit : 0;
  const fee = cryptoAmount * (FEE / 100);
  const isBuying = ad.ad_type === "sell";

  const handleStart = async () => {
    if (!fiatAmount || Number(fiatAmount) < ad.min_trade || Number(fiatAmount) > ad.max_trade) {
      toast.error(`Amount must be ${ad.min_trade}–${ad.max_trade} ${ad.fiat_currency}`); return;
    }
    if (!paymentMethod) { toast.error("Select a payment method"); return; }
    if (ad.trader_email === user.email) { toast.error("Cannot trade with your own ad"); return; }
    if (restrictionMsg) { toast.error(restrictionMsg); return; }
    if (user.kyc_status !== "verified") {
      const allTrades = await base44.entities.Trade.list("-created_date", 100);
      const myCompleted = allTrades.filter((t) => t.buyer_email === user.email && t.status === "completed");
      const totalVol = myCompleted.reduce((s, t) => s + (t.fiat_amount || 0), 0);
      const approxUSD = ad.fiat_currency === "INR" ? (totalVol + Number(fiatAmount)) / 85 : totalVol + Number(fiatAmount);
      if (approxUSD > 50000) { toast.error("Non-KYC limit of $50,000 USD reached. Complete KYC for unlimited trading."); return; }
    }
    if (cryptoAmount > ad.remaining_amount) { toast.error(`Only ${ad.remaining_amount} ${ad.crypto_asset} available`); return; }
    setSubmitting(true);
    const now = new Date();
    const trade = await base44.entities.Trade.create({
      ad_id: ad.id,
      buyer_email: isBuying ? user.email : ad.trader_email,
      seller_email: isBuying ? ad.trader_email : user.email,
      buyer_name: isBuying ? (user.display_name || user.full_name) : ad.trader_name,
      seller_name: isBuying ? ad.trader_name : (user.display_name || user.full_name),
      crypto_asset: ad.crypto_asset,
      crypto_amount: parseFloat(cryptoAmount.toFixed(4)),
      fiat_amount: Number(fiatAmount),
      fiat_currency: ad.fiat_currency,
      price_per_unit: ad.price_per_unit,
      payment_method: paymentMethod,
      status: "escrow_held",
      escrow_status: "held",
      trade_started_at: now.toISOString(),
      trade_expires_at: new Date(now.getTime() + 60 * 60000).toISOString(),
      buyer_fee: parseFloat(fee.toFixed(4)),
      seller_fee: parseFloat(fee.toFixed(4)),
      fee_percentage: FEE,
    });
    await base44.entities.TradeAd.update(ad.id, {
      remaining_amount: parseFloat((ad.remaining_amount - cryptoAmount).toFixed(4)),
      status: ad.remaining_amount - cryptoAmount <= 0 ? "completed" : "active",
    });
    // Send email notifications to both parties
    base44.integrations.Core.SendEmail({
      to: isBuying ? user.email : ad.trader_email,
      subject: `Trade Started - ${ad.crypto_asset} Trade #${trade.id?.slice(-6)}`,
      body: `Hi ${isBuying ? (user.display_name || user.full_name) : ad.trader_name},\n\nA new trade has been initiated!\n\nTrade ID: ${trade.id}\nAsset: ${ad.crypto_asset}\nAmount: ${parseFloat(cryptoAmount.toFixed(4))} ${ad.crypto_asset}\nFiat: ${Number(fiatAmount)} ${ad.fiat_currency}\nPayment Method: ${paymentMethod}\n\nYou have 60 minutes to complete this trade.\n\nLog in to CryptoP2P to proceed.`,
    }).catch(() => {});
    base44.integrations.Core.SendEmail({
      to: isBuying ? ad.trader_email : user.email,
      subject: `New Trade Request - Trade #${trade.id?.slice(-6)}`,
      body: `Hi ${isBuying ? ad.trader_name : (user.display_name || user.full_name)},\n\nSomeone wants to trade with your ad!\n\nTrade ID: ${trade.id}\nAsset: ${ad.crypto_asset}\nAmount: ${parseFloat(cryptoAmount.toFixed(4))} ${ad.crypto_asset}\nFiat: ${Number(fiatAmount)} ${ad.fiat_currency}\n\nLog in to CryptoP2P to manage this trade.`,
    }).catch(() => {});
    toast.success("Trade started! Crypto held in escrow.");
    navigate(`/trade/${trade.id}`);
  };

  return (
    <div className="max-w-lg mx-auto">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 -ml-2"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{isBuying ? "Buy" : "Sell"} {ad.crypto_asset}</h1>
        <p className="text-muted-foreground mt-1">{isBuying ? "from" : "to"} {ad.trader_name}</p>
      </div>
      <div className="bg-card border border-border rounded-2xl p-5 mb-4 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Price</span><span className="font-bold text-foreground">{ad.price_per_unit} {ad.fiat_currency}/{ad.crypto_asset}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Available</span><span className="text-foreground">{ad.remaining_amount} {ad.crypto_asset}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Limit</span><span className="text-foreground">{ad.min_trade}–{ad.max_trade} {ad.fiat_currency}</span></div>
        {ad.terms && <div className="pt-2 border-t border-border text-muted-foreground">{ad.terms}</div>}
      </div>
      <div className="flex gap-3 mb-6">
        <div className="flex-1 flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-2xl p-3">
          <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Escrow Protected</span> — Crypto locked until payment confirmed</p>
        </div>
        <div className="flex-1 flex items-start gap-2 bg-accent/5 border border-accent/20 rounded-2xl p-3">
          <Clock className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">60-Min Window</span> — Complete payment in time</p>
        </div>
      </div>
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="space-y-2">
          <Label className="text-foreground">Fiat Amount ({ad.fiat_currency}) *</Label>
          <Input type="number" value={fiatAmount} onChange={(e) => setFiatAmount(e.target.value)} placeholder={`${ad.min_trade} – ${ad.max_trade}`} className="h-12 rounded-xl text-lg" />
          {fiatAmount && <div className="text-sm text-muted-foreground">≈ {cryptoAmount.toFixed(4)} {ad.crypto_asset}</div>}
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">Payment Method *</Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select payment method" /></SelectTrigger>
            <SelectContent>{(ad.payment_methods || []).map((pm) => <SelectItem key={pm} value={pm}>{PM_LABELS[pm] || pm}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {fiatAmount && (
          <div className="bg-muted rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Crypto Amount</span><span>{cryptoAmount.toFixed(4)} {ad.crypto_asset}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Platform Fee ({FEE}%)</span><span>{fee.toFixed(4)} {ad.crypto_asset}</span></div>
            <div className="flex justify-between pt-2 border-t border-border font-semibold">
              <span className="text-foreground">You {isBuying ? "Receive" : "Send"}</span>
              <span className="text-primary">{isBuying ? (cryptoAmount - fee).toFixed(4) : (cryptoAmount + fee).toFixed(4)} {ad.crypto_asset}</span>
            </div>
          </div>
        )}
        <Button onClick={handleStart} disabled={submitting || !fiatAmount || !paymentMethod} className="w-full h-12 rounded-xl font-semibold text-base">
          {submitting ? "Starting..." : `${isBuying ? "Buy" : "Sell"} ${ad.crypto_asset}`}
        </Button>
      </div>
    </div>
  );
}