# Leonida Vice Bureau — Forensic Platinum Casefile

[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/wiliamkesh/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/wiliamkesh/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline, open-source trophy guide and tracker for **Grand Theft Auto VI** (PlayStation 5) — built for the [make.fun gta6-trophy-guide-01 bounty](https://make.fun/competitions/gta6-trophy-guide-01).

## What it is

A dark "evidence room" casefile over the official 55 trophies (1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden on PSN):

- **Tracker** — checklist saved in the browser (localStorage), with export/import JSON, filters by kind and grade, search, and a Spoiler Shield that masks the 28 hidden trophies until earned or revealed.
- **Roadmap** — ~200 hours, difficulty 4/10, 1 playthrough, 0 online, 0 glitched; six stages in play order with per-stage progress.
- **Missables** — a Point-of-No-Return Chapter Scrubber (Trophy × Chapter 1–5/Post) plus story gates per chapter. Only one trophy is reported as possibly missable.
- **Sources** — every guide step cites numbered sources read on 21 Nov 2026, plus a Trophy × Source heatmap and a disputes list that shows both versions of every disagreement.

## The differentiator: Conflict Diff Card

Sources disagree on **Positive Mental Attitude** (18 vs 15 meditations, and whether the Chapter 1 balcony meditation counts). Instead of picking one version, the casefile lets you choose a track — **Track Conservative (18)** or **Track Minimum (15)** — and the choice changes the progress counter (6/18 vs 6/15) and the platinum hours estimate live.

## Honesty

- 168 guide steps, 168/168 cited to 7 sources read 21 Nov 2026 (PowerPyx, KeenGamer, OutputLag, eGamers, GTA Vibes, PushSquare, Exophase).
- 5 claims are marked **unconfirmed** in the open; 5 disputes are shown both ways; the 28-hidden count is derived by a documented rule (12 story/mission + 5 stranger finals + Fair Game + 2 VCIA + 8 secret-type).
- No Rockstar logo, artwork or game text. Trophy names, descriptions and grades are PlayStation's official list. All guides are written in our own words.

## Run it

```sh
node serve.ts        # serves app/ on http://localhost:8080
```

100% offline: no network requests, system fonts only, no CDN. Progress never leaves the browser except through the export you trigger yourself.

## Hand in

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see [LICENSE](LICENSE).
