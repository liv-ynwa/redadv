// Select the fields used by the product before embedding report data in public HTML or a snapshot.
const scalar = value => value == null || ['string','number','boolean'].includes(typeof value);
const list = project => values => Array.isArray(values) ? values.map(project) : [];
const byKey = project => values => Object.fromEntries(Object.entries(values || {}).map(([key,value]) => [key,project(value)]));
const numbers = list(value => typeof value === 'number' ? value : null);
const strings = list(value => typeof value === 'string' ? value : '');

function record(fields, children = {}) {
  const names = fields.split(' ').filter(Boolean);
  return value => {
    if (!value || typeof value !== 'object') return null;
    const out = {};
    for (const key of names) if (key in value && scalar(value[key])) out[key] = value[key];
    for (const [key,project] of Object.entries(children)) {
      if (value[key] != null) out[key] = project(value[key]);
    }
    return out;
  };
}

const fixture = record('id kind date kickoff opponent home horizon competition comp timestamp');
const prediction = record('kind point confidence hit locked_at', {window:numbers});
const forecast = record('point confidence locked_at', {window:numbers, fixtures:list(fixture)});
const subtotals = list(record('label points weight'));
const stateTotal = record('season date opponent state', {
  score:numbers, forecasts:list(prediction), matches:list(fixture), subtotals
});
const archive = record('', {
  single:list(stateTotal), three:list(stateTotal),
  legacy:list(record('locked', {rows:list(record('date opponent point actual', {window:numbers}))}))
});
const reviewRow = record('point confidence lockedLabel actual hit scoreline', {window:numbers, fixtures:list(fixture), subtotals});
const styleRow = record('date kickoff opponent label horizon confidence actual hit locked');
const cardRow = record('date opponent expected actual red zero redActual zeroActual locked');
const replayRow = record('fixture point confidence actual hit', {window:numbers});
const replays = record('', {
  single:record('label', {rows:list(replayRow)}),
  three:record('label', {rows:list(replayRow)}),
  style:record('label', {reviews:list(styleRow)}),
  discipline:record('label', {events:list(cardRow)})
});
const state = record('', {
  single:forecast, three:forecast, styles:list(styleRow), trend:list(record('date opponent value')), calibration:replays
});
const style = record('', {forecasts:list(styleRow), reviews:list(styleRow), calibration:replays});
const cards = record('fixture expected red zero kickoff locked', {history:list(cardRow), calibration:replays});

const point = record('date opponent estimate observed actual version low high');
const player = record('id name kind prediction low high historyOnly', {history:list(point), earlier:list(point)});
const routeFields = 'modelKey model label unit fixtureId fixtureLabel';
const roster = {items:list(player), pastPlayers:list(player), nextFixture:fixture};
const route = record(routeFields, roster);
const group = record(routeFields, {...roster, variants:list(route),
  observations:byKey(list(record('date opponent value beaten'))),
  markers:record('label', {rows:list(record('id date opponent'))})
});
const groups = byKey(group);
const candidate = record('name probability hit');
const picks = record('', {
  scorers:record('', {main:list(candidate), backup:list(candidate)}),
  assists:record('', {main:candidate, backup:candidate})
});
const matchFixture = record('id kind date kickoff opponent code home horizon competition comp timestamp', {
  score:list(numbers), actual:numbers, style:styleRow, routes:byKey(picks)
});
const matchday = record('defaultModel leagueId', {
  fixtures:list(matchFixture), models:list(record('key name')), groups, state, style, cards, archive
});
const playerView = record('target modelKey playerId fixtureDate fixtureOpponent unit label fixtureLabel', {
  groups, fixtures:list(fixture), matchday, nextFixture:fixture, player
});

const components = {
  matchday, archive, calibration:replays,
  match:record('home away homeCode awayCode league leagueEn location date time zone posterDate status unscheduled', {
    picks:list(record('label', {score:numbers, scorers:strings})),
    scorerProbabilities:byKey(n => typeof n === 'number' ? n : null), matchday
  }),
  players:value => value?.groups ? playerView(value) : groups(value),
  trajectory:playerView, defense:playerView, keeper:playerView,
  form:state, style, discipline:cards, review:record('', {single:list(reviewRow), three:list(reviewRow), archive})
};

export function publicComponentData(kind, value) {
  return value == null ? null : components[kind](value);
}
