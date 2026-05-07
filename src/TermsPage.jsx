import { Shield, FileText, AlertTriangle, Users, Lock, Globe } from "lucide-react";

const SECTIONS = [
  {
    icon: FileText,
    title: "1. Acceptance of Terms",
    content: `By accessing or using CryptoP2P, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform. We reserve the right to update these terms at any time, and continued use constitutes acceptance of revised terms.`,
  },
  {
    icon: Users,
    title: "2. P2P Nature of the Platform",
    content: `CryptoP2P is a peer-to-peer marketplace software. We do NOT act as a broker, financial institution, payment processor, or exchange. All trades are between users directly. The platform provides escrow tooling and dispute resolution as a service provider only. We do not hold, transmit, or control user fiat funds at any time.`,
  },
  {
    icon: Shield,
    title: "3. Escrow & Crypto Custody",
    content: `When a trade is initiated, the seller's crypto is locked in an on-platform escrow wallet. Funds are released to the buyer only after the seller confirms receipt of fiat payment. In dispute cases, an admin reviews evidence and determines resolution. The platform is not liable for incorrect payment proof submissions or fraudulent claims.`,
  },
  {
    icon: AlertTriangle,
    title: "4. Prohibited Activities",
    content: `Users must not: (a) engage in money laundering or terrorist financing, (b) use stolen payment accounts, (c) manipulate trade ratings or reviews, (d) create multiple accounts to circumvent restrictions, (e) attempt to hack, scrape, or reverse-engineer the platform, (f) threaten or harass other users. Violations result in permanent ban and reporting to relevant authorities.`,
  },
  {
    icon: Lock,
    title: "5. KYC & Identity Verification",
    content: `Users trading above $50,000 USD equivalent must complete KYC verification by submitting a government-issued ID. The platform may request additional verification at any time. KYC data is stored securely and is not shared with third parties except as required by law. Submitting false identity documents is a criminal offense.`,
  },
  {
    icon: Globe,
    title: "6. Fees",
    content: `The platform charges a 0.5% fee on each side of a completed trade (1% total). Fees are deducted from the crypto amount at time of trade. No refund of fees for cancelled or disputed trades. The platform reserves the right to update fee structures with 14-day notice.`,
  },
  {
    icon: AlertTriangle,
    title: "7. Disputes & Resolution",
    content: `Either party may raise a dispute within the trade window. An admin will review submitted evidence (payment screenshots, chat logs, transaction IDs) and make a final binding decision. The platform's dispute resolution is final. Users agree not to pursue chargebacks through payment providers while a dispute is under review.`,
  },
  {
    icon: Shield,
    title: "8. Limitation of Liability",
    content: `CryptoP2P is provided "as is" without warranty. We are not liable for: losses due to user error, market volatility, payment failures, blockchain network issues, or force majeure events. Maximum liability in any case is limited to the fees paid by the user in the 30 days prior to the claim.`,
  },
  {
    icon: Lock,
    title: "9. Privacy Policy",
    content: `We collect email, name, phone, country, and trade activity data to operate the platform. We use industry-standard encryption for data storage. We do not sell user data. We may share data with law enforcement when legally required. You have the right to request deletion of your account data by contacting support.`,
  },
  {
    icon: FileText,
    title: "10. Governing Law",
    content: `These terms are governed by the laws of India. Any disputes arising from use of the platform shall be subject to the exclusive jurisdiction of courts in India. Users outside India access the platform voluntarily and are responsible for compliance with their local laws regarding cryptocurrency trading.`,
  },
];

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto pb-20">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
          <FileText className="h-3.5 w-3.5" />Legal
        </div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Terms of Service</h1>
        <p className="text-muted-foreground mt-2">Last updated: May 2026 · Please read carefully before using CryptoP2P</p>
      </div>

      <div className="bg-accent/10 border border-accent/20 rounded-2xl p-4 mb-8">
        <p className="text-sm text-foreground"><strong>Summary:</strong> CryptoP2P is a P2P software platform — not a bank or exchange. You trade directly with other users. We provide escrow protection and dispute resolution. Never share your PIN or payment details with anyone.</p>
      </div>

      <div className="space-y-4">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary flex-shrink-0" />{s.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.content}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-card border border-border rounded-2xl p-5 text-center">
        <p className="text-sm text-muted-foreground">Questions about these terms? Contact us at <span className="text-primary font-medium">support@cryptop2p.com</span></p>
      </div>
    </div>
  );
}