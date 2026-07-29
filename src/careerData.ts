export const CAREER_DATA_VERSION = '2025-26-snapshot-1';

export type TeamRegion = 'Europe' | 'Americas' | 'Asia';
export type PlayerRole = 'igl' | 'awper' | 'entry' | 'rifler' | 'support';
export interface RosterPlayer { id: string; nick: string; role: PlayerRole; }
export interface CareerTeam { id: string; name: string; region: TeamRegion; baseRank: number; strength: number; roster: RosterPlayer[]; }
export type TournamentTier = 'unranked' | 'T2' | 'T1' | 'Major';
export type HonorClass = 'medium' | 'large' | 'elite' | 'super-elite' | 'major';
export interface TournamentDefinition { id: string; name: string; organizer: string; tier: TournamentTier; honorClass: HonorClass; format: 'BO1/BO3' | 'BO3' | 'BO3/BO5'; region?: TeamRegion; }

const roleOrder: PlayerRole[] = ['igl', 'awper', 'entry', 'rifler', 'support'];
const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const rows: Array<[string, TeamRegion, string]> = [
  ['Vitality','Europe','apEX,ZywOo,flameZ,ropz,mezii'],['Spirit','Europe','chopper,sh1ro,donk,zont1x,magixx'],['MOUZ','Europe','Brollan,torzsi,xertioN,Jimpphat,Spinx'],['Falcons','Europe','kyxsan,m0NESY,kyousuke,NiKo,TeSeS'],
  ['Natus Vincere','Europe','Aleksib,w0nderful,iM,b1t,makazze'],['The MongolZ','Asia','bLitz,910,Senzu,Techno,mzinho'],['FURIA','Americas','FalleN,molodoy,YEKINDAR,KSCERATO,yuurih'],['Aurora','Europe','MAJ3R,woxic,Wicadia,XANTARES,jottAAA'],
  ['G2','Europe','huNter-,SunPayus,malbsMd,HeavyGod,MATYS'],['FaZe','Europe','karrigan,broky,jcobbb,frozen,Twistzz'],['Liquid','Americas','siuhy,ultimate,NertZ,NAF,EliGE'],['Astralis','Europe','HooXi,device,jabbi,stavn,Magisk'],
  ['Virtus.pro','Europe','electroNic,ICY,FL1T,fame,Perfecto'],['3DMAX','Europe','bodyy,Maka,Ex3rcice,Lucky,Graviti'],['GamerLegion','Europe','ztr,sl3nd,Tauson,REZ,PR'],['paiN','Americas','biguzera,nqz,kauez,snow,dav1deuS'],
  ['HEROIC','Europe','LNZ,Alkaren,yxngstxr,nilo,sjuush'],['Complexity','Americas','JT,hallzerk,cxzi,Grim,floppy'],['BIG','Europe','tabseN,hyped,prosus,Krimbo,JDC'],['SAW','Europe','MUTiRiS,story,ewjerkz,arrozdoce,krazy'],
  ['Ninjas in Pyjamas','Europe','Snappi,r1nkle,xKacpersky,ewjerkz,sjuush'],['B8','Europe','npl,headtr1ck,alex666,kensizor,esenthial'],['PARIVISION','Europe','Jame,AW,BELCHONOKK,xiELO,nota'],['Legacy','Americas','lux,saadzin,latto,dumau,n1ssim'],
  ['MIBR','Americas','exit,saffee,insani,brnz4n,drop'],['Imperial','Americas','VINI,try,felipeyu,noway,skullz'],['FlyQuest','Asia','dexter,regali,Vexite,Liazz,nettik'],['Lynn Vision','Asia','westmelon,Nelly,Starry,z4kr,EmiliaQAQ'],
  ['TYLOO','Asia','Attacker,Jee,Moseyuh,JamYoung,Mercury'],['Rare Atom','Asia','Summer,kaze,ChildKing,somebody,L1haNg'],['BetBoom','Europe','Boombl4,zorte,Magnojez,Ax1Le,S1ren'],['fnatic','Europe','fear,jambo,jackasmo,blameF,KRIMZ'],
  ['ENCE','Europe','gla1ve,podi,Neityu,sdy,xKacpersky'],['OG','Europe','Chr1zN,nicoodoz,adamb,spooke,arrozdoce'],['Passion UA','Europe','fear,jambo,jackasmo,DemQQ,zeRRoFIX'],['Wildcard','Americas','stanislaw,phzy,susp,Sonic,JBa'],
  ['M80','Americas','s1n,slaxz-,Swisher,reck,Lake'],['NRG','Americas','nitr0,oSee,HexT,autimatic,br0'],['9z','Americas','max,MartinezSa,HUASOPEEK,dgt,buda'],['Fluxo','Americas','arT,zevy,Lucaozy,kye,nicks'],
  ['BESTIA','Americas','tomaszin,TumaS,luchov,naz,zock'],['Sharks','Americas','rdnzao,gafolo,doc,koala,hoax'],['ODDIK','Americas','WOOD7,naitte,matios,tuurtle,venomzera'],['RED Canids','Americas','destiny,nython,venomzera,dav1deuS,drop'],
  ['ATOX','Asia','kabal,AccuracyTG,MiQ,dobu,Zesta'],['Chinggis Warriors','Asia','nin9,ariucle,controlez,hasteka,sk0R'],['IHC','Asia','dobu,Annihilation,Techno,bLitz,kabal'],['JiJieHao','Asia','facecrack,m1N1,ISSAA,D0cC,Aaron'],
  ['Steel Helmet','Asia','captainMo,xiaosaGe,AE,DD,Nighttime'],['Rooster','Asia','asap,chelleos,TjP,ADK,dangeR'],['SemperFi','Asia','HUGHMUNGUS,sterling,vision,Valhalla,motion'],['Alter Ego','Asia','BnTeT,xccurate,bali,frizz,WasteOfAmmo'],
  ['ECSTATIC','Europe','Patti,Kristou,TMB,Queenix,Anlelele'],['Nemiga','Europe','1eeR,Xant3r,zweih,khaN,riskyb0b'],['Sangal','Europe','LNZ,soulfly,jottAAA,xfl0ud,yxngstxr'],['Metizport','Europe','hampus,nawwk,adamb,isak,susp'],
  ['Alliance','Europe','avid,PlesseN,bobeksde,twist,eraa'],['Monte','Europe','kRaSnaL,hades,KEi,DemQQ,F1KU'],['AMKAL','Europe','Forester,ICY,Krad,TRAVIS,Sdaim'],['SINNERS','Europe','SHOCK,oskar,NEOFRAG,MoriiSko,beastik'],
  ['Endpoint','Europe','MiGHTYMAX,CRUC1AL,cej0t,AZUWU,Surreal'],['KOI','Europe','alex,stadodo,mopoz,JUST,dav1g'],['Iberian Soul','Europe','alex,smooya,mopoz,sausol,dav1g'],['TNL','Europe','sorrow,shield,sFade8,coolio,leen'],
];

const reservedRanks: Record<string, number> = { 'The MongolZ':9,TYLOO:87,'Lynn Vision':88,'Rare Atom':89,FlyQuest:90,ATOX:91,'Chinggis Warriors':92,IHC:93,JiJieHao:94,'Steel Helmet':95,Rooster:96,SemperFi:97,'Alter Ego':98 }; 
const reserved = new Set(Object.values(reservedRanks));
const freeRanks = Array.from({ length: 100 }, (_, index) => index + 1).filter(rank => !reserved.has(rank));
let nextRank = 0;
const realTeams: CareerTeam[] = rows.map(([name, region, playerList], index) => {
  const baseRank = reservedRanks[name] ?? freeRanks[nextRank++];
  return {
    id: `team-${String(index + 1).padStart(3, '0')}-${slug(name)}`,
    name, region, baseRank, strength: Math.max(30, 100 - baseRank * .68),
    roster: playerList.split(',').map((nick, playerIndex) => ({ id: `${slug(name)}-${slug(nick) || playerIndex}`, nick, role: roleOrder[playerIndex] })),
  };
});
const remainingRanks = freeRanks.slice(nextRank);
const fictionalRegions: TeamRegion[] = ['Europe','Americas','Asia'];
const fictionalTeams: CareerTeam[] = remainingRanks.slice(0,Math.max(0,100-realTeams.length)).map((baseRank, index) => {
  const region = fictionalRegions[index % fictionalRegions.length];
  const name = `${region === 'Europe' ? 'Continental' : region === 'Americas' ? 'Frontier' : 'Pacific'} Squad ${String(index + 1).padStart(2,'0')}`;
  return { id:`team-${String(realTeams.length + index + 1).padStart(3,'0')}-${slug(name)}`, name, region, baseRank, strength:Math.max(26,100-baseRank*.68), roster:roleOrder.map((role,playerIndex)=>({id:`fictional-${index}-${playerIndex}`,nick:`Player${baseRank}_${playerIndex+1}`,role})) };
});
export const CAREER_TEAMS: CareerTeam[] = [...realTeams, ...fictionalTeams].sort((a,b)=>a.baseRank-b.baseRank);

export const TOURNAMENTS: TournamentDefinition[] = [
  { id:'esi-katowice', name:'EIM 卡托维兹站', organizer:'ESI', tier:'T1', honorClass:'super-elite', format:'BO3/BO5' },
  { id:'esi-cologne', name:'EIM 科隆站', organizer:'ESI', tier:'T1', honorClass:'super-elite', format:'BO3/BO5' },
  { id:'esi-chengdu', name:'EIM 成都站', organizer:'ESI', tier:'T1', honorClass:'elite', format:'BO3/BO5', region:'Asia' },
  { id:'ecl', name:'ESI 冠军联赛', organizer:'ESI', tier:'T1', honorClass:'large', format:'BO3/BO5' },
  { id:'pjl-astana', name:'PJL 阿斯塔纳站', organizer:'PJL', tier:'T1', honorClass:'large', format:'BO3/BO5' },
  { id:'pjl-bucharest', name:'PJL 布加勒斯特大师赛', organizer:'PJL', tier:'T2', honorClass:'medium', format:'BO3' },
  { id:'burst-open', name:'BURST 全球公开赛', organizer:'BURST', tier:'T1', honorClass:'elite', format:'BO3/BO5' },
  { id:'burst-bounty', name:'BURST 赏金赛', organizer:'BURST', tier:'T1', honorClass:'large', format:'BO3' },
  { id:'nova-series', name:'NovaLadder 星系联赛', organizer:'NovaLadder', tier:'T2', honorClass:'medium', format:'BO1/BO3' },
  { id:'rift-world', name:'RIFT 裂界天地', organizer:'RIFT', tier:'T1', honorClass:'large', format:'BO3/BO5' },
  { id:'sky-east', name:'遮天东境邀请赛', organizer:'遮天电竞', tier:'T2', honorClass:'medium', format:'BO3', region:'Asia' },
  { id:'sky-asia', name:'遮天亚洲冠军杯', organizer:'遮天电竞', tier:'T1', honorClass:'elite', format:'BO3/BO5', region:'Asia' },
  { id:'gwc', name:'GWC 世界电竞杯', organizer:'Global Wave', tier:'T1', honorClass:'large', format:'BO3/BO5' },
  { id:'major-pjl', name:'PJL 哥本哈根 Major', organizer:'PJL', tier:'Major', honorClass:'major', format:'BO3/BO5' },
  { id:'major-esi', name:'ESI 科隆 Major', organizer:'ESI', tier:'Major', honorClass:'major', format:'BO3/BO5' },
  { id:'major-sky', name:'遮天上海 Major', organizer:'遮天电竞', tier:'Major', honorClass:'major', format:'BO3/BO5' },
  { id:'regional-challenger', name:'区域挑战者联赛', organizer:'联合赛事委员会', tier:'T2', honorClass:'medium', format:'BO1/BO3' },
  { id:'open-circuit', name:'公开巡回赛', organizer:'联合赛事委员会', tier:'unranked', honorClass:'medium', format:'BO1/BO3' },
];

export const DATA_SNAPSHOT_NOTE = '2025–2026 赛季静态快照；阵容仅用于确定性模拟，不代表实时名单。';
