/**
 * Complete CRM API Client
 * Full-stack integration for all features
 */

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://localhost:3001/api';

// Types
export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source?: string;
  budget?: number;
  moveInDate?: string;
  preferredArea?: string;
  assignedTcmId?: string;
  stage: string;
  intent: string;
  confidence: number;
  tags?: string[];
  nextFollowUpAt?: string;
  responseSpeedMins: number;
  createdAt: string;
  updatedAt: string;
}

export interface FollowUp {
  id: string;
  leadId: string;
  tcmId: string;
  dueAt: string;
  priority: 'high' | 'medium' | 'low';
  reason?: string;
  done: number;
  completedAt?: string;
  createdAt: string;
  leadName?: string;
  tcmName?: string;
}

export interface Tour {
  id: string;
  leadId: string;
  propertyId?: string;
  tcmId: string;
  scheduledAt: string;
  status: string;
  decision?: string;
  postTourOutcome?: string;
  postTourConfidence?: number;
  postTourFilledAt?: string;
  createdAt: string;
  updatedAt: string;
  leadName?: string;
  tcmName?: string;
}

export interface Booking {
  id: string;
  leadId: string;
  tourId?: string;
  propertyId?: string;
  tcmId: string;
  amount: number;
  createdAt: string;
  leadName?: string;
  tcmName?: string;
}

export interface TCM {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  zone?: string;
  conversionRate: number;
  avgResponseMins: number;
  createdAt: string;
  leadCount?: number;
  tourCount?: number;
  bookingCount?: number;
  revenue?: number;
}

// ============ LEADS ============

export async function createLead(data: Partial<Lead>) {
  const response = await fetch(`${API_BASE}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error);
  }
  return response.json();
}

export async function getLeads(): Promise<Lead[]> {
  const response = await fetch(`${API_BASE}/leads`);
  if (!response.ok) throw new Error('Failed to fetch leads');
  return response.json();
}

export async function getLead(id: string): Promise<Lead> {
  const response = await fetch(`${API_BASE}/leads/${id}`);
  if (!response.ok) throw new Error('Lead not found');
  return response.json();
}

export async function updateLead(id: string, data: Partial<Lead>) {
  const response = await fetch(`${API_BASE}/leads/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update lead');
  return response.json();
}

export async function deleteLead(id: string) {
  const response = await fetch(`${API_BASE}/leads/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete lead');
  return response.json();
}

export async function checkDuplicate(phone?: string, email?: string) {
  const response = await fetch(`${API_BASE}/leads/check-duplicate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, email }),
  });
  if (!response.ok) throw new Error('Failed to check duplicate');
  return response.json();
}

export async function getDuplicates() {
  const response = await fetch(`${API_BASE}/leads/duplicates`);
  if (!response.ok) throw new Error('Failed to fetch duplicates');
  return response.json();
}

// ============ FOLLOW-UPS ============

export async function createFollowUp(data: Partial<FollowUp>) {
  const response = await fetch(`${API_BASE}/follow-ups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create follow-up');
  return response.json();
}

export async function getFollowUps(): Promise<FollowUp[]> {
  const response = await fetch(`${API_BASE}/follow-ups`);
  if (!response.ok) throw new Error('Failed to fetch follow-ups');
  return response.json();
}

export async function getOverdueFollowUps(): Promise<FollowUp[]> {
  const response = await fetch(`${API_BASE}/follow-ups/overdue`);
  if (!response.ok) throw new Error('Failed to fetch overdue follow-ups');
  return response.json();
}

export async function completeFollowUp(id: string) {
  const response = await fetch(`${API_BASE}/follow-ups/${id}/complete`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!response.ok) throw new Error('Failed to complete follow-up');
  return response.json();
}

// ============ TOURS ============

export async function createTour(data: Partial<Tour>) {
  const response = await fetch(`${API_BASE}/tours`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create tour');
  return response.json();
}

export async function getTours(): Promise<Tour[]> {
  const response = await fetch(`${API_BASE}/tours`);
  if (!response.ok) throw new Error('Failed to fetch tours');
  return response.json();
}

export async function updateTour(id: string, data: Partial<Tour>) {
  const response = await fetch(`${API_BASE}/tours/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update tour');
  return response.json();
}

// ============ BOOKINGS ============

export async function createBooking(data: Partial<Booking>) {
  const response = await fetch(`${API_BASE}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create booking');
  return response.json();
}

export async function getBookings(): Promise<Booking[]> {
  const response = await fetch(`${API_BASE}/bookings`);
  if (!response.ok) throw new Error('Failed to fetch bookings');
  return response.json();
}

// ============ TCMs (LEADERBOARD) ============

export async function createTCM(data: Partial<TCM>) {
  const response = await fetch(`${API_BASE}/tcms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create TCM');
  return response.json();
}

export async function getTCMs(): Promise<TCM[]> {
  const response = await fetch(`${API_BASE}/tcms`);
  if (!response.ok) throw new Error('Failed to fetch TCMs');
  return response.json();
}

// ============ DASHBOARD ============

export async function getDailySummary() {
  const response = await fetch(`${API_BASE}/dashboard/today`);
  if (!response.ok) throw new Error('Failed to fetch daily summary');
  return response.json();
}

export async function getDashboardStats() {
  const response = await fetch(`${API_BASE}/dashboard/stats`);
  if (!response.ok) throw new Error('Failed to fetch dashboard stats');
  return response.json();
}

// Health check
export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
export async function updateLead(id: string, data: any) {
  const response = await fetch(`${API_BASE}/leads/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to update lead");
  }

  return response.json();
}
