/**
 * Modal to warn user about potential duplicate leads found during creation
 * Allows user to review duplicates and decide whether to proceed
 */

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Phone, Mail } from 'lucide-react';
import type { Lead } from '@/lib/crm-api-client';

export interface DuplicateLeadModalProps {
  open: boolean;
  duplicates: Lead[];
  leadData: {
    name: string;
    phone?: string;
    email?: string;
  };
  onProceed: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function DuplicateLeadModal({
  open,
  duplicates,
  leadData,
  onProceed,
  onCancel,
  loading = false,
}: DuplicateLeadModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Potential Duplicate Leads
          </DialogTitle>
          <DialogDescription>
            We found {duplicates.length} existing lead(s) with matching phone or email.
            Please review before creating a new lead.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium mb-2">New Lead (Pending):</div>
            <div className="space-y-1 text-xs">
              <div className="font-semibold">{leadData.name}</div>
              {leadData.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3 w-3" /> {leadData.phone}
                </div>
              )}
              {leadData.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3 w-3" /> {leadData.email}
                </div>
              )}
            </div>
          </div>

          {duplicates.map((dup) => (
            <div key={dup.id} className="p-3 border border-orange-200 bg-orange-50 rounded-lg">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm">{dup.name}</div>
                  <Badge variant="secondary" className="text-[10px]">
                    {dup.stage}
                  </Badge>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {dup.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" /> {dup.phone}
                      {dup.phone === leadData.phone && (
                        <Badge variant="destructive" className="text-[9px]">
                          Match
                        </Badge>
                      )}
                    </div>
                  )}
                  {dup.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" /> {dup.email}
                      {dup.email === leadData.email && (
                        <Badge variant="destructive" className="text-[9px]">
                          Match
                        </Badge>
                      )}
                    </div>
                  )}
                  {dup.preferredArea && (
                    <div className="text-[10px]">Area: {dup.preferredArea}</div>
                  )}
                  {dup.budget && (
                    <div className="text-[10px]">Budget: ₹{(dup.budget / 1000).toFixed(0)}k</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="flex gap-2 sm:justify-between">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={onProceed}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Anyway'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
