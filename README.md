# redadv

An independent Liverpool matchday component library by Red Half Lab.

[Open the components](https://liv-ynwa.github.io/redadv/) · [Reports](https://liv-ynwa.github.io/redadv/updates/) · [Project cards](https://liv-ynwa.github.io/redadv/resources/)

## Matchday components

Explore fixtures, form, style, discipline, player forecasts, match reviews and the season archive. Open a player component to choose a player and move between fixtures. Use the bookmark on a card to save it on your device.

The site reads the dated public edition in [data/matchday.json](data/matchday.json). The fixture card advances at kick-off using the published schedule. Results, rescheduling and new predictions arrive with subsequent editions. Times are UTC+8. A missing forecast or result is shown as pending. Score breakdowns show totals and category subtotals.

## Run locally

From the repository root, run `python3 -m http.server 8000` and open [the library](http://localhost:8000/). GitHub Pages serves the same files from the root of the main branch.

The [native components](components/match-pulse.js) use [components.css](styles/components.css). To embed a component in Astro, use [MatchPulse.astro](components/MatchPulse.astro). Fonts and their licences are in [assets/fonts](assets/fonts).

## Source editions

The original [Match Pulse research release](archives/matchpulse-2026-10-28/) and [Red Half Lab website](archives/redhalflabdata-2026-10-30/) retain their files and Git history. The original research dataset, schema and checksum remain available at their previous repository paths. The CC BY 4.0 [licence](LICENSE.txt) covers the original aggregate research status and its documentation. The original website address forwards readers to the corresponding redadv pages.

[Red Half Lab blog](https://redhalflab.com/en/blog) · [REDS reports](https://redhalflab.com/en/reds)
