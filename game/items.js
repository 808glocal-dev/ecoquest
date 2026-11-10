/** 뽀송별 수집품: 기존 Firebase 포인트와 무관한 기기별 꾸미기 데이터. */
export const COLLECT={
 forest:{id:'leaf',name:'초록숨 잎사귀',emoji:'🍃',description:'숲을 걷다가 발견한 잎사귀'},
 ocean:{id:'shell',name:'물결퐁 조개',emoji:'🐚',description:'물가에서 주운 작은 조개'},
 wind:{id:'feather',name:'바람솜 깃털',emoji:'🪶',description:'언덕에 내려앉은 깃털'},
 home:{id:'ribbon',name:'반짝집 리본',emoji:'🎀',description:'골목의 작은 선물'},
 food:{id:'apple',name:'소풍식탁 사과',emoji:'🍎',description:'과수원에서 발견한 사과'},
 sharing:{id:'flower',name:'나눔마을 꽃',emoji:'🌷',description:'마을길의 꽃'},
 quiet:{id:'star',name:'별빛 조각',emoji:'✨',description:'밤길에서 반짝인 조각'}
};
export const DECOR=[
 {id:'mat',name:'꽃무늬 돗자리',emoji:'🧺',kind:'explore',cost:{leaf:2,flower:1},desc:'나만의 쉼터에 포근한 돗자리'},
 {id:'sea-pot',name:'바다빛 화분',emoji:'🪸',kind:'explore',cost:{shell:2,feather:1},desc:'물결을 닮은 작은 화분'},
 {id:'chair',name:'나무 의자',emoji:'🪑',kind:'explore',cost:{apple:2,ribbon:1},desc:'가만히 앉아 있어도 좋은 의자'},
 {id:'lamp',name:'밤하늘 조명',emoji:'🏮',kind:'explore',cost:{star:2,leaf:1},desc:'별빛이 있는 작은 조명'},
 {id:'mission-plant',name:'실천의 새싹 화분',emoji:'🪴',kind:'mission',desc:'AI 환경 인증을 성공하면 받는 장식'},
 {id:'mission-lamp',name:'맑은별 등불',emoji:'💡',kind:'mission',desc:'환경 인증을 성공하면 받는 장식'}
];
function key(uid){return 'pposong-items-v4:'+String(uid||'guest')}
export function loadBag(uid){try{const raw=JSON.parse(localStorage.getItem(key(uid))||'{}');return {materials:raw.materials||{},collected:Array.isArray(raw.collected)?raw.collected:[],owned:Array.isArray(raw.owned)?raw.owned:[],placed:Array.isArray(raw.placed)?raw.placed:[],awards:Array.isArray(raw.awards)?raw.awards:[]}}catch{return {materials:{},collected:[],owned:[],placed:[],awards:[]}}}
export function saveBag(uid,bag){localStorage.setItem(key(uid),JSON.stringify(bag))}
export function findDecor(id){return DECOR.find(x=>x.id===id)}
export function canCraft(bag,item){return item.kind==='explore'&&Object.entries(item.cost||{}).every(([k,n])=>(bag.materials[k]||0)>=n)}
export function craft(bag,item){if(bag.owned.includes(item.id)||!canCraft(bag,item))return false;Object.entries(item.cost).forEach(([k,n])=>bag.materials[k]-=n);bag.owned.push(item.id);return true}
export function collect(bag,key,world){if(bag.collected.includes(key)||!COLLECT[world])return false;bag.collected.push(key);const item=COLLECT[world];bag.materials[item.id]=(bag.materials[item.id]||0)+1;return item}
export function awardVerified(bag,missionId){if(bag.awards.includes(missionId))return null;bag.awards.push(missionId);const item=DECOR.filter(x=>x.kind==='mission')[bag.awards.length%2];if(!bag.owned.includes(item.id))bag.owned.push(item.id);return item}
