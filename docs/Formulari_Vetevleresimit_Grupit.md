# Formulari i vetëvlerësimit të grupit — MobileShop

**Lënda / projekti:** _plotësoni_  
**Grupi:** _emrat dhe ID_  
**Data:** _plotësoni_  
**Repository:** https://github.com/dr70847/mobile_shop_fd  
**URL prodhim (nëse aplikohet):** https://mobileshop.fun | API: https://api.mobileshop.fun  

---

## 1. Përmbledhje e projektit

MobileShop është një platformë e-commerce me **frontend React**, **backend Express (Node.js)**, **MySQL**, autentifikim **JWT**, module të ndara (autentikim, përdorues, operacione biznesi, statistika), testim të automatizuar (Jest, Cypress, Postman/Newman, Locust) dhe deploy në **Hostinger** (frontend) + **Render** (API).

---

## 2. Kontributi sipas fazave (bazuar në commit-et e repozitorit)

_Plotësoni emrat e anëtarëve në kolonën “Kush”._

| Faza / commit (përmbledhje) | Çfarë u realizua | Kush (grupi) | Vlerësimi (1–5) |
|----------------------------|------------------|--------------|-----------------|
| **Faza 2** — Arkitektura, API (`d840885`, `adcb1e0`, …) | Strukturë sistemi, REST API, dokumentim arkitekture | | |
| **Faza 3.1–3.2** — Modularizim, entitete, DB (`7872919` … `b320f46`) | Module, UML, skema MySQL, data access | | |
| **Faza 3** — GUI, 2FA, aktivizim/reset (`e07a44f`, `bed481c`, `ff42182`) | Ndërfaqe React, 2FA, email aktivizimi/rivendosje fjalëkalimi | | |
| **Faza 3** — Pikat e fazës 3 (`7d10009` … `e56d00f`) | Përmbushje kërkesash të laboratorit / dokumentacion | | |
| **Faza 4** (`4038db5`, `194c3ac`, `7826b9e`) | Përmirësime finale, testim, dokumentacion | | |
| **Deploy** (`f471ecd`, `c0e452b`) | `server.production.js`, mysql2 në dependencies, Render + Hostinger | | |

**Përmbledhje e shkurtër e ndarjes së punës:**  
_2–4 fjali: kush bëri backend, frontend, DB, teste, deploy._

---

## 3. Arritjet kryesore (çfarë funksionon)

Vendosni **Po / Pjesërisht / Jo** dhe një koment të shkurtër.

| # | Arritja | Po | Pjesërisht | Jo | Koment |
|---|---------|----|------------|-----|--------|
| 1 | Regjistrim / hyrje / logout | | | | |
| 2 | Menaxhim produktesh (CRUD admin) | | | | |
| 3 | Porosi / checkout | | | | |
| 4 | 2FA (nëse është aktivizuar) | | | | |
| 5 | Rivendosje fjalëkalimi (email + link) | | | | |
| 6 | API e dokumentuar (Swagger `/docs`) | | | | |
| 7 | Teste automatike (Jest / Cypress / Postman) | | | | |
| 8 | Deploy publik (HTTPS, domain) | | | | |
| 9 | Siguri bazë (JWT, validim, middleware) | | | | |

---

## 4. Vështirësitë e hasura (gjatë zhvillimit dhe deploy-it)

_Shembuj të bazuara në punën reale të grupit — zgjidhni dhe plotësoni._

| Vështirësia | Si u manifestua | Si u zgjidh (ose ende) |
|-----------|-----------------|-------------------------|
| Deploy Hostinger Premium pa Node.js | API nuk hostohej si `server.zip` në public_html | API në **Render**, frontend në **Hostinger** |
| DNS / SSL për `api.mobileshop.fun` | Konflikt subdomain + CNAME, certifikatë | Fshirje subdomain `api` → public_html; CNAME + Custom Domain në Render |
| React routes (`/reset-password`) | 404 “This Page Does Not Exist” | `.htaccess` në public_html |
| Email (Mailtrap / SMTP) | Email nuk vjen në inbox real | Konfigurim `SMTP_*` në **Render** (jo vetëm `.env` lokal) |
| Render Free “fle” | API e ngadaltë pas inaktiviteti | Ping `/health` para demo; opsional upgrade plan |
| Postman vs API reale | `/register` në koleksion, API ka `/signup` | Ndryshim `base_url` dhe path në Postman |
| Teste Jest / integrim | Disa teste të vjetra (p.sh. skema produkti) | Përditësim pritshmërish ose përjashtim integrimit |

---

## 5. Çfarë do të bënim ndryshe (reflektim i sinqertë)

| # | Aspekti | Çfarë bëmë | Çfarë do të bënim tani |
|---|---------|-----------|------------------------|
| 1 | **Planifikimi i deploy-it** | Filluam deploy në fund të projektit | Plan deploy që në **Faza 2** (1 environment: staging) |
| 2 | **Hosting** | Premium pa Node.js | Business/Cloud me Node **ose** Render që nga fillimi |
| 3 | **Konfigurimi** | `.env` vetëm lokal | `.env.example` + dokumentim i qartë për Render/Hostinger |
| 4 | **SPA në Hostinger** | Ngarkuam vetëm `index.html` + `static` | `.htaccess` që në **ditën e parë** të upload-it |
| 5 | **Email** | Supozuam Mailtrap = email real | Test me SMTP Hostinger ose shënim në dokumentacion |
| 6 | **Teste / CI** | Teste shpesh manuale në fund | GitHub Actions: `npm test` + build client në çdo push |
| 7 | **API dokumentim** | Postman me endpoint-e të vjetra | Sinkronizim me OpenAPI; një environment “Production” |
| 8 | **Ndarja e punës** | Commit-e të përqendruara në disa faza | Task-e javore + review kodi nga të paktën 2 anëtarë |
| 9 | **Sekretet** | Rrezik `.env` në chat / repo | Vetëm env në panel hosting; rotacion fjalëkalimesh |

**Përgjigje e hapur (3–5 rreshta):**  
_“Nëse do të fillonim përsëri, do të…”_

---

## 6. Aftësitë e fituara (grupi)

_Vlerësoni 1 (i ulët) – 5 (i lartë)._

| Aftësia | 1 | 2 | 3 | 4 | 5 |
|---------|---|---|---|---|---|
| Zhvillim full-stack (React + Express) | | | | | |
| Dizajn dhe implementim DB (MySQL) | | | | | |
| Autentifikim dhe siguri (JWT, 2FA, middleware) | | | | | |
| Testim (manually + automatizuar) | | | | | |
| Deploy dhe DNS / HTTPS | | | | | |
| Punë në ekip / Git | | | | | |
| Dokumentacion teknik | | | | | |

---

## 7. Përputhja me kërkesat e laboratorit

| Kërkesa | E përmbushur? | Dëshmi (commit / dokument / URL) |
|---------|---------------|-----------------------------------|
| Arkitektura dhe module | | `7872919`, `ARCHITEKTURA_SISTEMIT.md`, … |
| Baza e të dhënave | | `schema.sql`, `b320f46` |
| GUI | | `e07a44f`, `client/` |
| API + referencë (Swagger) | | `/docs`, Postman |
| Testim para-përfundimtar | | `docs/Raporti_Testimit_Para_Perfundimtar.md`, `tests/` |
| Deploy publik | | mobileshop.fun, api.mobileshop.fun |
| Dokumentacion përdorimi | | `docs/Manual_Perdoruesit_Fundor.md`, … |

---

## 8. Vlerësimi i përgjithshëm i grupit

| Pyetja | Përgjigja |
|--------|-----------|
| A ishte ndarja e detyrave e drejtë? | Po / Jo — _arsye_ |
| A komunikuam rregullisht? | Po / Jo — _si (Discord, WhatsApp, …)_ |
| Cili ishte kontributi më i fortë i grupit? | _…_ |
| Cili ishte boshllëku më i madh? | _…_ |
| Nota e vetëvlerësimit të grupit (1–10): | _/10_ |

---

## 9. Plani i shkurtër pas dorëzimit (opsionale)

- [ ] CI/CD (GitHub Actions)
- [ ] Email prodhim me SMTP Hostinger
- [ ] Përditësim Postman/Newman për production
- [ ] Mbyllje testesh Jest të prapambetura
- [ ] Upgrade hosting (Node në një vend) nëse projekti vazhdon

---

## 10. Nënshkrimet (opsionale)

| Anëtari | Roli në grup | Data |
|---------|--------------|------|
| | | |
| | | |
| | | |

---

_Dokumenti u përgatit si shabllon për vetëvlerësimin e grupit; plotësoni me të dhëna reale pas diskutimit në grup._
