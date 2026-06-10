// @ts-nocheck
import { useState } from "react";
import BookOSShell, { GoldBtn } from "@/referral-app/components/bookos/Shell";
import { Settings, Templates } from "@/referral-app/lib/bookos/store";

export default function SettingsPage() {
  const [s, setS] = useState(Settings.get());
  const [t, setT] = useState(Templates.get());
  const save = () => { Settings.set(s); Templates.set(t); alert("Saved"); };
  return (
    <BookOSShell eyebrow="CONFIG" title="Settings">
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-amber-200 bg-white/80 p-5">
          <div className="font-serif text-lg mb-3">Brand & payments</div>
          <div className="space-y-2">
            {[["brand","Brand"],["upiId","UPI ID"],["adminPhone","Admin phone"],["offerWindowMins","Offer window (min)","number"]].map(([k,lbl,type]: any) => (
              <label key={k} className="block text-xs text-slate-600"><div className="mb-1 font-semibold">{lbl}</div>
                <input type={type || "text"} value={(s as any)[k]} onChange={(e) => setS({...s, [k]: type === "number" ? +e.target.value : e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"/></label>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-white/80 p-5">
          <div className="font-serif text-lg mb-3">WhatsApp templates</div>
          <div className="space-y-2">
            {(["offer","reminder","paid","overdue"] as const).map((k) => (
              <label key={k} className="block text-xs text-slate-600"><div className="mb-1 font-semibold uppercase">{k}</div>
                <textarea rows={3} value={(t as any)[k]} onChange={(e) => setT({...t, [k]: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"/></label>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex justify-end"><GoldBtn onClick={save}>Save</GoldBtn></div>
    </BookOSShell>
  );
}