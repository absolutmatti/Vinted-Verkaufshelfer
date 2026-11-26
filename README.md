# Vinted-Verkaufshelfer

Eine private, für Smartphones optimierte Web-App (**Mobile-First / PWA**) für **Matti** und **Diana**, um Artikel für **Vinted** mithilfe von **Google Gemini Vision** vorzubereiten, mit einem Klick zu kopieren und gemeinsam im Inventar zu verwalten.

---

## Aktueller Projektstatus & Features

- **Geschützter Login & Session-Persistenz**: Profilauswahl (*„Ich bin Matti“* / *„Ich bin Diana“*) mit gemeinsamem PIN (Standard-PIN: `2026`, im Menü *Profil & Cloud-Sync* auf dem Gerät änderbar). Die Anmeldung bleibt im Smartphone-Browser gespeichert.
- **KI-Artikelanalyse („Neuer Artikel“)**:
  - Upload von bis zu 4 Fotos per Smartphone-Kamera oder Galerie (inkl. Hinweis auf das Größen-/Markenetikett).
  - Server-seitige Bildanalyse über `/api/analyze-item` mit **Google Gemini Vision (`gemini-4-hydrogen`)** und striktem JSON-Schema (`responseMimeType: "application/json"`).
  - Automatische Generierung von:
    - Vinted-Titel
    - Verkaufsfördernder Beschreibung mit **5–10 passenden Hashtags** (ohne Standard-Floskeln wie *„Tierfreier Nichtraucherhaushalt“* oder *„Privatverkauf“*)
    - Exaktem Vinted-Kategoriepfad (`Hauptkategorie > Unterkategorie > Spezifische Kategorie`)
    - Pflichtfeldern: *Marke*, *Größe*, *Material*, *Farbe*, *Zustand*
    - Drei Preisempfehlungen: *Schnäppchen-Preis*, *Fairer Preis*, *Wucher-Preis (VB)*
- **One-Click-Copy**: Kopier-Buttons direkt neben Titel und Beschreibung (+ Hashtags) sowohl in der Vorlage als auch in der Detailansicht, inklusive *„Kopiert!“*-Feedback.
- **Inventar, Filter & Einnahmen-Dashboard („Unsere Artikel“)**:
  - Verkaufserlöse oben in Echtzeit: `Dianas Einnahmen`, `Mattis Einnahmen` und `Gesamt`.
  - Kombinierbare Filter nach Besitzer (*Alle*, *Matti*, *Diana*), Status (*Verfügbar*, *Verkauft*, *Alle*) sowie Textsuche.
  - **Ladenhüter-Erkennung** bei verfügbaren Artikeln:
    - Ab 30 Tagen: `⏳ > 1 Monat online – Preis senken?`
    - Ab 60 Tagen: `🔥 > 2 Monate online – Schnäppchenpreis ansetzen!`
  - **Verkaufs-Logik mit Besitzerprüfung**: Nur die Person, die den Artikel eingestellt hat, sieht den Button *„Als verkauft markieren“* und erfasst den finalen Verkaufspreis.
- **Cloud-Synchronisation (Firebase Firestore & Auth)**:
  - Echtzeit-Sync zwischen Mattis und Dianas Smartphone über Firebase Firestore (`households/{householdId}/items`), abgesichert durch gehärtete Security Rules (`firestore.rules`).
  - Lokaler Fallback-Modus (`localStorage`), falls noch kein Google-Konto verknüpft ist oder man offline arbeitet.
- **PWA-Unterstützung**: Installierbar auf iOS und Android inklusive Manifest, Service Worker (`vite-plugin-pwa`), Offline-Hinweis und App-Icons.

---

## Architektur & Dateistruktur

- `server.ts` — Express-Server mit Vite-Middleware (Dev) bzw. `dist/`-Auslieferung (Prod) und `POST /api/analyze-item` über `@google/genai`.
- `src/App.tsx` — Hauptanwendung mit Navigation (Bottom-Bar auf Mobilgeräten, Top-Bar auf Desktop), Session-Steuerung und Firestore-Sync.
- `src/components/` — Modulare UI-Komponenten (`LoginScreen`, `RevenueStatsBar`, `ItemCard`, `ItemDetailModal`, `NewItemView`, `AccountSyncModal`, `CopyButton`, `PWAInstallButton`, `OfflineIndicator`, `ErrorBoundary`).
- `src/utils/vintedRules.ts` — Reine Geschäftslogik (Umsatzberechnung, Ladenhüter-Stufen, Filterung, Hashtag-/Disclaimer-Bereinigung, Besitzprüfung) mit Unit-Tests in `src/utils/vintedRules.test.ts`.
- `src/services/` — `geminiService.ts` (Client-seitige Bildkomprimierung & API-Aufruf) und `inventoryService.ts` (Firestore-Sync & lokaler Speicher).
- `src/firebase.ts`, `firebase-blueprint.json`, `firestore.rules`, `security_spec.md` — Firebase-Initialisierung, Datenmodell-Blueprint und gehärtete Sicherheitsregeln.
- `.github/workflows/deploy.yml` — Automatischer Build- & Deploy-Workflow für **GitHub Pages**.

---

## Setup & Skripte

1. Abhängigkeiten installieren:
   ```bash
   npm install
   ```
2. Umgebungsvariable für die serverseitige Gemini Vision API setzen (siehe `.env.example`):
   ```bash
   GEMINI_API_KEY=...
   ```
3. Entwicklungsserver starten (Port `3000`):
   ```bash
   npm run dev
   ```
4. Unit-Tests, Linting & Production-Build ausführen:
   ```bash
   npm test
   npm run lint
   npm run build
   ```

---

## GitHub Pages Deployment

Die Datei `.github/workflows/deploy.yml` baut automatisch beim Push auf `main` das statische Frontend (`VITE_BASE_PATH=/<repo-name>/ npm run build`) und veröffentlicht `dist/` auf **GitHub Pages**. In den Repository-Einstellungen unter **Settings → Pages** muss als Quelle *GitHub Actions* ausgewählt sein.

> Hinweis: Auf rein statischem Hosting ohne eigenen Node-Server steht der Server-Endpunkt `/api/analyze-item` nur zur Verfügung, wenn ein Backend (z.B. in AI Studio oder auf Cloud Run) betrieben wird; Inventar, Cloud-Sync über Firebase Firestore, One-Click-Copy und Verkaufsverwaltung funktionieren auch rein statisch im Browser.