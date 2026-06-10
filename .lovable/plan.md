## Goal

Turn the Owner module into a **hotel-style inventory desk**: each owner sees one screen where they can add rooms in bulk (10–12 at once), block any room for Gharpayy in one tap, set price, and the same rooms instantly become bookable across the rest of the app (Sales Inventory Truth → Visit scheduler → channel pitch → close). No back-and-forth, no calls. Hotel-grade clarity.

## Hotel-approach principles applied

- **Room = a sellable unit with one price and one state.** No ambiguity. State machine: `available → held (Gharpayy block) → booked → checkout`.
- **One screen per owner does everything.** Add inventory, set rates, block/unblock, see who's coming for a tour, see today's bookings.
- **Soft escalation, not guillotine.** Replace the 11 AM auto-lock with a 3-warning timeline (11 AM → 2 PM → 7 PM). Hard lock only after 22:00.
- **Atomic actions cross-module.** When sales clicks "schedule tour" on a room, the room shows up on the owner's screen the same second; when the owner blocks it, sales can't pitch it anymore.

## What the owner sees on `/owner` (the new 10x Home)

### 1. Identity + Daily Truth strip
- `OWN-XXXX`, name, copy-id, call / WhatsApp, "Confirm all unchanged" button.
- Truth phase chip: `idle → open → warn-1 (11 AM) → warn-2 (2 PM) → warn-3 (7 PM) → locked (22:00)`.

### 2. KPI strip (hotel front-desk style)
Available · Held for Gharpayy · Booked today · Tours scheduled · Vacating soon · Revenue this month.

### 3. Tabs (URL-synced `?tab=…`)
- **Inventory** (default) — all rooms across both hubs grouped by property. Per-row: rent, status pill, "Block for Gharpayy" toggle, "Edit", "Remove" (only for owner-added rooms). Plus a sticky **"+ Add rooms"** action.
- **Tours** — today + next 7 days of visits scheduled on this owner's rooms (sourced from existing visits-war / visit feed). Tap a visit to see lead, time, room id.
- **Block requests** — pending team block requests with approve/reject + auto-expiry countdown (folded in from `OwnerBlocks`).
- **Activity** — what Gharpayy did for you (effort ledger; already built).

### 4. Add rooms sheet (the "bulk" experience)
- Opens from "+ Add rooms".
- Choose target property (dropdown of this owner's PGs across both hubs).
- A small editable table with up to **12 rows** at once: type (single/double/triple), beds, rent ₹, initial status. "+ Add row" up to 12. "Save all" persists in one go.
- Toast: "12 rooms added to <PG name>. Live in Sales Inventory Truth."

### 5. Block-for-Gharpayy (the hotel "hold" gesture)
- Per row: a single toggle. ON → status becomes `held`, room id is reserved for Gharpayy and visible to sales as bookable but flagged "Owner held — exclusive for Gharpayy deals". OFF → returns to previous state.
- Bulk action: "Hold all vacant for Gharpayy this week" from the inventory header.

## Cross-module end-to-end loop (must work after this ships)

A complete trip with no human handoff:

1. Owner adds 12 rooms via the new sheet. Each gets id `${pgId}::custom-<n>`.
2. Owner toggles "Hold for Gharpayy" on 6 of them.
3. **Sales Inventory Truth** (`/inventory-truth`) shows all 12: 6 are held (badge + locked rent), 6 are open. A held room is pitchable but the booking flow goes through Gharpayy direct.
4. **Daily Action Queue / CRM** lets a sales rep click "Schedule tour" on a held room → tour goes into the `visits` ledger with that exact `roomId`.
5. **Owner's Tours tab** shows the new tour within a second (same `glueBus` event projection used by the effort ledger).
6. Lead confirms via channel. Sales hits "Close deal" → room flips to `booked`, owner sees it on the KPI strip, room disappears from sellable inventory.
7. No call. No WhatsApp. Hotel-style.

## Technical changes

### `src/owner/lib/owner-registry.ts`
- `TruthPhase` → `'idle' | 'open' | 'warn1' | 'warn2' | 'warn3' | 'locked'` with thresholds `09:30 / 11:00 / 14:00 / 19:00 / 22:00`.
- `RoomStatus` → add `'held'` (alongside `vacant | vacating | occupied | blocked`).
- Overlay extensions:
  - `addedRooms: Record<pgId, OwnerRoom[]>` — supports owner-added rooms, max 12 per property enforced in `addRooms()`.
  - `addRooms(pgId, rows[])` (bulk), `removeRoom(roomId)`, `holdForGharpayy(roomId, on)`.
- `getRegistry()` merges `addedRooms` into each property's `rooms`.
- `lockedUnsellable` flips only when `phase === 'locked'` (post-22:00).

### `src/owner/pages/OwnerHome.tsx` (rewrite, replaces current seed-based file)
- Registry-driven; owner switch via `?id=OWN-XXXX`.
- Tab bar with `?tab=inventory|tours|blocks|activity`.
- Inventory tab — per-property card with row table + per-row "Hold" toggle + bulk header actions.
- "+ Add rooms" sheet — 12-row editable grid as described.
- Tours tab — subscribes to `glueBus` `visit.scheduled` / `visit.completed` events filtered to this owner via `lookupOwnerByRoomId`.
- Block-requests tab — ports list from existing `OwnerBlocks` (keeps decideBlock behavior).
- Activity tab — reuses `useOwnerEffort` (already built).

### `src/owner/pages/OwnerHub.tsx`
- Becomes a thin redirect to `/owner` (preserve old links).

### `src/owner/pages/SalesInventoryTruth.tsx`
- Show owner-added rooms automatically (they come through `getRegistry`).
- Render `held` rooms with a distinct "Held for Gharpayy" badge — still pitchable, but with a one-click "Close deal" CTA that flips status to `booked` via `patchRoom`.
- Stale (unverified, pre-22:00) rooms are dimmed but still listed.

### Visit / tour wiring
- `src/components/crm10x/DailyActionQueue.tsx` (and any other surface where "schedule visit" exists for a room) — ensure the emitted `glueBus` event payload includes `roomId` so the owner's Tours tab can project it. (Audit + tiny patch only.)

### Navigation (`src/components/AppShell.tsx`)
- Single Owner entry pointing to `/owner` (drop duplicate `/owner/hub` pin).
- "Inventory Truth" stays under Daily Run for sales.

## Out of scope

- No real backend; overlay remains in `localStorage` (matches the current architecture).
- No deal-payment flow (`booked` is a state flag; payments belong to a later phase).
- No multi-tenant auth — owner switching stays via the `?id=` param.

## Acceptance checks (the hotel end-to-end)

1. On `/owner`, pick any `OWN-XXXX`. Add 12 rooms to one property via the sheet. They appear instantly.
2. Toggle "Hold for Gharpayy" on 4 of them. They get the badge in **Sales Inventory Truth** immediately.
3. From the Daily Action Queue, schedule a tour on one of the held rooms. The owner's Tours tab shows it within ≤1 second.
4. From Inventory Truth, click "Close deal" on the same room. The room moves to `booked`; KPI strip on `/owner` updates Booked today +1; the room disappears from sellable count.
5. At 11:30 AM (simulated), the Truth strip says "warn-1" — rooms remain sellable. At 22:01 (simulated), unverified rooms become `lockedUnsellable` and drop out of Inventory Truth.
6. The escalation never silently kills a room at 11 AM — that hard rule is removed.
