import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation, type Location } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import PWAInstallBanner from "./components/PWAInstallBanner.tsx";
import Chatbot from "./components/Chatbot.tsx";
import { usePageTracking } from "./hooks/usePageTracking.ts";

// Lazy-load every non-landing route so the initial bundle stays small
const Index = lazy(() => import("./pages/Index.tsx"));
const Login = lazy(() => import("./pages/Login.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const Privacy = lazy(() => import("./pages/Privacy.tsx"));
const Cookies = lazy(() => import("./pages/Cookies.tsx"));
const TradeRegister = lazy(() => import("./pages/TradeRegister.tsx"));
const SignupTrade = lazy(() => import("./pages/SignupTrade.tsx"));
const SignupTradeUnderReview = lazy(() => import("./pages/SignupTradeUnderReview.tsx"));
const SignupTradeAssessmentPending = lazy(() => import("./pages/SignupTradeAssessmentPending.tsx"));
const Verification = lazy(() => import("./pages/Verification.tsx"));
const PostAJob = lazy(() => import("./pages/PostAJob.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));
const TradeDashboard = lazy(() => import("./pages/TradeDashboard.tsx"));
const AtlasLanding = lazy(() => import("./atlas/pages/AtlasLanding.tsx"));
const AtlasNewSurvey = lazy(() => import("./atlas/pages/AtlasNewSurvey.tsx"));
const AtlasWorkspace = lazy(() => import("./atlas/pages/AtlasWorkspace.tsx"));
const AtlasReview = lazy(() => import("./atlas/pages/AtlasReview.tsx"));
const AtlasSummary = lazy(() => import("./atlas/pages/AtlasSummary.tsx"));
const TradeSettings = lazy(() => import("./pages/TradeSettings.tsx"));
const HomeownerDashboard = lazy(() => import("./pages/HomeownerDashboard.tsx"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail.tsx"));
const CompareQuotes = lazy(() => import("./pages/CompareQuotes.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const QuoteChecker = lazy(() => import("./pages/QuoteChecker.tsx"));
const QuoteReport = lazy(() => import("./pages/QuoteReport.tsx"));
const MyQuoteChecks = lazy(() => import("./pages/MyQuoteChecks.tsx"));
const QuoteCheckDetail = lazy(() => import("./pages/QuoteCheckDetail.tsx"));
const GreenGrants = lazy(() => import("./pages/GreenGrants.tsx"));
const PlanningAlertsPage = lazy(() => import("./pages/PlanningAlerts.tsx"));
const PlanningInvitePage = lazy(() => import("./pages/PlanningInvite.tsx"));
const HomeownerManual = lazy(() => import("./pages/HomeownerManual.tsx"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe.tsx"));
const Contact = lazy(() => import("./pages/Contact.tsx"));
const About = lazy(() => import("./pages/About.tsx"));
const HowItWorksPage = lazy(() => import("./pages/HowItWorksPage.tsx"));
const SignupHomeowner = lazy(() => import("./pages/SignupHomeowner.tsx"));
const SignupHomeownerNext = lazy(() => import("./pages/SignupHomeownerNext.tsx"));
const SignupCheckEmail = lazy(() => import("./pages/SignupCheckEmail.tsx"));
const AuthCallback = lazy(() => import("./pages/AuthCallback.tsx"));
const OAuthConsent = lazy(() => import("./pages/OAuthConsent.tsx"));
const SignupTradeRedirect = lazy(() => import("./pages/SignupTradeRedirect.tsx"));
const AdminVerifications = lazy(() => import("./pages/AdminVerifications.tsx"));
const AdminTradeVault = lazy(() => import("./pages/AdminTradeVault.tsx"));
const AdminWaitlist = lazy(() => import("./pages/AdminWaitlist.tsx"));
const AdminSuppliers = lazy(() => import("./pages/AdminSuppliers.tsx"));
const Suppliers = lazy(() => import("./pages/Suppliers.tsx"));
const AdminEmailStatus = lazy(() => import("./pages/AdminEmailStatus.tsx"));
const AdminTestimonials = lazy(() => import("./pages/AdminTestimonials.tsx"));
const SubmitTestimonial = lazy(() => import("./pages/SubmitTestimonial.tsx"));
const CheckatradeAlternative = lazy(() => import("./pages/CheckatradeAlternative.tsx"));
const IsCheckatradeWorthIt = lazy(() => import("./pages/IsCheckatradeWorthIt.tsx"));
const ContractPage = lazy(() => import("./pages/ContractPage.tsx"));
const LegalReview = lazy(() => import("./pages/LegalReview.tsx"));
const QuickBuildPage = lazy(() => import("./pages/QuickBuildPage.tsx"));
const Apply = lazy(() => import("./pages/Apply.tsx"));
const Vetting = lazy(() => import("./pages/Vetting.tsx"));
const PostJobBrief = lazy(() => import("./pages/PostJobBrief.tsx"));
const ProjectClarity = lazy(() => import("./pages/ProjectClarity.tsx"));
const ProjectBuilder = lazy(() => import("./pages/ProjectBuilder.tsx"));
const ProGrafterIntelligence = lazy(() => import("./pages/ProGrafterIntelligence.tsx"));
const JobOS = lazy(() => import("./pages/JobOS.tsx"));
const ReviewSubmit = lazy(() => import("./pages/ReviewSubmit.tsx"));
const TraderReviews = lazy(() => import("./pages/TraderReviews.tsx"));
const DisputeRaise = lazy(() => import("./pages/DisputeRaise.tsx"));
const DisputeDetail = lazy(() => import("./pages/DisputeDetail.tsx"));
const AdminDisputes = lazy(() => import("./pages/AdminDisputes.tsx"));
const PlanningPipeline = lazy(() => import("./pages/PlanningPipeline.tsx"));
const AdminTradeScraper = lazy(() => import("./pages/AdminTradeScraper.tsx"));
const AdminApplications = lazy(() => import("./pages/AdminApplications.tsx"));
const AdminApplicationDetail = lazy(() => import("./pages/AdminApplicationDetail.tsx"));
const TradeVerificationPage = lazy(() => import("./pages/TradeVerificationPage.tsx"));
const HomeownerVerificationPage = lazy(() => import("./pages/HomeownerVerificationPage.tsx"));
const TrustCentre = lazy(() => import("./pages/TrustCentre.tsx"));
const PricingPage = lazy(() => import("./pages/PricingPage.tsx"));
const FaqPage = lazy(() => import("./pages/FaqPage.tsx"));
const ResourcesPage = lazy(() => import("./pages/ResourcesPage.tsx"));
const CalculatorsPage = lazy(() => import("./pages/CalculatorsPage.tsx"));
const AdminJobBriefs = lazy(() => import("./pages/AdminJobBriefs.tsx"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics.tsx"));
const AdminLeadDistribution = lazy(() => import("./pages/AdminLeadDistribution.tsx"));
const AdminCustomerDiscovery = lazy(() => import("./pages/AdminCustomerDiscovery.tsx"));
const AdminCallNote = lazy(() => import("./pages/AdminCallNote.tsx"));
const AdminHome = lazy(() => import("./pages/AdminHome.tsx"));
const AdminQuoteStandards = lazy(() => import("./pages/AdminQuoteStandards.tsx"));
const AdminAdvancedQuoteReview = lazy(() => import("./pages/AdminAdvancedQuoteReview.tsx"));
const SimpleQuoteReportPage = lazy(() => import("./pages/SimpleQuoteReport.tsx"));
const QuoteCheckerHome = lazy(() => import("./pages/QuoteCheckerHome.tsx"));
const PlanMyProject = lazy(() => import("./pages/PlanMyProject.tsx"));
const QuoteCheckerSuccess = lazy(() => import("./pages/QuoteCheckerSuccess.tsx"));
const QuoteCheckerCancel = lazy(() => import("./pages/QuoteCheckerCancel.tsx"));
const BoilerQuoteChecker = lazy(() => import("./pages/BoilerQuoteChecker.tsx"));
const BoilerQuoteReportPage = lazy(() => import("./pages/BoilerQuoteReport.tsx"));
const ElectricalQuoteReportPage = lazy(() => import("./pages/ElectricalQuoteReport.tsx"));
const BathroomQuoteReportPage = lazy(() => import("./pages/BathroomQuoteReport.tsx"));
const RoofingQuoteReportPage = lazy(() => import("./pages/RoofingQuoteReport.tsx"));
const KitchenQuoteReportPage = lazy(() => import("./pages/KitchenQuoteReport.tsx"));
const WindowsDoorsQuoteReportPage = lazy(() => import("./pages/WindowsDoorsQuoteReport.tsx"));
const LandscapingQuoteReportPage = lazy(() => import("./pages/LandscapingQuoteReport.tsx"));
const PlasteringQuoteReportPage = lazy(() => import("./pages/PlasteringQuoteReport.tsx"));
const AdminQuoteCheckerModules = lazy(() => import("./pages/AdminQuoteCheckerModules.tsx"));
// ProGrafter Planning Hub — new application shell
const HubLayout = lazy(() => import("./hub/layout/HubLayout.tsx"));
const HubDashboard = lazy(() => import("./hub/pages/HubDashboard.tsx"));
const HubPlanning = lazy(() => import("./hub/pages/HubPlanning.tsx"));
const HubProjectDetail = lazy(() => import("./hub/pages/HubProjectDetail.tsx"));

const HubPipeline = lazy(() => import("./hub/pages/HubPipeline.tsx"));
const HubCalendar = lazy(() => import("./hub/pages/HubCalendar.tsx"));
const HubMessages = lazy(() => import("./hub/pages/HubMessages.tsx"));
const HubProfile = lazy(() => import("./hub/pages/HubProfile.tsx"));
const HubSettings = lazy(() => import("./hub/pages/HubSettings.tsx"));
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
            <Route path="/register" element={<TradeRegister />} />
            <Route path="/register/trade" element={<SignupTradeRedirect />} />
            <Route path="/post-a-job" element={<Navigate to="/post-job-brief" replace />} />
            <Route path="/project-cost-guide" element={<PlanMyProject />} />
            <Route path="/project-cost-guide" element={<Navigate to="/project-cost-guide" replace />} />
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
              <Route path="/atlas" element={<AtlasLanding />} />
              <Route path="/atlas/new" element={<AtlasNewSurvey />} />
              <Route path="/atlas/:id" element={<AtlasWorkspace />} />
              <Route path="/atlas/:id/review" element={<AtlasReview />} />
              <Route path="/atlas/:id/summary" element={<AtlasSummary />} />
              <Route path="/dashboard/homeowner" element={<HomeownerDashboard />} />
              <Route path="/dashboard/quote-checks" element={<MyQuoteChecks />} />
              <Route path="/dashboard/quote-checks/:id" element={<QuoteCheckDetail />} />
              <Route path="/project/:id" element={<ProjectDetail />} />
              <Route path="/project/:id/compare" element={<CompareQuotes />} />
              <Route path="/project/:id/contract" element={<ContractPage />} />
              <Route path="/manual/:id" element={<HomeownerManual />} />
              <Route path="/quote-builder/quickbuild" element={<QuickBuildPage />} />
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
            <Route path="/admin/waitlist" element={<AdminRoute><AdminWaitlist /></AdminRoute>} />
            <Route path="/admin/suppliers" element={<AdminRoute><AdminSuppliers /></AdminRoute>} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/admin/email-status" element={<AdminRoute><AdminEmailStatus /></AdminRoute>} />
            <Route path="/admin/testimonials" element={<AdminRoute><AdminTestimonials /></AdminRoute>} />
            <Route path="/share-your-experience" element={<SubmitTestimonial />} />
            <Route path="/legal-review" element={<LegalReview />} />
            <Route path="/apply" element={<Apply />} />
            <Route path="/vetting" element={<Vetting />} />
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
