/**
 * Lead Score Predictor API Client
 * Integrates with backend to provide AI-powered lead quality scoring
 */

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export interface LeadScorePrediction {
  id: string;
  leadId: string;
  score: number; // 0-100
  confidence: number; // 0-100
  predictedConversion: string; // percentage
  decayRate: string; // percentage per day
  nextRecalcAt: string;
  objectionAnalysis: {
    count: number;
    primary: string;
  };
}

export interface LeadScoreInput {
  leadId: string;
  confidence?: number;
  intent?: 'hot' | 'warm' | 'cold';
  responseTime?: number; // in minutes
  silenceHours?: number;
  hasFollowUp?: boolean;
  moveInDays?: number;
  objections?: Record<string, number>;
}

export async function predictLeadScore(input: LeadScoreInput): Promise<LeadScorePrediction> {
  try {
    const response = await fetch(`${API_BASE}/lead-scores/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  } catch (error) {
    console.error('Lead score prediction failed:', error);
    // Fallback to client-side calculation
    return fallbackLeadScore(input);
  }
}

export async function getLeadScore(leadId: string): Promise<LeadScorePrediction | null> {
  try {
    const response = await fetch(`${API_BASE}/lead-scores/${leadId}`);
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('Failed to fetch lead score:', error);
    return null;
  }
}

// Fallback client-side scoring when backend is unavailable
function fallbackLeadScore(input: LeadScoreInput): LeadScorePrediction {
  const {
    confidence = 50,
    intent = 'warm',
    responseTime = 10,
    silenceHours = 0,
    hasFollowUp = true,
    moveInDays = 7,
    objections = {},
  } = input;

  let score = confidence;

  const intentMultiplier = intent === 'hot' ? 1.3 : intent === 'warm' ? 1.0 : 0.7;
  score *= intentMultiplier;

  if (responseTime > 5) {
    score -= Math.min(15, (responseTime - 5) * 0.5);
  }

  if (silenceHours > 6) {
    score -= Math.min(25, (silenceHours - 6) * 1.5);
  }

  if (hasFollowUp) {
    score += 10;
  } else {
    score -= 5;
  }

  if (moveInDays < 0) {
    score -= 8;
  } else if (moveInDays <= 3) {
    score += 12;
  } else if (moveInDays >= 14) {
    score -= 3;
  }

  const objectionCount = Object.keys(objections).length;
  if (objectionCount > 3) {
    score -= objectionCount * 2;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const decayFactor = 0.95;
  const predictedConversion = (score / 100) * 100;

  return {
    id: `fallback-${Date.now()}`,
    leadId: input.leadId,
    score,
    confidence,
    predictedConversion: predictedConversion.toFixed(1),
    decayRate: '5.0',
    nextRecalcAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    objectionAnalysis: {
      count: objectionCount,
      primary: Object.entries(objections).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none',
    },
  };
}
