/**
 * Custom hook to load CRM data from API endpoints
 * Replaces mock-data usage with real SQLite backend calls
 */

import { useEffect, useState } from 'react';
import { useApp } from '@/lib/store';
import * as apiClient from '@/lib/crm-api-client';
import { toast } from 'sonner';

export interface UseCRMDataOptions {
  autoLoad?: boolean;
  onError?: (error: Error) => void;
}

export function useCRMData(options: UseCRMDataOptions = {}) {
  const { autoLoad = true } = options;
  const app = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const leads = await apiClient.getLeads();
      // Update store with API leads
      app.leads = leads as any;
      setError(null);
      return leads;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load leads');
      setError(error);
      options.onError?.(error);
      toast.error('Failed to load leads from API');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const loadFollowUps = async () => {
    try {
      setLoading(true);
      const followUps = await apiClient.getFollowUps();
      app.followUps = followUps as any;
      setError(null);
      return followUps;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load follow-ups');
      setError(error);
      options.onError?.(error);
      toast.error('Failed to load follow-ups from API');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const loadTCMs = async () => {
    try {
      setLoading(true);
      const tcms = await apiClient.getTCMs();
      app.tcms = tcms as any;
      setError(null);
      return tcms;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load TCMs');
      setError(error);
      options.onError?.(error);
      toast.error('Failed to load TCMs from API');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createLeadWithDuplicateCheck = async (leadData: any) => {
    try {
      setLoading(true);
      // First, check for duplicates
      const { isDuplicate, duplicates } = await apiClient.checkDuplicate(
        leadData.phone,
        leadData.email
      );

      if (isDuplicate) {
        return {
          success: false,
          isDuplicate: true,
          duplicates,
          message: `Found ${duplicates.length} possible duplicate(s)`
        };
      }

      // No duplicates, create the lead
      const newLead = await apiClient.createLead(leadData);
      setError(null);
      return {
        success: true,
        isDuplicate: false,
        lead: newLead,
        message: 'Lead created successfully'
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create lead');
      setError(error);
      options.onError?.(error);
      return {
        success: false,
        isDuplicate: false,
        message: error.message
      };
    } finally {
      setLoading(false);
    }
  };

  const completeFollowUpAPI = async (followUpId: string) => {
    try {
      await apiClient.completeFollowUp(followUpId);
      // Reload follow-ups
      await loadFollowUps();
      setError(null);
      return { success: true };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to complete follow-up');
      setError(error);
      options.onError?.(error);
      toast.error('Failed to complete follow-up');
      return { success: false, error };
    }
  };

  useEffect(() => {
    if (autoLoad) {
      // Load all data on mount
      Promise.all([loadLeads(), loadFollowUps(), loadTCMs()]);
    }
  }, [autoLoad]);

  return {
    loading,
    error,
    loadLeads,
    loadFollowUps,
    loadTCMs,
    createLeadWithDuplicateCheck,
    completeFollowUpAPI,
  };
}
