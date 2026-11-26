(() => {
  'use strict';
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const {icon,showDialog,closeDialog,sameGame}=window.RedadvUI;
  const publishedFeed=document.documentElement.dataset.publishedFeed;
  const components=[
    {key:'matchday',name:'Match centre',group:'Pre-match',text:'Browse fixtures, forecasts and final scores across competitions.',read:s=>(s.matchday)},
    {key:'players',name:'Players to watch',group:'Players',text:'Explore goalscorer and assist picks for each match.',read:s=>({groups:s.players,fixtures:s.matchday.fixtures})},
    {key:'form',name:'Team form',group:'Pre-match',text:'Explore single-match and three-match form forecasts.',read:s=>(s.state)},
    {key:'archive',name:'Season archive',group:'Post-match',text:'Compare match totals and three-match averages by season.',read:s=>(s.archive)},
    {key:'calibration',name:'Forecast checks',group:'Post-match',text:'Check form, playing style and discipline against the results.',read:s=>(s.calibration)},
    {key:'review',name:'Match review',group:'Post-match',text:'See whether the final score fell inside the pre-match range.',read:s=>(s.review)},
    {key:'trajectory',name:'Player trends',group:'Players',text:'Pick a player and trace forecasts and results across fixtures.',read:s=>({groups:s.players,matchday:s.matchday})},
    {key:'defense',name:'Defenders',group:'Players',text:'Compare tackles, clearances and blocks across the defence.',read:s=>({groups:{clearance_blocks:s.players.clearance_blocks,tackles:s.players.tackles},matchday:s.matchday})},
    {key:'keeper',name:'Goalkeepers',group:'Players',text:'Explore goals prevented, forecast intervals and match results.',read:s=>({groups:{keeper_shot_value:s.players.keeper_shot_value},matchday:s.matchday})},
    {key:'style',name:'Match style',group:'Pre-match',text:'Explore playing styles across three fixtures and review earlier calls.',read:s=>(s.style)},
    {key:'discipline',name:'Cards and discipline',group:'Pre-match',text:'Explore booking forecasts and review completed matches.',read:s=>(s.cards)},
    {key:'match',name:'Fixture card',group:'Pre-match',text:'See the next kick-off, available score predictions and player picks.',read:s=>(s.match)}
  ];
  const catalog=s=>components.map(c=>({...c,data:s?c.read(s):null}));
  const tag=document.querySelector('.local-tag');
  function update(sample) {
    window.redadvPublishedComponents = catalog(sample);
    window.dispatchEvent(new Event('component-feed'));
  }
  let hasData=false, etag, cutoff, kickoffTimer, loading=false, lastSync;
  function badge(text){tag.replaceChildren(document.createElement('b'),document.createTextNode(' '+text));}
  function connect(s){
    const d=s.matchday;
    const keys=new Set(d.fixtures.filter(g=>g.kind==='played').map(g=>g.date+'|'+g.opponent));
    Object.assign(d,{groups:s.players,state:s.state,style:s.style,cards:s.cards,
      archive:{single:s.archive.single.filter(r=>keys.has(r.date+'|'+r.opponent))}});
    s.review.archive=s.archive;
    for(const view of [s.state,s.style,s.cards])view.calibration=s.calibration;
    if(!s.match)s.match={unscheduled:true};
    s.match.matchday=d;
    return s;
  }
  // A published forecast belongs to its fixture even after the schedule advances.
  function advanceSchedule(s, now) {
    const d=s.matchday, previous=d.fixtures.find(f=>f.kind==='next');
    const scheduled=d.fixtures.filter(f=>f.kind==='next'||f.kind==='scheduled')
      .sort((a,b)=>a.timestamp-b.timestamp);
    const future=scheduled.filter(f=>f.timestamp*1000>now);
    const next=future[0], league=future.find(f=>f.comp==='GB1');
    for(const f of scheduled) f.kind=f.timestamp*1000<=now?'awaiting':f===next?'next':'scheduled';
    d.fixtures=[...future,...d.fixtures.filter(f=>f.kind==='awaiting'||f.kind==='played')
      .sort((a,b)=>b.timestamp-a.timestamp)];
    if(next?.id!==previous?.id || !s.match){
      if(!next)s.match={unscheduled:true};
      else {
        const name=next.opponent, code=next.code||name, home=next.home===true;
        const instant=new Date(next.timestamp*1000);
        const date=instant.toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'Asia/Shanghai'});
        const year=instant.toLocaleDateString('en-GB',{year:'numeric',timeZone:'Asia/Shanghai'});
        const route=next.routes?.[d.defaultModel];
        s.match={home:home?'Liverpool':name,away:home?name:'Liverpool',homeCode:home?'LIV':code,
          awayCode:home?code:'LIV',league:next.competition,leagueEn:next.competition,status:'Next match',
          date,time:next.kickoff.slice(11,16),zone:'UTC+8',location:home?'Home':'Away',posterDate:(date+' '+year).toUpperCase(),
          picks:(next.score||[]).flatMap((score,i)=>score?.length===2?[{
            label:i?'Alternative score':'Primary score',score:home?score:[...score].reverse(),
            scorers:(route?.scorers?.[i?'backup':'main']||[]).map(p=>p.name)
          }]:[])};
      }
    }
    const upcoming=row=>future.some(f=>f.date===row.date && f.opponent===row.opponent);
    s.style.forecasts=s.style.forecasts.filter(upcoming);
    s.state.styles=s.state.styles.filter(upcoming);
    if((league?.id??null)!==d.leagueId){
      d.leagueId=league?.id??null;
      for(const scope of ['single','three']){
        const first=s.state[scope]?.fixtures?.[0];
        if(!league || first?.date!==league.date || first?.opponent!==league.opponent)s.state[scope]=null;
      }
      if(s.cards.kickoff!==league?.kickoff)Object.assign(s.cards,{fixture:league?'vs '+league.opponent:'No upcoming Premier League fixture',
        kickoff:league?.kickoff,locked:null,expected:null,zero:null,red:null});
      for(const group of Object.values(s.players)){
        if(league && sameGame(group.nextFixture,league))continue;
        const previousGame=d.fixtures.find(f=>(f.kind==='awaiting'||f.kind==='played') && sameGame(group.nextFixture,f));
        for(const route of [group,...(group.variants||[])]){
          for(const p of route.items||[]){
            if(previousGame && Number.isFinite(p.prediction) && !(p.history||[]).some(h=>h.date===previousGame.date && h.opponent===previousGame.opponent)){
              (p.history??=[]).push({date:previousGame.date,opponent:previousGame.opponent,estimate:p.prediction,low:p.low,high:p.high});
            }
            delete p.prediction;delete p.low;delete p.high;delete p.kind;
          }
        }
        for(const route of [group,...(group.variants||[])]){
          route.fixtureId=league?.id;route.nextFixture=league?{id:league.id,date:league.date,opponent:league.opponent,kickoff:league.kickoff}:null;
          route.fixtureLabel=league?'vs '+league.opponent:'No upcoming Premier League fixture';
        }
      }
    }
    return s;
  }
  let publishedEdition, publishedLabel;
  function applyEdition(source){
    const s=connect(source);
    update(s);
    hasData=true;
    cutoff=s.matchday.fixtures.find(f=>f.kind==='next')?.timestamp;
    clearTimeout(kickoffTimer);
    const delay=cutoff*1000-Date.now();
    if(delay>0 && delay<2147483000)kickoffTimer=setTimeout(refresh,delay+200);
    tag.dataset.partial=String(s.sync.partial);
  }
  function usePublishedEdition(){
    applyEdition(advanceSchedule(structuredClone(publishedEdition),Date.now()));
  }
  async function refresh(){
    if(loading || (hasData && document.hidden))return;
    loading=true;
    try{
      const feedURL=publishedFeed?new URL(publishedFeed,document.baseURI):'./api/live';
      if(publishedFeed)feedURL.searchParams.set('check',String(Math.floor(Date.now()/60000)));
      const response=await fetch(feedURL,{cache:'no-store',headers:etag?{'If-None-Match':etag}:{}});
      if(response.status!==304){
        if(!response.ok)throw new Error('feed unavailable');
        const source=await response.json();
        if(publishedFeed){
          if(!publishedEdition || source.sync.publishedAt!==publishedEdition.sync.publishedAt || (cutoff && cutoff*1000<=Date.now())){
            publishedEdition=source;
            const publication=new Date(source.sync.publishedAt);
            const label=source.sync.updateMode==='automatic'?'Data synced':'Published';
            publishedLabel=label+' · '+publication.toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Asia/Shanghai'})+' UTC+8';
            usePublishedEdition();
          }
        }else applyEdition(window.RedadvUI.englishData(source));
        etag=response.headers.get('ETag');
      }else if(publishedEdition && cutoff && cutoff*1000<=Date.now())usePublishedEdition();
      document.body.classList.remove('feed-unavailable','feed-loading');
      lastSync=new Date().toLocaleTimeString('en-GB',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit',hour12:false});
      badge(publishedLabel || (tag.dataset.partial==='true'?'Fixtures synced · Some reports pending':'Auto-updating')+' · '+lastSync);
    }catch{
      const expired=cutoff && Date.now()>=cutoff*1000;
      if(publishedEdition && hasData){
        if(expired)usePublishedEdition();
        badge(publishedLabel+' · Update check paused');
        return;
      }
      if(expired && hasData){update(null);hasData=false;etag=null;}
      document.body.classList.toggle('feed-unavailable',!hasData);
      if(expired)document.querySelectorAll('dialog[open]').forEach(d=>d.close());
      badge(hasData&&!expired?'Sync paused · Last checked '+lastSync:'Fixture feed unavailable · Retrying');
    }finally{loading=false;}
  }
  if(location.protocol==='file:'){
    const script=document.createElement('script');
    script.onerror=()=>badge('Offline sample unavailable');
    script.src='./preview/snapshot.js';script.onload=()=>{update(window.RedadvUI.englishData(window.MatchPulseSample));document.body.classList.remove('feed-loading');badge('Offline sample · 2026-11-21');};
    document.head.append(script);
  }else{
    refresh();
    window.setInterval(refresh,30000);
    document.addEventListener('visibilitychange',refresh);
    window.addEventListener('focus',refresh);
  }
})();
