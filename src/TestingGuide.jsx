import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Copy, Users, ArrowRight, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const steps = [
  { n: "1", title: "You are User A (Admin)", desc: "You are already logged in. Complete your profile at /profile and post a sell ad at /create-ad." },
  { n: "2", title: "Invite User B", desc: "Copy the invite link below and open it in a private/incognito window or a different browser. User B will be asked to sign up." },
  { n: "3", title: "User B registers", desc: "User B signs up with a different email. The platform asks them to complete their profile." },
  { n: "4", title: "User B starts a trade", desc: "User B goes to /marketplace, finds your sell ad, and clicks Trade." },
  { n: "5", title: "Complete the trade", desc: "User A (seller) sees the trade in /my-trades. User B submits payment proof. User A confirms → trade completes." },
  { n: "6", title: "Check disputes", desc: "Either party can raise a dispute. Admin can resolve it at /admin under the Disputes tab." },
];

export default function TestingGuide() {
  const [inviteLink, setInviteLink] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setInviteLink(window.location.origin);
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success("Invite link copied!");
  };

  const sendInvite = async () => {
    if (!inviteEmail.trim()) { toast.error("Enter email"); return; }
    setSending(true);
    try {
      await base44.users.inviteUser(inviteEmail.trim(), "user");
      toast.success(`Invite sent to ${inviteEmail}!`);
      setInviteEmail("");
    } catch (e) {
      toast.error("Failed to send invite. Check the email.");
    }
    setSending(false);
  };

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-3">
          <Users className="h-3.5 w-3.5" />Testing Guide
        </div>
        <h1 className="text-2xl font-bold text-foreground">How to Test with Multiple Users</h1>
        <p className="text-muted-foreground mt-1">Follow these steps to simulate a full P2P trade with two accounts</p>
      </div>

      {/* Invite Section */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 mb-8">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Users className="h-4 w-4" />Invite a Test User</h3>
        <p className="text-sm text-muted-foreground mb-4">Send a direct invite by email — the user will receive a signup link to join this app.</p>
        <div className="flex gap-2 mb-4">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="friend@example.com"
            className="flex-1 h-10 rounded-xl border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <Button onClick={sendInvite} disabled={sending} className="rounded-xl h-10 px-4">
            {sending ? "Sending..." : "Send Invite"}
          </Button>
        </div>
        <div className="border-t border-border pt-3">
          <p className="text-xs text-muted-foreground mb-2">Or share the platform URL directly (works if user opens in different browser/incognito):</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-xl px-3 py-2 font-mono text-xs text-muted-foreground truncate">{inviteLink}</div>
            <Button variant="outline" size="sm" onClick={copyLink} className="rounded-xl"><Copy className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((s) => (
          <div key={s.n} className="bg-card border border-border rounded-2xl p-5 flex gap-4">
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary">{s.n}</span>
            </div>
            <div>
              <div className="font-semibold text-foreground text-sm">{s.title}</div>
              <p className="text-sm text-muted-foreground mt-0.5">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex items-start gap-3">
        <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-foreground">
          <strong>Note:</strong> The invite system sends a real email via the platform. If the user already has an account, it will say "already registered". Use a unique email for testing.
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <Button asChild className="rounded-xl"><Link to="/create-ad">Post a Test Ad <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        <Button asChild variant="outline" className="rounded-xl"><Link to="/admin">Admin Panel</Link></Button>
      </div>
    </div>
  );
}