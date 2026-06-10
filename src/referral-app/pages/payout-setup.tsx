// @ts-nocheck
import { useState } from "react";
import { useGetPayoutMethod, useSetPayoutMethod } from "@/referral-app/api";
import { Layout } from "@/referral-app/components/layout";
import { useAppStore } from "@/referral-app/lib/store";
import { motion } from "framer-motion";
import { Wallet, CheckCircle2, ChevronLeft } from "lucide-react";
import { Button } from "@/referral-app/components/ui/button";
import { Input } from "@/referral-app/components/ui/input";
import { useToast } from "@/referral-app/hooks/use-toast";
import { useLocation } from "wouter";

export default function PayoutSetupPage() {
  const { referrer } = useAppStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [payoutType, setPayoutType] = useState<"UPI" | "BANK">("UPI");
  const [upiId, setUpiId] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountName, setAccountName] = useState("");

  const { data: existing, refetch } = useGetPayoutMethod(referrer?.id ?? 0, { query: { enabled: !!referrer } as any });
  const setMethod = useSetPayoutMethod();

  const handleSubmit = async () => {
    if (!referrer) return;
    if (payoutType === "UPI" && !upiId) { toast({ title: "Enter your UPI ID", variant: "destructive" }); return; }
    if (payoutType === "BANK" && (!accountNumber || !ifscCode || !accountName)) {
      toast({ title: "Fill all bank details", variant: "destructive" }); return;
    }
    try {
      await setMethod.mutateAsync({
        referrerId: referrer.id,
        data: { type: payoutType, upiId: payoutType === "UPI" ? upiId : undefined, accountNumber: payoutType === "BANK" ? accountNumber : undefined, ifscCode: payoutType === "BANK" ? ifscCode : undefined, accountName: payoutType === "BANK" ? accountName : undefined },
      });
      toast({ title: "Payout method saved! 🎉", description: "We'll use this for your next payout." });
      refetch();
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="p-4 md:p-6 space-y-6 max-w-lg mx-auto">
        <button onClick={() => setLocation("/me")} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium">
          <ChevronLeft className="w-4 h-4" /> Back to Profile
        </button>

        <div>
          <h1 className="text-2xl font-black font-display text-slate-900 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-primary" /> Payout Setup
          </h1>
          <p className="text-slate-500 text-sm mt-1">Add your UPI or bank account to receive payouts instantly</p>
        </div>

        {existing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <div>
              <p className="font-bold text-green-800 text-sm">Payout method saved</p>
              <p className="text-green-600 text-sm">{existing.type === "UPI" ? `UPI: ${existing.upiId}` : `Bank: ${existing.accountName}`}</p>
            </div>
          </motion.div>
        )}

        <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-5">
          <div className="flex gap-2">
            {(["UPI", "BANK"] as const).map(t => (
              <button key={t} onClick={() => setPayoutType(t)}
                className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${payoutType === t ? "bg-primary text-white border-primary" : "bg-white text-slate-600 border-slate-200"}`}>
                {t === "UPI" ? "📱 UPI" : "🏦 Bank Account"}
              </button>
            ))}
          </div>

          {payoutType === "UPI" ? (
            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-700">UPI ID</label>
              <Input placeholder="yourname@upi" value={upiId} onChange={e => setUpiId(e.target.value)} className="text-lg" />
              <p className="text-xs text-slate-400">e.g. 9876543210@paytm, yourname@gpay, name@ybl</p>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {["@paytm", "@gpay", "@ybl", "@okaxis", "@upi", "@ibl"].map(suffix => (
                  <button key={suffix} onClick={() => setUpiId(prev => prev.replace(/@.*$/, "") + suffix)}
                    className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono hover:bg-slate-100 transition-colors">
                    {suffix}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Input placeholder="Account holder name" value={accountName} onChange={e => setAccountName(e.target.value)} />
              <Input placeholder="Account number" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} />
              <Input placeholder="IFSC Code (e.g. SBIN0001234)" value={ifscCode} onChange={e => setIfscCode(e.target.value.toUpperCase())} />
            </div>
          )}

          <Button onClick={handleSubmit} disabled={setMethod.isPending || !referrer} className="w-full h-12 text-base font-bold">
            {setMethod.isPending ? "Saving..." : "Save Payout Method"}
          </Button>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2">
          <h3 className="font-bold text-slate-800 text-sm">Payout Schedule</h3>
          <div className="space-y-1.5 text-sm text-slate-600">
            <p>• <strong>₹50</strong> paid within 48h of lead verification</p>
            <p>• <strong>₹500</strong> paid within 48h of successful booking</p>
            <p>• Minimum payout threshold: ₹100</p>
            <p>• All payouts are processed Mon–Fri</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
