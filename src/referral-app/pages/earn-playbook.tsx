// @ts-nocheck
import { Link, useRoute } from "wouter";
import { EARN_BY_ID, expectedMonthlyEarning } from "@/lib/earn-rules";
import { PERSONAS } from "@/lib/personas";
import { GHARPAYY_ZONES } from "@/lib/gharpayy-zones";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { useState } from "react";

export default function EarnPlaybookPage() {
  const [, params] = useRoute("/earn/:channel");
  const rule = EARN_BY_ID[params?.channel || ""];
  const [persona, setPersona] = useState(PERSONAS[0]);
  const [zone, setZone] = useState(GHARPAYY_ZONES[0]);
  if (!rule) return <div className="p-8 text-white">Channel not found.</div>;

  const message = encodeURIComponent(
    `Hey! I'm sharing Gharpayy · direct-to-owner ${persona.title.toLowerCase()} stays in ${zone.display} (${zone.tagline}). Expert replies in minutes. Want me to intro? · code GHAR-YOU1`
  );
  const wa = `https://api.whatsapp.com/send?text=${message}`;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link href="/earn" className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> All channels
        </Link>

        <div className="bg-gradient-to-br from-orange-500/20 to-pink-500/10 border border-orange-500/30 rounded-2xl p-6">
          <div className="text-4xl">{rule.emoji}</div>
          <h1 className="text-2xl md:text-3xl font-black mt-2">{rule.title}</h1>
          <p className="text-sm text-slate-300 mt-2">{rule.blurb}</p>
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <div className="bg-black/30 rounded-lg py-2"><div className="text-base font-black text-blue-400">₹{rule.payoutOnLead}</div><div className="text-[10px] text-slate-400 uppercase">Per lead</div></div>
            <div className="bg-black/30 rounded-lg py-2"><div className="text-base font-black text-orange-400">₹{rule.payoutOnTour}</div><div className="text-[10px] text-slate-400 uppercase">Per tour</div></div>
            <div className="bg-black/30 rounded-lg py-2"><div className="text-base font-black text-green-400">₹{rule.payoutOnBooking}</div><div className="text-[10px] text-slate-400 uppercase">Per booking</div></div>
          </div>
          <div className="mt-3 text-xs text-orange-300 font-bold">~₹{expectedMonthlyEarning(rule, 8).toLocaleString()}/month at 8 leads/mo</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="font-bold">How to earn (3 steps)</h3>
          <ol className="space-y-2 text-sm text-slate-300 list-decimal list-inside">
            {rule.howTo.map((s) => <li key={s}>{s}</li>)}
          </ol>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="font-bold">Personalize your share</h3>
          <div className="grid grid-cols-2 gap-2">
            <select value={persona.id} onChange={(e) => setPersona(PERSONAS.find((p) => p.id === e.target.value)!)}
              className="bg-slate-800 border border-slate-700 text-sm rounded-lg px-2 py-2">
              {PERSONAS.map((p) => <option key={p.id} value={p.id}>{p.emoji} {p.title}</option>)}
            </select>
            <select value={zone.slug} onChange={(e) => setZone(GHARPAYY_ZONES.find((z) => z.slug === e.target.value)!)}
              className="bg-slate-800 border border-slate-700 text-sm rounded-lg px-2 py-2">
              {GHARPAYY_ZONES.map((z) => <option key={z.slug} value={z.slug}>{z.display}</option>)}
            </select>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-300">
            {decodeURIComponent(message)}
          </div>
          <a href={wa} target="_blank" rel="noreferrer"
            className="inline-flex items-center justify-center w-full gap-2 px-4 py-3 rounded-full bg-green-500 hover:bg-green-600 text-white font-black text-sm">
            <MessageCircle className="w-4 h-4" /> Share on WhatsApp
          </a>
          <Link href={`/persona-kit/${persona.id}`} className="block text-center text-xs text-orange-400 hover:underline">
            Open full persona kit (opener · follow-up · objections) →
          </Link>
        </div>

        {rule.topEarner && (
          <div className="text-center text-sm text-slate-400 italic">
            🏆 Top earner this month: <strong className="text-white">{rule.topEarner.name}</strong> · ₹{rule.topEarner.monthly.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
