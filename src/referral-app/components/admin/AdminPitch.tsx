// @ts-nocheck
import type { Pitch } from "@/lib/gharpayy-brand";

/** Three-line Why · How · What next pitch · admin (dark) variant. */
export function AdminPitch({ eyebrow, title, pitch }: { eyebrow: string; title: string; pitch: Pitch }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 mb-4">
      <div className="text-[10px] uppercase tracking-widest font-bold text-orange-400">{eyebrow}</div>
      <h2 className="text-base md:text-lg font-bold text-white mt-0.5">{title}</h2>
      <dl className="mt-3 grid md:grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Why</dt>
          <dd className="mt-1 text-slate-200 leading-snug">{pitch.why}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase font-bold tracking-widest text-slate-500">How</dt>
          <dd className="mt-1 text-slate-200 leading-snug">{pitch.how}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase font-bold tracking-widest text-slate-500">What next</dt>
          <dd className="mt-1 text-slate-200 leading-snug">{pitch.next}</dd>
        </div>
      </dl>
    </div>
  );
}
