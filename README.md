# redadv

An independent Liverpool matchday component library by Red Half Lab.

[Open the components](https://liv-ynwa.github.io/redadv/) · [Reports](https://liv-ynwa.github.io/redadv/reports/) · [Project cards](https://liv-ynwa.github.io/redadv/project-cards/)

## Matchday components

Explore fixtures, form, style, discipline, player forecasts, match reviews and the season archive. Open a player component to choose a player and move between fixtures. Use the bookmark on a card to save it on your device.

The site reads the dated public edition in [data/matchday.json](data/matchday.json). The fixture card advances at kick-off using the published schedule. Approved changes to forecasts, results and rescheduled fixtures are published automatically from the local report sources. The browser checks every 30 seconds. The timestamp on the homepage is the last data publication. Times are UTC+8. A missing forecast or result is shown as pending. Score breakdowns show totals and category subtotals.

## Run locally

From the repository root, run `python3 -m http.server 8000` and open [the library](http://localhost:8000/). GitHub Pages serves the same files from the root of the main branch.

The [native components](components/redadv.js) use [components.css](styles/components.css). To embed a component in Astro, use [MatchPulse.astro](components/Redadv.astro). Fonts and their licences are in [assets/fonts](assets/fonts).

## Project files

The site has three pages: the [component library](index.html), [reports](reports/index.html) and [project cards](project-cards/index.html). Artwork downloads live in [assets/project-cards](assets/project-cards/). The shared 404 page forwards bookmarks from former site paths.

The root [licence](LICENSE.txt) covers the original aggregate research dataset and its documentation.

[Red Half Lab blog](https://redhalflab.com/en/blog) · [REDS reports](https://redhalflab.com/en/reds)
