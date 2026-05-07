import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowUpRight, ArrowDownLeft, TrendingUp } from "lucide-react";

const STATUS_COLORS = { completed:"bg-green-500/10 text-green-500", cancelled:"bg-muted text-muted-foreground", disputed:"bg-red-500/10 text-red-500", expired:"bg-muted text-muted-foreground" };

export default function TransactionHistory() {
  const [trades, setTrades] = useState([]);
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const u = await base44.auth.me();
      setUser(u);
      const all = await base44.entities.Trade.list("-created_date", 200);
      setTrades(all.filter((t) => t.buyer_email === u.email || t.seller_email === u.email));
      const wallets = await base44.entities.Wallet.filter({ user_email: u.email });
      if (wallets.length > 0) setWallet(wallets[0]);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  const completedTrades = trades.filter((t) => t.status === "completed");
  const totalBought = completedTrades.filter((t) => t.buyer_email === user?.email).reduce((s, t) => s + (t.crypto_amount || 0), 0);
  const totalSold = completedTrades.filter((t) => t.seller_email === user?.email).reduce((s, t) => s + (t.crypto_amount || 0), 0);

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <div className="mb-6"><h1 className="text-2xl font-bold text-foreground">Transaction History</h1><p className="text-muted-foreground mt-1">Your complete trading record</p></div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <div className="text-xl font-bold text-green-500">{totalBought.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground mt-1">Total Bought</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <div className="text-xl font-bold text-red-500">{totalSold.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground mt-1">Total Sold</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <div className="text-xl font-bold text-foreground">{completedTrades.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Completed</div>
        </div>
      </div>

      {/* Wallet Balances */}
      {wallet && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />Wallet Overview</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[["USDT Available", wallet.usdt_balance?.toFixed(2)], ["USDC Available", wallet.usdc_balance?.toFixed(2)], ["USDT in Escrow", wallet.usdt_held?.toFixed(2)], ["USDC in Escrow", wallet.usdc_held?.toFixed(2)]].map(([k,v]) => (
              <div key={k} className="flex justify-between py-1.5 border-b border-border last:border-0">
                <span className="text-muted-foreground">{k}</span><span className="font-semibold text-foreground">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trade List */}
      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-3 rounded-xl h-10 mb-4">
          <TabsTrigger value="all" className="rounded-lg text-xs">All ({trades.length})</TabsTrigger>
          <TabsTrigger value="buy" className="rounded-lg text-xs">Bought</TabsTrigger>
          <TabsTrigger value="sell" className="rounded-lg text-xs">Sold</TabsTrigger>
        </TabsList>
        {[["all", trades], ["buy", trades.filter((t) => t.buyer_email === user?.email)], ["sell", trades.filter((t) => t.seller_email === user?.email)]].map(([val, list]) => (
          <TabsContent key={val} value={val}>
            <div className="space-y-2">
              {list.map((t) => {
                const isBuyer = t.buyer_email === user?.email;
                return (
                  <div key={t.id} className="bg-card border border-border rounded-xl p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${isBuyer ? "bg-green-500/10" : "bg-red-500/10"}`}>
                        {isBuyer ? <ArrowDownLeft className="h-4 w-4 text-green-500" /> : <ArrowUpRight className="h-4 w-4 text-red-500" />}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{isBuyer ? "Bought" : "Sold"} {t.crypto_amount} {t.crypto_asset}</div>
                        <div className="text-xs text-muted-foreground">{new Date(t.created_date).toLocaleDateString()} · {isBuyer ? t.seller_name : t.buyer_name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-foreground">{t.fiat_amount?.toLocaleString()} {t.fiat_currency}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-lg ${STATUS_COLORS[t.status] || "bg-muted text-muted-foreground"}`}>{t.status}</span>
                    </div>
                  </div>
                );
              })}
              {list.length === 0 && <div className="text-center py-10 text-muted-foreground">No transactions found</div>}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}