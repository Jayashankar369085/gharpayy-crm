// @ts-nocheck
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAdminStore } from "@/referral-app/lib/store";
import { Button } from "@/referral-app/components/ui/button";
import { Input } from "@/referral-app/components/ui/input";
import { toast } from "sonner";
import { Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { isAdminAuthenticated, setAdminAuthenticated } = useAdminStore();
  const [pin, setPin] = useState("");

  useEffect(() => {
    if (isAdminAuthenticated) {
      setLocation("/admin/dashboard");
    }
  }, [isAdminAuthenticated, setLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === "0000") {
      setAdminAuthenticated(true);
      toast.success("Access granted");
      setLocation("/admin/dashboard");
    } else {
      toast.error("Invalid PIN");
      setPin("");
    }
  };

  if (isAdminAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-2xl"
      >
        <div className="w-16 h-16 bg-primary/20 text-primary rounded-2xl flex items-center justify-center mb-6 mx-auto">
          <Shield className="w-8 h-8" />
        </div>
        
        <h1 className="text-2xl font-bold font-display text-white text-center mb-2">Admin Access</h1>
        <p className="text-slate-400 text-center text-sm mb-8">Enter the secure PIN to access the management dashboard.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Input 
              type="password" 
              maxLength={4}
              placeholder="••••" 
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="text-center text-3xl tracking-[1em] font-mono h-16 bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-primary focus-visible:border-primary"
              autoFocus
            />
          </div>
          <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={pin.length !== 4}>
            Unlock
          </Button>
        </form>
        <div className="mt-8 text-center">
          <button onClick={() => setLocation("/")} className="text-sm text-slate-500 hover:text-slate-300">
            Return to App
          </button>
        </div>
      </motion.div>
    </div>
  );
}