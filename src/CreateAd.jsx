import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { PlusCircle, ArrowLeft } from "lucide-react";

const INDIA_PAYMENTS = [
  { value: "upi", label: "UPI" }, { value: "imps", label: "IMPS" },
  { value: "bank_transfer", label: "Bank Transfer" }, { value: "cash_deposit", label: "Cash Deposit" },
  { value: "paytm", label: "Paytm" }, { value: "phonepe", label: "PhonePe" }, { value: "googlepay", label: "Google Pay" },
];
const GLOBAL_PAYMENTS = [
  { value: "paypal", label: "PayPal" }, { value: "wise", label: "Wise" }, { value: "revolut", label: "Revolut" },
  { value: "skrill", label: "Skrill" }, { value: "bank_transfer", label: "Bank Transfer" },
  { value: "zelle", label: "Zelle" }, { value: "venmo", label: "Venmo" }, { value: "sepa", label: "SEPA" },
  { value: "pix", label: "PIX" }, { value: "gcash", label: "GCash" },
];
const CURRENCIES = ["INR","USD","EUR","GBP","BRL","NGN","PHP","TRY","AED","CAD","AUD"];

export default function CreateAd() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ ad_type: "sell", crypto_asset: "USDT", price_per_unit: "", fiat_currency: "INR", total_amount: "", min_trade: "", max_trade: "", payment_methods: [], terms: "" });

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      if (!u.is_profile_complete) { toast.error("Complete your profile first"); navigate("/profile"); return; }
    });
  }, []);

  const isIndia = form.fiat_currency === "INR";
  const availablePayments = isIndia ? INDIA_PAYMENTS : GLOBAL_PAYMENTS;

  const togglePayment = (m) => setForm((p) => ({
    ...p, payment_methods: p.payment_methods.includes(m) ? p.payment_methods.filter((x) => x !== m) : [...p.payment_methods, m]
  }));

  const handleSubmit = async () => {
    if (!form.price_per_unit || !form.total_amount || !form.min_trade || !form.max_trade) { toast.error("Fill all required fields"); return; }
    if (form.payment_methods.length === 0) { toast.error("Select at least one payment method"); return; }
    if (Number(form.min_trade) > Number(form.max_trade)) { toast.error("Min trade cannot exceed max"); return; }
    setSubmitting(true);
    await base44.entities.TradeAd.create({
      ...form,
      price_per_unit: Number(form.price_per_unit),
      total_amount: Number(form.total_amount),
      remaining_amount: Number(form.total_amount),
      min_trade: Number(form.min_trade),
      max_trade: Number(form.max_trade),
      status: "active",
      trader_email: user.email,
      trader_name: user.display_name || user.full_name,
      country: user.country,
      total_trades: user.total_trades || 0,
      completion_rate: user.completion_rate || 100,
    });
    toast.success("Ad posted successfully!");
    navigate("/marketplace");
  };

  return (
    <div className="max-w-lg mx-auto">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 -ml-2"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
      <div className="mb-6"><h1 className="text-2xl font-bold text-foreground">Create Trade Ad</h1><p className="text-muted-foreground mt-1">Post your buy or sell offer</p></div>
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        {/* Ad Type */}
        <div className="space-y-2">
          <Label className="text-foreground">I want to</Label>
          <div className="grid grid-cols-2 gap-3">
            {["sell", "buy"].map((type) => (
              <button key={type} onClick={() => setForm({ ...form, ad_type: type })}
                className={`h-12 rounded-xl font-semibold text-sm border-2 transition-all ${form.ad_type === type ? (type === "sell" ? "border-red-500 bg-red-500/10 text-red-500" : "border-green-500 bg-green-500/10 text-green-500") : "border-border text-muted-foreground"}`}>
                {type === "sell" ? "Sell Crypto" : "Buy Crypto"}
              </button>
            ))}
          </div>
        </div>
        {/* Crypto */}
        <div className="space-y-2">
          <Label className="text-foreground">Crypto Asset</Label>
          <div className="grid grid-cols-2 gap-3">
            {["USDT","USDC"].map((asset) => (
              <button key={asset} onClick={() => setForm({ ...form, crypto_asset: asset })}
                className={`h-11 rounded-xl font-semibold text-sm border-2 transition-all ${form.crypto_asset === asset ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
                {asset}
              </button>
            ))}
          </div>
        </div>
        {/* Currency */}
        <div className="space-y-2">
          <Label className="text-foreground">Fiat Currency</Label>
          <Select value={form.fiat_currency} onValueChange={(v) => setForm({ ...form, fiat_currency: v, payment_methods: [] })}>
            <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {/* Price */}
        <div className="space-y-2">
          <Label className="text-foreground">Price per {form.crypto_asset} ({form.fiat_currency}) *</Label>
          <Input type="number" value={form.price_per_unit} onChange={(e) => setForm({ ...form, price_per_unit: e.target.value })} placeholder="e.g. 85.50" className="h-11 rounded-xl" />
        </div>
        {/* Total */}
        <div className="space-y-2">
          <Label className="text-foreground">Total {form.crypto_asset} Amount *</Label>
          <Input type="number" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} placeholder="e.g. 1000" className="h-11 rounded-xl" />
        </div>
        {/* Limits */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-foreground">Min ({form.fiat_currency}) *</Label>
            <Input type="number" value={form.min_trade} onChange={(e) => setForm({ ...form, min_trade: e.target.value })} placeholder="500" className="h-11 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Max ({form.fiat_currency}) *</Label>
            <Input type="number" value={form.max_trade} onChange={(e) => setForm({ ...form, max_trade: e.target.value })} placeholder="50000" className="h-11 rounded-xl" />
          </div>
        </div>
        {/* Payment Methods */}
        <div className="space-y-3">
          <Label className="text-foreground">Payment Methods *</Label>
          <div className="grid grid-cols-2 gap-2">
            {availablePayments.map((pm) => (
              <label key={pm.value} className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all text-sm ${form.payment_methods.includes(pm.value) ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground"}`}>
                <Checkbox checked={form.payment_methods.includes(pm.value)} onCheckedChange={() => togglePayment(pm.value)} />
                {pm.label}
              </label>
            ))}
          </div>
        </div>
        {/* Terms */}
        <div className="space-y-2">
          <Label className="text-foreground">Trade Terms (Optional)</Label>
          <Textarea value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} placeholder="Any specific instructions..." className="rounded-xl min-h-[80px]" />
        </div>
        <Button onClick={handleSubmit} disabled={submitting} className="w-full h-12 rounded-xl font-semibold text-base">
          <PlusCircle className="h-4 w-4 mr-2" />{submitting ? "Posting..." : "Post Ad"}
        </Button>
      </div>
    </div>
  );
}