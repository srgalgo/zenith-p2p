import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight } from "lucide-react";

const STATUS_LABELS = { pending:"Pending", escrow_held:"Escrow Held", payment_sent:"Payment Sent", payment_confirmed:"Confirmed", completed:"Completed", disputed:"Disputed", cancelled:"Cancelled", expired:"Expired" };
const STATUS_COLORS = { pending:"bg-yellow-500/10 text-yellow-500", escrow_held:"bg-blue-500/10 text-blue-500", payment_sent:"bg-orange-500/10 text-orange-500", completed:"bg-green-500/10 text-green-500", disputed:"bg-red-500/10 text-red-500", cancelled:"bg-muted text-muted-foreground", expired:"bg-muted text-muted-foreground" };

export default function MyTrades() {
  const [trades, setTrades] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("active");

  useEffect(() => {
    const load = async () => {
      const u = await base44.auth.me();
      setUser(u);
      const all = await base44.entities.Trade.list("-created_date", 100);
      setTrades(all.filter((t) => t.buyer_email === u.email || t.seller_email === u.email));
      setLoading(false);
    };
    load();
  }, []);

  const active = trades.filter((t) => ["pending","escrow_held","payment_sent","disputed"].includes(t.status));
  const completed = trades.filter((t) => ["completed","cancelled","expired"].includes(t.status));
  const display = tab === "active" ? active : completed;

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-bold text-foreground">My Trades</h1><p className="text-muted-foreground mt-1">{trades.length} total trades</p></div>
      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList className="grid w-full max-w-xs grid-cols-2 rounded-xl h-10">
          <TabsTrigger value="active" className="rounded-lg text-sm">Active ({active.length})</TabsTrigger>
          <TabsTrigger value="completed" className="rounded-lg text-sm">History ({completed.length})</TabsTrigger>
        </TabsList>
      </Tabs>
      {display.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-foreground">No trades yet</h3>
          <p className="text-muted-foreground mt-1">{tab === "active" ? "Start trading from the marketplace" : "Completed trades appear here"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {display.map((trade) => {
            const isBuyer = user?.email === trade.buyer_email;
            return (
              <Link key={trade.id} to={`/trade/${trade.id}`} className="block bg-card border border-border rounded-2xl p-4 hover:border-primary/20 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isBuyer ? "bg-green-500/10" : "bg-red-500/10"}`}>
                      <span className={`text-sm font-bold ${isBuyer ? "text-green-500" : "text-red-500"}`}>{isBuyer ? "B" : "S"}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-sm">{isBuyer ? "Buying" : "Selling"} {trade.crypto_amount} {trade.crypto_asset}</div>
                      <div className="text-xs text-muted-foreground">with {isBuyer ? trade.seller_name : trade.buyer_name}</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{trade.fiat_amount?.toLocaleString()} {trade.fiat_currency}</span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold ${STATUS_COLORS[trade.status] || "bg-muted text-muted-foreground"}`}>{STATUS_LABELS[trade.status]}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}