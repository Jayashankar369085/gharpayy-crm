import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, Users, CheckCircle2, PhoneCall, Calendar, 
  DollarSign, AlertCircle, Zap 
} from 'lucide-react';
import { getDailySummary, getDashboardStats } from '@/lib/crm-api-client';
import { cn } from '@/lib/utils';

interface DailySummaryData {
  date: string;
  summary: {
    newLeadsCount: number;
    followUpsDueCount: number;
    followUpsDoneCount: number;
    toursScheduledCount: number;
    toursCompletedCount: number;
    bookingsCount: number;
    totalRevenue: number;
  };
  details: {
    newLeads: any[];
    followUpsDue: any[];
    followUpsDone: any[];
    tourScheduled: any[];
    toursCompleted: any[];
    bookings: any[];
  };
}

interface DashboardStats {
  todayNewLeads: number;
  pendingFollowUps: number;
  todayBookings: number;
  todayRevenue: number;
  totalLeads: number;
  activeTours: number;
}

export function DailySummaryDashboard() {
  const [summary, setSummary] = useState<DailySummaryData | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, statsData] = await Promise.all([
        getDailySummary(),
        getDashboardStats()
      ]);
      setSummary(summaryData);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">Loading daily summary...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-destructive/50 bg-destructive/5">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
        <StatCard
          icon={Users}
          label="New Leads"
          value={stats?.todayNewLeads || 0}
          color="text-blue-500"
        />
        <StatCard
          icon={PhoneCall}
          label="Pending Follow-ups"
          value={stats?.pendingFollowUps || 0}
          color="text-orange-500"
          alert={stats && stats.pendingFollowUps > 0}
        />
        <StatCard
          icon={CheckCircle2}
          label="Bookings Today"
          value={stats?.todayBookings || 0}
          color="text-green-500"
        />
        <StatCard
          icon={DollarSign}
          label="Today's Revenue"
          value={`₹${(stats?.todayRevenue || 0).toLocaleString('en-IN')}`}
          color="text-green-600"
        />
        <StatCard
          icon={Users}
          label="Total Leads"
          value={stats?.totalLeads || 0}
          color="text-purple-500"
        />
        <StatCard
          icon={Calendar}
          label="Active Tours"
          value={stats?.activeTours || 0}
          color="text-indigo-500"
        />
      </div>

      {/* Detailed Tabs */}
      <Card>
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-6 border-b rounded-none">
            <TabsTrigger value="today" className="text-xs">Today</TabsTrigger>
            <TabsTrigger value="leads" className="text-xs">
              New Leads ({summary?.summary.newLeadsCount || 0})
            </TabsTrigger>
            <TabsTrigger value="followups" className="text-xs">
              Follow-ups ({summary?.summary.followUpsDueCount || 0})
            </TabsTrigger>
            <TabsTrigger value="tours" className="text-xs">
              Tours ({summary?.summary.toursScheduledCount || 0})
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs">
              Completed ({summary?.summary.toursCompletedCount || 0})
            </TabsTrigger>
            <TabsTrigger value="bookings" className="text-xs">
              Bookings ({summary?.summary.bookingsCount || 0})
            </TabsTrigger>
          </TabsList>

          {/* Today Overview */}
          <TabsContent value="today" className="p-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <SummaryBox
                label="New Leads"
                value={summary?.summary.newLeadsCount || 0}
                icon={Users}
              />
              <SummaryBox
                label="Follow-ups Due"
                value={summary?.summary.followUpsDueCount || 0}
                icon={PhoneCall}
              />
              <SummaryBox
                label="Follow-ups Done"
                value={summary?.summary.followUpsDoneCount || 0}
                icon={CheckCircle2}
                accent
              />
              <SummaryBox
                label="Revenue"
                value={`₹${(summary?.summary.totalRevenue || 0).toLocaleString('en-IN')}`}
                icon={DollarSign}
              />
            </div>
          </TabsContent>

          {/* New Leads */}
          <TabsContent value="leads" className="p-4">
            {summary?.details.newLeads.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No new leads today</div>
            ) : (
              <div className="space-y-2">
                {summary?.details.newLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-2 border rounded text-sm">
                    <div>
                      <div className="font-medium">{lead.name}</div>
                      <div className="text-[11px] text-muted-foreground">{lead.phone} · {lead.preferredArea}</div>
                    </div>
                    <Badge>{lead.intent}</Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Follow-ups */}
          <TabsContent value="followups" className="p-4">
            {summary?.details.followUpsDue.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No follow-ups due today</div>
            ) : (
              <div className="space-y-2">
                {summary?.details.followUpsDue.map((fu) => (
                  <div key={fu.id} className="flex items-center justify-between p-2 border rounded text-sm">
                    <div>
                      <div className="font-medium">{fu.leadName}</div>
                      <div className="text-[11px] text-muted-foreground">{fu.reason} · {fu.tcmName}</div>
                    </div>
                    <Badge 
                      variant={fu.priority === 'high' ? 'destructive' : fu.priority === 'medium' ? 'default' : 'secondary'}
                    >
                      {fu.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tours Scheduled */}
          <TabsContent value="tours" className="p-4">
            {summary?.details.tourScheduled.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No tours scheduled for today</div>
            ) : (
              <div className="space-y-2">
                {summary?.details.tourScheduled.map((tour) => (
                  <div key={tour.id} className="flex items-center justify-between p-2 border rounded text-sm">
                    <div>
                      <div className="font-medium">{tour.leadName}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {new Date(tour.scheduledAt).toLocaleTimeString()} · {tour.tcmName}
                      </div>
                    </div>
                    <Badge>{tour.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tours Completed */}
          <TabsContent value="completed" className="p-4">
            {summary?.details.toursCompleted.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No tours completed today</div>
            ) : (
              <div className="space-y-2">
                {summary?.details.toursCompleted.map((tour) => (
                  <div key={tour.id} className="flex items-center justify-between p-2 border rounded text-sm">
                    <div>
                      <div className="font-medium">{tour.leadName}</div>
                      <div className="text-[11px] text-muted-foreground">{tour.tcmName}</div>
                    </div>
                    <Badge variant="secondary">{tour.decision || 'Pending'}</Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Bookings */}
          <TabsContent value="bookings" className="p-4">
            {summary?.details.bookings.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No bookings today</div>
            ) : (
              <div className="space-y-2">
                {summary?.details.bookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-2 border rounded text-sm">
                    <div>
                      <div className="font-medium">{booking.leadName}</div>
                      <div className="text-[11px] text-muted-foreground">{booking.tcmName}</div>
                    </div>
                    <div className="font-semibold text-success">₹{booking.amount.toLocaleString('en-IN')}</div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color,
  alert
}: { 
  icon: any; 
  label: string; 
  value: string | number; 
  color: string;
  alert?: boolean;
}) {
  return (
    <Card className={cn(
      'p-3 space-y-2',
      alert && 'border-orange-200 bg-orange-50'
    )}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
        <Icon className={cn('h-4 w-4', color)} />
      </div>
      <div className="text-xl font-bold">{value}</div>
      {alert && (
        <div className="text-[10px] text-orange-600">
          <Zap className="h-3 w-3 inline mr-1" />
          Needs attention
        </div>
      )}
    </Card>
  );
}

function SummaryBox({
  label,
  value,
  icon: Icon,
  accent
}: {
  label: string;
  value: string | number;
  icon: any;
  accent?: boolean;
}) {
  return (
    <div className={cn(
      'rounded-lg p-3 text-center',
      accent ? 'bg-success/10 border border-success/20' : 'bg-muted'
    )}>
      <Icon className={cn('h-5 w-5 mx-auto mb-2', accent ? 'text-success' : 'text-muted-foreground')} />
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-[10px] text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
