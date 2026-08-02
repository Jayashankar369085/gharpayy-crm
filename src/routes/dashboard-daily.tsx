import { createFileRoute } from '@tanstack/react-router';
import { AppShell } from '@/components/AppShell';
import { DailySummaryDashboard } from '@/components/DailySummaryDashboard';
import { BarChart3, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export const Route = createFileRoute('/dashboard-daily')({
  head: () => ({
    meta: [
      { title: 'Daily Summary — Gharpayy' },
      { name: 'description', content: 'Today\'s leads, follow-ups, tours, bookings and revenue aggregated from database' },
    ],
  }),
  component: () => <DailySummaryRoute />,
});

function DailySummaryRoute() {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-semibold tracking-tight inline-flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-info" /> Daily Summary
            </h1>
            <p className="text-sm text-muted-foreground">
              Today's leads, follow-ups, tours, bookings and revenue aggregated from database
            </p>
          </div>
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <DailySummaryDashboard key={refreshing ? 'refreshed' : 'default'} />
      </div>
    </AppShell>
  );
}
