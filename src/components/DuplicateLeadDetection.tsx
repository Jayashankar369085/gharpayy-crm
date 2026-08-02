import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { checkDuplicate } from '@/lib/crm-api-client';
import { cn } from '@/lib/utils';

interface DuplicateLeadDetectionProps {
  phone?: string;
  email?: string;
  onDuplicateFound?: (isDuplicate: boolean, duplicates: any[]) => void;
}

export function DuplicateLeadDetection({
  phone,
  email,
  onDuplicateFound
}: DuplicateLeadDetectionProps) {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    if (!phone && !email) {
      setError('Enter phone or email to check');
      return;
    }

    setChecking(true);
    setError(null);

    try {
      const data = await checkDuplicate(phone, email);
      setResult(data);
      onDuplicateFound?.(data.isDuplicate, data.duplicates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check failed');
    } finally {
      setChecking(false);
    }
  };

  if (!result) {
    return null;
  }

  if (result.isDuplicate) {
    return (
      <Card className="border-destructive/50 bg-destructive/5 p-3 space-y-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <h4 className="font-semibold text-sm">Duplicate Lead Detected!</h4>
        </div>
        {result.duplicates.map((dup: any, idx: number) => (
          <div key={idx} className="text-[11px] text-muted-foreground space-y-1 pl-6">
            <div>
              <Badge variant="outline" className="text-[9px]">
                {dup.field.toUpperCase()}
              </Badge>
            </div>
            <div>Existing Lead: <span className="font-semibold">{dup.existingLeadName}</span></div>
            <div>ID: <span className="font-mono text-[10px]">{dup.existingLeadId}</span></div>
          </div>
        ))}
        <div className="text-[10px] text-destructive mt-2">
          This lead already exists. Merge or update instead?
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-success/50 bg-success/5 p-3 flex items-center gap-2">
      <CheckCircle2 className="h-4 w-4 text-success" />
      <span className="text-sm text-muted-foreground">No duplicates found - safe to create</span>
    </Card>
  );
}
