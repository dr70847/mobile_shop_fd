# Instalim lokal dhe deployment — MobileShop

---

## 1. Parakushtet (zhvillim lokal)

| Komponenti | Version i rekomanduar |
|------------|------------------------|
| Node.js | LTS (18 ose 20+) |
| npm | Bashkë me Node |
| MySQL | 8.x |
| Git | Për klonim repozitori |

Opsionale: **Docker** dhe **Docker Compose** për MySQL ose stivën e mikrosherbimeve.

---

## 2. Instalimi lokal (monolit: server + client)

### 2.1 Baza e të dhënave

1. Krijoni bazën `mobile_shop` (ose përdorni emrin nga `.env`).
2. Importoni skemën:

```bash
mysql -u root -p < mobile-shop/server/schema.sql
```

_(Rruga relative nga rrënja e repozitorit `MobileShop`.)_

### 2.2 Variablat e mjedisit

1. Kopjoni ose krijoni skedarin `mobile-shop/.env`.
2. Plotësoni të paktën:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=mobile_shop
PORT=3101
HTTPS_PORT=3444
JWT_SECRET=<gjatësi e mjaftueshme dhe e rastësishme>
FRONTEND_URL=http://localhost:3000
```

Për email (regjistrim / rivendosje), konfiguroni SMTP (p.sh. Mailtrap) sipas `server` dhe `.env` tuaj.

### 2.3 Certifikata HTTPS (dev)

Nga dosja `mobile-shop/server`:

```bash
npm install
npm run ssl:generate
```

Pastaj:

```bash
npm run dev
```

Serveri: HTTP në `PORT` (ridrejtim drejt HTTPS) dhe **HTTPS** në `HTTPS_PORT`.

### 2.4 Klienti React

```bash
cd mobile-shop/client
npm install
npm start
```

Aplikacioni: `http://localhost:3000`. Proxy dërgon kërkesat API drejt `https://localhost:3444` (sipas `setupProxy.js`).

### 2.5 Verifikim i shpejtë

- `curl -k https://localhost:3444/health`
- Hapni `https://localhost:3444/docs` për Swagger.

---

## 3. Build për prodhim (frontend)

```bash
cd mobile-shop/client
npm run build
```

Rezultati në `client/build/`. Shërbeni me **nginx**, **IIS**, **Azure Static Web Apps**, ose hostin CDN sipas politikës suaj.

**Shënim:** në prodhim, URL e API-s duhet të jetë e konfiguruar në mënyrë të sigurt (variabla mjedisi `REACT_APP_*` ose reverse proxy), jo vetëm proxy i CRA.

---

## 4. Deployment i backend-it

- **Procesi:** `node server.js` ose menaxher procesesh (**PM2**, **systemd**, **Windows Service**).
- **Mjedisi:** vendosni `.env` në server; **mos** ngarkoni sekrete në kontroll versioni.
- **Reverse proxy:** **nginx** ose **Traefik** para Node për TLS, gzip dhe kufij trupi; ridërgoni te `https://127.0.0.1:<HTTPS_PORT>` ose ndërroni aplikacionin që dëgjon HTTP mbrapa proxy me TLS termination.
- **Portet:** hapni vetëm 443 (dhe 80 për redirect) drejt proxy-t; mbyllni portet e MySQL nga interneti publik.

---

## 5. Docker dhe mikrosherbime (opsional)

Në `mobile-shop/docker-compose.microservices.yml` përcaktohen shërbime të shumta (MySQL, Redis, Kafka, RabbitMQ, Eureka, shërbime Java/Node, etj.).

1. Lexoni `docker-compose.microservices.yml` dhe `README` të çdo shërbimi në `services/`.
2. Nisja tipike:

```bash
cd mobile-shop
docker compose -f docker-compose.microservices.yml up -d
```

Kërkon burime të konsiderueshme RAM/CPU. Për laborator ose demo të thjeshtë, monoliti me MySQL mjafton.

---

## 6. Kontroll lista para prodhimit

- [ ] `JWT_SECRET` unik dhe i gjatë
- [ ] SMTP / URL frontend të sakta
- [ ] Backup i paracaktuar i MySQL (shih [Mirembajtje_dhe_Versionim.md](./Mirembajtje_dhe_Versionim.md))
- [ ] HTTPS i vlefshëm (jo vetë-nënshkruar)
- [ ] Rate limit dhe logjet e rishikuara

---

_Dokumenti përditësohet me strukturën aktuale të `mobile-shop`. Për porta të ndryshme, përgjithësoni sipas `.env` tuaj._
