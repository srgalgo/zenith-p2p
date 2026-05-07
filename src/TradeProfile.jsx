import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Star, Shield, TrendingUp, Clock, CheckCircle, MessageSquare, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

function StarRating({ value }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <Star key={s} className={`h-4 w-4 ${s <= Math.round(value) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
      ))}
    </div>
  );
}

export default function TraderProfile() {
  const { email } = useParams();
  const navigate = useNavigate();
  const [trader, setTrader] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [users, r, a] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.TradeRating.filter({ to_email: email }, "-created_date", 20),
        base44.entities.TradeAd.filter({ trader_email: email, status: "active" }, "-created_date", 6),
      ]);
      const t = users.find((u) => u.email === email);
      setTrader(t); setRatings(r); setAds(a);
      setLoading(false);
    };
    load();
  }, [email]);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  if (!trader) return <div className="text-center py-20 text-muted-foreground">Trader not found</div>;

  const avgRating = ratings.length ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : 0;
  const initials = (trader.display_name || trader.full_name || "T")[0].toUpperCase();

  return (
    <div className="max-w-lg mx-auto pb-20">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 -ml-2"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>

      {/* Header */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">{initials}</div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{trader.display_name || trader.full_name}</h1>
            <div className="text-sm text-muted-foreground">{trader.country}</div>
            {trader.kyc_status === "verified" && (
              <div className="flex items-center gap-1 text-xs text-green-500 mt-1"><Shield className="h-3 w-3" />KYC Verified</div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-muted rounded-xl p-3">
            <div className="text-lg font-bold text-foreground">{trader.total_trades || 0}</div>
            <div className="text-xs text-muted-foreground">Trades</div>
          </div>
          <div className="bg-muted rounded-xl p-3">
            <div className="text-lg font-bold text-foreground">{trader.completion_rate || 0}%</div>
            <div className="text-xs text-muted-foreground">Completion</div>
          </div>
          <div className="bg-muted rounded-xl p-3">
            <div className="text-lg font-bold text-foreground">{avgRating > 0 ? avgRating.toFixed(1) : "—"}</div>
            <div className="text-xs text-muted-foreground">Rating</div>
          </div>
        </div>

        {avgRating > 0 && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
            <StarRating value={avgRating} />
            <span className="text-sm text-muted-foreground">{avgRating.toFixed(1)} from {ratings.length} reviews</span>
          </div>
        )}
      </div>

      {/* Active Ads */}
      {ads.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4" />Active Offers</h3>
          <div className="space-y-2">
            {ads.map((ad) => (
              <div key={ad.id} className="flex items-center justify-between py-2 border-b border-border last:border-0 text-sm">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${ad.ad_type === "buy" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>{ad.ad_type.toUpperCase()}</span>
                  <span className="text-foreground">{ad.crypto_asset}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-foreground">{ad.price_per_unit} {ad.fiat_currency}</div>
                  <div className="text-xs text-muted-foreground">{ad.min_trade}–{ad.max_trade} {ad.fiat_currency}</div>
                </div>
                <Button size="sm" asChild className="rounded-lg h-7 px-3 text-xs" onClick={() => navigate(`/trade/new?ad=${ad.id}`)}>
                  <span>Trade</span>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><MessageSquare className="h-4 w-4" />Reviews ({ratings.length})</h3>
        {ratings.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No reviews yet</p>
        ) : (
          <div className="space-y-3">
            {ratings.map((r) => (
              <div key={r.id} className="border-b border-border last:border-0 pb-3 last:pb-0">
                <div className="flex items-center justify-between mb-1">
                  <StarRating value={r.rating} />
                  <span className={`text-xs px-2 py-0.5 rounded ${r.trade_type === "buy" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>{r.trade_type}</span>
                </div>
                {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                <p className="text-xs text-muted-foreground mt-1">{new Date(r.created_date).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}