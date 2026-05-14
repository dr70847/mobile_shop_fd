# Mirëmbajtje dhe versionim — MobileShop

Ky dokument përshkruan praktika të rekomanduara për **përditësim**, **backup**, **rikuperim** dhe **gjurmim versionesh**.

---

## 1. Versionimi i kodit (Git)

- Përdorni **degë** (`main` / `develop`) dhe **Pull Request** për ndryshime.
- Etiketoni versionet e lëshuara me **Semantic Versioning** (shembull: `v1.2.0`):

```bash
git tag -a v1.2.0 -m "Release 1.2.0"
git push origin v1.2.0
```

- Në përshkrimin e versionit dokumentoni: ndryshimet kryesore, migrimet e DB, ndryshimet e `.env`.

---

## 2. Përditësimi i sistemit

### 2.1 Rendi i përditësimit (më i sigurt)

1. **Backup** i plotë i bazës së të dhënave dhe e skedarëve të konfigurimit (`.env` jashtë git).
2. Vendosni aplikacionin në **mirëmbajtje** (njoftim përdoruesve nëse ka downtime).
3. `git pull` ose vendosni artefaktin e build-it të ri.
4. `npm install` në `server` dhe `client` nëse `package-lock.json` ka ndryshuar.
5. Eksekutoni **migrimet** e bazës së të dhënave (nëse ekziston skript migrimi; përndryshe aplikoni ndryshimet manuale nga `schema.sql` ose skript SQL të veçantë).
6. Rinisni procesin e Node dhe rifreskoni **reverse proxy** / cache CDN.
7. Verifikoni `/health` dhe një rrjedhë kryesore (login + listë produktesh).

### 2.2 Përditësimi i varësive (npm)

- Lexoni **changelog** e paketave kryesore (Express, React).
- Ekzekutoni testet (`npm test`, E2E) para merge në degën kryesore.

---

## 3. Backup dhe rikuperim

### 3.1 Backup i MySQL

**Dump i plotë (shembull):**

```bash
mysqldump -u root -p mobile_shop > backup_mobile_shop_$(date +%Y%m%d).sql
```

Ruajeni skedarin në lokacion të fshehtë, me **fshehtëzim** nëse përmban të dhëna personale (GDPR).

**Rikuperim:**

```bash
mysql -u root -p mobile_shop < backup_mobile_shop_YYYYMMDD.sql
```

### 3.2 Çfarë të ruhet përveç DB

- Skedari `.env` i prodhimit (jashtë repozitorit).
- Certifikatat TLS (nëse jo të menaxhuara nga Let's Encrypt / cloud).
- Konfigurimet e **nginx** / **IIS**.

### 3.3 Rikuperimi i plotë (disaster recovery)

1. Instaloni OS, Node, MySQL, restore nga dump.
2. Klononi repozitorin në të njëjtin **tag** versioni që ishte në prodhim.
3. Vendosni `.env` dhe nisni `server` + shërbimin e frontend-it.
4. Verifikoni integritetin e të dhënave (numër përdoruesish, porosish).

---

## 4. Monitorimi dhe logjet

- **Shëndeti:** `GET /health` — përdoret nga orchestratorët (Kubernetes liveness, etj.).
- **Status monitor:** `/status` — **çaktivizoni** ose mbrojni në prodhim (auth / IP whitelist).
- **Audit:** veprime të rëndësishme autentifikimi ruhen përmes middleware-it të auditimit (`server/middleware/audit.js` dhe modelet përkatëse).

---

## 5. Rrotullimi i sekreteve

- Ndryshoni `JWT_SECRET`: të gjithë përdoruesit do të duhet të **hyjnë përsëri** (token i vjetër bëhet i pavlefshëm).
- Planifikoni rrotullimin e fjalëkalimeve të SMTP dhe çelësave API jashtë sistemit.

---

## 6. Rollback (kthim prapa)

1. Ndaloni versionin e ri të aplikacionit.
2. Riktheni kodin në **tag** ose commit të mëparshëm.
3. Nëse baza u ndryshoi me migrim **jo të kthyeshëm**, përdorni backup-in para migrimit ose skriptin invers (duhet planifikuar paraprakisht).

---

## 7. Dokumentimi i ndryshimeve

- Mbajini **CHANGELOG.md** (ose seksion në release notes) me data, version dhe lista ndryshimesh.
- Përditësoni [Dokumentim_Teknik.md](./Dokumentim_Teknik.md) dhe [API_Reference.md](./API_Reference.md) kur shtohen endpoint-e ose ndryshojnë kontratat.

---

_Dokumenti është udhëzues operacional; përshtatni afatet e backup-it dhe SLA me politikën e organizatës suaj._
