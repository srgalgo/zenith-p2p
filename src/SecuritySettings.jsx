import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, Shield, Eye, EyeOff, Check } from "lucide-react";

export default function SecuritySettings() {
  const [user, setUser] = useState(null);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then((u) => { setUser(u); setLoading(false); });
  }, []);

  const handleSetPin = async () => {
    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) { toast.error("PIN must be exactly 6 digits"); return; }
    if (pin !== confirmPin) { toast.error("PINs do not match"); return; }
    if (user.security_pin && currentPin !== user.security_pin) { toast.error("Current PIN is incorrect"); return; }
    setSaving(true);
    await base44.auth.updateMe({ security_pin: pin, pin_enabled: true });
    toast.success("Security PIN set successfully!");
    setSaving(false);
    setPin(""); setConfirmPin(""); setCurrentPin("");
    const updated = await base44.auth.me();
    setUser(updated);
  };

  const handleDisablePin = async () => {
    if (currentPin !== user.security_pin) { toast.error("Current PIN is incorrect"); return; }
    await base44.auth.updateMe({ security_pin: null, pin_enabled: false });
    toast.success("Security PIN disabled");
    setCurrentPin("");
    const updated = await base44.auth.me();
    setUser(updated);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-lg mx-auto pb-20">
      <div className="mb-6"><h1 className="text-2xl font-bold text-foreground">Security Settings</h1><p className="text-muted-foreground mt-1">Protect your account with a 6-digit PIN</p></div>

      {/* PIN Status */}
      <div className={`flex items-center gap-3 rounded-2xl p-4 mb-6 border ${user?.pin_enabled ? "bg-green-500/10 border-green-500/20" : "bg-muted/50 border-border"}`}>
        <Shield className={`h-5 w-5 ${user?.pin_enabled ? "text-green-500" : "text-muted-foreground"}`} />
        <div>
          <div className={`text-sm font-semibold ${user?.pin_enabled ? "text-green-500" : "text-foreground"}`}>
            {user?.pin_enabled ? "Security PIN Active" : "No PIN Set"}
          </div>
          <div className="text-xs text-muted-foreground">{user?.pin_enabled ? "Your account is protected with a PIN" : "Set a 6-digit PIN to secure your account"}</div>
        </div>
        {user?.pin_enabled && <Check className="h-4 w-4 text-green-500 ml-auto" />}
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        {user?.pin_enabled && (
          <div className="space-y-2">
            <Label className="text-foreground">Current PIN *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type={showPin ? "text" : "password"} value={currentPin} onChange={(e) => setCurrentPin(e.target.value.slice(0,6))} placeholder="Enter current PIN" maxLength={6} className="pl-10 h-11 rounded-xl font-mono tracking-widest" />
            </div>
          </div>
        )}
        <div className="space-y-2">
          <Label className="text-foreground">{user?.pin_enabled ? "New PIN" : "Set PIN"} (6 digits) *</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input type={showPin ? "text" : "password"} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="●●●●●●" maxLength={6} className="pl-10 pr-10 h-11 rounded-xl font-mono tracking-widest text-xl" />
            <button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex gap-1 mt-1">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${pin.length >= i ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">Confirm PIN *</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input type={showPin ? "text" : "password"} value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="●●●●●●" maxLength={6} className="pl-10 h-11 rounded-xl font-mono tracking-widest text-xl" />
          </div>
          {pin && confirmPin && <p className={`text-xs ${pin === confirmPin ? "text-green-500" : "text-red-500"}`}>{pin === confirmPin ? "✓ PINs match" : "PINs do not match"}</p>}
        </div>
        <Button onClick={handleSetPin} disabled={saving} className="w-full h-11 rounded-xl font-semibold">
          {saving ? "Saving..." : user?.pin_enabled ? "Update PIN" : "Set Security PIN"}
        </Button>
        {user?.pin_enabled && (
          <Button variant="outline" onClick={handleDisablePin} className="w-full h-10 rounded-xl text-destructive border-destructive/30 hover:bg-destructive/5 text-sm">
            Disable PIN
          </Button>
        )}
      </div>

      <div className="mt-6 bg-muted/50 border border-border rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-2">Security Tips</h3>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <li>• Never share your PIN with anyone, including support staff</li>
          <li>• Use a unique PIN not used elsewhere</li>
          <li>• Your PIN is required for critical account actions</li>
          <li>• 3 wrong PIN attempts will temporarily lock your account</li>
        </ul>
      </div>
    </div>
  );
}