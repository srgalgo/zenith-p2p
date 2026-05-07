import { Shield, Globe, Zap, Lock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const networks = [
  { name: "USDT (TRC20)", chain: "Tron Network", fee: "~1 USDT", speed: "1–3 min", color: "text-green-400" },
  { name: "USDT (ERC20)", chain: "Ethereum", fee: "~5–15 USDT", speed: "2–10 min", color: "text-blue-400" },
  { name: "USDT (BEP20)", chain: "BSC / BNB Chain", fee: "~0.1 USDT", speed: "30 sec", color: "text-yellow-400" },
  { name: "USDC (ERC20)", chain: "Ethereum", fee: "~5–15 USDT", speed: "2–10 min", color: "text-blue-400" },
  { name: "USDC (BEP20)", chain: "BSC / BNB Chain", fee: "~0.1 USDT", speed: "30 sec", color: "text-yellow-400" },
];

export default function WalletInfo() {
  return (
    <div className="max-w-2xl mx-auto pb-20">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Wallet Platform</h1>
        <p className="text-muted-foreground mt-1">How your assets are held and secured</p>
      </div>

      {/* CCPayment Gateway */}
      <div className="bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="font-bold text-foreground text-lg">CCPayment Gateway</div>
            <div className="text-sm text-muted-foreground">Integrated payment processor</div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          CryptoP2P uses <strong className="text-foreground">CCPayment.com</strong> as the underlying payment gateway for all crypto deposits and withdrawals. CCPayment provides enterprise-grade custody, real-time settlement, and supports 900+ cryptocurrencies across 50+ blockchains.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            ["Multi-chain", "50+ blockchains supported"],
            ["Auto-Escrow", "Instant lock on trade start"],
            ["Non-custodial", "You control your funds"],
            ["Instant Release", "Auto-release on confirm"],
          ].map(([k, v]) => (
            <div key={k} className="bg-card/50 rounded-xl p-3">
              <div className="text-xs font-semibold text-primary">{k}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Escrow Explained */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary" />Auto-Escrow System
        </h2>
        <div className="space-y-3">
          {[
            { step: "1", title: "Trade Initiated", desc: "Seller's crypto is automatically locked in escrow smart contract via CCPayment" },
            { step: "2", title: "Buyer Pays", desc: "Buyer sends fiat via chosen payment method and uploads proof" },
            { step: "3", title: "Seller Confirms", desc: "Seller verifies payment and clicks confirm" },
            { step: "4", title: "Auto-Release", desc: "Escrow releases crypto instantly to buyer's wallet" },
            { step: "5", title: "Dispute Hold", desc: "If disputed, funds stay locked until admin resolves" },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">{item.step}</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">{item.title}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Networks Supported */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />Supported Networks
        </h2>
        <div className="space-y-2">
          {networks.map((n) => (
            <div key={n.name} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
              <div>
                <div className={`text-sm font-semibold ${n.color}`}>{n.name}</div>
                <div className="text-xs text-muted-foreground">{n.chain}</div>
              </div>
              <div className="text-right text-xs">
                <div className="text-foreground">Fee: {n.fee}</div>
                <div className="text-muted-foreground flex items-center gap-1 justify-end"><Zap className="h-2.5 w-2.5" />{n.speed}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-bold text-foreground mb-4">Security Measures</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2"><Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />All funds in escrow are held in CCPayment smart contracts — not controlled by the platform</li>
          <li className="flex items-start gap-2"><Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />6-digit security PIN protection for critical actions</li>
          <li className="flex items-start gap-2"><Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />KYC verification required for unlimited trading</li>
          <li className="flex items-start gap-2"><Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />3 consecutive cancellations trigger 24-hour trade restriction</li>
          <li className="flex items-start gap-2"><Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />All trade disputes reviewed by admin with evidence</li>
          <li className="flex items-start gap-2"><Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />Email notifications for all trade events</li>
        </ul>
      </div>
    </div>
  );
}