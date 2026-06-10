// @ts-nocheck
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/referral-app/components/ui/toaster";
import { TooltipProvider } from "@/referral-app/components/ui/tooltip";
import { installReferralMockApi } from "@/referral-app/lib/mock-live-data";

import NotFound from "@/referral-app/pages/not-found";
import IndexPage from "@/referral-app/pages/index";
import RegisterPage from "@/referral-app/pages/register";
import HomePage from "@/referral-app/pages/home";
import ReferPage from "@/referral-app/pages/refer";
import ProfilePage from "@/referral-app/pages/me";
import LeaderboardPage from "@/referral-app/pages/leaderboard";

import PgBrowsePage from "@/referral-app/pages/pg/browse";
import PgDetailPage from "@/referral-app/pages/pg/detail";
import TeamsPage from "@/referral-app/pages/teams";
import TeamDetailPage from "@/referral-app/pages/teams/detail";
import ChallengesPage from "@/referral-app/pages/challenges";
import NotificationsPage from "@/referral-app/pages/notifications";
import CalculatorPage from "@/referral-app/pages/calculator";
import AreasPage from "@/referral-app/pages/areas";
import ManagerDashPage from "@/referral-app/pages/manager/dashboard";
import ManagerPropertiesPage from "@/referral-app/pages/manager/properties";
import ManagerAddPropertyPage from "@/referral-app/pages/manager/add-property";
import ManagerRoomsPage from "@/referral-app/pages/manager/rooms";
import PayoutSetupPage from "@/referral-app/pages/payout-setup";
import PublicProfilePage from "@/referral-app/pages/profile";

import StreakPage from "@/referral-app/pages/streak";
import LuckyDrawPage from "@/referral-app/pages/lucky-draw";
import SquadBattlesPage from "@/referral-app/pages/squad-battles";
import FlashPage from "@/referral-app/pages/flash";
import ChainPage from "@/referral-app/pages/chain";
import ActivityPage from "@/referral-app/pages/activity";
import VisitsPage from "@/referral-app/pages/visits";
import EarningsPage from "@/referral-app/pages/earnings";

import BrokerDashboard from "@/referral-app/pages/broker/dashboard";
import InfluencerDashboard from "@/referral-app/pages/influencer/dashboard";
import CorporateDashboard from "@/referral-app/pages/corporate/dashboard";

import AdminLogin from "@/referral-app/pages/admin/login";
import AdminDashboard from "@/referral-app/pages/admin/dashboard";
import AdminLeads from "@/referral-app/pages/admin/leads";
import AdminLeadDetail from "@/referral-app/pages/admin/lead-detail";
import AdminPayouts from "@/referral-app/pages/admin/payouts";
import AdminProperties from "@/referral-app/pages/admin/properties";
import AdminZones from "@/referral-app/pages/admin/zones";
import AdminZoneDetail from "@/referral-app/pages/admin/zone-detail";
import AdminMap from "@/referral-app/pages/admin/map";
import AdminCaptains from "@/referral-app/pages/admin/captains";
import AdminEarners from "@/referral-app/pages/admin/earners";
import AdminChannels from "@/referral-app/pages/admin/channels";

import EarnHubPage from "@/referral-app/pages/earn-hub";
import EarnPlaybookPage from "@/referral-app/pages/earn-playbook";
import PersonaKitPage from "@/referral-app/pages/persona-kit";

// Booking OS (BookOS) — manager module
import BookOSDash from "@/referral-app/pages/manager/bookos/index";
import BookOSBookings from "@/referral-app/pages/manager/bookos/bookings/index";
import BookOSBookingNew from "@/referral-app/pages/manager/bookos/bookings/new";
import BookOSBookingDetail from "@/referral-app/pages/manager/bookos/bookings/detail";
import BookOSQuotes from "@/referral-app/pages/manager/bookos/quotations/index";
import BookOSQuoteNew from "@/referral-app/pages/manager/bookos/quotations/new";
import BookOSQuoteDetail from "@/referral-app/pages/manager/bookos/quotations/detail";
import BookOSTenants from "@/referral-app/pages/manager/bookos/tenants/index";
import BookOSTenantDetail from "@/referral-app/pages/manager/bookos/tenants/detail";
import BookOSPayments from "@/referral-app/pages/manager/bookos/payments";
import BookOSRents from "@/referral-app/pages/manager/bookos/rents";
import BookOSProperties from "@/referral-app/pages/manager/bookos/properties";
import BookOSDocuments from "@/referral-app/pages/manager/bookos/documents";
import BookOSExpenses from "@/referral-app/pages/manager/bookos/expenses";
import BookOSMaintenance from "@/referral-app/pages/manager/bookos/maintenance";
import BookOSStaff from "@/referral-app/pages/manager/bookos/staff";
import BookOSAnalytics from "@/referral-app/pages/manager/bookos/analytics";
import BookOSNotifs from "@/referral-app/pages/manager/bookos/notifications";
import BookOSAdmin from "@/referral-app/pages/manager/bookos/admin";
import BookOSSettings from "@/referral-app/pages/manager/bookos/settings";

// Booking OS 2.0 — leads, inventory, owner
import BookOSLeads from "@/referral-app/pages/manager/bookos/leads";
import BookOSAreas from "@/referral-app/pages/manager/bookos/areas";
import BookOSMap from "@/referral-app/pages/manager/bookos/map";
import BookOSInventory from "@/referral-app/pages/manager/bookos/inventory";
import BookOSCommand from "@/referral-app/pages/manager/bookos/command";
import BookOSVisits from "@/referral-app/pages/manager/bookos/visits";
import BookOSRoomDetail from "@/referral-app/pages/manager/bookos/room/detail";
import BookOSMoveIn from "@/referral-app/pages/manager/bookos/movein";
import BookOSFounder from "@/referral-app/pages/manager/bookos/founder";
import OwnerOverview from "@/referral-app/pages/owner/index";
import OwnerRevenue from "@/referral-app/pages/owner/revenue";
import OwnerCollections from "@/referral-app/pages/owner/collections";
import OwnerMaintenance from "@/referral-app/pages/owner/maintenance";
import OwnerHealth from "@/referral-app/pages/owner/health";


const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={IndexPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/home" component={HomePage} />
      <Route path="/refer" component={ReferPage} />
      <Route path="/me" component={ProfilePage} />
      <Route path="/leaderboard" component={LeaderboardPage} />
      <Route path="/payout-setup" component={PayoutSetupPage} />
      <Route path="/earnings" component={EarningsPage} />

      <Route path="/pg" component={PgBrowsePage} />
      <Route path="/pg/:id" component={PgDetailPage} />
      <Route path="/areas" component={AreasPage} />

      <Route path="/teams" component={TeamsPage} />
      <Route path="/teams/:id" component={TeamDetailPage} />
      <Route path="/challenges" component={ChallengesPage} />
      <Route path="/notifications" component={NotificationsPage} />
      <Route path="/calculator" component={CalculatorPage} />
      <Route path="/profile/:code" component={PublicProfilePage} />

      <Route path="/streak" component={StreakPage} />
      <Route path="/lucky-draw" component={LuckyDrawPage} />
      <Route path="/squad-battles" component={SquadBattlesPage} />
      <Route path="/flash" component={FlashPage} />
      <Route path="/chain" component={ChainPage} />
      <Route path="/activity" component={ActivityPage} />
      <Route path="/visits" component={VisitsPage} />

      <Route path="/broker" component={BrokerDashboard} />
      <Route path="/influencer" component={InfluencerDashboard} />
      <Route path="/corporate" component={CorporateDashboard} />

      <Route path="/manager" component={ManagerDashPage} />
      <Route path="/manager/properties" component={ManagerPropertiesPage} />
      <Route path="/manager/properties/new" component={ManagerAddPropertyPage} />
      <Route path="/manager/properties/:id/rooms" component={ManagerRoomsPage} />

      {/* Booking OS */}
      <Route path="/manager/bookos" component={BookOSDash} />
      <Route path="/manager/bookos/bookings" component={BookOSBookings} />
      <Route path="/manager/bookos/bookings/new" component={BookOSBookingNew} />
      <Route path="/manager/bookos/bookings/:id" component={BookOSBookingDetail} />
      <Route path="/manager/bookos/quotations" component={BookOSQuotes} />
      <Route path="/manager/bookos/quotations/new" component={BookOSQuoteNew} />
      <Route path="/manager/bookos/quotations/:id" component={BookOSQuoteDetail} />
      <Route path="/manager/bookos/tenants" component={BookOSTenants} />
      <Route path="/manager/bookos/tenants/:id" component={BookOSTenantDetail} />
      <Route path="/manager/bookos/payments" component={BookOSPayments} />
      <Route path="/manager/bookos/rents" component={BookOSRents} />
      <Route path="/manager/bookos/properties" component={BookOSProperties} />
      <Route path="/manager/bookos/documents" component={BookOSDocuments} />
      <Route path="/manager/bookos/expenses" component={BookOSExpenses} />
      <Route path="/manager/bookos/maintenance" component={BookOSMaintenance} />
      <Route path="/manager/bookos/staff" component={BookOSStaff} />
      <Route path="/manager/bookos/analytics" component={BookOSAnalytics} />
      <Route path="/manager/bookos/notifications" component={BookOSNotifs} />
      <Route path="/manager/bookos/admin" component={BookOSAdmin} />
      <Route path="/manager/bookos/settings" component={BookOSSettings} />

      {/* BookOS 2.0 */}
      <Route path="/manager/bookos/leads" component={BookOSLeads} />
      <Route path="/manager/bookos/areas" component={BookOSAreas} />
      <Route path="/manager/bookos/map" component={BookOSMap} />
      <Route path="/manager/bookos/inventory" component={BookOSInventory} />
      <Route path="/manager/bookos/command" component={BookOSCommand} />
      <Route path="/manager/bookos/founder" component={BookOSFounder} />
      <Route path="/manager/bookos/visits" component={BookOSVisits} />
      <Route path="/manager/bookos/movein" component={BookOSMoveIn} />
      <Route path="/manager/bookos/room/:id" component={BookOSRoomDetail} />

      {/* Owner Command Center */}
      <Route path="/owner" component={OwnerOverview} />

      <Route path="/owner/revenue" component={OwnerRevenue} />
      <Route path="/owner/collections" component={OwnerCollections} />
      <Route path="/owner/maintenance" component={OwnerMaintenance} />
      <Route path="/owner/health" component={OwnerHealth} />

      <Route path="/admin" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/zones" component={AdminZones} />
      <Route path="/admin/zone/:slug" component={AdminZoneDetail} />
      <Route path="/admin/map" component={AdminMap} />
      <Route path="/admin/leads" component={AdminLeads} />
      <Route path="/admin/leads/:id" component={AdminLeadDetail} />
      <Route path="/admin/payouts" component={AdminPayouts} />
      <Route path="/admin/analytics" component={AdminDashboard} />
      <Route path="/admin/properties" component={AdminProperties} />
      <Route path="/admin/experts" component={AdminCaptains} />
      <Route path="/admin/earners" component={AdminEarners} />
      <Route path="/admin/channels" component={AdminChannels} />

      <Route path="/earn" component={EarnHubPage} />
      <Route path="/earn/:channel" component={EarnPlaybookPage} />
      <Route path="/persona-kit/:id" component={PersonaKitPage} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  installReferralMockApi();
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base="/app">
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
