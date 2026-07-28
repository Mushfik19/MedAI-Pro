# MediAI Pro — Complete UI/UX Specification

| Document property | Value |
|---|---|
| Document ID | MAP-UX-001 |
| Version | 1.0 |
| Status | Proposed — awaiting approval |
| Date | 2026-07-26 |
| Repository root | `D:\React JS\Ai ML project\my-project` |
| Related requirements | MAP-SRS-001 |
| Related architecture | MAP-ARCH-001 |

This document defines the production UI/UX baseline for MediAI Pro. It contains no implementation code and does not modify prior specifications. It governs visual design, interaction, responsive behavior, accessibility, motion, navigation, dashboards, and primary journeys.

The future implementation locations governed by this specification are:

- `D:\React JS\Ai ML project\my-project\packages\design-tokens`
- `D:\React JS\Ai ML project\my-project\frontend\src\components`
- `D:\React JS\Ai ML project\my-project\frontend\src\features`
- `D:\React JS\Ai ML project\my-project\frontend\src\styles`
- `D:\React JS\Ai ML project\my-project\docs\frontend`

## 1. Experience vision

MediAI Pro should feel calm, credible, clinically responsible, and technically advanced. The interface must make complex predictions understandable without implying diagnostic certainty. Premium presentation comes from disciplined typography, spacing, content hierarchy, data clarity, and restrained motion—not visual decoration that competes with safety information.

### 1.1 Design principles

1. **Safety before delight:** emergency guidance and limitations take priority over branding, charts, AI explanations, and animation.
2. **Clarity over density:** show the minimum information needed for the current decision, then allow progressive disclosure.
3. **Evidence over certainty:** label probabilities, confidence, model version, supporting evidence, limitations, and provenance explicitly.
4. **Patient agency:** users can review inputs, understand data use, manage sessions, control doctor access, and request export/deletion.
5. **Professional efficiency:** doctor and admin workflows prioritize scanning, filtering, keyboard operation, and auditable high-risk actions.
6. **Accessible by default:** color, motion, pointer precision, vision, hearing, and cognitive ability must never be assumed.
7. **Consistent meaning:** severity, confidence, state, and action hierarchy behave identically across pages.
8. **Responsive, not reduced:** mobile layouts reorganize tasks without removing core capability or safety context.
9. **Honest AI:** the interface always identifies generated content, grounding scope, and unavailable/uncertain states.
10. **Reusable systems:** components own one visual/interaction responsibility and are composed by feature pages.

### 1.2 Brand attributes

| Attribute | Expression |
|---|---|
| Trustworthy | Clear language, stable layout, visible provenance, high contrast |
| Calm | Cool blue surfaces, generous spacing, limited alert colors |
| Intelligent | Structured evidence, polished data visualization, precise feedback |
| Human | Plain language, supportive microcopy, nonjudgmental errors |
| Clinical | Consistent terminology, careful severity hierarchy, audit visibility |
| Premium | Crisp typography, subtle depth, refined gradients, smooth restraint |

### 1.3 Anti-patterns

- No glowing emergency animation, pulsing danger states, or gamified health scores.
- No use of “diagnosed,” “confirmed,” “safe,” or “all clear” for model results.
- No hidden disclaimers below long content.
- No probability represented only as a colored ring or unlabeled gauge.
- No glass panel behind dense body text without an opaque contrast layer.
- No auto-rotating carousel, parallax-heavy landing page, or decorative motion in clinical flows.
- No disabled button without an adjacent explanation when the next action is blocked.
- No destructive or model-lifecycle action triggered by a single click.

## 2. Design System

### 2.1 Token hierarchy

The design system has four token layers:

1. **Primitive tokens:** raw color, spacing, typography, radius, shadow, and motion values.
2. **Semantic tokens:** background, foreground, border, brand, success, warning, danger, emergency, and focus meanings.
3. **Component tokens:** button height, card padding, field border, sidebar width, chart grid, and similar component decisions.
4. **Feature tokens:** rare values with a specific clinical or workflow meaning, such as confidence-band presentation.

Components consume semantic/component tokens rather than primitive colors directly. Dark mode changes semantic mappings, not feature markup.

### 2.2 Spacing system

The base unit is 4 px.

| Token | Value | Primary use |
|---|---:|---|
| `space-0` | 0 px | Reset |
| `space-1` | 4 px | Icon/text micro-gap |
| `space-2` | 8 px | Compact controls and metadata |
| `space-3` | 12 px | Field internal spacing |
| `space-4` | 16 px | Default component gap |
| `space-5` | 20 px | Dense card padding |
| `space-6` | 24 px | Standard card padding |
| `space-8` | 32 px | Section internal spacing |
| `space-10` | 40 px | Mobile section separation |
| `space-12` | 48 px | Desktop section separation |
| `space-16` | 64 px | Large section separation |
| `space-20` | 80 px | Marketing section spacing |
| `space-24` | 96 px | Landing hero/major separation |

Spacing must communicate grouping. A child-to-parent gap is always smaller than the gap between peer sections.

### 2.3 Radius system

| Token | Value | Use |
|---|---:|---|
| `radius-xs` | 4 px | Small chips and inner chart markers |
| `radius-sm` | 8 px | Compact inputs and badges |
| `radius-md` | 12 px | Inputs, buttons, alerts |
| `radius-lg` | 16 px | Cards, sheets, dialogs |
| `radius-xl` | 24 px | Hero/media surfaces |
| `radius-full` | 9999 px | Avatars and status dots only |

Clinical cards use 16 px; interactive controls use 10–12 px. Excessive pill shapes are avoided because they weaken information hierarchy.

### 2.4 Elevation and surfaces

| Level | Visual treatment | Use |
|---|---|---|
| Base | No shadow; page background | Application canvas |
| Raised | Soft 1 px border plus low shadow | Standard cards |
| Floating | Stronger shadow plus clear edge | Popovers, menus, sticky toolbars |
| Modal | Backdrop plus focused shadow | Dialogs and sheets |
| Critical | Opaque semantic border/background, no decorative glass | Emergency/safety alerts |

Shadows are neutral-blue, low-opacity, and never the only boundary. Dark mode relies more on borders and surface contrast than heavy shadow.

### 2.5 Glassmorphism

Glass is permitted for:

- Landing-page hero preview
- Public navigation over a decorative background
- Small nonclinical dashboard accents

Glass is prohibited for:

- Emergency alerts
- Form fields
- Prediction result body text
- Doctor notes
- Tables
- Dialogs requiring careful review
- Terms, consent, privacy, or safety copy

Permitted glass surfaces require an opaque fallback, visible border, restrained blur, and verified text contrast over every background state.

### 2.6 Layout grid

| Context | Columns | Gutter | Side margin | Maximum content width |
|---|---:|---:|---:|---:|
| Mobile 320–639 px | 4 | 16 px | 16 px | Fluid |
| Large mobile 640–767 px | 4 | 20 px | 24 px | Fluid |
| Tablet 768–1023 px | 8 | 24 px | 32 px | Fluid |
| Desktop 1024–1439 px | 12 | 24 px | 32 px | 1280 px |
| Wide 1440 px+ | 12 | 32 px | 48 px | 1440 px |

Reading content uses a maximum line container of 720 px. Dense admin tables may use the full application canvas.

### 2.7 Control dimensions

| Control | Compact | Default | Large |
|---|---:|---:|---:|
| Button/input height | 36 px | 44 px | 52 px |
| Icon-only control target | 44 × 44 px minimum | 44 × 44 px | 48 × 48 px |
| Desktop sidebar | — | 264 px | — |
| Collapsed desktop sidebar | — | 72 px | — |
| Top application bar | — | 64 px | — |
| Mobile top bar | — | 56 px | — |
| Mobile bottom navigation | — | 64 px plus safe area | — |

Compact controls are limited to dense desktop admin/doctor contexts and still retain a minimum 44 × 44 px target through padding or row affordance where touch is possible.

## 3. Typography

### 3.1 Typeface families

| Role | Typeface | Fallback |
|---|---|---|
| Display and headings | Manrope | Inter, system UI, sans-serif |
| Body and interface | Inter | system UI, Segoe UI, sans-serif |
| Numeric/tabular data | Inter with tabular numerals | system UI, sans-serif |
| Technical identifiers | UI monospace | SFMono-Regular, Consolas, monospace |

Manrope gives the product a modern, premium voice; Inter prioritizes legibility in forms, tables, and clinical explanations. Fonts should be self-hosted or loaded under an approved privacy/performance policy, with WOFF2 subsets and `font-display: swap`.

### 3.2 Type scale

| Style | Desktop size / line | Mobile size / line | Weight | Use |
|---|---|---|---:|---|
| Display | 56 / 64 px | 40 / 48 px | 700 | Landing hero only |
| H1 | 40 / 48 px | 32 / 40 px | 700 | Page title |
| H2 | 32 / 40 px | 28 / 36 px | 700 | Major section |
| H3 | 24 / 32 px | 22 / 30 px | 650 | Card group/major panel |
| H4 | 20 / 28 px | 18 / 26 px | 650 | Card title |
| Body large | 18 / 30 px | 17 / 28 px | 400 | Lead/explanatory copy |
| Body | 16 / 26 px | 16 / 26 px | 400 | Default content |
| Body small | 14 / 22 px | 14 / 22 px | 400 | Supporting content |
| Label | 14 / 20 px | 14 / 20 px | 600 | Form/control label |
| Caption | 12 / 18 px | 12 / 18 px | 500 | Metadata only |
| Data large | 32 / 40 px | 28 / 36 px | 700 | Primary metric |
| Data standard | 16 / 24 px | 16 / 24 px | 600 | Tables/results |

Weights are limited to 400, 500, 600, and 700. Body text is never lighter than 400. Captions must not carry essential instructions alone.

### 3.3 Typography rules

- Body lines should contain approximately 45–75 characters.
- Headings use sentence case, not title case or all caps.
- All-caps text is restricted to very short nonessential overlines; letter spacing must be increased.
- Probabilities use a consistent percentage precision defined by product policy.
- Model versions, request IDs, and checksums use monospace only when technical distinction is useful.
- Medical terms include plain-language support without visually diminishing the correct clinical term.
- Links are underlined in body copy or have another persistent non-color affordance.
- Numeric columns use tabular numerals and right alignment.
- Text zoom to 200% must preserve content and operation without horizontal page scrolling, except necessary data tables.

## 4. Colour Palette

### 4.1 Brand blue

| Token | Hex | Use |
|---|---|---|
| Blue 50 | `#EFF6FF` | Light tinted backgrounds |
| Blue 100 | `#DBEAFE` | Selected surface |
| Blue 200 | `#BFDBFE` | Light borders |
| Blue 300 | `#93C5FD` | Decorative gradient |
| Blue 400 | `#60A5FA` | Dark-mode accent |
| Blue 500 | `#3B82F6` | Data visualization |
| Blue 600 | `#2563EB` | Primary action on light theme |
| Blue 700 | `#1D4ED8` | Hover/strong brand text |
| Blue 800 | `#1E40AF` | Pressed state |
| Blue 900 | `#1E3A8A` | Deep brand surface |
| Blue 950 | `#172554` | Dark gradient anchor |

### 4.2 Cyan accent

| Token | Hex | Use |
|---|---|---|
| Cyan 50 | `#ECFEFF` | Decorative accent background |
| Cyan 100 | `#CFFAFE` | Highlight tint |
| Cyan 300 | `#67E8F9` | Gradient highlight |
| Cyan 400 | `#22D3EE` | Dark-theme accent |
| Cyan 500 | `#06B6D4` | Chart series/decorative accent |
| Cyan 600 | `#0891B2` | Accessible accent text where verified |
| Cyan 700 | `#0E7490` | Strong accent text |

Cyan is not used as a white-text button background unless the exact contrast is verified. Blue remains the primary action color.

### 4.3 Neutral slate

| Token | Hex | Use |
|---|---|---|
| Slate 0 | `#FFFFFF` | Light elevated surface |
| Slate 50 | `#F8FAFC` | Light page background |
| Slate 100 | `#F1F5F9` | Muted surface |
| Slate 200 | `#E2E8F0` | Default border |
| Slate 300 | `#CBD5E1` | Strong border/disabled |
| Slate 400 | `#94A3B8` | Placeholder/nonessential icon |
| Slate 500 | `#64748B` | Secondary text where contrast permits |
| Slate 600 | `#475569` | Supporting text |
| Slate 700 | `#334155` | Strong supporting text |
| Slate 800 | `#1E293B` | Dark surface |
| Slate 900 | `#0F172A` | Primary dark surface |
| Slate 950 | `#020617` | Dark page background |

### 4.4 Semantic colors

| Meaning | Light background | Border | Strong color | Light-theme text | Dark-theme treatment |
|---|---|---|---|---|---|
| Information | `#EFF6FF` | `#BFDBFE` | `#2563EB` | `#1E3A8A` | Blue 400 on Slate 900 |
| Success | `#F0FDF4` | `#BBF7D0` | `#15803D` | `#14532D` | Green 400 on green-tinted Slate 900 |
| Warning | `#FFFBEB` | `#FDE68A` | `#B45309` | `#78350F` | Amber 300 on amber-tinted Slate 900 |
| Danger | `#FEF2F2` | `#FECACA` | `#DC2626` | `#7F1D1D` | Red 300 on red-tinted Slate 900 |
| Emergency | `#FFF1F2` | `#FDA4AF` | `#B91C1C` | `#7F1D1D` | White/rose 100 on `#7F1D1D` |

Emergency is a distinct content priority, not merely a stronger danger color. It includes a clear title, action, explanatory text, icon, and regional emergency guidance.

### 4.5 Confidence and severity

| Meaning | Visual strategy |
|---|---|
| Confidence high | Text “High model confidence,” icon, blue treatment |
| Confidence medium | Text “Moderate model confidence,” icon, amber treatment |
| Confidence low | Text “Low model confidence,” icon, neutral/amber caution treatment |
| Severity low | Label and calm blue/green-neutral treatment |
| Severity moderate | Label and amber treatment |
| Severity high | Label and strong orange/red treatment |
| Severity critical | Label, emergency hierarchy, and approved red treatment |

Confidence and severity must never share unlabeled colored dots. They are different concepts and must always be named.

### 4.6 Theme mapping

| Semantic role | Light theme | Dark theme |
|---|---|---|
| Page background | Slate 50 | Slate 950 |
| Primary surface | Slate 0 | Slate 900 |
| Secondary surface | Slate 100 | Slate 800 |
| Primary text | Slate 950 | Slate 50 |
| Secondary text | Slate 600 | Slate 300 |
| Muted text | Slate 500 | Slate 400 |
| Default border | Slate 200 | Slate 700 |
| Strong border | Slate 300 | Slate 600 |
| Primary action | Blue 600 | Blue 500 |
| Primary action hover | Blue 700 | Blue 400 |
| Focus ring | Blue 600 with offset | Blue 400 with dark offset |
| Overlay | Slate 950 at 55% | Black at 70% |

Theme may follow system, light, or dark user preference. Theme changes never alter semantic meaning or remove borders.

### 4.7 Data visualization palette

Ordered categorical series:

1. Blue `#2563EB`
2. Cyan `#0891B2`
3. Violet `#7C3AED`
4. Teal `#0F766E`
5. Amber `#B45309`
6. Rose `#BE123C`

Charts also use line pattern, marker shape, direct labels, or legend text. Red is reserved for critical meaning when a chart contains safety status. Grid lines use neutral borders; background bands are subtle. Gradient area fills never obscure values.

### 4.8 Contrast policy

- Normal text: minimum 4.5:1.
- Large text: minimum 3:1.
- UI components, icons carrying meaning, focus indicators, and chart boundaries: minimum 3:1 against adjacent colors.
- Disabled content remains understandable but is exempt only where WCAG permits; essential information is never conveyed solely through disabled styling.
- Every semantic pair is verified in both themes and in high-contrast/forced-colors modes before release.

## 5. Icons

### 5.1 Icon system

Lucide is the primary interface icon family because its simple outlined geometry fits the clinical/minimal direction and provides consistent sizing. Custom SVG is limited to the MediAI Pro logo, product-specific medical illustration, and data-visualization marks not represented by Lucide.

| Context | Size | Stroke | Treatment |
|---|---:|---:|---|
| Inline with body text | 16 px | 1.75 px | Align optically to text |
| Button/input | 18 px | 1.75–2 px | Never replace label for unfamiliar actions |
| Navigation | 20 px | 1.75–2 px | Pair with text except mobile bottom navigation |
| Card/status | 24 px | 2 px | Use semantic container if meaningful |
| Empty state | 32–40 px | 1.5 px | Decorative and subdued |
| Marketing illustration icon | 40–48 px | 1.5 px | Brand/accent treatment |

### 5.2 Icon semantics

| Meaning | Icon direction |
|---|---|
| Prediction | Activity or stethoscope-inspired product mark |
| History | History/clock |
| Dashboard | Layout dashboard |
| AI chat | Message circle with sparkle, always labeled “AI Chat” |
| Doctor | Stethoscope/user-round |
| Patient access | User check/key |
| Admin | Shield/settings |
| Model | Brain/cpu with explicit “Model” label |
| Dataset | Database/file table |
| Emergency | Triangle alert; never a heart icon alone |
| Success | Circle check |
| Warning | Triangle alert |
| Information | Circle info |
| Error | Circle alert |
| Privacy/security | Shield lock |
| Export/download | File down/download |
| Signed note | File check/signature |

### 5.3 Icon accessibility

- Decorative icons are hidden from assistive technology.
- Meaningful standalone icons have an accessible name through the control.
- A tooltip does not replace an accessible name.
- Status is never conveyed by icon alone; visible text accompanies emergency, severity, confidence, and model state.
- Icon-only controls are reserved for universal actions such as close or menu and retain a minimum 44 × 44 px target.
- Icons do not animate indefinitely.

## 6. Components

### 6.1 Component architecture

The component system has four levels:

1. **Primitives:** accessible Shadcn-derived controls such as button, input, dialog, and tabs.
2. **Shared composites:** page header, filter bar, data table, alert, chart container.
3. **Clinical composites:** probability, confidence, severity, emergency, model version, and disclaimer.
4. **Feature components:** assessment form, prediction result, review queue, model comparison, and similar business-specific composition.

A feature component is promoted to shared only after at least two real cross-feature uses and a stable, domain-neutral API. Visual reuse must not erase distinct clinical meaning.

### 6.2 Universal interaction states

Every interactive component defines:

- Default
- Hover where pointer hover exists
- Focus-visible
- Active/pressed
- Selected where applicable
- Disabled with reason where blocking is meaningful
- Loading without layout shift
- Success feedback where the state changed
- Error with recovery
- Read-only where viewing is permitted but editing is not

Focus-visible uses a 2 px high-contrast ring plus at least 2 px offset. Hover must not be required to discover information.

### 6.3 Buttons

| Variant | Purpose | Examples |
|---|---|---|
| Primary | One main action per region | “Start assessment,” “Continue,” “Save changes” |
| Secondary | Alternative non-destructive action | “Review history,” “Cancel” |
| Outline | Lower-emphasis utility | “Export PDF,” “View details” |
| Ghost | Toolbar/navigation utility | Filter reset, menu trigger |
| Destructive | Reversible or controlled destructive action | Revoke access, suspend account |
| Emergency | Approved urgent action only | Regional emergency call/action |
| Link | Navigation within prose | Privacy, model limitations |

Rules:

- Labels start with a clear verb.
- Loading preserves width and replaces or precedes the label with a progress indicator.
- Destructive and emergency styles are not used for ordinary emphasis.
- Disabled buttons do not carry the only explanation; inline text explains what is missing.
- Forms support keyboard submission without requiring a pointer.

### 6.4 Form controls

Standard anatomy:

1. Persistent label
2. Optional supporting description
3. Control
4. Optional unit or bounded suffix
5. Validation/recovery message

Requirements:

- Placeholder text is an example, never the label.
- Required status is stated in text; optional fields are marked where most fields are required.
- Error messages state what happened and how to fix it.
- Units are explicit and cannot be inferred from locale alone.
- Date controls allow keyboard entry and calendar selection.
- Password controls expose show/hide, requirements, and Caps Lock feedback where supported.
- Search/combobox controls announce result count and current selection.
- Checkboxes and radio controls have a combined label target at least 44 px high.

### 6.5 Clinical assessment controls

#### Symptom search

- Searches by approved symptom name and synonyms.
- Groups results by clinical category.
- Shows selected state and prevents duplicates.
- Supports keyboard traversal, escape, clear, and announced result counts.
- Does not display disease predictions while the user is still selecting symptoms.

#### Selected symptom card

- Contains symptom name, intensity, duration, present/absent state where relevant, edit, and remove.
- Intensity uses numbered choices with verbal anchors, not an unlabeled slider.
- Duration accepts an explicit number and unit.
- Removal is immediate but offers an undo toast if no clinical submission has occurred.

#### Wizard progress

- Shows current step name and “Step X of Y.”
- Mobile shows a compact progress bar plus text; desktop may show all step labels.
- Completed steps may be revisited without losing validated data.
- Progress does not imply diagnostic completeness.

### 6.6 Cards and surfaces

| Card type | Anatomy | Special rule |
|---|---|---|
| Standard card | Optional icon, title, description, content, optional actions | No more than two action levels |
| Stat card | Label, primary value, timeframe/context, optional trend | Prediction counts are not diagnoses |
| Disease result card | Rank, disease, probability, severity, evidence, tests, specialist | Candidate remains labeled as possible |
| Confidence card | Band, numeric score where approved, explanation, limitations | Distinguishes model confidence from certainty |
| Weekly/monthly report | Period, summary, trend, caveat, details action | Clearly labels predicted-frequency data |
| Model card | Version, status, evaluation summary, activation state | Active state is text plus icon |
| Access grant card | Doctor, scope, status, expiry, revoke action | Expiry always visible |

Cards in the same grid use aligned headers and action areas when practical. Entire cards are clickable only when semantics and focus behavior remain clear.

### 6.7 Alerts and notifications

| Component | Persistence | Use |
|---|---|---|
| Inline information | Persistent | Context and education |
| Inline warning | Persistent | Incomplete/OOD/important limitation |
| Form error summary | Until resolved | Submission validation |
| Toast | Temporary, pauseable | Noncritical confirmation or recoverable background event |
| Banner | Persistent until state changes | Account verification, service degradation, access scope |
| Emergency alert | Persistent and primary | Approved red-flag escalation |

Emergency alert anatomy:

1. “Urgent action may be needed” title
2. Plain-language reason category without speculative diagnosis
3. Approved immediate action
4. Regional emergency contact/action
5. “Do not rely on this tool for emergency care” statement
6. Acknowledgement where required, without hiding the alert afterward

Toasts never contain sensitive clinical detail and never carry the only confirmation of a high-risk action.

### 6.8 Probability, confidence, and severity

#### Probability bar

- Displays disease label, rank, numeric percentage, and horizontal scale.
- Starts from a common zero baseline.
- Does not use 3D, radial distortion, or truncated axes.
- Top-five values are not visually normalized to sum to 100%.

#### Confidence indicator

- Displays band text, approved numeric value if useful, an information explanation, and OOD/input-completeness warning.
- Never uses a speedometer or certainty checkmark.

#### Severity badge

- Includes severity word.
- Uses a semantic icon/color combination.
- Has a tooltip or adjacent definition where the meaning could be misunderstood.
- Does not replace emergency-rule output.

### 6.9 Tables and responsive data

Desktop tables provide:

- Visible column headings
- Sort state announced and represented visually
- Row selection only when batch actions exist
- Sticky header for long tables
- Row action menu with accessible label
- Pagination/status outside the table semantics
- Empty, loading, error, and partial-data rows

Mobile does not compress complex tables beyond readability. Each row becomes a labeled record card with primary data, state, and a “View details” action. Admin comparison tables may permit deliberate horizontal scrolling with sticky first column, visible scroll affordance, and a summary above.

### 6.10 Charts

Every chart includes:

- Title and plain-language purpose
- Effective date range
- Units and aggregation definition
- Accessible summary
- Data-table alternative
- Keyboard-accessible or equivalent details
- Visible legend/direct labels
- Empty/insufficient-data state
- Caveat distinguishing predictions from confirmed diagnoses

Tooltips supplement rather than contain exclusive information. Animations occur once on entry only when motion is allowed. Chart colors remain distinct in common color-vision deficiencies and are supplemented by shape/pattern/text.

### 6.11 Dialogs, sheets, and drawers

- Dialogs are used for decisions that require focus: sign note, destructive action, MFA, model approval/rollback.
- Sheets are used for supporting edit/detail tasks that retain page context.
- Drawers are used for read-heavy detail from a table.
- Opening moves focus to the title or first meaningful control.
- Closing returns focus to the trigger.
- Escape closes only when abandoning is safe; high-risk in-progress actions require explicit confirmation.
- A visible close action is always provided.
- Destructive confirmations name the target and consequence; typing a confirmation phrase is reserved for exceptionally high-impact actions.

### 6.12 Navigation components

- Sidebar groups role-specific primary destinations and shows one active state.
- Breadcrumbs reflect hierarchy, not browser history.
- Mobile bottom navigation contains no more than five primary patient destinations.
- User menu contains profile, settings, session/account actions, theme, and logout.
- Notification center shows unread state without exposing clinical detail in the trigger.
- Back navigation preserves filters and scroll position when returning from a record detail.

### 6.13 Empty, loading, error, and permission states

| State | Content |
|---|---|
| First-use empty | What this area will contain and a safe primary action |
| Filtered empty | Which filters produced no result and a clear reset |
| Loading | Shape-matched skeleton or labeled progress; no fake data |
| Partial failure | Preserve valid content and isolate failed panel with retry |
| Full failure | Plain summary, safe recovery, request ID for support |
| Permission denied | Non-disclosing explanation and valid navigation |
| Service unavailable | Affected capability, unaffected capabilities, retry timing if known |
| LLM unavailable | Prediction remains visible; explanation/chat marked unavailable |
| Model unavailable | No candidates; emergency/static safety guidance remains |

### 6.14 Content design

- Use “prediction,” “possible condition,” and “candidate,” not “diagnosis.”
- Use “model confidence,” never “certainty.”
- Say “A clinician may recommend…” for curated lab tests.
- State what the user can do next, not only what failed.
- Avoid blame: “We couldn’t process this file,” not “You uploaded a bad file.”
- Confirm high-risk changes with target, reason, actor, and audit outcome.
- AI text is labeled “AI-generated explanation” and shows its grounding scope.

## 7. Responsive Design

### 7.1 Breakpoints

Breakpoints are layout thresholds, not device labels.

| Name | Minimum width | Primary behavior |
|---|---:|---|
| Base | 320 px | Single-column mobile |
| Small | 480 px | Wider mobile controls/cards |
| Medium | 640 px | Two-column cards where content permits |
| Tablet | 768 px | Tablet grid and larger sheets |
| Desktop | 1024 px | Persistent sidebar and multi-panel layouts |
| Large | 1280 px | Full dashboard grids and wider tables |
| Wide | 1440 px | Maximum canvas with controlled line lengths |

Components respond to available container width where practical. Breakpoints never hide essential functionality.

### 7.2 Global responsive behavior

| Element | Mobile/base | Tablet | Desktop |
|---|---|---|---|
| Public navigation | Logo, primary CTA, menu sheet | Expanded CTA/menu | Full inline navigation |
| Application navigation | Top bar plus role-appropriate bottom nav or menu sheet | Top bar plus navigation rail | Persistent sidebar |
| Page header | Stacked title/actions | Title with wrapping actions | Inline title/actions |
| Forms | One column | One/two columns by relationship | Two columns only for logically paired fields |
| Cards | One column | Two columns | Two to four columns |
| Tables | Record cards or deliberate scroll | Hybrid/table | Full data table |
| Dialog | Near-full-width with margins | Centered | Centered constrained width |
| Sheet | Full-width bottom/right sheet | 480–560 px | 480–640 px |
| Charts | Minimum 240 px plot height | 280–320 px | 320–400 px |
| Detail page | Linear priority order | Two-column supporting info | Main content plus contextual rail |

### 7.3 Responsive content priority

The visual order is also the reading and keyboard order:

1. Emergency state
2. Page title and status
3. Primary task/action
4. Core result or record
5. Explanation/evidence
6. Supporting analytics
7. Technical transparency and secondary actions

CSS reflow must not create a visual order that differs from DOM/assistive-technology order.

### 7.4 Page-specific responsive matrix

| Page | Mobile | Tablet/Desktop |
|---|---|---|
| Landing | Stacked hero; preview below CTA; condensed nav | Split hero; larger product preview; multi-column features |
| Authentication | Single opaque card; safety copy below | Split brand/safety panel and auth form |
| Prediction wizard | One task per step; sticky bottom actions | Centered 760–900 px workflow with step rail/header |
| Prediction result | Emergency, summary, candidate cards, explanation | Main differential column plus summary/transparency rail |
| History | Filter sheet plus record cards | Inline filters and table |
| Chat | Conversation list as separate sheet/page | Two-pane conversation sidebar and thread |
| Doctor patient detail | Linear timeline and note sections | Patient/timeline main area plus review/note rail |
| Admin tables | Summary, filters sheet, cards or controlled scroll | Dense table, detail drawer, batch-safe tools |
| Model comparison | Stacked metric cards; comparison selector | Side-by-side table and metric panels |
| Settings | Section list then focused panel | Settings navigation rail plus panel |

### 7.5 Zoom and reflow

- At 200% browser zoom on a 1280 px viewport, layouts behave like a narrow responsive layout.
- At 400% zoom/320 CSS px, content remains readable and functional without two-dimensional scrolling except data that intrinsically requires it.
- Sticky elements must not consume more than 30% of viewport height.
- Fixed action bars account for browser UI, safe areas, virtual keyboards, and zoom.

## 8. Mobile Design

### 8.1 Mobile priorities

- Complete core patient workflows one-handed without precision gestures.
- Keep emergency guidance and current task visible before secondary context.
- Minimize typing through approved searchable choices and sensible inputs.
- Preserve browser navigation and allow safe interruption/resumption.
- Avoid dashboards that become endless undifferentiated card stacks.

### 8.2 Mobile shell

Patient mobile navigation:

| Position | Destination |
|---|---|
| 1 | Dashboard |
| 2 | Predict |
| 3 | History |
| 4 | AI Chat |
| 5 | More |

“More” opens profile, settings, notifications, privacy, support/safety, and logout. A selected item includes icon, label, and visible active treatment.

Doctor and admin mobile views use a top bar plus navigation sheet because their information architecture exceeds five destinations. Urgent review count may appear on the doctor menu trigger without exposing patient identity.

### 8.3 Touch and gesture rules

- Minimum target: 44 × 44 px; preferred primary action: 48–52 px high.
- Minimum 8 px separation between adjacent icon targets.
- No action depends only on swipe, long press, hover, or drag.
- Swipe-to-delete is not used for clinical records, access grants, notes, models, or datasets.
- Pull-to-refresh is optional and must not replace a visible refresh capability where refresh is necessary.
- Haptic feedback is not required and never conveys exclusive meaning.

### 8.4 Mobile assessment

- Symptom search opens as a full-height sheet with persistent search and selected count.
- Selected symptoms appear as editable cards rather than compressed chips once intensity/duration is required.
- The action bar contains Back and Continue/Review; it stays above the safe area and virtual keyboard.
- Draft state is retained during navigation and recoverable after a transient failure.
- Final review is a complete readable summary; informed-use acknowledgement is adjacent to submission.
- Submission locks duplicate actions, shows real progress, and permits safe status recovery if the network disconnects.

### 8.5 Mobile result

Order:

1. Emergency alert if present
2. Non-diagnostic result title and timestamp
3. Confidence explanation
4. Ranked disease cards
5. Recommended next-step context
6. AI explanation
7. Model transparency and disclaimer
8. Export/share-authorized actions

Disease result cards are initially concise but show probability and severity without expansion. Evidence, tests, and specialist details may expand with accessible disclosure controls.

### 8.6 Mobile data and admin workflows

- Filters open in a sheet and summarize active filters as removable labeled chips.
- Record cards use definition-style label/value pairs.
- Bulk selection is avoided on narrow screens unless operationally essential.
- High-risk admin actions show a full-screen review dialog with target, impact, reason, step-up status, and confirmation.
- Large metric comparisons provide a selected-metric view plus an accessible table rather than shrinking text.

### 8.7 Mobile keyboard behavior

- Input type and keyboard match email, numeric, telephone, date, and text intent.
- Content scrolls the focused control above the virtual keyboard.
- Sticky footer actions move or collapse so they do not cover focused fields or errors.
- Enter/Next advances only when it cannot accidentally submit an incomplete high-risk form.

## 9. Navigation

### 9.1 Public information architecture

```text
Home
|-- How it works
|-- Features
|-- For patients
|-- For doctors
|-- Safety
|-- Security and privacy
|-- FAQ
|-- Sign in
`-- Create account

Legal/footer
|-- Product safety
|-- Privacy
|-- Terms
|-- Accessibility statement
`-- Contact/support
```

Public CTA hierarchy:

- Primary: “Start with MediAI Pro” or “Create account”
- Secondary: “See how it works”
- Persistent safety link: “When not to use this tool”

### 9.2 Patient navigation

```text
Dashboard
New Prediction
Prediction History
AI Chat
Doctor Access
Notifications
Profile
Settings
|-- Appearance
|-- Notifications
|-- Security and sessions
|-- Consent history
|-- Data export
`-- Account deletion
```

“New Prediction” is a visually prominent action but does not dominate emergency messaging or active form work.

### 9.3 Doctor navigation

```text
Doctor Dashboard
Patients
Review Queue
Reports
Notifications
Profile
Settings
```

Patient detail is contextual beneath Patients:

```text
Patients > Patient record > Prediction > Review / Notes
```

The access grant scope and expiry remain visible in patient context.

### 9.4 Admin navigation

```text
Overview
Users
Clinical Catalog
|-- Diseases
|-- Symptoms
|-- Lab tests
|-- Specialties
|-- Mappings
`-- Emergency rules
Datasets
Training Jobs
Model Registry
Analytics
Audit Logs
Settings
```

Model registry and training jobs are separate destinations to reinforce that training does not equal activation.

### 9.5 Navigation behavior

- Current location has one unambiguous active state.
- Section expansion persists during the session.
- Sidebar collapse persists as a user preference.
- Breadcrumbs appear on nested doctor/admin/detail flows; they are omitted from simple top-level patient pages.
- Unsaved forms warn before route exit when data cannot be safely retained.
- Authentication redirect returns users only to an authorized safe path.
- Deep links preserve resource authorization and show non-disclosing denied/not-found states.
- Back from detail returns to the prior filters, cursor where recoverable, and scroll position.

### 9.6 Search

The MVP does not use a single global search that mixes patients, diseases, users, and audit data because access and semantics differ. Search is scoped:

- Symptom search within prediction
- Patient search within doctor-granted records
- User search within admin users
- Catalog search within catalog entity
- Audit search within permitted audit metadata

The scope is always visible in the field label.

## 10. Dashboard Layout

### 10.1 Shared dashboard anatomy

```text
Page header
|-- Role-appropriate greeting/title
|-- Effective date range
`-- Primary action

Priority alerts

Summary metric grid

Primary insight row
|-- Main trend/queue
`-- Supporting distribution/status

Actionable records

Reports/secondary insight
```

Dashboard metrics are server-derived and display the effective range and last-updated time. Trend arrows include a verbal comparison and do not imply that increased prediction activity is positive or negative.

### 10.2 Patient dashboard

Desktop 12-column layout:

| Row | Columns | Content |
|---|---|---|
| Header | 12 | Greeting, period selector, “New prediction” |
| Alerts | 12 | Verification, report status, service or safety notices |
| Summary | 3 + 3 + 3 + 3 | Total predictions, average model confidence, recent activity, red-flag count |
| Insights | 8 + 4 | Prediction trend; disease-frequency summary |
| Reports | 6 + 6 | Weekly and monthly report cards |
| Recent | 12 | Recent predictions table/list |

Patient dashboard rules:

- “Disease frequency” means frequency among predicted candidates and says so.
- Red-flag count is not gamified; it links to records and relevant safety context.
- Average confidence includes the effective population and is not presented as health improvement.
- Empty state prioritizes starting an informed assessment and understanding limitations.

### 10.3 Doctor dashboard

Desktop layout:

| Row | Columns | Content |
|---|---|---|
| Header | 12 | Doctor context, review filter, patient search |
| Summary | 3 + 3 + 3 + 3 | Active patients, awaiting review, red-flag records, reviews completed |
| Priority | 8 + 4 | Review queue; red-flag patient list |
| Activity | 8 + 4 | Recent patient activity; expiring access grants |

Doctor dashboard rules:

- Red-flag items appear first and include timestamp, patient identity permitted by grant, and direct review action.
- Grant expiry is visible before the doctor opens a record.
- Completed review metrics are operational, not clinical-performance scores.
- Patient cards do not expose more sensitive detail than necessary for triage.

### 10.4 Admin dashboard

Desktop layout:

| Row | Columns | Content |
|---|---|---|
| Header | 12 | Environment context, date range, no routine high-risk CTA |
| Operational health | 3 + 3 + 3 + 3 | API health, worker backlog, active model, dataset validation |
| Usage/quality | 8 + 4 | Privacy-aware usage trends; model/OOD status |
| Governance | 6 + 6 | Pending model approvals; catalog/rule changes |
| Security | 12 | Security-event summary and audit link |

Admin dashboard rules:

- Production/staging environment is unmistakable.
- Model status always includes semantic version and activation time.
- A failed job never looks like an active-model failure unless serving is actually affected.
- Model activation is not placed as a one-click dashboard shortcut.
- Aggregate analytics suppress unsafe small cohorts according to policy.

### 10.5 Dashboard card behavior

- Maximum four stat cards in a row.
- One primary value per stat card.
- Help text explains definitions that could be clinically misread.
- Clicking a card navigates only when a clear destination exists.
- Loading skeletons preserve the final grid.
- Partial card failure does not blank the dashboard.
- Date-range changes update every compatible panel and clearly identify panels with fixed periods.

### 10.6 Dashboard mobile order

Patient:

1. Header/new prediction
2. Safety/account alerts
3. Horizontal snap-free two-column metric grid or stacked cards
4. Recent predictions
5. Weekly/monthly summaries
6. Trend chart
7. Frequency chart

Doctor:

1. Red-flag queue
2. Awaiting-review queue
3. Patient search
4. Summary metrics
5. Recent activity

Admin:

1. Environment/critical operational state
2. Active model and worker status
3. Pending high-risk reviews
4. Security events
5. Usage analytics

Charts move below immediately actionable records on mobile.

## 11. Accessibility

The product target is WCAG 2.2 AA across public, patient, doctor, and admin experiences. Automated checks are necessary but not sufficient; critical journeys require manual keyboard, screen-reader, zoom/reflow, contrast, and reduced-motion testing.

### 11.1 Semantic structure

- One primary `main` region and one H1 per page.
- Headings follow a logical hierarchy without using heading levels for appearance.
- Public and application navigation use distinct labeled navigation landmarks.
- Repeated page chrome includes a first-focus skip link to main content.
- Lists, definition lists, tables, and figures use their appropriate semantics.
- Interactive cards use links/buttons rather than click handlers on noninteractive containers.
- Page title updates on navigation and includes the current feature/record context without sensitive detail in browser history where inappropriate.

### 11.2 Keyboard operation

- Every action is available without a pointer.
- Focus order follows reading/task order.
- No focus trap exists outside an open modal/sheet that correctly contains focus.
- Escape, arrow keys, Home/End, Enter, and Space follow established patterns for menus, tabs, comboboxes, radio groups, and dialogs.
- Roving focus is used only for composite widgets that require it.
- Sticky headers/footers never cover focused elements.
- Focus returns to the invoking control when a temporary layer closes.
- A new route moves focus to the page heading or main content according to route context.

### 11.3 Focus appearance

- Focus-visible uses a minimum 2 px perimeter or equivalent area with 3:1 contrast against adjacent colors.
- Focus is never removed without an equal or stronger replacement.
- Selected and focused states are visually distinct.
- Forced-colors mode retains outline, border, selected, and error distinctions.
- Error focus does not rely on scrolling alone; the focused field and summary are both clear.

### 11.4 Screen-reader behavior

- Icon-only controls have concise accessible names.
- Images have purposeful alternative text or are marked decorative.
- Form descriptions/errors are programmatically associated with controls.
- Sort direction, expanded state, selected state, progress, unread status, and required state are announced.
- Route changes, completed mutations, validation summary, report readiness, and stream completion use intentionally scoped announcements.
- Streaming chat does not announce every token. It announces response start and completion, with a user-controlled option to read the final response.
- Dynamic dashboard updates do not steal focus or announce every metric change.
- Probability bars expose disease, rank, value, and scale as text.

### 11.5 Forms and errors

- Error messages identify the field and correction.
- An error summary links to each invalid field after failed submission.
- Valid fields are not aggressively announced.
- Server and client errors use the same user-facing vocabulary.
- Time-sensitive tokens show expiry and allow accessible resend/recovery.
- Password requirements are available before failure and update without overwhelming announcements.
- Multi-step forms retain completed data and identify which step contains an error.

### 11.6 Color and vision

- Semantic meaning always includes text/icon/pattern.
- Browser zoom, text-only zoom, increased text spacing, and high contrast are supported.
- Color palette is tested for common color-vision deficiencies.
- Placeholder text is not essential content.
- Data visualization provides a table or equivalent details.
- Blur and transparency can be disabled without loss of hierarchy.

### 11.7 Motion and vestibular safety

- The system follows `prefers-reduced-motion` automatically and offers an in-product reduced-motion setting.
- No auto-playing video, parallax, flashing, rapid zoom, or large continuous movement.
- Nothing flashes more than allowed accessibility thresholds.
- Emergency content never pulses, shakes, bounces, or relies on entrance motion.
- Loading indicators rotate/fade subtly and include a text status for long work.

### 11.8 Cognitive accessibility

- Instructions use short sentences and familiar verbs.
- One primary decision per step in patient assessment.
- Technical terms are explained in place.
- Essential disclaimers are concise first, with expandable detail.
- Destructive confirmations consistently state target, effect, reversibility, and next state.
- Users can review and correct before submitting, signing, revoking, activating, rolling back, exporting, or deleting.
- Timeouts warn users and allow continuation where security policy permits.

### 11.9 Accessible authentication

- Password managers and paste are supported.
- CAPTCHA, if later required, must offer an accessible alternative.
- MFA fields support paste and proper one-time-code semantics.
- Generic credential errors preserve security without preventing recovery.
- Session lists identify device/browser, approximate activity, and current session in plain language.

### 11.10 Accessible PDFs

Generated reports require:

- Tagged headings, paragraphs, lists, and tables
- Logical reading order
- Document title and language
- Text alternatives for meaningful visuals
- Text summary/table for charts
- Sufficient contrast and non-color-only severity
- Selectable text, not image-only pages
- Visible model/version/disclaimer metadata

### 11.11 Accessibility verification matrix

| Area | Required verification |
|---|---|
| Public/auth | Keyboard, headings, error recovery, zoom, screen reader |
| Prediction | Combobox, wizard, review, progress announcements, emergency priority |
| Result | Probability semantics, disclosures, chart alternatives, explanation state |
| Chat | Streaming announcements, stop/retry, emergency interruption |
| Doctor | Data table/card parity, note signing, grant context, dialog focus |
| Admin | Dense table keyboard operation, metric comparison, high-risk confirmation |
| Theme | Light, dark, forced colors, 200% and 400% zoom |
| Motion | System setting and in-product reduced-motion behavior |

## 12. Animations

### 12.1 Motion principles

- Motion explains relationship, hierarchy, cause, or completion.
- Motion never delays input or emergency information.
- Duration is proportional to distance and complexity.
- Enter and exit states preserve spatial continuity.
- Only transform and opacity are preferred for performance; layout-affecting animation is exceptional.
- Repeated dashboard refreshes do not replay entry choreography.

### 12.2 Duration scale

| Token | Duration | Use |
|---|---:|---|
| Instant | 0 ms | Emergency, reduced motion, immediate state |
| Micro | 100 ms | Press, focus-adjacent feedback, icon state |
| Fast | 160 ms | Tooltip, small menu, hover transition |
| Standard | 220 ms | Card disclosure, tab content, toast |
| Moderate | 300 ms | Dialog/sheet, route section |
| Slow | 420 ms maximum | Landing hero or major educational illustration |

No routine product transition exceeds 420 ms.

### 12.3 Easing

| Motion | Easing character |
|---|---|
| Enter | Decelerating, quick start and gentle settle |
| Exit | Accelerating, quick completion |
| Move/reorder | Symmetric ease-in-out |
| Press | Immediate, minimal scale/contrast response |

Spring motion is allowed only when critically damped with no playful bounce in clinical/admin workflows.

### 12.4 Component motion

| Component | Standard behavior | Reduced motion |
|---|---|---|
| Route change | Short fade/4–8 px translate within content region | Instant content replacement/focus |
| Sidebar | Width/opacity transition without content jump | Instant |
| Sheet/dialog | Fade plus short edge/vertical transition | Fade or instant |
| Accordion | Height/content reveal | Instant reveal |
| Toast | Short translate/fade; pause on hover/focus | Fade only |
| Chart | One-time draw/fade after data load | Static |
| Progress step | Color/position transition | Instant |
| Button loading | Subtle spinner, stable width | Static progress icon/text |
| Chat stream | Text appears naturally; no per-token caret flashing | Same, no decorative caret |
| Success confirmation | Check/fade once | Static check |
| Emergency alert | No decorative entrance | No motion |

### 12.5 Landing-page choreography

- Hero copy enters as one group; do not animate every word.
- Product preview may fade/translate after primary text, within 420 ms.
- Feature sections animate only when first entering the viewport and only once.
- Scroll does not drive parallax or scrubbed clinical content.
- Motion stops when content is offscreen or the page is backgrounded.

### 12.6 Loading motion

- Under 300 ms: do not show a spinner to avoid flicker.
- 300 ms–2 s: use localized spinner/skeleton.
- Over 2 s: show descriptive progress and what remains usable.
- Long background work: provide durable job state, allow navigation away, and notify on completion.
- Skeletons match real layout and do not resemble fabricated clinical values.

## 13. User Journey

### 13.1 Journey A — Visitor understands and registers

| Stage | User need | Interface response | Risk control |
|---|---|---|---|
| Arrive | Understand the product quickly | Clear hero, three-step workflow, primary CTA | “Not a diagnosis or emergency service” visible above fold |
| Evaluate | Decide whether to trust it | Features, security/privacy, limitations, role benefits | No unsupported clinical-accuracy claims |
| Learn safety | Know when not to use it | Prominent safety section and product-safety page | Emergency guidance not hidden in FAQ |
| Register | Create a secure account | Short form, password guidance, consent links | Versioned consent; generic existing-email handling |
| Verify | Activate account | Focused verification status/resend | Token expiry explained without account disclosure |
| Begin | Choose next action | Onboarding card: start assessment, review safety, complete profile | Optional profile data remains optional unless model-required |

Success: the patient understands the product's authority boundary, verifies an account, and reaches an actionable dashboard.

### 13.2 Journey B — Patient completes a routine prediction

```text
Dashboard
  -> Start assessment
  -> Read concise safety context
  -> Select symptoms
  -> Add intensity and duration
  -> Add model-required context
  -> Review complete input
  -> Accept informed-use statement
  -> Submit
  -> Receive deterministic result
  -> Read explanation / export / grant doctor access
```

| Step | UX requirement |
|---|---|
| Start | Explain estimated task and required information without claiming outcome |
| Select | Search/group symptoms; show selected count; prevent duplicates |
| Describe | Use verbal intensity anchors and explicit duration units |
| Context | Ask only active-model-required fields and explain why sensitive data is needed |
| Review | Show a complete editable summary in the same terminology as entered |
| Submit | Prevent duplicate submission; keep stable progress; recover durable status |
| Result | Show emergency first, then confidence and ranked candidates |
| Understand | Explain evidence, tests, specialist, limitations, model version |
| Next action | Offer PDF, history, grounded chat, and doctor-access controls |

Routine success message avoids “good news” or “you are safe.” It confirms that the assessment was processed and reminds the user to seek professional interpretation.

Failure recovery:

- Validation failure: return to the affected step and preserve valid data.
- Network interruption: retain local form state and resolve existing submission by idempotency/status.
- Model unavailable: show no candidate list, preserve emergency guidance, explain retry/alternative care.
- Explanation unavailable: keep the complete prediction visible and offer a later retry.

### 13.3 Journey C — Patient triggers an emergency rule

```text
Assessment submit
  -> Deterministic red-flag match
  -> Immediate emergency alert
  -> Approved regional action
  -> Acknowledgement
  -> Optional result context remains secondary
```

Requirements:

- Emergency content replaces routine success framing.
- The first actionable control is the approved regional emergency action.
- The system does not wait for the LLM or report generation.
- The interface does not diagnose the emergency condition.
- Closing/acknowledging does not make the warning disappear from the result.
- Browser back or navigation away does not suppress the stored emergency state.
- Any animation is removed.
- The result page remains printable/accessibly exportable with the emergency guidance.

### 13.4 Journey D — Patient reviews history and exports

| Stage | Interface |
|---|---|
| Find | Search/filter by date, candidate, confidence, emergency, and review status where approved |
| Scan | Table on desktop; labeled cards on mobile |
| Inspect | Immutable result detail with timestamp/model/rule versions |
| Compare | Trends clearly labeled as prediction activity, not health progression |
| Export | Choose report, review included information, request generation |
| Complete | Durable status and private time-limited download |

Archiving is visually separated from deletion. The UI explains that archival removes the item from the default view but does not alter the historical record.

### 13.5 Journey E — Patient uses grounded AI chat

```text
Open AI Chat
  -> Choose general education or a permitted prediction
  -> See grounding badge and safety limits
  -> Ask a question
  -> Stream response
  -> Review grounding references
  -> Ask follow-up / stop / retry / delete conversation
```

Requirements:

- The grounding scope remains visible in the header.
- Suggested prompts are educational and never request diagnosis or dosage.
- User can stop generation.
- Streaming does not cause layout jump or inaccessible announcement spam.
- Emergency language interrupts the routine flow with an emergency alert.
- Refusal explains the boundary and offers a safe next step.
- Provider failure leaves the user's message and permits retry.

### 13.6 Journey F — Patient grants doctor access

| Stage | Interface response |
|---|---|
| Understand | Explain what the doctor will see and what remains private |
| Select doctor | Verified doctor identity within privacy-safe search/invitation |
| Set scope | Plain-language resources and permissions |
| Set expiry | Required date/duration with maximum policy |
| Review | Doctor, scope, start, expiry, revocation effect |
| Confirm | Create invitation/grant and show status |
| Manage | Active/pending/expired/revoked list |
| Revoke | Consequence dialog and immediate future-access confirmation |

The UI must not imply revocation deletes already signed clinical notes or audit records.

### 13.7 Journey G — Doctor reviews and signs

```text
Doctor Dashboard
  -> Red-flag/review queue
  -> Open patient with active grant
  -> Confirm scope and expiry
  -> Review immutable assessment and result
  -> Select review disposition
  -> Write clinical note
  -> Review final note
  -> Sign confirmation
  -> Immutable signed record
  -> Append correction if later required
```

Requirements:

- Grant banner remains visible in patient context.
- Emergency and low-confidence states are prominent.
- Prediction and doctor interpretation are visually distinct.
- Signing dialog states that the note cannot be overwritten.
- The signed state includes author, timestamp, revision, and audit confirmation.
- Correction begins from the prior note but creates a new visible revision.
- Grant expiry during editing preserves unsent local text only according to privacy policy, denies signing, and explains renewal.

### 13.8 Journey H — Administrator manages clinical catalog

| Stage | Interface response |
|---|---|
| Locate | Entity tabs, search, status, effective-version filters |
| Inspect | Detail drawer with source, reviewer, mappings, usage |
| Edit | Validated sheet with current optimistic version |
| Review | Before/after summary, affected mappings, required reason |
| Conflict | Show newer version and allow safe comparison; never overwrite silently |
| Activate/retire | High-risk confirmation where applicable |
| Confirm | Visible new version and audit event |

Physical delete is not offered for content referenced by history. “Retire” and “create new version” are the primary concepts.

### 13.9 Journey I — Administrator validates data and promotes a model

```text
Datasets
  -> Review upload requirements
  -> Upload to quarantine
  -> Validation progress
  -> Validation report
  -> Start training from valid version
  -> Monitor job stages
  -> Review candidate metrics and gates
  -> Compare with active model
  -> Independent approval
  -> Step-up authentication
  -> Activation review and reason
  -> Verified active model
  -> Monitor / roll back if required
```

UX safeguards:

- Upload success is not labeled “validated.”
- Training success is not labeled “approved.”
- Approval is not labeled “active.”
- Failed gates are visible beside the metric and block promotion.
- Aggregate, per-class, subgroup, calibration, latency, and OOD panels have plain-language definitions.
- The active environment and active model remain visible throughout activation.
- Activation confirmation names candidate version, replaced version, environment, reason, and rollback availability.
- Rollback uses the same review rigor and never appears as an ordinary toggle.

### 13.10 Journey J — User manages privacy and sessions

| Task | UX requirements |
|---|---|
| Review sessions | Identify current session, device/browser, approximate location/activity |
| Revoke session | Confirm target; current-session logout redirects safely |
| View consent | Show document type, version, decision, date, withdrawal effect |
| Request export | Explain included data, processing time, expiry, and secure delivery |
| Request deletion | Explain immediate session revocation, retention exceptions, and irreversible effects |
| Track request | Show pending, processing, completed, partially retained, or failed state |

Privacy operations use calm, explicit language. They do not use dark patterns, hidden opt-outs, or ambiguous “deactivate” terminology.

## 14. Screen Inventory and Page Requirements

### 14.1 Public and authentication

| Screen | Required regions |
|---|---|
| Landing | Header, hero, safety disclosure, features, workflow, privacy/security, role benefits, FAQ, CTA, footer |
| Product safety | Scope, limitations, emergency guidance, supported population, AI/ML authority |
| Privacy | Data categories, purposes, providers, rights, retention, contact |
| Terms | Version, effective date, use conditions, disclaimers |
| Login | Credentials, recovery, registration, safety note |
| Register | Account fields, consent, password guidance |
| Email verification | Status, expiry, resend, sign-in path |
| MFA challenge | Factor input, recovery option, expiry |
| Password recovery/reset | Non-disclosing status, token state, password requirements |

### 14.2 Patient

| Screen | Required regions |
|---|---|
| Dashboard | Alerts, metrics, trends, reports, recent predictions |
| Prediction wizard | Safety, progress, assessment, context, review, informed use |
| Prediction detail | Emergency, confidence, candidates, evidence, tests, specialist, explanation, model transparency, report |
| History | Filters, summary, responsive records, pagination |
| Chat index | Explanation of scope, conversations, start action |
| Chat conversation | Grounding, messages, references, composer, safety |
| Doctor access | Grant education, create form, active/pending/history |
| Profile | Identity and optional clinical profile |
| Settings | Appearance, notifications, security, sessions, MFA, consent, export, deletion |
| Notifications | Read/unread, type, safe action, time |

### 14.3 Doctor

| Screen | Required regions |
|---|---|
| Doctor dashboard | Red-flag queue, review queue, summary, expiring grants |
| Patients | Granted-patient search, scope/status filters, responsive records |
| Patient detail | Grant context, shared profile, prediction timeline, clinical view, review, notes |
| Reports | Authorized report requests/status/history |

### 14.4 Administrator

| Screen | Required regions |
|---|---|
| Overview | Environment, operations, model, dataset, security, usage |
| Users | Filters, table/cards, detail, status/role actions |
| Clinical catalog | Entity tabs, records, editor, mappings, versions |
| Emergency rules | Rules, sources, version, review, activation state |
| Datasets | Upload requirements, quarantine/validation status, report |
| Training jobs | Start dialog, stage/progress, safe logs, metrics/failure |
| Model registry | Active model, candidate comparison, evaluation, approval, activation, rollback |
| Analytics | Privacy-aware usage and model/OOD trends |
| Audit | Filters, event table, detail, correlation IDs |

## 15. Design Quality and Handoff

### 15.1 Required design artifacts before implementation

- Light and dark token tables
- Responsive layouts for every screen inventory item
- Component specifications with all interaction states
- Patient prediction prototype including emergency and failure flows
- Doctor note signing/revision prototype
- Admin model activation/rollback prototype
- Keyboard and focus-order annotations
- Screen-reader/live-region annotations
- Content copy approved for safety-critical states
- Chart definitions with accessible alternatives
- Empty/loading/error/permission/service-unavailable variants

These artifacts belong under:

`D:\React JS\Ai ML project\my-project\docs\frontend`

Design tokens belong under:

`D:\React JS\Ai ML project\my-project\packages\design-tokens`

Component implementation and usage documentation will belong under:

`D:\React JS\Ai ML project\my-project\frontend\src\components`

No artifact file is created until it contains approved, real content.

### 15.2 Design review checklist

- Does the page make the primary task obvious?
- Is emergency/safety content higher than routine results?
- Are prediction, confidence, severity, and diagnosis clearly distinct?
- Are all states specified, including partial and dependency failure?
- Is the mobile version a usable reflow rather than a compressed desktop layout?
- Can the journey be completed by keyboard and at 400% zoom?
- Do contrast, focus, labels, errors, and announcements meet the accessibility target?
- Does dark mode preserve meaning and hierarchy?
- Does motion clarify rather than decorate?
- Are doctor grant scope and admin environment/model status visible?
- Does every destructive/high-risk action provide review and consequence?
- Does AI-generated content show grounding and limitations?
- Are sensitive details absent from notifications, titles, and telemetry?

### 15.3 UX validation

Before release:

- Moderated usability testing with representative patient, doctor, and administrator participants
- Clinical-safety copy review
- Cognitive walkthrough of emergency, low-confidence, and failure states
- Mobile testing at 320, 375, 390, 430, and 768 CSS px
- Desktop testing at 1024, 1280, 1440, and 1920 CSS px
- Keyboard-only and screen-reader testing
- Light, dark, forced-colors, and reduced-motion testing
- Color-vision-deficiency simulation
- Realistic long names, translations-ready expansion, large values, and empty data
- Slow network, offline interruption, LLM outage, model outage, and worker backlog
- Accessible PDF review

### 15.4 Design governance

- Primitive and semantic token changes require design-system review.
- Clinical color/label changes require accessibility and clinical-safety review.
- A new shared component requires demonstrated reuse and documented states.
- Feature teams own feature components and contribute improvements through shared-component review.
- Component changes include visual, keyboard, screen-reader, responsive, and reduced-motion regression checks.
- No UI may claim a backend permission or state that the server has not confirmed.

## 16. Approval Gate

Approval confirms:

- Experience principles and premium medical visual direction
- Typography, color, spacing, radius, elevation, and theme foundations
- Lucide-based icon system and accessibility rules
- Primitive, shared, clinical, and feature component hierarchy
- Responsive and mobile behavior
- Role-based navigation information architecture
- Patient, doctor, and admin dashboard layouts
- WCAG 2.2 AA target and testing requirements
- Motion duration, behavior, and reduced-motion policy
- Primary patient, doctor, admin, privacy, and AI journeys
- Screen inventory, design artifacts, and governance

Approval authorizes the next explicitly requested phase only. It does not authorize UI implementation, package installation, asset generation, or modification of existing application code.
