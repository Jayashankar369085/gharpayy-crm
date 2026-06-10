// @ts-nocheck
import { Link, useRoute } from "wouter";
import { PERSONA_BY_ID } from "@/lib/personas";
import { ArrowLeft, MessageCircle, Copy } from "lucide-react";

export default function PersonaKitPage() {
  const [, params] = useRoute("/persona-kit/:id");
  const persona = PERSONA_BY_ID[params?.id || ""];
  if (!persona) return <div className="p-8 text-white">Persona not found.</div>;

  const opener = persona.whatsappOpener;
  const followUp = `Quick check · did you get a chance to chat with the expert about ${persona.bestAreas[0]}? Happy to send 2 more options if helpful.`;
  const objection = `If they say "but brokers ask 1 month deposit" → reply: "Gharpayy caps deposit at 2 months and the expert handles paperwork. Send me the building name, I'll get you the verified rate."`;
  const voiceNote = `Hi, I'm sharing this from my friend who just moved to ${persona.bestAreas[0]} via Gharpayy. ${persona.storyQuote} · talk to the expert, no pressure.`;

  const copy = (s: string) => navigator.clipboard.writeText(s);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-5">
        <Link href="/earn" className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Earn hub
        </Link>
        <div>
          <div className="text-3xl">{persona.emoji}</div>
          <h1 className="text-2xl font-black">{persona.title} · outreach kit</h1>
          <p className="text-sm text-slate-400 mt-1">{persona.short}</p>
          <p className="text-xs text-slate-500 italic mt-1">"{persona.storyQuote}"</p>
        </div>

        <KitCard title="WhatsApp opener" body={opener} onCopy={copy} />
        <KitCard title="Follow-up (day 2)" body={followUp} onCopy={copy} />
        <KitCard title="Objection handler" body={objection} onCopy={copy} />
        <KitCard title="Voice-note script" body={voiceNote} onCopy={copy} />

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-bold text-orange-400 uppercase tracking-wider">Best areas</div>
          <div className="text-sm text-slate-300 mt-1">{persona.bestAreas.slice(0, 5).join(" · ")}</div>
          <div className="text-xs font-bold text-orange-400 uppercase tracking-wider mt-3">Budget</div>
          <div className="text-sm text-slate-300 mt-1">₹{persona.budget[0].toLocaleString()} – ₹{persona.budget[1].toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}

function KitCard({ title, body, onCopy }: any) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-bold text-orange-400 uppercase tracking-wider">{title}</div>
        <button onClick={() => onCopy(body)} className="text-[11px] text-slate-400 hover:text-white inline-flex items-center gap-1">
          <Copy className="w-3 h-3" /> Copy
        </button>
      </div>
      <div className="text-sm text-slate-200 leading-relaxed">{body}</div>
      <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(body)}`} target="_blank" rel="noreferrer"
        className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-green-500/20 text-green-400 text-[11px] font-bold">
        <MessageCircle className="w-3 h-3" /> Send on WhatsApp
      </a>
    </div>
  );
}
