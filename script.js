'use strict';
const $=id=>document.getElementById(id),MAX=10,KEY='metle-v3',EPOCH='2026-01-01';
let bands=[],pool=[],answer,guesses=[],done=false,chosen=null,stats=loadStats(),active=-1;
function fresh(){return{played:0,won:0,streak:0,last:null,games:{}}}
function loadStats(){try{return{...fresh(),...JSON.parse(localStorage.getItem(KEY))}}catch{return fresh()}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(stats))}catch(e){console.warn('Could not save local stats',e)}}
function norm(s){return String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’‘`]/g,"'").replace(/[‐‑‒–—]/g,'-').toLowerCase().trim()}
function esc(s){return String(s??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function isPlayable(b){return Number.isInteger(b.debut_year)&&!!b.country&&typeof b.active==='boolean'&&Array.isArray(b.genres)&&b.genres.length>0&&!!b.first_release&&!!b.status}
function day(){return new Date().toISOString().slice(0,10)}
function num(){return Math.floor((Date.parse(day()+'T00:00:00Z')-Date.parse(EPOCH+'T00:00:00Z'))/86400000)}
// Global country land-border adjacency (symmetric).
// Based on CountryInfo country-border records, with supplemental current/overseas border pairs.
const borders={
  "afghanistan":["china", "india", "iran", "pakistan", "tajikistan", "turkmenistan", "uzbekistan"],
  "albania":["greece", "kosovo", "montenegro", "north macedonia", "serbia"],
  "algeria":["libya", "mali", "mauritania", "morocco", "niger", "tunisia"],
  "american samoa":[],
  "andorra":["france", "spain"],
  "angola":["democratic republic of the congo", "namibia", "republic of the congo", "zambia"],
  "anguilla":[],
  "antigua and barbuda":[],
  "argentina":["bolivia", "brazil", "chile", "paraguay", "uruguay"],
  "armenia":["azerbaijan", "georgia", "iran", "turkey"],
  "australia":[],
  "austria":["czech republic", "germany", "hungary", "italy", "liechtenstein", "slovakia", "slovenia", "switzerland"],
  "azerbaijan":["armenia", "georgia", "iran", "russia", "turkey"],
  "bahrain":[],
  "bangladesh":["india", "myanmar"],
  "barbados":[],
  "belarus":["latvia", "lithuania", "poland", "russia", "ukraine"],
  "belgium":["france", "germany", "luxembourg", "netherlands"],
  "belize":["guatemala", "mexico"],
  "benin":["burkina faso", "niger", "nigeria", "togo"],
  "bermuda":[],
  "bhutan":["china", "india"],
  "bolivia":["argentina", "brazil", "chile", "paraguay", "peru"],
  "bosnia and herzegovina":["croatia", "montenegro", "serbia"],
  "botswana":["namibia", "south africa", "zambia", "zimbabwe"],
  "brazil":["argentina", "bolivia", "colombia", "france", "guyana", "paraguay", "peru", "suriname", "uruguay", "venezuela"],
  "british indian ocean territory":[],
  "brunei":["malaysia"],
  "bulgaria":["greece", "north macedonia", "romania", "serbia", "turkey"],
  "burkina faso":["benin", "cote d'ivoire", "ghana", "mali", "niger", "togo"],
  "burundi":["democratic republic of the congo", "rwanda", "tanzania"],
  "cambodia":["laos", "thailand", "vietnam"],
  "cameroon":["central african republic", "chad", "equatorial guinea", "gabon", "nigeria", "republic of the congo"],
  "canada":["denmark", "united states"],
  "cape verde":[],
  "cayman islands":[],
  "central african republic":["cameroon", "chad", "democratic republic of the congo", "republic of the congo", "south sudan", "sudan"],
  "chad":["cameroon", "central african republic", "libya", "niger", "nigeria", "south sudan", "sudan"],
  "chile":["argentina", "bolivia", "peru"],
  "china":["afghanistan", "bhutan", "india", "kazakhstan", "kyrgyzstan", "laos", "mongolia", "myanmar", "nepal", "north korea", "pakistan", "russia", "tajikistan", "vietnam"],
  "christmas island":[],
  "cocos (keeling) islands":[],
  "colombia":["brazil", "ecuador", "panama", "peru", "venezuela"],
  "comoros":[],
  "cook islands":[],
  "costa rica":["nicaragua", "panama"],
  "cote d'ivoire":["burkina faso", "ghana", "guinea", "liberia", "mali"],
  "croatia":["bosnia and herzegovina", "hungary", "montenegro", "serbia", "slovenia"],
  "cuba":[],
  "cyprus":["united kingdom", "wales"],
  "czech republic":["austria", "germany", "poland", "slovakia"],
  "democratic republic of the congo":["angola", "burundi", "central african republic", "republic of the congo", "rwanda", "south sudan", "tanzania", "uganda", "zambia"],
  "denmark":["canada", "germany"],
  "djibouti":["eritrea", "ethiopia", "somalia"],
  "dominica":[],
  "dominican republic":["haiti"],
  "ecuador":["colombia", "peru"],
  "egypt":["israel", "libya", "sudan"],
  "el salvador":["guatemala", "honduras"],
  "equatorial guinea":["cameroon", "gabon"],
  "eritrea":["djibouti", "ethiopia", "sudan"],
  "estonia":["latvia", "russia"],
  "eswatini":["mozambique", "south africa"],
  "ethiopia":["djibouti", "eritrea", "kenya", "somalia", "south sudan", "sudan"],
  "falkland islands":[],
  "federated states of micronesia":[],
  "fiji":[],
  "finland":["norway", "russia", "sweden"],
  "france":["andorra", "belgium", "brazil", "germany", "italy", "luxembourg", "monaco", "netherlands", "spain", "suriname", "switzerland"],
  "french polynesia":[],
  "french southern and antarctic lands":[],
  "gabon":["cameroon", "equatorial guinea", "republic of the congo"],
  "georgia":["armenia", "azerbaijan", "russia", "turkey"],
  "germany":["austria", "belgium", "czech republic", "denmark", "france", "luxembourg", "netherlands", "poland", "switzerland"],
  "ghana":["burkina faso", "cote d'ivoire", "togo"],
  "greece":["albania", "bulgaria", "north macedonia", "turkey"],
  "grenada":[],
  "guam":[],
  "guatemala":["belize", "el salvador", "honduras", "mexico"],
  "guernsey":[],
  "guinea":["cote d'ivoire", "guinea-bissau", "liberia", "mali", "senegal", "sierra leone"],
  "guinea-bissau":["guinea", "senegal"],
  "guyana":["brazil", "suriname", "venezuela"],
  "haiti":["dominican republic"],
  "heard island and mcdonald islands":[],
  "honduras":["el salvador", "guatemala", "nicaragua"],
  "hungary":["austria", "croatia", "romania", "serbia", "slovakia", "slovenia", "ukraine"],
  "iceland":[],
  "india":["afghanistan", "bangladesh", "bhutan", "china", "myanmar", "nepal", "pakistan", "sri lanka"],
  "indonesia":["malaysia", "papua new guinea", "timor-leste"],
  "iran":["afghanistan", "armenia", "azerbaijan", "iraq", "kuwait", "pakistan", "turkey", "turkmenistan"],
  "iraq":["iran", "jordan", "kuwait", "saudi arabia", "syria", "turkey"],
  "ireland":["united kingdom", "wales"],
  "isle of man":[],
  "israel":["egypt", "jordan", "lebanon", "syria"],
  "italy":["austria", "france", "san marino", "slovenia", "switzerland", "vatican city"],
  "jamaica":[],
  "japan":[],
  "jersey":[],
  "jordan":["iraq", "israel", "saudi arabia", "syria"],
  "kazakhstan":["china", "kyrgyzstan", "russia", "turkmenistan", "uzbekistan"],
  "kenya":["ethiopia", "somalia", "south sudan", "tanzania", "uganda"],
  "kiribati":[],
  "kosovo":["albania", "montenegro", "north macedonia", "serbia"],
  "kuwait":["iran", "iraq", "saudi arabia"],
  "kyrgyzstan":["china", "kazakhstan", "tajikistan", "uzbekistan"],
  "laos":["cambodia", "china", "myanmar", "thailand", "vietnam"],
  "latvia":["belarus", "estonia", "lithuania", "russia"],
  "lebanon":["israel", "syria"],
  "lesotho":["south africa"],
  "liberia":["cote d'ivoire", "guinea", "sierra leone"],
  "libya":["algeria", "chad", "egypt", "niger", "sudan", "tunisia"],
  "liechtenstein":["austria", "switzerland"],
  "lithuania":["belarus", "latvia", "poland", "russia"],
  "luxembourg":["belgium", "france", "germany"],
  "madagascar":[],
  "malawi":["mozambique", "tanzania", "zambia"],
  "malaysia":["brunei", "indonesia", "thailand"],
  "maldives":[],
  "mali":["algeria", "burkina faso", "cote d'ivoire", "guinea", "mauritania", "niger", "senegal"],
  "malta":[],
  "marshall islands":[],
  "mauritania":["algeria", "mali", "morocco", "senegal"],
  "mauritius":[],
  "mexico":["belize", "guatemala", "united states"],
  "moldova":["romania", "ukraine"],
  "monaco":["france"],
  "mongolia":["china", "russia"],
  "montenegro":["albania", "bosnia and herzegovina", "croatia", "kosovo", "serbia"],
  "montserrat":[],
  "morocco":["algeria", "mauritania", "spain"],
  "mozambique":["eswatini", "malawi", "south africa", "tanzania", "zambia", "zimbabwe"],
  "myanmar":["bangladesh", "china", "india", "laos", "thailand"],
  "namibia":["angola", "botswana", "south africa", "zambia"],
  "nauru":[],
  "nepal":["china", "india"],
  "netherlands":["belgium", "france", "germany"],
  "new caledonia":[],
  "new zealand":[],
  "nicaragua":["costa rica", "honduras"],
  "niger":["algeria", "benin", "burkina faso", "chad", "libya", "mali", "nigeria"],
  "nigeria":["benin", "cameroon", "chad", "niger"],
  "niue":[],
  "norfolk island":[],
  "north korea":["china", "russia", "south korea"],
  "north macedonia":["albania", "bulgaria", "greece", "kosovo", "serbia"],
  "northern mariana islands":[],
  "norway":["finland", "russia", "sweden"],
  "oman":["saudi arabia", "united arab emirates", "yemen"],
  "pakistan":["afghanistan", "china", "india", "iran"],
  "palau":[],
  "panama":["colombia", "costa rica"],
  "papua new guinea":["indonesia"],
  "paraguay":["argentina", "bolivia", "brazil"],
  "peru":["bolivia", "brazil", "chile", "colombia", "ecuador"],
  "philippines":[],
  "pitcairn islands":[],
  "poland":["belarus", "czech republic", "germany", "lithuania", "russia", "slovakia", "ukraine"],
  "portugal":["spain"],
  "qatar":["saudi arabia"],
  "republic of the congo":["angola", "cameroon", "central african republic", "democratic republic of the congo", "gabon"],
  "romania":["bulgaria", "hungary", "moldova", "serbia", "ukraine"],
  "russia":["azerbaijan", "belarus", "china", "estonia", "finland", "georgia", "kazakhstan", "latvia", "lithuania", "mongolia", "north korea", "norway", "poland", "ukraine"],
  "rwanda":["burundi", "democratic republic of the congo", "tanzania", "uganda"],
  "saint helena":[],
  "saint kitts and nevis":[],
  "saint lucia":[],
  "saint pierre and miquelon":[],
  "saint vincent and the grenadines":[],
  "samoa":[],
  "san marino":["italy"],
  "sao tome and principe":[],
  "saudi arabia":["iraq", "jordan", "kuwait", "oman", "qatar", "united arab emirates", "yemen"],
  "scotland":[],
  "senegal":["guinea", "guinea-bissau", "mali", "mauritania", "the gambia"],
  "serbia":["albania", "bosnia and herzegovina", "bulgaria", "croatia", "hungary", "kosovo", "montenegro", "north macedonia", "romania"],
  "seychelles":[],
  "sierra leone":["guinea", "liberia"],
  "singapore":[],
  "slovakia":["austria", "czech republic", "hungary", "poland", "ukraine"],
  "slovenia":["austria", "croatia", "hungary", "italy"],
  "solomon islands":[],
  "somalia":["djibouti", "ethiopia", "kenya"],
  "south africa":["botswana", "eswatini", "lesotho", "mozambique", "namibia", "zimbabwe"],
  "south georgia":[],
  "south korea":["north korea"],
  "south sudan":["central african republic", "chad", "democratic republic of the congo", "ethiopia", "kenya", "sudan", "uganda"],
  "spain":["andorra", "france", "morocco", "portugal", "united kingdom"],
  "sri lanka":["india"],
  "sudan":["central african republic", "chad", "egypt", "eritrea", "ethiopia", "libya", "south sudan"],
  "suriname":["brazil", "france", "guyana"],
  "svalbard and jan mayen":[],
  "sweden":["finland", "norway"],
  "switzerland":["austria", "france", "germany", "italy", "liechtenstein"],
  "syria":["iraq", "israel", "jordan", "lebanon", "turkey"],
  "taiwan":[],
  "tajikistan":["afghanistan", "china", "kyrgyzstan", "uzbekistan"],
  "tanzania":["burundi", "democratic republic of the congo", "kenya", "malawi", "mozambique", "rwanda", "uganda", "zambia"],
  "thailand":["cambodia", "laos", "malaysia", "myanmar"],
  "the bahamas":[],
  "the gambia":["senegal"],
  "timor-leste":["indonesia"],
  "togo":["benin", "burkina faso", "ghana"],
  "tokelau":[],
  "tonga":[],
  "trinidad and tobago":[],
  "tunisia":["algeria", "libya"],
  "turkey":["armenia", "azerbaijan", "bulgaria", "georgia", "greece", "iran", "iraq", "syria"],
  "turkmenistan":["afghanistan", "iran", "kazakhstan", "uzbekistan"],
  "tuvalu":[],
  "uganda":["democratic republic of the congo", "kenya", "rwanda", "south sudan", "tanzania"],
  "ukraine":["belarus", "hungary", "moldova", "poland", "romania", "russia", "slovakia"],
  "united arab emirates":["oman", "saudi arabia"],
  "united kingdom":["cyprus", "ireland", "spain"],
  "united states":["canada", "mexico"],
  "uruguay":["argentina", "brazil"],
  "uzbekistan":["afghanistan", "kazakhstan", "kyrgyzstan", "tajikistan", "turkmenistan"],
  "vanuatu":[],
  "vatican city":["italy"],
  "venezuela":["brazil", "colombia", "guyana"],
  "vietnam":["cambodia", "china", "laos"],
  "wales":["cyprus", "ireland"],
  "wallis and futuna":[],
  "yemen":["oman", "saudi arabia"],
  "zambia":["angola", "botswana", "democratic republic of the congo", "malawi", "mozambique", "namibia", "tanzania", "zimbabwe"],
  "zimbabwe":["botswana", "mozambique", "south africa", "zambia"],
};
const countryAliases={"af":"afghanistan","afganistan":"afghanistan","afg":"afghanistan","al":"albania","shqiperi":"albania","shqiperia":"albania","shqipnia":"albania","alb":"albania","dz":"algeria","dzayer":"algeria","algerie":"algeria","dza":"algeria","as":"american samoa","amerika samoa":"american samoa","amelika samoa":"american samoa","samoa amelika":"american samoa","asm":"american samoa","ao":"angola","republica de angola":"angola","ʁɛpublika de an'ɡɔla":"angola","ago":"angola","ai":"anguilla","aia":"anguilla","ag":"antigua and barbuda","atg":"antigua and barbuda","ar":"argentina","argentine republic":"argentina","republica argentina":"argentina","arg":"argentina","am":"armenia","hayastan":"armenia","republic of armenia":"armenia","հայաստանի հանրապետություն":"armenia","arm":"armenia","aw":"aruba","abw":"aruba","au":"australia","aus":"australia","at":"austria","osterreich":"austria","oesterreich":"austria","aut":"austria","az":"azerbaijan","republic of azerbaijan":"azerbaijan","azərbaycan respublikası":"azerbaijan","aze":"azerbaijan","bs":"the bahamas","commonwealth of the bahamas":"the bahamas","bhs":"the bahamas","bh":"bahrain","kingdom of bahrain":"bahrain","mamlakat al-bahrayn":"bahrain","bhr":"bahrain","bd":"bangladesh","people's republic of bangladesh":"bangladesh","gonoprojatontri bangladesh":"bangladesh","bgd":"bangladesh","bb":"barbados","brb":"barbados","by":"belarus","bielarus":"belarus","republic of belarus":"belarus","белоруссия":"belarus","республика беларусь":"belarus","belorussiya":"belarus","respublika belarus’":"belarus","blr":"belarus","be":"belgium","belgie":"belgium","belgien":"belgium","belgique":"belgium","kingdom of belgium":"belgium","koninkrijk belgie":"belgium","royaume de belgique":"belgium","konigreich belgien":"belgium","bel":"belgium","bz":"belize","blz":"belize","bj":"benin","republic of benin":"benin","republique du benin":"benin","ben":"benin","bm":"bermuda","the islands of bermuda":"bermuda","the bermudas":"bermuda","somers isles":"bermuda","bmu":"bermuda","bt":"bhutan","kingdom of bhutan":"bhutan","btn":"bhutan","bo":"bolivia","buliwya":"bolivia","wuliwya":"bolivia","plurinational state of bolivia":"bolivia","estado plurinacional de bolivia":"bolivia","buliwya mamallaqta":"bolivia","wuliwya suyu":"bolivia","teta volivia":"bolivia","bol":"bolivia","ba":"bosnia and herzegovina","bosnia-herzegovina":"bosnia and herzegovina","босна и херцеговина":"bosnia and herzegovina","bih":"bosnia and herzegovina","bw":"botswana","republic of botswana":"botswana","lefatshe la botswana":"botswana","bwa":"botswana","br":"brazil","brasil":"brazil","federative republic of brazil":"brazil","republica federativa do brasil":"brazil","bra":"brazil","io":"british indian ocean territory","iot":"british indian ocean territory","bn":"brunei","nation of brunei":"brunei","the abode of peace":"brunei","brn":"brunei","bg":"bulgaria","republic of bulgaria":"bulgaria","република българия":"bulgaria","bgr":"bulgaria","bf":"burkina faso","bfa":"burkina faso","bi":"burundi","republic of burundi":"burundi","republika y'uburundi":"burundi","republique du burundi":"burundi","bdi":"burundi","kh":"cambodia","kingdom of cambodia":"cambodia","khm":"cambodia","cm":"cameroon","republic of cameroon":"cameroon","republique du cameroun":"cameroon","cmr":"cameroon","ca":"canada","can":"canada","cv":"cape verde","republic of cabo verde":"cape verde","republica de cabo verde":"cape verde","cpv":"cape verde","ky":"cayman islands","cym":"cayman islands","cf":"central african republic","central african republic":"central african republic","republique centrafricaine":"central african republic","caf":"central african republic","td":"chad","tchad":"chad","republic of chad":"chad","republique du tchad":"chad","tcd":"chad","cl":"chile","republic of chile":"chile","republica de chile":"chile","chl":"chile","cn":"china","zhongguo":"china","zhonghua":"china","people's republic of china":"china","中华人民共和国":"china","zhonghua renmin gongheguo":"china","chn":"china","cx":"christmas island","territory of christmas island":"christmas island","cxr":"christmas island","cc":"cocos (keeling) islands","territory of the cocos (keeling) islands":"cocos (keeling) islands","keeling islands":"cocos (keeling) islands","cck":"cocos (keeling) islands","co":"colombia","republic of colombia":"colombia","republica de colombia":"colombia","col":"colombia","km":"comoros","union of the comoros":"comoros","union des comores":"comoros","udzima wa komori":"comoros","al-ittihad al-qumuri":"comoros","com":"comoros","cg":"republic of the congo","congo-brazzaville":"republic of the congo","cog":"republic of the congo","cd":"democratic republic of the congo","dr congo":"democratic republic of the congo","congo-kinshasa":"democratic republic of the congo","drc":"democratic republic of the congo","cod":"democratic republic of the congo","ck":"cook islands","kuki 'airani":"cook islands","cok":"cook islands","cr":"costa rica","republic of costa rica":"costa rica","republica de costa rica":"costa rica","cri":"costa rica","ci":"ivory coast","ivory coast":"cote d'ivoire","republic of cote d'ivoire":"ivory coast","republique de cote d'ivoire":"ivory coast","civ":"ivory coast","hr":"croatia","hrvatska":"croatia","republic of croatia":"croatia","republika hrvatska":"croatia","hrv":"croatia","cu":"cuba","republic of cuba":"cuba","republica de cuba":"cuba","cub":"cuba","cy":"cyprus","kypros":"cyprus","kıbrıs":"cyprus","republic of cyprus":"cyprus","κυπριακη δημοκρατια":"cyprus","kıbrıs cumhuriyeti":"cyprus","cyp":"cyprus","cz":"czech republic","ceska republika":"czech republic","cesko":"czech republic","cze":"czech republic","dk":"denmark","danmark":"denmark","kingdom of denmark":"denmark","kongeriget danmark":"denmark","dnk":"denmark","dj":"djibouti","jabuuti":"djibouti","gabuuti":"djibouti","republic of djibouti":"djibouti","republique de djibouti":"djibouti","gabuutih ummuuno":"djibouti","jamhuuriyadda jabuuti":"djibouti","dji":"djibouti","dm":"dominica","dominique":"dominica","wai‘tu kubuli":"dominica","commonwealth of dominica":"dominica","dma":"dominica","do":"dominican republic","dom":"dominican republic","ec":"ecuador","republic of ecuador":"ecuador","republica del ecuador":"ecuador","ecu":"ecuador","eg":"egypt","arab republic of egypt":"egypt","egy":"egypt","sv":"el salvador","republic of el salvador":"el salvador","republica de el salvador":"el salvador","slv":"el salvador","gq":"equatorial guinea","republic of equatorial guinea":"equatorial guinea","republica de guinea ecuatorial":"equatorial guinea","republique de guinee equatoriale":"equatorial guinea","republica da guine equatorial":"equatorial guinea","gnq":"equatorial guinea","er":"eritrea","state of eritrea":"eritrea","ሃገረ ኤርትራ":"eritrea","dawlat iritriya":"eritrea","ʾertra":"eritrea","iritriya":"eritrea","eri":"eritrea","ee":"estonia","eesti":"estonia","republic of estonia":"estonia","eesti vabariik":"estonia","est":"estonia","et":"ethiopia","ʾityoppya":"ethiopia","federal democratic republic of ethiopia":"ethiopia","የኢትዮጵያ ፌዴራላዊ ዲሞክራሲያዊ ሪፐብሊክ":"ethiopia","eth":"ethiopia","fk":"falkland islands","islas malvinas":"falkland islands","flk":"falkland islands","fo":"faroe islands","føroyar":"faroe islands","færøerne":"faroe islands","fro":"faroe islands","fj":"fiji","viti":"fiji","republic of fiji":"fiji","matanitu ko viti":"fiji","fiji ganarajya":"fiji","fji":"fiji","fi":"finland","suomi":"finland","republic of finland":"finland","suomen tasavalta":"finland","republiken finland":"finland","fin":"finland","fr":"france","french republic":"france","republique francaise":"france","fra":"france","gf":"french guiana","guiana":"french guiana","guyane":"french guiana","guf":"french guiana","pf":"french polynesia","polynesie francaise":"french polynesia","french polynesia":"french polynesia","porinetia farani":"french polynesia","pyf":"french polynesia","tf":"french southern and antarctic lands","atf":"french southern and antarctic lands","ga":"gabon","gabonese republic":"gabon","republique gabonaise":"gabon","gab":"gabon","gm":"the gambia","republic of the gambia":"the gambia","gmb":"the gambia","ge":"georgia","sakartvelo":"georgia","geo":"georgia","de":"germany","federal republic of germany":"germany","bundesrepublik deutschland":"germany","deu":"germany","gh":"ghana","gha":"ghana","gi":"gibraltar","gib":"gibraltar","gr":"greece","ellada":"greece","hellenic republic":"greece","ελληνικη δημοκρατια":"greece","grc":"greece","gl":"greenland","grønland":"greenland","grl":"greenland","gd":"grenada","grd":"grenada","gp":"guadeloupe","gwadloup":"guadeloupe","glp":"guadeloupe","gu":"guam","guahan":"guam","gum":"guam","gt":"guatemala","gtm":"guatemala","gg":"guernsey","bailiwick of guernsey":"guernsey","bailliage de guernesey":"guernsey","ggy":"guernsey","gn":"guinea","republic of guinea":"guinea","republique de guinee":"guinea","gin":"guinea","gw":"guinea-bissau","republic of guinea-bissau":"guinea-bissau","republica da guine-bissau":"guinea-bissau","gnb":"guinea-bissau","gy":"guyana","co-operative republic of guyana":"guyana","guy":"guyana","ht":"haiti","republic of haiti":"haiti","republique d'haiti":"haiti","repiblik ayiti":"haiti","hti":"haiti","hm":"heard island and mcdonald islands","hmd":"heard island and mcdonald islands","hn":"honduras","republic of honduras":"honduras","republica de honduras":"honduras","hnd":"honduras","hk":"hong kong","香港":"hong kong","hkg":"hong kong","hu":"hungary","hun":"hungary","is":"iceland","island":"iceland","republic of iceland":"iceland","lyðveldið island":"iceland","isl":"iceland","in":"india","bharat":"india","republic of india":"india","bharat ganrajya":"india","ind":"india","id":"indonesia","republic of indonesia":"indonesia","republik indonesia":"indonesia","idn":"indonesia","ir":"iran","islamic republic of iran":"iran","jomhuri-ye eslami-ye iran":"iran","irn":"iran","iq":"iraq","republic of iraq":"iraq","jumhuriyyat al-‘iraq":"iraq","irq":"iraq","ie":"ireland","eire":"ireland","republic of ireland":"ireland","poblacht na heireann":"ireland","irl":"ireland","il":"israel","state of israel":"israel","medinat yisra'el":"israel","isr":"israel","it":"italy","italian republic":"italy","repubblica italiana":"italy","ita":"italy","jm":"jamaica","jam":"jamaica","jp":"japan","nippon":"japan","nihon":"japan","jpn":"japan","je":"jersey","bailiwick of jersey":"jersey","bailliage de jersey":"jersey","bailliage de jerri":"jersey","jey":"jersey","jo":"jordan","hashemite kingdom of jordan":"jordan","al-mamlakah al-urduniyah al-hashimiyah":"jordan","jor":"jordan","kz":"kazakhstan","qazaqstan":"kazakhstan","казахстан":"kazakhstan","republic of kazakhstan":"kazakhstan","қазақстан республикасы":"kazakhstan","qazaqstan respublikası":"kazakhstan","республика казахстан":"kazakhstan","respublika kazakhstan":"kazakhstan","kaz":"kazakhstan","ke":"kenya","republic of kenya":"kenya","jamhuri ya kenya":"kenya","ken":"kenya","ki":"kiribati","republic of kiribati":"kiribati","ribaberiki kiribati":"kiribati","kir":"kiribati","kp":"north korea","democratic people's republic of korea":"north korea","조선민주주의인민공화국":"north korea","choson minjujuui inmin konghwaguk":"north korea","prk":"north korea","kr":"south korea","republic of korea":"south korea","kor":"south korea","kw":"kuwait","state of kuwait":"kuwait","dawlat al-kuwait":"kuwait","kwt":"kuwait","kg":"kyrgyzstan","киргизия":"kyrgyzstan","kyrgyz republic":"kyrgyzstan","кыргыз республикасы":"kyrgyzstan","kyrgyz respublikasy":"kyrgyzstan","kgz":"kyrgyzstan","la":"laos","lao":"laos","lao people's democratic republic":"laos","sathalanalat paxathipatai paxaxon lao":"laos","lv":"latvia","republic of latvia":"latvia","latvijas republika":"latvia","lva":"latvia","lb":"lebanon","lebanese republic":"lebanon","al-jumhuriyah al-libnaniyah":"lebanon","lbn":"lebanon","ls":"lesotho","kingdom of lesotho":"lesotho","muso oa lesotho":"lesotho","lso":"lesotho","lr":"liberia","republic of liberia":"liberia","lbr":"liberia","ly":"libya","state of libya":"libya","dawlat libya":"libya","lby":"libya","li":"liechtenstein","principality of liechtenstein":"liechtenstein","furstentum liechtenstein":"liechtenstein","lie":"liechtenstein","lt":"lithuania","republic of lithuania":"lithuania","lietuvos respublika":"lithuania","ltu":"lithuania","lu":"luxembourg","grand duchy of luxembourg":"luxembourg","grand-duche de luxembourg":"luxembourg","großherzogtum luxemburg":"luxembourg","groussherzogtum letzebuerg":"luxembourg","lux":"luxembourg","mo":"macau","澳门":"macau","macao special administrative region of the people's republic of china":"macau","中華人民共和國澳門特別行政區":"macau","regiao administrativa especial de macau da republica popular da china":"macau","mac":"macau","mk":"republic of macedonia","republic of macedonia":"north macedonia","република македонија":"republic of macedonia","mkd":"republic of macedonia","mg":"madagascar","republic of madagascar":"madagascar","repoblikan'i madagasikara":"madagascar","republique de madagascar":"madagascar","mdg":"madagascar","mw":"malawi","republic of malawi":"malawi","mwi":"malawi","my":"malaysia","mys":"malaysia","mv":"maldives","maldive islands":"maldives","republic of the maldives":"maldives","dhivehi raajjeyge jumhooriyya":"maldives","mdv":"maldives","ml":"mali","republic of mali":"mali","republique du mali":"mali","mli":"mali","mt":"malta","republic of malta":"malta","repubblika ta' malta":"malta","mlt":"malta","im":"isle of man","ellan vannin":"isle of man","mann":"isle of man","mannin":"isle of man","imn":"isle of man","mh":"marshall islands","republic of the marshall islands":"marshall islands","aolepan aorokin majel":"marshall islands","mhl":"marshall islands","mq":"martinique","mtq":"martinique","mr":"mauritania","islamic republic of mauritania":"mauritania","al-jumhuriyyah al-ʾislamiyyah al-muritaniyyah":"mauritania","mrt":"mauritania","mu":"mauritius","republic of mauritius":"mauritius","republique de maurice":"mauritius","mus":"mauritius","yt":"mayotte","department of mayotte":"mayotte","departement de mayotte":"mayotte","myt":"mayotte","mx":"mexico","mexicanos":"mexico","united mexican states":"mexico","estados unidos mexicanos":"mexico","mex":"mexico","fm":"federated states of micronesia","federated states of micronesia":"federated states of micronesia","fsm":"federated states of micronesia","md":"moldova","republic of moldova":"moldova","republica moldova":"moldova","mda":"moldova","mc":"monaco","principality of monaco":"monaco","principaute de monaco":"monaco","mco":"monaco","mn":"mongolia","mng":"mongolia","ms":"montserrat","msr":"montserrat","ma":"morocco","kingdom of morocco":"morocco","al-mamlakah al-magribiyah":"morocco","mar":"morocco","mz":"mozambique","republic of mozambique":"mozambique","republica de mocambique":"mozambique","moz":"mozambique","na":"namibia","namibie":"namibia","republic of namibia":"namibia","nam":"namibia","nr":"nauru","naoero":"nauru","pleasant island":"nauru","republic of nauru":"nauru","ripublik naoero":"nauru","nru":"nauru","np":"nepal","federal democratic republic of nepal":"nepal","loktantrik ganatantra nepal":"nepal","npl":"nepal","nl":"netherlands","holland":"netherlands","nederland":"netherlands","nld":"netherlands","nc":"new caledonia","ncl":"new caledonia","nz":"new zealand","aotearoa":"new zealand","nzl":"new zealand","ni":"nicaragua","republic of nicaragua":"nicaragua","republica de nicaragua":"nicaragua","nic":"nicaragua","ne":"niger","nijar":"niger","republic of niger":"niger","republique du niger":"niger","ner":"niger","ng":"nigeria","nijeriya":"nigeria","naijiria":"nigeria","federal republic of nigeria":"nigeria","nga":"nigeria","nu":"niue","niu":"niue","nf":"norfolk island","territory of norfolk island":"norfolk island","teratri of norf'k ailen":"norfolk island","nfk":"norfolk island","mp":"northern mariana islands","commonwealth of the northern mariana islands":"northern mariana islands","sankattan siha na islas marianas":"northern mariana islands","mnp":"northern mariana islands","no":"norway","norge":"norway","noreg":"norway","kingdom of norway":"norway","kongeriket norge":"norway","kongeriket noreg":"norway","nor":"norway","om":"oman","sultanate of oman":"oman","saltanat ʻuman":"oman","omn":"oman","pk":"pakistan","pakistan":"pakistan","islamic republic of pakistan":"pakistan","islami jumhuriya'eh pakistan":"pakistan","pak":"pakistan","pw":"palau","republic of palau":"palau","beluu er a belau":"palau","plw":"palau","pa":"panama","republic of panama":"panama","republica de panama":"panama","pan":"panama","pg":"papua new guinea","independent state of papua new guinea":"papua new guinea","independen stet bilong papua niugini":"papua new guinea","png":"papua new guinea","py":"paraguay","republic of paraguay":"paraguay","republica del paraguay":"paraguay","teta paraguai":"paraguay","pry":"paraguay","pe":"peru","republic of peru":"peru","republica del peru":"peru","per":"peru","ph":"philippines","republic of the philippines":"philippines","republika ng pilipinas":"philippines","phl":"philippines","pn":"pitcairn islands","pitcairn henderson ducie and oeno islands":"pitcairn islands","pcn":"pitcairn islands","pl":"poland","republic of poland":"poland","rzeczpospolita polska":"poland","pol":"poland","pt":"portugal","portuguesa":"portugal","portuguese republic":"portugal","republica portuguesa":"portugal","prt":"portugal","pr":"puerto rico","commonwealth of puerto rico":"puerto rico","estado libre asociado de puerto rico":"puerto rico","pri":"puerto rico","qa":"qatar","state of qatar":"qatar","dawlat qatar":"qatar","qat":"qatar","re":"reunion","reunion":"france","reu":"reunion","ro":"romania","rumania":"romania","roumania":"romania","romania":"romania","rou":"romania","ru":"russia","rossiya":"russia","russian federation":"russia","россииская федерация":"russia","rossiyskaya federatsiya":"russia","rus":"russia","rw":"rwanda","republic of rwanda":"rwanda","repubulika y'u rwanda":"rwanda","republique du rwanda":"rwanda","rwa":"rwanda","sh":"saint helena","shn":"saint helena","kn":"saint kitts and nevis","federation of saint christopher and nevis":"saint kitts and nevis","kna":"saint kitts and nevis","lc":"saint lucia","lca":"saint lucia","pm":"saint pierre and miquelon","collectivite territoriale de saint-pierre-et-miquelon":"saint pierre and miquelon","spm":"saint pierre and miquelon","vc":"saint vincent and the grenadines","vct":"saint vincent and the grenadines","ws":"samoa","independent state of samoa":"samoa","malo saʻoloto tutoʻatasi o samoa":"samoa","wsm":"samoa","sm":"san marino","republic of san marino":"san marino","repubblica di san marino":"san marino","smr":"san marino","st":"sao tome and principe","democratic republic of sao tome and principe":"sao tome and principe","republica democratica de sao tome e principe":"sao tome and principe","stp":"sao tome and principe","sa":"saudi arabia","kingdom of saudi arabia":"saudi arabia","al-mamlakah al-‘arabiyyah as-su‘udiyyah":"saudi arabia","sau":"saudi arabia","sn":"senegal","republic of senegal":"senegal","republique du senegal":"senegal","sen":"senegal","srbija":"serbia","republic of serbia":"serbia","republika srbija":"serbia","rs":"serbia","srb":"serbia","sc":"seychelles","republic of seychelles":"seychelles","repiblik sesel":"seychelles","republique des seychelles":"seychelles","syc":"seychelles","sl":"sierra leone","republic of sierra leone":"sierra leone","sle":"sierra leone","sg":"singapore","singapura":"singapore","republik singapura":"singapore","新加坡共和国":"singapore","sgp":"singapore","sk":"slovakia","slovak republic":"slovakia","slovenska republika":"slovakia","svk":"slovakia","si":"slovenia","republic of slovenia":"slovenia","republika slovenija":"slovenia","svn":"slovenia","sb":"solomon islands","slb":"solomon islands","so":"somalia","as-sumal":"somalia","federal republic of somalia":"somalia","jamhuuriyadda federaalka soomaaliya":"somalia","jumhuriyyat as-sumal al-fideraliyya":"somalia","som":"somalia","za":"south africa","rsa":"south africa","suid-afrika":"south africa","republic of south africa":"south africa","zaf":"south africa","gs":"south georgia","south georgia and the south sandwich islands":"south georgia","sgs":"south georgia","ss":"south sudan","ssd":"south sudan","es":"spain","kingdom of spain":"spain","reino de espana":"spain","esp":"spain","lk":"sri lanka","ilankai":"sri lanka","democratic socialist republic of sri lanka":"sri lanka","lka":"sri lanka","sd":"sudan","republic of the sudan":"sudan","jumhuriyat as-sudan":"sudan","sdn":"sudan","sr":"suriname","sarnam":"suriname","sranangron":"suriname","republic of suriname":"suriname","republiek suriname":"suriname","sur":"suriname","sj":"svalbard and jan mayen","svalbard and jan mayen islands":"svalbard and jan mayen","sjm":"svalbard and jan mayen","sz":"swaziland","weswatini":"swaziland","swatini":"swaziland","ngwane":"swaziland","kingdom of swaziland":"swaziland","umbuso waseswatini":"swaziland","swz":"swaziland","se":"sweden","kingdom of sweden":"sweden","konungariket sverige":"sweden","swe":"sweden","ch":"switzerland","swiss confederation":"switzerland","schweiz":"switzerland","suisse":"switzerland","svizzera":"switzerland","svizra":"switzerland","che":"switzerland","sy":"syria","syrian arab republic":"syria","al-jumhuriyah al-ʻarabiyah as-suriyah":"syria","syr":"syria","tw":"taiwan","taiwan":"taiwan","republic of china":"taiwan","中華民國":"taiwan","zhonghua minguo":"taiwan","twn":"taiwan","tj":"tajikistan","tocikiston":"tajikistan","republic of tajikistan":"tajikistan","ҷумҳурии тоҷикистон":"tajikistan","cumhuriyi tocikiston":"tajikistan","tjk":"tajikistan","tz":"tanzania","united republic of tanzania":"tanzania","jamhuri ya muungano wa tanzania":"tanzania","tza":"tanzania","th":"thailand","prathet":"thailand","thai":"thailand","kingdom of thailand":"thailand","ราชอาณาจกรไทย":"thailand","ratcha anachak thai":"thailand","tha":"thailand","tl":"east timor","east timor":"timor-leste","democratic republic of timor-leste":"east timor","republica democratica de timor-leste":"east timor","republika demokratika timor-leste":"east timor","tls":"east timor","tg":"togo","togolese":"togo","togolese republic":"togo","republique togolaise":"togo","tgo":"togo","tk":"tokelau","tkl":"tokelau","to":"tonga","ton":"tonga","tt":"trinidad and tobago","republic of trinidad and tobago":"trinidad and tobago","tto":"trinidad and tobago","tn":"tunisia","republic of tunisia":"tunisia","al-jumhuriyyah at-tunisiyyah":"tunisia","tun":"tunisia","tr":"turkey","turkiye":"turkey","republic of turkey":"turkey","turkiye cumhuriyeti":"turkey","tur":"turkey","tm":"turkmenistan","tkm":"turkmenistan","tv":"tuvalu","tuv":"tuvalu","ug":"uganda","republic of uganda":"uganda","jamhuri ya uganda":"uganda","uga":"uganda","ua":"ukraine","ukrayina":"ukraine","ukr":"ukraine","ae":"united arab emirates","uae":"united arab emirates","are":"united arab emirates","gb":"wales","uk":"united kingdom","great britain":"united kingdom","gbr":"wales","us":"united states","usa":"united states","united states of america":"united states","uy":"uruguay","oriental republic of uruguay":"uruguay","republica oriental del uruguay":"uruguay","ury":"uruguay","uz":"uzbekistan","republic of uzbekistan":"uzbekistan","o‘zbekiston respublikasi":"uzbekistan","узбекистон республикаси":"uzbekistan","uzb":"uzbekistan","vu":"vanuatu","republic of vanuatu":"vanuatu","ripablik blong vanuatu":"vanuatu","republique de vanuatu":"vanuatu","vut":"vanuatu","ve":"venezuela","bolivarian republic of venezuela":"venezuela","republica bolivariana de venezuela":"venezuela","ven":"venezuela","vn":"vietnam","socialist republic of vietnam":"vietnam","cong hoa xa hoi chu nghia viet nam":"vietnam","vnm":"vietnam","wf":"wallis and futuna","territory of the wallis and futuna islands":"wallis and futuna","territoire des iles wallis et futuna":"wallis and futuna","wlf":"wallis and futuna","eh":"western sahara","tanezroft tutrimt":"western sahara","esh":"western sahara","ye":"yemen","yemeni republic":"yemen","al-jumhuriyyah al-yamaniyyah":"yemen","yem":"yemen","zm":"zambia","republic of zambia":"zambia","zmb":"zambia","zw":"zimbabwe","republic of zimbabwe":"zimbabwe","zwe":"zimbabwe","czechia":"czech republic","u.s.a.":"united states","u.s.":"united states","britain":"united kingdom","the netherlands":"netherlands","cote d ivoire":"cote d'ivoire","congo kinshasa":"democratic republic of the congo","congo brazzaville":"republic of the congo","macedonia":"north macedonia","swaziland":"eswatini","burma":"myanmar","french guiana":"france","guyane francaise":"france","gibraltar":"united kingdom","greenland":"denmark","faroe islands":"denmark","aland islands":"finland","svalbard":"norway","hong kong":"china","macau":"china","macao":"china","puerto rico":"united states","guadeloupe":"france","martinique":"france","mayotte":"france","saint martin":"france","saint barthelemy":"france","aruba":"netherlands","curacao":"netherlands","sint maarten":"netherlands","bonaire":"netherlands","saba":"netherlands","sint eustatius":"netherlands","western sahara":"morocco","kosovo":"kosovo","vatican":"vatican city"};
function countryKey(value){const key=norm(value);return countryAliases[key]||key}
function touches(a,b){const x=countryKey(a),y=countryKey(b);return !!x&&!!y&&((borders[x]||[]).includes(y)||(borders[y]||[]).includes(x))}
function compare(g){
  const c={year:'na',genre:'na',country:'na',status:'na'};
  const d=Math.abs(g.debut_year-answer.debut_year);c.year=d===0?'green':d<=3?'yellow':'black';
  const exact=g.genres.some(x=>answer.genres.includes(x));
  const family=(g.parent_genres||[]).some(x=>(answer.parent_genres||[]).includes(x));
  c.genre=exact?'green':family?'yellow':'black';
  c.country=g.country===answer.country?'green':touches(g.country,answer.country)?'yellow':'black';
  c.status=g.active===answer.active?'green':'black';
  return c;
}
function tile(v,cls){return `<div class="tile ${cls}">${esc(v)}</div>`}
function draw(g){
  $('history').querySelector('.empty')?.remove();const c=compare(g);
  const row=document.createElement('div');row.className='grid guess';
  row.innerHTML=tile(g.name,'name')+tile(g.debut_year,c.year)+tile(g.genres.join(' / '),c.genre)+tile(g.country,c.country)+tile(g.status,c.status);
  $('history').prepend(row);
}
function progress(){$('count').textContent=`${guesses.length} / ${MAX}`;$('bar').style.width=(guesses.length/MAX*100)+'%'}
function suggest(q){
  const box=$('suggestions');active=-1;if(!q.trim()||done){box.hidden=true;return}
  const n=norm(q),matches=bands.filter(b=>norm(b.name).includes(n)||(b.aliases||[]).some(a=>norm(a).includes(n)))
    .filter(b=>!guesses.some(g=>g.name===b.name)).slice(0,9);
  box.innerHTML=matches.length?matches.map(b=>{const ready=isPlayable(b);return `<button class="suggestion" data-name="${esc(b.name)}" ${ready?'':'disabled'}><span>${esc(b.name)}</span><small>${ready?`${b.debut_year} / ${esc(b.country)}`:'PROFILE NEEDED'}</small></button>`}).join(''):'<div class="suggestion">NO MATCHING BANDS</div>';
  box.hidden=false;box.querySelectorAll('button:not(:disabled)').forEach(x=>x.onclick=()=>pick(x.dataset.name));
}
function pick(n){chosen=bands.find(b=>b.name===n);$('entry').value=chosen?.name||'';$('suggestions').hidden=true;$('entry').focus()}
function submit(){
  if(done)return;
  const typed=$('entry').value;
  const b=chosen||pool.find(x=>norm(x.name)===norm(typed)||(x.aliases||[]).some(a=>norm(a)===norm(typed)));
  if(!b){$('hint').textContent='CHOOSE A COMPLETE BAND PROFILE FROM THE AUTOCOMPLETE LIST.';return}
  if(guesses.some(x=>x.name===b.name)){$('hint').textContent='YOU ALREADY GUESSED THAT BAND.';return}
  chosen=null;guesses.push(b);$('entry').value='';$('suggestions').hidden=true;$('hint').textContent='';draw(b);progress();saveGame();
  if(b.name===answer.name)finish(true);else if(guesses.length>=MAX)finish(false);
}
function saveGame(){stats.games[day()]={names:guesses.map(x=>x.name),done};save()}
function result(){
  const win=guesses.some(x=>x.name===answer.name);$('result').hidden=false;
  $('result').innerHTML=`<h2>${win?'BAND IDENTIFIED':'TAPE ENDED'}</h2><p>THE ANSWER WAS <strong>${esc(answer.name)}</strong><br>${answer.debut_year} · ${esc(answer.country)} · ${esc(answer.status)}<br>${esc(answer.first_release)}</p><button id="copy">COPY RESULT</button>`;
  $('copy').onclick=copy;
}
function finish(win){
  if(done)return;done=true;
  if(!stats.games[day()]?.done){stats.played++;if(win){stats.won++;const y=new Date(Date.now()-86400000).toISOString().slice(0,10);stats.streak=stats.last===y?stats.streak+1:1;stats.last=day()}else stats.streak=0}
  saveGame();$('entry').disabled=true;$('submit').disabled=true;result();statsView();
}
function share(){return `METLE / ${day()} / ${guesses.some(x=>x.name===answer.name)?guesses.length:'X'}/10\n`+guesses.map(g=>{const c=compare(g);return ['year','genre','country','status'].map(k=>({green:'🟩',yellow:'🟨',black:'⬛',na:'⬛'}[c[k]])).join('')}).join('\n')}
async function copy(){try{await navigator.clipboard.writeText(share());$('copy').textContent='COPIED'}catch{prompt('Copy result',share())}}
function statsView(){$('played').textContent=stats.played;$('won').textContent=stats.won;$('rate').textContent=(stats.played?Math.round(stats.won/stats.played*100):0)+'%';$('streak').textContent=stats.streak}
function restore(){
  const s=stats.games[day()];if(!s)return;
  guesses=(s.names||[]).map(n=>bands.find(b=>norm(b.name)===norm(n))).filter(b=>b&&isPlayable(b));guesses.forEach(draw);progress();
  if(s.done){done=true;$('entry').disabled=true;$('submit').disabled=true;result()}
}
async function init(){
  try{
    const r=await fetch('./bands.json');if(!r.ok)throw Error('bands.json not found');bands=await r.json();
    pool=bands.filter(isPlayable);
    if(!pool.length)throw Error('No complete band profiles found.');
    answer=pool[((num()%pool.length)+pool.length)%pool.length];
    $('date').textContent=new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'}).toUpperCase();
    $('pool').textContent=`${pool.length} PLAYABLE / ${bands.length} BANDS LISTED`;
    $('entry').oninput=e=>{chosen=null;suggest(e.target.value)};
    $('entry').onkeydown=e=>{
      const items=[...$('suggestions').querySelectorAll('button')];
      if(e.key==='ArrowDown'&&items.length){e.preventDefault();active=(active+1)%items.length;items.forEach((x,i)=>x.classList.toggle('active',i===active))}
      else if(e.key==='ArrowUp'&&items.length){e.preventDefault();active=(active-1+items.length)%items.length;items.forEach((x,i)=>x.classList.toggle('active',i===active))}
      else if(e.key==='Enter'){e.preventDefault();if(active>=0&&items[active])pick(items[active].dataset.name);else submit()}
      else if(e.key==='Escape')$('suggestions').hidden=true;
    };
    $('submit').onclick=submit;
    document.addEventListener('click',e=>{if(!e.target.closest('.search'))$('suggestions').hidden=true});
    $('rules').onclick=()=>$('rules-dialog').showModal();$('stats').onclick=()=>$('stats-dialog').showModal();
    document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
    statsView();restore();
  }catch(e){console.error(e);$('history').innerHTML='<p class="empty">DATABASE ERROR — CHECK bands.json.</p>';$('submit').disabled=true}
}
init();
