import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface Scenario {
  id: number;
  title: string;
  action: string;
  status: string;
  next: string;
}

/** The 20 mandated tour scenarios — every one has an action, a CRM status and a next step. */
export const SCENARIOS: Scenario[] = [
  { id: 1, title: "Tour scheduled successfully", action: "Send property name, location, time, coordinator number and visit expectations", status: "Visit Scheduled", next: "Set confirmation reminder" },
  { id: 2, title: "Customer confirms the tour", action: "Confirm exact arrival time and number of people visiting", status: "Visit Confirmed", next: "Reconfirm 60 minutes before" },
  { id: 3, title: "Customer does not confirm", action: "Call and send a short confirmation message", status: "Confirmation Pending", next: "Reassign follow-up after 30 minutes" },
  { id: 4, title: "Customer asks to reschedule", action: "Capture new date, time and reason", status: "Visit Rescheduled", next: "Cancel old slot and create new slot" },
  { id: 5, title: "Customer wants an earlier visit", action: "Check coordinator and inventory availability immediately", status: "Time Change Requested", next: "Confirm revised slot within 10 minutes" },
  { id: 6, title: "Customer is running late", action: "Ask for expected arrival time and inform the coordinator", status: "Customer Delayed", next: "Keep the slot active for a defined period" },
  { id: 7, title: "Visit coordinator is running late", action: "Inform customer before they arrive and provide a revised ETA", status: "Coordinator Delayed", next: "Escalate if delay exceeds 10–15 minutes" },
  { id: 8, title: "Customer cannot find the property", action: "Share live location, landmark, exterior image and coordinator number", status: "Location Assistance", next: "Coordinator calls the customer immediately" },
  { id: 9, title: "Customer cancels before leaving", action: "Capture the exact cancellation reason", status: "Visit Cancelled", next: "Reschedule or move to nurture follow-up" },
  { id: 10, title: "Customer does not show up", action: "Call within 10 minutes of the scheduled time", status: "No Show", next: "Attempt one same-day reschedule" },
  { id: 11, title: "Property or bed becomes unavailable", action: "Do not allow the customer to reach an unavailable property", status: "Inventory Conflict", next: "Offer a verified replacement before the visit" },
  { id: 12, title: "Customer reaches and tour starts", action: "Mark arrival time, property and coordinator", status: "Visit In Progress", next: "Track which rooms and beds were shown" },
  { id: 13, title: "Customer likes the property", action: "Ask which exact room or bed they prefer", status: "Interested After Visit", next: "Send quotation within 15 minutes" },
  { id: 14, title: "Likes it but finds it expensive", action: "Understand the acceptable budget gap", status: "Negotiation – Price", next: "Offer approved discount, plan or alternative" },
  { id: 15, title: "Customer says the property is too far", action: "Identify whether the concern is commute time, transport or locality", status: "Negotiation – Distance", next: "Share commute proof or closer alternative" },
  { id: 16, title: "Needs family approval", action: "Send photos, video, quotation, rules and payment details", status: "Decision Pending – Family", next: "Schedule a family decision call" },
  { id: 17, title: "Wants to compare other properties", action: "Ask what is missing in the current option", status: "Comparison Pending", next: "Show only one highly relevant alternative" },
  { id: 18, title: "Dislikes the room or property", action: "Capture the exact reason: size, food, hygiene, ventilation, crowd, price or location", status: "Visit Not Suitable", next: "Recommend an alternative based on that reason" },
  { id: 19, title: "Selects a room but does not pay", action: "Share booking validity and payment deadline", status: "Token Pending", next: "Follow up before the room hold expires" },
  { id: 20, title: "Customer pays and confirms", action: "Verify payment proof, bed number, rent, deposit, fee and check-in date", status: "Booked", next: "Start the Move-In Assurance process" },
];

export const RULES: string[] = [
  "No visit without a lead owner.",
  "No visit without a coordinator.",
  "No visit without confirmed room inventory.",
  "No visit scheduled only against a property — it must include a room or bed preference.",
  "No visit can remain in one stage beyond its SLA.",
  "No completed tour without customer feedback.",
  "No positive visit without a quotation.",
  "No quotation without a follow-up deadline.",
  "No lead should have multiple owners.",
  "No visit marked complete without a final outcome.",
  "No 'customer is thinking' status without reason and deadline.",
  "No room promised without supply confirmation.",
  "Maximum two properties shown unless an exception is approved.",
  "The lead owner must be available during the active tour.",
  "The booking discussion begins while the customer is still at the property.",
];

export const ROLES: Array<{ role: string; owns: string[] }> = [
  { role: "Visit Controller", owns: ["Tracks every active visit", "Detects delays", "Confirms coordinators", "Ensures inventory availability", "Escalates stuck visits", "Ensures every visit has an outcome"] },
  { role: "Lead Owner", owns: ["Customer qualification", "Pre-visit communication", "Live objection handling", "Quotation", "Negotiation", "Token collection", "Booking closure"] },
  { role: "Tour Coordinator", owns: ["Customer arrival", "Property experience", "Room presentation", "Real-time feedback", "Preferred room identification", "Dashboard updates"] },
  { role: "Supply Controller", owns: ["Real-time room availability", "Bed blocking", "Owner confirmation", "Discount approval", "Room readiness", "Inventory conflict resolution"] },
];

export function PlaybookPanel() {
  return (
    <div className="space-y-4">
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">20 live tour scenarios</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {SCENARIOS.map((s) => (
            <Card key={s.id} className="p-3 space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">{s.id}</Badge>
                <span className="text-xs font-medium">{s.title}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">{s.action}</p>
              <div className="flex flex-wrap gap-1 pt-0.5">
                <Badge variant="secondary" className="text-[10px]">{s.status}</Badge>
                <Badge variant="outline" className="text-[10px]">Next: {s.next}</Badge>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-3">
          <h2 className="text-sm font-semibold mb-2">Non-negotiable visit rules</h2>
          <ul className="space-y-1">
            {RULES.map((r) => <li key={r} className="text-[11px] text-muted-foreground">· {r}</li>)}
          </ul>
        </Card>
        <Card className="p-3">
          <h2 className="text-sm font-semibold mb-2">Team roles</h2>
          <div className="space-y-2">
            {ROLES.map((r) => (
              <div key={r.role}>
                <div className="text-xs font-medium">{r.role}</div>
                <p className="text-[11px] text-muted-foreground">{r.owns.join(" · ")}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
