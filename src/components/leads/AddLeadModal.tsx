import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import * as apiClient from '@/lib/crm-api-client';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';

interface AddLeadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const SOURCES = ['Instagram', 'Google', 'Justdial', 'Housing.com', 'Referral', 'Direct'];
const AREAS = ['Koramangala', 'Indiranagar', 'HSR Layout', 'Whitefield', 'BTM', 'Bellandur', 'Marathahalli'];

interface DuplicateWarningProps {
  duplicates: any[];
  leadData: {
    name: string;
    phone: string;
  };
  onProceed: () => void;
  onCancel: () => void;
  loading: boolean;
}

function DuplicateWarning({
  duplicates,
  leadData,
  onProceed,
  onCancel,
  loading,
}: DuplicateWarningProps) {
  /**
   * Maps duplicate data to display format
   * Supports both old and new API response formats
   */
  const mapDuplicateData = (dup: any) => {
    // New API format: { field, value, existingLeadId, existingLeadName }
    if (dup.field && dup.value) {
      return {
        id: dup.existingLeadId || dup.id || '',
        name: dup.existingLeadName || 'Unknown',
        phone: dup.field === 'phone' ? dup.value : dup.phone || '—',
        email: dup.field === 'email' ? dup.value : dup.email,
        budget: dup.budget,
        stage: dup.stage,
        area: dup.preferredArea || dup.area,
      };
    }

    // Old API format: { name, phone, email, budget, stage, preferredArea }
    return {
      id: dup.id || '',
      name: dup.name || dup.leadName || 'Unknown',
      phone: dup.phone || dup.phoneNumber || dup.phoneRaw || '—',
      email: dup.email,
      budget: dup.budget,
      stage: dup.stage,
      area: dup.preferredArea || dup.area,
    };
  };

  const formatBudget = (budget: any) => {
    if (!budget) return null;
    const num = typeof budget === 'string' ? parseInt(budget) : budget;
    if (isNaN(num)) return null;
    return `₹${(num / 1000).toFixed(0)}k`;
  };

  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="h-5 w-5" />
            Potential Duplicate Detected
          </DialogTitle>
          <DialogDescription>
            We found {duplicates.length} existing lead(s) with a matching phone number.
            Please review before proceeding.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-64 overflow-y-auto">
          {/* New lead info */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm font-medium text-blue-900 mb-2">Your Entry:</div>
            <div className="text-sm text-blue-800 space-y-1">
              <div className="font-semibold">{leadData.name || '—'}</div>
              <div className="text-xs text-blue-700">{leadData.phone || '—'}</div>
              {leadData.email && <div className="text-xs text-blue-700">{leadData.email}</div>}
            </div>
          </div>

          {/* Existing duplicates */}
          {duplicates && duplicates.length > 0 ? (
            duplicates.map((dup, idx) => {
              const mapped = mapDuplicateData(dup);

              return (
                <div key={mapped.id || idx} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="text-sm font-medium text-amber-900 mb-2">Existing Lead:</div>
                  <div className="text-sm text-amber-800 space-y-1">
                    {/* Name */}
                    <div className="font-semibold">{mapped.name}</div>

                    {/* Phone */}
                    <div className="text-xs text-amber-700">{mapped.phone}</div>

                    {/* Email */}
                    {mapped.email && <div className="text-xs text-amber-700">{mapped.email}</div>}

                    {/* Budget */}
                    {mapped.budget && (
                      <div className="text-xs text-amber-700">
                        {formatBudget(mapped.budget)}
                      </div>
                    )}

                    {/* Stage */}
                    {mapped.stage && (
                      <div className="text-xs text-amber-700 mt-1">
                        Stage: {mapped.stage}
                      </div>
                    )}

                    {/* Area */}
                    {mapped.area && (
                      <div className="text-xs text-amber-700">
                        Area: {mapped.area}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="text-sm font-medium text-amber-900 mb-2">Existing Lead:</div>
              <div className="text-xs text-amber-700 italic">No details available</div>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onProceed}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Anyway'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AddLeadModal({ open, onClose, onSuccess }: AddLeadModalProps) {
  const [loading, setLoading] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    budget: '',
    preferredArea: '',
    moveInDate: '',
    source: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      budget: '',
      preferredArea: '',
      moveInDate: '',
      source: '',
    });
    setShowDuplicateWarning(false);
    setDuplicates([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error('Phone is required');
      return false;
    }
    // Basic phone validation (at least 10 digits)
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      toast.error('Please enter a valid phone number');
      return false;
    }
    return true;
  };

  const handleCheckDuplicate = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await apiClient.checkDuplicate(
        formData.phone,
        formData.email || undefined
      );

      console.log('Duplicate check response:', response);
      console.log('Response format:', {
        isDuplicate: response.isDuplicate,
        duplicatesCount: response.duplicates?.length,
        firstDuplicate: response.duplicates?.[0],
      });

      if (response.isDuplicate && response.duplicates?.length > 0) {
        // Store the raw duplicates - the DuplicateWarning component will handle display
        setDuplicates(response.duplicates);
        setShowDuplicateWarning(true);
      } else {
        // No duplicates, create lead directly
        await handleCreateLead();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to check duplicates';
      console.error('Duplicate check error:', err);
      toast.error('Error: ' + message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLead = async () => {
    setLoading(true);
    try {
      const leadData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email?.trim() || undefined,
        budget: formData.budget ? parseInt(formData.budget) : undefined,
        preferredArea: formData.preferredArea || undefined,
        moveInDate: formData.moveInDate || undefined,
        source: formData.source || undefined,
        stage: 'new',
        intent: 'warm',
        confidence: 50,
        responseSpeedMins: 0,
      };

      await apiClient.createLead(leadData);
      toast.success('Lead created successfully');
      resetForm();
      handleClose();
      // Trigger refresh
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create lead';
      toast.error('Error: ' + message);
    } finally {
      setLoading(false);
    }
  };

  if (showDuplicateWarning) {
    return (
      <DuplicateWarning
        duplicates={duplicates}
        leadData={{
          name: formData.name,
          phone: formData.phone,
        }}
        onProceed={handleCreateLead}
        onCancel={() => setShowDuplicateWarning(false)}
        loading={loading}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Lead
          </DialogTitle>
          <DialogDescription>
            Fill in the details to create a new lead. Phone number will be checked for duplicates.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm font-medium">
              Name *
            </Label>
            <Input
              id="name"
              placeholder="Full name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={loading}
              className="h-9 text-sm"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-sm font-medium">
              Phone *
            </Label>
            <Input
              id="phone"
              placeholder="+91 98xxxxxxxx"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={loading}
              className="h-9 text-sm"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={loading}
              className="h-9 text-sm"
            />
          </div>

          {/* Budget */}
          <div className="space-y-1.5">
            <Label htmlFor="budget" className="text-sm font-medium">
              Budget (₹/month)
            </Label>
            <Input
              id="budget"
              type="number"
              placeholder="10000"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              disabled={loading}
              className="h-9 text-sm"
            />
          </div>

          {/* Preferred Area */}
          <div className="space-y-1.5">
            <Label htmlFor="area" className="text-sm font-medium">
              Preferred Area
            </Label>
            <Select
              value={formData.preferredArea}
              onValueChange={(value) => setFormData({ ...formData, preferredArea: value })}
              disabled={loading}
            >
              <SelectTrigger className="h-9 text-sm" id="area">
                <SelectValue placeholder="Select area" />
              </SelectTrigger>
              <SelectContent>
                {AREAS.map((area) => (
                  <SelectItem key={area} value={area}>
                    {area}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Move-in Date */}
          <div className="space-y-1.5">
            <Label htmlFor="moveInDate" className="text-sm font-medium">
              Move-in Date
            </Label>
            <Input
              id="moveInDate"
              type="date"
              value={formData.moveInDate}
              onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })}
              disabled={loading}
              className="h-9 text-sm"
            />
          </div>

          {/* Source */}
          <div className="space-y-1.5">
            <Label htmlFor="source" className="text-sm font-medium">
              Source
            </Label>
            <Select
              value={formData.source}
              onValueChange={(value) => setFormData({ ...formData, source: value })}
              disabled={loading}
            >
              <SelectTrigger className="h-9 text-sm" id="source">
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                {SOURCES.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className="h-9"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCheckDuplicate}
            disabled={loading}
            className="h-9"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Lead'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
