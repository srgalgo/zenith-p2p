import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw } from "lucide-react";
import AdCard from "../components/AdCard";

export default function Marketplace() {
  const navigate = useNavigate();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("buy");
  const [crypto, setCrypto] = useState("all");
  const [currency, setCurrency] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const fetchAds = async () => {
    setLoading(true);
    const query = { status: "active", ad_type: tab === "buy" ? "sell" : "buy" };
    if (crypto !== "all") query.crypto_asset = crypto;
    if (currency !== "all") query.fiat_currency = currency;
    let result = await base44.entities.TradeAd.filter(query, "-created_date", 50);
    if (paymentFilter !== "all") result = result.filter((a) => (a.payment_methods || []).includes(paymentFilter));
    setAds(result);
    setLoading(false);
  };

  useEffect(() => { fetchAds(); }, [tab, crypto, currency, paymentFilter]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Marketplace</h1>
        <p className="text-muted-foreground mt-1">Browse and trade with verified users</p>
      </div>
      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList className="grid w-full max-w-xs grid-cols-2 rounded-xl h-11 bg-slate-700 border border-slate-600 p-1">
          <TabsTrigger value="buy" className="rounded-lg font-semibold text-white data-[state=active]:bg-green-500 data-[state=active]:text-white">Buy Crypto</TabsTrigger>
          <TabsTrigger value="sell" className="rounded-lg font-semibold text-white data-[state=active]:bg-red-500 data-[state=active]:text-white">Sell Crypto</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={crypto} onValueChange={setCrypto}>
          <SelectTrigger className="w-32 h-10 rounded-xl"><SelectValue placeholder="Asset" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assets</SelectItem>
            <SelectItem value="USDT">USDT</SelectItem>
            <SelectItem value="USDC">USDC</SelectItem>
          </SelectContent>
        </Select>
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger className="w-32 h-10 rounded-xl"><SelectValue placeholder="Currency" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Fiat</SelectItem>
            {["INR","USD","EUR","GBP","BRL","NGN","PHP","TRY","AED","CAD","AUD"].map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-40 h-10 rounded-xl"><SelectValue placeholder="Payment" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="upi">UPI</SelectItem>
            <SelectItem value="imps">IMPS</SelectItem>
            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
            <SelectItem value="paypal">PayPal</SelectItem>
            <SelectItem value="wise">Wise</SelectItem>
            <SelectItem value="revolut">Revolut</SelectItem>
            <SelectItem value="sepa">SEPA</SelectItem>
            <SelectItem value="pix">PIX</SelectItem>
            <SelectItem value="gcash">GCash</SelectItem>
            <SelectItem value="paytm">Paytm</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-slate-500 text-white hover:bg-slate-700" onClick={fetchAds}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : ads.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-foreground">No ads found</h3>
          <p className="text-muted-foreground mt-1">Try changing filters or check back later</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ads.map((ad) => <AdCard key={ad.id} ad={ad} onTrade={(a) => navigate(`/trade/new?ad=${a.id}`)} />)}
        </div>
      )}
    </div>
  );
}