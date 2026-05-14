# Raporti i testimit para-përfundimtar — MobileShop

---

## 1. Qëllimi dhe fushëveprimi

Ky dokument përmbledh testimin para-përfundimtar të sistemit MobileShop (backend Express, klient React, modul autentikimi në `/api/v1/auth`, produkte, porosi, etj.), sipas kërkesave për:

- rrugë kryesore funksionale (happy path),
- raste kufi (edge cases),
- validim inputesh dhe testim negativ,
- performancë dhe ngarkesë API,
- siguri (SQLi, XSS, CSRF, brute-force, skemë JWT/autorizim),
- rekomandime përmirësimi.

---

## 2. Përmbledhje ekzekutive

| Tregues | Vlera |
|--------|--------|
| Numri i rasteve të planifikuara | _n_ |
| Të ekzekutuara | _n_ |
| Kaluar | _n_ |
| Dështuar / bllokuar | _n_ |
| Niveli i përgjithshëm i gatishmërisë për prodhim | _I lartë / mesatar / i ulët_ |

**Konkluzion i shkurtër:** _1–3 fjali._

---

## 3. Inventari i mjeteve dhe testeve të automatizuara (në repo)

| Shtresa | Mjeti | Komanda (nga `mobile-shop/server` përveç ku tjetër) | Çfarë mbulon |
|--------|--------|------------------------------------------------------|--------------|
| Njësi / integrim (pa DB të plotë integruese) | Jest | `npm test` | Modele, middleware auth, rrugë produktesh, etj. |
| Integrim API | Jest | `npm run test:integration` (kërkon MySQL test; opsionale: `npm run test:integration:tc`) | Rrjedha auth/produkte/porosi sipas `api.integration.test.js` |
| API koleksion | Newman + Postman | `npm run test:newman` | `tests/postman/` |
| E2E UI | Cypress | `npm run test:e2e` (nga `client` sipas skripteve të klientit) | `client/cypress/e2e/` |
| Ngarkesë | Locust | `npm run test:performance` ose `test:performance:all` | `tests/performance/locustfile.py` |

**Shënim për grupin:** verifikoni që URL-të dhe metodat në Postman/Locust përputhen me OpenAPI (`/docs`) dhe me modulin e autentikimit (`POST /api/v1/auth/signup`, jo `/register`, nëse koleksionet janë të vjetra).

---

## 4. Matrica e rasteve të testimit

Shtoni një rresht për çdo rast; kolona **Rezultati** mund të jetë: Kaluar | Dështuar | Bllokuar | Nuk u ekzekutua.

### 4.1 Happy path (funksionaliteti kryesor)

| ID | Përshkrimi | Hapat kryesorë | Rezultati | Evidenca (log, screenshot, raport Jest) |
|----|------------|----------------|-----------|----------------------------------------|
| HP-01 | Regjistrim përdoruesi | `POST /api/v1/auth/signup` me të dhëna valide → mesazh krijimi / email aktivizimi | | |
| HP-02 | Hyrje | `POST /api/v1/auth/login` → JWT + refresh token | | |
| HP-03 | Lista produkteve | `GET /api/v1/products` | | |
| HP-04 | Detaj produkti | `GET /api/v1/products/:id` | | |
| HP-05 | Checkout / porosi | `POST /api/v1/orders/checkout` me token përdoruesi | | |
| HP-06 | Panel admin (nëse aplikohet) | Hyrje si admin → veprime të lejuara | | |

### 4.2 Edge cases

| ID | Përshkrimi | Pritshmëria | Rezultati |
|----|------------|-------------|-----------|
| EC-01 | ID produkti jo numerik / negativ | 400 ose 404 konsistent | |
| EC-02 | Sasia 0 ose negative në porosi | Refuzim me mesazh të qartë | |
| EC-03 | Stok i pamjaftueshëm | Trajtim gabimi pa korruptim të të dhënave | |
| EC-04 | Token JWT i skaduar | 401; rifreskim me refresh token nëse mbështetet | |
| EC-05 | Përdorues jo aktiv | 403 / mesazh i përshtatshëm | |

### 4.3 Validim inputesh dhe testim negativ

| ID | Përshkrimi | Hyrja | Kodi HTTP i pritur | Rezultati |
|----|------------|-------|---------------------|-----------|
| NV-01 | Login pa fjalëkalim | vetëm email | 400 | |
| NV-02 | Email i pavlefshëm | format i gabuar | 400 | |
| NV-03 | Regjistrim me email ekzistues | | 409 | |
| NV-04 | Krijim produkti pa të drejta | token përdoruesi jo-admin | 403 | |
| NV-05 | JSON i dëmtuar në `Content-Type: application/json` | trup jo-JSON | 400 | |
| NV-06 | Endpoint i panjohur | `GET /api/v1/...` | 404 | |

### 4.4 Performancë dhe ngarkesë (API)

| ID | Skenari | Mjeti | Metrika të raportuara | Rezultati / pragu |
|----|---------|-------|------------------------|-------------------|
| LD-01 | Lexim produktesh (shumë përdorues paralelë) | Locust | P95 latencë, kërkesa/s, % dështimesh | |
| LD-02 | Mix: produkte + kërkesa autentikimi | Locust | i njëjti | |
| LD-03 | Nën ngarkesë të lartë — gabime 429 | `apiLimiter` (120 req/min për `/api`) | Verifikoni që kufiri reagon | |

**Si të dokumentohet:** eksportoni nga Locust grafikun e përgjithshëm dhe tabelën e përqindjeve (p50, p95, p99).

### 4.5 Siguri

| ID | Kategoria | Veprimi i testit | Pritshmëria | Rezultati |
|----|-----------|------------------|-------------|-----------|
| SEC-01 | SQL Injection | Payload-e klasike në body/query (p.sh. `'; DROP TABLE users;--`) | Refuzim (400 nga middleware `sqlInjectionProtection` ose parametrizim në DB); **jo** ekzekutim SQL | |
| SEC-02 | XSS (ruajtje/reflektim) | string me `<script>` në fusha tekstuale | Sanitizim / encoding; nuk ekzekutohet script në shfletues | |
| SEC-03 | CSRF | Nëse auth është Bearer në header (SPA), rreziku është i ulët; nëse përdoren cookie sesioni, testoni mungesën e token-it CSRF | Dokumentoni modelin aktual | |
| SEC-04 | Brute-force login | >N kërkesa `POST /login` në një minutë nga një IP | Kombinim i `apiLimiter` + përgjigje 401 uniforme për kredenciale të gabuara (shmangje enumerimi nëse është kërkesë) | |
| SEC-05 | Autorizim | Token përdoruesi për rrugë admin | 403 | |
| SEC-06 | JWT i manipuluar | Ndryshoni një karakter në payload | 401 | |
| SEC-07 | Helmet / headers | `curl -I` ndaj API | CSP, X-Frame-Options, etj. sipas konfigurimit | |

**Mjete opsionale profesionale:** [OWASP ZAP](https://www.zaproxy.org/) (skanim pasive/aktiv), Burp Suite, ose skripte të dedikuara për fuzzing — bashkëlidhni skedarët e eksportit në dorëzim.

### 4.6 Verifikimi i skemës së autentikimit / autorizimit

| Kontroll | Përshkrimi | Gjetje |
|----------|------------|--------|
| Lloji i token-it | JWT për akses; refresh token në DB (hash) | |
| Skadimi | `ACCESS_TOKEN_TTL` / refresh TTL nga `.env` | |
| Ruajtja e sekretit | `JWT_SECRET` jo vlerë default në prodhim | |
| 2FA | Nëse aktiv: rrjedha `202` + `twoFactorToken` | |
| Roli në token | `roles` / `is_admin` — përdoren nga `requireAdmin` | |

---

## 5. Ekzekutimi i testeve të automatizuara (gjendje faktike)

Plotësoni pas ekzekutimit:

```
cd mobile-shop/server
npm test
npm run test:integration   # nëse MySQL test është gati
npm run test:newman
```

_(bashkëlidhni screenshot ose `jest --coverage` nëse kërkohet nga pedagogu.)_

---

## 6. Testime manuale (checklist)

- [ ] Regjistrim → email aktivizimi (ose sandbox SMTP) → aktivizim nga linku
- [ ] Rivendosje fjalëkalimi
- [ ] Ndryshim fjalëkalimi nga përdorues i autentikuar
- [ ] Logout / logout nga të gjitha sesionet
- [ ] UI: navigim kryesor, shportë, pagesa (nëse ekziston në fazën tuaj)
- [ ] Përputhshmëri shfletuesi (nëse kërkohet): Chrome / Edge / Firefox

---

## 7. Gjetje të rëndësishme dhe rekomandime

| Prioriteti | Gjetja | Rekomandimi | Pronari / afat |
|------------|--------|-------------|----------------|
| P1 | _shembull: endpoint i gabuar në Locust_ | Përditëso koleksionin / skriptin | |
| P2 | _shembull: JWT_SECRET i dobët në dev_ | Rotacion sekretesh, `.env` jo në git | |
| P3 | _…_ | | |

---

## 8. Shtojcat

- Screenshot-e Cypress / UI
- Eksport Postman/Newman HTML
- Raport Locust (CSV/HTML)
- (Opsionale) raport OWASP ZAP

---

_Dokumenti është bazuar në strukturën aktuale të repozitorit `MobileShop/mobile-shop` (server, client, `tests/`). Përditësoni tabelat me rezultatet reale para dorëzimit._
