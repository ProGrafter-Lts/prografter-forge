import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation, type Location } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import PWAInstallBanner from "./components/PWAInstallBanner.tsx";
import Chatbot from "./components/Chatbot.tsx";
import GlobalLegalFooter from "./components/LegalFooterLinks.tsx";
import CookieConsent from "./components/CookieConsent.tsx";
import { usePageTracking } from "./hooks/usePageTracking.ts";

// Lazy-load every non-landing route so the initial bundle stays small
import { lazyRetry } from "./lib/lazyRetry";
const Index = lazyRetry(() => import("./pages/Index.tsx"));
const Login = lazyRetry(() => import("./pages/Login.tsx"));
const Terms = lazyRetry(() => import("./pages/Terms.tsx"));
const Privacy = lazyRetry(() => import("./pages/Privacy.tsx"));
const Cookies = lazyRetry(() => import("./pages/Cookies.tsx"));
const Complaints = lazyRetry(() => import("./pages/Complaints.tsx"));
const TradeRegister = lazyRetry(() => import("./pages/TradeRegister.tsx"));
const SignupTrade = lazyRetry(() => import("./pages/SignupTrade.tsx"));
const SignupTradeUnderReview = lazyRetry(() => import("./pages/SignupTradeUnderReview.tsx"));
const SignupTradeAssessmentPending = lazyRetry(() => import("./pages/SignupTradeAssessmentPending.tsx"));
const Verification = lazyRetry(() => import("./pages/Verification.tsx"));
const PostAJob = lazyRetry(() => import("./pages/PostAJob.tsx"));
const ResetPassword = lazyRetry(() => import("./pages/ResetPassword.tsx"));
const TradeDashboard = lazyRetry(() => import("./pages/TradeDashboard.tsx"));
import SiteScoutGate from "./atlas/SiteScoutGate";
const AtlasLanding = lazyRetry(() => import("./atlas/pages/AtlasLanding.tsx"));
const AtlasNewSurvey = lazyRetry(() => import("./atlas/pages/AtlasNewSurvey.tsx"));
const AtlasWorkspace = lazyRetry(() => import("./atlas/pages/AtlasWorkspace.tsx"));
const AtlasReview = lazyRetry(() => import("./atlas/pages/AtlasReview.tsx"));
const AtlasSummary = lazyRetry(() => import("./atlas/pages/AtlasSummary.tsx"));
const AtlasCapture = lazyRetry(() => import("./atlas/pages/AtlasCapture.tsx"));
const AtlasCaptureReport = lazyRetry(() => import("./atlas/pages/AtlasCaptureReport.tsx"));
const TradeSettings = lazyRetry(() => import("./pages/TradeSettings.tsx"));
const HomeownerDashboard = lazyRetry(() => import("./pages/HomeownerDashboard.tsx"));
const ProjectDetail = lazyRetry(() => import("./pages/ProjectDetail.tsx"));
const CompareQuotes = lazyRetry(() => import("./pages/CompareQuotes.tsx"));
const NotFound = lazyRetry(() => import("./pages/NotFound.tsx"));
const QuoteChecker = lazyRetry(() => import("./pages/QuoteChecker.tsx"));
const QuoteReport = lazyRetry(() => import("./pages/QuoteReport.tsx"));
const PublicQuoteView = lazyRetry(() => import("./pages/PublicQuoteView.tsx"));
const MyQuoteChecks = lazyRetry(() => import("./pages/MyQuoteChecks.tsx"));
const QuoteCheckDetail = lazyRetry(() => import("./pages/QuoteCheckDetail.tsx"));
const GreenGrants = lazyRetry(() => import("./pages/GreenGrants.tsx"));
const PlanningAlertsPage = lazyRetry(() => import("./pages/PlanningAlerts.tsx"));
const PlanningInvitePage = lazyRetry(() => import("./pages/PlanningInvite.tsx"));
const HomeownerManual = lazyRetry(() => import("./pages/HomeownerManual.tsx"));
const Unsubscribe = lazyRetry(() => import("./pages/Unsubscribe.tsx"));
const Contact = lazyRetry(() => import("./pages/Contact.tsx"));
const About = lazyRetry(() => import("./pages/About.tsx"));
const HowItWorksPage = lazyRetry(() => import("./pages/HowItWorksPage.tsx"));
const SignupHomeowner = lazyRetry(() => import("./pages/SignupHomeowner.tsx"));
const SignupHomeownerNext = lazyRetry(() => import("./pages/SignupHomeownerNext.tsx"));
const SignupCheckEmail = lazyRetry(() => import("./pages/SignupCheckEmail.tsx"));
const AuthCallback = lazyRetry(() => import("./pages/AuthCallback.tsx"));
const OAuthConsent = lazyRetry(() => import("./pages/OAuthConsent.tsx"));
const SignupTradeRedirect = lazyRetry(() => import("./pages/SignupTradeRedirect.tsx"));
const AdminVerifications = lazyRetry(() => import("./pages/AdminVerifications.tsx"));
const AdminTradeVault = lazyRetry(() => import("./pages/AdminTradeVault.tsx"));
const AdminRecordAgreedQuote = lazyRetry(() => import("./pages/AdminRecordAgreedQuote.tsx"));
const AdminWaitlist = lazyRetry(() => import("./pages/AdminWaitlist.tsx"));
const AdminSuppliers = lazyRetry(() => import("./pages/AdminSuppliers.tsx"));
const Suppliers = lazyRetry(() => import("./pages/Suppliers.tsx"));
const AdminEmailStatus = lazyRetry(() => import("./pages/AdminEmailStatus.tsx"));
const AdminTestimonials = lazyRetry(() => import("./pages/AdminTestimonials.tsx"));
const SubmitTestimonial = lazyRetry(() => import("./pages/SubmitTestimonial.tsx"));
const CheckatradeAlternative = lazyRetry(() => import("./pages/CheckatradeAlternative.tsx"));
const IsCheckatradeWorthIt = lazyRetry(() => import("./pages/IsCheckatradeWorthIt.tsx"));
const ContractPage = lazyRetry(() => import("./pages/ContractPage.tsx"));
const LegalReview = lazyRetry(() => import("./pages/LegalReview.tsx"));
const QuickBuildPage = lazyRetry(() => import("./pages/QuickBuildPage.tsx"));
const QuoteBuilder = lazyRetry(() => import("./pages/QuoteBuilder.tsx"));
const QuoteDetail = lazyRetry(() => import("./pages/QuoteDetail.tsx"));
const Apply = lazyRetry(() => import("./pages/Apply.tsx"));
const PostJobBrief = lazyRetry(() => import("./pages/PostJobBrief.tsx"));
const ProjectClarity = lazyRetry(() => import("./pages/ProjectClarity.tsx"));
const ProjectBuilder = lazyRetry(() => import("./pages/ProjectBuilder.tsx"));
const ProGrafterIntelligence = lazyRetry(() => import("./pages/ProGrafterIntelligence.tsx"));
const JobOS = lazyRetry(() => import("./pages/JobOS.tsx"));
const ReviewSubmit = lazyRetry(() => import("./pages/ReviewSubmit.tsx"));
const TraderReviews = lazyRetry(() => import("./pages/TraderReviews.tsx"));
const DisputeRaise = lazyRetry(() => import("./pages/DisputeRaise.tsx"));
const DisputeDetail = lazyRetry(() => import("./pages/DisputeDetail.tsx"));
const AdminDisputes = lazyRetry(() => import("./pages/AdminDisputes.tsx"));
const PlanningPipeline = lazyRetry(() => import("./pages/PlanningPipeline.tsx"));
const AdminTradeScraper = lazyRetry(() => import("./pages/AdminTradeScraper.tsx"));
const AdminApplications = lazyRetry(() => import("./pages/AdminApplications.tsx"));
const AdminApplicationDetail = lazyRetry(() => import("./pages/AdminApplicationDetail.tsx"));
const TradeVerificationPage = lazyRetry(() => import("./pages/TradeVerificationPage.tsx"));
const HomeownerVerificationPage = lazyRetry(() => import("./pages/HomeownerVerificationPage.tsx"));
const TrustCentre = lazyRetry(() => import("./pages/TrustCentre.tsx"));
const PricingPage = lazyRetry(() => import("./pages/PricingPage.tsx"));
const FaqPage = lazyRetry(() => import("./pages/FaqPage.tsx"));
const ResourcesPage = lazyRetry(() => import("./pages/ResourcesPage.tsx"));
const CalculatorsPage = lazyRetry(() => import("./pages/CalculatorsPage.tsx"));
const AdminJobBriefs = lazyRetry(() => import("./pages/AdminJobBriefs.tsx"));
const AdminAnalytics = lazyRetry(() => import("./pages/AdminAnalytics.tsx"));
const AdminLeadDistribution = lazyRetry(() => import("./pages/AdminLeadDistribution.tsx"));
const AdminCustomerDiscovery = lazyRetry(() => import("./pages/AdminCustomerDiscovery.tsx"));
const AdminCallNote = lazyRetry(() => import("./pages/AdminCallNote.tsx"));
const AdminHome = lazyRetry(() => import("./pages/AdminHome.tsx"));
const AdminQuoteStandards = lazyRetry(() => import("./pages/AdminQuoteStandards.tsx"));
const AdminAdvancedQuoteReview = lazyRetry(() => import("./pages/AdminAdvancedQuoteReview.tsx"));
const SimpleQuoteReportPage = lazyRetry(() => import("./pages/SimpleQuoteReport.tsx"));
const QuoteCheckerHome = lazyRetry(() => import("./pages/QuoteCheckerHome.tsx"));
const PlanMyProject = lazyRetry(() => import("./pages/PlanMyProject.tsx"));
const QuoteCheckerSuccess = lazyRetry(() => import("./pages/QuoteCheckerSuccess.tsx"));
const QuoteCheckerCancel = lazyRetry(() => import("./pages/QuoteCheckerCancel.tsx"));
const BoilerQuoteChecker = lazyRetry(() => import("./pages/BoilerQuoteChecker.tsx"));
const BoilerQuoteReportPage = lazyRetry(() => import("./pages/BoilerQuoteReport.tsx"));
const ElectricalQuoteReportPage = lazyRetry(() => import("./pages/ElectricalQuoteReport.tsx"));
const BathroomQuoteReportPage = lazyRetry(() => import("./pages/BathroomQuoteReport.tsx"));
const RoofingQuoteReportPage = lazyRetry(() => import("./pages/RoofingQuoteReport.tsx"));
const KitchenQuoteReportPage = lazyRetry(() => import("./pages/KitchenQuoteReport.tsx"));
const WindowsDoorsQuoteReportPage = lazyRetry(() => import("./pages/WindowsDoorsQuoteReport.tsx"));
const LandscapingQuoteReportPage = lazyRetry(() => import("./pages/LandscapingQuoteReport.tsx"));
const PlasteringQuoteReportPage = lazyRetry(() => import("./pages/PlasteringQuoteReport.tsx"));
const AdminQuoteCheckerModules = lazyRetry(() => import("./pages/AdminQuoteCheckerModules.tsx"));
// ProGrafter Planning Hub — new application shell
const HubLayout = lazyRetry(() => import("./hub/layout/HubLayout.tsx"));
const HubDashboard = lazyRetry(() => import("./hub/pages/HubDashboard.tsx"));
const HubPlanning = lazyRetry(() => import("./hub/pages/HubPlanning.tsx"));
const HubProjectDetail = lazyRetry(() => import("./hub/pages/HubProjectDetail.tsx"));

const HubPipeline = lazyRetry(() => import("./hub/pages/HubPipeline.tsx"));
const HubCalendar = lazyRetry(() => import("./hub/pages/HubCalendar.tsx"));
const HubMessages = lazyRetry(() => import("./hub/pages/HubMessages.tsx"));
const HubProfile = lazyRetry(() => import("./hub/pages/HubProfile.tsx"));
const HubSettings = lazyRetry(() => import("./hub/pages/HubSettings.tsx"));
const HubComingSoon = lazy(() =>
  import("./hub/pages/HubComingSoon.tsx").then((m) => ({ default: m.HubAtlas })),
);
const HubQuoteCheckerSoon = lazy(() =>
  import("./hub/pages/HubComingSoon.tsx").then((m) => ({ default: m.HubQuoteChecker })),
);
const HubMarketplaceSoon = lazy(() =>
  import("./hub/pages/HubComingSoon.tsx").then((m) => ({ default: m.HubMarketplace })),
);
import AdminRoute from "./components/AdminRoute.tsx";
import AppLayout from "./components/layout/AppLayout.tsx";
import DrawerHost from "./components/layout/DrawerHost.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center font-mono text-sm text-muted-foreground">
    Loading…
  </div>
);

const AppRoutes = () => {
  usePageTracking();
  const location = useLocation();
  const backgroundLocation = (location.state as { backgroundLocation?: Location } | null)
    ?.backgroundLocation;
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes location={backgroundLocation ?? location}>


            <Route path="/" element={<Index />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/cookies" element={<Cookies />} />
            <Route path="/complaints" element={<Complaints />} />
            <Route path="/register" element={<TradeRegister />} />
            <Route path="/register/trade" element={<SignupTradeRedirect />} />
            <Route path="/post-a-job" element={<Navigate to="/post-job-brief" replace />} />
            <Route path="/project-cost-guide" element={<PlanMyProject />} />
            <Route path="/plan-my-project" element={<Navigate to="/project-cost-guide" replace />} />
            <Route path="/quote-checker" element={<QuoteCheckerHome />} />
            <Route path="/quote-checker/success" element={<QuoteCheckerSuccess />} />
            <Route path="/quote-checker/cancel" element={<QuoteCheckerCancel />} />
            <Route path="/quote-checker-classic" element={<QuoteChecker />} />
            <Route path="/simple-quote-checker" element={<Navigate to="/quote-checker?module=extension_building" replace />} />
            <Route path="/simple-quote-report/:id" element={<SimpleQuoteReportPage />} />
            <Route path="/boiler-quote-checker" element={<Navigate to="/quote-checker?module=boiler_heating" replace />} />

            <Route path="/boiler-quote-report/:id" element={<BoilerQuoteReportPage />} />
            <Route path="/electrical-quote-checker" element={<Navigate to="/quote-checker?module=electrical_rewire" replace />} />
            <Route path="/electrical-quote-report/:id" element={<ElectricalQuoteReportPage />} />
            <Route path="/bathroom-quote-checker" element={<Navigate to="/quote-checker?module=bathroom" replace />} />
            <Route path="/bathroom-quote-report/:id" element={<BathroomQuoteReportPage />} />
            <Route path="/roofing-quote-checker" element={<Navigate to="/quote-checker?module=roofing" replace />} />
            <Route path="/roofing-quote-report/:id" element={<RoofingQuoteReportPage />} />
            <Route path="/kitchen-quote-checker" element={<Navigate to="/quote-checker?module=kitchen" replace />} />
            <Route path="/kitchen-quote-report/:id" element={<KitchenQuoteReportPage />} />
            <Route path="/windows-doors-quote-checker" element={<Navigate to="/quote-checker?module=windows_doors" replace />} />
            <Route path="/windows-doors-quote-report/:id" element={<WindowsDoorsQuoteReportPage />} />
            <Route path="/landscaping-quote-checker" element={<Navigate to="/quote-checker?module=landscaping_driveway" replace />} />
            <Route path="/landscaping-quote-report/:id" element={<LandscapingQuoteReportPage />} />
            <Route path="/plastering-quote-checker" element={<Navigate to="/quote-checker?module=plastering_rendering" replace />} />
            <Route path="/plastering-quote-report/:id" element={<PlasteringQuoteReportPage />} />
            
            
            <Route path="/report/:id" element={<QuoteReport />} />
            <Route path="/quote/:quoteId" element={<PublicQuoteView />} />
            <Route path="/green" element={<GreenGrants />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
           <Route path="/how-it-works" element={<HowItWorksPage />} />
           <Route path="/trade-verification" element={<TradeVerificationPage />} />
           <Route path="/homeowner-verification" element={<HomeownerVerificationPage />} />
                        <Route path="/project-clarity" element={<ProjectClarity />} />
            <Route path="/project-clarity/:recordId" element={<ProjectClarity />} />
            <Route path="/project-builder" element={<ProjectBuilder />} />
            <Route path="/project-builder/:id" element={<ProjectBuilder />} />
           <Route path="/quote-checker-ai" element={<Navigate to="/project-cost-guide" replace />} />
           <Route path="/ai-quote-checker" element={<Navigate to="/quote-checker" replace />} />
           <Route path="/trust" element={<TrustCentre />} />
           <Route path="/quote-clarity-score" element={<Navigate to="/quote-checker" replace />} />
           <Route path="/quote-health-check" element={<Navigate to="/quote-checker" replace />} />
           <Route path="/pricing" element={<PricingPage />} />
           <Route path="/faq" element={<FaqPage />} />
           <Route path="/resources" element={<ResourcesPage />} />
           <Route path="/calculators" element={<CalculatorsPage />} />
            <Route path="/checkatrade-alternative" element={<CheckatradeAlternative />} />
            <Route path="/is-checkatrade-worth-it" element={<IsCheckatradeWorthIt />} />
            <Route path="/planning-alerts" element={<PlanningAlertsPage />} />
            <Route path="/planning-invite/:token" element={<PlanningInvitePage />} />
            {/* All authenticated (non-admin) routes share ONE layout shell via <Outlet>. */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard/trade" element={<TradeDashboard />} />
              <Route path="/dashboard/trade/settings" element={<TradeSettings />} />
              <Route path="/atlas" element={<SiteScoutGate><AtlasLanding /></SiteScoutGate>} />
              <Route path="/atlas/new" element={<SiteScoutGate><AtlasNewSurvey /></SiteScoutGate>} />
              <Route path="/atlas/:id" element={<SiteScoutGate><AtlasWorkspace /></SiteScoutGate>} />
              <Route path="/atlas/:id/review" element={<SiteScoutGate><AtlasReview /></SiteScoutGate>} />
              <Route path="/atlas/:id/summary" element={<SiteScoutGate><AtlasSummary /></SiteScoutGate>} />
              <Route path="/atlas/:id/capture" element={<SiteScoutGate><AtlasCapture /></SiteScoutGate>} />
              <Route path="/atlas/:id/capture-report" element={<SiteScoutGate><AtlasCaptureReport /></SiteScoutGate>} />
              <Route path="/dashboard/homeowner" element={<HomeownerDashboard />} />
              <Route path="/dashboard/quote-checks" element={<MyQuoteChecks />} />
              <Route path="/dashboard/quote-checks/:id" element={<QuoteCheckDetail />} />
              <Route path="/project/:id" element={<ProjectDetail />} />
              <Route path="/project/:id/compare" element={<CompareQuotes />} />
              <Route path="/project/:id/contract" element={<ContractPage />} />
              <Route path="/manual/:id" element={<HomeownerManual />} />
              <Route path="/quote-builder/quickbuild" element={<QuickBuildPage />} />
              <Route path="/jobs/:jobId/quote" element={<QuoteBuilder />} />
              <Route path="/quotes/:quoteId" element={<QuoteDetail />} />
              <Route path="/jobs/:ref" element={<JobOS />} />
              <Route path="/reviews/:ref" element={<ReviewSubmit />} />
              <Route path="/disputes/new" element={<DisputeRaise />} />
              <Route path="/disputes/:id" element={<DisputeDetail />} />
              <Route path="/signup/trade/under-review" element={<SignupTradeUnderReview />} />
              <Route path="/signup/trade/assessment-pending" element={<SignupTradeAssessmentPending />} />
            </Route>
            {/* Unified spine: posting a brief IS the homeowner sign-up (passwordless). */}
            <Route path="/signup/homeowner" element={<Navigate to="/post-job-brief" replace />} />
            <Route path="/signup/homeowner/next" element={<Navigate to="/dashboard/homeowner" replace />} />
            <Route path="/signup/homeowner/check-email" element={<SignupCheckEmail />} />
            <Route path="/verification" element={<Verification />} />
            <Route path="/signup/trade" element={<SignupTradeRedirect />} />
            <Route path="/admin/verifications" element={<AdminRoute><AdminVerifications /></AdminRoute>} />
            <Route path="/admin/tradevault" element={<AdminRoute><AdminTradeVault /></AdminRoute>} />
            <Route path="/admin/record-agreed-quote" element={<AdminRoute><AdminRecordAgreedQuote /></AdminRoute>} />
            <Route path="/admin/waitlist" element={<AdminRoute><AdminWaitlist /></AdminRoute>} />
            <Route path="/admin/suppliers" element={<AdminRoute><AdminSuppliers /></AdminRoute>} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/admin/email-status" element={<AdminRoute><AdminEmailStatus /></AdminRoute>} />
            <Route path="/admin/testimonials" element={<AdminRoute><AdminTestimonials /></AdminRoute>} />
            <Route path="/share-your-experience" element={<SubmitTestimonial />} />
            <Route path="/legal-review" element={<LegalReview />} />
            <Route path="/apply" element={<Apply />} />
            <Route path="/post-job-brief" element={<PostJobBrief />} />
            <Route path="/prografter-intelligence" element={<ProGrafterIntelligence />} />
            <Route path="/traders/:id/reviews" element={<TraderReviews />} />
            <Route path="/admin/disputes" element={<AdminRoute><AdminDisputes /></AdminRoute>} />
            <Route path="/admin/planning-pipeline" element={<AdminRoute><PlanningPipeline /></AdminRoute>} />
            <Route path="/admin/trade-scraper" element={<AdminRoute><AdminTradeScraper /></AdminRoute>} />
            <Route path="/admin/applications" element={<AdminRoute><AdminApplications /></AdminRoute>} />
            <Route path="/admin/applications/:id" element={<AdminRoute><AdminApplicationDetail /></AdminRoute>} />
            <Route path="/admin/job-briefs" element={<AdminRoute><AdminJobBriefs /></AdminRoute>} />
            {/* Legacy email links pointed at /dashboard — forward instead of 404ing.
                /login routes authenticated users to the right dashboard by role. */}
            <Route path="/dashboard" element={<Navigate to="/login" replace />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="/admin" element={<AdminRoute><AdminHome /></AdminRoute>} />
            <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
            <Route path="/admin/lead-distribution" element={<AdminRoute><AdminLeadDistribution /></AdminRoute>} />
            <Route path="/admin/scoping-calls" element={<AdminRoute><AdminCustomerDiscovery /></AdminRoute>} />
            <Route path="/admin/scoping-calls/:id" element={<AdminRoute><AdminCallNote /></AdminRoute>} />
            <Route path="/admin/quote-standards" element={<AdminRoute><AdminQuoteStandards /></AdminRoute>} />
            <Route path="/admin/advanced-quote-review" element={<AdminRoute><AdminAdvancedQuoteReview /></AdminRoute>} />
            <Route path="/admin/quote-checker-modules" element={<AdminRoute><AdminQuoteCheckerModules /></AdminRoute>} />
            <Route path="/admin/project-readiness-review" element={<Navigate to="/admin/advanced-quote-review" replace />} />
            {/* ProGrafter Planning Hub — new premium app shell */}
            <Route path="/hub" element={<HubLayout />}>
              <Route index element={<HubDashboard />} />
              <Route path="planning" element={<HubPlanning />} />
              <Route path="opportunity/:id" element={<HubProjectDetail />} />
              <Route path="pipeline" element={<HubPipeline />} />

              <Route path="calendar" element={<HubCalendar />} />
              <Route path="messages" element={<HubMessages />} />
              <Route path="profile" element={<HubProfile />} />
              <Route path="settings" element={<HubSettings />} />
              <Route path="atlas" element={<HubComingSoon />} />
              <Route path="quote-checker" element={<HubQuoteCheckerSoon />} />
              <Route path="marketplace" element={<HubMarketplaceSoon />} />
            </Route>
            <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Drawer layer: when a backgroundLocation is present, detail routes render
          in a slide-over Sheet over the preserved dashboard list. */}
      {backgroundLocation && (
        <Routes>
          <Route
            element={
              <ProtectedRoute>
                <DrawerHost />
              </ProtectedRoute>
            }
          >
            <Route path="/project/:id" element={<ProjectDetail />} />
            <Route path="/project/:id/compare" element={<CompareQuotes />} />
            <Route path="/project/:id/contract" element={<ContractPage />} />
            <Route path="/dashboard/quote-checks/:id" element={<QuoteCheckDetail />} />
          </Route>
        </Routes>
      )}
    </Suspense>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <PWAInstallBanner />
        <Chatbot />
        <AppRoutes />
        <GlobalLegalFooter />
        <CookieConsent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
