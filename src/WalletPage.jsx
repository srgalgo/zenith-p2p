import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Wallet, Lock, ArrowDownRight, ArrowUpRight, Clock, CheckCircle, XCircle, Copy, QrCode, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const NETWORKS = ["TRC20", "ERC20", "BEP20"];

export default function WalletPage() {
  const [wallet, setWallet] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [depositAsset, setDepositAsset] = useState("USDT");
  const [depositNetwork, setDepositNetwork] = useState("TRC20");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositTxnHash, setDepositTxnHash] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAsset, setWithdrawAsset] = useState("USDT");
  const [withdrawNetwork, setWithdrawNetwork] = useState("TRC20");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState("deposit");
  const [platformAddresses, setPlatformAddresses] = useState({});

  const loadWallet = async () => {
    const u = await base44.auth.me();
    setUser(u);
    const [wallets, txns, settings] = await Promise.all([
      base44.entities.Wallet.filter({ user_email: u.email }),
      base44.entities.Transaction.filter({ user_email: u.email }, "-created_date", 50),
      base44.entities.PlatformSettings.list(),
    ]);
    if (wallets.length > 0) setWallet(wallets[0]);
    setTransactions(txns);
    const addrMap = {};
    settings.forEach((s) => { addrMap[s.key] = s.value; });
    setPlatformAddresses(addrMap);
    setLoading(false);
  };

  useEffect(() => { loadWallet(); }, []);

  const getDepositAddress = () => {
    const key = `deposit_${depositAsset}_${depositNetwork}`;
    return platformAddresses[key] || null;
  };

  const handleDeposit = async () => {
    if (!depositAmount || Number(depositAmount) <= 0) { toast.error("Enter valid amount"); return; }
    if (!depositTxnHash.trim()) { toast.error("Enter transaction hash / TXN ID"); return; }
    const addr = getDepositAddress();
    if (!addr) { toast.error("No deposit address configured for this network. Contact support."); return; }
    const key = depositAsset === "USDT" ? "usdt_balance" : "usdc_balance";
    await Promise.all([
      base44.entities.Wallet.update(wallet.id, { [key]: (wallet[key] || 0) + Number(depositAmount) }),
      base44.entities.Transaction.create({
        user_email: user.email, type: "deposit", asset: depositAsset,
        amount: Number(depositAmount), network: depositNetwork,
        txn_hash: depositTxnHash.trim(), status: "completed",
      }),
    ]);
    toast.success(`${depositAmount} ${depositAsset} deposited!`);
    setDepositAmount(""); setDepositTxnHash(""); loadWallet();
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || Number(withdrawAmount) <= 0) { toast.error("Enter valid amount"); return; }
    if (!withdrawAddress.trim()) { toast.error("Enter destination wallet address"); return; }
    const key = withdrawAsset === "USDT" ? "usdt_balance" : "usdc_balance";
    if ((wallet[key] || 0) < Number(withdrawAmount)) { toast.error("Insufficient balance"); return; }
    await Promise.all([
      base44.entities.Wallet.update(wallet.id, { [key]: (wallet[key] || 0) - Number(withdrawAmount) }),
      base44.entities.Transaction.create({
        user_email: user.email, type: "withdrawal", asset: withdrawAsset,
        amount: Number(withdrawAmount), network: withdrawNetwork,
        wallet_address: withdrawAddress.trim(), status: "pending",
      }),
    ]);
    toast.success(`Withdrawal submitted! Processing shortly.`);
    setWithdrawAmount(""); setWithdrawAddress(""); loadWallet();
  };

  const copyAddress = (addr) => {
    navigator.clipboard.writeText(addr);
    toast.success("Address copied!");
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  if (!wallet) return (
    <div className="text-center py-20">
      <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-foreground">No Wallet Found</h3>
      <p className="text-muted-foreground mt-1">Complete your profile to create a wallet</p>
    </div>
  );

  const depositAddr = getDepositAddress();

  return (
    <div className="max-w-lg mx-auto pb-20">
      <div className="mb-6"><h1 className="text-2xl font-bold text-foreground">Wallet</h1><p className="text-muted-foreground mt-1">Manage your crypto assets</p></div>

      {/* Balances */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[{ asset: "USDT", balance: wallet.usdt_balance, held: wallet.usdt_held }, { asset: "USDC", balance: wallet.usdc_balance, held: wallet.usdc_held }].map(({ asset, balance, held }) => (
          <div key={asset} className="bg-card border border-border rounded-2xl p-5">
            <div className="text-sm text-muted-foreground mb-1">{asset} Balance</div>
            <div className="text-2xl font-bold text-foreground">{(balance || 0).toFixed(2)}</div>
            {held > 0 && <div className="flex items-center gap-1 text-xs text-orange-400 mt-1"><Lock className="h-3 w-3" />{held.toFixed(2)} in escrow</div>}
          </div>
        ))}
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-5">
        {[["deposit","Deposit"],["withdraw","Withdraw"],["history","History"]].map(([v,l]) => (
          <button key={v} onClick={() => setActiveTab(v)}
            className={`flex-1 h-10 rounded-xl text-sm font-semibold border-2 transition-all ${activeTab === v ? "border-primary bg-primary/10 text-primary" : "border-slate-600 text-slate-300 hover:text-white"}`}>{l}</button>
        ))}
      </div>

      {/* DEPOSIT */}
      {activeTab === "deposit" && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2"><ArrowDownRight className="h-4 w-4 text-green-400" />Deposit Crypto</h3>

          {/* Asset */}
          <div className="grid grid-cols-2 gap-3">
            {["USDT","USDC"].map((a) => (
              <button key={a} onClick={() => setDepositAsset(a)}
                className={`h-10 rounded-xl font-semibold text-sm border-2 transition-all ${depositAsset === a ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{a}</button>
            ))}
          </div>

          {/* Network */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Network</Label>
            <Select value={depositNetwork} onValueChange={setDepositNetwork}>
              <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TRC20">TRC20 (Tron) — Low Fee ~1 USDT</SelectItem>
                <SelectItem value="ERC20">ERC20 (Ethereum) — Higher Fee</SelectItem>
                <SelectItem value="BEP20">BEP20 (BSC) — Very Low Fee</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Deposit Address Box */}
          {depositAddr ? (
            <div className="bg-muted/50 border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <QrCode className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Send {depositAsset} to this address</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="font-mono text-xs text-muted-foreground bg-background rounded-xl px-3 py-2.5 flex-1 break-all">{depositAddr}</div>
                <Button size="sm" variant="outline" onClick={() => copyAddress(depositAddr)} className="rounded-xl h-9 px-3 flex-shrink-0"><Copy className="h-3.5 w-3.5" /></Button>
              </div>
              <div className="mt-3 text-xs text-muted-foreground space-y-1">
                <div className="flex items-start gap-1"><AlertCircle className="h-3 w-3 mt-0.5 text-yellow-400 flex-shrink-0" />Only send <strong>{depositAsset}</strong> on <strong>{depositNetwork}</strong> network to this address</div>
                <div className="flex items-start gap-1"><AlertCircle className="h-3 w-3 mt-0.5 text-yellow-400 flex-shrink-0" />Sending other assets will result in permanent loss</div>
              </div>
            </div>
          ) : (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400">
              ⚠ Deposit address for {depositAsset} {depositNetwork} not configured yet. Please contact support.
            </div>
          )}

          {/* Confirm Deposit */}
          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-xs text-muted-foreground">After sending, enter the amount and transaction hash below to confirm your deposit:</p>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Amount Sent</Label>
              <Input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="e.g. 100" className="h-10 rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Transaction Hash (TXN ID) *</Label>
              <Input value={depositTxnHash} onChange={(e) => setDepositTxnHash(e.target.value)} placeholder="Paste blockchain TXN hash" className="h-10 rounded-xl font-mono text-xs" />
            </div>
            <Button onClick={handleDeposit} disabled={!depositAddr} className="w-full h-11 rounded-xl font-semibold">
              <ArrowDownRight className="h-4 w-4 mr-2" />Confirm Deposit
            </Button>
          </div>
        </div>
      )}

      {/* WITHDRAW */}
      {activeTab === "withdraw" && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2"><ArrowUpRight className="h-4 w-4 text-orange-400" />Withdraw Crypto</h3>
          <div className="grid grid-cols-2 gap-3">
            {["USDT","USDC"].map((a) => (
              <button key={a} onClick={() => setWithdrawAsset(a)}
                className={`h-10 rounded-xl font-semibold text-sm border-2 transition-all ${withdrawAsset === a ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{a}</button>
            ))}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Network</Label>
            <Select value={withdrawNetwork} onValueChange={setWithdrawNetwork}>
              <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TRC20">TRC20 (Tron)</SelectItem>
                <SelectItem value="ERC20">ERC20 (Ethereum)</SelectItem>
                <SelectItem value="BEP20">BEP20 (BSC)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Amount ({withdrawAsset})</Label>
            <Input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="Enter amount" className="h-10 rounded-xl" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Destination {withdrawAsset} Address ({withdrawNetwork})</Label>
            <Input value={withdrawAddress} onChange={(e) => setWithdrawAddress(e.target.value)} placeholder="Paste your external wallet address" className="h-10 rounded-xl font-mono text-xs" />
          </div>
          <div className="text-xs text-muted-foreground bg-muted/50 rounded-xl p-3">
            Available: <strong className="text-foreground">{((withdrawAsset === "USDT" ? wallet.usdt_balance : wallet.usdc_balance) || 0).toFixed(2)} {withdrawAsset}</strong>
          </div>
          <Button onClick={handleWithdraw} className="w-full h-11 rounded-xl font-semibold bg-orange-500 hover:bg-orange-600">
            <ArrowUpRight className="h-4 w-4 mr-2" />Submit Withdrawal
          </Button>
        </div>
      )}

      {/* HISTORY */}
      {activeTab === "history" && (
        <div className="space-y-2">
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No transactions yet</div>
          ) : transactions.map((txn) => {
            const isDeposit = txn.type === "deposit";
            return (
              <div key={txn.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${isDeposit ? "bg-green-500/10" : "bg-orange-500/10"}`}>
                    {isDeposit ? <ArrowDownRight className="h-4 w-4 text-green-400" /> : <ArrowUpRight className="h-4 w-4 text-orange-400" />}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground capitalize">{txn.type} {txn.asset}</div>
                    <div className="text-xs text-muted-foreground">{txn.network} · {new Date(txn.created_date).toLocaleDateString()}</div>
                    {txn.txn_hash && <div className="text-xs text-muted-foreground font-mono truncate max-w-[140px]">{txn.txn_hash}</div>}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${isDeposit ? "text-green-400" : "text-orange-400"}`}>{isDeposit ? "+" : "-"}{txn.amount} {txn.asset}</div>
                  <div className="flex items-center gap-1 justify-end mt-0.5">
                    {txn.status === "completed" ? <CheckCircle className="h-3 w-3 text-green-400" /> : txn.status === "pending" ? <Clock className="h-3 w-3 text-yellow-400" /> : <XCircle className="h-3 w-3 text-red-400" />}
                    <span className="text-xs text-muted-foreground capitalize">{txn.status}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}