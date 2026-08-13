# Ordine di Servizio - Funivie Campiglio (Mirror moderno)

## Original Problem Statement
Realizzare versione moderna, più leggibile e reattiva del sito Ordine di Servizio (https://service.funiviecampiglio.it/ordinediservizio/mobile/index.php), mantenendo la stessa logica ma migliorando UX, aggiungendo mappatura numero→nome con popover, e mostrando oggi/domani/dopodomani contemporaneamente.

## User Personas
- Personale operativo funivia: consulta assegnazioni giornaliere
- Responsabili turni: verificano copertura zone

## Core Requirements
1. Copia sincronizzata del sito originale (aggiornamento auto ogni 20 min + manuale)
2. Vista simultanea Oggi/Domani/Dopodomani (mobile: tabs)
3. Click su numero personale → popover con nome + zone in cui è impegnato nei 3 giorni
4. Mappatura numeri modificabile via file JSON
5. Ricerca per nome/numero + filtro dropdown per zone (A/B/Z/Assenti)
6. UI moderna scura con accenti cyan/fucsia
7. Sync automatico continuo, gestione errori con retry

## Architecture
- **Backend**: FastAPI + Motor(MongoDB), scraper httpx+BeautifulSoup su sito originale
  - `/api/days` - restituisce 3 giorni arricchiti con nomi
  - `/api/personnel` GET/PUT/DELETE - mapping
  - `/api/sync` POST - forza sync
  - Loop async in background ogni 20 min
- **Frontend**: React + Tailwind + shadcn/ui, poll ogni 60s

## Implemented (13-08-2026)
- ✅ Scraper HTML del sito originale con parsing tabelle direzioni/zone
- ✅ Split numeri concatenati 3-cifre (es. "011023079" → ["011","023","079"])
- ✅ Storage MongoDB con upsert per data (no duplicati)
- ✅ Enrichment con nomi da personnel.json (117 voci precaricate dal PDF)
- ✅ Sync automatico ogni 20 min + endpoint force sync
- ✅ UI dark con gradiente cyan/fucsia, font Onest + JetBrains Mono
- ✅ Vista 3 colonne desktop, tabs mobile
- ✅ Popover shadcn con nome + tutte le assegnazioni del personale nei 3 giorni
- ✅ Ricerca globale (nome/numero/zona) con highlight pillole matching
- ✅ Filtro dropdown zone (Tutte/A/B/Z/Assenti)
- ✅ Sezione Assenti con separazione "Assenti" / "Riposo"
- ✅ Indicatore sync animato (pulse) con timestamp ultimo aggiornamento

## Backlog / Next Actions
- P1: Verificare copertura mappatura numeri (molti codici del sito non sono nel PDF)
- P1: UI di editing mapping (aggiungere/modificare direttamente da frontend)
- P2: Storico giorni passati navigabile
- P2: Modalità stampa
- P2: Notifiche push quando cambia l'assegnazione di una persona
- P2: Dashboard statistiche (carico per zona, ore lavorate)
