import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PriceTicker from "../components/PriceTicker";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Shield, Zap, Clock, Users, ArrowRight, TrendingUp, Lock, Globe, ChevronRight } from "lucide-react";

const stats = [
  { label: "Active Traders", value: "10K+", icon: Users },
  { label: "Trades Completed", value: "50K+", icon: TrendingUp },
  { label: "Countries", value: "100+", icon: Globe },
  { label: "Avg Trade Time", value: "<5 min", icon: Clock },
];
const features = [
  { icon: Lock, title: "Secure Escrow", description: "Assets auto-locked during trade. Released only after payment confirmation." },
  { icon: Clock, title: "60-Min Window", description: "60-minute trade window to ensure timely completion for both parties." },
  { icon: Zap, title: "Instant Settlement", description: "Crypto released instantly to buyer wallet on seller confirmation." },
  { icon: Shield, title: "Dispute Resolution", description: "24/7 admin support with evidence-based dispute resolution." },
  { icon: Globe, title: "Global Payments", description: "UPI, IMPS, PayPal, Wise, Revolut, GCash, PIX and many more." },
  { icon: Users, title: "P2P Trading", description: "Trade directly with users at their posted prices. No middlemen." },
];

export default function Home() {
  const [recentAds, setRecentAds] = useState([]);
  useEffect(() => { base44.entities.TradeAd.filter({ status: "active" }, "-created_date", 6).then(setRecentAds); }, []);

  return (
    <div className="space-y-14">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-card to-accent/5 border border-border p-8 md:p-16">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Shield className="h-3.5 w-3.5" />Secure P2P Crypto Exchange
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
            Buy &amp; Sell <span className="text-primary">USDT/USDC</span>
            <br />with Anyone, Anywhere
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
            Trade crypto peer-to-peer with automatic escrow, 100+ payment methods, and a 60-minute secure trade window.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-xl h-12 px-8 font-semibold">
              <Link to="/marketplace">Start Trading <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-xl h-12 px-8 font-semibold border-slate-400 text-white hover:bg-slate-700 hover:text-white">
              <Link to="/create-ad">Post an Ad</Link>
            </Button>
          </div>
        </div>
      </section>



      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => { const Icon = s.icon; return (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-5 text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 mb-3"><Icon className="h-5 w-5 text-primary" /></div>
            <div className="text-2xl font-bold text-foreground">{s.value}</div>
            <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
          </div>
        );})}
      </section>

      {/* How It Works */}
      <section>
        <h2 className="text-2xl font-bold text-foreground mb-2">How It Works</h2>
        <p className="text-muted-foreground mb-6">Simple 4-step secure trading process</p>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { step: "01", title: "Browse Ads", desc: "Find buy or sell offers matching your needs" },
            { step: "02", title: "Start Trade", desc: "Click to initiate — crypto locked in escrow" },
            { step: "03", title: "Make Payment", desc: "Send fiat and upload proof with all details" },
            { step: "04", title: "Get Crypto", desc: "Seller confirms and crypto releases to you" },
          ].map((item) => (
            <div key={item.step} className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden group hover:border-primary/30 transition-colors">
              <span className="absolute -top-2 -right-2 text-7xl font-black text-muted/30">{item.step}</span>
              <div className="relative">
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className="text-2xl font-bold text-foreground mb-2">Platform Features</h2>
        <p className="text-muted-foreground mb-6">Everything for safe P2P trading</p>
        <div className="grid md:grid-cols-3 gap-4">
          {features.map((f) => { const Icon = f.icon; return (
            <div key={f.title} className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4"><Icon className="h-5 w-5 text-primary" /></div>
              <h3 className="font-semibold text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.description}</p>
            </div>
          );})}
        </div>
      </section>

      {/* Recent Ads */}
      {recentAds.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Latest Offers</h2>
            <Button asChild variant="ghost" className="text-primary"><Link to="/marketplace">View All <ChevronRight className="ml-1 h-4 w-4" /></Link></Button>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {recentAds.map((ad) => (
              <Link key={ad.id} to={`/trade/new?ad=${ad.id}`} className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-all block">
                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${ad.ad_type === "buy" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                    {ad.ad_type === "buy" ? "BUYING" : "SELLING"}
                  </span>
                  <span className="text-xs text-muted-foreground">{ad.crypto_asset}</span>
                </div>
                <div className="text-xl font-bold text-foreground">{ad.price_per_unit} {ad.fiat_currency}</div>
                <div className="text-xs text-muted-foreground mt-1">{ad.min_trade} {" – "} {ad.max_trade} {ad.fiat_currency}</div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary">{(ad.trader_name || "U")[0]}</span>
                  </div>
                  <span className="text-sm text-foreground">{ad.trader_name || "Trader"}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-gradient-to-r from-primary/10 to-accent/10 border border-border rounded-3xl p-8 md:p-12 text-center">
        <h2 className="text-3xl font-bold text-foreground">Ready to Trade?</h2>
        <p className="text-muted-foreground mt-3 max-w-md mx-auto">Complete your profile to start buying and selling USDT/USDC instantly</p>
        <div className="mt-6 flex justify-center gap-3 flex-wrap">
          <Button asChild size="lg" className="rounded-xl"><Link to="/profile">Complete Profile</Link></Button>
          <Button asChild variant="outline" size="lg" className="rounded-xl"><Link to="/help">Learn More</Link></Button>
        </div>
      </section>
    </div>
  );
}