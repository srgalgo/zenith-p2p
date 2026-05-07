import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Gift, Copy, Users, CheckCircle } from "lucide-react";

export default function ReferralPage() {
  const [user, setUser] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputCode, setInputCode] = useState("");
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    const load = async () => {
      const u = await base44.auth.me();
      // Auto-generate referral code if not set
      if (!u.referral_code) {
        const code = "REF" + u.email.split("@")[0].toUpperCase().slice(0, 6) + Math.floor(Math.random() * 1000);
        await base44.auth.updateMe({ referral_code: code });
        u.referral_code = code;
      }
      setUser(u);
      const refs = await base44.entities.Referral.filter({ referrer_email: u.email }, "-created_date", 50);
      setReferrals(refs);
      setLoading(false);
    };
    load();
  }, []);

  const copyCode = () => {
    navigator.clipboard.writeText(user.referral_code);
    toast.success("Referral code copied!");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}?ref=${user.referral_code}`);
    toast.success("Referral link copied!");
  };

  const applyReferral = async () => {
    if (!inputCode.trim()) { toast.error("Enter a referral code"); return; }
    if (user.referred_by) { toast.error("You already used a referral code"); return; }
    if (inputCode.trim().toUpperCase() === user.referral_code) { toast.error("Cannot use your own code"); return; }
    setApplying(true);
    // Find the referrer
    const all = await base44.entities.Referral.filter({ referral_code: inputCode.trim().toUpperCase() });
    const allUsers = await base44.entities.User.list();
    const referrer = allUsers.find((u) => u.referral_code === inputCode.trim().toUpperCase());
    if (!referrer) { toast.error("Invalid referral code"); setApplying(false); return; }
    await base44.entities.Referral.create({
      referrer_email: referrer.email,
      referred_email: user.email,
      referral_code: inputCode.trim().toUpperCase(),
      status: "pending",
      bonus_paid: false,
    });
    await base44.auth.updateMe({ referred_by: inputCode.trim().toUpperCase() });
    toast.success("Referral code applied! Bonus credited after your first trade.");
    setApplying(false);
    const updated = await base44.auth.me();
    setUser(updated);
  };

  const completed = referrals.filter((r) => r.status === "completed");

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-lg mx-auto pb-20">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-3">
          <Gift className="h-3.5 w-3.5" />Referral Program
        </div>
        <h1 className="text-2xl font-bold text-foreground">Earn with Referrals</h1>
        <p className="text-muted-foreground mt-1">Invite friends and earn bonus when they complete their first trade</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-foreground">{referrals.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Total Referred</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-green-500">{completed.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Completed</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-accent">{completed.length * 5}</div>
          <div className="text-xs text-muted-foreground mt-1">USDT Earned</div>
        </div>
      </div>

      {/* Your Code */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-4">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Gift className="h-4 w-4 text-accent" />Your Referral Code</h3>
        <div className="flex gap-2 mb-3">
          <div className="flex-1 bg-muted rounded-xl px-4 py-3 font-mono font-bold text-lg text-foreground tracking-widest text-center">
            {user?.referral_code}
          </div>
          <Button onClick={copyCode} variant="outline" className="rounded-xl px-3"><Copy className="h-4 w-4" /></Button>
        </div>
        <Button onClick={copyLink} variant="outline" className="w-full rounded-xl h-10 text-sm">
          <Copy className="h-3.5 w-3.5 mr-2" />Copy Invite Link
        </Button>
        <div className="mt-3 bg-accent/10 border border-accent/20 rounded-xl p-3 text-xs text-foreground space-y-1.5">
          <div>🎁 Both you and your friend earn <strong>5 USDT</strong> after their first completed trade</div>
          <div>📋 <strong>How it works:</strong></div>
          <ul className="ml-4 space-y-1 text-muted-foreground">
            <li>• Share your code or invite link</li>
            <li>• Friend signs up and completes profile</li>
            <li>• Friend completes their first trade (min. <strong>$100 equivalent</strong>)</li>
            <li>• Both parties receive <strong>5 USDT</strong> bonus automatically</li>
            <li>• No limit — refer as many friends as you want!</li>
          </ul>
        </div>
      </div>

      {/* Apply Code */}
      {!user?.referred_by ? (
        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <h3 className="font-semibold text-foreground mb-3">Have a referral code?</h3>
          <div className="flex gap-2">
            <Input value={inputCode} onChange={(e) => setInputCode(e.target.value.toUpperCase())} placeholder="Enter code e.g. REFJOHN123" className="h-11 rounded-xl font-mono" />
            <Button onClick={applyReferral} disabled={applying} className="rounded-xl px-4 h-11">{applying ? "..." : "Apply"}</Button>
          </div>
        </div>
      ) : (
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 mb-6 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-sm text-green-500 font-medium">Referral code <strong>{user.referred_by}</strong> applied</span>
        </div>
      )}

      {/* Referral List */}
      {referrals.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Users className="h-4 w-4" />Your Referrals</h3>
          <div className="space-y-2">
            {referrals.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-border last:border-0 text-sm">
                <span className="text-foreground">{r.referred_email}</span>
                <span className={`text-xs px-2 py-0.5 rounded-lg font-semibold ${r.status === "completed" ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}