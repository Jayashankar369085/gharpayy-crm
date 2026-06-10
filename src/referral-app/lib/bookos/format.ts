// @ts-nocheck
export const fmt = (n: number) => "₹" + new Intl.NumberFormat("en-IN").format(Math.round(n || 0));
export const fmtShort = (n: number) => {
  const v = Math.abs(n);
  if (v >= 1e7) return "₹" + (n / 1e7).toFixed(1) + "Cr";
  if (v >= 1e5) return "₹" + (n / 1e5).toFixed(1) + "L";
  if (v >= 1e3) return "₹" + (n / 1e3).toFixed(1) + "K";
  return fmt(n);
};
export const timeAgo = (iso?: string) => {
  if (!iso) return "—";
  const d = Date.now() - +new Date(iso);
  if (d < 60000) return "just now";
  if (d < 3600000) return Math.floor(d / 60000) + "m ago";
  if (d < 86400000) return Math.floor(d / 3600000) + "h ago";
  return Math.floor(d / 86400000) + "d ago";
};
export const countdown = (iso?: string | null) => {
  if (!iso) return null;
  const ms = +new Date(iso) - Date.now();
  if (ms <= 0) return "expired";
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${s.toString().padStart(2, "0")}`;
};
export const statusChipClass = (s: string) => ({
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  paid: "bg-emerald-200 text-emerald-900 border-emerald-300",
  expired: "bg-red-100 text-red-800 border-red-200",
  cancelled: "bg-slate-100 text-slate-600 border-slate-200",
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  sent: "bg-blue-100 text-blue-800 border-blue-200",
  accepted: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  converted: "bg-amber-200 text-amber-900 border-amber-300",
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  notice: "bg-amber-100 text-amber-800 border-amber-200",
  exited: "bg-slate-100 text-slate-600 border-slate-200",
  open: "bg-amber-100 text-amber-800 border-amber-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  done: "bg-emerald-100 text-emerald-800 border-emerald-200",
  overdue: "bg-red-100 text-red-800 border-red-200",
}[s] || "bg-slate-100 text-slate-700 border-slate-200");

export const waLink = (phone: string, text: string) =>
  `https://wa.me/${(phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
export const upiUrl = (upiId: string, name: string, amount: number, note: string) =>
  `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
export const qrUrl = (data: string) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(data)}&bgcolor=ffffff&color=080808&margin=10`;
export const copyText = (t: string) => {
  if (typeof navigator !== "undefined" && navigator.clipboard) navigator.clipboard.writeText(t).catch(() => {});
};
export const csv = (rows: any[]) => {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
};
export const downloadFile = (name: string, content: string, mime = "text/csv") => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
export const fillTemplate = (tpl: string, vars: Record<string, any>) =>
  tpl.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));