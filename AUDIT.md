# QuizFeast Site Audit Report

- **Base URL:** https://quizfeast.onrender.com
- **Run:** 2026-05-23T06:29:58.548Z → 2026-05-23T06:30:41.339Z (42.8s)
- **Issues open:** 15 (0 previously fixed)

## Severity breakdown

- critical: 0
- high: 0
- medium: 9
- low: 6

## By agent

- set-id: 6
- a11y: 9

## Set-identification accuracy

- Tested: **11** slug samples
- Correct top match: **5** (0.455 accuracy)
- Wrong slug returned: **6**
- No match returned: **0**

## Open issues

### [MEDIUM] wrong-no-alternates — set-id
- URL: https://quizfeast.onrender.com/answers/comptia-practice-test-1101
- Sample from comptia-practice-test-1101 matched UNRELATED slug comptia-a-1101-practice-exam (high, deterministic, score=4)
- _Evidence:_ `Source: comptia-practice-test-1101 (cert_it) Matched: comptia-a-1101-practice-exam Q1: What is the most common memory module form factor type used in laptops?  ECC RAM Q2: Which of the answers listed below describe the features of Solid-Sta`

### [MEDIUM] color-contrast — a11y
- URL: https://quizfeast.onrender.com/
- Elements must meet minimum color contrast ratio thresholds (67 elements on root page)
- _Fix:_ Read axe rule color-contrast — typically applies to the shared component for root
- _Evidence:_ `<p class="text-dark-500 text-sm">Mandatory training every service member completes yearly</p>`

### [MEDIUM] color-contrast — a11y
- URL: https://quizfeast.onrender.com/answers
- Elements must meet minimum color contrast ratio thresholds (1350 elements on answers-index page)
- _Fix:_ Read axe rule color-contrast — typically applies to the shared component for answers-index
- _Evidence:_ `<span class="text-xs opacity-70">beta</span>`

### [MEDIUM] color-contrast — a11y
- URL: https://quizfeast.onrender.com/study
- Elements must meet minimum color contrast ratio thresholds (10 elements on feature page)
- _Fix:_ Read axe rule color-contrast — typically applies to the shared component for feature
- _Evidence:_ `<div class="text-xs text-dark-500">Separate questions with a blank line or numbered list.</div>`

### [MEDIUM] color-contrast — a11y
- URL: https://quizfeast.onrender.com/disclaimer
- Elements must meet minimum color contrast ratio thresholds (10 elements on legal page)
- _Fix:_ Read axe rule color-contrast — typically applies to the shared component for legal
- _Evidence:_ `<p class="text-dark-500 text-sm mb-8">Effective May 20, 2026 · Nightshift Labs LLC</p>`

### [MEDIUM] color-contrast — a11y
- URL: https://quizfeast.onrender.com/cbt/accident_avoidance
- Elements must meet minimum color contrast ratio thresholds (45 elements on cbt-slug page)
- _Fix:_ Read axe rule color-contrast — typically applies to the shared component for cbt-slug
- _Evidence:_ `<span class="text-dark-500 text-sm whitespace-nowrap hidden sm:block">35 of 35</span>`

### [MEDIUM] color-contrast — a11y
- URL: https://quizfeast.onrender.com/answers/0231-usmc
- Elements must meet minimum color contrast ratio thresholds (53 elements on answers-slug page)
- _Fix:_ Read axe rule color-contrast — typically applies to the shared component for answers-slug
- _Evidence:_ `<span class="text-dark-500 text-xs font-semibold">QUESTION <!-- -->1</span>`

### [MEDIUM] color-contrast — a11y
- URL: https://quizfeast.onrender.com/answers/topic/classified-data
- Elements must meet minimum color contrast ratio thresholds (27 elements on answers-topic page)
- _Fix:_ Read axe rule color-contrast — typically applies to the shared component for answers-topic
- _Evidence:_ `<span class="text-dark-500 text-xs font-semibold">QUESTION <!-- -->1</span>`

### [MEDIUM] color-contrast — a11y
- URL: https://quizfeast.onrender.com/answers/q/01-which-of-the-following-disaster-recovery-sites-would-require-the-mo
- Elements must meet minimum color contrast ratio thresholds (9 elements on answers-canonical page)
- _Fix:_ Read axe rule color-contrast — typically applies to the shared component for answers-canonical
- _Evidence:_ `<div class="text-xs text-dark-500 leading-relaxed">`

### [LOW] wrong-top-slug — set-id
- URL: https://quizfeast.onrender.com/answers/3e3x1-air-force
- Sample from 3e3x1-air-force matched 3e3-afsc as top but 3e3x1-air-force is in alternates (medium, deterministic)
- _Evidence:_ `Source: 3e3x1-air-force (cbt_af) Matched: 3e3-afsc Q1: Who directs the EOC? Q2: When CE's UCC is activated, where do the DATs assemble?`

### [LOW] wrong-top-slug — set-id
- URL: https://quizfeast.onrender.com/answers/afi-41-106
- Sample from afi-41-106 matched afi-10-250 as top but afi-41-106 is in alternates (high, deterministic)
- _Evidence:_ `Source: afi-41-106 (cbt_af) Matched: afi-10-250 Q1: Air Force Operations Planning & Executions Q2: Medical Readiness Program Management`

### [LOW] wrong-top-slug — set-id
- URL: https://quizfeast.onrender.com/answers/aws-cloud-practitioner-certification-dumps
- Sample from aws-cloud-practitioner-certification-dumps matched aws-certified-cloud-practitioner-exam-dumps as top but aws-cloud-practitioner-certification-dumps is in alternates (high, deterministic)
- _Evidence:_ `Source: aws-cloud-practitioner-certification-dumps (cert_it) Matched: aws-certified-cloud-practitioner-exam-dumps Q1: 3.) Which of the following is a benefit of Amazon Elastic Compute Cloud (Amazon  Q2: 6.) A Company needs to know which use`

### [LOW] wrong-top-slug — set-id
- URL: https://quizfeast.onrender.com/answers/hazmat-test-california
- Sample from hazmat-test-california matched class-a-hazmat-test as top but hazmat-test-california is in alternates (high, deterministic)
- _Evidence:_ `Source: hazmat-test-california (cbt_health) Matched: class-a-hazmat-test Q1: 3. When applying for an original or renewed HazMat endorsement, you must undergo Q2: 6. How do you label a package if the hazardous materials label will not fit on`

### [LOW] wrong-top-slug — set-id
- URL: https://quizfeast.onrender.com/answers/the-hipaa-regulations-provide-a-federal-floor
- Sample from the-hipaa-regulations-provide-a-federal-floor matched an-authorization-is-required-for-which-of-the-following-hipaa as top but the-hipaa-regulations-provide-a-federal-floor is in alternates (high, deterministic)
- _Evidence:_ `Source: the-hipaa-regulations-provide-a-federal-floor (cbt_health) Matched: an-authorization-is-required-for-which-of-the-following-hipaa Q1: Authorization is required for which of the following? A. Minimum necessary discl Q2: What is a key`

### [LOW] heading-order — a11y
- URL: https://quizfeast.onrender.com/cbt/accident_avoidance
- Heading levels should only increase by one (1 elements on cbt-slug page)
- _Fix:_ Read axe rule heading-order — typically applies to the shared component for cbt-slug
- _Evidence:_ `<h3 class="text-lg font-bold text-white mb-2">Know questions we're missing?</h3>`
