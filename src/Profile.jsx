import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { User, Phone, Globe, Shield, Check, Upload, Clock, XCircle, FileText } from "lucide-react";

const COUNTRIES = ["India","United States","United Kingdom","Canada","Australia","Germany","France","Brazil","Nigeria","Philippines","Indonesia","Turkey","Vietnam","Thailand","Malaysia","Pakistan","Bangladesh","Kenya","South Africa","UAE","Saudi Arabia","Japan","South Korea","Singapore","Mexico"];

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ display_name:"", phone:"", country:"" });
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      setForm({ display_name: u.display_name || u.full_name || "", phone: u.phone || "", country: u.country || "" });
      setLoading(false);
    });
  }, []);

  const [kycUploading, setKycUploading] = useState(false);

  const handleKycUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setKycUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.auth.updateMe({ kyc_document_url: file_url, kyc_status: "pending" });
    toast.success("ID document uploaded! Awaiting admin review.");
    setKycUploading(false);
    const updated = await base44.auth.me();
    setUser(updated);
  };

  const handleSave = async () => {
    if (!form.display_name || !form.phone || !form.country) { toast.error("All fields are required"); return; }
    if (!user?.terms_accepted && !termsAccepted) { toast.error("Please accept the Terms of Service"); return; }
    setSaving(true);
    await base44.auth.updateMe({ ...form, is_profile_complete: true, terms_accepted: true });
    const wallets = await base44.entities.Wallet.filter({ user_email: user.email });
    if (wallets.length === 0) {
      await base44.entities.Wallet.create({ user_email: user.email, usdt_balance: 0, usdc_balance: 0, usdt_held: 0, usdc_held: 0, total_trades: 0, total_volume: 0 });
    }
    toast.success("Profile updated!");
    setSaving(false);
    const updated = await base44.auth.me();
    setUser(updated);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8"><h1 className="text-2xl font-bold text-foreground">Profile Settings</h1><p className="text-muted-foreground mt-1">Complete your profile to start trading</p></div>
      {!user?.is_profile_complete && (
        <div className="bg-accent/10 border border-accent/20 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <Shield className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
          <div><div className="font-semibold text-foreground text-sm">Complete Registration Required</div><p className="text-xs text-muted-foreground mt-1">Provide display name, phone, and country to start trading.</p></div>
        </div>
      )}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-4 pb-5 border-b border-border">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center"><User className="h-8 w-8 text-primary" /></div>
          <div>
            <div className="font-semibold text-foreground">{user?.full_name}</div>
            <div className="text-sm text-muted-foreground">{user?.email}</div>
            {user?.is_profile_complete && <span className="inline-flex items-center gap-1 text-xs text-primary mt-1"><Check className="h-3 w-3" />Verified</span>}
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">Display Name *</Label>
          <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input value={form.display_name} onChange={(e) => setForm({...form,display_name:e.target.value})} placeholder="Trading display name" className="pl-10 h-11 rounded-xl" /></div>
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">Phone Number *</Label>
          <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input value={form.phone} onChange={(e) => setForm({...form,phone:e.target.value})} placeholder="+91 9876543210" className="pl-10 h-11 rounded-xl" /></div>
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">Country *</Label>
          <Select value={form.country} onValueChange={(v) => setForm({...form,country:v})}>
            <SelectTrigger className="h-11 rounded-xl text-foreground"><div className="flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground" /><SelectValue placeholder="Select country" /></div></SelectTrigger>
            <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {!user?.terms_accepted && (
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-1 accent-primary" />
            <span className="text-xs text-muted-foreground">I agree to the <a href="/terms" target="_blank" className="text-primary underline">Terms of Service</a> and confirm I am of legal age in my country to use this platform.</span>
          </label>
        )}
        <Button onClick={handleSave} disabled={saving} className="w-full h-11 rounded-xl font-semibold">{saving ? "Saving..." : "Save Profile"}</Button>
      </div>
      {/* KYC Section */}
      <div className="mt-6 bg-card border border-border rounded-2xl p-6">
        <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />Identity Verification (KYC)
        </h3>
        <p className="text-xs text-muted-foreground mb-4">Upload a government-issued ID or passport to post ads</p>

        {user?.kyc_status === "verified" && (
          <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl p-3">
            <Check className="h-5 w-5 text-green-500" />
            <div><div className="text-sm font-semibold text-green-500">KYC Verified</div><div className="text-xs text-muted-foreground">You can post ads and trade freely</div></div>
          </div>
        )}
        {user?.kyc_status === "pending" && (
          <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
            <Clock className="h-5 w-5 text-yellow-500" />
            <div><div className="text-sm font-semibold text-yellow-500">Under Review</div><div className="text-xs text-muted-foreground">Admin is reviewing your document</div></div>
          </div>
        )}
        {user?.kyc_status === "rejected" && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-3">
            <XCircle className="h-5 w-5 text-red-500" />
            <div><div className="text-sm font-semibold text-red-500">KYC Rejected</div><div className="text-xs text-muted-foreground">Please resubmit a clear photo of your ID</div></div>
          </div>
        )}
        {(!user?.kyc_status || user?.kyc_status === "rejected") && (
          <label className="flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-dashed border-primary/30 text-primary cursor-pointer hover:bg-primary/5 transition-all mt-3">
            <Upload className="h-4 w-4" />
            <span className="text-sm font-medium">{kycUploading ? "Uploading..." : "Upload ID / Passport"}</span>
            <input type="file" accept="image/*,application/pdf" onChange={handleKycUpload} className="hidden" disabled={kycUploading} />
          </label>
        )}
        {user?.kyc_document_url && user?.kyc_status !== "rejected" && (
          <div className="mt-3">
            <img src={user.kyc_document_url} alt="KYC Document" className="w-full rounded-xl border border-border max-h-48 object-cover" />
          </div>
        )}
      </div>

      {user?.is_profile_complete && (
        <div className="mt-6 bg-card border border-border rounded-2xl p-6">
          <h3 className="font-semibold text-foreground mb-4">Trading Stats</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><div className="text-xl font-bold text-foreground">{user.total_trades||0}</div><div className="text-xs text-muted-foreground">Total Trades</div></div>
            <div><div className="text-xl font-bold text-foreground">{user.completion_rate||0}%</div><div className="text-xs text-muted-foreground">Completion</div></div>
            <div><div className="text-xl font-bold text-foreground">{user.avg_release_time||0}m</div><div className="text-xs text-muted-foreground">Avg Release</div></div>
          </div>
        </div>
      )}
    </div>
  );
}