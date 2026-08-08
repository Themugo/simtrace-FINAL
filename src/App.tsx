import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AuthProvider } from '../lib/auth';
import { ToastProvider } from '../components/ToastProvider';
import Nav from '../components/Nav';
import { ErrorBoundary, SkeletonCard } from '../components/ui';
import '../app/globals.css';

// Lazy load pages for fast initial load
const HomePage = lazy(() => import('../app/page'));
const DevicesPage = lazy(() => import('../app/devices/page'));
const DeviceDetailPage = lazy(() => import('../app/devices/[id]/page'));
const ImeiPage = lazy(() => import('../app/imei/page').catch(() => import('../app/not-found')));
const AlertsPage = lazy(() => import('../app/alerts/page').catch(() => import('../app/not-found')));
const ReportPage = lazy(() => import('../app/report/page').catch(() => import('../app/not-found')));
const ReportsPage = lazy(() => import('../app/reports/page').catch(() => import('../app/not-found')));
const CommunityPage = lazy(() => import('../app/community/page').catch(() => import('../app/not-found')));
const PricingPage = lazy(() => import('../app/pricing/page').catch(() => import('../app/not-found')));
const LoginPage = lazy(() => import('../app/login/page').catch(() => import('../app/not-found')));
const RegisterPage = lazy(() => import('../app/register/page').catch(() => import('../app/not-found')));
const OnboardingPage = lazy(() => import('../app/onboarding/page').catch(() => import('../app/not-found')));
const AiAssistantPage = lazy(() => import('../app/ai-assistant/page').catch(() => import('../app/not-found')));
const DashboardPage = lazy(() => import('../app/dashboard/page').catch(() => import('../app/not-found')));
const PoliceDashboard = lazy(() => import('../app/police/dashboard/page').catch(() => import('../app/not-found')));
const LawEnforcementPage = lazy(() => import('../app/law-enforcement/page').catch(() => import('../app/not-found')));
const LawEnforcementCasesPage = lazy(() => import('../app/law-enforcement/cases/page').catch(() => import('../app/not-found')));
const EvidencePage = lazy(() => import('../app/evidence/page').catch(() => import('../app/not-found')));
const BlockchainLedgerPage = lazy(() => import('../app/blockchain-ledger/page').catch(() => import('../app/not-found')));
const TelecomDashboardPage = lazy(() => import('../app/telecom/dashboard/page').catch(() => import('../app/not-found')));
const RecoveryNetworkPage = lazy(() => import('../app/recovery-network/page').catch(() => import('../app/not-found')));
const MarketplacePage = lazy(() => import('../app/marketplace/page').catch(() => import('../app/not-found')));
const FinancialDashboardPage = lazy(() => import('../app/financial-dashboard/page').catch(() => import('../app/not-found')));
const InsurancePage = lazy(() => import('../app/insurance/page').catch(() => import('../app/not-found')));
const DeveloperPlatformPage = lazy(() => import('../app/developer/page').catch(() => import('../app/not-found')));
const OperationalExcellencePage = lazy(() => import('../app/operations/page').catch(() => import('../app/not-found')));
const EnterpriseExcellencePage = lazy(() => import('../app/enterprise/page').catch(() => import('../app/not-found')));
const DocsPage = lazy(() => import('../app/docs/page').catch(() => import('../app/not-found')));
const EcosystemPage = lazy(() => import('../app/ecosystem/page').catch(() => import('../app/not-found')));
const GlobalEcosystemPage = lazy(() => import('../app/global-ecosystem/page').catch(() => import('../app/not-found')));
const TrustPlatformPage = lazy(() => import('../app/trust-platform/page').catch(() => import('../app/not-found')));
const DPIPlatformPage = lazy(() => import('../app/dpi-platform/page').catch(() => import('../app/not-found')));
const LawEnforcementCompliancePage = lazy(() => import('../app/law-enforcement-compliance/page').catch(() => import('../app/not-found')));
const STOSPage = lazy(() => import('../app/stos/page').catch(() => import('../app/not-found')));
const SCPPage = lazy(() => import('../app/scp/page').catch(() => import('../app/not-found')));
const SECPPage = lazy(() => import('../app/secp/page').catch(() => import('../app/not-found')));
const EcosystemPlatformPage = lazy(() => import('../app/ecosystem-platform/page').catch(() => import('../app/not-found')));
const SimTraceCorporationPage = lazy(() => import('../app/corporation/page').catch(() => import('../app/not-found')));
const SimTraceWorldPage = lazy(() => import('../app/world/page').catch(() => import('../app/not-found')));
const LiveOperationsPage = lazy(() => import('../app/operations/live/page').catch(() => import('../app/not-found')));
const IntelligenceGraphPage = lazy(() => import('../app/intelligence/graph/page').catch(() => import('../app/not-found')));
const EntityDetailPage = lazy(() => import('../app/intelligence/entity/[id]/page').catch(() => import('../app/not-found')));
const AiCenterPage = lazy(() => import('../app/ai-center/page').catch(() => import('../app/not-found')));
const AdminUsersPage = lazy(() => import('../app/admin/users/page').catch(() => import('../app/not-found')));
const CaseReportsWorkspacePage = lazy(() => import('../app/cases/[id]/reports/page').catch(() => import('../app/not-found')));
const EvidenceDetailPage = lazy(() => import('../app/evidence/[id]/page').catch(() => import('../app/not-found')));
const ComplianceDashboardPage = lazy(() => import('../app/compliance/dashboard/page').catch(() => import('../app/compliance/page').catch(() => import('../app/not-found'))));
const ComplianceAuditsPage = lazy(() => import('../app/compliance/audits/page').catch(() => import('../app/not-found')));
const TrustCenterPage = lazy(() => import('../app/trust-center/page').catch(() => import('../app/not-found')));
const CustomerOrganizationPage = lazy(() => import('../app/organization/page').catch(() => import('../app/not-found')));
const AdminPlatformControlPage = lazy(() => import('../app/admin/platform/page').catch(() => import('../app/not-found')));
const AdminDevOpsPage = lazy(() => import('../app/admin/devops/page').catch(() => import('../app/not-found')));
const DeveloperPortalPage = lazy(() => import('../app/developers/page').catch(() => import('../app/not-found')));
const FieldOperationsPage = lazy(() => import('../app/field/page').catch(() => import('../app/not-found')));
const AdminCustomerSuccessPage = lazy(() => import('../app/admin/customer-success/page').catch(() => import('../app/not-found')));
const AdminBusinessPage = lazy(() => import('../app/admin/business/page').catch(() => import('../app/not-found')));
const PartnersPortalPage = lazy(() => import('../app/partners/page').catch(() => import('../app/not-found')));
const InvestigatorAICopilotPage = lazy(() => import('../app/copilot/page').catch(() => import('../app/not-found')));
const GeointDashboardPage = lazy(() => import('../app/geoint/page').catch(() => import('../app/not-found')));
const OperationalMapPage = lazy(() => import('../app/operations/map/page').catch(() => import('../app/not-found')));
const ExecutiveDashboardPage = lazy(() => import('../app/executive/page').catch(() => import('../app/not-found')));
const CustomReportBuilderPage = lazy(() => import('../app/analytics/page').catch(() => import('../app/not-found')));
const CollaborationPortalPage = lazy(() => import('../app/collaboration/page').catch(() => import('../app/not-found')));
const GuardianPortalPage = lazy(() => import('../app/guardian/page').catch(() => import('../app/not-found')));
const NotFoundPage = lazy(() => import('../app/not-found'));

import CustomerSuccessWidget from '../components/CustomerSuccessWidget';

function PageRouter() {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const cleanPath = pathname.replace(/\/$/, '') || '/';

  // Match route
  let PageComponent = NotFoundPage;

  if (cleanPath === '/') {
    PageComponent = HomePage;
  } else if (cleanPath === '/devices') {
    PageComponent = DevicesPage;
  } else if (cleanPath.startsWith('/devices/')) {
    PageComponent = DeviceDetailPage;
  } else if (cleanPath === '/imei') {
    PageComponent = ImeiPage;
  } else if (cleanPath === '/alerts') {
    PageComponent = AlertsPage;
  } else if (cleanPath === '/report') {
    PageComponent = ReportPage;
  } else if (cleanPath === '/reports') {
    PageComponent = ReportsPage;
  } else if (cleanPath === '/community') {
    PageComponent = CommunityPage;
  } else if (cleanPath === '/pricing') {
    PageComponent = PricingPage;
  } else if (cleanPath === '/login') {
    PageComponent = LoginPage;
  } else if (cleanPath === '/register') {
    PageComponent = RegisterPage;
  } else if (cleanPath === '/onboarding') {
    PageComponent = OnboardingPage;
  } else if (cleanPath === '/ai-assistant') {
    PageComponent = AiAssistantPage;
  } else if (cleanPath === '/dashboard') {
    PageComponent = DashboardPage;
  } else if (cleanPath === '/police' || cleanPath === '/police/dashboard') {
    PageComponent = PoliceDashboard;
  } else if (cleanPath === '/law-enforcement') {
    PageComponent = LawEnforcementPage;
  } else if (cleanPath === '/law-enforcement/cases') {
    PageComponent = LawEnforcementCasesPage;
  } else if (cleanPath === '/evidence') {
    PageComponent = EvidencePage;
  } else if (cleanPath === '/blockchain-ledger') {
    PageComponent = BlockchainLedgerPage;
  } else if (cleanPath === '/telecom' || cleanPath === '/telecom/dashboard') {
    PageComponent = TelecomDashboardPage;
  } else if (cleanPath === '/recovery-network') {
    PageComponent = RecoveryNetworkPage;
  } else if (cleanPath === '/marketplace' || cleanPath === '/commercial' || cleanPath === '/partner') {
    PageComponent = MarketplacePage;
  } else if (cleanPath === '/financial-dashboard') {
    PageComponent = FinancialDashboardPage;
  } else if (cleanPath === '/insurance') {
    PageComponent = InsurancePage;
  } else if (cleanPath === '/developer' || cleanPath === '/developers' || cleanPath === '/api-docs') {
    PageComponent = DeveloperPlatformPage;
  } else if (cleanPath === '/operations' || cleanPath === '/ops' || cleanPath === '/status') {
    PageComponent = OperationalExcellencePage;
  } else if (cleanPath === '/enterprise' || cleanPath === '/zerotrust' || cleanPath === '/governance') {
    PageComponent = EnterpriseExcellencePage;
  } else if (cleanPath === '/docs' || cleanPath === '/kb' || cleanPath === '/help') {
    PageComponent = DocsPage;
  } else if (cleanPath === '/ecosystem' || cleanPath === '/architecture') {
    PageComponent = EcosystemPage;
  } else if (cleanPath === '/global-ecosystem' || cleanPath === '/command-center' || cleanPath === '/federation') {
    PageComponent = GlobalEcosystemPage;
  } else if (cleanPath === '/trust-platform' || cleanPath === '/trust' || cleanPath === '/passport' || cleanPath === '/reputation') {
    PageComponent = TrustPlatformPage;
  } else if (cleanPath === '/dpi-platform' || cleanPath === '/dpi' || cleanPath === '/registry' || cleanPath === '/public-infrastructure') {
    PageComponent = DPIPlatformPage;
  } else if (cleanPath === '/law-enforcement-compliance' || cleanPath === '/evidence-compliance' || cleanPath === '/residency-compliance') {
    PageComponent = LawEnforcementCompliancePage;
  } else if (cleanPath === '/stos' || cleanPath === '/operating-system' || cleanPath === '/stos-kernel') {
    PageComponent = STOSPage;
  } else if (cleanPath === '/scp' || cleanPath === '/cloud-platform' || cleanPath === '/control-plane' || cleanPath === '/provisioning') {
    PageComponent = SCPPage;
  } else if (cleanPath === '/secp' || cleanPath === '/enterprise-company' || cleanPath === '/secp-platform' || cleanPath === '/company-ops') {
    PageComponent = SECPPage;
  } else if (cleanPath === '/ecosystem-platform' || cleanPath === '/digital-ecosystem' || cleanPath === '/platform-economy') {
    PageComponent = EcosystemPlatformPage;
  } else if (cleanPath === '/corporation' || cleanPath === '/simtrace-corp' || cleanPath === '/company' || cleanPath === '/corporate') {
    PageComponent = SimTraceCorporationPage;
  } else if (cleanPath === '/world' || cleanPath === '/simtrace-world' || cleanPath === '/world-platform' || cleanPath === '/universal-platform') {
    PageComponent = SimTraceWorldPage;
  } else if (cleanPath === '/operations/live') {
    PageComponent = LiveOperationsPage;
  } else if (cleanPath === '/intelligence/graph') {
    PageComponent = IntelligenceGraphPage;
  } else if (cleanPath.startsWith('/intelligence/entity/')) {
    PageComponent = EntityDetailPage;
  } else if (cleanPath === '/ai-center') {
    PageComponent = AiCenterPage;
  } else if (cleanPath === '/admin/users') {
    PageComponent = AdminUsersPage;
  } else if (cleanPath.startsWith('/cases/') && cleanPath.includes('/reports')) {
    PageComponent = CaseReportsWorkspacePage;
  } else if (cleanPath.startsWith('/evidence/')) {
    PageComponent = EvidenceDetailPage;
  } else if (cleanPath === '/compliance' || cleanPath === '/compliance/dashboard') {
    PageComponent = ComplianceDashboardPage;
  } else if (cleanPath === '/compliance/audits') {
    PageComponent = ComplianceAuditsPage;
  } else if (cleanPath === '/trust-center') {
    PageComponent = TrustCenterPage;
  } else if (cleanPath === '/organization') {
    PageComponent = CustomerOrganizationPage;
  } else if (cleanPath === '/admin/platform') {
    PageComponent = AdminPlatformControlPage;
  } else if (cleanPath === '/admin/devops') {
    PageComponent = AdminDevOpsPage;
  } else if (cleanPath === '/developers') {
    PageComponent = DeveloperPortalPage;
  } else if (cleanPath === '/field') {
    PageComponent = FieldOperationsPage;
  } else if (cleanPath === '/admin/customer-success') {
    PageComponent = AdminCustomerSuccessPage;
  } else if (cleanPath === '/admin/business') {
    PageComponent = AdminBusinessPage;
  } else if (cleanPath === '/partners') {
    PageComponent = PartnersPortalPage;
  } else if (cleanPath === '/copilot') {
    PageComponent = InvestigatorAICopilotPage;
  } else if (cleanPath === '/geoint') {
    PageComponent = GeointDashboardPage;
  } else if (cleanPath === '/operations/map') {
    PageComponent = OperationalMapPage;
  } else if (cleanPath === '/executive') {
    PageComponent = ExecutiveDashboardPage;
  } else if (cleanPath === '/analytics') {
    PageComponent = CustomReportBuilderPage;
  } else if (cleanPath === '/collaboration') {
    PageComponent = CollaborationPortalPage;
  } else if (cleanPath === '/guardian') {
    PageComponent = GuardianPortalPage;
  }

  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div style={{ maxWidth: 1000, margin: '2rem auto', padding: '0 1rem' }}>
            <SkeletonCard />
          </div>
        }
      >
        <PageComponent />
      </Suspense>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <Nav />
          <main>
            <PageRouter />
          </main>
          <CustomerSuccessWidget />
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
