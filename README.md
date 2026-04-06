# Artemis II — Mission Control Dashboard

**Live site → [solari-dawn.github.io/artemis2](https://solari-dawn.github.io/artemis2/)**

A real-time, single-file mission control dashboard for NASA's Artemis II lunar flyby mission.  
Built with pure HTML, CSS, and vanilla JavaScript — no frameworks, no build tools, no tracking, no ads.

> **Public good project.** If it's useful, ETH donations are welcome: `solari-dawn.eth`

---

## Features

- **Mission Elapsed Time** — live clock from launch (Apr 1, 2026 22:35:12 UTC)
- **Orbital Telemetry** — distance from Earth/Moon, speed, altitude, range rate, G-force with speed sparkline
- **Trajectory Visualization** — canvas-based Earth-Moon system showing Orion's free-return arc, animated in real time
- **Attitude & Solar Arrays** — roll/pitch/yaw and solar array wing angles via AROW SSE stream
- **Deep Space Network** — live DSN dish contacts and signal strength (NASA DSN XML feed)
- **Crew Manifest** — Wiseman, Glover, Koch, Hansen with roles and flags
- **Space Weather** — Kp index, solar flare class, CME status, and crew radiation risk (NASA DONKI API)
- **Mission Timeline** — annotated event list from NASA press kit with live active-event highlighting
- **Live NASA Coverage** — embedded YouTube stream (NASA+)
- **NASA Mission Updates** — NASA Missions RSS blog feed via proxy

---

## Data Sources

| Panel | Source |
|---|---|
| Orbital Telemetry / Attitude | [artemis.cdnspace.ca](https://artemis.cdnspace.ca) community API → physics fallback |
| Deep Space Network | [NASA DSN Now XML](https://eyes.nasa.gov/dsn/data/dsn.xml) |
| Space Weather | [NASA DONKI API](https://api.nasa.gov/DONKI) (`DEMO_KEY`) |
| News Feed | [NASA Missions Blog RSS](https://www.nasa.gov/blogs/missions/feed/) via allorigins proxy |
| Live Stream | [NASA YouTube](https://www.youtube.com/watch?v=21X5lGlDOfg) |
| Trajectory | Computed from JPL Horizons free-return profile |

> The NASA DONKI API uses `DEMO_KEY` — a publicly documented demo key, 30 req/hour/IP. No account required.

---

## Usage

### View live
Open **[solari-dawn.github.io/artemis2](https://solari-dawn.github.io/artemis2/)** in any modern browser.

### Run locally
```bash
git clone https://github.com/solari-dawn/artemis2.git
cd artemis2
# Open in browser — no server needed
start index.html    # Windows
open index.html     # macOS
```

### Deploy your own copy
Fork this repo, then in your fork go to **Settings → Pages → Source: Deploy from branch → main / (root)**.
Your copy will be live at `https://<your-username>.github.io/artemis2/`.

---

## Tech Stack

- HTML5 / CSS3 (custom properties, Grid, Canvas)
- Vanilla JavaScript (ES2020+, Fetch API, EventSource, Canvas 2D, DOMParser)
- Zero dependencies · zero build step · single file

---

## License

MIT © 2026 [Dawn Solari](https://github.com/solari-dawn) — see [LICENSE](LICENSE)

---

## Disclaimer

Fan-made project, not affiliated with or endorsed by NASA. All data is sourced from publicly available NASA APIs and community endpoints. Telemetry values may be estimated when live APIs are unavailable.
