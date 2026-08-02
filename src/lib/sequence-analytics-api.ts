/**
 * Sequence Analytics API Client
 * Intelligent WhatsApp sequence automation with performance tracking
 */

const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://localhost:3001/api';

export interface SequenceAnalytics {
  id: string;
  leadId: string;
  sequenceKind: string;
  status: 'active' | 'paused' | 'completed' | 'stopped';
  startedAt: string;
  completedAt?: string;
  messagesSent: number;
  repliesReceived: number;
  clickRate: number;
  conversionRate: number;
  engagement: {
    replyRate: string;
    avgTimeToReply: string;
  };
}

export interface SequenceStartInput {
  leadId: string;
  sequenceKind: 'post-tour' | 'pre-decision' | 'cold-revival' | 'first-contact';
  tcmId: string;
}

export async function startSequenceTracking(input: SequenceStartInput): Promise<{ id: string }> {
  try {
    const response = await fetch(`${API_BASE}/sequences/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  } catch (error) {
    console.error('Failed to start sequence tracking:', error);
    return { id: `local-${Date.now()}` };
  }
}

export async function recordSequenceMessage(
  sequenceId: string,
  data: { sent?: boolean; received?: boolean; clicked?: boolean }
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/sequences/${sequenceId}/record-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);
  } catch (error) {
    console.error('Failed to record sequence message:', error);
  }
}

export async function getSequenceAnalytics(sequenceId: string): Promise<SequenceAnalytics | null> {
  try {
    const response = await fetch(`${API_BASE}/sequences/${sequenceId}/analytics`);
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('Failed to fetch sequence analytics:', error);
    return null;
  }
}

// Condition-based routing for sequences
export interface SequenceRoutingRule {
  condition: (lead: any, engagement: SequenceAnalytics) => boolean;
  nextSequence: string;
  reason: string;
}

export const SEQUENCE_ROUTING_RULES: SequenceRoutingRule[] = [
  {
    condition: (lead, eng) => eng.repliesReceived === 0 && eng.messagesSent >= 3,
    nextSequence: 'cold-revival',
    reason: 'No reply after 3 messages',
  },
  {
    condition: (lead, eng) => eng.repliesReceived > 0 && parseFloat(eng.conversionRate) > 70,
    nextSequence: 'pre-decision',
    reason: 'High engagement detected',
  },
  {
    condition: (lead, eng) => eng.messagesSent >= 2 && eng.repliesReceived > 0,
    nextSequence: 'post-tour',
    reason: 'Active conversation',
  },
  {
    condition: (lead, eng) => eng.repliesReceived === 0 && eng.messagesSent >= 5,
    nextSequence: 'none',
    reason: 'No response after 5 touches - escalate to manual',
  },
];

export function suggestNextSequence(
  lead: any,
  engagement: SequenceAnalytics
): { nextSequence: string; reason: string } | null {
  for (const rule of SEQUENCE_ROUTING_RULES) {
    if (rule.condition(lead, engagement)) {
      return { nextSequence: rule.nextSequence, reason: rule.reason };
    }
  }
  return null;
}

// Performance metrics per sequence kind
export interface SequencePerformanceMetrics {
  sequenceKind: string;
  averageReplyRate: number;
  averageClickRate: number;
  averageConversionRate: number;
  totalSequencesRun: number;
  totalBookings: number;
}

export const SEQUENCE_BENCHMARKS: Record<string, SequencePerformanceMetrics> = {
  'post-tour': {
    sequenceKind: 'post-tour',
    averageReplyRate: 75,
    averageClickRate: 45,
    averageConversionRate: 35,
    totalSequencesRun: 0,
    totalBookings: 0,
  },
  'pre-decision': {
    sequenceKind: 'pre-decision',
    averageReplyRate: 68,
    averageClickRate: 40,
    averageConversionRate: 28,
    totalSequencesRun: 0,
    totalBookings: 0,
  },
  'cold-revival': {
    sequenceKind: 'cold-revival',
    averageReplyRate: 22,
    averageClickRate: 8,
    averageConversionRate: 5,
    totalSequencesRun: 0,
    totalBookings: 0,
  },
  'first-contact': {
    sequenceKind: 'first-contact',
    averageReplyRate: 85,
    averageClickRate: 60,
    averageConversionRate: 42,
    totalSequencesRun: 0,
    totalBookings: 0,
  },
};
