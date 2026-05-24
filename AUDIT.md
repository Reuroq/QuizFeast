# QuizFeast Site Audit Report

- **Base URL:** https://quizfeast.onrender.com
- **Run:** 2026-05-23T23:56:50.916Z → 2026-05-23T23:59:09.793Z (138.9s)
- **Issues open:** 52 (0 previously fixed)

## Severity breakdown

- critical: 0
- high: 6
- medium: 6
- low: 40

## By agent

- set-id: 1
- lighthouse: 2
- mobile: 38
- cross-browser: 3
- load: 2
- launch: 6

## Set-identification accuracy

- Tested: **8** slug samples
- Correct top match: **7** (0.875 accuracy)
- Wrong slug returned: **1**
- No match returned: **0**

## Open issues

### [HIGH] cls-high — lighthouse
- URL: https://quizfeast.onrender.com/cbt/accident_avoidance
- CLS is 0.370 on cbt-slug page (Google CWV "good" is <0.1)

### [HIGH] webkit-pageerror — cross-browser
- URL: https://quizfeast.onrender.com/study
- webkit (study): pageerror — /quizfeast.onrender.com/api/cbt/correct?slug=navy-cyber-awareness-challenge-2023 due to access control checks.

### [HIGH] webkit-console.error — cross-browser
- URL: https://quizfeast.onrender.com/terms
- webkit (legal): console.error — ChunkLoadError: Loading chunk 768 failed.
(error: https://quizfeast.onrender.com/_next/static/chunks/app/study/page-39fe1d27f57dfb19.js)

### [HIGH] webkit-pageerror — cross-browser
- URL: https://quizfeast.onrender.com/terms
- webkit (legal): pageerror — Minified React error #423; visit https://react.dev/errors/423 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.

### [HIGH] slow-under-load — load
- URL: https://quizfeast.onrender.com/answers
- answers-index: p95 8243ms exceeds threshold 2000ms under 20 concurrent requests (p50=7658, p99=8243, max=8243)
- _Fix:_ Profile slow path. Add caching headers, increase Render plan, or reduce server work per request.
- _Evidence:_ `{"name":"answers-index","url":"https://quizfeast.onrender.com/answers","concurrent":20,"wall_ms":8245,"success_count":20,"error_count":0,"p50":7658,"p95":8243,"p99":8243,"max":8243,"threshold":2000}`

### [HIGH] slow-under-load — load
- URL: https://quizfeast.onrender.com/answers/army-cyber-awareness-challenge-2023
- answers-slug: p95 4805ms exceeds threshold 2000ms under 15 concurrent requests (p50=4720, p99=4805, max=4805)
- _Fix:_ Profile slow path. Add caching headers, increase Render plan, or reduce server work per request.
- _Evidence:_ `{"name":"answers-slug","url":"https://quizfeast.onrender.com/answers/army-cyber-awareness-challenge-2023","concurrent":15,"wall_ms":4806,"success_count":15,"error_count":0,"p50":4720,"p95":4805,"p99":4805,"max":4805,"threshold":2000}`

### [MEDIUM] lcp-slow — lighthouse
- URL: https://quizfeast.onrender.com/answers
- LCP is 3247ms on answers-index page (Google CWV "good" is <2500ms)

### [MEDIUM] no-branded-domain — launch
- URL: https://quizfeast.onrender.com
- Site is on the default hosting domain (quizfeast.onrender.com). Branded domain recommended before public launch.
- _Fix:_ Register a domain + point at Render via custom-domain settings

### [MEDIUM] no-analytics — launch
- URL: https://quizfeast.onrender.com/
- No analytics provider detected in home-page HTML (GA, Plausible, Umami, PostHog, etc.)
- _Fix:_ Wire Plausible or GA4 before launch so you can measure traffic + funnel

### [MEDIUM] missing-social-meta — launch
- URL: https://quizfeast.onrender.com/
- / missing social meta tags: title, desc, image, twitter. Link previews on social/messaging will look broken.
- _Fix:_ Add openGraph + twitter metadata to page metadata export

### [MEDIUM] missing-social-meta — launch
- URL: https://quizfeast.onrender.com/answers
- /answers missing social meta tags: title, desc, image, twitter. Link previews on social/messaging will look broken.
- _Fix:_ Add openGraph + twitter metadata to page metadata export

### [MEDIUM] missing-social-meta — launch
- URL: https://quizfeast.onrender.com/study
- /study missing social meta tags: title, desc, image, twitter. Link previews on social/messaging will look broken.
- _Fix:_ Add openGraph + twitter metadata to page metadata export

### [LOW] wrong-top-slug — set-id
- URL: https://quizfeast.onrender.com/answers/blood-chit-sere
- Sample from blood-chit-sere matched army-sere-100-2 as top but blood-chit-sere is in alternates (high, deterministic)
- _Evidence:_ `Source: blood-chit-sere (cbt_annual) Matched: army-sere-100-2 Q1: Continuously learning about your captivity environment and the captor is known a Q2: Upon your release, a DoD Public Affairs Officer (PAO) will be available to help `

### [LOW] tap-target-small — mobile
- URL: https://quizfeast.onrender.com/
- <a> "AI Study" is 51×20px — below 32×32 minimum for mobile tap targets

### [LOW] tap-target-small — mobile
- URL: https://quizfeast.onrender.com/
- <a> "Answer Keys" is 77×20px — below 32×32 minimum for mobile tap targets

### [LOW] tap-target-small — mobile
- URL: https://quizfeast.onrender.com/
- <a> "Search" is 41×20px — below 32×32 minimum for mobile tap targets

### [LOW] tap-target-small — mobile
- URL: https://quizfeast.onrender.com/
- <a> "Disclaimer" is 64×20px — below 32×32 minimum for mobile tap targets

### [LOW] tap-target-small — mobile
- URL: https://quizfeast.onrender.com/
- <a> "Terms" is 36×20px — below 32×32 minimum for mobile tap targets

### [LOW] tap-target-small — mobile
- URL: https://quizfeast.onrender.com/answers
- <button> "All categories" is 96×26px — below 32×32 minimum for mobile tap targets

### [LOW] tap-target-small — mobile
- URL: https://quizfeast.onrender.com/answers
- <button> "DoD Annual Training · 239" is 165×26px — below 32×32 minimum for mobile tap targets

### [LOW] tap-target-small — mobile
- URL: https://quizfeast.onrender.com/answers
- <button> "Security & Intelligence · 68" is 167×26px — below 32×32 minimum for mobile tap targets

### [LOW] tap-target-small — mobile
- URL: https://quizfeast.onrender.com/answers
- <button> "Joint Training · 35" is 118×26px — below 32×32 minimum for mobile tap targets

### [LOW] tap-target-small — mobile
- URL: https://quizfeast.onrender.com/answers
- <button> "Health & Safety · 320" is 136×26px — below 32×32 minimum for mobile tap targets

### [LOW] tap-target-small — mobile
- URL: https://quizfeast.onrender.com/study
- <a> "AI Study" is 51×20px — below 32×32 minimum for mobile tap targets

### [LOW] tap-target-small — mobile
- URL: https://quizfeast.onrender.com/study
- <a> "Answer Keys" is 77×20px — below 32×32 minimum for mobile tap targets

### [LOW] tap-target-small — mobile
- URL: https://quizfeast.onrender.com/study
- <a> "Search" is 41×20px — below 32×32 minimum for mobile tap targets

### [LOW] tap-target-small — mobile
- URL: https://quizfeast.onrender.com/study
- <a> "Disclaimer" is 64×20px — below 32×32 minimum for mobile tap targets

### [LOW] tap-target-small — mobile
- URL: https://quizfeast.onrender.com/study
- <a> "Terms" is 36×20px — below 32×32 minimum for mobile tap targets

### [LOW] tap-target-small — mobile
- URL: https://quizfeast.onrender.com/disclaimer
- <a> "AI Study" is 51×20px — below 32×32 minimum for mobile tap targets

### [LOW] tap-target-small — mobile
- URL: https://quizfeast.onrender.com/disclaimer
- <a> "Answer Keys" is 77×20px — below 32×32 minimum for mobile tap targets

### [LOW] tap-target-small — mobile
- URL: https://quizfeast.onrender.com/disclaimer
- <a> "Search" is 41×20px — below 32×32 minimum for mobile tap targets

### [LOW] tap-target-small — mobile
- URL: https://quizfeast.onrender.com/disclaimer
- <a> "Disclaimer" is 64×20px — below 32×32 minimum for mobile tap targets

### [LOW] tap-target-small — mobile
- URL: https://quizfeast.onrender.com/disclaimer
- <a> "Terms" is 36×20px — below 32×32 minimum for mobile tap targets

### [LOW] tap-target-small — mobile
- URL: https://quizfeast.onrender.com/cbt/accident_avoidance
- <a> "AI Study" is 51×20px — below 32×32 minimum for mobile tap targets

### [LOW] tap-target-small — mobile
- URL: https://quizfeast.onrender.com/cbt/accident_avoidance
- <a> "Answer Keys" is 77×20px — below 32×32 minimum for mobile tap targets

### [LOW] tap-target-small — mobile
- URL: https://quizfeast.onrender.com/cbt/accident_avoidance
- <a> "Search" is 41×20px — below 32×32 minimum for mobile tap targets

### [LOW] tap-target-small — mobile
- URL: https://quizfeast.onrender.com/cbt/accident_avoidance
- <a> "Disclaimer" is 64×20px — below 32×32 minimum for mobile tap targets

### [LOW] tap-target-small — mobile
- URL: https://quizfeast.onrender.com/cbt/accident_avoidance
- <a> "Terms" is 36×20px — below 32×32 minimum for mobile tap targets

### [LOW] tap-target-small — mobile
- URL: https://quizfeast.onrender.com/answers/0231-usmc
- <a> "← All answer keys" is 110×19px — below 32×32 minimum for mobile tap targets

### [LOW] tap-target-small — mobile
- URL: https://quizfeast.onrender.com/answers/0231-usmc
- <a> "Details" is 36×16px — below 32×32 minimum for mobile tap targets

### [LOW] tap-target-small — mobile
- URL: https://quizfeast.onrender.com/answers/0231-usmc
- <button> "Wrong answer? Report it →" is 145×16px — below 32×32 minimum for mobile tap targets

### [LOW] tap-target-small — mobile
- URL: https://quizfeast.onrender.com/answers/topic/classified-data
- <a> "← All answer keys" is 110×19px — below 32×32 minimum for mobile tap targets

### [LOW] tap-target-small — mobile
- URL: https://quizfeast.onrender.com/answers/topic/classified-data
- <a> "Details" is 36×16px — below 32×32 minimum for mobile tap targets

### [LOW] tap-target-small — mobile
- URL: https://quizfeast.onrender.com/answers/topic/classified-data
- <a> "Army Cyber Awareness Challenge 2023 →" is 308×20px — below 32×32 minimum for mobile tap targets

### [LOW] tap-target-small — mobile
- URL: https://quizfeast.onrender.com/answers/topic/classified-data
- <a> "Navy Cyber Awareness Challenge 2023 →" is 308×20px — below 32×32 minimum for mobile tap targets

### [LOW] tap-target-small — mobile
- URL: https://quizfeast.onrender.com/answers/topic/classified-data
- <a> "Compressed Url Cyber Awareness →" is 308×20px — below 32×32 minimum for mobile tap targets

### [LOW] tap-target-small — mobile
- URL: https://quizfeast.onrender.com/answers/q/01-which-of-the-following-disaster-recovery-sites-would-require-the-mo
- <a> "← All answer keys" is 110×19px — below 32×32 minimum for mobile tap targets

### [LOW] tap-target-small — mobile
- URL: https://quizfeast.onrender.com/answers/q/01-which-of-the-following-disaster-recovery-sites-would-require-the-mo
- <a> "Details" is 36×16px — below 32×32 minimum for mobile tap targets

### [LOW] tap-target-small — mobile
- URL: https://quizfeast.onrender.com/answers/q/01-which-of-the-following-disaster-recovery-sites-would-require-the-mo
- <a> "B.4 Comptia Security+ Sy0 601 Certificat" is 308×20px — below 32×32 minimum for mobile tap targets

### [LOW] tap-target-small — mobile
- URL: https://quizfeast.onrender.com/answers/q/01-which-of-the-following-disaster-recovery-sites-would-require-the-mo
- <a> "Comptia Security+ Exam Answers →" is 308×20px — below 32×32 minimum for mobile tap targets

### [LOW] tap-target-small — mobile
- URL: https://quizfeast.onrender.com/answers/q/01-which-of-the-following-disaster-recovery-sites-would-require-the-mo
- <a> "Comptia Security+ Sy0 601 Exam Questions" is 308×20px — below 32×32 minimum for mobile tap targets

### [LOW] missing-favicon — launch
- URL: https://quizfeast.onrender.com/
- No favicon link in home-page HTML
- _Fix:_ Add /app/icon.png or /public/favicon.ico
