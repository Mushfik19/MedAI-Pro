# 6. Component Tree

## 6.1 Application composition

```text
App
├── ErrorBoundary
├── QueryClientProvider
├── AuthProvider
├── ThemeProvider
├── MotionConfig
├── TooltipProvider
├── ToastProvider
└── RouterProvider
    ├── PublicLayout
    │   ├── PublicHeader
    │   ├── MobileNavigation
    │   ├── Outlet
    │   └── PublicFooter
    ├── AuthLayout
    │   ├── BrandPanel
    │   ├── SafetyNotice
    │   └── Outlet
    └── AppShell
        ├── SkipLink
        ├── Sidebar
        ├── MobileAppBar
        ├── Breadcrumbs
        ├── NotificationCenter
        ├── UserMenu
        ├── RouteErrorBoundary
        └── Outlet
```

Provider order ensures errors are captured above data/auth providers, authentication is available to routing, and theme/motion preferences apply globally.

## 6.2 Route tree

```text
/
├── LandingPage
├── /about                      ProductSafetyPage
├── /privacy                    PrivacyPage
├── /terms                      TermsPage
├── /auth
│   ├── /login                  LoginPage
│   ├── /register               RegisterPage
│   ├── /verify-email           VerifyEmailPage
│   ├── /forgot-password        ForgotPasswordPage
│   ├── /reset-password         ResetPasswordPage
│   └── /mfa                    MfaChallengePage
└── protected
    ├── /dashboard              PatientDashboardPage
    ├── /predict                PredictionWizardPage
    ├── /predictions            PredictionHistoryPage
    ├── /predictions/:id        PredictionDetailPage
    ├── /chat                   ChatIndexPage
    ├── /chat/:id               ChatConversationPage
    ├── /profile                ProfilePage
    ├── /settings               SettingsPage
    ├── /doctor                 DoctorDashboardPage
    ├── /doctor/patients        DoctorPatientsPage
    ├── /doctor/patients/:id    DoctorPatientDetailPage
    └── /admin
        ├── /                    AdminOverviewPage
        ├── /users              UserManagementPage
        ├── /catalog            ClinicalCatalogPage
        ├── /datasets           DatasetManagementPage
        ├── /training           TrainingJobsPage
        ├── /models             ModelRegistryPage
        ├── /analytics          AdminAnalyticsPage
        └── /audit              AuditLogPage
```

`ProtectedRoute` verifies authentication; `RoleRoute` verifies coarse role access. The server remains the source of authorization truth.

## 6.3 Landing page

```text
LandingPage
├── HeroSection
│   ├── TrustBadge
│   ├── HeroActions
│   └── ProductPreview
├── SafetyDisclosure
├── FeatureGrid
├── HowItWorksTimeline
├── ClinicalWorkflowPreview
├── SecurityAndPrivacySection
├── RoleBenefitsTabs
├── FaqAccordion
└── FinalCallToAction
```

The visual language uses a restrained blue/cyan gradient, opaque high-contrast reading surfaces, subtle glass panels, medical data visualizations, and motion limited to orientation and feedback.

## 6.4 Prediction workflow

```text
PredictionWizardPage
├── PredictionSafetyBanner
├── WizardProgress
├── AssessmentForm
│   ├── SymptomSearchCombobox
│   ├── SymptomCategoryList
│   ├── SelectedSymptomCard[]
│   │   ├── IntensityScale
│   │   └── DurationInput
│   ├── ContextFields
│   ├── InformedUseCheckbox
│   └── WizardNavigation
├── AssessmentReview
└── PredictionSubmissionState

PredictionDetailPage
├── EmergencyAlert
├── PredictionHeader
├── ConfidenceCard
├── DifferentialDiagnosisList
│   └── DiseaseResultCard[]
│       ├── ProbabilityBar
│       ├── SeverityBadge
│       ├── EvidenceList
│       ├── RecommendedTests
│       └── SpecialistRecommendation
├── AIExplanationPanel
├── ModelTransparencyCard
├── ReportActions
└── ClinicalDisclaimer
```

The emergency alert renders before charts and cannot be dismissed until acknowledged. Probability is shown with text and a bar, never color alone. “Confidence” is explained separately from clinical certainty.

## 6.5 Patient dashboard and history

```text
PatientDashboardPage
├── DashboardHeader
├── PeriodSelector
├── StatCardGrid
│   ├── TotalPredictionsCard
│   ├── AverageConfidenceCard
│   ├── RecentActivityCard
│   └── RedFlagCard
├── PredictionTrendChart
├── DiseaseFrequencyChart
├── WeeklyReportCard
├── MonthlyReportCard
└── RecentPredictionsTable

PredictionHistoryPage
├── HistoryFilters
├── HistorySummary
├── ResponsiveDataView
│   ├── PredictionTable
│   └── PredictionCardList
├── CursorPagination
└── EmptyHistoryState
```

Recharts wrappers provide accessible summaries and a tabular alternative for chart data.

## 6.6 Chat

```text
ChatConversationPage
├── ConversationSidebar
├── ChatHeader
│   └── GroundingScopeBadge
├── MessageList
│   ├── UserMessage
│   ├── AssistantMessage
│   │   ├── GroundingReferences
│   │   └── SafetyDisclosure
│   ├── StreamingMessage
│   └── EmergencyChatAlert
├── SuggestedPrompts
└── ChatComposer
```

Chat always shows whether it is grounded in a specific prediction. The composer prevents unsupported attachments in the initial release and exposes stop/retry controls for streaming.

## 6.7 Doctor panel

```text
DoctorDashboardPage
├── DoctorSummaryCards
├── ReviewQueue
├── RedFlagPatientList
└── RecentPatientActivity

DoctorPatientDetailPage
├── PatientAccessBanner
├── SharedPatientSummary
├── PredictionTimeline
├── PredictionClinicalView
├── ReviewDispositionForm
├── ClinicalNoteComposer
│   ├── NoteEditor
│   ├── SignConfirmationDialog
│   └── NoteRevisionHistory
└── PdfExportDialog
```

Access scope and expiration remain visible to the doctor. Signing uses a confirmation step because notes become immutable.

## 6.8 Admin panel

```text
AdminOverviewPage
├── OperationalHealthCards
├── UsageTrendChart
├── ModelStatusCard
├── DatasetStatusCard
└── SecurityEventSummary

UserManagementPage
├── UserFilters
├── UserDataTable
├── UserDetailDrawer
└── AccountActionDialog

ClinicalCatalogPage
├── CatalogTabs
├── CatalogDataTable
├── CatalogEditorSheet
└── VersionConflictDialog

DatasetManagementPage
├── SecureUploadDropzone
├── DatasetTable
└── ValidationReportDrawer

TrainingJobsPage
├── StartTrainingDialog
├── TrainingJobTable
└── TrainingProgressDrawer

ModelRegistryPage
├── ActiveModelBanner
├── ModelComparisonTable
├── EvaluationMetricsPanel
├── SubgroupMetricsPanel
├── ApprovalDialog
└── RollbackDialog
```

High-risk actions use a reason field, step-up authentication, confirmation, and a visible audit result.

## 6.9 Reusable primitives

- Layout: `PageHeader`, `SectionCard`, `ResponsiveDataView`, `EmptyState`, `DetailDrawer`
- Feedback: `InlineAlert`, `EmergencyAlert`, `ErrorState`, `Skeleton`, `ProgressState`, `ConfirmActionDialog`
- Data: `StatCard`, `DataTable`, `FilterBar`, `CursorPagination`, `MetricTooltip`
- Clinical: `SeverityBadge`, `ConfidenceIndicator`, `ProbabilityBar`, `ClinicalDisclaimer`, `ModelVersionBadge`
- Forms: Shadcn-based field wrappers integrated with React Hook Form and Zod
- Charts: typed wrappers around Recharts with shared colors, tooltips, responsive containers, and accessible summaries

## 6.10 State strategy

- TanStack Query: all server data, caching, invalidation, mutations, retry rules, and optimistic updates only where safe.
- React Hook Form + Zod: transient form state and client feedback; server validation remains authoritative.
- URL search params: filters, sort, period, pagination cursor where shareable.
- React context: authenticated identity, theme, and reduced-motion preference only.
- No general-purpose global store is introduced until a concrete cross-feature state need appears.

## 6.11 Design rationale

The tree separates route composition, feature ownership, and reusable primitives. It prevents a monolithic dashboard component, keeps permissions visible at route and API boundaries, and ensures clinical safety elements are first-class components rather than ad hoc text.
