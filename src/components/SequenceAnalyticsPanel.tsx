import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, TrendingUp, Zap, ArrowRight } from 'lucide-react';
import {
  getSequenceAnalytics,
  suggestNextSequence,
  SEQUENCE_BENCHMARKS,
  type SequenceAnalytics,
} from '@/lib/sequence-analytics-api';
import type { Lead } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SequenceAnalyticsPanelProps {
  lead: Lead;
  sequenceId?: string;
  onRoutingChange?: (nextSequence: string, reason: string) => void;
  compact?: boolean;
}

export function SequenceAnalyticsPanel({
  lead,
  sequenceId,
  onRoutingChange,
  compact = false,
}: SequenceAnalyticsPanelProps) {
  const [analytics, setAnalytics] = useState<SequenceAnalytics | null>(null);
  const [loading, setLoading] = useState(!!sequenceId);
  const [routing, setRouting] = useState<{ nextSequence: string; reason: string } | null>(null);

  useEffect(() => {
    if (!sequenceId) return;

    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const data = await getSequenceAnalytics(sequenceId);
        if (data) {
          setAnalytics(data);
          const suggestion = suggestNextSequence(lead, data);
          if (suggestion) {
            setRouting(suggestion);
            onRoutingChange?.(suggestion.nextSequence, suggestion.reason);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [sequenceId, lead, onRoutingChange]);

  if (!analytics && loading) {
    return (
      <Card className="p-3">
        <div className="text-xs text-muted-foreground">Loading sequence analytics...</div>
      </Card>
    );
  }

  if (!analytics) {
    return null;
  }

  const benchmark = SEQUENCE_BENCHMARKS[analytics.sequenceKind];
  const replyRatePct = parseFloat(analytics.engagement.replyRate);
  const conversionRatePct = analytics.conversionRate;

  const engagementLevel = (() => {
    if (replyRatePct >= (benchmark?.averageReplyRate ?? 70)) return 'high';
    if (replyRatePct >= (benchmark?.averageReplyRate ?? 50) * 0.7) return 'medium';
    return 'low';
  })();

  const engagementColor = {
    high: 'text-success',
    medium: 'text-warning-foreground',
    low: 'text-destructive',
  }[engagementLevel];

  if (compact) {
    return (
      <div className="rounded-lg border border-border bg-card p-2 text-xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Sequence</span>
          <Badge variant="outline" className="text-[10px]">{analytics.sequenceKind}</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Engagement</span>
          <span className={cn('font-semibold', engagementColor)}>{replyRatePct}% replies</span>
        </div>
        {routing && (
          <div className="flex items-center gap-1 text-[10px] text-info">
            <ArrowRight className="h-3 w-3" />
            Next: {routing.nextSequence}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-info" />
          <h3 className="font-semibold text-sm">Sequence Analytics</h3>
        </div>
        <Badge variant="outline" className="text-[10px]">{analytics.status}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[11px] text-muted-foreground">Messages Sent</div>
          <div className="font-bold tabular-nums text-lg">{analytics.messagesSent}</div>
        </div>
        <div>
          <div className="text-[11px] text-muted-foreground">Replies</div>
          <div className="font-bold tabular-nums text-lg">{analytics.repliesReceived}</div>
        </div>
        <div>
          <div className="text-[11px] text-muted-foreground">Reply Rate</div>
          <div className={cn('font-bold tabular-nums', engagementColor)}>
            {analytics.engagement.replyRate}%
          </div>
        </div>
        <div>
          <div className="text-[11px] text-muted-foreground">Conversion</div>
          <div className="font-bold tabular-nums">
            {analytics.conversionRate.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="space-y-1.5 border-t border-border pt-3">
        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Benchmarks
        </div>
        <div className="text-[10px] space-y-1">
          <div className="flex justify-between">
            <span>Avg Reply Rate</span>
            <span className="text-muted-foreground">{benchmark?.averageReplyRate ?? 'N/A'}%</span>
          </div>
          <div className="flex justify-between">
            <span>Avg Conversion</span>
            <span className="text-muted-foreground">{benchmark?.averageConversionRate ?? 'N/A'}%</span>
          </div>
          <div className="flex justify-between">
            <span>Your Performance</span>
            <span className={cn(
              'font-semibold',
              conversionRatePct >= (benchmark?.averageConversionRate ?? 20) ? 'text-success' : 'text-warning-foreground'
            )}>
              {conversionRatePct >= (benchmark?.averageConversionRate ?? 20) ? '✓ Above' : '✗ Below'} avg
            </span>
          </div>
        </div>
      </div>

      {routing && (
        <div className="rounded-lg bg-info/10 border border-info/30 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-info" />
            <span className="text-[11px] font-semibold">Intelligent Routing</span>
          </div>
          <div className="text-[10px] text-muted-foreground">
            <strong>{routing.reason}</strong>
          </div>
          {routing.nextSequence !== 'none' && (
            <Button size="sm" className="w-full h-7 text-[11px]">
              <ArrowRight className="h-3 w-3 mr-1" />
              Start {routing.nextSequence} sequence
            </Button>
          )}
          {routing.nextSequence === 'none' && (
            <div className="text-[10px] text-destructive">
              No more automated touches. Escalate to manual follow-up.
            </div>
          )}
        </div>
      )}

      {analytics.startedAt && (
        <div className="text-[9px] text-muted-foreground">
          Started: {new Date(analytics.startedAt).toLocaleString()}
        </div>
      )}
    </Card>
  );
}
