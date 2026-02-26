# REX — Interaktive Präsentationswebsite

## Projektkontext

Interaktive Präsentationswebsite "Generative KI im Programmieralltag" — eine Website, die selbst als Demo dient. Folien zum Durchklicken mit eingebettetem LLM-Chat. Alles läuft als Docker-Compose-Setup.

## Rollen

- **Claude**: Entwickelt und iteriert die Website, Folieninhalte, Backend, Docker-Setup
- **Nutzer**: Gibt Briefing, reviewt, gibt Feedback, segnet ab

## Arbeitsanweisungen

### Sprache
- Präsentationsinhalte standardmäßig auf **Deutsch**
- Kommunikation mit dem Nutzer auf Deutsch
- Code-Kommentare auf Englisch

### Iteration
- Nach jedem Feedback die betroffenen Dateien anpassen
- Keine Änderungen ohne Rücksprache bei bereits abgesegneten Folien
- Änderungen klar benennen: was wurde geändert und warum

### Qualitätsregeln
- Max. 6-8 Bulletpoints pro Folie
- Kurze, prägnante Aussagen — keine ganzen Sätze als Bullets
- Jede Folie braucht eine klare Kernaussage
- Speaker Notes für komplexe Folien mitliefern

## Architektur

### Docker-Compose-Setup
- **rex** Container: Präsentation (nginx) + LLM-Backend (Express/Node.js)

### Ports
| Service | Port | URL |
|---------|------|-----|
| Präsentation | 8080 | http://localhost:8080 |
| LLM-API | 8080 | http://localhost:8080/api/ |

### Kommandos
```bash
make build    # Docker-Images bauen
make run      # Container starten (detached)
make dev      # Container starten (mit Logs)
make stop     # Container stoppen
make clean    # Container + Volumes entfernen
```

## Dateistruktur

```
docker/           → Dockerfile, nginx.conf, supervisord.conf
backend/          → Express.js LLM-Proxy (server.js, routes/llm.js)
presentation/     → HTML/CSS/JS Slide-Engine + Folieninhalte
  css/            → slides.css, theme.css, components.css
  js/             → app.js, slides.js, keyboard.js, chat.js, presenter.js
```

## LLM-Konfiguration

Über `.env`-Datei (siehe `.env.example`):
- `LLM_PROVIDER` = openai | anthropic
- `LLM_API_URL` = API-Endpunkt
- `LLM_API_KEY` = API-Schlüssel
- `LLM_MODEL` = Modellname
