(() => {
  'use strict';
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const {icon,showDialog,closeDialog}=window.RedadvUI;
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
  function artwork(s){
    if(!s)return {};
    const match=s.match, next=s.matchday.fixtures.find(f=>f.kind==='next');
    const form=s.state.single, style=s.style.forecasts[0], review=s.review.single[0], check=s.calibration.single.rows[0];
    const scores=s.players.scores.items.filter(p=>Number.isFinite(p.prediction)).slice(0,2);
    const pathPlayer=scores[0] || s.players.scores.items.find(p=>p.history?.length);
    const defense=s.players.clearance_blocks.items.filter(p=>Number.isFinite(p.prediction)).slice(0,2);
    const keeper=s.players.keeper_shot_value.items.find(p=>Number.isFinite(p.prediction));
    const short=next?esc(match.homeCode)+' <i>vs</i> '+esc(match.awayCode):'To be announced';
    const num=(n,d)=>Number.isFinite(n)?n.toFixed(d):'—';
    const artEmpty=(cls,title)=>'<div class="'+cls+'"><span>'+title+'</span><strong>Awaiting forecast</strong></div>';
    const trend=(pathPlayer?.history||[]).filter(p=>Number.isFinite(p.estimate)).slice(-10);
    const lastSeason=s.archive.single.at(-1)?.season;
    return {
      matchday:'<div class="art-fixture"><span>Next match · UTC+8</span><strong>'+short+'</strong><b>'+esc(next?.kickoff||'')+'</b></div>',
      archive:'<div class="art-log"><span>Season archive</span><strong>'+(lastSeason?lastSeason+' / '+String(lastSeason+1).slice(-2):'—')+'</strong><div><i></i><i></i><i></i></div></div>',
      calibration:check?'<div class="art-compare"><span>'+esc(check.fixture)+'</span>'+[['Pre-match forecast',check.point],['Actual total',check.actual]].map(([name,n])=>'<div>'+name+' <i style="width:'+Math.min(100,Number(n)||0)+'%"></i>'+num(n,1)+'</div>').join('')+'</div>':artEmpty('art-compare','Match review'),
      players:scores.length?'<div class="art-rank">'+scores.map((p,i)=>'<div><i>0'+(i+1)+'</i><strong>'+esc(p.name)+'</strong><b>'+num(p.prediction,1)+'%</b></div>').join('')+'</div>':artEmpty('art-fixture','Premier League scorers'),
      form:'<div class="art-state"><div><span>Team form forecast</span><strong>'+num(form?.point,0)+'<small> / 100</small></strong></div><div class="art-gauge">'+(form?.window?'<i style="left:'+form.window[0]+'%;width:'+(form.window[1]-form.window[0])+'%"></i>':'')+(Number.isFinite(form?.point)?'<b style="left:'+form.point+'%"></b>':'')+'</div></div>',
      review:review?'<div class="art-ticket"><div><span>Liverpool / '+esc(review.fixtures[0]?.opponent)+'</span><strong>'+num(review.actual,1)+'<small> pts</small></strong></div><b class="ticket-'+(review.hit==null?'pending':review.hit?'hit':'miss')+'">'+esc(review.hit==null?'Pending':review.hit?'In range':'Outside range')+'</b><div class="art-ticket-dashes"></div></div>':artEmpty('art-log','Post-match review'),
      trajectory:pathPlayer?'<div class="art-chart"><div><strong>'+esc(pathPlayer.name)+'</strong><span>Scoring probability</span></div><svg class="art-lines" viewBox="0 0 200 50"><polyline points="'+trend.map((h,i)=>(3+194*i/Math.max(1,trend.length-1))+','+(48-h.estimate*.46)).join(' ')+'" fill="none" stroke="currentColor" stroke-width="3"/></svg></div>':artEmpty('art-chart','Player trends'),
      defense:defense.length?'<div class="art-defense"><strong>Clearances and blocks</strong>'+defense.map(p=>'<div><span>'+esc(p.name)+'</span><i style="width:'+Math.min(100,p.prediction*7)+'%"></i><b>'+num(p.prediction,2)+'</b></div>').join('')+'</div>':artEmpty('art-defense','Defensive actions'),
      keeper:keeper?'<div class="art-keeper"><span>'+esc(keeper.name)+'</span><strong>'+num(keeper.prediction,2)+'<small> goals</small></strong><div><i></i><b></b></div></div>':artEmpty('art-keeper','Goalkeeper forecast'),
      style:style?'<div class="art-style"><span>vs '+esc(style.opponent)+'</span><strong>'+esc((style.label||'Awaiting forecast').split(', ')[0])+'</strong><small>Style confidence '+num(style.confidence*100,0)+'%</small></div>':artEmpty('art-style','Match style'),
      discipline:'<div class="art-cards"><i></i><b></b><span>'+num(s.cards.expected,2)+'<small>Expected bookings / cards</small></span></div>',
      match:'<div class="art-match"><span>'+short+'</span><div></div></div>'
    };
  }
  function start(sample){
  let gallery=catalog(sample), art=artwork(sample);
  const $=s=>document.querySelector(s);
  const grid=$('#cards'),dlg=$('#library-dialog'),filterEl=$('.filter');
  const known=new Set(gallery.map(c=>c.key)), storageKey='match-pulse:kit:favorites:v1';
  function readSaved(){try {const a=JSON.parse(localStorage.getItem(storageKey)||'[]');return new Set((Array.isArray(a)?a:[]).filter(x=>known.has(x)));}catch{return new Set();}}
  let saved=readSaved(),filter='All',savedView=false;
  const filters=['All','Pre-match','Players','Post-match'];
  const announce=t=>{$('#announce').textContent=t;};
  $('[data-guide]').querySelector('i').outerHTML=icon('book');
  $('[data-dismiss]').innerHTML=icon('close');
  $('.featured mp-match').data=sample?.match;
  function render(){
    $('#saved-count').textContent=String(saved.size);
    $('#page-title').innerHTML=(savedView?'Saved components':'Matchday components')+'<span>.</span>';
    $('#page-description').textContent=savedView?'Your saved components on this device.':'Explore Liverpool fixtures, player forecasts and match reviews.';
    document.querySelector('.featured').hidden=savedView;
    document.querySelectorAll('[data-view]').forEach(a=>{
      if(a.dataset.view===(savedView?'saved':'all')) a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
    });
    const base=gallery.filter(c=>!savedView||saved.has(c.key));
    const items=base.filter(c=>filter==='All'||c.group===filter);
    filterEl.innerHTML=filters.map(t=>'<button data-filter="'+t+'" type="button" aria-pressed="'+(filter===t)+'">'+t+'</button>').join('');
    $('#result-count').textContent=String(items.length);
    grid.innerHTML=items.map(c=>'<article class="catalog-card"><button type="button" data-open="'+c.key+'" class="tile" aria-label="Open '+c.name+'"><div aria-hidden="true" class="art art-'+c.key+'-bg">'+(art[c.key]||icon(c.group==='Players'?'users':c.group==='Post-match'?'receipt':'field'))+'</div><div class="card-copy"><div class="card-category"><i></i>'+c.group+'</div><div class="card-title"><h3>'+c.name+'</h3>'+icon('diagonal')+'</div><p>'+c.text+'</p></div></button><button type="button" class="save" data-save="'+c.key+'" aria-label="'+(saved.has(c.key)?'Unsave ':'Save ')+c.name+'" title="'+(saved.has(c.key)?'Unsave ':'Save component')+'" aria-pressed="'+saved.has(c.key)+'">'+icon('bookmark')+'</button></article>').join('');
    if(!items.length)grid.innerHTML='<div class="empty-library">'+icon('bookmark')+'<h3>'+(saved.size===0&&savedView?'No saved components yet':'No saved components in this category')+'</h3><p>Use the bookmark on any component to save it here.</p><a href="#all">Browse components '+icon('arrow')+'</a></div>';
  }
  function selectView(){
    savedView=location.hash==='#saved';filter='All';render();
  }
  function displayDialog(category,title,element,content=''){
    $('#dialog-category').textContent=category;$('#dialog-title').textContent=title;
    const body=dlg.querySelector('.dialog-body');body.replaceChildren();
    if(element)body.append(element);else body.innerHTML=content;
    showDialog(dlg);
  }
  function showComponent(c) {
    if (dlg.open) dlg.close();
    const el=document.createElement('mp-'+c.key);
    el.data=c.data;
    displayDialog(c.group+' / Component',c.name,el);
  }
  grid.addEventListener('click',e=>{
    const open=e.target.closest('[data-open]'),save=e.target.closest('[data-save]');
    if(open) showComponent(gallery.find(x=>x.key===open.dataset.open));
    if(save){
      const key=save.dataset.save,title=gallery.find(x=>x.key===key).name;
      if(saved.has(key))saved.delete(key);else saved.add(key);
      let persistent=true;
      try{localStorage.setItem(storageKey,JSON.stringify([...saved]));}catch{persistent=false;}
      render();
      const activeSave=grid.querySelector('[data-save="'+key+'"]');
      if (saved.has(key)) activeSave?.classList.add('mp-just-saved');
      (activeSave||grid.querySelector('button,a'))?.focus({preventScroll:true});
      announce((saved.has(key)?'Saved ':'Removed ')+title+(persistent?'':' for this session only'));
    }
  });
  filterEl.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    filter=b.dataset.filter;render();filterEl.querySelector('[aria-pressed=true]').focus({preventScroll:true});
    announce(filter+' ·  '+$('#result-count').textContent+'  components');
  });
  document.querySelectorAll('[data-view],.brand').forEach(a=>a.addEventListener('click',e=>{
    if(location.hash===a.hash){e.preventDefault();selectView();window.scrollTo(0,0);}
  }));
  function route() {
    const component=gallery.find(c=>location.hash==='#'+c.key);
    if(component) { if(!dlg.open) showComponent(component); else {
      $('#dialog-category').textContent=component.group+' / Component';
      $('#dialog-title').textContent=component.name;
      const el=document.createElement('mp-'+component.key);el.data=component.data;
      dlg.querySelector('.dialog-body').replaceChildren(el);
      showDialog(dlg);
    } } else if(['#all','#saved',''].includes(location.hash)) {
      if(dlg.open) dlg.close();
      selectView();window.scrollTo(0,0);
    }
  }
  window.addEventListener('hashchange',route);
  window.addEventListener('storage',e=>{if(e.key===storageKey){saved=readSaved();render();}});
  $('[data-guide]').onclick=()=>displayDialog('redadv','Guide',null,'<div class="usage"><section><h3>Browse components</h3><p>Filter the library by match stage or player. Open any card to explore it. Press Esc to return to the library.</p></section><section><h3>Save a component</h3><p>Use a bookmark to add a card to Saved. Bookmarks stay in this browser.</p></section><section><h3>Match data</h3><p>'+(location.protocol==='file:'?'Showing the offline sample from 21 November 2026.':publishedFeed?'Fixture changes, forecasts and results sync automatically from Red Half Lab. This page checks for updates every 30 seconds.':'Fixtures and reports are read from local match data. This page checks for updates every 30 seconds.')+' All kick-off times are UTC+8.</p></section></div>');
  $('[data-dismiss]').onclick=()=>closeDialog(dlg);
  dlg.addEventListener('click',e=>{if(e.target===dlg)closeDialog(dlg);});
  dlg.addEventListener('close',()=>{
    if(dlg.open) return;
    dlg.querySelector('.dialog-body').replaceChildren();
    if(known.has(location.hash.slice(1))) history.replaceState(null,'',location.pathname+location.search+(savedView?'#saved':'#all'));
  });
  selectView();
  route();
  return updated=>{
    gallery=catalog(updated);art=artwork(updated);
    const hero=document.querySelector('.featured mp-match');
    hero.updateLive(updated?.match);
    const widget=dlg.querySelector(':scope > .dialog-body > .mp-widget');
    const entry=widget && gallery.find(c=>'mp-'+c.key===widget.localName);
    if(entry){if(widget.data)widget.updateLive(entry.data);else widget.data=entry.data;}
    render();
  };
  }
  const tag=document.querySelector('.local-tag');
  const update=start(null);
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
        for(const route of [group,...(group.variants||[])]){
          const previousGame=group.nextFixture;
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
