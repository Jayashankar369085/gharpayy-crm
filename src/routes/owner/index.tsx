import { createFileRoute } from '@tanstack/react-router';
import { AppShell } from '@/components/AppShell';
import { OwnerHome } from '@/owner/pages/OwnerHome';

export const Route = createFileRoute('/owner/')({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === 'string' ? search.id : undefined,
    tab: typeof search.tab === 'string' ? search.tab : undefined,
  }),
  head: () => ({ meta: [{ title: 'Owner Desk — Hotel-style Inventory OS' }] }),
  component: () => <AppShell><OwnerHome /></AppShell>,
});
