import { useEffect, useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import { predictLeadScore, type LeadScorePrediction } from '@/lib/lead-score-api';
import type { Lead, Tour } from '@/lib/types';
import { liveConfidence } from '@/lib/engine';
import { cn } from '@/lib/utils';

interface LeadScorePredictorProps {
  lead: Lead;
  tours: Tour[];
  now: number;
  compact?: boolean;
}

export function LeadScorePredictor({ lead, tours, now, compact = false }: LeadScorePredictorProps) {
  const [prediction, setPrediction] = useState<LeadScorePrediction | null>(null);
  const [loading, setLoading] = useState(true);

  const liveScore = useMemo(() => liveConfidence(lead, tours, now), [lead, tours, now]);

  useEffect(() => {
    const fetchPrediction = async () => {
      setLoading(true);
      try {
        const silenceHours = (now - new Date(lead.updatedAt).getTime()) / (60 * 60 * 1000);
        const moveInDate = new Date(lead.moveInDate);
        const moveInDays = (moveInDate.getTime() - now) / (24 * 60 * 60 * 1000);

        const pred = await predictLeadScore({
          leadId: lead.id,
          confidence: lead.confidence,
          intent: lead.intent,
          responseTime: lead.responseSpeedMins,
          silenceHours,
          hasFollowUp: !!lead.nextFollowUpAt,
          moveInDays,
        });

        setPrediction(pred);
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
  }, [lead, now]);

  const scoreColor = (score: number) => {
    if (score >= 75) return 'text-success';
    if (score >= 50) return 'text-warning-foreground';
    return 'text-destructive';
  };

  const scoreBg = (score: number) => {
    if (score >= 75) return 'bg-success/10 border-success/30';
    if (score >= 50) return 'bg-warning/10 border-warning/30';
    return 'bg-destructive/10 border-destructive/30';
  };

  if (compact) {
    return (
      <div className={cn('rounded-lg border p-2 text-xs', scoreBg(prediction?.score ?? liveScore))}>
        <div className="flex items-center justify-between">
          <span className="font-semibold">AI Score</span>
          <span className={cn('font-bold tabular-nums', scoreColor(prediction?.score ?? liveScore))}>
            {prediction?.score ?? Math.round(liveScore)}
          </span>
        </div>
        {prediction && (
          <div className="mt-1 text-[10px] text-muted-foreground">
            Conv: {prediction.predictedConversion}% · Decay: {prediction.decayRate}%/day
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={cn('p-4', scoreBg(prediction?.score ?? liveScore))}>
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-info" />
            <h3 className="font-semibold text-sm">Lead Score Predictor</h3>
          </div>
          {loading && <Badge variant="outline" className="text-[10px]">Analyzing...</Badge>}
        </div>

        {prediction && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[11px] text-muted-foreground">AI Score</div>
                <div className={cn('text-2xl font-bold tabular-nums', scoreColor(prediction.score))}>
                  {prediction.score}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground">Conversion Prob.</div>
                <div className="text-lg font-semibold">{prediction.predictedConversion}%</div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="text-muted-foreground">Decay Rate</span>
                <span className="font-mono">{prediction.decayRate}%/day</span>
              </div>
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="text-muted-foreground">Primary Objection</span>
                <Badge variant="outline" className="text-[9px]">
                  {prediction.objectionAnalysis.primary}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="text-muted-foreground">Objection Count</span>
                <span className="font-mono">{prediction.objectionAnalysis.count}</span>
              </div>
            </div>

            {prediction.score >= 75 && (
              <div className="flex items-start gap-2 rounded-md bg-success/5 p-2 text-[10px]">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-success shrink-0" />
                <span>High conversion probability. Prioritize follow-up today.</span>
              </div>
            )}

            {prediction.score < 50 && (
              <div className="flex items-start gap-2 rounded-md bg-destructive/5 p-2 text-[10px]">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 text-destructive shrink-0" />
                <span>Low probability. May need alternative property or deeper follow-up.</span>
              </div>
            )}

            <div className="text-[9px] text-muted-foreground">
              Recalc: {new Date(prediction.nextRecalcAt).toLocaleTimeString()}
            </div>
          </>
        )}

        {!prediction && !loading && (
          <div className="text-[10px] text-muted-foreground">
            <Zap className="h-3 w-3 inline mr-1" />
            Fallback scoring active
          </div>
        )}
      </div>
    </Card>
  );
}
