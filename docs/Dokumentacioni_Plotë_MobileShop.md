MOBILESHOP
Dokumentacioni i përdorimit dhe dokumentacioni teknik

Versioni: 1.0
Data: 2026
Repository: github.com/dr70847/mobile_shop_fd

Faqja publike: https://mobileshop.fun
API: https://api.mobileshop.fun
Dokumentacion interaktiv API: https://api.mobileshop.fun/docs


═══════════════════════════════════════════════════════════════════
PJESA I — UDHËZUES PËR PËRDORUESIN
═══════════════════════════════════════════════════════════════════

Ky seksion është për çdokënd që përdor dyqanin online përmes shfletuesit, pa njohuri programimi.


1. Çfarë është MobileShop

MobileShop është një aplikacion web për shitje produktesh (kryesisht telefona dhe pajisje mobile, sipas katalogut). Përdoruesi mund të shfletojë produktet, të krijojë llogari, të porosisë dhe të ndjekë porositë e veta. Administratori menaxhon produktet dhe, sipas rolit, përdoruesit e tjerë.


2. Si të hapni aplikacionin

Hapni shfletuesin (Chrome, Edge ose Firefox rekomandohen) dhe shkruani:

    https://mobileshop.fun

Nëse faqja nuk hapet, provoni pas disa sekondash ose kontrolloni lidhjen me internetin. Për probleme të vazhdueshme, kontaktoni administratorin e sistemit.


3. Regjistrimi

Nga faqja kryesore zgjidhni regjistrimin (Signup). Plotësoni emrin, email-in dhe fjalëkalimin.

Pas regjistrimit, sistemi mund të kërkojë aktivizim me email. Në këtë rast:

  – Hapni kutinë postare të adresës që përdorët për regjistrim.
  – Klikoni lidhjen e aktivizimit që vjen nga MobileShop.
  – Pastaj kthehuni te faqja dhe provoni hyrjen.

Nëse nuk merrni email, kontrolloni dosjen Spam ose raportoni te administratori — shpesh problemi është konfigurimi i postës në server, jo gabimi juaj në formular.


4. Hyrja në llogari

Zgjidhni Login dhe vendosni email-in dhe fjalëkalimin.

Nëse keni aktivizuar autentifikimin dyfaktorësh (2FA), pas fjalëkalimit do t’ju kërkohet kodi nga aplikacioni i autentifikimit në telefon (Google Authenticator ose i ngjashëm).

Pas hyrjes së suksesshme shfaqet faqja kryesore ose paneli, varësisht nga lloji i llogarisë.


5. Keni harruar fjalëkalimin

Në faqen e hyrjes zgjidhni Forgot password. Shkruani email-in e llogarisë.

Nëse adresa ekziston në sistem, do të merrni udhëzime me email. Hapni lidhjen dhe vendosni fjalëkalimin e ri. Lidhja çon te adresa:

    https://mobileshop.fun/reset-password?token=...

Shënim: nëse pas klikimit shfaqet faqe gabimi “nuk ekziston”, administratori duhet të sigurojë që në serverin e faqes është konfiguruar ridrejtimi për aplikacionin React (.htaccess). Kjo është detaj teknik hostingu, jo gabim i përdoruesit.


6. Blerja e produkteve

Në faqen kryesore shihni listën e produkteve. Klikoni një produkt për detaje (emër, çmim, përshkrim, stok).

Për të porositur zakonisht duhet të jeni të futur në llogari. Ndiqni hapat në ekran: shtoni produktin, shkoni te porosia dhe konfirmoni. Çmimi përcaktohet nga serveri — nuk mund të ndryshohet nga shfletuesi.


7. Porositë e mia

Pas hyrjes, hapni seksionin Orders (Porositë). Aty shfaqen porositë e kryera me këtë llogari dhe statusi i tyre (i ri, në pritje, etj., sipas konfigurimit).


8. Paneli i përdoruesit

Në Dashboard mund të përditësoni të dhënat e profilit, të ndryshoni fjalëkalimin ose të aktivizoni/çaktivizoni 2FA, në varësi të opsioneve që shfaqen në versionin tuaj të sistemit.


9. Administratori dhe menaxheri

Llogaritë me rol administratori shohin faqe shtesë, zakonisht Admin, ku menaxhohen produktet dhe përdoruesit.

Roli menaxher (nëse është aktiv) ka qasje të kufizuar te faqja Manager.

Nëse nuk i shihni këto menu, llogaria juaj është e tipit përdorues i thjeshtë — kjo është normale.


10. Dalja nga llogaria

Zgjidhni Logout nga menuja e përdoruesit. Në kompjuterë të përbashkët, mbyllni edhe skedën e shfletuesit.


11. Probleme të shpeshta (përdorues)

Faqja hapet por nuk mund të hyni: API mund të jetë në “gjumë” (shërbim falas cloud). Prisni pak dhe provoni përsëri, ose rifreskoni faqen.

Mesazh “u dërgua email” por nuk vjen asgjë: kontaktoni administratorin; shpesh mungon SMTP në server ose email-i shkon vetëm në mjedis testimi (Mailtrap).

Pas klikimit të linkut nga email, faqe gabimi: zakonisht mungon konfigurimi i rrugëve në hosting (shih pjesën teknike, .htaccess).


═══════════════════════════════════════════════════════════════════
PJESA II — DOKUMENTACION TEKNIK
═══════════════════════════════════════════════════════════════════

Seksioni për zhvilluesit dhe administratorët që duan të kuptojnë si është ndërtuar sistemi dhe si funksionon në prodhim.


1. Qëllimi dhe arkitektura e përgjithshme

MobileShop është ndarë në tre shtresa kryesore:

  – Klient (frontend): aplikacion React i ekzekutuar në shfletuesin e përdoruesit.
  – Server (backend): API REST me Node.js dhe Express.
  – Baza e të dhënave: MySQL.

Në mjedisin e prodhimit që përdoret aktualisht:

  – Frontend hostohet në Hostinger (skedarë statikë: index.html dhe dosja static).
  – API hostohet në Render (shërbim Node.js).
  – MySQL mbetet në Hostinger; API lidhet në të përmes Remote MySQL.

Arsyetimi: plani Premium i Hostinger nuk ofron Node.js Web App në panel, prandaj API u vendos në Render ndërsa faqja mbeti në domain-in kryesor mobileshop.fun.


2. Teknologjitë

Backend: Node.js, Express 5, mysql2, jsonwebtoken, bcryptjs, express-validator, helmet, nodemailer (ose Sendgrid / Mailtrap sipas konfigurimit).

Frontend: React 19, React Router 6, Material UI, Redux Toolkit, Axios.

Baza e të dhënave: MySQL 8.

Testim: Jest (njësi dhe integrim), Cypress (E2E), Postman/Newman, Locust (ngarkesë).

Dokumentim API: OpenAPI 3, i shfaqur me Swagger UI në rrugën /docs.


3. Struktura e projektit (folderët kryesorë)

Në repository, baza është mobile-shop (ose rrënja e repo-së mobile_shop_fd, në varësi nga si është ngarkuar në Git).

    client/          — kodi React; pas build del client/build/
    server/          — API Express
      app.js         — konfigurimi i aplikacionit, middleware, rrugët
      server.js      — nisja lokale me HTTPS (zhvillim)
      server.production.js — nisja në Render (një port HTTP, TLS nga platforma)
      routes/        — auth, products, orders, ...
      models/        — qasja në MySQL
      modules/       — authentication, user-management, business-operations, statistics-reporting
      middleware/    — auth, security, rateLimit, audit
      schema.sql     — skema e plotë e bazës
    tests/           — Postman, Locust, Newman
    docs/            — dokumentacion

Ekziston edhe një variant mikrosherbimesh (services/, gateway/, docker-compose.microservices.yml). Për laborator dhe për deploy-in aktual përdoret monoliti server + client.


4. Modulet e backend-it

Autentifikimi (authentication): regjistrim (signup), hyrje, refresh token, logout, aktivizim llogarie me email, rivendosje fjalëkalimi, 2FA, endpoint /me. Rruga kryesore: /api/v1/auth (dhe /auth për përputhshmëri).

Menaxhimi i përdoruesve (user-management): lista dhe menaxhim përdoruesish për admin, profil sipas ID, audit logs. Rruga: /api/v1/users.

Operacionet e biznesit (business-operations): produkte dhe porosi. Rrugët e zakonshme janë /api/v1/products dhe /api/v1/orders (edhe nën /api/v1/business në varësi nga montimi).

Statistika (statistics-reporting): përmbledhje për admin, raporte shitjeje, monitorim modulesh. Rruga: /api/v1/stats.


5. Autentifikimi dhe autorizimi

Pas hyrjes së suksesshme, klienti merr JWT (access token) dhe refresh token. Kërkesat e mbrojtura dërgojnë header-in:

    Authorization: Bearer <token>

Roli administrator kontrollohet në server (is_admin / ROLE_ADMIN). Frontend përdor komponentë RequireAuth dhe RequireRole për të kufizuar faqet.

Refresh token ruhet në bazë si hash; nuk ruhet i papërpunuar.


6. Siguria (shkurt)

  – Helmet për header-a HTTP.
  – Sanitizim inputesh dhe mbrojtje e thjeshtë kundër SQL injection në middleware.
  – Validim me express-validator për forma të zakonshme.
  – Kufizim kërkesash (rate limit) për rrugët nën /api.
  – CORS i kufizuar me FRONTEND_URL në prodhim (https://mobileshop.fun).

Testimi i sigurisë duhet bërë edhe me mjete të dedikuara (OWASP ZAP, etj.) për raportin e laboratorit, jo vetëm me middleware.


7. Baza e të dhënave

Skema kryesore përfshin: users, products, orders, order_items, categories, reviews, payments, shipments, refresh_tokens, user_action_tokens, audit_logs, dhe tabela të lidhura.

Importi fillestar bëhet me server/schema.sql. Në Hostinger, para importit hiqen rreshtat CREATE DATABASE dhe USE mobile_shop — përdoret baza e krijuar nga paneli (p.sh. u557613047_mobileshop).


8. Komunikimi frontend – backend

Në zhvillim lokal, Create React App përdor proxy (setupProxy.js) drejt https://localhost:3444.

Në prodhim, gjatë build-it duhet vendosur:

    REACT_APP_API_URL=https://api.mobileshop.fun

Pastaj Axios dërgon kërkesat drejt API-së së deployuar. Pa këtë, faqja në mobileshop.fun do të përpiqet të thërrasë të njëjtin domain për API dhe login nuk funksionon.


9. Rrugët e ndërfaqes (React Router)

    /                 — faqja kryesore (produkte)
    /login            — hyrje
    /signup           — regjistrim
    /forgot-password  — kërkesë reset
    /reset-password   — vendosje fjalëkalimi të ri (me token në URL)
    /orders           — porositë e mia (kërkon hyrje)
    /dashboard        — panel përdoruesi
    /admin            — administrim
    /manager          — menaxher
    /products/:id     — detaj produkti
    /support          — mbështetje (nëse është aktiv)


═══════════════════════════════════════════════════════════════════
PJESA III — INSTALIM LOKAL DHE DEPLOY
═══════════════════════════════════════════════════════════════════


A. Zhvillim në kompjuterin personal

Parakushte: Node.js LTS, npm, MySQL 8, Git.

Hapat:

1) Klononi repository-n dhe hyni në dosjen e serverit.

2) Krijoni bazën mobile_shop dhe importoni schema.sql (lokalisht CREATE DATABASE lejohet).

3) Krijoni mobile-shop/.env me DB_*, JWT_SECRET, PORT, HTTPS_PORT, FRONTEND_URL=http://localhost:3000, dhe SMTP nëse testoni email.

4) Në server: npm install, npm run ssl:generate (për HTTPS lokal), npm run dev.

5) Në client: npm install, npm start — hapet http://localhost:3000.

6) Provoni https://localhost:3444/health dhe https://localhost:3444/docs.


B. Deploy në prodhim (konfigurimi aktual i grupit)

Frontend (Hostinger)

  – Bëni npm run build në client me REACT_APP_API_URL=https://api.mobileshop.fun
  – Ngarkoni përmbajtjen e client/build/ në public_html (index.html dhe static/, jo dosjen build si podfolder).
  – Fshini skedarët default të Hostinger-it (p.sh. default.php).
  – Shtoni .htaccess për SPA (ridrejtim i të gjitha rrugëve te index.html) — i domosdoshëm për /login, /reset-password, etj.
  – Aktivizoni SSL për mobileshop.fun.

Backend (Render)

  – Krijoni Web Service me runtime Node (jo Docker).
  – Root Directory: server (në repo mobile_shop_fd).
  – Build: npm install
  – Start: node server.production.js
  – Environment: DB_HOST (srv....hstgr.io), DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET, FRONTEND_URL=https://mobileshop.fun, SMTP_*, ADMIN_EMAIL, ADMIN_PASSWORD, NODE_ENV=production, TRUST_PROXY=true
  – Custom domain: api.mobileshop.fun
  – Mos krijoni subdomain api që tregon te public_html në Hostinger — vetëm CNAME DNS drejt Render.

MySQL (Hostinger)

  – Remote MySQL: lejoni lidhjen nga Render (shpesh % për testim, ose IP specifike).
  – Import schema pa CREATE DATABASE.

DNS

  – CNAME api → emri i shërbimit.onrender.com
  – Certifikatë SSL për api në Render (Verified / Issued).

Zgjimi i API-së kur Render “flet” (plan falas)

  – Hapni https://api.mobileshop.fun/health para demonstrimit.
  – Ose Manual Deploy / Restart nga paneli Render.


C. Përditësim i versionit

Backend: ndryshoni kodin, git push; Render bën deploy automatik nëse është lidhur me GitHub. Kontrolloni logs dhe /health.

Frontend: ndryshoni client/, ribëni build me të njëjtin REACT_APP_API_URL, ringarkoni index.html dhe static në public_html.

Baza e të dhënave: backup me mysqldump para ndryshimeve të mëdha në skemë.


═══════════════════════════════════════════════════════════════════
PJESA IV — REFERENCË API (PËRMBLEDHJE)
═══════════════════════════════════════════════════════════════════

Burimi i plotë dhe i përditësuar: Swagger në https://api.mobileshop.fun/docs

Baza e URL-ve: https://api.mobileshop.fun

Autentifikim (shembuj)

  POST /api/v1/auth/signup
    Trupi: name, email, password
    Përgjigje: mesazh aktivizimi; llogaria mund të jetë jo aktive derisa të klikohet email-i.

  POST /api/v1/auth/login
    Trupi: email, password
    Përgjigje: token, refreshToken, user

  POST /api/v1/auth/request-password-reset
    Trupi: email

  POST /api/v1/auth/reset-password
    Trupi: token, newPassword

  GET /api/v1/auth/me
    Kërkon Authorization: Bearer

Produkte

  GET /api/v1/products — listë (publike)
  GET /api/v1/products/:id — detaj
  POST /api/v1/products — krijim (admin)
  PUT /api/v1/products/:id — përditësim (admin)
  DELETE /api/v1/products/:id — fshirje (admin)

Porosi

  GET /api/v1/orders/my — porositë e përdoruesit të autentikuar
  POST /api/v1/orders/checkout — krijim porosie
    Trupi shembull: { "items": [ { "product_id": 1, "quantity": 2 } ] }

Statistika (admin)

  GET /api/v1/stats/overview
  GET /api/v1/stats/reports/sales-by-day

Kodet e përgjigjes të zakonshme: 200/201 sukses, 400 validim, 401 pa token, 403 pa të drejtë, 404 nuk gjendet, 409 konflikt (email ekzistues), 429 shumë kërkesa.

Postman: vendosni base_url = https://api.mobileshop.fun. Kujdes: koleksioni i vjetër mund të përdorë /register në vend të /signup — përshtateni para testimit.


═══════════════════════════════════════════════════════════════════
PJESA V — MIRËMBAJTJE DHE VERSIONIM
═══════════════════════════════════════════════════════════════════

Versionimi i kodit bëhet me Git (degë main, tag për versione të rëndësishme). Mos ngarkoni .env me fjalëkalime në repository.

Backup i bazës rekomandohet para çdo ndryshimi të madh:

    mysqldump -u USER -p EMRI_BAZES > backup_YYYYMMDD.sql

Ruajeni backup-in dhe skedarët .env jashtë serverit publik. JWT_SECRET duhet të jetë i gjatë dhe unik; ndryshimi i tij çaktivizon sesionet ekzistuese.

Monitorim: GET /health për kontroll të shpejtë. Rruga /status ekziston por në prodhim duhet mbrojtur ose çaktivizuar.

Për incident: rollback i kodit me git checkout ose redeploy commit të mëparshëm; rikthim DB nga dump nëse është prishur data.


═══════════════════════════════════════════════════════════════════
PJESA VI — TESTIM (PËRMBLEDHJE PËR LABORATOR)
═══════════════════════════════════════════════════════════════════

Teste të automatizuara në projekt: Jest (server), Cypress (client), Postman/Newman, Locust (performancë).

Para dorëzimit verifikohen: happy path (regjistrim, hyrje, produkte, porosi), raste gabimi (input i pavlefshëm, pa autorizim), dhe skenarë sigurie (SQLi, XSS në input, brute force i kufizuar nga rate limit).

Raporti i detajuar i rasteve mund të plotësohet në dokumentin e veçantë të testimit para-përfundimtar.


═══════════════════════════════════════════════════════════════════
FUND DOKUMENTIT
═══════════════════════════════════════════════════════════════════

Për pyetje teknike gjatë mirëmbajtjes, përdoren logs të Render-it për API dhe panelin e Hostinger për frontend dhe MySQL. Për përdoruesit fundorë, mjafton adresa https://mobileshop.fun dhe udhëzimet në Pjesën I.
