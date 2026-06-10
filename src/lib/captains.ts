export type Expert = {
  id: string;
  name: string;
  initial: string;
  title: string;
  phone: string;
  responseSla: string;
  hubs: string[];
  quote: string;
  active: number;
  closed: number;
};

export const CAPTAINS: Expert[] = [
  { id: "aditi-hsr", name: "Aditi Rao", initial: "A", title: "HSR · Bellandur expert", phone: "919000011111", responseSla: "Replies in 12 min", hubs: ["HSR Layout", "Bellandur", "Sarjapur Road"], quote: "I sell commute truth before room photos.", active: 14, closed: 68 },
  { id: "rahul-koramangala", name: "Rahul Nair", initial: "R", title: "Koramangala closer", phone: "919000022222", responseSla: "Replies in 9 min", hubs: ["Koramangala", "BTM Layout", "Jayanagar"], quote: "Students need clarity, founders need speed.", active: 18, closed: 91 },
  { id: "meera-indiranagar", name: "Meera Iyer", initial: "M", title: "Indiranagar · premium desk", phone: "919000033333", responseSla: "Replies in 15 min", hubs: ["Indiranagar", "Domlur", "Ulsoor"], quote: "Premium renters buy neighbourhood confidence.", active: 9, closed: 54 },
  { id: "imran-whitefield", name: "Imran Khan", initial: "I", title: "Whitefield move-in desk", phone: "919000044444", responseSla: "Replies in 18 min", hubs: ["Whitefield", "Marathahalli", "Brookefield"], quote: "IT corridor leads close when routes are real.", active: 12, closed: 63 },
  { id: "neha-north", name: "Neha Verma", initial: "N", title: "North Bengaluru atlas", phone: "919000055555", responseSla: "Replies in 20 min", hubs: ["Hebbal", "Manyata", "Yelahanka"], quote: "Families and freshers both want proof.", active: 7, closed: 41 },
];

export const CAPTAIN_BY_ID: Record<string, Expert> = Object.fromEntries(CAPTAINS.map((captain) => [captain.id, captain]));

function norm(value?: string | null) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function captainForArea(area?: string | null): Expert {
  const key = norm(area);
  if (/koramangala|btm|jayanagar|christ/.test(key)) return CAPTAIN_BY_ID["rahul-koramangala"];
  if (/indiranagar|domlur|ulsoor|mg-road/.test(key)) return CAPTAIN_BY_ID["meera-indiranagar"];
  if (/whitefield|marathahalli|brookefield|itpl/.test(key)) return CAPTAIN_BY_ID["imran-whitefield"];
  if (/hebbal|manyata|yelahanka|north/.test(key)) return CAPTAIN_BY_ID["neha-north"];
  return CAPTAIN_BY_ID["aditi-hsr"];
}

export function captainForPersona(persona?: string | null): Expert {
  const key = norm(persona);
  if (/founder|premium|nri/.test(key)) return CAPTAIN_BY_ID["meera-indiranagar"];
  if (/student|campus|christ|guard/.test(key)) return CAPTAIN_BY_ID["rahul-koramangala"];
  if (/techie|orr|it|whitefield/.test(key)) return CAPTAIN_BY_ID["imran-whitefield"];
  if (/family|north/.test(key)) return CAPTAIN_BY_ID["neha-north"];
  return CAPTAIN_BY_ID["aditi-hsr"];
}

export function captainWaLink(expert: Expert, text = `Hi ${expert.name}, I need help with a Gharpayy lead.`) {
  return `https://wa.me/${expert.phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}
