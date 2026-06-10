// @ts-nocheck
import { useState } from "react";
import { Plus, Building2 } from "lucide-react";
import BookOSShell, { KPI, GoldBtn, OutlineBtn, EmptyState } from "@/referral-app/components/bookos/Shell";
import { PropertiesDB, useStore } from "@/referral-app/lib/bookos/store";

export default function PropertiesPage() {
  const all = useStore(() => PropertiesDB.all());
  const [f, setF] = useState({ name: "", area: "", totalRooms: "", occupiedRooms: "", rentRange: "" });
  const totalRooms = all.reduce((s: number, p: any) => s + (p.totalRooms || 0), 0);
  const occ = all.reduce((s: number, p: any) => s + (p.occupiedRooms || 0), 0);
  const occRate = totalRooms ? Math.round((occ / totalRooms) * 100) : 0;
  const add = () => {
    if (!f.name || !f.area) return;
    PropertiesDB.create({ ...f, totalRooms: +f.totalRooms || 0, occupiedRooms: +f.occupiedRooms || 0, createdAt: new Date().toISOString() } as any);
    setF({ name: "", area: "", totalRooms: "", occupiedRooms: "", rentRange: "" });
  };
  return (
    <BookOSShell eyebrow="ASSETS" title="Properties">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KPI accent label="Properties" value={all.length}/>
        <KPI label="Total rooms" value={totalRooms}/>
        <KPI label="Occupied" value={occ}/>
        <KPI label="Occupancy" value={occRate + "%"}/>
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          {!all.length ? <EmptyState title="No properties yet"/> : all.map((p: any) => {
            const rate = p.totalRooms ? Math.round((p.occupiedRooms / p.totalRooms) * 100) : 0;
            return (
              <div key={p.id} className="rounded-2xl border border-amber-200 bg-white/80 p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center"><Building2 className="w-6 h-6 text-amber-700"/></div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.area} · {p.totalRooms} rooms · {p.rentRange}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-amber-700">{rate}%</div>
                  <div className="text-[10px] text-slate-500">occupied</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="rounded-2xl border border-amber-200 bg-white/80 p-5">
          <div className="font-serif text-lg mb-3">Add property</div>
          <div className="space-y-2">
            {[["name","Name"],["area","Area"],["totalRooms","Total rooms","number"],["occupiedRooms","Occupied","number"],["rentRange","Rent range"]].map(([k,lbl,type]: any) => (
              <input key={k} placeholder={lbl} type={type || "text"} value={(f as any)[k]} onChange={(e) => setF({...f, [k]: e.target.value})}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"/>
            ))}
            <GoldBtn onClick={add} className="w-full justify-center"><Plus className="w-4 h-4"/> Add</GoldBtn>
          </div>
        </div>
      </div>
    </BookOSShell>
  );
}