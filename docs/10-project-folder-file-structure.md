# MediAI Pro — Complete Folder and File Structure

| Document property | Value |
|---|---|
| Document ID | MAP-STRUCT-001 |
| Version | 1.0 |
| Status | Proposed — awaiting approval |
| Date | 2026-07-26 |
| Repository root | `D:\React JS\Ai ML project\my-project` |
| Related architecture | MAP-ARCH-001 |

This document defines the complete target monorepo structure. It does not create empty application files or implementation code. Empty scaffolds are intentionally deferred until implementation because a file must be created with its production responsibility, tests, and imports rather than as a placeholder.

All paths below are relative to the repository root:

`D:\React JS\Ai ML project\my-project`

## 1. Organization strategy

- `frontend/` owns the React 19 TypeScript application and browser-specific tests.
- `backend/` owns the FastAPI application, worker entry points, database migrations, and backend tests.
- `machine-learning/` owns reusable dataset, training, evaluation, artifact, and inference logic. It does not own HTTP or database concerns.
- `packages/` owns language-appropriate shared contracts, design tokens, configuration packages, and cross-system synthetic fixtures.
- `tests/` owns tests that span deployable applications or require the whole system.
- `docs/` owns product, architecture, engineering, security, ML, operations, and decision records.
- `docker/` owns local/test container definitions; production platform configuration remains in `infrastructure/`.
- `infrastructure/` owns Vercel, Railway, Supabase, monitoring, and environment deployment descriptions.
- `config/` owns repository-wide policy configuration that is not specific to one application.
- `.github/` owns repository automation, templates, dependency management, and workflows.

Tool-native configuration stays beside the tool that consumes it. For example, `frontend/vite.config.ts` belongs with the frontend, while repository-wide security policy belongs under `config/security/`.

## 2. Complete target directory tree

```text
my-project/
|-- .github/
|   |-- ISSUE_TEMPLATE/
|   |   |-- bug-report.yml
|   |   |-- feature-request.yml
|   |   |-- security-report.yml
|   |   `-- config.yml
|   |-- PULL_REQUEST_TEMPLATE/
|   |   `-- pull_request_template.md
|   |-- CODEOWNERS
|   |-- dependabot.yml
|   `-- workflows/
|       |-- frontend-ci.yml
|       |-- backend-ci.yml
|       |-- machine-learning-ci.yml
|       |-- contract-ci.yml
|       |-- end-to-end-ci.yml
|       |-- security-ci.yml
|       |-- accessibility-ci.yml
|       |-- docker-ci.yml
|       |-- migration-ci.yml
|       |-- deploy-preview.yml
|       |-- deploy-staging.yml
|       `-- deploy-production.yml
|
|-- config/
|   |-- README.md
|   |-- environments/
|   |   |-- README.md
|   |   |-- local.env.example
|   |   |-- test.env.example
|   |   |-- staging.env.example
|   |   `-- production.env.example
|   |-- quality/
|   |   |-- README.md
|   |   |-- coverage-policy.yml
|   |   `-- quality-gates.yml
|   |-- security/
|   |   |-- README.md
|   |   |-- content-security-policy.yml
|   |   |-- cors-policy.yml
|   |   |-- data-classification.yml
|   |   |-- rate-limit-policy.yml
|   |   `-- secret-scanning-policy.yml
|   `-- clinical-safety/
|       |-- README.md
|       |-- emergency-policy.yml
|       |-- llm-authority-policy.yml
|       `-- model-promotion-policy.yml
|
|-- frontend/
|   |-- README.md
|   |-- public/
|   |   |-- favicon.svg
|   |   |-- robots.txt
|   |   `-- images/
|   |       |-- brand/
|   |       `-- illustrations/
|   |-- src/
|   |   |-- main.tsx
|   |   |-- vite-env.d.ts
|   |   |-- app/
|   |   |   |-- App.tsx
|   |   |   |-- AppProviders.tsx
|   |   |   |-- queryClient.ts
|   |   |   |-- router.tsx
|   |   |   |-- routePaths.ts
|   |   |   |-- applicationConfig.ts
|   |   |   `-- errorBoundary.tsx
|   |   |-- assets/
|   |   |   |-- icons/
|   |   |   `-- images/
|   |   |-- components/
|   |   |   |-- README.md
|   |   |   |-- ui/
|   |   |   |   |-- alert.tsx
|   |   |   |   |-- avatar.tsx
|   |   |   |   |-- badge.tsx
|   |   |   |   |-- button.tsx
|   |   |   |   |-- calendar.tsx
|   |   |   |   |-- card.tsx
|   |   |   |   |-- checkbox.tsx
|   |   |   |   |-- command.tsx
|   |   |   |   |-- dialog.tsx
|   |   |   |   |-- dropdown-menu.tsx
|   |   |   |   |-- form.tsx
|   |   |   |   |-- input.tsx
|   |   |   |   |-- label.tsx
|   |   |   |   |-- popover.tsx
|   |   |   |   |-- progress.tsx
|   |   |   |   |-- radio-group.tsx
|   |   |   |   |-- scroll-area.tsx
|   |   |   |   |-- select.tsx
|   |   |   |   |-- separator.tsx
|   |   |   |   |-- sheet.tsx
|   |   |   |   |-- skeleton.tsx
|   |   |   |   |-- sonner.tsx
|   |   |   |   |-- switch.tsx
|   |   |   |   |-- table.tsx
|   |   |   |   |-- tabs.tsx
|   |   |   |   |-- textarea.tsx
|   |   |   |   |-- tooltip.tsx
|   |   |   |   `-- index.ts
|   |   |   |-- layout/
|   |   |   |   |-- AppShell.tsx
|   |   |   |   |-- AuthLayout.tsx
|   |   |   |   |-- PublicLayout.tsx
|   |   |   |   |-- PageContainer.tsx
|   |   |   |   |-- PageHeader.tsx
|   |   |   |   |-- SectionCard.tsx
|   |   |   |   `-- index.ts
|   |   |   |-- navigation/
|   |   |   |   |-- AppSidebar.tsx
|   |   |   |   |-- Breadcrumbs.tsx
|   |   |   |   |-- MobileNavigation.tsx
|   |   |   |   |-- PublicHeader.tsx
|   |   |   |   |-- SkipLink.tsx
|   |   |   |   |-- UserMenu.tsx
|   |   |   |   `-- index.ts
|   |   |   |-- feedback/
|   |   |   |   |-- ConfirmActionDialog.tsx
|   |   |   |   |-- EmptyState.tsx
|   |   |   |   |-- ErrorState.tsx
|   |   |   |   |-- InlineAlert.tsx
|   |   |   |   |-- LoadingState.tsx
|   |   |   |   |-- PermissionDenied.tsx
|   |   |   |   |-- RouteErrorView.tsx
|   |   |   |   `-- index.ts
|   |   |   |-- data-display/
|   |   |   |   |-- CursorPagination.tsx
|   |   |   |   |-- DataTable.tsx
|   |   |   |   |-- DetailDrawer.tsx
|   |   |   |   |-- FilterBar.tsx
|   |   |   |   |-- ResponsiveDataView.tsx
|   |   |   |   |-- StatCard.tsx
|   |   |   |   `-- index.ts
|   |   |   |-- charts/
|   |   |   |   |-- AccessibleChart.tsx
|   |   |   |   |-- ChartContainer.tsx
|   |   |   |   |-- ChartDataTable.tsx
|   |   |   |   |-- ChartTooltip.tsx
|   |   |   |   `-- index.ts
|   |   |   `-- clinical/
|   |   |       |-- ClinicalDisclaimer.tsx
|   |   |       |-- ConfidenceIndicator.tsx
|   |   |       |-- EmergencyAlert.tsx
|   |   |       |-- ModelVersionBadge.tsx
|   |   |       |-- ProbabilityBar.tsx
|   |   |       |-- SeverityBadge.tsx
|   |   |       `-- index.ts
|   |   |-- features/
|   |   |   |-- landing/
|   |   |   |   |-- components/
|   |   |   |   |   |-- ClinicalWorkflowPreview.tsx
|   |   |   |   |   |-- FaqSection.tsx
|   |   |   |   |   |-- FeatureGrid.tsx
|   |   |   |   |   |-- FinalCallToAction.tsx
|   |   |   |   |   |-- HeroSection.tsx
|   |   |   |   |   |-- HowItWorks.tsx
|   |   |   |   |   |-- SafetyDisclosure.tsx
|   |   |   |   |   `-- SecurityPrivacySection.tsx
|   |   |   |   |-- pages/
|   |   |   |   |   |-- LandingPage.tsx
|   |   |   |   |   |-- PrivacyPage.tsx
|   |   |   |   |   |-- ProductSafetyPage.tsx
|   |   |   |   |   `-- TermsPage.tsx
|   |   |   |   `-- index.ts
|   |   |   |-- auth/
|   |   |   |   |-- api/
|   |   |   |   |   |-- auth.keys.ts
|   |   |   |   |   |-- auth.mutations.ts
|   |   |   |   |   |-- auth.queries.ts
|   |   |   |   |   `-- auth.service.ts
|   |   |   |   |-- components/
|   |   |   |   |   |-- AuthGuard.tsx
|   |   |   |   |   |-- LoginForm.tsx
|   |   |   |   |   |-- MfaChallengeForm.tsx
|   |   |   |   |   |-- PasswordField.tsx
|   |   |   |   |   |-- PasswordResetForm.tsx
|   |   |   |   |   |-- RegisterForm.tsx
|   |   |   |   |   |-- RoleGuard.tsx
|   |   |   |   |   `-- SessionList.tsx
|   |   |   |   |-- hooks/
|   |   |   |   |   |-- useAuth.ts
|   |   |   |   |   `-- usePermissions.ts
|   |   |   |   |-- pages/
|   |   |   |   |   |-- ForgotPasswordPage.tsx
|   |   |   |   |   |-- LoginPage.tsx
|   |   |   |   |   |-- MfaChallengePage.tsx
|   |   |   |   |   |-- RegisterPage.tsx
|   |   |   |   |   |-- ResetPasswordPage.tsx
|   |   |   |   |   `-- VerifyEmailPage.tsx
|   |   |   |   |-- schemas/
|   |   |   |   |   |-- login.schema.ts
|   |   |   |   |   |-- mfa.schema.ts
|   |   |   |   |   |-- password.schema.ts
|   |   |   |   |   `-- registration.schema.ts
|   |   |   |   |-- types/
|   |   |   |   |   `-- auth.types.ts
|   |   |   |   `-- index.ts
|   |   |   |-- predictions/
|   |   |   |   |-- api/
|   |   |   |   |   |-- prediction.keys.ts
|   |   |   |   |   |-- prediction.mutations.ts
|   |   |   |   |   |-- prediction.queries.ts
|   |   |   |   |   `-- prediction.service.ts
|   |   |   |   |-- components/
|   |   |   |   |   |-- AssessmentForm.tsx
|   |   |   |   |   |-- AssessmentReview.tsx
|   |   |   |   |   |-- ContextFields.tsx
|   |   |   |   |   |-- DifferentialDiagnosisList.tsx
|   |   |   |   |   |-- DiseaseResultCard.tsx
|   |   |   |   |   |-- InformedUseField.tsx
|   |   |   |   |   |-- ModelTransparencyCard.tsx
|   |   |   |   |   |-- PredictionExplanation.tsx
|   |   |   |   |   |-- PredictionHeader.tsx
|   |   |   |   |   |-- SelectedSymptomCard.tsx
|   |   |   |   |   |-- SymptomSearch.tsx
|   |   |   |   |   `-- WizardProgress.tsx
|   |   |   |   |-- hooks/
|   |   |   |   |   |-- usePrediction.ts
|   |   |   |   |   `-- usePredictionWizard.ts
|   |   |   |   |-- pages/
|   |   |   |   |   |-- PredictionDetailPage.tsx
|   |   |   |   |   `-- PredictionWizardPage.tsx
|   |   |   |   |-- schemas/
|   |   |   |   |   |-- assessment.schema.ts
|   |   |   |   |   `-- prediction.schema.ts
|   |   |   |   |-- types/
|   |   |   |   |   `-- prediction.types.ts
|   |   |   |   `-- index.ts
|   |   |   |-- history/
|   |   |   |   |-- api/
|   |   |   |   |   |-- history.keys.ts
|   |   |   |   |   |-- history.queries.ts
|   |   |   |   |   `-- history.service.ts
|   |   |   |   |-- components/
|   |   |   |   |   |-- HistoryFilters.tsx
|   |   |   |   |   |-- PredictionHistoryCard.tsx
|   |   |   |   |   |-- PredictionHistoryTable.tsx
|   |   |   |   |   |-- ReportActions.tsx
|   |   |   |   |   `-- ReportStatus.tsx
|   |   |   |   |-- pages/
|   |   |   |   |   `-- PredictionHistoryPage.tsx
|   |   |   |   |-- schemas/
|   |   |   |   |   `-- historyFilters.schema.ts
|   |   |   |   |-- types/
|   |   |   |   |   `-- history.types.ts
|   |   |   |   `-- index.ts
|   |   |   |-- dashboard/
|   |   |   |   |-- api/
|   |   |   |   |   |-- dashboard.keys.ts
|   |   |   |   |   |-- dashboard.queries.ts
|   |   |   |   |   `-- dashboard.service.ts
|   |   |   |   |-- components/
|   |   |   |   |   |-- DiseaseFrequencyChart.tsx
|   |   |   |   |   |-- MonthlyReportCard.tsx
|   |   |   |   |   |-- PredictionTrendChart.tsx
|   |   |   |   |   |-- RecentPredictions.tsx
|   |   |   |   |   |-- SummaryCards.tsx
|   |   |   |   |   `-- WeeklyReportCard.tsx
|   |   |   |   |-- pages/
|   |   |   |   |   `-- PatientDashboardPage.tsx
|   |   |   |   |-- types/
|   |   |   |   |   `-- dashboard.types.ts
|   |   |   |   `-- index.ts
```

The frontend tree continues in the next subsection to keep each feature readable while remaining part of the same target structure.

### 2.1 Frontend tree continued

```text
frontend/
|-- src/
|   |-- features/
|   |   |-- chat/
|   |   |   |-- api/
|   |   |   |   |-- chat.keys.ts
|   |   |   |   |-- chat.mutations.ts
|   |   |   |   |-- chat.queries.ts
|   |   |   |   |-- chat.service.ts
|   |   |   |   `-- chat.stream.ts
|   |   |   |-- components/
|   |   |   |   |-- AssistantMessage.tsx
|   |   |   |   |-- ChatComposer.tsx
|   |   |   |   |-- ChatHeader.tsx
|   |   |   |   |-- ConversationList.tsx
|   |   |   |   |-- EmergencyChatAlert.tsx
|   |   |   |   |-- GroundingReferences.tsx
|   |   |   |   |-- MessageList.tsx
|   |   |   |   |-- StreamingMessage.tsx
|   |   |   |   `-- SuggestedPrompts.tsx
|   |   |   |-- hooks/
|   |   |   |   |-- useChatStream.ts
|   |   |   |   `-- useConversation.ts
|   |   |   |-- pages/
|   |   |   |   |-- ChatConversationPage.tsx
|   |   |   |   `-- ChatIndexPage.tsx
|   |   |   |-- schemas/
|   |   |   |   `-- chatMessage.schema.ts
|   |   |   |-- types/
|   |   |   |   `-- chat.types.ts
|   |   |   `-- index.ts
|   |   |-- doctor/
|   |   |   |-- api/
|   |   |   |   |-- doctor.keys.ts
|   |   |   |   |-- doctor.mutations.ts
|   |   |   |   |-- doctor.queries.ts
|   |   |   |   `-- doctor.service.ts
|   |   |   |-- components/
|   |   |   |   |-- AccessGrantBanner.tsx
|   |   |   |   |-- ClinicalNoteComposer.tsx
|   |   |   |   |-- NoteRevisionHistory.tsx
|   |   |   |   |-- PatientList.tsx
|   |   |   |   |-- PredictionClinicalView.tsx
|   |   |   |   |-- PredictionTimeline.tsx
|   |   |   |   |-- ReviewDispositionForm.tsx
|   |   |   |   |-- ReviewQueue.tsx
|   |   |   |   `-- SignNoteDialog.tsx
|   |   |   |-- pages/
|   |   |   |   |-- DoctorDashboardPage.tsx
|   |   |   |   |-- DoctorPatientDetailPage.tsx
|   |   |   |   `-- DoctorPatientsPage.tsx
|   |   |   |-- schemas/
|   |   |   |   |-- clinicalNote.schema.ts
|   |   |   |   `-- review.schema.ts
|   |   |   |-- types/
|   |   |   |   `-- doctor.types.ts
|   |   |   `-- index.ts
|   |   |-- access-grants/
|   |   |   |-- api/
|   |   |   |   |-- accessGrant.keys.ts
|   |   |   |   |-- accessGrant.mutations.ts
|   |   |   |   |-- accessGrant.queries.ts
|   |   |   |   `-- accessGrant.service.ts
|   |   |   |-- components/
|   |   |   |   |-- AccessGrantForm.tsx
|   |   |   |   |-- AccessGrantList.tsx
|   |   |   |   `-- RevokeAccessDialog.tsx
|   |   |   |-- schemas/
|   |   |   |   `-- accessGrant.schema.ts
|   |   |   |-- types/
|   |   |   |   `-- accessGrant.types.ts
|   |   |   `-- index.ts
|   |   |-- admin/
|   |   |   |-- components/
|   |   |   |   |-- AdminPageShell.tsx
|   |   |   |   |-- HighRiskActionDialog.tsx
|   |   |   |   `-- OperationalHealthCards.tsx
|   |   |   |-- pages/
|   |   |   |   `-- AdminOverviewPage.tsx
|   |   |   |-- users/
|   |   |   |   |-- api/
|   |   |   |   |   |-- adminUsers.keys.ts
|   |   |   |   |   |-- adminUsers.mutations.ts
|   |   |   |   |   |-- adminUsers.queries.ts
|   |   |   |   |   `-- adminUsers.service.ts
|   |   |   |   |-- components/
|   |   |   |   |   |-- AccountActionDialog.tsx
|   |   |   |   |   |-- UserDetailDrawer.tsx
|   |   |   |   |   |-- UserFilters.tsx
|   |   |   |   |   `-- UserTable.tsx
|   |   |   |   |-- pages/
|   |   |   |   |   `-- UserManagementPage.tsx
|   |   |   |   |-- schemas/
|   |   |   |   |   `-- userAdministration.schema.ts
|   |   |   |   `-- index.ts
|   |   |   |-- catalog/
|   |   |   |   |-- api/
|   |   |   |   |   |-- catalogAdmin.keys.ts
|   |   |   |   |   |-- catalogAdmin.mutations.ts
|   |   |   |   |   |-- catalogAdmin.queries.ts
|   |   |   |   |   `-- catalogAdmin.service.ts
|   |   |   |   |-- components/
|   |   |   |   |   |-- CatalogDataTable.tsx
|   |   |   |   |   |-- CatalogEditorSheet.tsx
|   |   |   |   |   |-- CatalogTabs.tsx
|   |   |   |   |   |-- MappingEditor.tsx
|   |   |   |   |   `-- VersionConflictDialog.tsx
|   |   |   |   |-- pages/
|   |   |   |   |   `-- ClinicalCatalogPage.tsx
|   |   |   |   |-- schemas/
|   |   |   |   |   `-- clinicalCatalog.schema.ts
|   |   |   |   `-- index.ts
|   |   |   |-- datasets/
|   |   |   |   |-- api/
|   |   |   |   |   |-- datasets.keys.ts
|   |   |   |   |   |-- datasets.mutations.ts
|   |   |   |   |   |-- datasets.queries.ts
|   |   |   |   |   `-- datasets.service.ts
|   |   |   |   |-- components/
|   |   |   |   |   |-- DatasetTable.tsx
|   |   |   |   |   |-- DatasetUploadDialog.tsx
|   |   |   |   |   `-- ValidationReportDrawer.tsx
|   |   |   |   |-- pages/
|   |   |   |   |   `-- DatasetManagementPage.tsx
|   |   |   |   |-- schemas/
|   |   |   |   |   `-- datasetUpload.schema.ts
|   |   |   |   `-- index.ts
|   |   |   |-- training/
|   |   |   |   |-- api/
|   |   |   |   |   |-- training.keys.ts
|   |   |   |   |   |-- training.mutations.ts
|   |   |   |   |   |-- training.queries.ts
|   |   |   |   |   `-- training.service.ts
|   |   |   |   |-- components/
|   |   |   |   |   |-- StartTrainingDialog.tsx
|   |   |   |   |   |-- TrainingJobTable.tsx
|   |   |   |   |   `-- TrainingProgressDrawer.tsx
|   |   |   |   |-- pages/
|   |   |   |   |   `-- TrainingJobsPage.tsx
|   |   |   |   `-- index.ts
|   |   |   |-- models/
|   |   |   |   |-- api/
|   |   |   |   |   |-- models.keys.ts
|   |   |   |   |   |-- models.mutations.ts
|   |   |   |   |   |-- models.queries.ts
|   |   |   |   |   `-- models.service.ts
|   |   |   |   |-- components/
|   |   |   |   |   |-- ActiveModelBanner.tsx
|   |   |   |   |   |-- EvaluationMetricsPanel.tsx
|   |   |   |   |   |-- ModelApprovalDialog.tsx
|   |   |   |   |   |-- ModelComparisonTable.tsx
|   |   |   |   |   |-- ModelRollbackDialog.tsx
|   |   |   |   |   `-- SubgroupMetricsPanel.tsx
|   |   |   |   |-- pages/
|   |   |   |   |   `-- ModelRegistryPage.tsx
|   |   |   |   `-- index.ts
|   |   |   |-- audit/
|   |   |   |   |-- api/
|   |   |   |   |   |-- audit.keys.ts
|   |   |   |   |   |-- audit.queries.ts
|   |   |   |   |   `-- audit.service.ts
|   |   |   |   |-- components/
|   |   |   |   |   |-- AuditEventDrawer.tsx
|   |   |   |   |   |-- AuditFilters.tsx
|   |   |   |   |   `-- AuditLogTable.tsx
|   |   |   |   |-- pages/
|   |   |   |   |   `-- AuditLogPage.tsx
|   |   |   |   `-- index.ts
|   |   |   |-- analytics/
|   |   |   |   |-- api/
|   |   |   |   |   |-- adminAnalytics.keys.ts
|   |   |   |   |   |-- adminAnalytics.queries.ts
|   |   |   |   |   `-- adminAnalytics.service.ts
|   |   |   |   |-- components/
|   |   |   |   |   |-- ModelUsageChart.tsx
|   |   |   |   |   |-- PlatformUsageChart.tsx
|   |   |   |   |   `-- PrivacyAwareMetrics.tsx
|   |   |   |   |-- pages/
|   |   |   |   |   `-- AdminAnalyticsPage.tsx
|   |   |   |   `-- index.ts
|   |   |   `-- index.ts
|   |   |-- profile/
|   |   |   |-- api/
|   |   |   |   |-- profile.keys.ts
|   |   |   |   |-- profile.mutations.ts
|   |   |   |   |-- profile.queries.ts
|   |   |   |   `-- profile.service.ts
|   |   |   |-- components/
|   |   |   |   |-- AvatarEditor.tsx
|   |   |   |   `-- ProfileForm.tsx
|   |   |   |-- pages/
|   |   |   |   `-- ProfilePage.tsx
|   |   |   |-- schemas/
|   |   |   |   `-- profile.schema.ts
|   |   |   `-- index.ts
|   |   |-- settings/
|   |   |   |-- api/
|   |   |   |   |-- settings.keys.ts
|   |   |   |   |-- settings.mutations.ts
|   |   |   |   |-- settings.queries.ts
|   |   |   |   `-- settings.service.ts
|   |   |   |-- components/
|   |   |   |   |-- AppearanceSettings.tsx
|   |   |   |   |-- ConsentHistory.tsx
|   |   |   |   |-- DataDeletionDialog.tsx
|   |   |   |   |-- DataExportPanel.tsx
|   |   |   |   |-- MfaSettings.tsx
|   |   |   |   |-- NotificationSettings.tsx
|   |   |   |   `-- SecuritySessions.tsx
|   |   |   |-- pages/
|   |   |   |   `-- SettingsPage.tsx
|   |   |   |-- schemas/
|   |   |   |   `-- settings.schema.ts
|   |   |   `-- index.ts
|   |   `-- notifications/
|   |       |-- api/
|   |       |   |-- notification.keys.ts
|   |       |   |-- notification.mutations.ts
|   |       |   |-- notification.queries.ts
|   |       |   `-- notification.service.ts
|   |       |-- components/
|   |       |   |-- NotificationCenter.tsx
|   |       |   |-- NotificationItem.tsx
|   |       |   `-- UnreadBadge.tsx
|   |       `-- index.ts
|   |-- hooks/
|   |   |-- useDebouncedValue.ts
|   |   |-- useDocumentTitle.ts
|   |   |-- useMediaQuery.ts
|   |   `-- useReducedMotionPreference.ts
|   |-- lib/
|   |   |-- api/
|   |   |   |-- apiClient.ts
|   |   |   |-- apiError.ts
|   |   |   |-- idempotency.ts
|   |   |   |-- problemDetails.ts
|   |   |   `-- requestId.ts
|   |   |-- auth/
|   |   |   |-- authContext.ts
|   |   |   |-- permissionPolicy.ts
|   |   |   `-- tokenCoordinator.ts
|   |   |-- errors/
|   |   |   |-- errorMessages.ts
|   |   |   `-- normalizeError.ts
|   |   |-- formatters/
|   |   |   |-- dateTime.ts
|   |   |   |-- number.ts
|   |   |   |-- probability.ts
|   |   |   `-- severity.ts
|   |   |-- monitoring/
|   |   |   |-- errorReporter.ts
|   |   |   `-- performanceReporter.ts
|   |   |-- validation/
|   |   |   `-- commonSchemas.ts
|   |   `-- utils/
|   |       |-- cn.ts
|   |       `-- exhaustiveGuard.ts
|   |-- routes/
|   |   |-- adminRoutes.tsx
|   |   |-- authRoutes.tsx
|   |   |-- doctorRoutes.tsx
|   |   |-- patientRoutes.tsx
|   |   `-- publicRoutes.tsx
|   |-- styles/
|   |   |-- globals.css
|   |   |-- theme.css
|   |   `-- utilities.css
|   |-- test/
|   |   |-- fixtures/
|   |   |   |-- auth.fixtures.ts
|   |   |   |-- catalog.fixtures.ts
|   |   |   `-- prediction.fixtures.ts
|   |   |-- mocks/
|   |   |   |-- browser.ts
|   |   |   |-- handlers.ts
|   |   |   `-- server.ts
|   |   |-- renderWithProviders.tsx
|   |   `-- setup.ts
|   `-- types/
|       |-- branded.types.ts
|       |-- environment.types.ts
|       `-- utility.types.ts
|-- tests/
|   |-- unit/
|   |   |-- components/
|   |   |-- features/
|   |   |-- hooks/
|   |   `-- lib/
|   |-- integration/
|   |   |-- auth/
|   |   |-- chat/
|   |   |-- doctor/
|   |   `-- predictions/
|   |-- accessibility/
|   |   |-- authenticated-pages.a11y.test.tsx
|   |   `-- public-pages.a11y.test.tsx
|   `-- visual/
|       `-- critical-pages.visual.test.ts
|-- .env.example
|-- components.json
|-- eslint.config.js
|-- index.html
|-- package.json
|-- playwright.component.config.ts
|-- postcss.config.js
|-- tsconfig.app.json
|-- tsconfig.json
|-- tsconfig.node.json
|-- vercel.json
|-- vite.config.ts
`-- vitest.config.ts
```

Feature-local tests may be colocated beside complex components when that improves ownership. The listed `frontend/tests/` directories hold cross-component suites and shared browser-level checks.

### 2.2 Backend tree

Every Python package directory shown below contains an `__init__.py`. The files are omitted from repeated tree branches only to keep the architectural responsibilities readable; they are mandatory package markers when the corresponding directory is created.

```text
backend/
|-- README.md
|-- app/
|   |-- __init__.py
|   |-- main.py
|   |-- bootstrap.py
|   |-- container.py
|   |-- api/
|   |   |-- __init__.py
|   |   |-- router.py
|   |   |-- openapi.py
|   |   |-- dependencies/
|   |   |   |-- authentication.py
|   |   |   |-- authorization.py
|   |   |   |-- database.py
|   |   |   |-- idempotency.py
|   |   |   |-- pagination.py
|   |   |   |-- rate_limit.py
|   |   |   `-- request_context.py
|   |   |-- errors/
|   |   |   |-- handlers.py
|   |   |   `-- problem_details.py
|   |   |-- middleware/
|   |   |   |-- audit_context.py
|   |   |   |-- correlation_id.py
|   |   |   |-- request_logging.py
|   |   |   |-- request_size.py
|   |   |   |-- security_headers.py
|   |   |   `-- timing.py
|   |   `-- v1/
|   |       |-- router.py
|   |       `-- health.py
|   |-- core/
|   |   |-- config.py
|   |   |-- database.py
|   |   |-- environment.py
|   |   |-- lifespan.py
|   |   |-- logging.py
|   |   |-- observability.py
|   |   |-- rate_limiting.py
|   |   |-- security.py
|   |   `-- version.py
|   |-- shared/
|   |   |-- application/
|   |   |   |-- clock.py
|   |   |   |-- event_bus.py
|   |   |   |-- id_generator.py
|   |   |   |-- result.py
|   |   |   `-- unit_of_work.py
|   |   |-- domain/
|   |   |   |-- entity.py
|   |   |   |-- enums.py
|   |   |   |-- events.py
|   |   |   |-- exceptions.py
|   |   |   |-- specification.py
|   |   |   `-- value_objects.py
|   |   |-- infrastructure/
|   |   |   |-- persistence/
|   |   |   |   |-- base.py
|   |   |   |   |-- session.py
|   |   |   |   `-- unit_of_work.py
|   |   |   |-- storage/
|   |   |   |   |-- object_storage.py
|   |   |   |   `-- signed_url_service.py
|   |   |   `-- telemetry/
|   |   |       |-- metrics.py
|   |   |       `-- tracing.py
|   |   `-- presentation/
|   |       |-- pagination.py
|   |       `-- responses.py
|   |-- modules/
|   |   |-- auth/
|   |   |   |-- README.md
|   |   |   |-- api/
|   |   |   |   |-- router.py
|   |   |   |   `-- schemas.py
|   |   |   |-- application/
|   |   |   |   |-- commands.py
|   |   |   |   |-- queries.py
|   |   |   |   |-- services.py
|   |   |   |   `-- ports.py
|   |   |   |-- domain/
|   |   |   |   |-- entities.py
|   |   |   |   |-- enums.py
|   |   |   |   |-- events.py
|   |   |   |   |-- policies.py
|   |   |   |   |-- repositories.py
|   |   |   |   `-- value_objects.py
|   |   |   `-- infrastructure/
|   |   |       |-- models.py
|   |   |       |-- repository.py
|   |   |       |-- jwt_provider.py
|   |   |       |-- mfa_provider.py
|   |   |       |-- password_hasher.py
|   |   |       `-- token_hasher.py
|   |   |-- users/
|   |   |   |-- README.md
|   |   |   |-- api/
|   |   |   |   |-- router.py
|   |   |   |   `-- schemas.py
|   |   |   |-- application/
|   |   |   |   |-- commands.py
|   |   |   |   |-- queries.py
|   |   |   |   `-- services.py
|   |   |   |-- domain/
|   |   |   |   |-- entities.py
|   |   |   |   |-- enums.py
|   |   |   |   |-- events.py
|   |   |   |   |-- policies.py
|   |   |   |   `-- repositories.py
|   |   |   `-- infrastructure/
|   |   |       |-- models.py
|   |   |       `-- repository.py
|   |   |-- consent/
|   |   |   |-- README.md
|   |   |   |-- api/
|   |   |   |   |-- router.py
|   |   |   |   `-- schemas.py
|   |   |   |-- application/
|   |   |   |   |-- commands.py
|   |   |   |   |-- queries.py
|   |   |   |   `-- services.py
|   |   |   |-- domain/
|   |   |   |   |-- entities.py
|   |   |   |   |-- enums.py
|   |   |   |   |-- policies.py
|   |   |   |   `-- repositories.py
|   |   |   `-- infrastructure/
|   |   |       |-- models.py
|   |   |       `-- repository.py
|   |   |-- clinical_catalog/
|   |   |   |-- README.md
|   |   |   |-- api/
|   |   |   |   |-- admin_router.py
|   |   |   |   |-- public_router.py
|   |   |   |   `-- schemas.py
|   |   |   |-- application/
|   |   |   |   |-- commands.py
|   |   |   |   |-- queries.py
|   |   |   |   `-- services.py
|   |   |   |-- domain/
|   |   |   |   |-- entities.py
|   |   |   |   |-- enums.py
|   |   |   |   |-- events.py
|   |   |   |   |-- policies.py
|   |   |   |   |-- repositories.py
|   |   |   |   `-- value_objects.py
|   |   |   `-- infrastructure/
|   |   |       |-- models.py
|   |   |       `-- repository.py
|   |   |-- predictions/
|   |   |   |-- README.md
|   |   |   |-- api/
|   |   |   |   |-- router.py
|   |   |   |   `-- schemas.py
|   |   |   |-- application/
|   |   |   |   |-- commands.py
|   |   |   |   |-- queries.py
|   |   |   |   |-- services.py
|   |   |   |   `-- ports.py
|   |   |   |-- domain/
|   |   |   |   |-- confidence.py
|   |   |   |   |-- entities.py
|   |   |   |   |-- enums.py
|   |   |   |   |-- events.py
|   |   |   |   |-- policies.py
|   |   |   |   |-- ranking.py
|   |   |   |   |-- repositories.py
|   |   |   |   `-- value_objects.py
|   |   |   `-- infrastructure/
|   |   |       |-- inference_adapter.py
|   |   |       |-- models.py
|   |   |       `-- repository.py
|   |   |-- emergency/
|   |   |   |-- README.md
|   |   |   |-- application/
|   |   |   |   `-- services.py
|   |   |   |-- domain/
|   |   |   |   |-- entities.py
|   |   |   |   |-- evaluator.py
|   |   |   |   |-- policies.py
|   |   |   |   `-- repositories.py
|   |   |   `-- infrastructure/
|   |   |       `-- repository.py
|   |   |-- reports/
|   |   |   |-- README.md
|   |   |   |-- api/
|   |   |   |   |-- router.py
|   |   |   |   `-- schemas.py
|   |   |   |-- application/
|   |   |   |   |-- commands.py
|   |   |   |   |-- queries.py
|   |   |   |   |-- services.py
|   |   |   |   `-- ports.py
|   |   |   |-- domain/
|   |   |   |   |-- entities.py
|   |   |   |   |-- enums.py
|   |   |   |   `-- repositories.py
|   |   |   `-- infrastructure/
|   |   |       |-- models.py
|   |   |       |-- pdf_renderer.py
|   |   |       `-- repository.py
|   |   |-- chat/
|   |   |   |-- README.md
|   |   |   |-- api/
|   |   |   |   |-- router.py
|   |   |   |   |-- schemas.py
|   |   |   |   `-- sse.py
|   |   |   |-- application/
|   |   |   |   |-- commands.py
|   |   |   |   |-- queries.py
|   |   |   |   |-- services.py
|   |   |   |   `-- ports.py
|   |   |   |-- domain/
|   |   |   |   |-- entities.py
|   |   |   |   |-- enums.py
|   |   |   |   |-- policies.py
|   |   |   |   `-- repositories.py
|   |   |   `-- infrastructure/
|   |   |       |-- grounding_builder.py
|   |   |       |-- llm_adapter.py
|   |   |       |-- models.py
|   |   |       |-- output_validator.py
|   |   |       `-- repository.py
|   |   |-- doctor/
|   |   |   |-- README.md
|   |   |   |-- api/
|   |   |   |   |-- router.py
|   |   |   |   `-- schemas.py
|   |   |   |-- application/
|   |   |   |   |-- commands.py
|   |   |   |   |-- queries.py
|   |   |   |   `-- services.py
|   |   |   |-- domain/
|   |   |   |   |-- entities.py
|   |   |   |   |-- enums.py
|   |   |   |   |-- events.py
|   |   |   |   |-- policies.py
|   |   |   |   `-- repositories.py
|   |   |   `-- infrastructure/
|   |   |       |-- models.py
|   |   |       `-- repository.py
|   |   |-- notifications/
|   |   |   |-- README.md
|   |   |   |-- api/
|   |   |   |   |-- router.py
|   |   |   |   `-- schemas.py
|   |   |   |-- application/
|   |   |   |   |-- commands.py
|   |   |   |   |-- queries.py
|   |   |   |   |-- services.py
|   |   |   |   `-- ports.py
|   |   |   |-- domain/
|   |   |   |   |-- entities.py
|   |   |   |   |-- enums.py
|   |   |   |   `-- repositories.py
|   |   |   `-- infrastructure/
|   |   |       |-- email_adapter.py
|   |   |       |-- models.py
|   |   |       `-- repository.py
|   |   |-- audit/
|   |   |   |-- README.md
|   |   |   |-- api/
|   |   |   |   |-- router.py
|   |   |   |   `-- schemas.py
|   |   |   |-- application/
|   |   |   |   |-- commands.py
|   |   |   |   |-- queries.py
|   |   |   |   `-- services.py
|   |   |   |-- domain/
|   |   |   |   |-- entities.py
|   |   |   |   |-- enums.py
|   |   |   |   `-- repositories.py
|   |   |   `-- infrastructure/
|   |   |       |-- models.py
|   |   |       `-- repository.py
|   |   |-- ml_registry/
|   |   |   |-- README.md
|   |   |   |-- api/
|   |   |   |   |-- router.py
|   |   |   |   `-- schemas.py
|   |   |   |-- application/
|   |   |   |   |-- commands.py
|   |   |   |   |-- queries.py
|   |   |   |   |-- services.py
|   |   |   |   `-- ports.py
|   |   |   |-- domain/
|   |   |   |   |-- entities.py
|   |   |   |   |-- enums.py
|   |   |   |   |-- events.py
|   |   |   |   |-- policies.py
|   |   |   |   `-- repositories.py
|   |   |   `-- infrastructure/
|   |   |       |-- artifact_storage.py
|   |   |       |-- models.py
|   |   |       `-- repository.py
|   |   `-- admin/
|   |       |-- README.md
|   |       |-- api/
|   |       |   |-- router.py
|   |       |   `-- schemas.py
|   |       |-- application/
|   |       |   |-- analytics_queries.py
|   |       |   |-- dashboard_queries.py
|   |       |   `-- services.py
|   |       `-- infrastructure/
|   |           `-- analytics_repository.py
|   |-- workers/
|   |   |-- __init__.py
|   |   |-- main.py
|   |   |-- registry.py
|   |   |-- runner.py
|   |   |-- scheduler.py
|   |   |-- leasing.py
|   |   `-- handlers/
|   |       |-- chat_response.py
|   |       |-- cleanup.py
|   |       |-- dataset_validation.py
|   |       |-- explanation.py
|   |       |-- model_training.py
|   |       |-- notification_delivery.py
|   |       |-- privacy_export.py
|   |       `-- report_generation.py
|   `-- jobs/
|       |-- __init__.py
|       |-- models.py
|       |-- outbox_dispatcher.py
|       |-- repository.py
|       `-- retry_policy.py
|-- alembic/
|   |-- README.md
|   |-- env.py
|   |-- script.py.mako
|   `-- versions/
|       `-- README.md
|-- scripts/
|   |-- README.md
|   |-- bootstrap_admin.py
|   |-- check_migrations.py
|   |-- generate_openapi.py
|   |-- load_clinical_catalog.py
|   `-- verify_model_artifact.py
|-- tests/
|   |-- README.md
|   |-- conftest.py
|   |-- fixtures/
|   |   |-- auth.py
|   |   |-- catalog.py
|   |   |-- database.py
|   |   |-- model_bundle.py
|   |   `-- predictions.py
|   |-- unit/
|   |   |-- auth/
|   |   |-- users/
|   |   |-- consent/
|   |   |-- clinical_catalog/
|   |   |-- predictions/
|   |   |-- emergency/
|   |   |-- reports/
|   |   |-- chat/
|   |   |-- doctor/
|   |   |-- notifications/
|   |   |-- audit/
|   |   |-- ml_registry/
|   |   `-- jobs/
|   |-- integration/
|   |   |-- api/
|   |   |-- auth/
|   |   |-- database/
|   |   |-- jobs/
|   |   |-- migrations/
|   |   |-- storage/
|   |   `-- workers/
|   |-- contract/
|   |   |-- openapi_contract_test.py
|   |   `-- problem_details_contract_test.py
|   |-- security/
|   |   |-- authorization_matrix_test.py
|   |   |-- csrf_test.py
|   |   |-- refresh_replay_test.py
|   |   `-- sensitive_logging_test.py
|   `-- performance/
|       |-- inference_benchmark.py
|       `-- repository_benchmark.py
|-- .env.example
|-- alembic.ini
|-- pyproject.toml
|-- pytest.ini
`-- uv.lock
```

Migration version filenames are generated from real schema changes during implementation. Listing invented revision files now would create placeholders and false migration history, so `alembic/versions/README.md` defines the naming and review policy until the first real migration is authored.

### 2.3 Machine-learning module tree

```text
machine-learning/
|-- README.md
|-- src/
|   `-- mediai_ml/
|       |-- __init__.py
|       |-- version.py
|       |-- contracts/
|       |   |-- __init__.py
|       |   |-- dataset_schema.py
|       |   |-- feature_schema.py
|       |   |-- inference.py
|       |   |-- model_metadata.py
|       |   `-- validation_report.py
|       |-- data/
|       |   |-- __init__.py
|       |   |-- checksum.py
|       |   |-- loader.py
|       |   |-- provenance.py
|       |   |-- quality.py
|       |   |-- splitter.py
|       |   `-- validator.py
|       |-- features/
|       |   |-- __init__.py
|       |   |-- builder.py
|       |   |-- encoders.py
|       |   |-- missingness.py
|       |   |-- ranges.py
|       |   `-- transformer.py
|       |-- training/
|       |   |-- __init__.py
|       |   |-- candidate_factory.py
|       |   |-- configuration.py
|       |   |-- experiment.py
|       |   |-- hyperparameters.py
|       |   |-- reproducibility.py
|       |   `-- trainer.py
|       |-- calibration/
|       |   |-- __init__.py
|       |   |-- calibrator.py
|       |   `-- metrics.py
|       |-- evaluation/
|       |   |-- __init__.py
|       |   |-- calibration.py
|       |   |-- evaluator.py
|       |   |-- fairness.py
|       |   |-- gates.py
|       |   |-- metrics.py
|       |   |-- out_of_distribution.py
|       |   |-- performance.py
|       |   `-- report.py
|       |-- explainability/
|       |   |-- __init__.py
|       |   |-- feature_contributions.py
|       |   |-- linear_explainer.py
|       |   `-- tree_explainer.py
|       |-- artifacts/
|       |   |-- __init__.py
|       |   |-- bundle.py
|       |   |-- checksum.py
|       |   |-- loader.py
|       |   |-- manifest.py
|       |   `-- verifier.py
|       |-- inference/
|       |   |-- __init__.py
|       |   |-- confidence.py
|       |   |-- engine.py
|       |   |-- loader.py
|       |   |-- ranking.py
|       |   `-- service.py
|       |-- monitoring/
|       |   |-- __init__.py
|       |   |-- drift.py
|       |   |-- inference_metrics.py
|       |   `-- statistical_baseline.py
|       `-- cli/
|           |-- __init__.py
|           |-- evaluate.py
|           |-- train.py
|           `-- validate_dataset.py
|-- tests/
|   |-- README.md
|   |-- conftest.py
|   |-- fixtures/
|   |   |-- dataset_factory.py
|   |   |-- feature_schema_factory.py
|   |   `-- model_bundle_factory.py
|   |-- unit/
|   |   |-- artifacts/
|   |   |-- calibration/
|   |   |-- contracts/
|   |   |-- data/
|   |   |-- evaluation/
|   |   |-- explainability/
|   |   |-- features/
|   |   |-- inference/
|   |   |-- monitoring/
|   |   `-- training/
|   |-- integration/
|   |   |-- artifact_round_trip_test.py
|   |   |-- training_pipeline_test.py
|   |   `-- validation_pipeline_test.py
|   |-- golden/
|   |   |-- README.md
|   |   `-- inference_vectors.json
|   |-- performance/
|   |   |-- inference_latency_test.py
|   |   `-- training_resource_test.py
|   `-- safety/
|       |-- feature_order_test.py
|       |-- leakage_detection_test.py
|       |-- model_gate_test.py
|       `-- untrusted_artifact_test.py
|-- .env.example
|-- pyproject.toml
|-- pytest.ini
`-- uv.lock
```

The ML module is a Python package consumed through defined contracts by the backend inference adapter and training worker. It must not import FastAPI routes, SQLAlchemy repositories, or deployment-specific SDKs.

### 2.4 Shared packages tree

```text
packages/
|-- README.md
|-- api-contracts/
|   |-- README.md
|   |-- openapi/
|   |   `-- mediai-v1.openapi.json
|   |-- generated/
|   |   |-- typescript/
|   |   |   |-- index.ts
|   |   |   |-- schemas.ts
|   |   |   `-- services.ts
|   |   `-- README.md
|   |-- package.json
|   `-- tsconfig.json
|-- design-tokens/
|   |-- README.md
|   |-- src/
|   |   |-- colors.ts
|   |   |-- motion.ts
|   |   |-- radii.ts
|   |   |-- shadows.ts
|   |   |-- spacing.ts
|   |   |-- typography.ts
|   |   `-- index.ts
|   |-- package.json
|   `-- tsconfig.json
|-- eslint-config/
|   |-- README.md
|   |-- base.js
|   |-- react.js
|   |-- package.json
|   `-- typescript.js
|-- typescript-config/
|   |-- README.md
|   |-- base.json
|   |-- library.json
|   |-- package.json
|   `-- react-app.json
`-- test-fixtures/
    |-- README.md
    |-- schemas/
    |   |-- assessment.schema.json
    |   |-- prediction.schema.json
    |   `-- problem-details.schema.json
    |-- synthetic/
    |   |-- assessments.json
    |   |-- catalog.json
    |   `-- predictions.json
    |-- package.json
    `-- tsconfig.json
```

`api-contracts/generated/` is machine-generated from the committed OpenAPI contract and is never manually edited. Python API DTOs remain the source contract; the generated TypeScript client prevents transport drift. Business-domain code is not shared across TypeScript and Python through hand-maintained duplicate types.

### 2.5 Documentation tree

```text
docs/
|-- README.md
|-- 01-software-requirement-specification.md
|-- 02-folder-structure.md
|-- 03-database-design.md
|-- 04-er-diagram.md
|-- 05-api-documentation.md
|-- 06-component-tree.md
|-- 07-ml-pipeline.md
|-- 08-development-roadmap.md
|-- 09-system-architecture.md
|-- 10-project-folder-file-structure.md
|-- architecture/
|   |-- README.md
|   |-- context-diagrams.md
|   |-- dependency-rules.md
|   `-- threat-model.md
|-- adr/
|   |-- README.md
|   |-- 0001-modular-monolith.md
|   |-- 0002-rest-and-sse.md
|   |-- 0003-postgresql-outbox.md
|   |-- 0004-ml-llm-authority-boundary.md
|   `-- 0005-refresh-token-rotation.md
|-- api/
|   |-- README.md
|   |-- authentication.md
|   |-- error-contract.md
|   |-- idempotency.md
|   |-- pagination.md
|   `-- versioning.md
|-- database/
|   |-- README.md
|   |-- migration-policy.md
|   |-- retention-policy.md
|   `-- restore-procedure.md
|-- frontend/
|   |-- README.md
|   |-- accessibility.md
|   |-- design-system.md
|   |-- feature-module-convention.md
|   `-- state-management.md
|-- backend/
|   |-- README.md
|   |-- clean-architecture-boundaries.md
|   |-- domain-module-convention.md
|   |-- error-handling.md
|   `-- worker-jobs.md
|-- ml/
|   |-- README.md
|   |-- dataset-governance.md
|   |-- evaluation-gates.md
|   |-- feature-schema.md
|   |-- model-card-template.md
|   |-- model-monitoring.md
|   `-- model-promotion.md
|-- security/
|   |-- README.md
|   |-- access-control-matrix.md
|   |-- audit-event-catalog.md
|   |-- data-classification.md
|   |-- incident-response.md
|   |-- secrets-management.md
|   `-- vendor-security.md
|-- testing/
|   |-- README.md
|   |-- accessibility-testing.md
|   |-- end-to-end-strategy.md
|   |-- performance-testing.md
|   |-- security-testing.md
|   `-- test-data-policy.md
`-- runbooks/
    |-- README.md
    |-- api-degradation.md
    |-- database-recovery.md
    |-- llm-outage.md
    |-- model-load-failure.md
    |-- model-rollback.md
    |-- security-incident.md
    `-- worker-backlog.md
```

ADR files record decisions already established by the approved architecture. A new ADR is added only for a real decision; invented future decisions must not be represented as accepted records.

### 2.6 Docker and infrastructure tree

```text
docker/
|-- README.md
|-- compose.yml
|-- compose.test.yml
|-- frontend/
|   |-- Dockerfile
|   `-- README.md
|-- backend/
|   |-- Dockerfile
|   `-- README.md
|-- worker/
|   |-- Dockerfile
|   `-- README.md
`-- machine-learning/
    |-- Dockerfile
    `-- README.md

infrastructure/
|-- README.md
|-- vercel/
|   |-- README.md
|   `-- environment-variables.md
|-- railway/
|   |-- README.md
|   |-- api.railway.toml
|   |-- worker.railway.toml
|   |-- migration.railway.toml
|   `-- environment-variables.md
|-- supabase/
|   |-- README.md
|   |-- config.toml
|   |-- database-roles.md
|   |-- pooling.md
|   |-- storage-policies.md
|   `-- backup-policy.md
`-- monitoring/
    |-- README.md
    |-- alerts/
    |   |-- api-alerts.yml
    |   |-- database-alerts.yml
    |   |-- ml-alerts.yml
    |   |-- security-alerts.yml
    |   `-- worker-alerts.yml
    |-- dashboards/
    |   |-- api-dashboard.json
    |   |-- ml-dashboard.json
    |   `-- worker-dashboard.json
    `-- telemetry-policy.md
```

Container definitions support reproducible development, CI, testing, and Railway builds. Vercel remains the production frontend host; the frontend container is not a second production hosting strategy.

### 2.7 Cross-system testing tree

```text
tests/
|-- README.md
|-- end-to-end/
|   |-- README.md
|   |-- fixtures/
|   |   |-- accounts.ts
|   |   |-- catalog.ts
|   |   `-- predictions.ts
|   |-- pages/
|   |   |-- AdminPage.ts
|   |   |-- AuthPage.ts
|   |   |-- DoctorPage.ts
|   |   `-- PredictionPage.ts
|   |-- specs/
|   |   |-- admin-model-lifecycle.spec.ts
|   |   |-- auth-session-security.spec.ts
|   |   |-- doctor-access-control.spec.ts
|   |   |-- llm-failure-degradation.spec.ts
|   |   |-- patient-prediction.spec.ts
|   |   `-- red-flag-emergency.spec.ts
|   |-- globalSetup.ts
|   `-- playwright.config.ts
|-- contract/
|   |-- README.md
|   |-- api-client-compatibility.test.ts
|   |-- openapi-drift.test.ts
|   `-- sse-event-contract.test.ts
|-- performance/
|   |-- README.md
|   |-- api-load.js
|   |-- chat-stream-load.js
|   |-- inference-load.js
|   `-- worker-throughput.js
|-- security/
|   |-- README.md
|   |-- authorization-matrix.md
|   |-- file-upload-security.test.ts
|   |-- privacy-export-security.test.ts
|   `-- signed-url-security.test.ts
|-- resilience/
|   |-- README.md
|   |-- database-unavailable.test.ts
|   |-- llm-timeout.test.ts
|   |-- model-load-failure.test.ts
|   |-- storage-unavailable.test.ts
|   `-- worker-recovery.test.ts
`-- accessibility/
    |-- README.md
    |-- critical-journeys.a11y.spec.ts
    `-- emergency-flow.a11y.spec.ts
```

Application-local tests exercise a bounded component/module. Root tests verify integration between deployed boundaries and must not import private application internals.

### 2.8 Root files and automation

```text
my-project/
|-- scripts/
|   |-- README.md
|   |-- bootstrap.ps1
|   |-- check-all.ps1
|   |-- generate-contracts.ps1
|   |-- run-local.ps1
|   `-- verify-environment.ps1
|-- .dockerignore
|-- .editorconfig
|-- .gitattributes
|-- .gitignore
|-- .npmrc
|-- .pre-commit-config.yaml
|-- CODE_OF_CONDUCT.md
|-- CONTRIBUTING.md
|-- LICENSE
|-- Makefile
|-- README.md
|-- SECURITY.md
|-- package.json
|-- package-lock.json
`-- pyproject.toml
```

The root Node package coordinates frontend/shared-package workspaces and repository scripts. The root Python configuration provides repository-wide tooling defaults, while `backend/pyproject.toml` and `machine-learning/pyproject.toml` define independently installable Python packages.

## 3. Important folder responsibilities

### 3.1 Repository-level folders

| Complete path | Purpose |
|---|---|
| `D:\React JS\Ai ML project\my-project\.github` | Pull-request governance, ownership, dependency updates, CI, security, and controlled deployment workflows |
| `D:\React JS\Ai ML project\my-project\config` | Cross-application environment, quality, security, and clinical-safety policies |
| `D:\React JS\Ai ML project\my-project\frontend` | Deployable React browser application |
| `D:\React JS\Ai ML project\my-project\backend` | Deployable FastAPI API and worker application |
| `D:\React JS\Ai ML project\my-project\machine-learning` | Framework-independent ML library for data validation, training, evaluation, artifacts, and inference |
| `D:\React JS\Ai ML project\my-project\packages` | Shared TypeScript/configuration packages and language-neutral contracts/fixtures |
| `D:\React JS\Ai ML project\my-project\docs` | Approved specifications, architecture, ADRs, runbooks, and engineering policies |
| `D:\React JS\Ai ML project\my-project\docker` | Reproducible local and CI container definitions |
| `D:\React JS\Ai ML project\my-project\infrastructure` | Host-specific deployment, storage, database, and monitoring configuration |
| `D:\React JS\Ai ML project\my-project\tests` | Cross-system contract, E2E, accessibility, performance, resilience, and security suites |
| `D:\React JS\Ai ML project\my-project\scripts` | Reviewed developer/CI orchestration scripts; no business logic |

### 3.2 Frontend folder responsibilities

| Complete path | Purpose |
|---|---|
| `D:\React JS\Ai ML project\my-project\frontend\src\app` | Composition root, providers, router, query client, route constants, and validated public configuration |
| `D:\React JS\Ai ML project\my-project\frontend\src\components\ui` | Application-controlled Shadcn primitives; no feature-specific behavior |
| `D:\React JS\Ai ML project\my-project\frontend\src\components\clinical` | Reusable clinical presentation with consistent safety and accessibility semantics |
| `D:\React JS\Ai ML project\my-project\frontend\src\features` | Vertical product capabilities containing their own UI, server access, validation, hooks, and types |
| `D:\React JS\Ai ML project\my-project\frontend\src\lib\api` | The single HTTP/error/idempotency/request-ID boundary |
| `D:\React JS\Ai ML project\my-project\frontend\src\routes` | Role-specific route composition; pages stay in the owning feature |
| `D:\React JS\Ai ML project\my-project\frontend\src\test` | Shared test setup, MSW handlers, provider render helpers, and deterministic fixtures |
| `D:\React JS\Ai ML project\my-project\frontend\tests` | Frontend-wide unit, integration, accessibility, and visual suites |

Feature modules own business-facing browser behavior. A component moves into `components/` only after it is genuinely feature-neutral and reusable.

### 3.3 Backend folder responsibilities

| Complete path | Purpose |
|---|---|
| `D:\React JS\Ai ML project\my-project\backend\app\api` | FastAPI transport concerns: routes, dependencies, middleware, OpenAPI, and safe errors |
| `D:\React JS\Ai ML project\my-project\backend\app\core` | Process-wide configuration, lifecycle, database setup, security primitives, logging, and observability |
| `D:\React JS\Ai ML project\my-project\backend\app\modules` | Business domains partitioned by Clean Architecture |
| `D:\React JS\Ai ML project\my-project\backend\app\shared\domain` | Minimal domain primitives that have no feature owner |
| `D:\React JS\Ai ML project\my-project\backend\app\shared\application` | Use-case abstractions such as clock, IDs, events, result, and unit of work |
| `D:\React JS\Ai ML project\my-project\backend\app\shared\infrastructure` | Cross-module database, storage, metrics, and tracing implementations |
| `D:\React JS\Ai ML project\my-project\backend\app\workers` | Worker process composition, leasing, scheduling, and typed job handlers |
| `D:\React JS\Ai ML project\my-project\backend\app\jobs` | Durable job/outbox records, claiming, retry, and dispatch |
| `D:\React JS\Ai ML project\my-project\backend\alembic` | Ordered, reviewed PostgreSQL schema migration history |
| `D:\React JS\Ai ML project\my-project\backend\tests` | Backend unit, integration, contract, security, and performance tests |

Within every backend feature:

- `domain/` owns entities, value objects, repository protocols, policies, and events.
- `application/` owns commands, queries, orchestration services, and outbound ports.
- `infrastructure/` owns SQLAlchemy models/repositories and external provider adapters.
- `api/` owns FastAPI routers and Pydantic transport schemas.

### 3.4 Machine-learning folder responsibilities

| Complete path | Purpose |
|---|---|
| `D:\React JS\Ai ML project\my-project\machine-learning\src\mediai_ml\contracts` | Dataset, feature, inference, metadata, and validation contracts |
| `D:\React JS\Ai ML project\my-project\machine-learning\src\mediai_ml\data` | Trusted loading, provenance, checksum, validation, quality, and splitting |
| `D:\React JS\Ai ML project\my-project\machine-learning\src\mediai_ml\features` | Deterministic feature construction and preprocessing |
| `D:\React JS\Ai ML project\my-project\machine-learning\src\mediai_ml\training` | Candidate construction, reproducible experiments, and training orchestration |
| `D:\React JS\Ai ML project\my-project\machine-learning\src\mediai_ml\evaluation` | Metrics, calibration, subgroup evaluation, OOD, performance, and promotion gates |
| `D:\React JS\Ai ML project\my-project\machine-learning\src\mediai_ml\artifacts` | Model bundle manifest, checksum, serialization, loading, and verification |
| `D:\React JS\Ai ML project\my-project\machine-learning\src\mediai_ml\inference` | Framework-independent verified model inference and ranking |
| `D:\React JS\Ai ML project\my-project\machine-learning\tests\golden` | Versioned deterministic input/output vectors for train-serving reproducibility |

## 4. Dependency and boundary rules

### 4.1 Frontend dependencies

```text
app/routes -> features -> shared components/lib -> generated API contracts
```

- `app/` may compose any feature through its public `index.ts`.
- A feature may import shared components and utilities.
- A feature must not deep-import another feature's private folders.
- Shared components and `lib/` must not import from `features/`.
- Generated API contracts are transport types, not UI state.
- API service files perform transport only; TanStack Query files own caching and mutation lifecycle.
- React pages compose components but do not contain reusable domain calculations.
- Barrel exports are allowed only at intentional public boundaries and must not create cycles.

### 4.2 Backend dependencies

```text
api -> application -> domain
infrastructure -> application/domain
composition root -> all concrete implementations
```

- Domain code imports only the Python standard library and explicitly approved domain-safe libraries.
- Domain code never imports FastAPI, Pydantic transport DTOs, SQLAlchemy, storage, LLM, or ML vendor implementations.
- Application code depends on domain abstractions and narrow outbound ports.
- Infrastructure implements ports and may depend inward.
- API routes call application use cases; they do not query SQLAlchemy sessions directly.
- SQLAlchemy models never cross into API responses.
- Cross-module state changes use application services, domain events, or explicit query ports—not another module's ORM repository.
- `admin` orchestrates authorized views/actions but does not become the owner of user, catalog, or ML domain rules.

### 4.3 ML dependencies

```text
backend inference/training adapters -> mediai_ml public contracts
mediai_ml -> scientific Python libraries
mediai_ml -X-> FastAPI, SQLAlchemy, Railway, Supabase SDKs
```

- ML does not own database transactions or HTTP authorization.
- The backend resolves the active artifact and supplies a verified local/private-storage reference.
- The ML package returns typed inference/evaluation results; backend domain services decide persistence and clinical enrichment.
- The LLM package/provider is not a dependency of `mediai_ml`.

### 4.4 Shared package rules

- `packages/api-contracts` is generated from backend OpenAPI; hand edits are forbidden.
- `packages/design-tokens` contains visual constants, not React components.
- `packages/eslint-config` and `packages/typescript-config` contain build policy only.
- `packages/test-fixtures` contains synthetic, non-sensitive, contract-valid examples.
- Shared packages must not become a dumping ground for code with a clear feature owner.

## 5. Naming and file conventions

### 5.1 TypeScript

- React components and pages: `PascalCase.tsx`.
- Hooks: `useName.ts`.
- Transport/service files: `<feature>.service.ts`.
- Query-key and query/mutation files: `<feature>.keys.ts`, `<feature>.queries.ts`, `<feature>.mutations.ts`.
- Validation: `<purpose>.schema.ts`.
- Types: `<feature>.types.ts`.
- Tests: `.test.ts`, `.test.tsx`, or `.spec.ts` according to the owning test runner.
- Public feature API: `index.ts`; internal files are not exported unless required.
- Strict TypeScript is mandatory; unsafe `any` and non-null assertions require explicit, reviewed justification.

### 5.2 Python

- Modules and packages: `snake_case`.
- Classes and Pydantic/domain types: `PascalCase`.
- Functions and variables: `snake_case`.
- Repository interfaces use protocols/abstract contracts in `domain` or `application`; implementations use descriptive adapter names.
- Test files end in `_test.py` consistently.
- Public functions and methods are fully typed.
- Import cycles and framework imports in domain layers are prohibited by architecture tests/lint rules.

### 5.3 Documentation and configuration

- Ordered baseline documents use two-digit numeric prefixes.
- ADRs use four-digit monotonic prefixes and concise decision names.
- Runbooks use the failure/operation name.
- Environment templates end in `.env.example` and contain no secrets or usable production values.
- Workflow/config names state the responsibility rather than a team member or temporary phase.

## 6. README locations and required content

| Complete README path | Required responsibility |
|---|---|
| `D:\React JS\Ai ML project\my-project\README.md` | Product overview, repository map, prerequisites, safe local setup, commands, architecture links, and contribution entry point |
| `D:\React JS\Ai ML project\my-project\frontend\README.md` | Frontend architecture, setup, scripts, environment contract, routing, state, testing, accessibility |
| `D:\React JS\Ai ML project\my-project\frontend\src\components\README.md` | Shared-component promotion rules, accessibility, variants, and ownership |
| `D:\React JS\Ai ML project\my-project\backend\README.md` | API/worker setup, Clean Architecture, migrations, configuration, testing, OpenAPI |
| `D:\React JS\Ai ML project\my-project\backend\app\modules\<module>\README.md` | Module purpose, owned vocabulary, use cases, public ports, dependencies, tables, events |
| `D:\React JS\Ai ML project\my-project\backend\alembic\README.md` | Migration creation, naming, review, forward/rollback policy |
| `D:\React JS\Ai ML project\my-project\machine-learning\README.md` | Dataset contract, training/evaluation/inference entry points, reproducibility, artifact trust |
| `D:\React JS\Ai ML project\my-project\packages\README.md` | Shared-package ownership and dependency rules |
| `D:\React JS\Ai ML project\my-project\packages\<package>\README.md` | Package API, consumers, generation/edit policy, validation |
| `D:\React JS\Ai ML project\my-project\docs\README.md` | Documentation index, status, approval ownership, source-of-truth rules |
| `D:\React JS\Ai ML project\my-project\docker\README.md` | Local/test services, profiles, volumes, health checks, safe cleanup |
| `D:\React JS\Ai ML project\my-project\infrastructure\README.md` | Environment topology, ownership, deployment gates, provider references |
| `D:\React JS\Ai ML project\my-project\tests\README.md` | Cross-system test purpose, prerequisites, data policy, commands, CI mapping |
| `D:\React JS\Ai ML project\my-project\config\README.md` | Configuration hierarchy, owners, validation, secret prohibition |
| `D:\React JS\Ai ML project\my-project\scripts\README.md` | Script safety, prerequisites, parameters, idempotency, and usage |

README files must describe real implemented behavior when created. A README must not claim a command, capability, compliance state, or deployment that does not exist.

## 7. Testing organization

| Test location | Scope | External dependencies |
|---|---|---|
| `frontend/tests/unit` | Pure UI/hooks/formatters/schemas | Mocked |
| `frontend/tests/integration` | Feature forms, query states, routing, streaming adapters | MSW/browser simulation |
| `frontend/tests/accessibility` | Component/page accessibility | Rendered browser DOM |
| `backend/tests/unit` | Domain policies and application use cases | Fakes/in-memory ports |
| `backend/tests/integration` | SQLAlchemy, PostgreSQL, jobs, storage adapters, API | Ephemeral test services |
| `backend/tests/contract` | OpenAPI and Problem Details | FastAPI test application |
| `backend/tests/security` | Authorization/session/CSRF/redaction | Test database and API |
| `machine-learning/tests/unit` | Data, features, metrics, artifacts, inference | Synthetic fixtures |
| `machine-learning/tests/golden` | Reproducible fixed-bundle inference | Versioned synthetic vectors |
| `machine-learning/tests/safety` | Leakage, feature order, gate and artifact trust | Synthetic/adversarial fixtures |
| `tests/end-to-end` | Complete patient/doctor/admin journeys | Full disposable stack |
| `tests/contract` | Frontend-backend and SSE compatibility | Generated contracts/API |
| `tests/performance` | HTTP, inference, worker throughput | Production-like staging |
| `tests/security` | Cross-system protected-resource and upload/export controls | Isolated staging |
| `tests/resilience` | Dependency failure and recovery | Fault-controllable environment |
| `tests/accessibility` | Critical browser journeys | Full application |

Tests may import public module APIs but must not create dependencies from production code back into test folders. Test fixtures are synthetic and deterministic; production data is prohibited.

## 8. Configuration organization

### 8.1 Configuration precedence

1. Safe code defaults for non-secret behavior
2. Repository policy in `config/`
3. Application `.env.example` contract
4. Environment-specific platform variables/secrets
5. Explicit command arguments for approved operational scripts

Startup validates required variables, types, allowed values, cross-field rules, and environment restrictions. Production must fail readiness on missing security-critical configuration.

### 8.2 Configuration ownership

- Frontend public runtime/build values: `frontend/.env.example` and validated `applicationConfig.ts`.
- Backend secrets and service values: `backend/.env.example` and typed `core/config.py`.
- ML training resource/config values: `machine-learning/.env.example` and typed training configuration.
- Repository policies: `config/security`, `config/quality`, and `config/clinical-safety`.
- Deployment mapping: `infrastructure/<provider>/environment-variables.md`.
- CI secrets: GitHub environment secrets, never workflow literals.

### 8.3 Prohibited configuration

- No real secrets in `.env.example`, Markdown, test fixtures, Docker images, Vite client variables, workflow YAML, or committed provider config.
- No frontend variable may contain a database, LLM, email, storage, JWT-signing, or administrative secret.
- No environment-specific URL or credential is hard-coded in domain/application modules.
- No duplicate configuration key may have conflicting meanings across applications.

## 9. GitHub workflow responsibilities

| Workflow | Responsibility |
|---|---|
| `frontend-ci.yml` | Install lockfile dependencies, lint, strict type-check, unit/integration tests, production build |
| `backend-ci.yml` | Lockfile sync, lint/format, type-check, unit/integration tests |
| `machine-learning-ci.yml` | ML lint/types, data-contract tests, golden/safety tests, deterministic package build |
| `contract-ci.yml` | Generate OpenAPI, compare drift, generate TypeScript types, verify compatibility |
| `end-to-end-ci.yml` | Start disposable stack and run critical role journeys |
| `security-ci.yml` | Secret, dependency, static, container, and policy scanning |
| `accessibility-ci.yml` | Automated critical-page and journey accessibility checks |
| `docker-ci.yml` | Build and inspect all container targets |
| `migration-ci.yml` | Upgrade empty/current-like databases and validate migration state |
| `deploy-preview.yml` | Deploy approved frontend preview and non-production API target |
| `deploy-staging.yml` | Controlled staging migration, API/worker/frontend deployment, smoke tests |
| `deploy-production.yml` | Environment-protected production release, migration gate, smoke checks, rollback metadata |

Production deployment uses protected GitHub environments and required reviewers. Training or registering a model does not bypass the separate model approval workflow.

## 10. Scaffolding and migration policy

The current repository contains a minimal JavaScript Vite starter at the root. After this structure is approved:

1. Preserve all approved documentation.
2. Create the root governance/configuration files with real content.
3. Move and convert the current frontend into `frontend/` using strict TypeScript.
4. Establish shared TypeScript configuration before feature code.
5. Create the backend package and a real initial database migration.
6. Create the ML package with dataset/feature contracts before model logic.
7. Generate the OpenAPI contract from the real FastAPI schemas; do not hand-author generated client files.
8. Add Docker and CI files only with executable, verified behavior.
9. Create feature folders when their production vertical slice begins; do not create unused empty branches.
10. Keep every committed step buildable and testable.

This blueprint is complete for the approved MVP scope, but physical scaffolding is incremental. That preserves the no-placeholder rule and prevents empty directories from falsely suggesting implemented capabilities.

## 11. Approval gate

Approval confirms:

- Top-level monorepo boundaries
- Frontend feature names and shared-component boundaries
- Backend Clean Architecture module boundaries
- Independent reusable machine-learning package
- Shared-contract and configuration package strategy
- README/documentation locations
- Local, module, and cross-system test organization
- Docker, infrastructure, configuration, and GitHub workflow organization
- Dependency, naming, configuration, and scaffolding policies

Approval authorizes the next explicitly requested phase only. It does not authorize implementation, dependency installation, file migration, or deletion of the current starter.
