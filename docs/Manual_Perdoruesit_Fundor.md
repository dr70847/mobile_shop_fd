# Manual për përdoruesin fundor — MobileShop

Ky udhëzues përshkruan përdorimin e aplikacionit në shfletues (web). Nuk kërkon njohuri teknike.

---

## 1. Çfarë ju nevojitet

- Një kompjuter ose telefon me lidhje interneti.
- Shfletues i përditësuar (rekomandohet **Google Chrome**, **Microsoft Edge** ose **Mozilla Firefox**).
- Adresë email e vlefshme (për regjistrim, aktivizim llogarie ose rivendosje fjalëkalimi).

---

## 2. Hyrja në aplikacion

1. Hapni shfletuesin dhe shkruani adresën që ju ka dhënë administratori (p.sh. `http://localhost:3000` për testim lokal).
2. Do të shihni faqen kryesore me produktet.

---

## 3. Regjistrimi i llogarisë së re

1. Në menunë ose në faqe, zgjidhni **Regjistrohu** / **Signup** (rruga `/signup`).
2. Plotësoni **emrin**, **email-in** dhe **fjalëkalimin** sipas kërkesave në ekran (gjatësi minimale dhe kompleksitet, nëse shfaqet).
3. Konfirmoni regjistrimin.
4. Nëse sistemi përdor aktivizim me email: hapni kutinë e postës dhe klikoni lidhjen **Aktivizo llogarinë**. Pa këtë hap, hyrja mund të mos lejohet.

---

## 4. Hyrja në llogari (Login)

1. Zgjidhni **Hyr** / **Login** (rruga `/login`).
2. Shkruani **email-in** dhe **fjalëkalimin**.
3. Nëse keni aktivizuar **autentifikim dyfaktorësh (2FA)**, do t’ju kërkohet edhe kodi nga aplikacioni i autentifikimit në telefon.
4. Pas hyrjes së suksesshme, shihni faqen kryesore ose panelin tuaj sipas rolit.

---

## 5. Rivendosja e fjalëkalimit

1. Në faqen e hyrjes, zgjidhni **Harrove fjalëkalimin?** / **Forgot password** (`/forgot-password`).
2. Shkruani email-in e llogarisë.
3. Nëse adresa ekziston, do të merrni email me udhëzime.
4. Hapni lidhjen dhe vendosni fjalëkalimin e ri në faqen e rivendosjes (`/reset-password`).

---

## 6. Shfletimi i produkteve dhe blerja

1. Në **faqen kryesore** shfletoni listën e produkteve.
2. Klikoni një produkt për të parë **detajet** (`/products/:id`).
3. Shtoni në shportë ose vazhdoni drejt **porosisë** sipas ndërfaqes së aplikacionit.
4. Për të përfunduar porosinë zakonisht duhet të jeni **të futur** në llogari; ndiqni hapat në ekran (adresa dërgese, konfirmim, etj.).

---

## 7. Porositë e mia

1. Hyni në llogari.
2. Hapni faqen **Porositë** / **Orders** (`/orders`).
3. Shihni listën e porosive dhe statusin e tyre (në varësi të konfigurimit të sistemit).

---

## 8. Paneli i përdoruesit (dashboard)

1. Pas hyrjes, hapni **Panelin** / **Dashboard** (`/dashboard`) nëse është i dukshëm në meni.
2. Nga aty mund të përditësoni të dhëna profili, fjalëkalimin ose cilësime të tjera sipas opsioneve të ofruara.

---

## 9. Roli menaxher dhe administrator

- **Menaxher** (`/manager`): veprime të kufizuara menaxheri (sipas konfigurimit të projektit).
- **Administrator** (`/admin`): qasje më e gjerë (p.sh. produkte, përdorues, statistika).

Nëse nuk shihni këto linke, llogaria juaj nuk ka të drejtat përkatëse; kontaktoni administratorin.

---

## 10. Ndihmë dhe mbështetje

- Faqja **Mbështetje** / **Support** (`/support`) — nëse ekziston në versionin tuaj.
- Për probleme teknike (nuk hapet faqja, gabim serveri), raportojini **ekipit IT** ose administratorit me përshkrimin e hapit dhe, nëse është e mundur, një pamje ekrani (screenshot).

---

## 11. Dalja nga llogaria (Logout)

1. Zgjidhni **Dil** / **Logout** nga menytë e përdoruesit (zakonisht në krye të faqes).
2. Mbyllni skedën e shfletuesit në kompjuterë të përbashkët për siguri shtesë.

---

_Dokumenti reflekton rrugët e React Router në `client/src/App.js`. Nëse ndërfaqja përdor etiketa të tjera gjuhësore, hapat mbeten të njëjtit._
