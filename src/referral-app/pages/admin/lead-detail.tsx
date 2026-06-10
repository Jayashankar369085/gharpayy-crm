// @ts-nocheck
import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { AdminLayout } from "@/referral-app/components/admin-layout";
import { useAdminStore } from "@/referral-app/lib/store";
import { 
  useAdminGetLead, 
  useAdminUpdateLeadStatus, 
  useAdminAddLeadNote, 
  getAdminGetLeadQueryKey,
  GHARPAYY_AGENTS,
  UpdateLeadStatusBodyStatus,
  AddLeadNoteBodyType
} from "@/referral-app/api";
import { Button } from "@/referral-app/components/ui/button";
import { Input } from "@/referral-app/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/referral-app/components/ui/select";
import { Textarea } from "@/referral-app/components/ui/textarea";
import { Skeleton } from "@/referral-app/components/ui/skeleton";
import { ArrowLeft, User, Phone, MapPin, Calendar, Clock, Edit3, Send } from "lucide-react";
import { StatusBadge } from "./leads";
import { format } from "date-fns";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminLeadDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { isAdminAuthenticated } = useAdminStore();
  const queryClient = useQueryClient();

  const [newStatus, setNewStatus] = useState<UpdateLeadStatusBodyStatus | "">("");
  const [assignedAgentId, setAssignedAgentId] = useState<string>("");
  const [statusNote, setStatusNote] = useState("");
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    if (!isAdminAuthenticated) {
      setLocation("/admin");
    }
  }, [isAdminAuthenticated, setLocation]);

  const leadId = parseInt(id || "0", 10);
  const { data: lead, isLoading } = useAdminGetLead(leadId, {
    query: { enabled: !!leadId && isAdminAuthenticated } as any
  });

  const updateStatus = useAdminUpdateLeadStatus();
  const addNote = useAdminAddLeadNote();

  useEffect(() => {
    if (lead && newStatus === "") {
      setNewStatus(lead.status as UpdateLeadStatusBodyStatus);
      setAssignedAgentId(lead.assignedAgentId ? String(lead.assignedAgentId) : "");
    }
  }, [lead, newStatus]);

  if (!isAdminAuthenticated || !id) return null;

  const handleUpdateStatus = () => {
    if (!newStatus || (newStatus === lead?.status && (!assignedAgentId || Number(assignedAgentId) === lead?.assignedAgentId))) return;
    
    updateStatus.mutate({
      leadId,
      data: {
        status: newStatus,
        assignedAgentId: assignedAgentId ? Number(assignedAgentId) : undefined,
        note: statusNote || undefined
      }
    }, {
      onSuccess: () => {
        toast.success(`Status updated to ${newStatus}`);
        setStatusNote("");
        queryClient.invalidateQueries({ queryKey: getAdminGetLeadQueryKey(leadId) });
      },
      onError: (err) => toast.error(err.message || "Failed to update status")
    });
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    
    addNote.mutate({
      leadId,
      data: {
        note: newNote,
        type: AddLeadNoteBodyType.NOTE,
        agentName: "Admin User"
      }
    }, {
      onSuccess: () => {
        toast.success("Note added");
        setNewNote("");
        queryClient.invalidateQueries({ queryKey: getAdminGetLeadQueryKey(leadId) });
      },
      onError: (err) => toast.error(err.message || "Failed to add note")
    });
  };

  if (isLoading || !lead) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-32" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 rounded-xl" />
              <Skeleton className="h-96 rounded-xl" />
            </div>
            <Skeleton className="h-[500px] rounded-xl" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <button 
          onClick={() => setLocation("/admin/leads")}
          className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Pipeline
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold font-display text-slate-900">{lead.leadName}</h1>
              <StatusBadge status={lead.status} />
            </div>
            <p className="text-slate-500 font-mono text-sm">ID: {lead.referralId} • Added {format(new Date(lead.createdAt), "MMM d, yyyy")}</p>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">
              {lead.referrerName ? lead.referrerName.charAt(0).toUpperCase() : "?"}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Referred By</p>
              <p className="font-bold text-slate-900">{lead.referrerName || "Anonymous"}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Action Card: Status Update */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-800 flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                Update Lead Status
              </div>
              <div className="p-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="w-full sm:w-1/3">
                    <label className="text-sm font-bold text-slate-700 block mb-2">New Status</label>
                    <Select value={newStatus} onValueChange={(v: any) => setNewStatus(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NEW">New</SelectItem>
                        <SelectItem value="CONTACTED">Contacted</SelectItem>
                        <SelectItem value="VERIFIED">Verified (Pays ₹50)</SelectItem>
                        <SelectItem value="VISIT">Scheduled Visit</SelectItem>
                        <SelectItem value="BOOKED">Booked (Pays ₹500)</SelectItem>
                        <SelectItem value="CLOSED">Closed Won</SelectItem>
                        <SelectItem value="LOST">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 w-full">
                    <label className="text-sm font-bold text-slate-700 block mb-2">Status Note (Optional)</label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Reason for status change..." 
                        value={statusNote}
                        onChange={(e) => setStatusNote(e.target.value)}
                      />
                      <Button 
                        onClick={handleUpdateStatus} 
                        disabled={newStatus === lead.status || updateStatus.isPending}
                        className="shrink-0"
                      >
                        {updateStatus.isPending ? "Updating..." : "Update"}
                      </Button>
                    </div>
                  </div>
                </div>
                
                {newStatus === 'VERIFIED' && lead.status !== 'VERIFIED' && (
                  <p className="mt-3 text-sm text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
                    ⚠️ Changing to VERIFIED will generate a ₹50 payout for the referrer.
                  </p>
                )}
                {newStatus === 'BOOKED' && lead.status !== 'BOOKED' && (
                  <p className="mt-3 text-sm text-green-600 bg-green-50 p-2 rounded border border-green-100">
                    💰 Changing to BOOKED will generate a ₹500 payout for the referrer.
                  </p>
                )}
              </div>
            </div>

            {/* Internal Notes */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Internal Notes & Timeline
                </div>
              </div>
              <div className="p-6">
                <div className="mb-6 flex gap-2">
                  <Textarea 
                    placeholder="Add an internal note or call log..." 
                    className="resize-none h-20"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                  />
                  <Button 
                    className="h-20 w-20 shrink-0 flex flex-col items-center justify-center gap-1"
                    onClick={handleAddNote}
                    disabled={addNote.isPending || !newNote.trim()}
                  >
                    <Send className="w-4 h-4" />
                    <span>Add</span>
                  </Button>
                </div>

                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-200">
                  {lead.notes.map((note) => (
                    <div key={note.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 text-slate-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                        {note.type === 'STATUS_CHANGE' ? <Edit3 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-slate-900 text-sm">{note.createdByName}</span>
                          <time className="text-xs text-slate-500">{format(new Date(note.createdAt), "MMM d, h:mm a")}</time>
                        </div>
                        <p className="text-sm text-slate-700">{note.note}</p>
                      </div>
                    </div>
                  ))}
                  {lead.notes.length === 0 && (
                    <div className="text-center py-8 text-slate-500 italic relative z-10 bg-white border border-dashed border-slate-200 rounded-xl">
                      No notes yet. Add the first one above.
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Lead Details */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-orange-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-orange-100 bg-orange-50 font-bold text-orange-900 flex items-center gap-2">
                Lead Owner
              </div>
              <div className="p-4 space-y-3">
                <p className="text-sm text-slate-600">Route this lead to the right Gharpayy expert for calling, matching and visit scheduling.</p>
                <Select value={assignedAgentId} onValueChange={setAssignedAgentId}>
                  <SelectTrigger><SelectValue placeholder="Assign expert" /></SelectTrigger>
                  <SelectContent>
                    {GHARPAYY_AGENTS.map((agent) => (
                      <SelectItem key={agent.id} value={String(agent.id)}>{agent.name} · {agent.activeLeads} active</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleUpdateStatus} className="w-full" disabled={updateStatus.isPending || (!assignedAgentId && newStatus === lead.status)}>
                  {updateStatus.isPending ? "Saving..." : "Save assignment"}
                </Button>
                {lead.assignedAgentName && <p className="text-xs font-bold text-green-700 bg-green-50 border border-green-100 rounded-lg p-2">Currently assigned to {lead.assignedAgentName}</p>}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-800 flex items-center gap-2">
                <User className="w-4 h-4" />
                Contact Info
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Phone Number</p>
                  <p className="font-bold text-slate-900 text-lg flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {lead.leadPhone}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Move-in Timeline</p>
                  <p className="font-medium text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {lead.moveInTimeline.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Preferred Area</p>
                  <p className="font-medium text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {lead.area || "No preference"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-xl shadow-sm overflow-hidden text-white">
              <div className="p-4 border-b border-slate-800 bg-slate-950 font-bold flex items-center gap-2">
                Referrer Info
              </div>
              <div className="p-4 space-y-4">
                {lead.referrerId ? (
                  <>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase mb-1">Name</p>
                      <p className="font-bold">{lead.referrerName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase mb-1">Phone</p>
                      <p className="font-medium">{lead.referrerPhone}</p>
                    </div>
                    <Button variant="outline" className="w-full mt-2 bg-slate-800 border-slate-700 text-white hover:bg-slate-700 hover:text-white">
                      View Referrer Profile
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-4 text-slate-400">
                    This lead was submitted anonymously.
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}