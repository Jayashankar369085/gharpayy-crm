// @ts-nocheck
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { AdminLayout } from "@/referral-app/components/admin-layout";
import { useAdminStore } from "@/referral-app/lib/store";
import { useAdminGetLeads, AdminGetLeadsStatus } from "@/referral-app/api";
import { Input } from "@/referral-app/components/ui/input";
import { Button } from "@/referral-app/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/referral-app/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/referral-app/components/ui/table";
import { Badge } from "@/referral-app/components/ui/badge";
import { format } from "date-fns";
import { Search, ChevronRight, Filter } from "lucide-react";
import { Skeleton } from "@/referral-app/components/ui/skeleton";

export default function AdminLeads() {
  const [, setLocation] = useLocation();
  const { isAdminAuthenticated } = useAdminStore();
  const [statusFilter, setStatusFilter] = useState<AdminGetLeadsStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isAdminAuthenticated) {
      setLocation("/admin");
    }
  }, [isAdminAuthenticated, setLocation]);

  const { data: response, isLoading } = useAdminGetLeads({
    status: statusFilter === "ALL" ? undefined : statusFilter,
    limit: 100
  });

  if (!isAdminAuthenticated) return null;

  // Client-side search filtering
  const filteredLeads = response?.leads?.filter(lead => 
    lead.leadName.toLowerCase().includes(search.toLowerCase()) || 
    lead.leadPhone.includes(search) ||
    lead.referralId.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display text-slate-900">Leads Pipeline</h1>
            <p className="text-slate-500 mt-1">Manage and update status for all referred leads.</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search by name, phone, or ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <SelectValue placeholder="Filter Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="NEW">New</SelectItem>
                <SelectItem value="CONTACTED">Contacted</SelectItem>
                <SelectItem value="VERIFIED">Verified</SelectItem>
                <SelectItem value="VISIT">Scheduled Visit</SelectItem>
                <SelectItem value="BOOKED">Booked</SelectItem>
                <SelectItem value="CLOSED">Closed Won</SelectItem>
                <SelectItem value="LOST">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-3 md:hidden">
          {isLoading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 bg-white rounded-xl border border-slate-200 animate-pulse" />) : filteredLeads.map((lead) => (
            <button key={lead.id} onClick={() => setLocation(`/admin/leads/${lead.id}`)} className="bg-white rounded-xl border border-slate-200 p-4 text-left shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><p className="font-black text-slate-900 truncate">{lead.leadName}</p><p className="text-sm text-slate-500">{lead.leadPhone}</p></div>
                <StatusBadge status={lead.status} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <span className="rounded-lg bg-slate-50 p-2"><b>ID</b><br />{lead.referralId}</span>
                <span className="rounded-lg bg-orange-50 p-2"><b>Owner</b><br />{lead.assignedAgentName || "Unassigned"}</span>
                <span className="rounded-lg bg-slate-50 p-2"><b>Area</b><br />{lead.area || "Any"}</span>
                <span className="rounded-lg bg-slate-50 p-2"><b>Timeline</b><br />{lead.moveInTimeline.replace('_', ' ')}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Lead Details</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Referrer</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Timeline</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                      No leads found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead) => (
                    <TableRow key={lead.id} className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => setLocation(`/admin/leads/${lead.id}`)}>
                      <TableCell className="font-mono text-xs font-bold text-slate-500">
                        {lead.referralId}
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-slate-900">{lead.leadName}</div>
                        <div className="text-sm text-slate-500">{lead.leadPhone}</div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={lead.status} />
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {lead.referrerName || "Unknown"}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {lead.assignedAgentName || <span className="text-orange-600 font-bold">Unassigned</span>}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {lead.moveInTimeline.replace('_', ' ')}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {format(new Date(lead.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {response && (
            <div className="p-4 border-t border-slate-200 bg-slate-50 text-sm text-slate-500 flex justify-between items-center">
              <span>Showing {filteredLeads.length} of {response.total} leads</span>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export function StatusBadge({ status }: { status: string }) {
  let color = "bg-slate-100 text-slate-700 border-slate-200";
  
  switch(status) {
    case 'NEW': color = "bg-blue-100 text-blue-700 border-blue-200"; break;
    case 'CONTACTED': color = "bg-indigo-100 text-indigo-700 border-indigo-200"; break;
    case 'VERIFIED': color = "bg-amber-100 text-amber-800 border-amber-200"; break;
    case 'MATCHED': color = "bg-purple-100 text-purple-700 border-purple-200"; break;
    case 'VISIT': color = "bg-pink-100 text-pink-700 border-pink-200"; break;
    case 'BOOKED': color = "bg-green-100 text-green-800 border-green-200 shadow-sm"; break;
    case 'CLOSED': color = "bg-emerald-100 text-emerald-800 border-emerald-200"; break;
    case 'LOST': color = "bg-red-100 text-red-700 border-red-200"; break;
  }

  return (
    <Badge variant="outline" className={`font-bold text-[10px] uppercase tracking-wider ${color}`}>
      {status}
    </Badge>
  );
}