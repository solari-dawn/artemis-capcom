# Artemis II Mission Control Dashboard

A real-time, single-file mission control dashboard for NASA's Artemis II lunar flyby mission. Built with pure HTML, CSS, and vanilla JavaScript — no frameworks, no build tools.

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

## Preview

> Open `artemis2_dashboard.html` directly in any modern browser — no server required.

## Data Sources

| Panel | Source |
|---|---|
| Orbital Telemetry / Attitude | [artemis.cdnspace.ca](https://artemis.cdnspace.ca) community API → physics fallback |
| Deep Space Network | [NASA DSN Now XML](https://eyes.nasa.gov/dsn/data/dsn.xml) |
| Space Weather | [NASA DONKI API](https://api.nasa.gov/DONKI) (`DEMO_KEY`) |
| News Feed | [NASA Missions Blog RSS](https://www.nasa.gov/blogs/missions/feed/) via allorigins proxy |
| Live Stream | [NASA YouTube](https://www.youtube.com/watch?v=21X5lGlDOfg) |
| Trajectory | Computed from JPL Horizons free-return profile |

> **Note:** The NASA DONKI API uses `DEMO_KEY`, a publicly documented demo key with a rate limit of 30 requests/hour/IP. No account required.

## Usage

```bash
# Clone and open — that's it
git clone https://github.com/YOUR_USERNAME/artemis2.git
cd artemis2
# Open in browser
start artemis2_dashboard.html   # Windows
open artemis2_dashboard.html    # macOS
```

Or deploy to any static host (GitHub Pages, Netlify, etc.).

## Tech Stack

- HTML5 / CSS3 (CSS custom properties, Grid, Canvas)
- Vanilla JavaScript (ES2020+, Fetch API, EventSource, Canvas 2D, DOMParser)
- No dependencies, no build step

## License

MIT — see [LICENSE](LICENSE)

## Disclaimer

This dashboard is a fan-made project and is not affiliated with or endorsed by NASA. All mission data is sourced from publicly available NASA APIs and community-maintained endpoints. Telemetry values may be estimated when live APIs are unavailable.
