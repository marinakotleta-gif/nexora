const tg=window.Telegram?.WebApp;tg?.expand();tg?.enableClosingConfirmation();

const SAVE_KEY='nexus_v1';
const defaultState={dust:0,taps:0,level:1,power:1,auto:0,autoCost:100,upgrades:0,owned:['moti'],selected:'moti',quests:{} };
let state=load();

function load(){try{return {...defaultState,...JSON.parse(localStorage.getItem(SAVE_KEY)||'{}')};}catch{return {...defaultState}}}
function save(){localStorage.setItem(SAVE_KEY,JSON.stringify(state));}
function fmt(n){if(n>=1e6)return(n/1e6).toFixed(1)+'M';if(n>=1e3)return(n/1e3).toFixed(1)+'K';return Math.floor(n).toString()}

const pets=[
 {id:'moti',name:'Моти',emoji:'🐻',cost:0,auto:0},
 {id:'lumi',name:'Луми',emoji:'🦊',cost:250,auto:1},
 {id:'bubu',name:'Бубу',emoji:'🐰',cost:800,auto:3},
 {id:'nori',name:'Нори',emoji:'🐼',cost:2500,auto:8}
];

const quests=[
 {id:'tap100',title:'Сделай 100 касаний',goal:100,type:'taps',reward:100},
 {id:'dust500',title:'Накопи 500 пыли',goal:500,type:'dust',reward:250},
 {id:'level5',title:'Достигни уровня 5',goal:5,type:'level',reward:500}
];

const dustEl=document.querySelector('#dust');
const tapBtn=document.querySelector('#tapBtn');

function render(){
 dustEl.textContent=fmt(state.dust);
 document.querySelector('#tapPower').textContent='+'+fmt(state.power);
 document.querySelector('#autoRate').textContent=fmt(state.auto)+'/сек';
 document.querySelector('#level').textContent=state.level;
 document.querySelector('#upgradeCost').textContent=fmt(25*Math.pow(2,state.upgrades));
 document.querySelector('#playerName').textContent=tg?.initDataUnsafe?.user?.first_name||'Исследователь';
 document.querySelector('#playerStats').textContent=`Уровень ${state.level} • ${fmt(state.dust)} пыли`;
 renderPets();renderQuests();
}

function autoIncome(){state.auto=pets.filter(p=>state.owned.includes(p.id)).reduce((sum,p)=>sum+p.auto,0);}
function addDust(amount){state.dust+=amount;render();}

setInterval(()=>{if(state.auto>0){addDust(state.auto);save()}},1000);

tapBtn.addEventListener('pointerdown',e=>{ 
 state.dust+=state.power;state.taps++; 
 const nextLevel=Math.floor(state.taps/250)+1;if(nextLevel>state.level)state.level=nextLevel;
 const float=document.createElement('div');float.className='float-score';float.textContent='+'+state.power;
 float.style.left=e.clientX+'px';float.style.top=e.clientY+'px';document.body.appendChild(float);
 setTimeout(()=>float.remove(),700);tg?.HapticFeedback?.impactOccurred('light');save();render();
});

document.querySelector('#upgradeBtn').addEventListener('click',()=>{
 const cost=25*Math.pow(2,state.upgrades);if(state.dust<cost)return tg?.HapticFeedback?.notificationOccurred('error');
 state.dust-=cost;state.upgrades++;state.power+=1;tg?.HapticFeedback?.notificationOccurred('success');save();render();
});

function renderPets(){
 const grid=document.querySelector('#petGrid');grid.innerHTML='';
 document.querySelector('#homePets').innerHTML='';
 pets.forEach(p=>{
  const owned=state.owned.includes(p.id);
  const card=document.createElement('div');card.className='pet-card';
  card.innerHTML=`<div class="emoji">${p.emoji}</div><b>${p.name}</b><small>${p.auto?'+'+p.auto+'/сек':'Стартовый друг'}</small><button>${owned?(state.selected===p.id?'Выбран':'Выбрать'):p.cost+' ✦'}</button>`;
  card.querySelector('button').onclick=()=>{if(owned){state.selected=p.id}else if(state.dust>=p.cost){state.dust-=p.cost;state.owned.push(p.id)}else{return tg?.HapticFeedback?.notificationOccurred('error')};autoIncome();save();render();};
  grid.appendChild(card);
  if(owned){const mini=document.createElement('div');mini.className='mini-pet';mini.textContent=p.emoji;document.querySelector('#homePets').appendChild(mini)}
 });
}

function renderQuests(){
 const list=document.querySelector('#questList');list.innerHTML='';
 quests.forEach(q=>{
  const value=q.type==='taps'?state.taps:q.type==='dust'?state.dust:state.level;
  const complete=value>=q.goal;const claimed=state.quests[q.id];
  const el=document.createElement('div');el.className='quest'+(claimed?' claimed':'');
  el.innerHTML=`<b>${q.title}</b><div><small>${Math.min(value,q.goal)} / ${q.goal}</small>${!claimed&&complete?`<button>Получить ${q.reward} ✦</button>`:''}</div>`;
  const button=el.querySelector('button');if(button)button.onclick=()=>{state.quests[q.id]=true;state.dust+=q.reward;tg?.HapticFeedback?.notificationOccurred('success');save();render();};
  list.appendChild(el);
 });
}

for(const btn of document.querySelectorAll('[data-tab]'))btn.addEventListener('click',()=>{
 document.querySelectorAll('[data-tab]').forEach(b=>b.classList.remove('active'));document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));btn.classList.add('active');document.querySelector('#'+btn.dataset.tab).classList.add('active');
});
document.querySelectorAll('[data-goto]').forEach(b=>b.onclick=()=>document.querySelector(`[data-tab="${b.dataset.goto}"]`).click());

document.querySelector('#resetBtn').onclick=()=>{if(confirm('Сбросить весь прогресс?')){state={...defaultState,owned:['moti'],quests:{}};save();autoIncome();render()}};

autoIncome();render();
