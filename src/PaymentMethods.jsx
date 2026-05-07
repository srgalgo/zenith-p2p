import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, CreditCard, Check } from "lucide-react";

const METHOD_TYPES = [
  { value:"upi", label:"UPI", fields:["upi_id","account_name"] },
  { value:"imps", label:"IMPS", fields:["account_name","account_number","bank_name","ifsc_code"] },
  { value:"bank_transfer", label:"Bank Transfer", fields:["account_name","account_number","bank_name","ifsc_code"] },
  { value:"cash_deposit", label:"Cash Deposit", fields:["account_name","bank_name","account_number"] },
  { value:"paypal", label:"PayPal", fields:["email"] },
  { value:"wise", label:"Wise", fields:["email","account_name"] },
  { value:"revolut", label:"Revolut", fields:["phone","account_name"] },
  { value:"skrill", label:"Skrill", fields:["email"] },
  { value:"zelle", label:"Zelle", fields:["email","phone"] },
  { value:"venmo", label:"Venmo", fields:["phone","account_name"] },
  { value:"sepa", label:"SEPA", fields:["account_name","account_number","bank_name"] },
  { value:"pix", label:"PIX", fields:["phone","account_name"] },
  { value:"gcash", label:"GCash", fields:["phone","account_name"] },
  { value:"paytm", label:"Paytm", fields:["phone","account_name"] },
  { value:"phonepe", label:"PhonePe", fields:["phone","account_name"] },
  { value:"googlepay", label:"Google Pay", fields:["phone","account_name"] },
];
const FIELD_LABELS = { upi_id:"UPI ID", account_name:"Account Name", account_number:"Account Number", bank_name:"Bank Name", ifsc_code:"IFSC Code", email:"Email", phone:"Phone Number" };

export default function PaymentMethods() {
  const [methods, setMethods] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ method_type:"", label:"", details:{} });

  const fetch = async () => {
    const u = await base44.auth.me();
    setUser(u);
    const m = await base44.entities.PaymentMethod.filter({ user_email: u.email });
    setMethods(m); setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const selectedType = METHOD_TYPES.find((t) => t.value === form.method_type);

  const handleAdd = async () => {
    if (!form.method_type || !form.label) { toast.error("Fill all required fields"); return; }
    await base44.entities.PaymentMethod.create({ user_email: user.email, method_type: form.method_type, label: form.label, details: form.details, country: user.country || "", is_active: true });
    toast.success("Payment method added!");
    setOpen(false); setForm({ method_type:"", label:"", details:{} }); fetch();
  };

  const handleDelete = async (id) => {
    await base44.entities.PaymentMethod.delete(id);
    toast.success("Removed"); fetch();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-foreground">Payment Methods</h1><p className="text-muted-foreground mt-1">Manage your payment options</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="rounded-xl"><Plus className="h-4 w-4 mr-2" />Add</Button></DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Add Payment Method</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={form.method_type} onValueChange={(v) => setForm({ ...form, method_type:v, details:{} })}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>{METHOD_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Label *</Label>
                <Input value={form.label} onChange={(e) => setForm({ ...form, label:e.target.value })} placeholder="e.g. My SBI Account" className="rounded-xl" />
              </div>
              {selectedType?.fields.map((field) => (
                <div key={field} className="space-y-2">
                  <Label>{FIELD_LABELS[field]}</Label>
                  <Input value={form.details[field]||""} onChange={(e) => setForm({ ...form, details:{...form.details,[field]:e.target.value} })} placeholder={FIELD_LABELS[field]} className="rounded-xl" />
                </div>
              ))}
              <Button onClick={handleAdd} className="w-full rounded-xl">Add Payment Method</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {methods.length === 0 ? (
        <div className="text-center py-20"><CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-semibold text-foreground">No Payment Methods</h3><p className="text-muted-foreground mt-1">Add your first payment method</p></div>
      ) : (
        <div className="space-y-3">
          {methods.map((m) => (
            <div key={m.id} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><CreditCard className="h-5 w-5 text-primary" /></div>
                <div>
                  <div className="font-semibold text-foreground text-sm">{m.label}</div>
                  <div className="text-xs text-muted-foreground capitalize">{m.method_type?.replace(/_/g," ")}{m.details?.upi_id && ` • ${m.details.upi_id}`}{m.details?.email && ` • ${m.details.email}`}{m.details?.bank_name && ` • ${m.details.bank_name}`}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {m.is_active && <span className="text-xs text-primary flex items-center gap-1"><Check className="h-3 w-3" />Active</span>}
                <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}