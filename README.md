# Cardiologische congressen

Mobielvriendelijke statische webapp voor cardiologische congressen.

## Wat doet de app?

- Toont congressen uit `data/congresses.json`.
- Werkt de tabel bij telkens wanneer de app opent.
- Laat zoeken en filteren per jaar toe.
- Laat manueel een congres toevoegen.
- Slaat manuele toevoegingen permanent op in GitHub door `data/congresses.json` te committen.

## Lokaal testen

```bash
python3 -m http.server 8000
```

Ga daarna naar `http://localhost:8000`.

## Publiceren via GitHub Pages

1. Maak een nieuwe GitHub-repository, bv. `cardio-congress-app`.
2. Upload alle bestanden uit deze map.
3. Ga naar **Settings → Pages**.
4. Kies **Deploy from a branch**.
5. Kies branch `main` en folder `/root`.
6. Klik **Save**.
7. De app staat daarna op `https://<gebruikersnaam>.github.io/cardio-congress-app/`.

## Permanente manuele toevoegingen instellen

Omdat GitHub Pages statisch is, kan de app niet vanzelf schrijven naar je repository. Daarom gebruikt de app een GitHub fine-grained personal access token.

1. Ga in GitHub naar **Settings → Developer settings → Personal access tokens → Fine-grained tokens**.
2. Maak een nieuw token.
3. Kies alleen deze repository.
4. Geef de permission **Contents: Read and write**.
5. Kopieer het token.
6. Open de app.
7. Klik **GitHub instellen**.
8. Vul in:
   - eigenaar / organisatie;
   - repositorynaam;
   - branch, meestal `main`;
   - databestand, meestal `data/congresses.json`;
   - token.
9. Klik **Instellingen bewaren**.

Daarna schrijft de knop **Congres toevoegen** rechtstreeks naar `data/congresses.json` in GitHub. Iedereen die de app opent ziet de toevoeging zodra GitHub Pages opnieuw gedeployed is of zodra de verse JSON geladen wordt.

## Veiligheidsnota

Het token wordt opgeslagen in `localStorage` van de browser. Gebruik daarom een fine-grained token met enkel toegang tot deze repository en enkel **Contents: Read and write**. Gebruik dit niet op een gedeelde of publieke computer.

## Automatische update

De GitHub Action in `.github/workflows/update.yml` draait dagelijks om 05:00 UTC en kan ook manueel gestart worden via **Actions** > **Update congress data** > **Run workflow**.

De parser in `scripts/update_congresses.js` is bewust conservatief. Voor betrouwbare extractie is meestal een parser per congreswebsite nodig.
