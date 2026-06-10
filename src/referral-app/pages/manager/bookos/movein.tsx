// @ts-nocheck
import { Link } from "wouter";
import BookOSShell, { KPI, GoldBtn, OutlineBtn } from "@/referral-app/components/bookos/Shell";
import { RoomBookingsDB, Ops, generateMoveInPack, useOps } from "@/referral-app/lib/bookos/ops";
import { RoomsXDB } from "@/referral-app/lib/bookos/inventory";
import { PropertiesDB, BookingsDB, useStore } from "@/referral-app/lib/bookos/store";
import { fmt, waLink, copyText } from "@/referral-app/lib/bookos/format";
import { CheckCircle2, Circle, MessageCircle, Copy, MapPin, Home } from "lucide-react";

export default function MoveInCenter() {
  const rbs = useOps(() => RoomBookingsDB.all());
  const rooms = useOps(() => RoomsXDB.all());
  const props = useStore(() => PropertiesDB.all());

  const pending = rbs.filter((r: any) => r.status !== "movein_done" && r.status !== "cancelled");
  const done = rbs.filter((r: any) => r.status === "movein_done");
  const collectedAll = rbs.filter((r: any) => Object.values(r.collected).every(Boolean));

  return (
    <BookOSShell eyebrow="MOVE-IN COMMAND CENTER" title="Bookings → collection → approved move-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KPI accent label="Open bookings" value={pending.length}/>
        <KPI label="Ready to approve" value={collectedAll.length - done.length}/>
        <KPI label="Moved in" value={done.length}/>
        <KPI label="Total" value={rbs.length}/>
      </div>

      <div className="space-y-3">
        {pending.map((rb: any) => {
          const room = rooms.find((r: any) => r.id === rb.roomId);
          const prop = props.find((p: any) => p.id === room?.propertyId);
          const booking = BookingsDB.get(rb.bookingId || "");
          const pack = generateMoveInPack({ booking, room, property: prop });
          const completed = Object.values(rb.collected).filter(Boolean).length;
          const total = Object.keys(rb.collected).length;
          const readyApprove = completed === total;
          return (
            <div key={rb.id} className="rounded-2xl border border-amber-200 bg-white/80 p-5">
              <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                <div>
                  <div className="text-[10px] font-bold tracking-[0.18em] text-amber-700">{prop?.name} · Floor {room?.floorId ? "—" : "—"} · Room #{room?.roomNumber}</div>
                  <div className="font-serif text-xl">{rb.customerName} · {rb.customerPhone}</div>
                  <div className="text-xs text-slate-500">Rent {fmt(rb.rent)} · Deposit {fmt(rb.deposit)} · Token {fmt(rb.token)} · Move-in {rb.moveInDate}</div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-amber-800">{completed}/{total} checklist</span>
                  {readyApprove ? (
                    <GoldBtn onClick={() => Ops.approveMoveIn(rb.id)}><Home className="w-4 h-4"/> Approve move-in</GoldBtn>
                  ) : (
                    <OutlineBtn disabled className="opacity-60"><Home className="w-4 h-4"/> Move-in locked</OutlineBtn>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-5 gap-2 mb-3">
                <Checkbox label="Token" on={rb.collected.token} onClick={() => Ops.collect(rb.id, "token", rb.token, "UPI", "UPI-" + Date.now().toString(36))}/>
                <Checkbox label="Deposit" on={rb.collected.deposit} onClick={() => Ops.collect(rb.id, "deposit", rb.deposit, "UPI", "DEP-" + Date.now().toString(36))}/>
                <Checkbox label="First rent" on={rb.collected.firstRent} onClick={() => Ops.collect(rb.id, "firstRent", rb.rent, "UPI", "RENT-" + Date.now().toString(36))}/>
                <Checkbox label="Agreement" on={rb.collected.agreement} onClick={() => Ops.collect(rb.id, "agreement")}/>
                <Checkbox label="KYC" on={rb.collected.kyc} onClick={() => Ops.collect(rb.id, "kyc")}/>
              </div>

              <div className="flex gap-2 flex-wrap pt-3 border-t border-slate-100">
                <a href={pack.waUrl} target="_blank" rel="noreferrer"><GoldBtn><MessageCircle className="w-4 h-4"/> Send move-in pack</GoldBtn></a>
                <OutlineBtn onClick={() => copyText(pack.text)}><Copy className="w-4 h-4"/> Copy slip</OutlineBtn>
                <a href={pack.maps} target="_blank" rel="noreferrer"><OutlineBtn><MapPin className="w-4 h-4"/> Maps</OutlineBtn></a>
                {room && <Link href={`/manager/bookos/room/${room.id}`}><OutlineBtn>Room →</OutlineBtn></Link>}
                {booking && <Link href={`/manager/bookos/bookings/${booking.id}`}><OutlineBtn>Booking →</OutlineBtn></Link>}
              </div>
            </div>
          );
        })}
        {!pending.length && <div className="border-2 border-dashed border-amber-200 rounded-2xl p-10 text-center text-slate-400">No pending move-ins.</div>}
      </div>

      {done.length > 0 && (
        <div className="mt-8">
          <div className="text-[10px] font-bold tracking-[0.18em] text-emerald-700 mb-2">RECENT MOVE-INS</div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 divide-y divide-emerald-100">
            {done.slice(0, 6).map((rb: any) => {
              const room = rooms.find((r: any) => r.id === rb.roomId);
              const prop = props.find((p: any) => p.id === room?.propertyId);
              return (
                <div key={rb.id} className="px-4 py-2 flex items-center justify-between text-sm">
                  <div><b>{rb.customerName}</b> · {prop?.name} #{room?.roomNumber}</div>
                  <div className="text-xs text-emerald-700 font-bold">✓ Moved in</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </BookOSShell>
  );
}

function Checkbox({ label, on, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm ${on ? "bg-emerald-50 border-emerald-300 text-emerald-900" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
      {on ? <CheckCircle2 className="w-4 h-4 text-emerald-600"/> : <Circle className="w-4 h-4 text-slate-400"/>}
      <span className="font-medium">{label}</span>
    </button>
  );
}
