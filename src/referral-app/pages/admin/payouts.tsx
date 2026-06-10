// @ts-nocheck
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { AdminLayout } from "@/referral-app/components/admin-layout";
import { useAdminStore } from "@/referral-app/lib/store";
import { useAdminGetPayouts, useAdminApprovePayout, useAdminMarkPayoutPaid, getAdminGetPayoutsQueryKey } from "@/referral-app/api";
import { Button } from "@/referral-app/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/referral-app/components/ui/table";
import { Badge } from "@/referral-app/components/ui/badge";
import { format } from "date-fns";
import { CheckCircle2, Clock, IndianRupee, Send } from "lucide-react";
import { Skeleton } from "@/referral-app/components/ui/skeleton";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminPayouts() {
  const [, setLocation] = useLocation();
  const { isAdminAuthenticated } = useAdminStore();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("PENDING");

  useEffect(() => {
    if (!isAdminAuthenticated) {
      setLocation("/admin");
    }
  }, [isAdminAuthenticated, setLocation]);

  const { data: payouts, isLoading } = useAdminGetPayouts({ status: filter as any });
  const approvePayout = useAdminApprovePayout();
  const markPaid = useAdminMarkPayoutPaid();

  if (!isAdminAuthenticated) return null;

  const handleApprove = (id: number) => {
    approvePayout.mutate({ payoutId: id }, {
      onSuccess: () => {
        toast.success("Payout approved");
        queryClient.invalidateQueries({ queryKey: getAdminGetPayoutsQueryKey({ status: filter as any }) });
      },
      onError: (err) => toast.error(err.message || "Failed to approve")
    });
  };

  const handleMarkPaid = (id: number) => {
    markPaid.mutate({ payoutId: id }, {
      onSuccess: () => {
        toast.success("Payout marked as paid");
        queryClient.invalidateQueries({ queryKey: getAdminGetPayoutsQueryKey({ status: filter as any }) });
      },
      onError: (err) => toast.error(err.message || "Failed to mark paid")
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-display text-slate-900">Payout Management</h1>
          <p className="text-slate-500 mt-1">Review and process referrer rewards.</p>
        </div>

        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-full max-w-md">
          {["PENDING", "APPROVED", "PAID"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Referrer</TableHead>
                  <TableHead>Lead Context</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date Generated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-24 ml-auto rounded-md" /></TableCell>
                    </TableRow>
                  ))
                ) : !payouts || payouts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <IndianRupee className="w-12 h-12 text-slate-200 mb-2" />
                        <p>No {filter.toLowerCase()} payouts found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  payouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell>
                        <div className="font-bold text-slate-900">{payout.referrerName}</div>
                        <div className="text-sm text-slate-500 font-mono">{payout.referrerPhone}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-bold text-slate-700">{payout.leadName}</div>
                        <div className="text-xs text-slate-500 font-mono">{payout.referralId}</div>
                      </TableCell>
                      <TableCell>
                        <span className="text-lg font-black text-green-600">₹{payout.amount}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] uppercase font-bold ${payout.type === 'BOOKING_BONUS' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                          {payout.type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {format(new Date(payout.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        {payout.status === 'PENDING' && (
                          <Button 
                            size="sm" 
                            className="bg-primary hover:bg-primary/90 text-white"
                            onClick={() => handleApprove(payout.id)}
                            disabled={approvePayout.isPending}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                          </Button>
                        )}
                        {payout.status === 'APPROVED' && (
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleMarkPaid(payout.id)}
                            disabled={markPaid.isPending}
                          >
                            <Send className="w-4 h-4 mr-1" /> Mark Paid
                          </Button>
                        )}
                        {payout.status === 'PAID' && (
                          <div className="flex items-center justify-end text-green-600 font-bold text-sm gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Paid
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}