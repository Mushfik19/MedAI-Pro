# 7. Machine Learning Pipeline

## 7.1 Responsibility boundary

The supervised ML model produces ranked disease probabilities. A deterministic clinical rule engine produces emergency escalation. Versioned clinical mappings supply severity, lab tests, and specialist recommendations. The LLM explains the structured output and powers grounded chat; it cannot alter predictions or mappings.

```text
Validated assessment
    → emergency pre-check
    → active feature schema
    → deterministic preprocessing
    → calibrated classifier
    → top-5 ranking
    → confidence and OOD checks
    → clinical catalog enrichment
    → emergency post-check
    → immutable persistence
    → grounded LLM explanation (asynchronous)
```

## 7.2 Dataset contract

Every uploaded dataset declares:

- Schema version, source/provenance, license, intended population, collection period, and de-identification statement
- One target disease code per training row
- Symptom features mapped to canonical symptom codes
- Allowed contextual features with units and nullability
- Inclusion/exclusion criteria
- Known limitations and subgroup coverage
- SHA-256 checksum and immutable storage key

Validation rejects unknown labels, duplicate identifiers, invalid units, impossible values, target leakage, unapproved free text, or missing required provenance. Validation reports class balance, missingness, duplicate rate, feature distributions, label coverage, and subgroup coverage.

Real patient data is not accepted into a development dataset pipeline without separate governance approval.

## 7.3 Preprocessing

- Canonicalize symptom codes through approved mappings.
- Encode symptom presence, intensity, and duration according to a versioned feature schema.
- Use explicit missing indicators where missingness is meaningful; never silently treat unknown as absent.
- Apply fitted imputers/encoders inside a scikit-learn `Pipeline`/`ColumnTransformer` to prevent train-serving skew.
- Persist ordered feature names, units, accepted ranges, and preprocessing objects with the model bundle.
- Fit transformations on training folds only.

The inference service refuses an assessment that does not match the active feature schema instead of guessing a column order.

## 7.4 Training and selection

Candidate families:

- Multinomial logistic regression as the interpretable baseline
- Random forest or histogram gradient boosting as nonlinear baselines
- XGBoost multiclass classifier as the primary high-capacity candidate

Training uses stratified train/validation/test partitions, grouping by patient/source identifier when available to prevent leakage. Hyperparameter search runs only on training/validation folds. Random seeds, package versions, Git commit, parameters, and dataset checksum are persisted.

The winner is selected by predeclared gates, not accuracy alone:

- Macro F1 and balanced accuracy for class imbalance
- Top-1, top-3, and top-5 accuracy
- Multiclass log loss
- Per-class sensitivity/recall and precision
- Expected calibration error and multiclass Brier score
- Subgroup performance by supported age band and sex-at-birth, with minimum sample-size warnings
- Inference latency, artifact size, and failure behavior

Thresholds are defined before model promotion. A candidate that improves aggregate accuracy but violates safety, calibration, or subgroup gates is rejected.

## 7.5 Calibration and confidence

Probability calibration uses held-out data through temperature scaling, isotonic regression, or Platt-style calibration selected by validation performance. The calibrator is bundled with preprocessing and classifier.

Displayed confidence combines declared, versioned signals:

- Top probability after calibration
- Margin between the first and second candidate
- Input completeness
- Out-of-distribution (OOD) distance or feature-range violations
- Calibration quality of the serving model

The band (`LOW`, `MEDIUM`, `HIGH`) is a presentation summary, not a new probability. Low-confidence/OOD results explicitly recommend clinician review and may suppress overly specific explanatory language.

## 7.6 Inference bundle

An immutable model bundle contains:

- Fitted preprocessing pipeline
- Fitted classifier and calibrator
- Ordered feature schema and label mapping
- Model semantic version
- Training dataset checksum and code version
- Metrics and calibration report
- Supported population metadata
- Artifact SHA-256 checksum

Joblib is used only for artifacts produced by the trusted internal training pipeline. The service verifies checksum and metadata before loading because untrusted Joblib files can execute code. Dataset uploads can never be loaded as model artifacts.

The service loads and warms the active model during startup/readiness. Promotion updates the active database pointer transactionally, then instances load and verify the new bundle. If loading fails, readiness fails for that version and traffic continues on or rolls back to the last verified model.

## 7.7 Prediction algorithm

1. Validate assessment and informed-use acknowledgement.
2. Evaluate active emergency rules against raw validated inputs.
3. Transform inputs using the bundle's exact preprocessing pipeline.
4. Evaluate OOD and schema checks.
5. Run `predict_proba`.
6. Apply the bundled calibrator.
7. Stable-sort by probability and select up to five unique disease labels.
8. Calculate confidence score/band from the approved confidence policy.
9. Enrich each label from versioned disease, severity, lab-test, and specialty mappings.
10. Evaluate post-inference emergency rules that depend on disease/severity combinations.
11. Persist inputs, results, mappings, and versions in one transaction.
12. Publish an outbox event for the optional explanation.

If inference cannot complete, no fabricated result is returned. Emergency pre-check output remains available independently.

## 7.8 Explainability

Model evidence uses model-appropriate methods:

- Linear coefficients for the logistic baseline
- SHAP values or validated feature contributions for tree models

Only user-understandable symptom contributions are exposed. The UI distinguishes “supports this candidate” from causation. Raw feature attributions are filtered through clinical terminology and do not expose internal hidden features.

The LLM prompt receives:

- Structured top-five result
- Curated disease summaries
- Supporting/missing evidence
- Versioned tests and specialist mappings
- Emergency state and mandatory safety language

The prompt forbids changing values, adding diagnoses/tests, prescribing, or claiming certainty. Output is schema-validated, safety-checked, provenance-stored, and discarded on validation failure.

## 7.9 Training-job state machine

```text
QUEUED → VALIDATING → PREPROCESSING → TRAINING → EVALUATING
       → SUCCEEDED → CANDIDATE → APPROVED → ACTIVE → RETIRED
       ↘ FAILED                    ↘ REJECTED
       ↘ CANCELLED
```

Training runs outside the web request process. For the Railway deployment, a separate worker service executes jobs and emits progress to PostgreSQL/outbox records. Model promotion is never automatic.

## 7.10 Monitoring and drift

Operational monitoring:

- Request count, error rate, inference latency, memory, artifact-load failures
- Prediction class distribution, top probability, confidence bands, missingness, and OOD rate
- LLM explanation latency/failure without logging raw sensitive prompts

Quality monitoring:

- Feature distribution drift using PSI/KS or categorical divergence
- Prediction distribution drift
- Calibration and performance when clinician-confirmed outcomes become available
- Subgroup metrics with minimum sample thresholds

Alerts trigger investigation, not automatic retraining/promotion. Severe drift can retire a model and place prediction into a safe unavailable state while emergency rules remain operational.

## 7.11 Tests and promotion gates

- Unit tests for feature ordering, missingness, rule precedence, ranking, and confidence boundaries
- Golden-vector tests: identical inputs and bundle produce identical ranked outputs within a numeric tolerance
- Artifact checksum and incompatible-version tests
- Data leakage and schema validation tests
- Offline metrics and subgroup gate tests
- API contract and concurrency tests during atomic promotion
- Load tests against the Railway target size
- Rollback drill before production release

Promotion requires valid dataset governance, all gates passed, artifact verification, independent admin review, reason, timestamp, and audit record.

## 7.12 Design rationale

Bundling preprocessing, calibration, schemas, and classifier prevents training-serving drift. Explicit evaluation gates address class imbalance and calibration, which raw accuracy hides. Keeping emergency logic outside the statistical model provides a reviewable safety layer that still works when inference or the LLM is unavailable.
