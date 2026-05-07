import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Shield, HelpCircle, Terminal, BookOpen, AlertTriangle, DollarSign, Lock, MessageSquare } from "lucide-react";

const FAQS = {
  general: [
    { q:"What is CryptoP2P?", a:"A peer-to-peer platform to buy/sell USDT and USDC directly with other users. All trades are protected by automatic escrow." },
    { q:"How do I get started?", a:"1. Complete profile (name, phone, country)\n2. Add payment methods\n3. Deposit crypto to your wallet\n4. Browse marketplace or post an ad\n5. Start trading!" },
    { q:"Which countries are supported?", a:"100+ countries. Indian users get UPI/IMPS/bank transfer. International users get PayPal/Wise/Revolut/SEPA and more." },
  ],
  trading: [
    { q:"How does escrow work?", a:"When a trade starts, seller's crypto is locked automatically. Buyer pays fiat and uploads proof. Seller confirms, crypto releases to buyer. Both parties are protected." },
    { q:"What is the 60-minute window?", a:"Each trade has 60 minutes from start to complete payment. If the timer expires, the trade can be cancelled and escrow refunded to the seller." },
    { q:"Can I trade with my own ad?", a:"No. You need another user to act as counterparty." },
  ],
  payment: [
    { q:"Payment methods for Indian users?", a:"UPI, IMPS, Bank Transfer, Cash Deposit, Paytm, PhonePe, Google Pay." },
    { q:"Payment methods for international users?", a:"PayPal, Wise, Revolut, Skrill, Zelle, Venmo, SEPA, PIX, GCash, Bank Transfer." },
    { q:"What payment proof is required?", a:"Transaction ID, Reference ID, Amount, Date and Time, Sender name, Sender account/UPI ID, and a screenshot." },
  ],
  fees: [
    { q:"How much does the platform charge?", a:"0.5% fee from both buyer and seller per trade. E.g. trading 100 USDT costs 0.5 USDT fee." },
    { q:"When are fees deducted?", a:"Fees are calculated at trade initiation and shown in the fee breakdown before you confirm." },
  ],
  security: [
    { q:"Is my crypto safe?", a:"Yes. Automatic escrow holds crypto until payment is confirmed. No party can bypass the escrow process." },
    { q:"What if the buyer does not pay?", a:"Cancel the trade after the 60-minute window expires. Escrow is refunded to your wallet." },
    { q:"What if there is a dispute?", a:"Either party can raise a dispute. Admin reviews evidence and resolves fairly." },
  ],
  disputes: [
    { q:"How to raise a dispute?", a:"On the trade page, click Raise Dispute. Admin will review and resolve within 24-48 hours." },
    { q:"What happens after resolution?", a:"Buyer's favor: crypto released to buyer. Seller's favor: crypto refunded to seller." },
  ],
  commands: [
    { q:"Platform Actions", a:"Browse Marketplace — find ads\nPost Ad — create buy/sell offer\nStart Trade — initiate from an ad\nUpload Proof — submit payment screenshot + details\nConfirm Payment — seller releases crypto\nRaise Dispute — admin intervention\nCancel Trade — before payment\nDeposit — add crypto to wallet\nAdd Payment Method — manage payout options" },
    { q:"Trade Flow", a:"1. Buyer selects ad - trade created, escrow locked\n2. Buyer pays fiat via chosen method\n3. Buyer uploads proof (TXN ID, ref, amount, date, time, sender)\n4. Seller verifies proof details\n5. Seller clicks Confirm - crypto auto-released\n6. Trade marked Complete" },
  ],
};

const ICONS = { general:BookOpen, trading:Shield, payment:DollarSign, fees:DollarSign, security:Lock, disputes:AlertTriangle, commands:Terminal };
const LABELS = { general:"General", trading:"Trading", payment:"Payments", fees:"Fees", security:"Security", disputes:"Disputes", commands:"Commands" };

export default function Help() {
  const [tab, setTab] = useState("general");
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"><HelpCircle className="h-3.5 w-3.5" />Help Center</div>
        <h1 className="text-3xl font-bold text-foreground">Help &amp; FAQ</h1>
        <p className="text-muted-foreground mt-2">Everything you need to know about CryptoP2P</p>
      </div>
      <div className="bg-card border border-border rounded-2xl p-6 mb-8">
        <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />About CryptoP2P</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">Secure peer-to-peer USDT/USDC trading platform with automatic escrow, 100+ payment methods, and a 60-minute trade window for safe global transactions.</p>
        <div className="mt-4 grid grid-cols-4 gap-3">
          {[["Assets","USDT/USDC"],["Escrow","Automatic"],["Window","60 minutes"],["Fee","0.5% each"]].map(([l,v]) => (
            <div key={l} className="bg-muted rounded-xl p-3 text-center"><div className="text-xs text-muted-foreground">{l}</div><div className="font-semibold text-foreground text-sm mt-0.5">{v}</div></div>
          ))}
        </div>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0 mb-6">
          {Object.keys(FAQS).map((key) => { const Icon = ICONS[key]; return (
            <TabsTrigger key={key} value={key} className="rounded-xl px-3 py-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Icon className="h-3.5 w-3.5 mr-1.5" />{LABELS[key]}
            </TabsTrigger>
          );})}
        </TabsList>
        {Object.entries(FAQS).map(([key, items]) => (
          <TabsContent key={key} value={key}>
            <Accordion type="single" collapsible className="space-y-2">
              {items.map((item, i) => (
                <AccordionItem key={i} value={`${key}-${i}`} className="bg-card border border-border rounded-2xl px-5 data-[state=open]:border-primary/20">
                  <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline py-4">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed pb-4">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>
        ))}
      </Tabs>
      <div className="mt-8 bg-gradient-to-r from-primary/5 to-accent/5 border border-border rounded-2xl p-6 text-center">
        <MessageSquare className="h-8 w-8 text-primary mx-auto mb-3" />
        <h3 className="font-semibold text-foreground">Need More Help?</h3>
        <p className="text-sm text-muted-foreground mt-1">Use the dispute system during any active trade to contact support</p>
      </div>
    </div>
  );
}