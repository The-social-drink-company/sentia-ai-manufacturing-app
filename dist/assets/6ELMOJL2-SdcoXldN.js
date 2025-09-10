var e=Object.defineProperty,t=(t,n,r)=>((t,n,r)=>n in t?e(t,n,{enumerable:!0,configurable:!0,writable:!0,value:r}):t[n]=r)(t,"symbol"!=typeof n?n+"":n,r);import{ad as n,ae as r,af as o,ag as i,ah as s,ai as a,aj as l,ak as d,al as c,am as u,an as g,ao as f,ap as p,aq as h,ar as y,as as b,at as m,au as v,av as w,aw as x,ax as k,ay as $,az as S,aA as C,aB as E,aC as q,aD as M,aE as L,aF as F,aG as D,aH as T,aI as A,aJ as O,aK as I,aL as P,aM as z,aN as K,aO as R,aP as B,aQ as H,aR as G,aS as U,aT as V,aU as j,aV as N,aW as Q,aX as W,aY as _,aZ as X}from"./index-DrxFeC9W.js";import"./vendor-CPcSq91-.js";import"./auth-BBXZ5c8F.js";import"./query-AvopVzDf.js";var Z=e=>null!=e;var Y=e=>"function"!=typeof e||e.length?e:e(),J=e=>Array.isArray(e)?e:e?[e]:[];var ee=m;var te,ne=function(e){const[t,n]=r(),i=e?.throw?(e,t)=>{throw n(e instanceof Error?e:new Error(t)),e}:(e,t)=>{n(e instanceof Error?e:new Error(t))},s=e?.api?Array.isArray(e.api)?e.api:[e.api]:[globalThis.localStorage].filter(Boolean),a=e?.prefix?`${e.prefix}.`:"",l=new Map,d=new Proxy({},{get(t,n){let o=l.get(n);o||(o=r(void 0,{equals:!1}),l.set(n,o)),o[0]();const d=s.reduce((e,t)=>{if(null!==e||!t)return e;try{return t.getItem(`${a}${n}`)}catch(r){return i(r,`Error reading ${a}${n} from ${t.name}`),null}},null);return null!==d&&e?.deserializer?e.deserializer(d,n,e.options):d}});return!1!==e?.sync&&o(()=>{const e=e=>{let t=!1;s.forEach(n=>{try{n!==e.storageArea&&e.key&&e.newValue!==n.getItem(e.key)&&(e.newValue?n.setItem(e.key,e.newValue):n.removeItem(e.key),t=!0)}catch(r){i(r,`Error synching api ${n.name} from storage event (${e.key}=${e.newValue})`)}}),t&&e.key&&l.get(e.key)?.[1]()};"addEventListener"in globalThis?(globalThis.addEventListener("storage",e),m(()=>globalThis.removeEventListener("storage",e))):(s.forEach(t=>t.addEventListener?.("storage",e)),m(()=>s.forEach(t=>t.removeEventListener?.("storage",e))))}),[d,(t,n,r)=>{const o=e?.serializer?e.serializer(n,t,r??e.options):n,d=`${a}${t}`;s.forEach(e=>{try{e.getItem(d)!==o&&e.setItem(d,o)}catch(n){i(n,`Error setting ${a}${t} to ${o} in ${e.name}`)}});const c=l.get(t);c&&c[1]()},{clear:()=>s.forEach(e=>{try{e.clear()}catch(t){i(t,`Error clearing ${e.name}`)}}),error:t,remove:e=>s.forEach(t=>{try{t.removeItem(`${a}${e}`)}catch(n){i(n,`Error removing ${a}${e} from ${t.name}`)}}),toJSON:()=>{const t={},n=(n,r)=>{if(!t.hasOwnProperty(n)){const o=r&&e?.deserializer?e.deserializer(r,n,e.options):r;o&&(t[n]=o)}};return s.forEach(e=>{if("function"==typeof e.getAll){let t;try{t=e.getAll()}catch(r){i(r,`Error getting all values from in ${e.name}`)}for(const e of t)n(e,t[e])}else{let o,s=0;try{for(;o=e.key(s++);)t.hasOwnProperty(o)||n(o,e.getItem(o))}catch(r){i(r,`Error getting all values from ${e.name}`)}}}),t}}]},re=e=>{if(!e)return"";let t="";for(const n in e){if(!e.hasOwnProperty(n))continue;const r=e[n];t+=r instanceof Date?`; ${n}=${r.toUTCString()}`:"boolean"==typeof r?`; ${n}`:`; ${n}=${r}`}return t},oe=("function"==typeof(te={_cookies:[globalThis.document,"cookie"],getItem:e=>oe._cookies[0][oe._cookies[1]].match("(^|;)\\s*"+e+"\\s*=\\s*([^;]+)")?.pop()??null,setItem:(e,t,n)=>{const r=oe.getItem(e);oe._cookies[0][oe._cookies[1]]=`${e}=${t}${re(n)}`;const o=Object.assign(new Event("storage"),{key:e,oldValue:r,newValue:t,url:globalThis.document.URL,storageArea:oe});window.dispatchEvent(o)},removeItem:e=>{oe._cookies[0][oe._cookies[1]]=`${e}=deleted${re({expires:new Date(0)})}`},key:e=>{let t=null,n=0;return oe._cookies[0][oe._cookies[1]].replace(/(?:^|;)\s*(.+?)\s*=\s*[^;]+/g,(r,o)=>(!t&&o&&n++===e&&(t=o),"")),t},get length(){let e=0;return oe._cookies[0][oe._cookies[1]].replace(/(?:^|;)\s*.+?\s*=\s*[^;]+/g,t=>(e+=t?1:0,"")),e}}).clear||(te.clear=()=>{let e;for(;e=te.key(0);)te.removeItem(e)}),te),ie=796,se="bottom",ae=Object.keys(v)[0],le=Object.keys(w)[0],de=n({client:void 0,onlineManager:void 0,queryFlavor:"",version:"",shadowDOMTarget:void 0});function ce(){return b(de)}var ue=n(void 0),ge=e=>{const[t,n]=r(null),o=()=>{const e=t();null!=e&&(e.close(),n(null))},l=(r,o)=>{if(null!=t())return;const i=window.open("","TSQD-Devtools-Panel",`width=${r},height=${o},popup`);if(!i)throw new Error("Failed to open popup. Please allow popups for this site to view the devtools in picture-in-picture mode.");i.document.head.innerHTML="",i.document.body.innerHTML="",h(i.document),i.document.title="TanStack Query Devtools",i.document.body.style.margin="0",i.addEventListener("pagehide",()=>{e.setLocalStore("pip_open","false"),n(null)}),[...(ce().shadowDOMTarget||document).styleSheets].forEach(e=>{try{const t=[...e.cssRules].map(e=>e.cssText).join(""),n=document.createElement("style"),r=e.ownerNode;let o="";r&&"id"in r&&(o=r.id),o&&n.setAttribute("id",o),n.textContent=t,i.document.head.appendChild(n)}catch(t){const n=document.createElement("link");if(null==e.href)return;n.rel="stylesheet",n.type=e.type,n.media=e.media.toString(),n.href=e.href,i.document.head.appendChild(n)}}),y(["focusin","focusout","pointermove","keydown","pointerdown","pointerup","click","mousedown","input"],i.document),e.setLocalStore("pip_open","true"),n(i)};i(()=>{"true"!==(e.localStore.pip_open??"false")||e.disabled||l(Number(window.innerWidth),Number(e.localStore.height||500))}),i(()=>{const e=(ce().shadowDOMTarget||document).querySelector("#_goober"),n=t();if(e&&n){const t=new MutationObserver(()=>{const t=(ce().shadowDOMTarget||n.document).querySelector("#_goober");t&&(t.textContent=e.textContent)});t.observe(e,{childList:!0,subtree:!0,characterDataOldValue:!0}),m(()=>{t.disconnect()})}});const d=s(()=>({pipWindow:t(),requestPipWindow:l,closePipWindow:o,disabled:e.disabled??!1}));return a(ue.Provider,{value:d,get children(){return e.children}})},fe=()=>s(()=>{const e=b(ue);if(!e)throw new Error("usePiPWindow must be used within a PiPProvider");return e()}),pe=n(()=>"dark");function he(){return b(pe)}var ye={"À":"A","Á":"A","Â":"A","Ã":"A","Ä":"A","Å":"A","Ấ":"A","Ắ":"A","Ẳ":"A","Ẵ":"A","Ặ":"A","Æ":"AE","Ầ":"A","Ằ":"A","Ȃ":"A","Ç":"C","Ḉ":"C","È":"E","É":"E","Ê":"E","Ë":"E","Ế":"E","Ḗ":"E","Ề":"E","Ḕ":"E","Ḝ":"E","Ȇ":"E","Ì":"I","Í":"I","Î":"I","Ï":"I","Ḯ":"I","Ȋ":"I","Ð":"D","Ñ":"N","Ò":"O","Ó":"O","Ô":"O","Õ":"O","Ö":"O","Ø":"O","Ố":"O","Ṍ":"O","Ṓ":"O","Ȏ":"O","Ù":"U","Ú":"U","Û":"U","Ü":"U","Ý":"Y","à":"a","á":"a","â":"a","ã":"a","ä":"a","å":"a","ấ":"a","ắ":"a","ẳ":"a","ẵ":"a","ặ":"a","æ":"ae","ầ":"a","ằ":"a","ȃ":"a","ç":"c","ḉ":"c","è":"e","é":"e","ê":"e","ë":"e","ế":"e","ḗ":"e","ề":"e","ḕ":"e","ḝ":"e","ȇ":"e","ì":"i","í":"i","î":"i","ï":"i","ḯ":"i","ȋ":"i","ð":"d","ñ":"n","ò":"o","ó":"o","ô":"o","õ":"o","ö":"o","ø":"o","ố":"o","ṍ":"o","ṓ":"o","ȏ":"o","ù":"u","ú":"u","û":"u","ü":"u","ý":"y","ÿ":"y","Ā":"A","ā":"a","Ă":"A","ă":"a","Ą":"A","ą":"a","Ć":"C","ć":"c","Ĉ":"C","ĉ":"c","Ċ":"C","ċ":"c","Č":"C","č":"c","C̆":"C","c̆":"c","Ď":"D","ď":"d","Đ":"D","đ":"d","Ē":"E","ē":"e","Ĕ":"E","ĕ":"e","Ė":"E","ė":"e","Ę":"E","ę":"e","Ě":"E","ě":"e","Ĝ":"G","Ǵ":"G","ĝ":"g","ǵ":"g","Ğ":"G","ğ":"g","Ġ":"G","ġ":"g","Ģ":"G","ģ":"g","Ĥ":"H","ĥ":"h","Ħ":"H","ħ":"h","Ḫ":"H","ḫ":"h","Ĩ":"I","ĩ":"i","Ī":"I","ī":"i","Ĭ":"I","ĭ":"i","Į":"I","į":"i","İ":"I","ı":"i","Ĳ":"IJ","ĳ":"ij","Ĵ":"J","ĵ":"j","Ķ":"K","ķ":"k","Ḱ":"K","ḱ":"k","K̆":"K","k̆":"k","Ĺ":"L","ĺ":"l","Ļ":"L","ļ":"l","Ľ":"L","ľ":"l","Ŀ":"L","ŀ":"l","Ł":"l","ł":"l","Ḿ":"M","ḿ":"m","M̆":"M","m̆":"m","Ń":"N","ń":"n","Ņ":"N","ņ":"n","Ň":"N","ň":"n","ŉ":"n","N̆":"N","n̆":"n","Ō":"O","ō":"o","Ŏ":"O","ŏ":"o","Ő":"O","ő":"o","Œ":"OE","œ":"oe","P̆":"P","p̆":"p","Ŕ":"R","ŕ":"r","Ŗ":"R","ŗ":"r","Ř":"R","ř":"r","R̆":"R","r̆":"r","Ȓ":"R","ȓ":"r","Ś":"S","ś":"s","Ŝ":"S","ŝ":"s","Ş":"S","Ș":"S","ș":"s","ş":"s","Š":"S","š":"s","Ţ":"T","ţ":"t","ț":"t","Ț":"T","Ť":"T","ť":"t","Ŧ":"T","ŧ":"t","T̆":"T","t̆":"t","Ũ":"U","ũ":"u","Ū":"U","ū":"u","Ŭ":"U","ŭ":"u","Ů":"U","ů":"u","Ű":"U","ű":"u","Ų":"U","ų":"u","Ȗ":"U","ȗ":"u","V̆":"V","v̆":"v","Ŵ":"W","ŵ":"w","Ẃ":"W","ẃ":"w","X̆":"X","x̆":"x","Ŷ":"Y","ŷ":"y","Ÿ":"Y","Y̆":"Y","y̆":"y","Ź":"Z","ź":"z","Ż":"Z","ż":"z","Ž":"Z","ž":"z","ſ":"s","ƒ":"f","Ơ":"O","ơ":"o","Ư":"U","ư":"u","Ǎ":"A","ǎ":"a","Ǐ":"I","ǐ":"i","Ǒ":"O","ǒ":"o","Ǔ":"U","ǔ":"u","Ǖ":"U","ǖ":"u","Ǘ":"U","ǘ":"u","Ǚ":"U","ǚ":"u","Ǜ":"U","ǜ":"u","Ứ":"U","ứ":"u","Ṹ":"U","ṹ":"u","Ǻ":"A","ǻ":"a","Ǽ":"AE","ǽ":"ae","Ǿ":"O","ǿ":"o","Þ":"TH","þ":"th","Ṕ":"P","ṕ":"p","Ṥ":"S","ṥ":"s","X́":"X","x́":"x","Ѓ":"Г","ѓ":"г","Ќ":"К","ќ":"к","A̋":"A","a̋":"a","E̋":"E","e̋":"e","I̋":"I","i̋":"i","Ǹ":"N","ǹ":"n","Ồ":"O","ồ":"o","Ṑ":"O","ṑ":"o","Ừ":"U","ừ":"u","Ẁ":"W","ẁ":"w","Ỳ":"Y","ỳ":"y","Ȁ":"A","ȁ":"a","Ȅ":"E","ȅ":"e","Ȉ":"I","ȉ":"i","Ȍ":"O","ȍ":"o","Ȑ":"R","ȑ":"r","Ȕ":"U","ȕ":"u","B̌":"B","b̌":"b","Č̣":"C","č̣":"c","Ê̌":"E","ê̌":"e","F̌":"F","f̌":"f","Ǧ":"G","ǧ":"g","Ȟ":"H","ȟ":"h","J̌":"J","ǰ":"j","Ǩ":"K","ǩ":"k","M̌":"M","m̌":"m","P̌":"P","p̌":"p","Q̌":"Q","q̌":"q","Ř̩":"R","ř̩":"r","Ṧ":"S","ṧ":"s","V̌":"V","v̌":"v","W̌":"W","w̌":"w","X̌":"X","x̌":"x","Y̌":"Y","y̌":"y","A̧":"A","a̧":"a","B̧":"B","b̧":"b","Ḑ":"D","ḑ":"d","Ȩ":"E","ȩ":"e","Ɛ̧":"E","ɛ̧":"e","Ḩ":"H","ḩ":"h","I̧":"I","i̧":"i","Ɨ̧":"I","ɨ̧":"i","M̧":"M","m̧":"m","O̧":"O","o̧":"o","Q̧":"Q","q̧":"q","U̧":"U","u̧":"u","X̧":"X","x̧":"x","Z̧":"Z","z̧":"z"},be=Object.keys(ye).join("|"),me=new RegExp(be,"g");var ve=7,we=6,xe=5,ke=4,$e=3,Se=2,Ce=1,Ee=0;function qe(e,t,n){var r;if((n=n||{}).threshold=null!=(r=n.threshold)?r:Ce,!n.accessors){const r=Me(e,t,n);return{rankedValue:e,rank:r,accessorIndex:-1,accessorThreshold:n.threshold,passed:r>=n.threshold}}const o=function(e,t){const n=[];for(let r=0,o=t.length;r<o;r++){const o=t[r],i=Te(o),s=Fe(e,o);for(let e=0,t=s.length;e<t;e++)n.push({itemValue:s[e],attributes:i})}return n}(e,n.accessors),i={rankedValue:e,rank:Ee,accessorIndex:-1,accessorThreshold:n.threshold,passed:!1};for(let s=0;s<o.length;s++){const e=o[s];let r=Me(e.itemValue,t,n);const{minRanking:a,maxRanking:l,threshold:d=n.threshold}=e.attributes;r<a&&r>=Ce?r=a:r>l&&(r=l),r=Math.min(r,l),r>=d&&r>i.rank&&(i.rank=r,i.passed=!0,i.accessorIndex=s,i.accessorThreshold=d,i.rankedValue=e.itemValue)}return i}function Me(e,t,n){return e=Le(e,n),(t=Le(t,n)).length>e.length?Ee:e===t?ve:(e=e.toLowerCase())===(t=t.toLowerCase())?we:e.startsWith(t)?xe:e.includes(` ${t}`)?ke:e.includes(t)?$e:1===t.length?Ee:function(e){let t="";return e.split(" ").forEach(e=>{e.split("-").forEach(e=>{t+=e.substr(0,1)})}),t}(e).includes(t)?Se:function(e,t){let n=0,r=0;function o(e,t,r){for(let o=r,i=t.length;o<i;o++){if(t[o]===e)return n+=1,o+1}return-1}function i(e){const r=1/e,o=n/t.length;return Ce+o*r}const s=o(t[0],e,0);if(s<0)return Ee;r=s;for(let a=1,l=t.length;a<l;a++){r=o(t[a],e,r);if(!(r>-1))return Ee}return i(r-s)}(e,t)}function Le(e,t){let{keepDiacritics:n}=t;return e=`${e}`,n||(e=e.replace(me,e=>ye[e])),e}function Fe(e,t){let n=t;"object"==typeof t&&(n=t.accessor);const r=n(e);return null==r?[]:Array.isArray(r)?r:[String(r)]}var De={maxRanking:1/0,minRanking:-1/0};function Te(e){return"function"==typeof e?De:{...De,...e}}var Ae={data:""},Oe=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,Ie=/\/\*[^]*?\*\/|  +/g,Pe=/\n+/g,ze=(e,t)=>{let n="",r="",o="";for(let i in e){let s=e[i];"@"==i[0]?"i"==i[1]?n=i+" "+s+";":r+="f"==i[1]?ze(s,i):i+"{"+ze(s,"k"==i[1]?"":t)+"}":"object"==typeof s?r+=ze(s,t?t.replace(/([^,])+/g,e=>i.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,t=>/&/.test(t)?t.replace(/&/g,e):e?e+" "+t:t)):i):null!=s&&(i=/^--/.test(i)?i:i.replace(/[A-Z]/g,"-$&").toLowerCase(),o+=ze.p?ze.p(i,s):i+":"+s+";")}return n+(t&&o?t+"{"+o+"}":o)+r},Ke={},Re=e=>{if("object"==typeof e){let t="";for(let n in e)t+=n+Re(e[n]);return t}return e};function Be(e){let t=this||{},n=e.call?e(t.p):e;return((e,t,n,r,o)=>{let i=Re(e),s=Ke[i]||(Ke[i]=(e=>{let t=0,n=11;for(;t<e.length;)n=101*n+e.charCodeAt(t++)>>>0;return"go"+n})(i));if(!Ke[s]){let t=i!==e?e:(e=>{let t,n,r=[{}];for(;t=Oe.exec(e.replace(Ie,""));)t[4]?r.shift():t[3]?(n=t[3].replace(Pe," ").trim(),r.unshift(r[0][n]=r[0][n]||{})):r[0][t[1]]=t[2].replace(Pe," ").trim();return r[0]})(e);Ke[s]=ze(o?{["@keyframes "+s]:t}:t,n?"":"."+s)}let a=n&&Ke.g?Ke.g:null;return n&&(Ke.g=Ke[s]),l=Ke[s],d=t,c=r,(u=a)?d.data=d.data.replace(u,l):-1===d.data.indexOf(l)&&(d.data=c?l+d.data:d.data+l),s;var l,d,c,u})(n.unshift?n.raw?((e,t,n)=>e.reduce((e,r,o)=>{let i=t[o];if(i&&i.call){let e=i(n),t=e&&e.props&&e.props.className||/^go/.test(e)&&e;i=t?"."+t:e&&"object"==typeof e?e.props?"":ze(e,""):!1===e?"":e}return e+r+(null==i?"":i)},""))(n,[].slice.call(arguments,1),t.p):n.reduce((e,n)=>Object.assign(e,n&&n.call?n(t.p):n),{}):n,(r=t.target,"object"==typeof window?((r?r.querySelector("#_goober"):window._goober)||Object.assign((r||document.head).appendChild(document.createElement("style")),{innerHTML:" ",id:"_goober"})).firstChild:r||Ae),t.g,t.o,t.k);var r}function He(e){var t,n,r="";if("string"==typeof e||"number"==typeof e)r+=e;else if("object"==typeof e)if(Array.isArray(e)){var o=e.length;for(t=0;t<o;t++)e[t]&&(n=He(e[t]))&&(r&&(r+=" "),r+=n)}else for(n in e)e[n]&&(r&&(r+=" "),r+=n);return r}function Ge(){for(var e,t,n=0,r="",o=arguments.length;n<o;n++)(e=arguments[n])&&(t=He(e))&&(r&&(r+=" "),r+=t);return r}function Ue(...e){return t=e,(...e)=>{for(const n of t)n&&n(...e)};var t}Be.bind({g:1}),Be.bind({k:1});var Ve=e=>e instanceof Element;function je(e,t){if(t(e))return e;if("function"==typeof e&&!e.length)return je(e(),t);if(Array.isArray(e)){const n=[];for(const r of e){const e=je(r,t);e&&(Array.isArray(e)?n.push.apply(n,e):n.push(e))}return n.length?n:null}return null}function Ne(e,t=Ve,n=Ve){const r=s(e),o=s(()=>je(r(),t));return o.toArray=()=>{const e=o();return Array.isArray(e)?e:e?[e]:[]},o}function Qe(e){requestAnimationFrame(()=>requestAnimationFrame(e))}function We(e,t,n,r){const{onBeforeEnter:o,onEnter:i,onAfterEnter:s}=t;function a(t){t&&t.target!==n||(n.removeEventListener("transitionend",a),n.removeEventListener("animationend",a),n.classList.remove(...e.enterActive),n.classList.remove(...e.enterTo),s?.(n))}o?.(n),n.classList.add(...e.enter),n.classList.add(...e.enterActive),queueMicrotask(()=>{if(!n.parentNode)return r?.();i?.(n,()=>a())}),Qe(()=>{n.classList.remove(...e.enter),n.classList.add(...e.enterTo),(!i||i.length<2)&&(n.addEventListener("transitionend",a),n.addEventListener("animationend",a))})}function _e(e,t,n,r){const{onBeforeExit:o,onExit:i,onAfterExit:s}=t;if(!n.parentNode)return r?.();function a(t){t&&t.target!==n||(r?.(),n.removeEventListener("transitionend",a),n.removeEventListener("animationend",a),n.classList.remove(...e.exitActive),n.classList.remove(...e.exitTo),s?.(n))}o?.(n),n.classList.add(...e.exit),n.classList.add(...e.exitActive),i?.(n,()=>a()),Qe(()=>{n.classList.remove(...e.exit),n.classList.add(...e.exitTo),(!i||i.length<2)&&(n.addEventListener("transitionend",a),n.addEventListener("animationend",a))})}var Xe=e=>{const t=function(e){return s(()=>{const t=e.name||"s";return{enterActive:(e.enterActiveClass||t+"-enter-active").split(" "),enter:(e.enterClass||t+"-enter").split(" "),enterTo:(e.enterToClass||t+"-enter-to").split(" "),exitActive:(e.exitActiveClass||t+"-exit-active").split(" "),exit:(e.exitClass||t+"-exit").split(" "),exitTo:(e.exitToClass||t+"-exit-to").split(" "),move:(e.moveClass||t+"-move").split(" ")}})}(e);return function(e,t){const n=O(e),{onChange:o}=t;let i=new Set(t.appear?void 0:n);const a=new WeakSet,[l,d]=r([],{equals:!1}),[c]=I(),u=e=>{d(t=>(t.push.apply(t,e),t));for(const t of e)a.delete(t)},g=(e,t,n)=>e.splice(n,0,t);return s(t=>{const n=l(),r=e();if(O(c))return c(),t;if(n.length){const e=t.filter(e=>!n.includes(e));return n.length=0,o({list:e,added:[],removed:[],unchanged:e,finishRemoved:u}),e}return O(()=>{const e=new Set(r),n=r.slice(),s=[],l=[],d=[];for(const t of r)(i.has(t)?d:s).push(t);let c=!s.length;for(let r=0;r<t.length;r++){const o=t[r];e.has(o)||(a.has(o)||(l.push(o),a.add(o)),g(n,o,r)),c&&o!==n[r]&&(c=!1)}return!l.length&&c?t:(o({list:n,added:s,removed:l,unchanged:d,finishRemoved:u}),i=e,n)})},t.appear?[]:n.slice())}(Ne(()=>e.children).toArray,{appear:e.appear,onChange({added:n,removed:r,finishRemoved:o,list:i}){const s=t();for(const t of n)We(s,e,t);const a=[];for(const e of i)e.isConnected&&(e instanceof HTMLElement||e instanceof SVGElement)&&a.push({el:e,rect:e.getBoundingClientRect()});queueMicrotask(()=>{const e=[];for(const{el:t,rect:n}of a)if(t.isConnected){const r=t.getBoundingClientRect(),o=n.left-r.left,i=n.top-r.top;(o||i)&&(t.style.transform=`translate(${o}px, ${i}px)`,t.style.transitionDuration="0s",e.push(t))}for(const t of e){let e=function(n){(n.target===t||/transform$/.test(n.propertyName))&&(t.removeEventListener("transitionend",e),t.classList.remove(...s.move))};t.classList.add(...s.move),t.style.transform=t.style.transitionDuration="",t.addEventListener("transitionend",e)}});for(const t of r)_e(s,e,t,()=>o([t]))}})},Ze=Symbol("fallback");function Ye(e){for(const t of e)t.dispose()}function Je(e){const{by:t}=e;return s(function(e,t,n,o={}){const i=new Map;return m(()=>Ye(i.values())),()=>{const n=e()||[];return O(()=>{if(!n.length)return Ye(i.values()),i.clear(),o.fallback?[K(e=>(i.set(Ze,{dispose:e}),o.fallback()))]:[];const e=new Array(n.length),r=i.get(Ze);if(!i.size||r){r?.dispose(),i.delete(Ze);for(let r=0;r<n.length;r++){const o=n[r];s(e,o,r,t(o,r))}return e}const a=new Set(i.keys());for(let o=0;o<n.length;o++){const r=n[o],l=t(r,o);a.delete(l);const d=i.get(l);d?(e[o]=d.mapped,d.setIndex?.(o),d.setItem(()=>r)):s(e,r,o,l)}for(const t of a)i.get(t)?.dispose(),i.delete(t);return e})};function s(e,t,o,s){K(a=>{const[l,d]=r(t),c={setItem:d,dispose:a};if(n.length>1){const[e,t]=r(o);c.setIndex=t,c.mapped=n(l,e)}else c.mapped=n(l);i.set(s,c),e[o]=c.mapped})}}(()=>e.each,"function"==typeof t?t:e=>e[t],e.children,"fallback"in e?{fallback:()=>e.fallback}:void 0))}function et(e,t,n,r){const o=()=>{J(Y(e)).forEach(e=>{e&&J(Y(t)).forEach(t=>function(e,t,n,r){return e.addEventListener(t,n,r),ee(e.removeEventListener.bind(e,t,n,r))}(e,t,n,r))})};"function"==typeof e?i(o):f(o)}function tt(e,t,n){const r=new WeakMap,{observe:o,unobserve:s}=function(e,t){const n=new ResizeObserver(e);return m(n.disconnect.bind(n)),{observe:e=>n.observe(e,t),unobserve:n.unobserve.bind(n)}}(e=>{for(const n of e){const{contentRect:e,target:o}=n,i=Math.round(e.width),s=Math.round(e.height),a=r.get(o);a&&a.width===i&&a.height===s||(t(e,o,n),r.set(o,{width:i,height:s}))}},n);i(t=>{const n=J(Y(e)).filter(Z);return function(e,t,n,r){const o=e.length,i=t.length;let s,a,l=0;if(i)if(o){for(;l<i&&t[l]===e[l];l++);for(s of(t=t.slice(l),e=e.slice(l),t))e.includes(s)||r(s);for(a of e)t.includes(a)||n(a)}else for(;l<i;l++)r(t[l]);else for(;l<o;l++)n(e[l])}(n,t,o,s),n},[])}var nt=/((?:--)?(?:\w+-?)+)\s*:\s*([^;]*)/g;function rt(e){const t={};let n;for(;n=nt.exec(e);)t[n[1]]=n[2];return t}function ot(e,t){if("string"==typeof e){if("string"==typeof t)return`${e};${t}`;e=rt(e)}else"string"==typeof t&&(t=rt(t));return{...e,...t}}function it(e,t){const n=[...e],r=n.indexOf(t);return-1!==r&&n.splice(r,1),n}function st(e){return"number"==typeof e}function at(e){return"[object String]"===Object.prototype.toString.call(e)}function lt(e){return t=>`${e()}-${t}`}function dt(e,t){return!!e&&(e===t||e.contains(t))}function ct(e,t=!1){const{activeElement:n}=ut(e);if(!n?.nodeName)return null;if(gt(n)&&n.contentDocument)return ct(n.contentDocument.body,t);if(t){const e=n.getAttribute("aria-activedescendant");if(e){const t=ut(n).getElementById(e);if(t)return t}}return n}function ut(e){return e?e.ownerDocument||e:document}function gt(e){return"IFRAME"===e.tagName}var ft=(e=>(e.Escape="Escape",e.Enter="Enter",e.Tab="Tab",e.Space=" ",e.ArrowDown="ArrowDown",e.ArrowLeft="ArrowLeft",e.ArrowRight="ArrowRight",e.ArrowUp="ArrowUp",e.End="End",e.Home="Home",e.PageDown="PageDown",e.PageUp="PageUp",e))(ft||{});function pt(e){return"undefined"!=typeof window&&null!=window.navigator&&e.test(window.navigator.userAgentData?.platform||window.navigator.platform)}function ht(){return pt(/^Mac/i)}function yt(){return pt(/^iPhone/i)||pt(/^iPad/i)||ht()&&navigator.maxTouchPoints>1}function bt(e,t){return t&&("function"==typeof t?t(e):t[0](t[1],e)),e?.defaultPrevented}function mt(e){return t=>{for(const n of e)bt(t,n)}}function vt(e){return ht()?e.metaKey&&!e.ctrlKey:e.ctrlKey&&!e.metaKey}function wt(e){if(e)if(function(){if(null==xt){xt=!1;try{document.createElement("div").focus({get preventScroll(){return xt=!0,!0}})}catch(e){}}return xt}())e.focus({preventScroll:!0});else{const t=function(e){let t=e.parentNode;const n=[],r=document.scrollingElement||document.documentElement;for(;t instanceof HTMLElement&&t!==r;)(t.offsetHeight<t.scrollHeight||t.offsetWidth<t.scrollWidth)&&n.push({element:t,scrollTop:t.scrollTop,scrollLeft:t.scrollLeft}),t=t.parentNode;r instanceof HTMLElement&&n.push({element:r,scrollTop:r.scrollTop,scrollLeft:r.scrollLeft});return n}(e);e.focus(),function(e){for(const{element:t,scrollTop:n,scrollLeft:r}of e)t.scrollTop=n,t.scrollLeft=r}(t)}}var xt=null;var kt=["input:not([type='hidden']):not([disabled])","select:not([disabled])","textarea:not([disabled])","button:not([disabled])","a[href]","area[href]","[tabindex]","iframe","object","embed","audio[controls]","video[controls]","[contenteditable]:not([contenteditable='false'])"],$t=[...kt,'[tabindex]:not([tabindex="-1"]):not([disabled])'],St=kt.join(":not([hidden]),")+",[tabindex]:not([disabled]):not([hidden])",Ct=$t.join(':not([hidden]):not([tabindex="-1"]),');function Et(e,t){const n=Array.from(e.querySelectorAll(St)).filter(qt);return t&&qt(e)&&n.unshift(e),n.forEach((e,t)=>{if(gt(e)&&e.contentDocument){const r=Et(e.contentDocument.body,!1);n.splice(t,1,...r)}}),n}function qt(e){return Mt(e)&&!function(e){const t=parseInt(e.getAttribute("tabindex")||"0",10);return t<0}(e)}function Mt(e){return e.matches(St)&&Lt(e)}function Lt(e,t){return"#comment"!==e.nodeName&&function(e){if(!(e instanceof HTMLElement||e instanceof SVGElement))return!1;const{display:t,visibility:n}=e.style;let r="none"!==t&&"hidden"!==n&&"collapse"!==n;if(r){if(!e.ownerDocument.defaultView)return r;const{getComputedStyle:t}=e.ownerDocument.defaultView,{display:n,visibility:o}=t(e);r="none"!==n&&"hidden"!==o&&"collapse"!==o}return r}(e)&&function(e,t){return!e.hasAttribute("hidden")&&("DETAILS"!==e.nodeName||!t||"SUMMARY"===t.nodeName||e.hasAttribute("open"))}(e,t)&&(!e.parentElement||Lt(e.parentElement,e))}function Ft(e){for(;e&&!Dt(e);)e=e.parentElement;return e||document.scrollingElement||document.documentElement}function Dt(e){const t=window.getComputedStyle(e);return/(auto|scroll)/.test(t.overflow+t.overflowX+t.overflowY)}function Tt(){}function At(e,t){return z(e,t)}var Ot=new Map,It=new Set;function Pt(){if("undefined"==typeof window)return;const e=t=>{if(!t.target)return;const n=Ot.get(t.target);if(n&&(n.delete(t.propertyName),0===n.size&&(t.target.removeEventListener("transitioncancel",e),Ot.delete(t.target)),0===Ot.size)){for(const e of It)e();It.clear()}};document.body.addEventListener("transitionrun",t=>{if(!t.target)return;let n=Ot.get(t.target);n||(n=new Set,Ot.set(t.target,n),t.target.addEventListener("transitioncancel",e)),n.add(t.propertyName)}),document.body.addEventListener("transitionend",e)}function zt(e,t){const n=Kt(e,t,"left"),r=Kt(e,t,"top"),o=t.offsetWidth,i=t.offsetHeight;let s=e.scrollLeft,a=e.scrollTop;const l=s+e.offsetWidth,d=a+e.offsetHeight;n<=s?s=n:n+o>l&&(s+=n+o-l),r<=a?a=r:r+i>d&&(a+=r+i-d),e.scrollLeft=s,e.scrollTop=a}function Kt(e,t,n){const r="left"===n?"offsetLeft":"offsetTop";let o=0;for(;t.offsetParent&&(o+=t[r],t.offsetParent!==e);){if(t.offsetParent.contains(e)){o-=e[r];break}t=t.offsetParent}return o}"undefined"!=typeof document&&("loading"!==document.readyState?Pt():document.addEventListener("DOMContentLoaded",Pt));var Rt={border:"0",clip:"rect(0 0 0 0)","clip-path":"inset(50%)",height:"1px",margin:"0 -1px -1px 0",overflow:"hidden",padding:"0",position:"absolute",width:"1px","white-space":"nowrap"};function Bt(e){return t=>(e(t),()=>e(void 0))}function Ht(e,t){const[n,o]=r(Gt(t?.()));return i(()=>{o(e()?.tagName.toLowerCase()||Gt(t?.()))}),n}function Gt(e){return at(e)?e:void 0}function Ut(e){const[t,n]=Q(e,["as"]);if(!t.as)throw new Error("[kobalte]: Polymorphic is missing the required `as` prop.");return a(W,z(n,{get component(){return t.as}}))}var Vt=["id","name","validationState","required","disabled","readOnly"];var jt=n();function Nt(){const e=b(jt);if(void 0===e)throw new Error("[kobalte]: `useFormControlContext` must be used within a `FormControlContext.Provider` component");return e}function Qt(e){const t=Nt(),n=At({id:t.generateId("description")},e);return i(()=>m(t.registerDescription(n.id))),a(Ut,z({as:"div"},()=>t.dataset(),n))}function Wt(e){const t=Nt(),n=At({id:t.generateId("error-message")},e),[r,o]=Q(n,["forceMount"]),s=()=>"invalid"===t.validationState();return i(()=>{s()&&m(t.registerErrorMessage(o.id))}),a(c,{get when(){return r.forceMount||s()},get children(){return a(Ut,z({as:"div"},()=>t.dataset(),o))}})}function _t(e){let t;const n=Nt(),r=At({id:n.generateId("label")},e),[o,s]=Q(r,["ref"]),l=Ht(()=>t,()=>"label");return i(()=>m(n.registerLabel(s.id))),a(Ut,z({as:"label",ref(e){const n=Ue(e=>t=e,o.ref);"function"==typeof n&&n(e)},get for(){return d(()=>"label"===l())()?n.fieldId():void 0}},()=>n.dataset(),s))}function Xt(e,t){i(x(e,e=>{if(null==e)return;const n=function(e){return function(e){return e.matches("textarea, input, select, button")}(e)?e.form:e.closest("form")}(e);null!=n&&(n.addEventListener("reset",t,{passive:!0}),m(()=>{n.removeEventListener("reset",t)}))}))}function Zt(e){const[t,n]=r(e.defaultValue?.()),o=s(()=>void 0!==e.value?.()),i=s(()=>o()?e.value?.():t());return[i,t=>{O(()=>{const r=function(e,...t){return"function"==typeof e?e(...t):e}(t,i());return Object.is(r,i())||(o()||n(r),e.onChange?.(r)),r})}]}function Yt(e){const[t,n]=Zt(e);return[()=>t()??!1,n]}var Jt=Object.defineProperty,en=(e,t)=>{for(var n in t)Jt(e,n,{get:t[n],enumerable:!0})},tn=n();function nn(){return b(tn)}function rn(e,t){return Boolean(t.compareDocumentPosition(e)&Node.DOCUMENT_POSITION_PRECEDING)}function on(e,t){const n=function(e){const t=e.map((e,t)=>[t,e]);let n=!1;return t.sort(([e,t],[r,o])=>{const i=t.ref(),s=o.ref();return i===s?0:i&&s?rn(i,s)?(e>r&&(n=!0),-1):(e<r&&(n=!0),1):0}),n?t.map(([e,t])=>t):e}(e);e!==n&&t(n)}function sn(e,t){if("function"!=typeof IntersectionObserver)return void function(e,t){i(()=>{const n=setTimeout(()=>{on(e(),t)});m(()=>clearTimeout(n))})}(e,t);let n=[];i(()=>{const r=function(e){const t=e[0],n=e[e.length-1]?.ref();let r=t?.ref()?.parentElement;for(;r;){if(n&&r.contains(n))return r;r=r.parentElement}return ut(r).body}(e()),o=new IntersectionObserver(()=>{const r=!!n.length;n=e(),r&&on(e(),t)},{root:r});for(const t of e()){const e=t.ref();e&&o.observe(e)}m(()=>o.disconnect())})}function an(e={}){const[t,n]=function(e){const[t,n]=Zt(e);return[()=>t()??[],n]}({value:()=>Y(e.items),onChange:t=>e.onItemsChange?.(t)});sn(t,n);const r=e=>(n(t=>{const n=function(e,t){const n=t.ref();if(!n)return-1;let r=e.length;if(!r)return-1;for(;r--;){const t=e[r]?.ref();if(t&&rn(t,n))return r+1}return 0}(t,e);return function(e,t,n=-1){return n in e?[...e.slice(0,n),t,...e.slice(n)]:[...e,t]}(t,e,n)}),()=>{n(t=>{const n=t.filter(t=>t.ref()!==e.ref());return t.length===n.length?t:n})});return{DomCollectionProvider:e=>a(tn.Provider,{value:{registerItem:r},get children(){return e.children}})}}function ln(e){const t=function(){const e=nn();if(void 0===e)throw new Error("[kobalte]: `useDomCollectionContext` must be used within a `DomCollectionProvider` component");return e}(),n=At({shouldRegisterItem:!0},e);i(()=>{if(!n.shouldRegisterItem)return;const e=t.registerItem(n.getItem());m(e)})}function dn(e){let t=e.startIndex??0;const n=e.startLevel??0,r=[],o=t=>{if(null==t)return"";const n=e.getKey??"key",r=at(n)?t[n]:n(t);return null!=r?String(r):""},i=t=>{if(null==t)return"";const n=e.getTextValue??"textValue",r=at(n)?t[n]:n(t);return null!=r?String(r):""},s=t=>{if(null==t)return!1;const n=e.getDisabled??"disabled";return(at(n)?t[n]:n(t))??!1},a=t=>{if(null!=t)return at(e.getSectionChildren)?t[e.getSectionChildren]:e.getSectionChildren?.(t)};for(const l of e.dataSource)if(at(l)||st(l))r.push({type:"item",rawValue:l,key:String(l),textValue:String(l),disabled:s(l),level:n,index:t}),t++;else if(null!=a(l)){r.push({type:"section",rawValue:l,key:"",textValue:"",disabled:!1,level:n,index:t}),t++;const o=a(l)??[];if(o.length>0){const i=dn({dataSource:o,getKey:e.getKey,getTextValue:e.getTextValue,getDisabled:e.getDisabled,getSectionChildren:e.getSectionChildren,startIndex:t,startLevel:n+1});r.push(...i),t+=i.length}}else r.push({type:"item",rawValue:l,key:o(l),textValue:i(l),disabled:s(l),level:n,index:t}),t++;return r}function cn(e,t=[]){return s(()=>{const n=dn({dataSource:Y(e.dataSource),getKey:Y(e.getKey),getTextValue:Y(e.getTextValue),getDisabled:Y(e.getDisabled),getSectionChildren:Y(e.getSectionChildren)});for(let e=0;e<t.length;e++)t[e]();return e.factory(n)})}var un=new Set(["Avst","Arab","Armi","Syrc","Samr","Mand","Thaa","Mend","Nkoo","Adlm","Rohg","Hebr"]),gn=new Set(["ae","ar","arc","bcc","bqi","ckb","dv","fa","glk","he","ku","mzn","nqo","pnb","ps","sd","ug","ur","yi"]);function fn(e){return function(e){if(Intl.Locale){const t=new Intl.Locale(e).maximize().script??"";return un.has(t)}const t=e.split("-")[0];return gn.has(t)}(e)?"rtl":"ltr"}function pn(){let e="undefined"!=typeof navigator&&(navigator.language||navigator.userLanguage)||"en-US";return{locale:e,direction:fn(e)}}var hn=pn(),yn=new Set;function bn(){hn=pn();for(const e of yn)e(hn)}var mn=n();function vn(){const e=function(){const[e,t]=r(hn),n=s(()=>e());return o(()=>{0===yn.size&&window.addEventListener("languagechange",bn),yn.add(t),m(()=>{yn.delete(t),0===yn.size&&window.removeEventListener("languagechange",bn)})}),{locale:()=>n().locale,direction:()=>n().direction}}();return b(mn)||e}var wn=new Map;var xn=class e extends Set{constructor(n,r,o){super(n),t(this,"anchorKey"),t(this,"currentKey"),n instanceof e?(this.anchorKey=r||n.anchorKey,this.currentKey=o||n.currentKey):(this.anchorKey=r,this.currentKey=o)}};function kn(e){return ht()||yt()?e.altKey:e.ctrlKey}function $n(e){return ht()?e.metaKey:e.ctrlKey}function Sn(e){return new xn(e)}function Cn(e){const t=At({selectionMode:"none",selectionBehavior:"toggle"},e),[n,o]=r(!1),[a,l]=r(),d=s(()=>{const e=Y(t.selectedKeys);return null!=e?Sn(e):e}),c=s(()=>{const e=Y(t.defaultSelectedKeys);return null!=e?Sn(e):new xn}),[u,g]=function(e){const[t,n]=Zt(e);return[()=>t()??new xn,n]}({value:d,defaultValue:c,onChange:e=>t.onSelectionChange?.(e)}),[f,p]=r(Y(t.selectionBehavior));return i(()=>{const e=u();"replace"===Y(t.selectionBehavior)&&"toggle"===f()&&"object"==typeof e&&0===e.size&&p("replace")}),i(()=>{p(Y(t.selectionBehavior)??"toggle")}),{selectionMode:()=>Y(t.selectionMode),disallowEmptySelection:()=>Y(t.disallowEmptySelection)??!1,selectionBehavior:f,setSelectionBehavior:p,isFocused:n,setFocused:o,focusedKey:a,setFocusedKey:l,selectedKeys:u,setSelectedKeys:e=>{!Y(t.allowDuplicateSelectionEvents)&&function(e,t){if(e.size!==t.size)return!1;for(const n of e)if(!t.has(n))return!1;return!0}(e,u())||g(e)}}}function En(e,t,n){const a=z({selectOnFocus:()=>"replace"===Y(e.selectionManager).selectionBehavior()},e),l=()=>t(),{direction:d}=vn();let c={top:0,left:0};et(()=>Y(a.isVirtualized)?void 0:l(),"scroll",()=>{const e=l();e&&(c={top:e.scrollTop,left:e.scrollLeft})});const{typeSelectHandlers:u}=function(e){const[t,n]=r(""),[o,i]=r(-1);return{typeSelectHandlers:{onKeyDown:r=>{if(Y(e.isDisabled))return;const s=Y(e.keyboardDelegate),a=Y(e.selectionManager);if(!s.getKeyForSearch)return;const l=function(e){return 1!==e.length&&/^[A-Z]/i.test(e)?"":e}(r.key);if(!l||r.ctrlKey||r.metaKey)return;" "===l&&t().trim().length>0&&(r.preventDefault(),r.stopPropagation());let d=n(e=>e+l),c=s.getKeyForSearch(d,a.focusedKey())??s.getKeyForSearch(d);null==c&&function(e){return e.split("").every(t=>t===e[0])}(d)&&(d=d[0],c=s.getKeyForSearch(d,a.focusedKey())??s.getKeyForSearch(d)),null!=c&&(a.setFocusedKey(c),e.onTypeSelect?.(c)),clearTimeout(o()),i(window.setTimeout(()=>n(""),500))}}}}({isDisabled:()=>Y(a.disallowTypeAhead),keyboardDelegate:()=>Y(a.keyboardDelegate),selectionManager:()=>Y(a.selectionManager)}),g=()=>Y(a.orientation)??"vertical",f=()=>{const e=Y(a.autoFocus);if(!e)return;const n=Y(a.selectionManager),r=Y(a.keyboardDelegate);let o;"first"===e&&(o=r.getFirstKey?.()),"last"===e&&(o=r.getLastKey?.());const i=n.selectedKeys();i.size&&(o=i.values().next().value),n.setFocused(!0),n.setFocusedKey(o);const s=t();s&&null==o&&!Y(a.shouldUseVirtualFocus)&&wt(s)};o(()=>{a.deferAutoFocus?setTimeout(f,0):f()}),i(x([l,()=>Y(a.isVirtualized),()=>Y(a.selectionManager).focusedKey()],e=>{const[t,n,r]=e;if(n)r&&a.scrollToKey?.(r);else if(r&&t){const e=t.querySelector(`[data-key="${r}"]`);e&&zt(t,e)}}));return{tabIndex:s(()=>{if(!Y(a.shouldUseVirtualFocus))return null==Y(a.selectionManager).focusedKey()?0:-1}),onKeyDown:e=>{bt(e,u.onKeyDown),e.altKey&&"Tab"===e.key&&e.preventDefault();const n=t();if(!n?.contains(e.target))return;const r=Y(a.selectionManager),o=Y(a.selectOnFocus),i=t=>{null!=t&&(r.setFocusedKey(t),e.shiftKey&&"multiple"===r.selectionMode()?r.extendSelection(t):o&&!kn(e)&&r.replaceSelection(t))},s=Y(a.keyboardDelegate),l=Y(a.shouldFocusWrap),c=r.focusedKey();switch(e.key){case"vertical"===g()?"ArrowDown":"ArrowRight":if(s.getKeyBelow){let t;e.preventDefault(),t=null!=c?s.getKeyBelow(c):s.getFirstKey?.(),null==t&&l&&(t=s.getFirstKey?.(c)),i(t)}break;case"vertical"===g()?"ArrowUp":"ArrowLeft":if(s.getKeyAbove){let t;e.preventDefault(),t=null!=c?s.getKeyAbove(c):s.getLastKey?.(),null==t&&l&&(t=s.getLastKey?.(c)),i(t)}break;case"vertical"===g()?"ArrowLeft":"ArrowUp":if(s.getKeyLeftOf){e.preventDefault();const t="rtl"===d();let n;n=null!=c?s.getKeyLeftOf(c):t?s.getFirstKey?.():s.getLastKey?.(),i(n)}break;case"vertical"===g()?"ArrowRight":"ArrowDown":if(s.getKeyRightOf){e.preventDefault();const t="rtl"===d();let n;n=null!=c?s.getKeyRightOf(c):t?s.getLastKey?.():s.getFirstKey?.(),i(n)}break;case"Home":if(s.getFirstKey){e.preventDefault();const t=s.getFirstKey(c,$n(e));null!=t&&(r.setFocusedKey(t),$n(e)&&e.shiftKey&&"multiple"===r.selectionMode()?r.extendSelection(t):o&&r.replaceSelection(t))}break;case"End":if(s.getLastKey){e.preventDefault();const t=s.getLastKey(c,$n(e));null!=t&&(r.setFocusedKey(t),$n(e)&&e.shiftKey&&"multiple"===r.selectionMode()?r.extendSelection(t):o&&r.replaceSelection(t))}break;case"PageDown":if(s.getKeyPageBelow&&null!=c){e.preventDefault();i(s.getKeyPageBelow(c))}break;case"PageUp":if(s.getKeyPageAbove&&null!=c){e.preventDefault();i(s.getKeyPageAbove(c))}break;case"a":$n(e)&&"multiple"===r.selectionMode()&&!0!==Y(a.disallowSelectAll)&&(e.preventDefault(),r.selectAll());break;case"Escape":e.defaultPrevented||(e.preventDefault(),Y(a.disallowEmptySelection)||r.clearSelection());break;case"Tab":if(!Y(a.allowsTabNavigation)){if(e.shiftKey)n.focus();else{const e=function(e,t){const n=t?.tabbable?Ct:St,r=document.createTreeWalker(e,NodeFilter.SHOW_ELEMENT,{acceptNode:e=>t?.from?.contains(e)?NodeFilter.FILTER_REJECT:e.matches(n)&&Lt(e)&&(!t?.accept||t.accept(e))?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP});return t?.from&&(r.currentNode=t.from),r}(n,{tabbable:!0});let t,r;do{r=e.lastChild(),r&&(t=r)}while(r);t&&!t.contains(document.activeElement)&&wt(t)}break}}},onMouseDown:e=>{l()===e.target&&e.preventDefault()},onFocusIn:e=>{const t=Y(a.selectionManager),n=Y(a.keyboardDelegate),r=Y(a.selectOnFocus);if(t.isFocused())e.currentTarget.contains(e.target)||t.setFocused(!1);else if(e.currentTarget.contains(e.target))if(t.setFocused(!0),null==t.focusedKey()){const o=e=>{null!=e&&(t.setFocusedKey(e),r&&t.replaceSelection(e))},i=e.relatedTarget;i&&e.currentTarget.compareDocumentPosition(i)&Node.DOCUMENT_POSITION_FOLLOWING?o(t.lastSelectedKey()??n.getLastKey?.()):o(t.firstSelectedKey()??n.getFirstKey?.())}else if(!Y(a.isVirtualized)){const e=l();if(e){e.scrollTop=c.top,e.scrollLeft=c.left;const n=e.querySelector(`[data-key="${t.focusedKey()}"]`);n&&(wt(n),zt(e,n))}}},onFocusOut:e=>{const t=Y(a.selectionManager);e.currentTarget.contains(e.relatedTarget)||t.setFocused(!1)}}}function qn(e,t){const n=()=>Y(e.selectionManager),r=()=>Y(e.key),o=()=>Y(e.shouldUseVirtualFocus),a=e=>{"none"!==n().selectionMode()&&("single"===n().selectionMode()?n().isSelected(r())&&!n().disallowEmptySelection()?n().toggleSelection(r()):n().replaceSelection(r()):e?.shiftKey?n().extendSelection(r()):"toggle"===n().selectionBehavior()||$n(e)||"pointerType"in e&&"touch"===e.pointerType?n().toggleSelection(r()):n().replaceSelection(r()))},l=()=>Y(e.disabled)||n().isDisabled(r()),d=()=>!l()&&n().canSelectItem(r());let c=null;const u=s(()=>{if(!o()&&!l())return r()===n().focusedKey()?0:-1}),g=s(()=>Y(e.virtualized)?void 0:r());return i(x([t,r,o,()=>n().focusedKey(),()=>n().isFocused()],([t,n,r,o,i])=>{t&&n===o&&i&&!r&&document.activeElement!==t&&(e.focus?e.focus():wt(t))})),{isSelected:()=>n().isSelected(r()),isDisabled:l,allowsSelection:d,tabIndex:u,dataKey:g,onPointerDown:t=>{d()&&(c=t.pointerType,"mouse"!==t.pointerType||0!==t.button||Y(e.shouldSelectOnPressUp)||a(t))},onPointerUp:t=>{d()&&"mouse"===t.pointerType&&0===t.button&&Y(e.shouldSelectOnPressUp)&&Y(e.allowsDifferentPressOrigin)&&a(t)},onClick:t=>{d()&&(Y(e.shouldSelectOnPressUp)&&!Y(e.allowsDifferentPressOrigin)||"mouse"!==c)&&a(t)},onKeyDown:e=>{d()&&["Enter"," "].includes(e.key)&&(kn(e)?n().toggleSelection(r()):a(e))},onMouseDown:e=>{l()&&e.preventDefault()},onFocus:e=>{const i=t();o()||l()||!i||e.target===i&&n().setFocusedKey(r())}}}var Mn=class{constructor(e,n){t(this,"collection"),t(this,"state"),this.collection=e,this.state=n}selectionMode(){return this.state.selectionMode()}disallowEmptySelection(){return this.state.disallowEmptySelection()}selectionBehavior(){return this.state.selectionBehavior()}setSelectionBehavior(e){this.state.setSelectionBehavior(e)}isFocused(){return this.state.isFocused()}setFocused(e){this.state.setFocused(e)}focusedKey(){return this.state.focusedKey()}setFocusedKey(e){(null==e||this.collection().getItem(e))&&this.state.setFocusedKey(e)}selectedKeys(){return this.state.selectedKeys()}isSelected(e){if("none"===this.state.selectionMode())return!1;const t=this.getKey(e);return null!=t&&this.state.selectedKeys().has(t)}isEmpty(){return 0===this.state.selectedKeys().size}isSelectAll(){if(this.isEmpty())return!1;const e=this.state.selectedKeys();return this.getAllSelectableKeys().every(t=>e.has(t))}firstSelectedKey(){let e;for(const t of this.state.selectedKeys()){const n=this.collection().getItem(t),r=null!=n?.index&&null!=e?.index&&n.index<e.index;e&&!r||(e=n)}return e?.key}lastSelectedKey(){let e;for(const t of this.state.selectedKeys()){const n=this.collection().getItem(t),r=null!=n?.index&&null!=e?.index&&n.index>e.index;e&&!r||(e=n)}return e?.key}extendSelection(e){if("none"===this.selectionMode())return;if("single"===this.selectionMode())return void this.replaceSelection(e);const t=this.getKey(e);if(null==t)return;const n=this.state.selectedKeys(),r=n.anchorKey||t,o=new xn(n,r,t);for(const i of this.getKeyRange(r,n.currentKey||t))o.delete(i);for(const i of this.getKeyRange(t,r))this.canSelectItem(i)&&o.add(i);this.state.setSelectedKeys(o)}getKeyRange(e,t){const n=this.collection().getItem(e),r=this.collection().getItem(t);return n&&r?null!=n.index&&null!=r.index&&n.index<=r.index?this.getKeyRangeInternal(e,t):this.getKeyRangeInternal(t,e):[]}getKeyRangeInternal(e,t){const n=[];let r=e;for(;null!=r;){const e=this.collection().getItem(r);if(e&&"item"===e.type&&n.push(r),r===t)return n;r=this.collection().getKeyAfter(r)}return[]}getKey(e){const t=this.collection().getItem(e);return t?t&&"item"===t.type?t.key:null:e}toggleSelection(e){if("none"===this.selectionMode())return;if("single"===this.selectionMode()&&!this.isSelected(e))return void this.replaceSelection(e);const t=this.getKey(e);if(null==t)return;const n=new xn(this.state.selectedKeys());n.has(t)?n.delete(t):this.canSelectItem(t)&&(n.add(t),n.anchorKey=t,n.currentKey=t),this.disallowEmptySelection()&&0===n.size||this.state.setSelectedKeys(n)}replaceSelection(e){if("none"===this.selectionMode())return;const t=this.getKey(e);if(null==t)return;const n=this.canSelectItem(t)?new xn([t],t,t):new xn;this.state.setSelectedKeys(n)}setSelectedKeys(e){if("none"===this.selectionMode())return;const t=new xn;for(const n of e){const e=this.getKey(n);if(null!=e&&(t.add(e),"single"===this.selectionMode()))break}this.state.setSelectedKeys(t)}selectAll(){"multiple"===this.selectionMode()&&this.state.setSelectedKeys(new Set(this.getAllSelectableKeys()))}clearSelection(){const e=this.state.selectedKeys();!this.disallowEmptySelection()&&e.size>0&&this.state.setSelectedKeys(new xn)}toggleSelectAll(){this.isSelectAll()?this.clearSelection():this.selectAll()}select(e,t){"none"!==this.selectionMode()&&("single"===this.selectionMode()?this.isSelected(e)&&!this.disallowEmptySelection()?this.toggleSelection(e):this.replaceSelection(e):"toggle"===this.selectionBehavior()||t&&"touch"===t.pointerType?this.toggleSelection(e):this.replaceSelection(e))}isSelectionEqual(e){if(e===this.state.selectedKeys())return!0;const t=this.selectedKeys();if(e.size!==t.size)return!1;for(const n of e)if(!t.has(n))return!1;for(const n of t)if(!e.has(n))return!1;return!0}canSelectItem(e){if("none"===this.state.selectionMode())return!1;const t=this.collection().getItem(e);return null!=t&&!t.disabled}isDisabled(e){const t=this.collection().getItem(e);return!t||t.disabled}getAllSelectableKeys(){const e=[];return(t=>{for(;null!=t;){if(this.canSelectItem(t)){const n=this.collection().getItem(t);if(!n)continue;"item"===n.type&&e.push(t)}t=this.collection().getKeyAfter(t)}})(this.collection().getFirstKey()),e}},Ln=class{constructor(e){t(this,"keyMap",new Map),t(this,"iterable"),t(this,"firstKey"),t(this,"lastKey"),this.iterable=e;for(const t of e)this.keyMap.set(t.key,t);if(0===this.keyMap.size)return;let n,r=0;for(const[t,o]of this.keyMap)n?(n.nextKey=t,o.prevKey=n.key):(this.firstKey=t,o.prevKey=void 0),"item"===o.type&&(o.index=r++),n=o,n.nextKey=void 0;this.lastKey=n.key}*[Symbol.iterator](){yield*this.iterable}getSize(){return this.keyMap.size}getKeys(){return this.keyMap.keys()}getKeyBefore(e){return this.keyMap.get(e)?.prevKey}getKeyAfter(e){return this.keyMap.get(e)?.nextKey}getFirstKey(){return this.firstKey}getLastKey(){return this.lastKey}getItem(e){return this.keyMap.get(e)}at(e){const t=[...this.getKeys()];return this.getItem(t[e])}};var Fn,Dn=e=>"function"==typeof e?e():e,Tn=e=>{const t=s(()=>{const t=Dn(e.element);if(t)return getComputedStyle(t)}),n=()=>t()?.animationName??"none",[o,a]=r(Dn(e.show)?"present":"hidden");let l="none";return i(r=>{const o=Dn(e.show);return O(()=>{if(r===o)return o;const e=l,i=n();if(o)a("present");else if("none"===i||"none"===t()?.display)a("hidden");else{a(!0===r&&e!==i?"hiding":"hidden")}}),o}),i(()=>{const t=Dn(e.element);if(!t)return;const r=e=>{e.target===t&&(l=n())},i=e=>{const r=n().includes(e.animationName);e.target===t&&r&&"hiding"===o()&&a("hidden")};t.addEventListener("animationstart",r),t.addEventListener("animationcancel",i),t.addEventListener("animationend",i),m(()=>{t.removeEventListener("animationstart",r),t.removeEventListener("animationcancel",i),t.removeEventListener("animationend",i)})}),{present:()=>"present"===o()||"hiding"===o(),state:o}},An="data-kb-top-layer",On=!1,In=[];function Pn(e){return In.findIndex(t=>t.node===e)}function zn(){return In.filter(e=>e.isPointerBlocking)}function Kn(){return zn().length>0}function Rn(e){const t=Pn([...zn()].slice(-1)[0]?.node);return Pn(e)<t}var Bn={layers:In,isTopMostLayer:function(e){return In[In.length-1].node===e},hasPointerBlockingLayer:Kn,isBelowPointerBlockingLayer:Rn,addLayer:function(e){In.push(e)},removeLayer:function(e){const t=Pn(e);t<0||In.splice(t,1)},indexOf:Pn,find:function(e){return In[Pn(e)]},assignPointerEventToLayers:function(){for(const{node:e}of In)e.style.pointerEvents=Rn(e)?"none":"auto"},disableBodyPointerEvents:function(e){if(Kn()&&!On){const t=ut(e);Fn=document.body.style.pointerEvents,t.body.style.pointerEvents="none",On=!0}},restoreBodyPointerEvents:function(e){if(Kn())return;const t=ut(e);t.body.style.pointerEvents=Fn,0===t.body.style.length&&t.body.removeAttribute("style"),On=!1}};en({},{Button:()=>Un,Root:()=>Gn});var Hn=["button","color","file","image","reset","submit"];function Gn(e){let t;const n=At({type:"button"},e),[r,o]=Q(n,["ref","type","disabled"]),i=Ht(()=>t,()=>"button"),l=s(()=>{const e=i();return null!=e&&function(e){const t=e.tagName.toLowerCase();return"button"===t||!("input"!==t||!e.type)&&-1!==Hn.indexOf(e.type)}({tagName:e,type:r.type})}),d=s(()=>"input"===i()),c=s(()=>"a"===i()&&null!=t?.getAttribute("href"));return a(Ut,z({as:"button",ref(e){const n=Ue(e=>t=e,r.ref);"function"==typeof n&&n(e)},get type(){return l()||d()?r.type:void 0},get role(){return l()||c()?void 0:"button"},get tabIndex(){return l()||c()||r.disabled?void 0:0},get disabled(){return l()||d()?r.disabled:void 0},get"aria-disabled"(){return!(l()||d()||!r.disabled)||void 0},get"data-disabled"(){return r.disabled?"":void 0}},o))}var Un=Gn,Vn=["top","right","bottom","left"],jn=Math.min,Nn=Math.max,Qn=Math.round,Wn=Math.floor,_n=e=>({x:e,y:e}),Xn={left:"right",right:"left",bottom:"top",top:"bottom"},Zn={start:"end",end:"start"};function Yn(e,t,n){return Nn(e,jn(t,n))}function Jn(e,t){return"function"==typeof e?e(t):e}function er(e){return e.split("-")[0]}function tr(e){return e.split("-")[1]}function nr(e){return"x"===e?"y":"x"}function rr(e){return"y"===e?"height":"width"}function or(e){return["top","bottom"].includes(er(e))?"y":"x"}function ir(e){return nr(or(e))}function sr(e){return e.replace(/start|end/g,e=>Zn[e])}function ar(e){return e.replace(/left|right|bottom|top/g,e=>Xn[e])}function lr(e){return"number"!=typeof e?function(e){return{top:0,right:0,bottom:0,left:0,...e}}(e):{top:e,right:e,bottom:e,left:e}}function dr(e){const{x:t,y:n,width:r,height:o}=e;return{width:r,height:o,top:n,left:t,right:t+r,bottom:n+o,x:t,y:n}}function cr(e,t,n){let{reference:r,floating:o}=e;const i=or(t),s=ir(t),a=rr(s),l=er(t),d="y"===i,c=r.x+r.width/2-o.width/2,u=r.y+r.height/2-o.height/2,g=r[a]/2-o[a]/2;let f;switch(l){case"top":f={x:c,y:r.y-o.height};break;case"bottom":f={x:c,y:r.y+r.height};break;case"right":f={x:r.x+r.width,y:u};break;case"left":f={x:r.x-o.width,y:u};break;default:f={x:r.x,y:r.y}}switch(tr(t)){case"start":f[s]-=g*(n&&d?-1:1);break;case"end":f[s]+=g*(n&&d?-1:1)}return f}async function ur(e,t){var n;void 0===t&&(t={});const{x:r,y:o,platform:i,rects:s,elements:a,strategy:l}=e,{boundary:d="clippingAncestors",rootBoundary:c="viewport",elementContext:u="floating",altBoundary:g=!1,padding:f=0}=Jn(t,e),p=lr(f),h=a[g?"floating"===u?"reference":"floating":u],y=dr(await i.getClippingRect({element:null==(n=await(null==i.isElement?void 0:i.isElement(h)))||n?h:h.contextElement||await(null==i.getDocumentElement?void 0:i.getDocumentElement(a.floating)),boundary:d,rootBoundary:c,strategy:l})),b="floating"===u?{x:r,y:o,width:s.floating.width,height:s.floating.height}:s.reference,m=await(null==i.getOffsetParent?void 0:i.getOffsetParent(a.floating)),v=await(null==i.isElement?void 0:i.isElement(m))&&await(null==i.getScale?void 0:i.getScale(m))||{x:1,y:1},w=dr(i.convertOffsetParentRelativeRectToViewportRelativeRect?await i.convertOffsetParentRelativeRectToViewportRelativeRect({elements:a,rect:b,offsetParent:m,strategy:l}):b);return{top:(y.top-w.top+p.top)/v.y,bottom:(w.bottom-y.bottom+p.bottom)/v.y,left:(y.left-w.left+p.left)/v.x,right:(w.right-y.right+p.right)/v.x}}function gr(e,t){return{top:e.top-t.height,right:e.right-t.width,bottom:e.bottom-t.height,left:e.left-t.width}}function fr(e){return Vn.some(t=>e[t]>=0)}function pr(e){return br(e)?(e.nodeName||"").toLowerCase():"#document"}function hr(e){var t;return(null==e||null==(t=e.ownerDocument)?void 0:t.defaultView)||window}function yr(e){var t;return null==(t=(br(e)?e.ownerDocument:e.document)||window.document)?void 0:t.documentElement}function br(e){return e instanceof Node||e instanceof hr(e).Node}function mr(e){return e instanceof Element||e instanceof hr(e).Element}function vr(e){return e instanceof HTMLElement||e instanceof hr(e).HTMLElement}function wr(e){return"undefined"!=typeof ShadowRoot&&(e instanceof ShadowRoot||e instanceof hr(e).ShadowRoot)}function xr(e){const{overflow:t,overflowX:n,overflowY:r,display:o}=qr(e);return/auto|scroll|overlay|hidden|clip/.test(t+r+n)&&!["inline","contents"].includes(o)}function kr(e){return["table","td","th"].includes(pr(e))}function $r(e){return[":popover-open",":modal"].some(t=>{try{return e.matches(t)}catch(n){return!1}})}function Sr(e){const t=Cr(),n=mr(e)?qr(e):e;return"none"!==n.transform||"none"!==n.perspective||!!n.containerType&&"normal"!==n.containerType||!t&&!!n.backdropFilter&&"none"!==n.backdropFilter||!t&&!!n.filter&&"none"!==n.filter||["transform","perspective","filter"].some(e=>(n.willChange||"").includes(e))||["paint","layout","strict","content"].some(e=>(n.contain||"").includes(e))}function Cr(){return!("undefined"==typeof CSS||!CSS.supports)&&CSS.supports("-webkit-backdrop-filter","none")}function Er(e){return["html","body","#document"].includes(pr(e))}function qr(e){return hr(e).getComputedStyle(e)}function Mr(e){return mr(e)?{scrollLeft:e.scrollLeft,scrollTop:e.scrollTop}:{scrollLeft:e.scrollX,scrollTop:e.scrollY}}function Lr(e){if("html"===pr(e))return e;const t=e.assignedSlot||e.parentNode||wr(e)&&e.host||yr(e);return wr(t)?t.host:t}function Fr(e){const t=Lr(e);return Er(t)?e.ownerDocument?e.ownerDocument.body:e.body:vr(t)&&xr(t)?t:Fr(t)}function Dr(e,t,n){var r;void 0===t&&(t=[]),void 0===n&&(n=!0);const o=Fr(e),i=o===(null==(r=e.ownerDocument)?void 0:r.body),s=hr(o);return i?t.concat(s,s.visualViewport||[],xr(o)?o:[],s.frameElement&&n?Dr(s.frameElement):[]):t.concat(o,Dr(o,[],n))}function Tr(e){const t=qr(e);let n=parseFloat(t.width)||0,r=parseFloat(t.height)||0;const o=vr(e),i=o?e.offsetWidth:n,s=o?e.offsetHeight:r,a=Qn(n)!==i||Qn(r)!==s;return a&&(n=i,r=s),{width:n,height:r,$:a}}function Ar(e){return mr(e)?e:e.contextElement}function Or(e){const t=Ar(e);if(!vr(t))return _n(1);const n=t.getBoundingClientRect(),{width:r,height:o,$:i}=Tr(t);let s=(i?Qn(n.width):n.width)/r,a=(i?Qn(n.height):n.height)/o;return s&&Number.isFinite(s)||(s=1),a&&Number.isFinite(a)||(a=1),{x:s,y:a}}var Ir=_n(0);function Pr(e){const t=hr(e);return Cr()&&t.visualViewport?{x:t.visualViewport.offsetLeft,y:t.visualViewport.offsetTop}:Ir}function zr(e,t,n,r){void 0===t&&(t=!1),void 0===n&&(n=!1);const o=e.getBoundingClientRect(),i=Ar(e);let s=_n(1);t&&(r?mr(r)&&(s=Or(r)):s=Or(e));const a=function(e,t,n){return void 0===t&&(t=!1),!(!n||t&&n!==hr(e))&&t}(i,n,r)?Pr(i):_n(0);let l=(o.left+a.x)/s.x,d=(o.top+a.y)/s.y,c=o.width/s.x,u=o.height/s.y;if(i){const e=hr(i),t=r&&mr(r)?hr(r):r;let n=e,o=n.frameElement;for(;o&&r&&t!==n;){const e=Or(o),t=o.getBoundingClientRect(),r=qr(o),i=t.left+(o.clientLeft+parseFloat(r.paddingLeft))*e.x,s=t.top+(o.clientTop+parseFloat(r.paddingTop))*e.y;l*=e.x,d*=e.y,c*=e.x,u*=e.y,l+=i,d+=s,n=hr(o),o=n.frameElement}}return dr({width:c,height:u,x:l,y:d})}function Kr(e){return zr(yr(e)).left+Mr(e).scrollLeft}function Rr(e,t,n){let r;if("viewport"===t)r=function(e,t){const n=hr(e),r=yr(e),o=n.visualViewport;let i=r.clientWidth,s=r.clientHeight,a=0,l=0;if(o){i=o.width,s=o.height;const e=Cr();(!e||e&&"fixed"===t)&&(a=o.offsetLeft,l=o.offsetTop)}return{width:i,height:s,x:a,y:l}}(e,n);else if("document"===t)r=function(e){const t=yr(e),n=Mr(e),r=e.ownerDocument.body,o=Nn(t.scrollWidth,t.clientWidth,r.scrollWidth,r.clientWidth),i=Nn(t.scrollHeight,t.clientHeight,r.scrollHeight,r.clientHeight);let s=-n.scrollLeft+Kr(e);const a=-n.scrollTop;return"rtl"===qr(r).direction&&(s+=Nn(t.clientWidth,r.clientWidth)-o),{width:o,height:i,x:s,y:a}}(yr(e));else if(mr(t))r=function(e,t){const n=zr(e,!0,"fixed"===t),r=n.top+e.clientTop,o=n.left+e.clientLeft,i=vr(e)?Or(e):_n(1);return{width:e.clientWidth*i.x,height:e.clientHeight*i.y,x:o*i.x,y:r*i.y}}(t,n);else{const n=Pr(e);r={...t,x:t.x-n.x,y:t.y-n.y}}return dr(r)}function Br(e,t){const n=Lr(e);return!(n===t||!mr(n)||Er(n))&&("fixed"===qr(n).position||Br(n,t))}function Hr(e,t,n){const r=vr(t),o=yr(t),i="fixed"===n,s=zr(e,!0,i,t);let a={scrollLeft:0,scrollTop:0};const l=_n(0);if(r||!r&&!i)if(("body"!==pr(t)||xr(o))&&(a=Mr(t)),r){const e=zr(t,!0,i,t);l.x=e.x+t.clientLeft,l.y=e.y+t.clientTop}else o&&(l.x=Kr(o));return{x:s.left+a.scrollLeft-l.x,y:s.top+a.scrollTop-l.y,width:s.width,height:s.height}}function Gr(e){return"static"===qr(e).position}function Ur(e,t){return vr(e)&&"fixed"!==qr(e).position?t?t(e):e.offsetParent:null}function Vr(e,t){const n=hr(e);if($r(e))return n;if(!vr(e)){let t=Lr(e);for(;t&&!Er(t);){if(mr(t)&&!Gr(t))return t;t=Lr(t)}return n}let r=Ur(e,t);for(;r&&kr(r)&&Gr(r);)r=Ur(r,t);return r&&Er(r)&&Gr(r)&&!Sr(r)?n:r||function(e){let t=Lr(e);for(;vr(t)&&!Er(t);){if(Sr(t))return t;if($r(t))return null;t=Lr(t)}return null}(e)||n}var jr={convertOffsetParentRelativeRectToViewportRelativeRect:function(e){let{elements:t,rect:n,offsetParent:r,strategy:o}=e;const i="fixed"===o,s=yr(r),a=!!t&&$r(t.floating);if(r===s||a&&i)return n;let l={scrollLeft:0,scrollTop:0},d=_n(1);const c=_n(0),u=vr(r);if((u||!u&&!i)&&(("body"!==pr(r)||xr(s))&&(l=Mr(r)),vr(r))){const e=zr(r);d=Or(r),c.x=e.x+r.clientLeft,c.y=e.y+r.clientTop}return{width:n.width*d.x,height:n.height*d.y,x:n.x*d.x-l.scrollLeft*d.x+c.x,y:n.y*d.y-l.scrollTop*d.y+c.y}},getDocumentElement:yr,getClippingRect:function(e){let{element:t,boundary:n,rootBoundary:r,strategy:o}=e;const i=[..."clippingAncestors"===n?$r(t)?[]:function(e,t){const n=t.get(e);if(n)return n;let r=Dr(e,[],!1).filter(e=>mr(e)&&"body"!==pr(e)),o=null;const i="fixed"===qr(e).position;let s=i?Lr(e):e;for(;mr(s)&&!Er(s);){const t=qr(s),n=Sr(s);n||"fixed"!==t.position||(o=null),(i?!n&&!o:!n&&"static"===t.position&&o&&["absolute","fixed"].includes(o.position)||xr(s)&&!n&&Br(e,s))?r=r.filter(e=>e!==s):o=t,s=Lr(s)}return t.set(e,r),r}(t,this._c):[].concat(n),r],s=i[0],a=i.reduce((e,n)=>{const r=Rr(t,n,o);return e.top=Nn(r.top,e.top),e.right=jn(r.right,e.right),e.bottom=jn(r.bottom,e.bottom),e.left=Nn(r.left,e.left),e},Rr(t,s,o));return{width:a.right-a.left,height:a.bottom-a.top,x:a.left,y:a.top}},getOffsetParent:Vr,getElementRects:async function(e){const t=this.getOffsetParent||Vr,n=this.getDimensions,r=await n(e.floating);return{reference:Hr(e.reference,await t(e.floating),e.strategy),floating:{x:0,y:0,width:r.width,height:r.height}}},getClientRects:function(e){return Array.from(e.getClientRects())},getDimensions:function(e){const{width:t,height:n}=Tr(e);return{width:t,height:n}},getScale:Or,isElement:mr,isRTL:function(e){return"rtl"===qr(e).direction}};function Nr(e,t,n,r){void 0===r&&(r={});const{ancestorScroll:o=!0,ancestorResize:i=!0,elementResize:s="function"==typeof ResizeObserver,layoutShift:a="function"==typeof IntersectionObserver,animationFrame:l=!1}=r,d=Ar(e),c=o||i?[...d?Dr(d):[],...Dr(t)]:[];c.forEach(e=>{o&&e.addEventListener("scroll",n,{passive:!0}),i&&e.addEventListener("resize",n)});const u=d&&a?function(e,t){let n,r=null;const o=yr(e);function i(){var e;clearTimeout(n),null==(e=r)||e.disconnect(),r=null}return function s(a,l){void 0===a&&(a=!1),void 0===l&&(l=1),i();const{left:d,top:c,width:u,height:g}=e.getBoundingClientRect();if(a||t(),!u||!g)return;const f={rootMargin:-Wn(c)+"px "+-Wn(o.clientWidth-(d+u))+"px "+-Wn(o.clientHeight-(c+g))+"px "+-Wn(d)+"px",threshold:Nn(0,jn(1,l))||1};let p=!0;function h(e){const t=e[0].intersectionRatio;if(t!==l){if(!p)return s();t?s(!1,t):n=setTimeout(()=>{s(!1,1e-7)},1e3)}p=!1}try{r=new IntersectionObserver(h,{...f,root:o.ownerDocument})}catch(y){r=new IntersectionObserver(h,f)}r.observe(e)}(!0),i}(d,n):null;let g,f=-1,p=null;s&&(p=new ResizeObserver(e=>{let[r]=e;r&&r.target===d&&p&&(p.unobserve(t),cancelAnimationFrame(f),f=requestAnimationFrame(()=>{var e;null==(e=p)||e.observe(t)})),n()}),d&&!l&&p.observe(d),p.observe(t));let h=l?zr(e):null;return l&&function t(){const r=zr(e);!h||r.x===h.x&&r.y===h.y&&r.width===h.width&&r.height===h.height||n();h=r,g=requestAnimationFrame(t)}(),n(),()=>{var e;c.forEach(e=>{o&&e.removeEventListener("scroll",n),i&&e.removeEventListener("resize",n)}),null==u||u(),null==(e=p)||e.disconnect(),p=null,l&&cancelAnimationFrame(g)}}var Qr=function(e){return void 0===e&&(e=0),{name:"offset",options:e,async fn(t){var n,r;const{x:o,y:i,placement:s,middlewareData:a}=t,l=await async function(e,t){const{placement:n,platform:r,elements:o}=e,i=await(null==r.isRTL?void 0:r.isRTL(o.floating)),s=er(n),a=tr(n),l="y"===or(n),d=["left","top"].includes(s)?-1:1,c=i&&l?-1:1,u=Jn(t,e);let{mainAxis:g,crossAxis:f,alignmentAxis:p}="number"==typeof u?{mainAxis:u,crossAxis:0,alignmentAxis:null}:{mainAxis:0,crossAxis:0,alignmentAxis:null,...u};return a&&"number"==typeof p&&(f="end"===a?-1*p:p),l?{x:f*c,y:g*d}:{x:g*d,y:f*c}}(t,e);return s===(null==(n=a.offset)?void 0:n.placement)&&null!=(r=a.arrow)&&r.alignmentOffset?{}:{x:o+l.x,y:i+l.y,data:{...l,placement:s}}}}},Wr=function(e){return void 0===e&&(e={}),{name:"shift",options:e,async fn(t){const{x:n,y:r,placement:o}=t,{mainAxis:i=!0,crossAxis:s=!1,limiter:a={fn:e=>{let{x:t,y:n}=e;return{x:t,y:n}}},...l}=Jn(e,t),d={x:n,y:r},c=await ur(t,l),u=or(er(o)),g=nr(u);let f=d[g],p=d[u];if(i){const e="y"===g?"bottom":"right";f=Yn(f+c["y"===g?"top":"left"],f,f-c[e])}if(s){const e="y"===u?"bottom":"right";p=Yn(p+c["y"===u?"top":"left"],p,p-c[e])}const h=a.fn({...t,[g]:f,[u]:p});return{...h,data:{x:h.x-n,y:h.y-r}}}}},_r=function(e){return void 0===e&&(e={}),{name:"flip",options:e,async fn(t){var n,r;const{placement:o,middlewareData:i,rects:s,initialPlacement:a,platform:l,elements:d}=t,{mainAxis:c=!0,crossAxis:u=!0,fallbackPlacements:g,fallbackStrategy:f="bestFit",fallbackAxisSideDirection:p="none",flipAlignment:h=!0,...y}=Jn(e,t);if(null!=(n=i.arrow)&&n.alignmentOffset)return{};const b=er(o),m=or(a),v=er(a)===a,w=await(null==l.isRTL?void 0:l.isRTL(d.floating)),x=g||(v||!h?[ar(a)]:function(e){const t=ar(e);return[sr(e),t,sr(t)]}(a)),k="none"!==p;!g&&k&&x.push(...function(e,t,n,r){const o=tr(e);let i=function(e,t,n){const r=["left","right"],o=["right","left"],i=["top","bottom"],s=["bottom","top"];switch(e){case"top":case"bottom":return n?t?o:r:t?r:o;case"left":case"right":return t?i:s;default:return[]}}(er(e),"start"===n,r);return o&&(i=i.map(e=>e+"-"+o),t&&(i=i.concat(i.map(sr)))),i}(a,h,p,w));const $=[a,...x],S=await ur(t,y),C=[];let E=(null==(r=i.flip)?void 0:r.overflows)||[];if(c&&C.push(S[b]),u){const e=function(e,t,n){void 0===n&&(n=!1);const r=tr(e),o=ir(e),i=rr(o);let s="x"===o?r===(n?"end":"start")?"right":"left":"start"===r?"bottom":"top";return t.reference[i]>t.floating[i]&&(s=ar(s)),[s,ar(s)]}(o,s,w);C.push(S[e[0]],S[e[1]])}if(E=[...E,{placement:o,overflows:C}],!C.every(e=>e<=0)){var q,M;const e=((null==(q=i.flip)?void 0:q.index)||0)+1,t=$[e];if(t)return{data:{index:e,overflows:E},reset:{placement:t}};let n=null==(M=E.filter(e=>e.overflows[0]<=0).sort((e,t)=>e.overflows[1]-t.overflows[1])[0])?void 0:M.placement;if(!n)switch(f){case"bestFit":{var L;const e=null==(L=E.filter(e=>{if(k){const t=or(e.placement);return t===m||"y"===t}return!0}).map(e=>[e.placement,e.overflows.filter(e=>e>0).reduce((e,t)=>e+t,0)]).sort((e,t)=>e[1]-t[1])[0])?void 0:L[0];e&&(n=e);break}case"initialPlacement":n=a}if(o!==n)return{reset:{placement:n}}}return{}}}},Xr=function(e){return void 0===e&&(e={}),{name:"size",options:e,async fn(t){const{placement:n,rects:r,platform:o,elements:i}=t,{apply:s=()=>{},...a}=Jn(e,t),l=await ur(t,a),d=er(n),c=tr(n),u="y"===or(n),{width:g,height:f}=r.floating;let p,h;"top"===d||"bottom"===d?(p=d,h=c===(await(null==o.isRTL?void 0:o.isRTL(i.floating))?"start":"end")?"left":"right"):(h=d,p="end"===c?"top":"bottom");const y=f-l.top-l.bottom,b=g-l.left-l.right,m=jn(f-l[p],y),v=jn(g-l[h],b),w=!t.middlewareData.shift;let x=m,k=v;if(u?k=c||w?jn(v,b):b:x=c||w?jn(m,y):y,w&&!c){const e=Nn(l.left,0),t=Nn(l.right,0),n=Nn(l.top,0),r=Nn(l.bottom,0);u?k=g-2*(0!==e||0!==t?e+t:Nn(l.left,l.right)):x=f-2*(0!==n||0!==r?n+r:Nn(l.top,l.bottom))}await s({...t,availableWidth:k,availableHeight:x});const $=await o.getDimensions(i.floating);return g!==$.width||f!==$.height?{reset:{rects:!0}}:{}}}},Zr=function(e){return void 0===e&&(e={}),{name:"hide",options:e,async fn(t){const{rects:n}=t,{strategy:r="referenceHidden",...o}=Jn(e,t);switch(r){case"referenceHidden":{const e=gr(await ur(t,{...o,elementContext:"reference"}),n.reference);return{data:{referenceHiddenOffsets:e,referenceHidden:fr(e)}}}case"escaped":{const e=gr(await ur(t,{...o,altBoundary:!0}),n.floating);return{data:{escapedOffsets:e,escaped:fr(e)}}}default:return{}}}}},Yr=e=>({name:"arrow",options:e,async fn(t){const{x:n,y:r,placement:o,rects:i,platform:s,elements:a,middlewareData:l}=t,{element:d,padding:c=0}=Jn(e,t)||{};if(null==d)return{};const u=lr(c),g={x:n,y:r},f=ir(o),p=rr(f),h=await s.getDimensions(d),y="y"===f,b=y?"top":"left",m=y?"bottom":"right",v=y?"clientHeight":"clientWidth",w=i.reference[p]+i.reference[f]-g[f]-i.floating[p],x=g[f]-i.reference[f],k=await(null==s.getOffsetParent?void 0:s.getOffsetParent(d));let $=k?k[v]:0;$&&await(null==s.isElement?void 0:s.isElement(k))||($=a.floating[v]||i.floating[p]);const S=w/2-x/2,C=$/2-h[p]/2-1,E=jn(u[b],C),q=jn(u[m],C),M=E,L=$-h[p]-q,F=$/2-h[p]/2+S,D=Yn(M,F,L),T=!l.arrow&&null!=tr(o)&&F!==D&&i.reference[p]/2-(F<M?E:q)-h[p]/2<0,A=T?F<M?F-M:F-L:0;return{[f]:g[f]+A,data:{[f]:D,centerOffset:F-D-A,...T&&{alignmentOffset:A}},reset:T}}}),Jr=(e,t,n)=>{const r=new Map,o={platform:jr,...n},i={...o.platform,_c:r};return(async(e,t,n)=>{const{placement:r="bottom",strategy:o="absolute",middleware:i=[],platform:s}=n,a=i.filter(Boolean),l=await(null==s.isRTL?void 0:s.isRTL(t));let d=await s.getElementRects({reference:e,floating:t,strategy:o}),{x:c,y:u}=cr(d,r,l),g=r,f={},p=0;for(let h=0;h<a.length;h++){const{name:n,fn:i}=a[h],{x:y,y:b,data:m,reset:v}=await i({x:c,y:u,initialPlacement:r,placement:g,strategy:o,middlewareData:f,rects:d,platform:s,elements:{reference:e,floating:t}});c=null!=y?y:c,u=null!=b?b:u,f={...f,[n]:{...f[n],...m}},v&&p<=50&&(p++,"object"==typeof v&&(v.placement&&(g=v.placement),v.rects&&(d=!0===v.rects?await s.getElementRects({reference:e,floating:t,strategy:o}):v.rects),({x:c,y:u}=cr(d,g,l))),h=-1)}return{x:c,y:u,placement:g,strategy:o,middlewareData:f}})(e,t,{...o,platform:i})},eo=n();function to(){const e=b(eo);if(void 0===e)throw new Error("[kobalte]: `usePopperContext` must be used within a `Popper` component");return e}var no=u('<svg display="block" viewBox="0 0 30 30" style="transform:scale(1.02)"><g><path fill="none" d="M23,27.8c1.1,1.2,3.4,2.2,5,2.2h2H0h2c1.7,0,3.9-1,5-2.2l6.6-7.2c0.7-0.8,2-0.8,2.7,0L23,27.8L23,27.8z"></path><path stroke="none" d="M23,27.8c1.1,1.2,3.4,2.2,5,2.2h2H0h2c1.7,0,3.9-1,5-2.2l6.6-7.2c0.7-0.8,2-0.8,2.7,0L23,27.8L23,27.8z">'),ro={top:180,right:-90,bottom:0,left:90};function oo(e){const t=to(),n=At({size:30},e),[o,s]=Q(n,["ref","style","size"]),l=()=>t.currentPlacement().split("-")[0],d=function(e){const[t,n]=r();return i(()=>{const t=e();var r;t&&n((r=t,ut(r).defaultView||window).getComputedStyle(t))}),t}(t.contentRef),c=()=>2*Number.parseInt(d()?.getPropertyValue(`border-${l()}-width`)||"0px")*(30/o.size);return a(Ut,z({as:"div",ref(e){const n=Ue(t.setArrowRef,o.ref);"function"==typeof n&&n(e)},"aria-hidden":"true",get style(){return ot({position:"absolute","font-size":`${o.size}px`,width:"1em",height:"1em","pointer-events":"none",fill:d()?.getPropertyValue("background-color")||"none",stroke:d()?.getPropertyValue(`border-${l()}-color`)||"none","stroke-width":c()},o.style)}},s,{get children(){const e=no(),t=e.firstChild;return f(()=>k(t,"transform",`rotate(${ro[l()]} 15 15) translate(0 2)`)),e}}))}function io(e){const{x:t=0,y:n=0,width:r=0,height:o=0}=e??{};if("function"==typeof DOMRect)return new DOMRect(t,n,r,o);const i={x:t,y:n,width:r,height:o,top:n,right:t+r,bottom:n+o,left:t};return{...i,toJSON:()=>i}}function so(e){return/^(?:top|bottom|left|right)(?:-(?:start|end))?$/.test(e)}var ao={top:"bottom",right:"left",bottom:"top",left:"right"};var lo=Object.assign(function(e){const t=At({getAnchorRect:e=>e?.getBoundingClientRect(),placement:"bottom",gutter:0,shift:0,flip:!0,slide:!0,overlap:!1,sameWidth:!1,fitViewport:!1,hideWhenDetached:!1,detachedPadding:0,arrowPadding:4,overflowPadding:8},e),[n,o]=r(),[s,l]=r(),[d,c]=r(t.placement),u=()=>{return e=t.anchorRef?.(),n=t.getAnchorRect,{contextElement:e,getBoundingClientRect:()=>{const t=n(e);return t?io(t):e?e.getBoundingClientRect():io()}};var e,n},{direction:g}=vn();async function f(){const e=u(),r=n(),o=s();if(!e||!r)return;const i=(o?.clientHeight||0)/2,a="number"==typeof t.gutter?t.gutter+i:t.gutter??i;r.style.setProperty("--kb-popper-content-overflow-padding",`${t.overflowPadding}px`),e.getBoundingClientRect();const l=[Qr(({placement:e})=>{const n=!!e.split("-")[1];return{mainAxis:a,crossAxis:n?void 0:t.shift,alignmentAxis:t.shift}})];if(!1!==t.flip){const e="string"==typeof t.flip?t.flip.split(" "):void 0;if(void 0!==e&&!e.every(so))throw new Error("`flip` expects a spaced-delimited list of placements");l.push(_r({padding:t.overflowPadding,fallbackPlacements:e}))}(t.slide||t.overlap)&&l.push(Wr({mainAxis:t.slide,crossAxis:t.overlap,padding:t.overflowPadding})),l.push(Xr({padding:t.overflowPadding,apply({availableWidth:e,availableHeight:n,rects:o}){const i=Math.round(o.reference.width);e=Math.floor(e),n=Math.floor(n),r.style.setProperty("--kb-popper-anchor-width",`${i}px`),r.style.setProperty("--kb-popper-content-available-width",`${e}px`),r.style.setProperty("--kb-popper-content-available-height",`${n}px`),t.sameWidth&&(r.style.width=`${i}px`),t.fitViewport&&(r.style.maxWidth=`${e}px`,r.style.maxHeight=`${n}px`)}})),t.hideWhenDetached&&l.push(Zr({padding:t.detachedPadding})),o&&l.push(Yr({element:o,padding:t.arrowPadding}));const d=await Jr(e,r,{placement:t.placement,strategy:"absolute",middleware:l,platform:{...jr,isRTL:()=>"rtl"===g()}});if(c(d.placement),t.onCurrentPlacementChange?.(d.placement),!r)return;r.style.setProperty("--kb-popper-content-transform-origin",function(e,t){const[n,r]=e.split("-"),o=ao[n];return r?"left"===n||"right"===n?`${o} ${"start"===r?"top":"bottom"}`:"start"===r?`${o} ${"rtl"===t?"right":"left"}`:`${o} ${"rtl"===t?"left":"right"}`:`${o} center`}(d.placement,g()));const f=Math.round(d.x),p=Math.round(d.y);let h;if(t.hideWhenDetached&&(h=d.middlewareData.hide?.referenceHidden?"hidden":"visible"),Object.assign(r.style,{top:"0",left:"0",transform:`translate3d(${f}px, ${p}px, 0)`,visibility:h}),o&&d.middlewareData.arrow){const{x:e,y:t}=d.middlewareData.arrow,n=d.placement.split("-")[0];Object.assign(o.style,{left:null!=e?`${e}px`:"",top:null!=t?`${t}px`:"",[n]:"100%"})}}i(()=>{const e=u(),t=n();if(!e||!t)return;const r=Nr(e,t,f,{elementResize:"function"==typeof ResizeObserver});m(r)}),i(()=>{const e=n(),r=t.contentRef?.();e&&r&&queueMicrotask(()=>{e.style.zIndex=getComputedStyle(r).zIndex})});const p={currentPlacement:d,contentRef:()=>t.contentRef?.(),setPositionerRef:o,setArrowRef:l};return a(eo.Provider,{value:p,get children(){return t.children}})},{Arrow:oo,Context:eo,usePopperContext:to,Positioner:function(e){const t=to(),[n,r]=Q(e,["ref","style"]);return a(Ut,z({as:"div",ref(e){const r=Ue(t.setPositionerRef,n.ref);"function"==typeof r&&r(e)},"data-popper-positioner":"",get style(){return ot({position:"absolute",top:0,left:0,"min-width":"max-content"},n.style)}},r))}});var co="interactOutside.pointerDownOutside",uo="interactOutside.focusOutside";var go=n();function fo(e){let t;const n=b(go),[r,s]=Q(e,["ref","disableOutsidePointerEvents","excludedElements","onEscapeKeyDown","onPointerDownOutside","onFocusOutside","onInteractOutside","onDismiss","bypassTopMostLayerCheck"]),l=new Set([]);!function(e,t){let n,r=Tt;const o=()=>ut(t()),s=t=>e.onPointerDownOutside?.(t),a=t=>e.onFocusOutside?.(t),l=t=>e.onInteractOutside?.(t),d=n=>{const r=n.target;return r instanceof HTMLElement&&!r.closest(`[${An}]`)&&!!dt(o(),r)&&!dt(t(),r)&&!e.shouldExcludeElement?.(r)},c=e=>{function n(){const n=t(),r=e.target;if(!n||!r||!d(e))return;const o=mt([s,l]);r.addEventListener(co,o,{once:!0});const i=new CustomEvent(co,{bubbles:!1,cancelable:!0,detail:{originalEvent:e,isContextMenu:2===e.button||vt(e)&&0===e.button}});r.dispatchEvent(i)}"touch"===e.pointerType?(o().removeEventListener("click",n),r=n,o().addEventListener("click",n,{once:!0})):n()},u=e=>{const n=t(),r=e.target;if(!n||!r||!d(e))return;const o=mt([a,l]);r.addEventListener(uo,o,{once:!0});const i=new CustomEvent(uo,{bubbles:!1,cancelable:!0,detail:{originalEvent:e,isContextMenu:!1}});r.dispatchEvent(i)};i(()=>{Y(e.isDisabled)||(n=window.setTimeout(()=>{o().addEventListener("pointerdown",c,!0)},0),o().addEventListener("focusin",u,!0),m(()=>{window.clearTimeout(n),o().removeEventListener("click",r),o().removeEventListener("pointerdown",c,!0),o().removeEventListener("focusin",u,!0)}))})}({shouldExcludeElement:e=>!!t&&(r.excludedElements?.some(t=>dt(t(),e))||[...l].some(t=>dt(t,e))),onPointerDownOutside:e=>{t&&!Bn.isBelowPointerBlockingLayer(t)&&(r.bypassTopMostLayerCheck||Bn.isTopMostLayer(t))&&(r.onPointerDownOutside?.(e),r.onInteractOutside?.(e),e.defaultPrevented||r.onDismiss?.())},onFocusOutside:e=>{r.onFocusOutside?.(e),r.onInteractOutside?.(e),e.defaultPrevented||r.onDismiss?.()}},()=>t),function(e){const t=t=>{t.key===ft.Escape&&e.onEscapeKeyDown?.(t)};i(()=>{if(Y(e.isDisabled))return;const n=e.ownerDocument?.()??ut();n.addEventListener("keydown",t),m(()=>{n.removeEventListener("keydown",t)})})}({ownerDocument:()=>ut(t),onEscapeKeyDown:e=>{t&&Bn.isTopMostLayer(t)&&(r.onEscapeKeyDown?.(e),!e.defaultPrevented&&r.onDismiss&&(e.preventDefault(),r.onDismiss()))}}),o(()=>{if(!t)return;Bn.addLayer({node:t,isPointerBlocking:r.disableOutsidePointerEvents,dismiss:r.onDismiss});const e=n?.registerNestedLayer(t);Bn.assignPointerEventToLayers(),Bn.disableBodyPointerEvents(t),m(()=>{t&&(Bn.removeLayer(t),e?.(),Bn.assignPointerEventToLayers(),Bn.restoreBodyPointerEvents(t))})}),i(x([()=>t,()=>r.disableOutsidePointerEvents],([e,t])=>{if(!e)return;const n=Bn.find(e);n&&n.isPointerBlocking!==t&&(n.isPointerBlocking=t,Bn.assignPointerEventToLayers()),t&&Bn.disableBodyPointerEvents(e),m(()=>{Bn.restoreBodyPointerEvents(e)})},{defer:!0}));const d={registerNestedLayer:e=>{l.add(e);const t=n?.registerNestedLayer(e);return()=>{l.delete(e),t?.()}}};return a(go.Provider,{value:d,get children(){return a(Ut,z({as:"div",ref(e){const n=Ue(e=>t=e,r.ref);"function"==typeof n&&n(e)}},s))}})}function po(e={}){const[t,n]=Yt({value:()=>Y(e.open),defaultValue:()=>!!Y(e.defaultOpen),onChange:t=>e.onOpenChange?.(t)}),r=()=>{n(!0)},o=()=>{n(!1)};return{isOpen:t,setIsOpen:n,open:r,close:o,toggle:()=>{t()?o():r()}}}var ho={};en(ho,{Description:()=>Qt,ErrorMessage:()=>Wt,Item:()=>wo,ItemControl:()=>xo,ItemDescription:()=>ko,ItemIndicator:()=>$o,ItemInput:()=>So,ItemLabel:()=>Co,Label:()=>Eo,RadioGroup:()=>Mo,Root:()=>qo});var yo=n();function bo(){const e=b(yo);if(void 0===e)throw new Error("[kobalte]: `useRadioGroupContext` must be used within a `RadioGroup` component");return e}var mo=n();function vo(){const e=b(mo);if(void 0===e)throw new Error("[kobalte]: `useRadioGroupItemContext` must be used within a `RadioGroup.Item` component");return e}function wo(e){const t=Nt(),n=bo(),o=At({id:`${t.generateId("item")}-${C()}`},e),[i,l]=Q(o,["value","disabled","onPointerDown"]),[d,c]=r(),[u,g]=r(),[f,p]=r(),[h,y]=r(),[b,m]=r(!1),v=s(()=>n.isSelectedValue(i.value)),w=s(()=>i.disabled||t.isDisabled()||!1),x=e=>{bt(e,i.onPointerDown),b()&&e.preventDefault()},k=s(()=>({...t.dataset(),"data-disabled":w()?"":void 0,"data-checked":v()?"":void 0})),$={value:()=>i.value,dataset:k,isSelected:v,isDisabled:w,inputId:d,labelId:u,descriptionId:f,inputRef:h,select:()=>n.setSelectedValue(i.value),generateId:lt(()=>l.id),registerInput:Bt(c),registerLabel:Bt(g),registerDescription:Bt(p),setIsFocused:m,setInputRef:y};return a(mo.Provider,{value:$,get children(){return a(Ut,z({as:"div",role:"group",onPointerDown:x},k,l))}})}function xo(e){const t=vo(),n=At({id:t.generateId("control")},e),[r,o]=Q(n,["onClick","onKeyDown"]);return a(Ut,z({as:"div",onClick:e=>{bt(e,r.onClick),t.select(),t.inputRef()?.focus()},onKeyDown:e=>{bt(e,r.onKeyDown),e.key===ft.Space&&(t.select(),t.inputRef()?.focus())}},()=>t.dataset(),o))}function ko(e){const t=vo(),n=At({id:t.generateId("description")},e);return i(()=>m(t.registerDescription(n.id))),a(Ut,z({as:"div"},()=>t.dataset(),n))}function $o(e){const t=vo(),n=At({id:t.generateId("indicator")},e),[o,i]=Q(n,["ref","forceMount"]),[s,l]=r(),{present:d}=Tn({show:()=>o.forceMount||t.isSelected(),element:()=>s()??null});return a(c,{get when(){return d()},get children(){return a(Ut,z({as:"div",ref(e){const t=Ue(l,o.ref);"function"==typeof t&&t(e)}},()=>t.dataset(),i))}})}function So(e){const t=Nt(),n=bo(),o=vo(),s=At({id:o.generateId("input")},e),[l,d]=Q(s,["ref","style","aria-labelledby","aria-describedby","onChange","onFocus","onBlur"]),[c,u]=r(!1);return i(x([()=>o.isSelected(),()=>o.value()],e=>{if(!e[0]&&e[1]===o.value())return;u(!0);const t=o.inputRef();t?.dispatchEvent(new Event("input",{bubbles:!0,cancelable:!0})),t?.dispatchEvent(new Event("change",{bubbles:!0,cancelable:!0}))},{defer:!0})),i(()=>m(o.registerInput(d.id))),a(Ut,z({as:"input",ref(e){const t=Ue(o.setInputRef,l.ref);"function"==typeof t&&t(e)},type:"radio",get name(){return t.name()},get value(){return o.value()},get checked(){return o.isSelected()},get required(){return t.isRequired()},get disabled(){return o.isDisabled()},get readonly(){return t.isReadOnly()},get style(){return ot({...Rt},l.style)},get"aria-labelledby"(){return[l["aria-labelledby"],o.labelId(),null!=l["aria-labelledby"]&&null!=d["aria-label"]?d.id:void 0].filter(Boolean).join(" ")||void 0},get"aria-describedby"(){return[l["aria-describedby"],o.descriptionId(),n.ariaDescribedBy()].filter(Boolean).join(" ")||void 0},onChange:e=>{if(bt(e,l.onChange),e.stopPropagation(),!c()){n.setSelectedValue(o.value());e.target.checked=o.isSelected()}u(!1)},onFocus:e=>{bt(e,l.onFocus),o.setIsFocused(!0)},onBlur:e=>{bt(e,l.onBlur),o.setIsFocused(!1)}},()=>o.dataset(),d))}function Co(e){const t=vo(),n=At({id:t.generateId("label")},e);return i(()=>m(t.registerLabel(n.id))),a(Ut,z({as:"label",get for(){return t.inputId()}},()=>t.dataset(),n))}function Eo(e){return a(_t,z({as:"span"},e))}function qo(e){let t;const n=At({id:`radiogroup-${C()}`,orientation:"vertical"},e),[o,i,l]=Q(n,["ref","value","defaultValue","onChange","orientation","aria-labelledby","aria-describedby"],Vt),[d,c]=Zt({value:()=>o.value,defaultValue:()=>o.defaultValue,onChange:e=>o.onChange?.(e)}),{formControlContext:u}=function(e){const t=At({id:`form-control-${C()}`},e),[n,o]=r(),[i,a]=r(),[l,d]=r(),[c,u]=r();return{formControlContext:{name:()=>Y(t.name)??Y(t.id),dataset:s(()=>({"data-valid":"valid"===Y(t.validationState)?"":void 0,"data-invalid":"invalid"===Y(t.validationState)?"":void 0,"data-required":Y(t.required)?"":void 0,"data-disabled":Y(t.disabled)?"":void 0,"data-readonly":Y(t.readOnly)?"":void 0})),validationState:()=>Y(t.validationState),isRequired:()=>Y(t.required),isDisabled:()=>Y(t.disabled),isReadOnly:()=>Y(t.readOnly),labelId:n,fieldId:i,descriptionId:l,errorMessageId:c,getAriaLabelledBy:(e,t,r)=>{const o=null!=r||null!=n();return[r,n(),o&&null!=t?e:void 0].filter(Boolean).join(" ")||void 0},getAriaDescribedBy:e=>[l(),c(),e].filter(Boolean).join(" ")||void 0,generateId:lt(()=>Y(t.id)),registerLabel:Bt(o),registerField:Bt(a),registerDescription:Bt(d),registerErrorMessage:Bt(u)}}}(i);Xt(()=>t,()=>c(o.defaultValue??""));const g=()=>u.getAriaDescribedBy(o["aria-describedby"]),f=e=>e===d(),p={ariaDescribedBy:g,isSelectedValue:f,setSelectedValue:e=>{if(!u.isReadOnly()&&!u.isDisabled()&&(c(e),t))for(const n of t.querySelectorAll("[type='radio']")){const e=n;e.checked=f(e.value)}}};return a(jt.Provider,{value:u,get children(){return a(yo.Provider,{value:p,get children(){return a(Ut,z({as:"div",ref(e){const n=Ue(e=>t=e,o.ref);"function"==typeof n&&n(e)},role:"radiogroup",get id(){return Y(i.id)},get"aria-invalid"(){return"invalid"===u.validationState()||void 0},get"aria-required"(){return u.isRequired()||void 0},get"aria-disabled"(){return u.isDisabled()||void 0},get"aria-readonly"(){return u.isReadOnly()||void 0},get"aria-orientation"(){return o.orientation},get"aria-labelledby"(){return u.getAriaLabelledBy(Y(i.id),l["aria-label"],o["aria-labelledby"])},get"aria-describedby"(){return g()}},()=>u.dataset(),l))}})}})}var Mo=Object.assign(qo,{Description:Qt,ErrorMessage:Wt,Item:wo,ItemControl:xo,ItemDescription:ko,ItemIndicator:$o,ItemInput:So,ItemLabel:Co,Label:Eo}),Lo=class{constructor(e,n,r){t(this,"collection"),t(this,"ref"),t(this,"collator"),this.collection=e,this.ref=n,this.collator=r}getKeyBelow(e){let t=this.collection().getKeyAfter(e);for(;null!=t;){const e=this.collection().getItem(t);if(e&&"item"===e.type&&!e.disabled)return t;t=this.collection().getKeyAfter(t)}}getKeyAbove(e){let t=this.collection().getKeyBefore(e);for(;null!=t;){const e=this.collection().getItem(t);if(e&&"item"===e.type&&!e.disabled)return t;t=this.collection().getKeyBefore(t)}}getFirstKey(){let e=this.collection().getFirstKey();for(;null!=e;){const t=this.collection().getItem(e);if(t&&"item"===t.type&&!t.disabled)return e;e=this.collection().getKeyAfter(e)}}getLastKey(){let e=this.collection().getLastKey();for(;null!=e;){const t=this.collection().getItem(e);if(t&&"item"===t.type&&!t.disabled)return e;e=this.collection().getKeyBefore(e)}}getItem(e){return this.ref?.()?.querySelector(`[data-key="${e}"]`)??null}getKeyPageAbove(e){const t=this.ref?.();let n=this.getItem(e);if(!t||!n)return;const r=Math.max(0,n.offsetTop+n.offsetHeight-t.offsetHeight);let o=e;for(;o&&n&&n.offsetTop>r;)o=this.getKeyAbove(o),n=null!=o?this.getItem(o):null;return o}getKeyPageBelow(e){const t=this.ref?.();let n=this.getItem(e);if(!t||!n)return;const r=Math.min(t.scrollHeight,n.offsetTop-n.offsetHeight+t.offsetHeight);let o=e;for(;o&&n&&n.offsetTop<r;)o=this.getKeyBelow(o),n=null!=o?this.getItem(o):null;return o}getKeyForSearch(e,t){const n=this.collator?.();if(!n)return;let r=null!=t?this.getKeyBelow(t):this.getFirstKey();for(;null!=r;){const t=this.collection().getItem(r);if(t){const o=t.textValue.slice(0,e.length);if(t.textValue&&0===n.compare(o,e))return r}r=this.getKeyBelow(r)}}};function Fo(e,t,n){const r=function(e){const{locale:t}=vn(),n=s(()=>t()+(e?Object.entries(e).sort((e,t)=>e[0]<t[0]?-1:1).join():""));return s(()=>{const r=n();let o;return wn.has(r)&&(o=wn.get(r)),o||(o=new Intl.Collator(t(),e),wn.set(r,o)),o})}({usage:"search",sensitivity:"base"});return En({selectionManager:()=>Y(e.selectionManager),keyboardDelegate:s(()=>{const n=Y(e.keyboardDelegate);return n||new Lo(e.collection,t,r)}),autoFocus:()=>Y(e.autoFocus),deferAutoFocus:()=>Y(e.deferAutoFocus),shouldFocusWrap:()=>Y(e.shouldFocusWrap),disallowEmptySelection:()=>Y(e.disallowEmptySelection),selectOnFocus:()=>Y(e.selectOnFocus),disallowTypeAhead:()=>Y(e.disallowTypeAhead),shouldUseVirtualFocus:()=>Y(e.shouldUseVirtualFocus),allowsTabNavigation:()=>Y(e.allowsTabNavigation),isVirtualized:()=>Y(e.isVirtualized),scrollToKey:t=>Y(e.scrollToKey)?.(t),orientation:()=>Y(e.orientation)},t)}var Do="focusScope.autoFocusOnMount",To="focusScope.autoFocusOnUnmount",Ao={bubbles:!1,cancelable:!0},Oo={stack:[],active(){return this.stack[0]},add(e){e!==this.active()&&this.active()?.pause(),this.stack=it(this.stack,e),this.stack.unshift(e)},remove(e){this.stack=it(this.stack,e),this.active()?.resume()}};function Io(e,t){const[n,o]=r(!1),s={pause(){o(!0)},resume(){o(!1)}};let a=null;const l=t=>e.onMountAutoFocus?.(t),d=t=>e.onUnmountAutoFocus?.(t),c=()=>ut(t()),u=()=>{const e=c().createElement("span");return e.setAttribute("data-focus-trap",""),e.tabIndex=0,Object.assign(e.style,Rt),e},g=()=>{const e=t();return e?Et(e,!0).filter(e=>!e.hasAttribute("data-focus-trap")):[]},f=()=>{const e=g();return e.length>0?e[0]:null};i(()=>{const e=t();if(!e)return;Oo.add(s);const n=ct(e);if(!dt(e,n)){const t=new CustomEvent(Do,Ao);e.addEventListener(Do,l),e.dispatchEvent(t),t.defaultPrevented||setTimeout(()=>{wt(f()),ct(e)===n&&wt(e)},0)}m(()=>{e.removeEventListener(Do,l),setTimeout(()=>{const r=new CustomEvent(To,Ao);(()=>{const e=t();if(!e)return!1;const n=ct(e);return!!n&&!dt(e,n)&&Mt(n)})()&&r.preventDefault(),e.addEventListener(To,d),e.dispatchEvent(r),r.defaultPrevented||wt(n??c().body),e.removeEventListener(To,d),Oo.remove(s)},0)})}),i(()=>{const r=t();if(!r||!Y(e.trapFocus)||n())return;const o=e=>{const t=e.target;t?.closest(`[${An}]`)||(dt(r,t)?a=t:wt(a))},i=e=>{const t=e.relatedTarget??ct(r);t?.closest(`[${An}]`)||dt(r,t)||wt(a)};c().addEventListener("focusin",o),c().addEventListener("focusout",i),m(()=>{c().removeEventListener("focusin",o),c().removeEventListener("focusout",i)})}),i(()=>{const r=t();if(!r||!Y(e.trapFocus)||n())return;const o=u();r.insertAdjacentElement("afterbegin",o);const i=u();function s(e){const t=f(),n=(()=>{const e=g();return e.length>0?e[e.length-1]:null})();e.relatedTarget===t?wt(n):wt(t)}r.insertAdjacentElement("beforeend",i),o.addEventListener("focusin",s),i.addEventListener("focusin",s);const a=new MutationObserver(e=>{for(const t of e)t.previousSibling===i&&(i.remove(),r.insertAdjacentElement("beforeend",i)),t.nextSibling===o&&(o.remove(),r.insertAdjacentElement("afterbegin",o))});a.observe(r,{childList:!0,subtree:!1}),m(()=>{o.removeEventListener("focusin",s),i.removeEventListener("focusin",s),o.remove(),i.remove(),a.disconnect()})})}var Po="data-live-announcer";function zo(e){i(()=>{Y(e.isDisabled)||m(function(e,t=document.body){const n=new Set(e),r=new Set,o=e=>{for(const r of e.querySelectorAll(`[${Po}], [${An}]`))n.add(r);const t=e=>{if(n.has(e)||e.parentElement&&r.has(e.parentElement)&&"row"!==e.parentElement.getAttribute("role"))return NodeFilter.FILTER_REJECT;for(const t of n)if(e.contains(t))return NodeFilter.FILTER_SKIP;return NodeFilter.FILTER_ACCEPT},o=document.createTreeWalker(e,NodeFilter.SHOW_ELEMENT,{acceptNode:t}),s=t(e);if(s===NodeFilter.FILTER_ACCEPT&&i(e),s!==NodeFilter.FILTER_REJECT){let e=o.nextNode();for(;null!=e;)i(e),e=o.nextNode()}},i=e=>{const t=Ko.get(e)??0;"true"===e.getAttribute("aria-hidden")&&0===t||(0===t&&e.setAttribute("aria-hidden","true"),r.add(e),Ko.set(e,t+1))};Ro.length&&Ro[Ro.length-1].disconnect();o(t);const s=new MutationObserver(e=>{for(const t of e)if("childList"===t.type&&0!==t.addedNodes.length&&![...n,...r].some(e=>e.contains(t.target))){for(const e of t.removedNodes)e instanceof Element&&(n.delete(e),r.delete(e));for(const e of t.addedNodes)!(e instanceof HTMLElement||e instanceof SVGElement)||"true"!==e.dataset.liveAnnouncer&&"true"!==e.dataset.reactAriaTopLayer?e instanceof Element&&o(e):n.add(e)}});s.observe(t,{childList:!0,subtree:!0});const a={observe(){s.observe(t,{childList:!0,subtree:!0})},disconnect(){s.disconnect()}};return Ro.push(a),()=>{s.disconnect();for(const e of r){const t=Ko.get(e);if(null==t)return;1===t?(e.removeAttribute("aria-hidden"),Ko.delete(e)):Ko.set(e,t-1)}a===Ro[Ro.length-1]?(Ro.pop(),Ro.length&&Ro[Ro.length-1].observe()):Ro.splice(Ro.indexOf(a),1)}}(Y(e.targets),Y(e.root)))})}var Ko=new WeakMap,Ro=[];var Bo=new Map,Ho=e=>{i(()=>{const t=Dn(e.style)??{},n=Dn(e.properties)??[],r={};for(const i in t)r[i]=e.element.style[i];const o=Bo.get(e.key);o?o.activeCount++:Bo.set(e.key,{activeCount:1,originalStyles:r,properties:n.map(e=>e.key)}),Object.assign(e.element.style,e.style);for(const i of n)e.element.style.setProperty(i.key,i.value);m(()=>{const t=Bo.get(e.key);if(t)if(1===t.activeCount){Bo.delete(e.key);for(const[n,r]of Object.entries(t.originalStyles))e.element.style[n]=r;for(const n of t.properties)e.element.style.removeProperty(n);0===e.element.style.length&&e.element.removeAttribute("style"),e.cleanup?.()}else t.activeCount--})})},Go=(e,t)=>{switch(t){case"x":return[e.clientWidth,e.scrollLeft,e.scrollWidth];case"y":return[e.clientHeight,e.scrollTop,e.scrollHeight]}},Uo=(e,t)=>{const n=getComputedStyle(e),r="x"===t?n.overflowX:n.overflowY;return"auto"===r||"scroll"===r||"HTML"===e.tagName&&"visible"===r},[Vo,jo]=r([]),No=e=>[e.deltaX,e.deltaY],Qo=e=>e.changedTouches[0]?[e.changedTouches[0].clientX,e.changedTouches[0].clientY]:[0,0],Wo=(e,t,n,r)=>{const o=null!==r&&_o(r,e),[i,s]=((e,t,n)=>{const r="x"===t&&"rtl"===window.getComputedStyle(e).direction?-1:1;let o=e,i=0,s=0,a=!1;do{const[e,l,d]=Go(o,t),c=d-e-r*l;0===l&&0===c||!Uo(o,t)||(i+=c,s+=l),o===(n??document.documentElement)?a=!0:o=o._$host??o.parentElement}while(o&&!a);return[i,s]})(e,t,o?r:void 0);return!(n>0&&Math.abs(i)<=1)&&!(n<0&&Math.abs(s)<1)},_o=(e,t)=>{if(e.contains(t))return!0;let n=t;for(;n;){if(n===e)return!0;n=n._$host??n.parentElement}return!1},Xo=e=>{const t=z({element:null,enabled:!0,hideScrollbar:!0,preventScrollbarShift:!0,preventScrollbarShiftMode:"padding",restoreScrollPosition:!0,allowPinchZoom:!1},e),n=C();let r=[0,0],o=null,s=null;i(()=>{Dn(t.enabled)&&(jo(e=>[...e,n]),m(()=>{jo(e=>e.filter(e=>e!==n))}))}),i(()=>{if(!Dn(t.enabled)||!Dn(t.hideScrollbar))return;const{body:e}=document,n=window.innerWidth-e.offsetWidth;if(Dn(t.preventScrollbarShift)){const r={overflow:"hidden"},o=[];n>0&&("padding"===Dn(t.preventScrollbarShiftMode)?r.paddingRight=`calc(${window.getComputedStyle(e).paddingRight} + ${n}px)`:r.marginRight=`calc(${window.getComputedStyle(e).marginRight} + ${n}px)`,o.push({key:"--scrollbar-width",value:`${n}px`}));const i=window.scrollY,s=window.scrollX;Ho({key:"prevent-scroll",element:e,style:r,properties:o,cleanup:()=>{Dn(t.restoreScrollPosition)&&n>0&&window.scrollTo(s,i)}})}else Ho({key:"prevent-scroll",element:e,style:{overflow:"hidden"}})}),i(()=>{var e;(e=n,Vo().indexOf(e)===Vo().length-1&&Dn(t.enabled))&&(document.addEventListener("wheel",l,{passive:!1}),document.addEventListener("touchstart",a,{passive:!1}),document.addEventListener("touchmove",d,{passive:!1}),m(()=>{document.removeEventListener("wheel",l),document.removeEventListener("touchstart",a),document.removeEventListener("touchmove",d)}))});const a=e=>{r=Qo(e),o=null,s=null},l=e=>{const n=e.target,r=Dn(t.element),o=No(e),i=Math.abs(o[0])>Math.abs(o[1])?"x":"y",s="x"===i?o[0]:o[1],a=Wo(n,i,s,r);let l;l=!r||!_o(r,n)||!a,l&&e.cancelable&&e.preventDefault()},d=e=>{const n=Dn(t.element),i=e.target;let a;if(2===e.touches.length)a=!Dn(t.allowPinchZoom);else{if(null==o||null===s){const t=Qo(e).map((e,t)=>r[t]-e),n=Math.abs(t[0])>Math.abs(t[1])?"x":"y";o=n,s="x"===n?t[0]:t[1]}if("range"===i.type)a=!1;else{const e=Wo(i,o,s,n);a=!n||!_o(n,i)||!e}}a&&e.cancelable&&e.preventDefault()}},Zo=n();function Yo(){return b(Zo)}function Jo(){const e=Yo();if(void 0===e)throw new Error("[kobalte]: `useMenuContext` must be used within a `Menu` component");return e}var ei=n();function ti(){const e=b(ei);if(void 0===e)throw new Error("[kobalte]: `useMenuItemContext` must be used within a `Menu.Item` component");return e}var ni=n();function ri(){const e=b(ni);if(void 0===e)throw new Error("[kobalte]: `useMenuRootContext` must be used within a `MenuRoot` component");return e}function oi(e){let t;const n=ri(),o=Jo(),i=At({id:n.generateId(`item-${C()}`)},e),[l,d]=Q(i,["ref","textValue","disabled","closeOnSelect","checked","indeterminate","onSelect","onPointerMove","onPointerLeave","onPointerDown","onPointerUp","onClick","onKeyDown","onMouseDown","onFocus"]),[c,u]=r(),[g,f]=r(),[p,h]=r(),y=()=>o.listState().selectionManager(),b=()=>d.id,m=()=>{l.onSelect?.(),l.closeOnSelect&&setTimeout(()=>{o.close(!0)})};ln({getItem:()=>({ref:()=>t,type:"item",key:b(),textValue:l.textValue??p()?.textContent??t?.textContent??"",disabled:l.disabled??!1})});const v=qn({key:b,selectionManager:y,shouldSelectOnPressUp:!0,allowsDifferentPressOrigin:!0,disabled:()=>l.disabled},()=>t),w=e=>{bt(e,l.onPointerMove),"mouse"===e.pointerType&&(l.disabled?o.onItemLeave(e):(o.onItemEnter(e),e.defaultPrevented||(wt(e.currentTarget),o.listState().selectionManager().setFocused(!0),o.listState().selectionManager().setFocusedKey(b()))))},x=e=>{bt(e,l.onPointerLeave),"mouse"===e.pointerType&&o.onItemLeave(e)},k=e=>{bt(e,l.onPointerUp),l.disabled||0!==e.button||m()},$=e=>{if(bt(e,l.onKeyDown),!e.repeat&&!l.disabled)switch(e.key){case"Enter":case" ":m()}},S=s(()=>l.indeterminate?"mixed":null!=l.checked?l.checked:void 0),E=s(()=>({"data-indeterminate":l.indeterminate?"":void 0,"data-checked":l.checked&&!l.indeterminate?"":void 0,"data-disabled":l.disabled?"":void 0,"data-highlighted":y().focusedKey()===b()?"":void 0})),q={isChecked:()=>l.checked,dataset:E,setLabelRef:h,generateId:lt(()=>d.id),registerLabel:Bt(u),registerDescription:Bt(f)};return a(ei.Provider,{value:q,get children(){return a(Ut,z({as:"div",ref(e){const n=Ue(e=>t=e,l.ref);"function"==typeof n&&n(e)},get tabIndex(){return v.tabIndex()},get"aria-checked"(){return S()},get"aria-disabled"(){return l.disabled},get"aria-labelledby"(){return c()},get"aria-describedby"(){return g()},get"data-key"(){return v.dataKey()},get onPointerDown(){return mt([l.onPointerDown,v.onPointerDown])},get onPointerUp(){return mt([k,v.onPointerUp])},get onClick(){return mt([l.onClick,v.onClick])},get onKeyDown(){return mt([$,v.onKeyDown])},get onMouseDown(){return mt([l.onMouseDown,v.onMouseDown])},get onFocus(){return mt([l.onFocus,v.onFocus])},onPointerMove:w,onPointerLeave:x},E,d))}})}function ii(e){const t=At({closeOnSelect:!1},e),[n,r]=Q(t,["checked","defaultChecked","onChange","onSelect"]),o=function(e={}){const[t,n]=Yt({value:()=>Y(e.isSelected),defaultValue:()=>!!Y(e.defaultIsSelected),onChange:t=>e.onSelectedChange?.(t)});return{isSelected:t,setIsSelected:t=>{Y(e.isReadOnly)||Y(e.isDisabled)||n(t)},toggle:()=>{Y(e.isReadOnly)||Y(e.isDisabled)||n(!t())}}}({isSelected:()=>n.checked,defaultIsSelected:()=>n.defaultChecked,onSelectedChange:e=>n.onChange?.(e),isDisabled:()=>r.disabled});return a(oi,z({role:"menuitemcheckbox",get checked(){return o.isSelected()},onSelect:()=>{n.onSelect?.(),o.toggle()}},r))}var si=n();function ai(){return b(si)}var li={next:(e,t)=>"ltr"===e?"horizontal"===t?"ArrowRight":"ArrowDown":"horizontal"===t?"ArrowLeft":"ArrowUp",previous:(e,t)=>li.next("ltr"===e?"rtl":"ltr",t)},di=e=>"horizontal"===e?"ArrowDown":"ArrowRight",ci=e=>"horizontal"===e?"ArrowUp":"ArrowLeft";function ui(e){const t=ri(),n=Jo(),r=ai(),{direction:o}=vn(),l=At({id:t.generateId("trigger")},e),[c,u]=Q(l,["ref","id","disabled","onPointerDown","onClick","onKeyDown","onMouseOver","onFocus"]);let g=()=>t.value();void 0!==r&&(g=()=>t.value()??c.id,void 0===r.lastValue()&&r.setLastValue(g));const f=Ht(()=>n.triggerRef(),()=>"button"),p=s(()=>"a"===f()&&null!=n.triggerRef()?.getAttribute("href"));i(x(()=>r?.value(),e=>{p()&&e===g()&&n.triggerRef()?.focus()}));const h=()=>{void 0!==r?n.isOpen()?r.value()===g()&&r.closeMenu():(r.autoFocusMenu()||r.setAutoFocusMenu(!0),n.open(!1)):n.toggle(!0)};return i(()=>m(n.registerTriggerId(c.id))),a(Gn,z({ref(e){const t=Ue(n.setTriggerRef,c.ref);"function"==typeof t&&t(e)},get"data-kb-menu-value-trigger"(){return t.value()},get id(){return c.id},get disabled(){return c.disabled},"aria-haspopup":"true",get"aria-expanded"(){return n.isOpen()},get"aria-controls"(){return d(()=>!!n.isOpen())()?n.contentId():void 0},get"data-highlighted"(){return void 0!==g()&&r?.value()===g()||void 0},get tabIndex(){return void 0!==r?r.value()===g()||r.lastValue()===g()?0:-1:void 0},onPointerDown:e=>{bt(e,c.onPointerDown),e.currentTarget.dataset.pointerType=e.pointerType,c.disabled||"touch"===e.pointerType||0!==e.button||h()},onMouseOver:e=>{bt(e,c.onMouseOver),"touch"!==n.triggerRef()?.dataset.pointerType&&(c.disabled||void 0===r||void 0===r.value()||r.setValue(g))},onClick:e=>{bt(e,c.onClick),c.disabled||"touch"===e.currentTarget.dataset.pointerType&&h()},onKeyDown:e=>{if(bt(e,c.onKeyDown),!c.disabled){if(p())switch(e.key){case"Enter":case" ":return}switch(e.key){case"Enter":case" ":case di(t.orientation()):e.stopPropagation(),e.preventDefault(),function(e){if(document.contains(e)){const t=document.scrollingElement||document.documentElement;if("hidden"===window.getComputedStyle(t).overflow){let n=Ft(e);for(;e&&n&&e!==t&&n!==t;)zt(n,e),n=Ft(e=n)}else{const{left:t,top:n}=e.getBoundingClientRect();e?.scrollIntoView?.({block:"nearest"});const{left:r,top:o}=e.getBoundingClientRect();(Math.abs(t-r)>1||Math.abs(n-o)>1)&&e.scrollIntoView?.({block:"nearest"})}}}(e.currentTarget),n.open("first"),r?.setAutoFocusMenu(!0),r?.setValue(g);break;case ci(t.orientation()):e.stopPropagation(),e.preventDefault(),n.open("last");break;case li.next(o(),t.orientation()):if(void 0===r)break;e.stopPropagation(),e.preventDefault(),r.nextMenu();break;case li.previous(o(),t.orientation()):if(void 0===r)break;e.stopPropagation(),e.preventDefault(),r.previousMenu()}}},onFocus:e=>{bt(e,c.onFocus),void 0!==r&&"touch"!==e.currentTarget.dataset.pointerType&&r.setValue(g)},role:void 0!==r?"menuitem":void 0},()=>n.dataset(),u))}var gi=n();function fi(){return b(gi)}function pi(e){let t;const n=ri(),r=Jo(),o=ai(),s=fi(),{direction:l}=vn(),u=At({id:n.generateId(`content-${C()}`)},e),[g,f]=Q(u,["ref","id","style","onOpenAutoFocus","onCloseAutoFocus","onEscapeKeyDown","onFocusOutside","onPointerEnter","onPointerMove","onKeyDown","onMouseDown","onFocusIn","onFocusOut"]);let p=0;const h=()=>null==r.parentMenuContext()&&void 0===o&&n.isModal(),y=Fo({selectionManager:r.listState().selectionManager,collection:r.listState().collection,autoFocus:r.autoFocus,deferAutoFocus:!0,shouldFocusWrap:!0,disallowTypeAhead:()=>!r.listState().selectionManager().isFocused(),orientation:()=>"horizontal"===n.orientation()?"vertical":"horizontal"},()=>t);Io({trapFocus:()=>h()&&r.isOpen(),onMountAutoFocus:e=>{void 0===o&&g.onOpenAutoFocus?.(e)},onUnmountAutoFocus:g.onCloseAutoFocus},()=>t);const b=e=>{g.onEscapeKeyDown?.(e),o?.setAutoFocusMenu(!1),r.close(!0)},v=e=>{g.onFocusOutside?.(e),n.isModal()&&e.preventDefault()};i(()=>m(r.registerContentId(g.id)));const w={ref:Ue(e=>{r.setContentRef(e),t=e},g.ref),role:"menu",get id(){return g.id},get tabIndex(){return y.tabIndex()},get"aria-labelledby"(){return r.triggerId()},onKeyDown:mt([g.onKeyDown,y.onKeyDown,e=>{if(dt(e.currentTarget,e.target)&&("Tab"===e.key&&r.isOpen()&&e.preventDefault(),void 0!==o&&"true"!==e.currentTarget.getAttribute("aria-haspopup")))switch(e.key){case li.next(l(),n.orientation()):e.stopPropagation(),e.preventDefault(),r.close(!0),o.setAutoFocusMenu(!0),o.nextMenu();break;case li.previous(l(),n.orientation()):if(e.currentTarget.hasAttribute("data-closed"))break;e.stopPropagation(),e.preventDefault(),r.close(!0),o.setAutoFocusMenu(!0),o.previousMenu()}}]),onMouseDown:mt([g.onMouseDown,y.onMouseDown]),onFocusIn:mt([g.onFocusIn,y.onFocusIn]),onFocusOut:mt([g.onFocusOut,y.onFocusOut]),onPointerEnter:e=>{bt(e,g.onPointerEnter),r.isOpen()&&(r.parentMenuContext()?.listState().selectionManager().setFocused(!1),r.parentMenuContext()?.listState().selectionManager().setFocusedKey(void 0))},onPointerMove:e=>{if(bt(e,g.onPointerMove),"mouse"!==e.pointerType)return;const t=e.target,n=p!==e.clientX;dt(e.currentTarget,t)&&n&&(r.setPointerDir(e.clientX>p?"right":"left"),p=e.clientX)},get"data-orientation"(){return n.orientation()}};return a(c,{get when(){return r.contentPresent()},get children(){return a(c,{get when(){return void 0===s||null!=r.parentMenuContext()},get fallback(){return a(Ut,z({as:"div"},()=>r.dataset(),w,f))},get children(){return a(lo.Positioner,{get children(){return a(fo,z({get disableOutsidePointerEvents(){return d(()=>!!h())()&&r.isOpen()},get excludedElements(){return[r.triggerRef]},bypassTopMostLayerCheck:!0,get style(){return ot({"--kb-menu-content-transform-origin":"var(--kb-popper-content-transform-origin)",position:"relative"},g.style)},onEscapeKeyDown:b,onFocusOutside:v,get onDismiss(){return r.close}},()=>r.dataset(),w,f))}})}})}})}function hi(e){let t;const n=ri(),r=Jo(),[o,i]=Q(e,["ref"]);return Xo({element:()=>t??null,enabled:()=>r.contentPresent()&&n.preventScroll()}),a(pi,z({ref(e){const n=Ue(e=>{t=e},o.ref);"function"==typeof n&&n(e)}},i))}var yi=n();function bi(e){const t=At({id:ri().generateId(`group-${C()}`)},e),[n,o]=r(),i={generateId:lt(()=>t.id),registerLabelId:Bt(o)};return a(yi.Provider,{value:i,get children(){return a(Ut,z({as:"div",role:"group",get"aria-labelledby"(){return n()}},t))}})}function mi(e){const t=function(){const e=b(yi);if(void 0===e)throw new Error("[kobalte]: `useMenuGroupContext` must be used within a `Menu.Group` component");return e}(),n=At({id:t.generateId("label")},e),[r,o]=Q(n,["id"]);return i(()=>m(t.registerLabelId(r.id))),a(Ut,z({as:"span",get id(){return r.id},"aria-hidden":"true"},o))}function vi(e){const t=Jo(),n=At({children:"▼"},e);return a(Ut,z({as:"span","aria-hidden":"true"},()=>t.dataset(),n))}function wi(e){return a(oi,z({role:"menuitem",closeOnSelect:!0},e))}function xi(e){const t=ti(),n=At({id:t.generateId("description")},e),[r,o]=Q(n,["id"]);return i(()=>m(t.registerDescription(r.id))),a(Ut,z({as:"div",get id(){return r.id}},()=>t.dataset(),o))}function ki(e){const t=ti(),n=At({id:t.generateId("indicator")},e),[r,o]=Q(n,["forceMount"]);return a(c,{get when(){return r.forceMount||t.isChecked()},get children(){return a(Ut,z({as:"div"},()=>t.dataset(),o))}})}function $i(e){const t=ti(),n=At({id:t.generateId("label")},e),[r,o]=Q(n,["ref","id"]);return i(()=>m(t.registerLabel(r.id))),a(Ut,z({as:"div",ref(e){const n=Ue(t.setLabelRef,r.ref);"function"==typeof n&&n(e)},get id(){return r.id}},()=>t.dataset(),o))}function Si(e){const t=Jo();return a(c,{get when(){return t.contentPresent()},get children(){return a(l,e)}})}var Ci=n();function Ei(e){const t=At({id:ri().generateId(`radiogroup-${C()}`)},e),[n,r]=Q(t,["value","defaultValue","onChange","disabled"]),[o,i]=Zt({value:()=>n.value,defaultValue:()=>n.defaultValue,onChange:e=>n.onChange?.(e)}),s={isDisabled:()=>n.disabled,isSelectedValue:e=>e===o(),setSelectedValue:i};return a(Ci.Provider,{value:s,get children(){return a(bi,r)}})}function qi(e){const t=function(){const e=b(Ci);if(void 0===e)throw new Error("[kobalte]: `useMenuRadioGroupContext` must be used within a `Menu.RadioGroup` component");return e}(),n=At({closeOnSelect:!1},e),[r,o]=Q(n,["value","onSelect"]);return a(oi,z({role:"menuitemradio",get checked(){return t.isSelectedValue(r.value)},onSelect:()=>{r.onSelect?.(),t.setSelectedValue(r.value)}},o))}function Mi(e,t,n){const r=e.split("-")[0],o=n.getBoundingClientRect(),i=[],s=t.clientX,a=t.clientY;switch(r){case"top":i.push([s,a+5]),i.push([o.left,o.bottom]),i.push([o.left,o.top]),i.push([o.right,o.top]),i.push([o.right,o.bottom]);break;case"right":i.push([s-5,a]),i.push([o.left,o.top]),i.push([o.right,o.top]),i.push([o.right,o.bottom]),i.push([o.left,o.bottom]);break;case"bottom":i.push([s,a-5]),i.push([o.right,o.top]),i.push([o.right,o.bottom]),i.push([o.left,o.bottom]),i.push([o.left,o.top]);break;case"left":i.push([s+5,a]),i.push([o.right,o.bottom]),i.push([o.left,o.bottom]),i.push([o.left,o.top]),i.push([o.right,o.top])}return i}function Li(e){const t=ri(),n=nn(),o=Yo(),l=ai(),d=fi(),u=At({placement:"horizontal"===t.orientation()?"bottom-start":"right-start"},e),[g,f]=Q(u,["open","defaultOpen","onOpenChange"]);let p=0,h=null,y="right";const[b,v]=r(),[w,x]=r(),[k,$]=r(),[S,C]=r(),[E,q]=r(!0),[M,L]=r(f.placement),[F,D]=r([]),[T,A]=r([]),{DomCollectionProvider:O}=an({items:T,onItemsChange:A}),I=po({open:()=>g.open,defaultOpen:()=>g.defaultOpen,onOpenChange:e=>g.onOpenChange?.(e)}),{present:P}=Tn({show:()=>t.forceMount()||I.isOpen(),element:()=>S()??null}),K=function(e){const t=Cn(e),n=cn({dataSource:()=>Y(e.dataSource),getKey:()=>Y(e.getKey),getTextValue:()=>Y(e.getTextValue),getDisabled:()=>Y(e.getDisabled),getSectionChildren:()=>Y(e.getSectionChildren),factory:t=>e.filter?new Ln(e.filter(t)):new Ln(t)},[()=>e.filter]),r=new Mn(n,t);return _(()=>{const e=t.focusedKey();null==e||n().getItem(e)||t.setFocusedKey(void 0)}),{collection:n,selectionManager:()=>r}}({selectionMode:"none",dataSource:T}),R=e=>{q(e),I.open()},B=(e=!1)=>{I.close(),e&&o&&o.close(!0)},H=()=>{const e=S();e&&(wt(e),K.selectionManager().setFocused(!0),K.selectionManager().setFocusedKey(void 0))},G=()=>{null!=d?setTimeout(()=>H()):H()},U=e=>{return y===h?.side&&(t=e,n=h?.area,!!n&&function(e,t){const[n,r]=e;let o=!1;for(let i=t.length,s=0,a=i-1;s<i;a=s++){const[e,l]=t[s],[d,c]=t[a],[,u]=t[0===a?i-1:a-1]||[0,0],g=(l-c)*(n-e)-(e-d)*(r-l);if(c<l){if(r>=c&&r<l){if(0===g)return!0;g>0&&(r===c?r>u&&(o=!o):o=!o)}}else if(l<c){if(r>l&&r<=c){if(0===g)return!0;g<0&&(r===c?r<u&&(o=!o):o=!o)}}else if(r==l&&(n>=d&&n<=e||n>=e&&n<=d))return!0}return o}([t.clientX,t.clientY],n));var t,n};zo({isDisabled:()=>!(null==o&&I.isOpen()&&t.isModal()),targets:()=>[S(),...F()].filter(Boolean)}),i(()=>{const e=S();if(!e||!o)return;const t=o.registerNestedMenu(e);m(()=>{t()})}),i(()=>{void 0===o&&l?.registerMenu(t.value(),[S(),...F()])}),i(()=>{void 0===o&&void 0!==l&&(l.value()===t.value()?(k()?.focus(),l.autoFocusMenu()&&R(!0)):B())}),i(()=>{void 0===o&&void 0!==l&&I.isOpen()&&l.setValue(t.value())}),m(()=>{void 0===o&&l?.unregisterMenu(t.value())});const V={dataset:s(()=>({"data-expanded":I.isOpen()?"":void 0,"data-closed":I.isOpen()?void 0:""})),isOpen:I.isOpen,contentPresent:P,nestedMenus:F,currentPlacement:M,pointerGraceTimeoutId:()=>p,autoFocus:E,listState:()=>K,parentMenuContext:()=>o,triggerRef:k,contentRef:S,triggerId:b,contentId:w,setTriggerRef:$,setContentRef:C,open:R,close:B,toggle:e=>{q(e),I.toggle()},focusContent:G,onItemEnter:e=>{U(e)&&e.preventDefault()},onItemLeave:e=>{U(e)||G()},onTriggerLeave:e=>{U(e)&&e.preventDefault()},setPointerDir:e=>y=e,setPointerGraceTimeoutId:e=>p=e,setPointerGraceIntent:e=>h=e,registerNestedMenu:e=>{D(t=>[...t,e]);const t=o?.registerNestedMenu(e);return()=>{D(t=>it(t,e)),t?.()}},registerItemToParentDomCollection:n?.registerItem,registerTriggerId:Bt(v),registerContentId:Bt(x)};return a(O,{get children(){return a(Zo.Provider,{value:V,get children(){return a(c,{when:void 0===d,get fallback(){return f.children},get children(){return a(lo,z({anchorRef:k,contentRef:S,onCurrentPlacementChange:L},f))}})}})}})}function Fi(e){const{direction:t}=vn();return a(Li,z({get placement(){return"rtl"===t()?"left-start":"right-start"},flip:!0},e))}var Di=(e,t)=>"ltr"===e?["horizontal"===t?"ArrowLeft":"ArrowUp"]:["horizontal"===t?"ArrowRight":"ArrowDown"];function Ti(e){const t=Jo(),n=ri(),[r,o]=Q(e,["onFocusOutside","onKeyDown"]),{direction:i}=vn();return a(pi,z({onOpenAutoFocus:e=>{e.preventDefault()},onCloseAutoFocus:e=>{e.preventDefault()},onFocusOutside:e=>{r.onFocusOutside?.(e);const n=e.target;dt(t.triggerRef(),n)||t.close()},onKeyDown:e=>{bt(e,r.onKeyDown);const o=dt(e.currentTarget,e.target),s=Di(i(),n.orientation()).includes(e.key),a=null!=t.parentMenuContext();o&&s&&a&&(t.close(),wt(t.triggerRef()))}},o))}var Ai=["Enter"," "],Oi=(e,t)=>"ltr"===e?[...Ai,"horizontal"===t?"ArrowRight":"ArrowDown"]:[...Ai,"horizontal"===t?"ArrowLeft":"ArrowUp"];function Ii(e){let t;const n=ri(),r=Jo(),o=At({id:n.generateId(`sub-trigger-${C()}`)},e),[s,l]=Q(o,["ref","id","textValue","disabled","onPointerMove","onPointerLeave","onPointerDown","onPointerUp","onClick","onKeyDown","onMouseDown","onFocus"]);let c=null;const u=()=>{c&&window.clearTimeout(c),c=null},{direction:g}=vn(),f=()=>s.id,p=()=>{const e=r.parentMenuContext();if(null==e)throw new Error("[kobalte]: `Menu.SubTrigger` must be used within a `Menu.Sub` component");return e.listState().selectionManager()},h=qn({key:f,selectionManager:p,shouldSelectOnPressUp:!0,allowsDifferentPressOrigin:!0,disabled:()=>s.disabled},()=>t),y=e=>{bt(e,s.onClick),r.isOpen()||s.disabled||r.open(!0)},b=e=>{bt(e,s.onKeyDown),e.repeat||s.disabled||Oi(g(),n.orientation()).includes(e.key)&&(e.stopPropagation(),e.preventDefault(),p().setFocused(!1),p().setFocusedKey(void 0),r.isOpen()||r.open("first"),r.focusContent(),r.listState().selectionManager().setFocused(!0),r.listState().selectionManager().setFocusedKey(r.listState().collection().getFirstKey()))};return i(()=>{if(null==r.registerItemToParentDomCollection)throw new Error("[kobalte]: `Menu.SubTrigger` must be used within a `Menu.Sub` component");const e=r.registerItemToParentDomCollection({ref:()=>t,type:"item",key:f(),textValue:s.textValue??t?.textContent??"",disabled:s.disabled??!1});m(e)}),i(x(()=>r.parentMenuContext()?.pointerGraceTimeoutId(),e=>{m(()=>{window.clearTimeout(e),r.parentMenuContext()?.setPointerGraceIntent(null)})})),i(()=>m(r.registerTriggerId(s.id))),m(()=>{u()}),a(Ut,z({as:"div",ref(e){const n=Ue(e=>{r.setTriggerRef(e),t=e},s.ref);"function"==typeof n&&n(e)},get id(){return s.id},role:"menuitem",get tabIndex(){return h.tabIndex()},"aria-haspopup":"true",get"aria-expanded"(){return r.isOpen()},get"aria-controls"(){return d(()=>!!r.isOpen())()?r.contentId():void 0},get"aria-disabled"(){return s.disabled},get"data-key"(){return h.dataKey()},get"data-highlighted"(){return p().focusedKey()===f()?"":void 0},get"data-disabled"(){return s.disabled?"":void 0},get onPointerDown(){return mt([s.onPointerDown,h.onPointerDown])},get onPointerUp(){return mt([s.onPointerUp,h.onPointerUp])},get onClick(){return mt([y,h.onClick])},get onKeyDown(){return mt([b,h.onKeyDown])},get onMouseDown(){return mt([s.onMouseDown,h.onMouseDown])},get onFocus(){return mt([s.onFocus,h.onFocus])},onPointerMove:e=>{if(bt(e,s.onPointerMove),"mouse"!==e.pointerType)return;const t=r.parentMenuContext();t?.onItemEnter(e),e.defaultPrevented||(s.disabled?t?.onItemLeave(e):(r.isOpen()||c||(r.parentMenuContext()?.setPointerGraceIntent(null),c=window.setTimeout(()=>{r.open(!1),u()},100)),t?.onItemEnter(e),e.defaultPrevented||(r.listState().selectionManager().isFocused()&&(r.listState().selectionManager().setFocused(!1),r.listState().selectionManager().setFocusedKey(void 0)),wt(e.currentTarget),t?.listState().selectionManager().setFocused(!0),t?.listState().selectionManager().setFocusedKey(f()))))},onPointerLeave:e=>{if(bt(e,s.onPointerLeave),"mouse"!==e.pointerType)return;u();const t=r.parentMenuContext(),n=r.contentRef();if(n){t?.setPointerGraceIntent({area:Mi(r.currentPlacement(),e,n),side:r.currentPlacement().split("-")[0]}),window.clearTimeout(t?.pointerGraceTimeoutId());const o=window.setTimeout(()=>{t?.setPointerGraceIntent(null)},300);t?.setPointerGraceTimeoutId(o)}else{if(t?.onTriggerLeave(e),e.defaultPrevented)return;t?.setPointerGraceIntent(null)}t?.onItemLeave(e)}},()=>r.dataset(),l))}function Pi(e){const t=ai(),n=At({id:`menu-${C()}`,modal:!0},e),[r,o]=Q(n,["id","modal","preventScroll","forceMount","open","defaultOpen","onOpenChange","value","orientation"]),i=po({open:()=>r.open,defaultOpen:()=>r.defaultOpen,onOpenChange:e=>r.onOpenChange?.(e)}),s={isModal:()=>r.modal??!0,preventScroll:()=>r.preventScroll??s.isModal(),forceMount:()=>r.forceMount??!1,generateId:lt(()=>r.id),value:()=>r.value,orientation:()=>r.orientation??t?.orientation()??"horizontal"};return a(ni.Provider,{value:s,get children(){return a(Li,z({get open(){return i.isOpen()},get onOpenChange(){return i.setIsOpen}},o))}})}function zi(e){let t;const n=At({orientation:"horizontal"},e),[r,o]=Q(n,["ref","orientation"]),i=Ht(()=>t,()=>"hr");return a(Ut,z({as:"hr",ref(e){const n=Ue(e=>t=e,r.ref);"function"==typeof n&&n(e)},get role(){return"hr"!==i()?"separator":void 0},get"aria-orientation"(){return"vertical"===r.orientation?"vertical":void 0},get"data-orientation"(){return r.orientation}},o))}en({},{Root:()=>zi,Separator:()=>Ki});var Ki=zi,Ri={};function Bi(e){const t=ri(),n=Jo(),[r,o]=Q(e,["onCloseAutoFocus","onInteractOutside"]);let i=!1;return a(hi,z({onCloseAutoFocus:e=>{r.onCloseAutoFocus?.(e),i||wt(n.triggerRef()),i=!1,e.preventDefault()},onInteractOutside:e=>{r.onInteractOutside?.(e),t.isModal()&&!e.detail.isContextMenu||(i=!0)}},o))}function Hi(e){const t=At({id:`dropdownmenu-${C()}`},e);return a(Pi,t)}en(Ri,{Arrow:()=>oo,CheckboxItem:()=>ii,Content:()=>Bi,DropdownMenu:()=>Gi,Group:()=>bi,GroupLabel:()=>mi,Icon:()=>vi,Item:()=>wi,ItemDescription:()=>xi,ItemIndicator:()=>ki,ItemLabel:()=>$i,Portal:()=>Si,RadioGroup:()=>Ei,RadioItem:()=>qi,Root:()=>Hi,Separator:()=>zi,Sub:()=>Fi,SubContent:()=>Ti,SubTrigger:()=>Ii,Trigger:()=>ui});var Gi=Object.assign(Hi,{Arrow:oo,CheckboxItem:ii,Content:Bi,Group:bi,GroupLabel:mi,Icon:vi,Item:wi,ItemDescription:xi,ItemIndicator:ki,ItemLabel:$i,Portal:Si,RadioGroup:Ei,RadioItem:qi,Separator:zi,Sub:Fi,SubContent:Ti,SubTrigger:Ii,Trigger:ui}),Ui={colors:{inherit:"inherit",current:"currentColor",transparent:"transparent",black:"#000000",white:"#ffffff",neutral:{50:"#f9fafb",100:"#f2f4f7",200:"#eaecf0",300:"#d0d5dd",400:"#98a2b3",500:"#667085",600:"#475467",700:"#344054",800:"#1d2939",900:"#101828"},darkGray:{50:"#525c7a",100:"#49536e",200:"#414962",300:"#394056",400:"#313749",500:"#292e3d",600:"#212530",700:"#191c24",800:"#111318",900:"#0b0d10"},gray:{50:"#f9fafb",100:"#f2f4f7",200:"#eaecf0",300:"#d0d5dd",400:"#98a2b3",500:"#667085",600:"#475467",700:"#344054",800:"#1d2939",900:"#101828"},blue:{25:"#F5FAFF",50:"#EFF8FF",100:"#D1E9FF",200:"#B2DDFF",300:"#84CAFF",400:"#53B1FD",500:"#2E90FA",600:"#1570EF",700:"#175CD3",800:"#1849A9",900:"#194185"},green:{25:"#F6FEF9",50:"#ECFDF3",100:"#D1FADF",200:"#A6F4C5",300:"#6CE9A6",400:"#32D583",500:"#12B76A",600:"#039855",700:"#027A48",800:"#05603A",900:"#054F31"},red:{50:"#fef2f2",100:"#fee2e2",200:"#fecaca",300:"#fca5a5",400:"#f87171",500:"#ef4444",600:"#dc2626",700:"#b91c1c",800:"#991b1b",900:"#7f1d1d",950:"#450a0a"},yellow:{25:"#FFFCF5",50:"#FFFAEB",100:"#FEF0C7",200:"#FEDF89",300:"#FEC84B",400:"#FDB022",500:"#F79009",600:"#DC6803",700:"#B54708",800:"#93370D",900:"#7A2E0E"},purple:{25:"#FAFAFF",50:"#F4F3FF",100:"#EBE9FE",200:"#D9D6FE",300:"#BDB4FE",400:"#9B8AFB",500:"#7A5AF8",600:"#6938EF",700:"#5925DC",800:"#4A1FB8",900:"#3E1C96"},teal:{25:"#F6FEFC",50:"#F0FDF9",100:"#CCFBEF",200:"#99F6E0",300:"#5FE9D0",400:"#2ED3B7",500:"#15B79E",600:"#0E9384",700:"#107569",800:"#125D56",900:"#134E48"},pink:{25:"#fdf2f8",50:"#fce7f3",100:"#fbcfe8",200:"#f9a8d4",300:"#f472b6",400:"#ec4899",500:"#db2777",600:"#be185d",700:"#9d174d",800:"#831843",900:"#500724"},cyan:{25:"#ecfeff",50:"#cffafe",100:"#a5f3fc",200:"#67e8f9",300:"#22d3ee",400:"#06b6d4",500:"#0891b2",600:"#0e7490",700:"#155e75",800:"#164e63",900:"#083344"}},alpha:{90:"e5",80:"cc"},font:{size:{xs:"calc(var(--tsqd-font-size) * 0.75)",sm:"calc(var(--tsqd-font-size) * 0.875)",md:"var(--tsqd-font-size)"},lineHeight:{xs:"calc(var(--tsqd-font-size) * 1)",sm:"calc(var(--tsqd-font-size) * 1.25)",md:"calc(var(--tsqd-font-size) * 1.5)"},weight:{medium:"500",semibold:"600",bold:"700"}},border:{radius:{xs:"calc(var(--tsqd-font-size) * 0.125)",sm:"calc(var(--tsqd-font-size) * 0.25)",full:"9999px"}},size:{.25:"calc(var(--tsqd-font-size) * 0.0625)",.5:"calc(var(--tsqd-font-size) * 0.125)",1:"calc(var(--tsqd-font-size) * 0.25)",1.5:"calc(var(--tsqd-font-size) * 0.375)",2:"calc(var(--tsqd-font-size) * 0.5)",2.5:"calc(var(--tsqd-font-size) * 0.625)",3:"calc(var(--tsqd-font-size) * 0.75)",3.5:"calc(var(--tsqd-font-size) * 0.875)",4:"calc(var(--tsqd-font-size) * 1)",4.5:"calc(var(--tsqd-font-size) * 1.125)",5:"calc(var(--tsqd-font-size) * 1.25)",6:"calc(var(--tsqd-font-size) * 1.5)",6.5:"calc(var(--tsqd-font-size) * 1.625)",14:"calc(var(--tsqd-font-size) * 3.5)"},shadow:{xs:(e="rgb(0 0 0 / 0.1)")=>"0 1px 2px 0 rgb(0 0 0 / 0.05)",sm:(e="rgb(0 0 0 / 0.1)")=>`0 1px 3px 0 ${e}, 0 1px 2px -1px ${e}`,md:(e="rgb(0 0 0 / 0.1)")=>`0 4px 6px -1px ${e}, 0 2px 4px -2px ${e}`,lg:(e="rgb(0 0 0 / 0.1)")=>`0 10px 15px -3px ${e}, 0 4px 6px -4px ${e}`,xl:(e="rgb(0 0 0 / 0.1)")=>`0 20px 25px -5px ${e}, 0 8px 10px -6px ${e}`,"2xl":(e="rgb(0 0 0 / 0.25)")=>`0 25px 50px -12px ${e}`,inner:(e="rgb(0 0 0 / 0.05)")=>`inset 0 2px 4px 0 ${e}`,none:()=>"none"}},Vi=u('<svg width=14 height=14 viewBox="0 0 14 14"fill=none xmlns=http://www.w3.org/2000/svg><path d="M13 13L9.00007 9M10.3333 5.66667C10.3333 8.244 8.244 10.3333 5.66667 10.3333C3.08934 10.3333 1 8.244 1 5.66667C1 3.08934 3.08934 1 5.66667 1C8.244 1 10.3333 3.08934 10.3333 5.66667Z"stroke=currentColor stroke-width=1.66667 stroke-linecap=round stroke-linejoin=round>'),ji=u('<svg width=24 height=24 viewBox="0 0 24 24"fill=none xmlns=http://www.w3.org/2000/svg><path d="M9 3H15M3 6H21M19 6L18.2987 16.5193C18.1935 18.0975 18.1409 18.8867 17.8 19.485C17.4999 20.0118 17.0472 20.4353 16.5017 20.6997C15.882 21 15.0911 21 13.5093 21H10.4907C8.90891 21 8.11803 21 7.49834 20.6997C6.95276 20.4353 6.50009 20.0118 6.19998 19.485C5.85911 18.8867 5.8065 18.0975 5.70129 16.5193L5 6M10 10.5V15.5M14 10.5V15.5"stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round>'),Ni=u('<svg width=10 height=6 viewBox="0 0 10 6"fill=none xmlns=http://www.w3.org/2000/svg><path d="M1 1L5 5L9 1"stroke=currentColor stroke-width=1.66667 stroke-linecap=round stroke-linejoin=round>'),Qi=u('<svg width=12 height=12 viewBox="0 0 16 16"fill=none xmlns=http://www.w3.org/2000/svg><path d="M8 13.3333V2.66667M8 2.66667L4 6.66667M8 2.66667L12 6.66667"stroke=currentColor stroke-width=1.66667 stroke-linecap=round stroke-linejoin=round>'),Wi=u('<svg width=12 height=12 viewBox="0 0 16 16"fill=none xmlns=http://www.w3.org/2000/svg><path d="M8 2.66667V13.3333M8 13.3333L4 9.33333M8 13.3333L12 9.33333"stroke=currentColor stroke-width=1.66667 stroke-linecap=round stroke-linejoin=round>'),_i=u('<svg viewBox="0 0 24 24"height=12 width=12 fill=none xmlns=http://www.w3.org/2000/svg><path d="M12 2v2m0 16v2M4 12H2m4.314-5.686L4.9 4.9m12.786 1.414L19.1 4.9M6.314 17.69 4.9 19.104m12.786-1.414 1.414 1.414M22 12h-2m-3 0a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z"stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round>'),Xi=u('<svg viewBox="0 0 24 24"height=12 width=12 fill=none xmlns=http://www.w3.org/2000/svg><path d="M22 15.844a10.424 10.424 0 0 1-4.306.925c-5.779 0-10.463-4.684-10.463-10.462 0-1.536.33-2.994.925-4.307A10.464 10.464 0 0 0 2 11.538C2 17.316 6.684 22 12.462 22c4.243 0 7.896-2.526 9.538-6.156Z"stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round>'),Zi=u('<svg viewBox="0 0 24 24"height=12 width=12 fill=none xmlns=http://www.w3.org/2000/svg><path d="M8 21h8m-4-4v4m-5.2-4h10.4c1.68 0 2.52 0 3.162-.327a3 3 0 0 0 1.311-1.311C22 14.72 22 13.88 22 12.2V7.8c0-1.68 0-2.52-.327-3.162a3 3 0 0 0-1.311-1.311C19.72 3 18.88 3 17.2 3H6.8c-1.68 0-2.52 0-3.162.327a3 3 0 0 0-1.311 1.311C2 5.28 2 6.12 2 7.8v4.4c0 1.68 0 2.52.327 3.162a3 3 0 0 0 1.311 1.311C4.28 17 5.12 17 6.8 17Z"stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round>'),Yi=u('<svg stroke=currentColor fill=currentColor stroke-width=0 viewBox="0 0 24 24"height=1em width=1em xmlns=http://www.w3.org/2000/svg><path fill=none d="M0 0h24v24H0z"></path><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 00-6 0zm-4-4l2 2a7.074 7.074 0 0110 0l2-2C15.14 9.14 8.87 9.14 5 13z">'),Ji=u('<svg stroke-width=0 viewBox="0 0 24 24"height=1em width=1em xmlns=http://www.w3.org/2000/svg><path fill=none d="M24 .01c0-.01 0-.01 0 0L0 0v24h24V.01zM0 0h24v24H0V0zm0 0h24v24H0V0z"></path><path d="M22.99 9C19.15 5.16 13.8 3.76 8.84 4.78l2.52 2.52c3.47-.17 6.99 1.05 9.63 3.7l2-2zm-4 4a9.793 9.793 0 00-4.49-2.56l3.53 3.53.96-.97zM2 3.05L5.07 6.1C3.6 6.82 2.22 7.78 1 9l1.99 2c1.24-1.24 2.67-2.16 4.2-2.77l2.24 2.24A9.684 9.684 0 005 13v.01L6.99 15a7.042 7.042 0 014.92-2.06L18.98 20l1.27-1.26L3.29 1.79 2 3.05zM9 17l3 3 3-3a4.237 4.237 0 00-6 0z">'),es=u('<svg width=24 height=24 viewBox="0 0 24 24"fill=none xmlns=http://www.w3.org/2000/svg><path d="M9.3951 19.3711L9.97955 20.6856C10.1533 21.0768 10.4368 21.4093 10.7958 21.6426C11.1547 21.8759 11.5737 22.0001 12.0018 22C12.4299 22.0001 12.8488 21.8759 13.2078 21.6426C13.5667 21.4093 13.8503 21.0768 14.024 20.6856L14.6084 19.3711C14.8165 18.9047 15.1664 18.5159 15.6084 18.26C16.0532 18.0034 16.5678 17.8941 17.0784 17.9478L18.5084 18.1C18.9341 18.145 19.3637 18.0656 19.7451 17.8713C20.1265 17.6771 20.4434 17.3763 20.6573 17.0056C20.8715 16.635 20.9735 16.2103 20.9511 15.7829C20.9286 15.3555 20.7825 14.9438 20.5307 14.5978L19.684 13.4344C19.3825 13.0171 19.2214 12.5148 19.224 12C19.2239 11.4866 19.3865 10.9864 19.6884 10.5711L20.5351 9.40778C20.787 9.06175 20.933 8.65007 20.9555 8.22267C20.978 7.79528 20.8759 7.37054 20.6618 7C20.4479 6.62923 20.131 6.32849 19.7496 6.13423C19.3681 5.93997 18.9386 5.86053 18.5129 5.90556L17.0829 6.05778C16.5722 6.11141 16.0577 6.00212 15.6129 5.74556C15.17 5.48825 14.82 5.09736 14.6129 4.62889L14.024 3.31444C13.8503 2.92317 13.5667 2.59072 13.2078 2.3574C12.8488 2.12408 12.4299 1.99993 12.0018 2C11.5737 1.99993 11.1547 2.12408 10.7958 2.3574C10.4368 2.59072 10.1533 2.92317 9.97955 3.31444L9.3951 4.62889C9.18803 5.09736 8.83798 5.48825 8.3951 5.74556C7.95032 6.00212 7.43577 6.11141 6.9251 6.05778L5.49066 5.90556C5.06499 5.86053 4.6354 5.93997 4.25397 6.13423C3.87255 6.32849 3.55567 6.62923 3.34177 7C3.12759 7.37054 3.02555 7.79528 3.04804 8.22267C3.07052 8.65007 3.21656 9.06175 3.46844 9.40778L4.3151 10.5711C4.61704 10.9864 4.77964 11.4866 4.77955 12C4.77964 12.5134 4.61704 13.0137 4.3151 13.4289L3.46844 14.5922C3.21656 14.9382 3.07052 15.3499 3.04804 15.7773C3.02555 16.2047 3.12759 16.6295 3.34177 17C3.55589 17.3706 3.8728 17.6712 4.25417 17.8654C4.63554 18.0596 5.06502 18.1392 5.49066 18.0944L6.92066 17.9422C7.43133 17.8886 7.94587 17.9979 8.39066 18.2544C8.83519 18.511 9.18687 18.902 9.3951 19.3711Z"stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round></path><path d="M12 15C13.6568 15 15 13.6569 15 12C15 10.3431 13.6568 9 12 9C10.3431 9 8.99998 10.3431 8.99998 12C8.99998 13.6569 10.3431 15 12 15Z"stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round>'),ts=u('<svg width=24 height=24 viewBox="0 0 24 24"fill=none xmlns=http://www.w3.org/2000/svg><path d="M16 21H16.2C17.8802 21 18.7202 21 19.362 20.673C19.9265 20.3854 20.3854 19.9265 20.673 19.362C21 18.7202 21 17.8802 21 16.2V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V8M11.5 12.5L17 7M17 7H12M17 7V12M6.2 21H8.8C9.9201 21 10.4802 21 10.908 20.782C11.2843 20.5903 11.5903 20.2843 11.782 19.908C12 19.4802 12 18.9201 12 17.8V15.2C12 14.0799 12 13.5198 11.782 13.092C11.5903 12.7157 11.2843 12.4097 10.908 12.218C10.4802 12 9.92011 12 8.8 12H6.2C5.0799 12 4.51984 12 4.09202 12.218C3.71569 12.4097 3.40973 12.7157 3.21799 13.092C3 13.5198 3 14.0799 3 15.2V17.8C3 18.9201 3 19.4802 3.21799 19.908C3.40973 20.2843 3.71569 20.5903 4.09202 20.782C4.51984 21 5.07989 21 6.2 21Z"stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round>'),ns=u('<svg width=24 height=24 viewBox="0 0 24 24"fill=none xmlns=http://www.w3.org/2000/svg><path class=copier d="M8 8V5.2C8 4.0799 8 3.51984 8.21799 3.09202C8.40973 2.71569 8.71569 2.40973 9.09202 2.21799C9.51984 2 10.0799 2 11.2 2H18.8C19.9201 2 20.4802 2 20.908 2.21799C21.2843 2.40973 21.5903 2.71569 21.782 3.09202C22 3.51984 22 4.0799 22 5.2V12.8C22 13.9201 22 14.4802 21.782 14.908C21.5903 15.2843 21.2843 15.5903 20.908 15.782C20.4802 16 19.9201 16 18.8 16H16M5.2 22H12.8C13.9201 22 14.4802 22 14.908 21.782C15.2843 21.5903 15.5903 21.2843 15.782 20.908C16 20.4802 16 19.9201 16 18.8V11.2C16 10.0799 16 9.51984 15.782 9.09202C15.5903 8.71569 15.2843 8.40973 14.908 8.21799C14.4802 8 13.9201 8 12.8 8H5.2C4.0799 8 3.51984 8 3.09202 8.21799C2.71569 8.40973 2.40973 8.71569 2.21799 9.09202C2 9.51984 2 10.0799 2 11.2V18.8C2 19.9201 2 20.4802 2.21799 20.908C2.40973 21.2843 2.71569 21.5903 3.09202 21.782C3.51984 22 4.07989 22 5.2 22Z"stroke-width=2 stroke-linecap=round stroke-linejoin=round stroke=currentColor>'),rs=u('<svg width=24 height=24 viewBox="0 0 24 24"fill=none xmlns=http://www.w3.org/2000/svg><path d="M2.5 21.4998L8.04927 19.3655C8.40421 19.229 8.58168 19.1607 8.74772 19.0716C8.8952 18.9924 9.0358 18.901 9.16804 18.7984C9.31692 18.6829 9.45137 18.5484 9.72028 18.2795L21 6.99982C22.1046 5.89525 22.1046 4.10438 21 2.99981C19.8955 1.89525 18.1046 1.89524 17 2.99981L5.72028 14.2795C5.45138 14.5484 5.31692 14.6829 5.20139 14.8318C5.09877 14.964 5.0074 15.1046 4.92823 15.2521C4.83911 15.4181 4.77085 15.5956 4.63433 15.9506L2.5 21.4998ZM2.5 21.4998L4.55812 16.1488C4.7054 15.7659 4.77903 15.5744 4.90534 15.4867C5.01572 15.4101 5.1523 15.3811 5.2843 15.4063C5.43533 15.4351 5.58038 15.5802 5.87048 15.8703L8.12957 18.1294C8.41967 18.4195 8.56472 18.5645 8.59356 18.7155C8.61877 18.8475 8.58979 18.9841 8.51314 19.0945C8.42545 19.2208 8.23399 19.2944 7.85107 19.4417L2.5 21.4998Z"stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round>'),os=u('<svg width=24 height=24 viewBox="0 0 24 24"fill=none xmlns=http://www.w3.org/2000/svg><path d="M7.5 12L10.5 15L16.5 9M7.8 21H16.2C17.8802 21 18.7202 21 19.362 20.673C19.9265 20.3854 20.3854 19.9265 20.673 19.362C21 18.7202 21 17.8802 21 16.2V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21Z"stroke-width=2 stroke-linecap=round stroke-linejoin=round>'),is=u('<svg width=24 height=24 viewBox="0 0 24 24"fill=none xmlns=http://www.w3.org/2000/svg><path d="M9 9L15 15M15 9L9 15M7.8 21H16.2C17.8802 21 18.7202 21 19.362 20.673C19.9265 20.3854 20.3854 19.9265 20.673 19.362C21 18.7202 21 17.8802 21 16.2V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21Z"stroke=#F04438 stroke-width=2 stroke-linecap=round stroke-linejoin=round>'),ss=u('<svg width=24 height=24 viewBox="0 0 24 24"fill=none stroke=currentColor stroke-width=2 xmlns=http://www.w3.org/2000/svg><rect class=list width=20 height=20 y=2 x=2 rx=2></rect><line class=list-item y1=7 y2=7 x1=6 x2=18></line><line class=list-item y2=12 y1=12 x1=6 x2=18></line><line class=list-item y1=17 y2=17 x1=6 x2=18>'),as=u('<svg viewBox="0 0 24 24"height=20 width=20 fill=none xmlns=http://www.w3.org/2000/svg><path d="M3 7.8c0-1.68 0-2.52.327-3.162a3 3 0 0 1 1.311-1.311C5.28 3 6.12 3 7.8 3h8.4c1.68 0 2.52 0 3.162.327a3 3 0 0 1 1.311 1.311C21 5.28 21 6.12 21 7.8v8.4c0 1.68 0 2.52-.327 3.162a3 3 0 0 1-1.311 1.311C18.72 21 17.88 21 16.2 21H7.8c-1.68 0-2.52 0-3.162-.327a3 3 0 0 1-1.311-1.311C3 18.72 3 17.88 3 16.2V7.8Z"stroke-width=2 stroke-linecap=round stroke-linejoin=round>'),ls=u('<svg width=14 height=14 viewBox="0 0 24 24"fill=none xmlns=http://www.w3.org/2000/svg><path d="M7.5 12L10.5 15L16.5 9M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round>'),ds=u('<svg width=14 height=14 viewBox="0 0 24 24"fill=none xmlns=http://www.w3.org/2000/svg><path d="M12 2V6M12 18V22M6 12H2M22 12H18M19.0784 19.0784L16.25 16.25M19.0784 4.99994L16.25 7.82837M4.92157 19.0784L7.75 16.25M4.92157 4.99994L7.75 7.82837"stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round></path><animateTransform attributeName=transform attributeType=XML type=rotate from=0 to=360 dur=2s repeatCount=indefinite>'),cs=u('<svg width=14 height=14 viewBox="0 0 24 24"fill=none xmlns=http://www.w3.org/2000/svg><path d="M15 9L9 15M9 9L15 15M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round>'),us=u('<svg width=14 height=14 viewBox="0 0 24 24"fill=none xmlns=http://www.w3.org/2000/svg><path d="M9.5 15V9M14.5 15V9M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round>'),gs=u('<svg version=1.0 viewBox="0 0 633 633"><linearGradient x1=-666.45 x2=-666.45 y1=163.28 y2=163.99 gradientTransform="matrix(633 0 0 633 422177 -103358)"gradientUnits=userSpaceOnUse><stop stop-color=#6BDAFF offset=0></stop><stop stop-color=#F9FFB5 offset=.32></stop><stop stop-color=#FFA770 offset=.71></stop><stop stop-color=#FF7373 offset=1></stop></linearGradient><circle cx=316.5 cy=316.5 r=316.5></circle><defs><filter x=-137.5 y=412 width=454 height=396.9 filterUnits=userSpaceOnUse><feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"></feColorMatrix></filter></defs><mask x=-137.5 y=412 width=454 height=396.9 maskUnits=userSpaceOnUse><g><circle cx=316.5 cy=316.5 r=316.5 fill=#fff></circle></g></mask><g><ellipse cx=89.5 cy=610.5 rx=214.5 ry=186 fill=#015064 stroke=#00CFE2 stroke-width=25></ellipse></g><defs><filter x=316.5 y=412 width=454 height=396.9 filterUnits=userSpaceOnUse><feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"></feColorMatrix></filter></defs><mask x=316.5 y=412 width=454 height=396.9 maskUnits=userSpaceOnUse><g><circle cx=316.5 cy=316.5 r=316.5 fill=#fff></circle></g></mask><g><ellipse cx=543.5 cy=610.5 rx=214.5 ry=186 fill=#015064 stroke=#00CFE2 stroke-width=25></ellipse></g><defs><filter x=-137.5 y=450 width=454 height=396.9 filterUnits=userSpaceOnUse><feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"></feColorMatrix></filter></defs><mask x=-137.5 y=450 width=454 height=396.9 maskUnits=userSpaceOnUse><g><circle cx=316.5 cy=316.5 r=316.5 fill=#fff></circle></g></mask><g><ellipse cx=89.5 cy=648.5 rx=214.5 ry=186 fill=#015064 stroke=#00A8B8 stroke-width=25></ellipse></g><defs><filter x=316.5 y=450 width=454 height=396.9 filterUnits=userSpaceOnUse><feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"></feColorMatrix></filter></defs><mask x=316.5 y=450 width=454 height=396.9 maskUnits=userSpaceOnUse><g><circle cx=316.5 cy=316.5 r=316.5 fill=#fff></circle></g></mask><g><ellipse cx=543.5 cy=648.5 rx=214.5 ry=186 fill=#015064 stroke=#00A8B8 stroke-width=25></ellipse></g><defs><filter x=-137.5 y=486 width=454 height=396.9 filterUnits=userSpaceOnUse><feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"></feColorMatrix></filter></defs><mask x=-137.5 y=486 width=454 height=396.9 maskUnits=userSpaceOnUse><g><circle cx=316.5 cy=316.5 r=316.5 fill=#fff></circle></g></mask><g><ellipse cx=89.5 cy=684.5 rx=214.5 ry=186 fill=#015064 stroke=#007782 stroke-width=25></ellipse></g><defs><filter x=316.5 y=486 width=454 height=396.9 filterUnits=userSpaceOnUse><feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"></feColorMatrix></filter></defs><mask x=316.5 y=486 width=454 height=396.9 maskUnits=userSpaceOnUse><g><circle cx=316.5 cy=316.5 r=316.5 fill=#fff></circle></g></mask><g><ellipse cx=543.5 cy=684.5 rx=214.5 ry=186 fill=#015064 stroke=#007782 stroke-width=25></ellipse></g><defs><filter x=272.2 y=308 width=176.9 height=129.3 filterUnits=userSpaceOnUse><feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"></feColorMatrix></filter></defs><mask x=272.2 y=308 width=176.9 height=129.3 maskUnits=userSpaceOnUse><g><circle cx=316.5 cy=316.5 r=316.5 fill=#fff></circle></g></mask><g><line x1=436 x2=431 y1=403.2 y2=431.8 fill=none stroke=#000 stroke-linecap=round stroke-linejoin=bevel stroke-width=11></line><line x1=291 x2=280 y1=341.5 y2=403.5 fill=none stroke=#000 stroke-linecap=round stroke-linejoin=bevel stroke-width=11></line><line x1=332.9 x2=328.6 y1=384.1 y2=411.2 fill=none stroke=#000 stroke-linecap=round stroke-linejoin=bevel stroke-width=11></line><linearGradient x1=-670.75 x2=-671.59 y1=164.4 y2=164.49 gradientTransform="matrix(-184.16 -32.472 -11.461 64.997 -121359 -32126)"gradientUnits=userSpaceOnUse><stop stop-color=#EE2700 offset=0></stop><stop stop-color=#FF008E offset=1></stop></linearGradient><path d="m344.1 363 97.7 17.2c5.8 2.1 8.2 6.1 7.1 12.1s-4.7 9.2-11 9.9l-106-18.7-57.5-59.2c-3.2-4.8-2.9-9.1 0.8-12.8s8.3-4.4 13.7-2.1l55.2 53.6z"clip-rule=evenodd fill-rule=evenodd></path><line x1=428.2 x2=429.1 y1=384.5 y2=378 fill=none stroke=#fff stroke-linecap=round stroke-linejoin=bevel stroke-width=7></line><line x1=395.2 x2=396.1 y1=379.5 y2=373 fill=none stroke=#fff stroke-linecap=round stroke-linejoin=bevel stroke-width=7></line><line x1=362.2 x2=363.1 y1=373.5 y2=367.4 fill=none stroke=#fff stroke-linecap=round stroke-linejoin=bevel stroke-width=7></line><line x1=324.2 x2=328.4 y1=351.3 y2=347.4 fill=none stroke=#fff stroke-linecap=round stroke-linejoin=bevel stroke-width=7></line><line x1=303.2 x2=307.4 y1=331.3 y2=327.4 fill=none stroke=#fff stroke-linecap=round stroke-linejoin=bevel stroke-width=7></line></g><defs><filter x=73.2 y=113.8 width=280.6 height=317.4 filterUnits=userSpaceOnUse><feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"></feColorMatrix></filter></defs><mask x=73.2 y=113.8 width=280.6 height=317.4 maskUnits=userSpaceOnUse><g><circle cx=316.5 cy=316.5 r=316.5 fill=#fff></circle></g></mask><g><linearGradient x1=-672.16 x2=-672.16 y1=165.03 y2=166.03 gradientTransform="matrix(-100.18 48.861 97.976 200.88 -83342 -93.059)"gradientUnits=userSpaceOnUse><stop stop-color=#A17500 offset=0></stop><stop stop-color=#5D2100 offset=1></stop></linearGradient><path d="m192.3 203c8.1 37.3 14 73.6 17.8 109.1 3.8 35.4 2.8 75.1-3 119.2l61.2-16.7c-15.6-59-25.2-97.9-28.6-116.6s-10.8-51.9-22.1-99.6l-25.3 4.6"clip-rule=evenodd fill-rule=evenodd></path><g stroke=#2F8A00><linearGradient x1=-660.23 x2=-660.23 y1=166.72 y2=167.72 gradientTransform="matrix(92.683 4.8573 -2.0259 38.657 61680 -3088.6)"gradientUnits=userSpaceOnUse><stop stop-color=#2F8A00 offset=0></stop><stop stop-color=#90FF57 offset=1></stop></linearGradient><path d="m195 183.9s-12.6-22.1-36.5-29.9c-15.9-5.2-34.4-1.5-55.5 11.1 15.9 14.3 29.5 22.6 40.7 24.9 16.8 3.6 51.3-6.1 51.3-6.1z"clip-rule=evenodd fill-rule=evenodd stroke-width=13></path><linearGradient x1=-661.36 x2=-661.36 y1=164.18 y2=165.18 gradientTransform="matrix(110 5.7648 -6.3599 121.35 73933 -15933)"gradientUnits=userSpaceOnUse><stop stop-color=#2F8A00 offset=0></stop><stop stop-color=#90FF57 offset=1></stop></linearGradient><path d="m194.9 184.5s-47.5-8.5-83.2 15.7c-23.8 16.2-34.3 49.3-31.6 99.4 30.3-27.8 52.1-48.5 65.2-61.9 19.8-20.2 49.6-53.2 49.6-53.2z"clip-rule=evenodd fill-rule=evenodd stroke-width=13></path><linearGradient x1=-656.79 x2=-656.79 y1=165.15 y2=166.15 gradientTransform="matrix(62.954 3.2993 -3.5023 66.828 42156 -8754.1)"gradientUnits=userSpaceOnUse><stop stop-color=#2F8A00 offset=0></stop><stop stop-color=#90FF57 offset=1></stop></linearGradient><path d="m195 183.9c-0.8-21.9 6-38 20.6-48.2s29.8-15.4 45.5-15.3c-6.1 21.4-14.5 35.8-25.2 43.4s-24.4 14.2-40.9 20.1z"clip-rule=evenodd fill-rule=evenodd stroke-width=13></path><linearGradient x1=-663.07 x2=-663.07 y1=165.44 y2=166.44 gradientTransform="matrix(152.47 7.9907 -3.0936 59.029 101884 -4318.7)"gradientUnits=userSpaceOnUse><stop stop-color=#2F8A00 offset=0></stop><stop stop-color=#90FF57 offset=1></stop></linearGradient><path d="m194.9 184.5c31.9-30 64.1-39.7 96.7-29s50.8 30.4 54.6 59.1c-35.2-5.5-60.4-9.6-75.8-12.1-15.3-2.6-40.5-8.6-75.5-18z"clip-rule=evenodd fill-rule=evenodd stroke-width=13></path><linearGradient x1=-662.57 x2=-662.57 y1=164.44 y2=165.44 gradientTransform="matrix(136.46 7.1517 -5.2163 99.533 91536 -11442)"gradientUnits=userSpaceOnUse><stop stop-color=#2F8A00 offset=0></stop><stop stop-color=#90FF57 offset=1></stop></linearGradient><path d="m194.9 184.5c35.8-7.6 65.6-0.2 89.2 22s37.7 49 42.3 80.3c-39.8-9.7-68.3-23.8-85.5-42.4s-32.5-38.5-46-59.9z"clip-rule=evenodd fill-rule=evenodd stroke-width=13></path><linearGradient x1=-656.43 x2=-656.43 y1=163.86 y2=164.86 gradientTransform="matrix(60.866 3.1899 -8.7773 167.48 41560 -25168)"gradientUnits=userSpaceOnUse><stop stop-color=#2F8A00 offset=0></stop><stop stop-color=#90FF57 offset=1></stop></linearGradient><path d="m194.9 184.5c-33.6 13.8-53.6 35.7-60.1 65.6s-3.6 63.1 8.7 99.6c27.4-40.3 43.2-69.6 47.4-88s5.6-44.1 4-77.2z"clip-rule=evenodd fill-rule=evenodd stroke-width=13></path><path d="m196.5 182.3c-14.8 21.6-25.1 41.4-30.8 59.4s-9.5 33-11.1 45.1"fill=none stroke-linecap=round stroke-width=8></path><path d="m194.9 185.7c-24.4 1.7-43.8 9-58.1 21.8s-24.7 25.4-31.3 37.8"fill=none stroke-linecap=round stroke-width=8></path><path d="m204.5 176.4c29.7-6.7 52-8.4 67-5.1s26.9 8.6 35.8 15.9"fill=none stroke-linecap=round stroke-width=8></path><path d="m196.5 181.4c20.3 9.9 38.2 20.5 53.9 31.9s27.4 22.1 35.1 32"fill=none stroke-linecap=round stroke-width=8></path></g></g><defs><filter x=50.5 y=399 width=532 height=633 filterUnits=userSpaceOnUse><feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"></feColorMatrix></filter></defs><mask x=50.5 y=399 width=532 height=633 maskUnits=userSpaceOnUse><g><circle cx=316.5 cy=316.5 r=316.5 fill=#fff></circle></g></mask><g><linearGradient x1=-666.06 x2=-666.23 y1=163.36 y2=163.75 gradientTransform="matrix(532 0 0 633 354760 -102959)"gradientUnits=userSpaceOnUse><stop stop-color=#FFF400 offset=0></stop><stop stop-color=#3C8700 offset=1></stop></linearGradient><ellipse cx=316.5 cy=715.5 rx=266 ry=316.5></ellipse></g><defs><filter x=391 y=-24 width=288 height=283 filterUnits=userSpaceOnUse><feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"></feColorMatrix></filter></defs><mask x=391 y=-24 width=288 height=283 maskUnits=userSpaceOnUse><g><circle cx=316.5 cy=316.5 r=316.5 fill=#fff></circle></g></mask><g><linearGradient x1=-664.56 x2=-664.56 y1=163.79 y2=164.79 gradientTransform="matrix(227 0 0 227 151421 -37204)"gradientUnits=userSpaceOnUse><stop stop-color=#FFDF00 offset=0></stop><stop stop-color=#FF9D00 offset=1></stop></linearGradient><circle cx=565.5 cy=89.5 r=113.5></circle><linearGradient x1=-644.5 x2=-645.77 y1=342 y2=342 gradientTransform="matrix(30 0 0 1 19770 -253)"gradientUnits=userSpaceOnUse><stop stop-color=#FFA400 offset=0></stop><stop stop-color=#FF5E00 offset=1></stop></linearGradient><line x1=427 x2=397 y1=89 y2=89 fill=none stroke-linecap=round stroke-linejoin=bevel stroke-width=12></line><linearGradient x1=-641.56 x2=-642.83 y1=196.02 y2=196.07 gradientTransform="matrix(26.5 0 0 5.5 17439 -1025.5)"gradientUnits=userSpaceOnUse><stop stop-color=#FFA400 offset=0></stop><stop stop-color=#FF5E00 offset=1></stop></linearGradient><line x1=430.5 x2=404 y1=55.5 y2=50 fill=none stroke-linecap=round stroke-linejoin=bevel stroke-width=12></line><linearGradient x1=-643.73 x2=-645 y1=185.83 y2=185.9 gradientTransform="matrix(29 0 0 8 19107 -1361)"gradientUnits=userSpaceOnUse><stop stop-color=#FFA400 offset=0></stop><stop stop-color=#FF5E00 offset=1></stop></linearGradient><line x1=431 x2=402 y1=122 y2=130 fill=none stroke-linecap=round stroke-linejoin=bevel stroke-width=12></line><linearGradient x1=-638.94 x2=-640.22 y1=177.09 y2=177.39 gradientTransform="matrix(24 0 0 13 15783 -2145)"gradientUnits=userSpaceOnUse><stop stop-color=#FFA400 offset=0></stop><stop stop-color=#FF5E00 offset=1></stop></linearGradient><line x1=442 x2=418 y1=153 y2=166 fill=none stroke-linecap=round stroke-linejoin=bevel stroke-width=12></line><linearGradient x1=-633.42 x2=-634.7 y1=172.41 y2=173.31 gradientTransform="matrix(20 0 0 19 13137 -3096)"gradientUnits=userSpaceOnUse><stop stop-color=#FFA400 offset=0></stop><stop stop-color=#FF5E00 offset=1></stop></linearGradient><line x1=464 x2=444 y1=180 y2=199 fill=none stroke-linecap=round stroke-linejoin=bevel stroke-width=12></line><linearGradient x1=-619.05 x2=-619.52 y1=170.82 y2=171.82 gradientTransform="matrix(13.83 0 0 22.85 9050 -3703.4)"gradientUnits=userSpaceOnUse><stop stop-color=#FFA400 offset=0></stop><stop stop-color=#FF5E00 offset=1></stop></linearGradient><line x1=491.4 x2=477.5 y1=203 y2=225.9 fill=none stroke-linecap=round stroke-linejoin=bevel stroke-width=12></line><linearGradient x1=-578.5 x2=-578.63 y1=170.31 y2=171.31 gradientTransform="matrix(7.5 0 0 24.5 4860 -3953)"gradientUnits=userSpaceOnUse><stop stop-color=#FFA400 offset=0></stop><stop stop-color=#FF5E00 offset=1></stop></linearGradient><line x1=524.5 x2=517 y1=219.5 y2=244 fill=none stroke-linecap=round stroke-linejoin=bevel stroke-width=12></line><linearGradient x1=666.5 x2=666.5 y1=170.31 y2=171.31 gradientTransform="matrix(.5 0 0 24.5 231.5 -3944)"gradientUnits=userSpaceOnUse><stop stop-color=#FFA400 offset=0></stop><stop stop-color=#FF5E00 offset=1></stop></linearGradient><line x1=564.5 x2=565 y1=228.5 y2=253 fill=none stroke-linecap=round stroke-linejoin=bevel stroke-width=12>');function fs(){return Vi()}function ps(){return ji()}function hs(){return Ni()}function ys(){return Qi()}function bs(){return Wi()}function ms(){return(e=Wi()).style.setProperty("transform","rotate(90deg)"),e;var e}function vs(){return(e=Wi()).style.setProperty("transform","rotate(-90deg)"),e;var e}function ws(){return _i()}function xs(){return Xi()}function ks(){return Zi()}function $s(){return Yi()}function Ss(){return Ji()}function Cs(){return es()}function Es(){return ts()}function qs(){return ns()}function Ms(){return rs()}function Ls(e){return t=os(),n=t.firstChild,f(()=>k(n,"stroke","dark"===e.theme?"#12B76A":"#027A48")),t;var t,n}function Fs(){return is()}function Ds(){return ss()}function Ts(e){return[a(c,{get when(){return e.checked},get children(){var t=os(),n=t.firstChild;return f(()=>k(n,"stroke","dark"===e.theme?"#9B8AFB":"#6938EF")),t}}),a(c,{get when(){return!e.checked},get children(){var t=as(),n=t.firstChild;return f(()=>k(n,"stroke","dark"===e.theme?"#9B8AFB":"#6938EF")),t}})]}function As(){return ls()}function Os(){return ds()}function Is(){return cs()}function Ps(){return us()}function zs(){const e=C();return t=gs(),n=t.firstChild,r=n.nextSibling,o=r.nextSibling,i=o.firstChild,s=o.nextSibling,a=s.firstChild,l=s.nextSibling,d=l.nextSibling,c=d.firstChild,u=d.nextSibling,g=u.firstChild,f=u.nextSibling,p=f.nextSibling,h=p.firstChild,y=p.nextSibling,b=y.firstChild,m=y.nextSibling,v=m.nextSibling,w=v.firstChild,x=v.nextSibling,$=x.firstChild,S=x.nextSibling,E=S.nextSibling,q=E.firstChild,M=E.nextSibling,L=M.firstChild,F=M.nextSibling,D=F.nextSibling,T=D.firstChild,A=D.nextSibling,O=A.firstChild,I=A.nextSibling,P=I.nextSibling,z=P.firstChild,K=P.nextSibling,R=K.firstChild,B=K.nextSibling,H=B.firstChild.nextSibling.nextSibling.nextSibling,G=H.nextSibling,U=B.nextSibling,V=U.firstChild,j=U.nextSibling,N=j.firstChild,Q=j.nextSibling,W=Q.firstChild,_=W.nextSibling,X=_.nextSibling.firstChild,Z=X.nextSibling,Y=Z.nextSibling,J=Y.nextSibling,ee=J.nextSibling,te=ee.nextSibling,ne=te.nextSibling,re=ne.nextSibling,oe=re.nextSibling,ie=oe.nextSibling,se=ie.nextSibling,ae=se.nextSibling,le=Q.nextSibling,de=le.firstChild,ce=le.nextSibling,ue=ce.firstChild,ge=ce.nextSibling,fe=ge.firstChild,pe=fe.nextSibling,he=ge.nextSibling,ye=he.firstChild,be=he.nextSibling,me=be.firstChild,ve=be.nextSibling,we=ve.firstChild,xe=we.nextSibling,ke=xe.nextSibling,$e=ke.nextSibling,Se=$e.nextSibling,Ce=Se.nextSibling,Ee=Ce.nextSibling,qe=Ee.nextSibling,Me=qe.nextSibling,Le=Me.nextSibling,Fe=Le.nextSibling,De=Fe.nextSibling,Te=De.nextSibling,Ae=Te.nextSibling,Oe=Ae.nextSibling,Ie=Oe.nextSibling,Pe=Ie.nextSibling,ze=Pe.nextSibling,k(n,"id",`a-${e}`),k(r,"fill",`url(#a-${e})`),k(i,"id",`am-${e}`),k(s,"id",`b-${e}`),k(a,"filter",`url(#am-${e})`),k(l,"mask",`url(#b-${e})`),k(c,"id",`ah-${e}`),k(u,"id",`k-${e}`),k(g,"filter",`url(#ah-${e})`),k(f,"mask",`url(#k-${e})`),k(h,"id",`ae-${e}`),k(y,"id",`j-${e}`),k(b,"filter",`url(#ae-${e})`),k(m,"mask",`url(#j-${e})`),k(w,"id",`ai-${e}`),k(x,"id",`i-${e}`),k($,"filter",`url(#ai-${e})`),k(S,"mask",`url(#i-${e})`),k(q,"id",`aj-${e}`),k(M,"id",`h-${e}`),k(L,"filter",`url(#aj-${e})`),k(F,"mask",`url(#h-${e})`),k(T,"id",`ag-${e}`),k(A,"id",`g-${e}`),k(O,"filter",`url(#ag-${e})`),k(I,"mask",`url(#g-${e})`),k(z,"id",`af-${e}`),k(K,"id",`f-${e}`),k(R,"filter",`url(#af-${e})`),k(B,"mask",`url(#f-${e})`),k(H,"id",`m-${e}`),k(G,"fill",`url(#m-${e})`),k(V,"id",`ak-${e}`),k(j,"id",`e-${e}`),k(N,"filter",`url(#ak-${e})`),k(Q,"mask",`url(#e-${e})`),k(W,"id",`n-${e}`),k(_,"fill",`url(#n-${e})`),k(X,"id",`r-${e}`),k(Z,"fill",`url(#r-${e})`),k(Y,"id",`s-${e}`),k(J,"fill",`url(#s-${e})`),k(ee,"id",`q-${e}`),k(te,"fill",`url(#q-${e})`),k(ne,"id",`p-${e}`),k(re,"fill",`url(#p-${e})`),k(oe,"id",`o-${e}`),k(ie,"fill",`url(#o-${e})`),k(se,"id",`l-${e}`),k(ae,"fill",`url(#l-${e})`),k(de,"id",`al-${e}`),k(ce,"id",`d-${e}`),k(ue,"filter",`url(#al-${e})`),k(ge,"mask",`url(#d-${e})`),k(fe,"id",`u-${e}`),k(pe,"fill",`url(#u-${e})`),k(ye,"id",`ad-${e}`),k(be,"id",`c-${e}`),k(me,"filter",`url(#ad-${e})`),k(ve,"mask",`url(#c-${e})`),k(we,"id",`t-${e}`),k(xe,"fill",`url(#t-${e})`),k(ke,"id",`v-${e}`),k($e,"stroke",`url(#v-${e})`),k(Se,"id",`aa-${e}`),k(Ce,"stroke",`url(#aa-${e})`),k(Ee,"id",`w-${e}`),k(qe,"stroke",`url(#w-${e})`),k(Me,"id",`ac-${e}`),k(Le,"stroke",`url(#ac-${e})`),k(Fe,"id",`ab-${e}`),k(De,"stroke",`url(#ab-${e})`),k(Te,"id",`y-${e}`),k(Ae,"stroke",`url(#y-${e})`),k(Oe,"id",`x-${e}`),k(Ie,"stroke",`url(#x-${e})`),k(Pe,"id",`z-${e}`),k(ze,"stroke",`url(#z-${e})`),t;var t,n,r,o,i,s,a,l,d,c,u,g,f,p,h,y,b,m,v,w,x,$,S,E,q,M,L,F,D,T,A,O,I,P,z,K,R,B,H,G,U,V,j,N,Q,W,_,X,Z,Y,J,ee,te,ne,re,oe,ie,se,ae,le,de,ce,ue,ge,fe,pe,he,ye,be,me,ve,we,xe,ke,$e,Se,Ce,Ee,qe,Me,Le,Fe,De,Te,Ae,Oe,Ie,Pe,ze}var Ks=u('<span><svg width=16 height=16 viewBox="0 0 16 16"fill=none xmlns=http://www.w3.org/2000/svg><path d="M6 12L10 8L6 4"stroke-width=2 stroke-linecap=round stroke-linejoin=round>'),Rs=u('<button title="Copy object to clipboard">'),Bs=u('<button title="Remove all items"aria-label="Remove all items">'),Hs=u('<button title="Delete item"aria-label="Delete item">'),Gs=u('<button title="Toggle value"aria-label="Toggle value">'),Us=u('<button title="Bulk Edit Data"aria-label="Bulk Edit Data">'),Vs=u("<div>"),js=u("<div><button> <span></span> <span> "),Ns=u("<input>"),Qs=u("<span>"),Ws=u("<div><span>:"),_s=u("<div><div><button> [<!>...<!>]");var Xs=e=>{const t=he(),n=ce().shadowDOMTarget?Be.bind({target:ce().shadowDOMTarget}):Be,r=s(()=>"dark"===t()?ia(n):oa(n));return o=Ks(),f(()=>p(o,Ge(r().expander,n`
          transform: rotate(${e.expanded?90:0}deg);
        `,e.expanded&&n`
            & svg {
              top: -1px;
            }
          `))),o;var o},Zs=e=>{const t=he(),n=ce().shadowDOMTarget?Be.bind({target:ce().shadowDOMTarget}):Be,o=s(()=>"dark"===t()?ia(n):oa(n)),[i,l]=r("NoCopy");return d=Rs(),G(d,"click","NoCopy"===i()?()=>{navigator.clipboard.writeText(U(e.value)).then(()=>{l("SuccessCopy"),setTimeout(()=>{l("NoCopy")},1500)},e=>{l("ErrorCopy"),setTimeout(()=>{l("NoCopy")},1500)})}:void 0,!0),g(d,a(j,{get children(){return[a(V,{get when(){return"NoCopy"===i()},get children(){return a(qs,{})}}),a(V,{get when(){return"SuccessCopy"===i()},get children(){return a(Ls,{get theme(){return t()}})}}),a(V,{get when(){return"ErrorCopy"===i()},get children(){return a(Fs,{})}})]}})),f(e=>{var t=o().actionButton,n="NoCopy"===i()?"Copy object to clipboard":"SuccessCopy"===i()?"Object copied to clipboard":"Error copying object to clipboard";return t!==e.e&&p(d,e.e=t),n!==e.t&&k(d,"aria-label",e.t=n),e},{e:void 0,t:void 0}),d;var d},Ys=e=>{const t=he(),n=ce().shadowDOMTarget?Be.bind({target:ce().shadowDOMTarget}):Be,r=s(()=>"dark"===t()?ia(n):oa(n)),o=ce().client;return(i=Bs()).$$click=()=>{const t=e.activeQuery.state.data,n=H(t,e.dataPath,[]);o.setQueryData(e.activeQuery.queryKey,n)},g(i,a(Ds,{})),f(()=>p(i,r().actionButton)),i;var i},Js=e=>{const t=he(),n=ce().shadowDOMTarget?Be.bind({target:ce().shadowDOMTarget}):Be,r=s(()=>"dark"===t()?ia(n):oa(n)),o=ce().client;return(i=Hs()).$$click=()=>{const t=e.activeQuery.state.data,n=N(t,e.dataPath);o.setQueryData(e.activeQuery.queryKey,n)},g(i,a(ps,{})),f(()=>p(i,Ge(r().actionButton))),i;var i},ea=e=>{const t=he(),n=ce().shadowDOMTarget?Be.bind({target:ce().shadowDOMTarget}):Be,r=s(()=>"dark"===t()?ia(n):oa(n)),o=ce().client;return(i=Gs()).$$click=()=>{const t=e.activeQuery.state.data,n=H(t,e.dataPath,!e.value);o.setQueryData(e.activeQuery.queryKey,n)},g(i,a(Ts,{get theme(){return t()},get checked(){return e.value}})),f(()=>p(i,Ge(r().actionButton,n`
          width: ${Ui.size[3.5]};
          height: ${Ui.size[3.5]};
        `))),i;var i};function ta(e){return Symbol.iterator in e}function na(e){const t=he(),n=ce().shadowDOMTarget?Be.bind({target:ce().shadowDOMTarget}):Be,o=s(()=>"dark"===t()?ia(n):oa(n)),i=ce().client,[l,u]=r((e.defaultExpanded||[]).includes(e.label)),[h,y]=r([]),b=s(()=>Array.isArray(e.value)?e.value.map((e,t)=>({label:t.toString(),value:e})):null!==e.value&&"object"==typeof e.value&&ta(e.value)&&"function"==typeof e.value[Symbol.iterator]?e.value instanceof Map?Array.from(e.value,([e,t])=>({label:e,value:t})):Array.from(e.value,(e,t)=>({label:t.toString(),value:e})):"object"==typeof e.value&&null!==e.value?Object.entries(e.value).map(([e,t])=>({label:e,value:t})):[]),m=s(()=>Array.isArray(e.value)?"array":null!==e.value&&"object"==typeof e.value&&ta(e.value)&&"function"==typeof e.value[Symbol.iterator]?"Iterable":"object"==typeof e.value&&null!==e.value?"object":typeof e.value),v=s(()=>function(e,t){let n=0;const r=[];for(;n<e.length;)r.push(e.slice(n,n+t)),n+=t;return r}(b(),100)),w=e.dataPath??[];return x=Vs(),g(x,a(c,{get when(){return v().length},get children(){return[(t=js(),n=t.firstChild,r=n.firstChild,i=r.nextSibling,s=i.nextSibling.nextSibling,x=s.firstChild,n.$$click=()=>u(e=>!e),g(n,a(Xs,{get expanded(){return l()}}),r),g(i,()=>e.label),g(s,()=>"iterable"===String(m()).toLowerCase()?"(Iterable) ":"",x),g(s,()=>b().length,x),g(s,()=>b().length>1?"items":"item",null),g(t,a(c,{get when(){return e.editable},get children(){var t=Vs();return g(t,a(Zs,{get value(){return e.value}}),null),g(t,a(c,{get when(){return e.itemsDeletable&&void 0!==e.activeQuery},get children(){return a(Js,{get activeQuery(){return e.activeQuery},dataPath:w})}}),null),g(t,a(c,{get when(){return"array"===m()&&void 0!==e.activeQuery},get children(){return a(Ys,{get activeQuery(){return e.activeQuery},dataPath:w})}}),null),g(t,a(c,{get when(){return d(()=>!!e.onEdit)()&&!R(e.value).meta},get children(){var t=Us();return t.$$click=()=>{e.onEdit?.()},g(t,a(Ms,{})),f(()=>p(t,o().actionButton)),t}}),null),f(()=>p(t,o().actions)),t}}),null),f(e=>{var r=o().expanderButtonContainer,i=o().expanderButton,a=o().info;return r!==e.e&&p(t,e.e=r),i!==e.t&&p(n,e.t=i),a!==e.a&&p(s,e.a=a),e},{e:void 0,t:void 0,a:void 0}),t),a(c,{get when(){return l()},get children(){return[a(c,{get when(){return 1===v().length},get children(){var t=Vs();return g(t,a(Je,{get each(){return b()},by:e=>e.label,children:t=>a(na,{get defaultExpanded(){return e.defaultExpanded},get label(){return t().label},get value(){return t().value},get editable(){return e.editable},get dataPath(){return[...w,t().label]},get activeQuery(){return e.activeQuery},get itemsDeletable(){return"array"===m()||"Iterable"===m()||"object"===m()}})})),f(()=>p(t,o().subEntry)),t}}),a(c,{get when(){return v().length>1},get children(){var t=Vs();return g(t,a(B,{get each(){return v()},children:(t,n)=>{return r=_s(),i=r.firstChild,s=i.firstChild,l=s.firstChild,d=l.nextSibling,u=d.nextSibling.nextSibling,s.$$click=()=>y(e=>e.includes(n)?e.filter(e=>e!==n):[...e,n]),g(s,a(Xs,{get expanded(){return h().includes(n)}}),l),g(s,100*n,d),g(s,100*n+100-1,u),g(i,a(c,{get when(){return h().includes(n)},get children(){var n=Vs();return g(n,a(Je,{get each(){return t()},by:e=>e.label,children:t=>a(na,{get defaultExpanded(){return e.defaultExpanded},get label(){return t().label},get value(){return t().value},get editable(){return e.editable},get dataPath(){return[...w,t().label]},get activeQuery(){return e.activeQuery}})})),f(()=>p(n,o().subEntry)),n}}),null),f(e=>{var t=o().entry,n=o().expanderButton;return t!==e.e&&p(i,e.e=t),n!==e.t&&p(s,e.t=n),e},{e:void 0,t:void 0}),r;var r,i,s,l,d,u}})),f(()=>p(t,o().subEntry)),t}})]}})];var t,n,r,i,s,x}}),null),g(x,a(c,{get when(){return 0===v().length},get children(){var t=Ws(),n=t.firstChild,r=n.firstChild;return g(n,()=>e.label,r),g(t,a(c,{get when(){return d(()=>!(!e.editable||void 0===e.activeQuery))()&&("string"===m()||"number"===m()||"boolean"===m())},get fallback(){return t=Qs(),g(t,()=>D(e.value)),f(()=>p(t,o().value)),t;var t},get children(){return[a(c,{get when(){return d(()=>!(!e.editable||void 0===e.activeQuery))()&&("string"===m()||"number"===m())},get children(){var t=Ns();return t.addEventListener("change",t=>{const n=e.activeQuery.state.data,r=H(n,w,"number"===m()?t.target.valueAsNumber:t.target.value);i.setQueryData(e.activeQuery.queryKey,r)}),f(e=>{var n="number"===m()?"number":"text",r=Ge(o().value,o().editableInput);return n!==e.e&&k(t,"type",e.e=n),r!==e.t&&p(t,e.t=r),e},{e:void 0,t:void 0}),f(()=>t.value=e.value),t}}),a(c,{get when(){return"boolean"===m()},get children(){var t=Qs();return g(t,a(ea,{get activeQuery(){return e.activeQuery},dataPath:w,get value(){return e.value}}),null),g(t,()=>D(e.value),null),f(()=>p(t,Ge(o().value,o().actions,o().editableInput))),t}})]}}),null),g(t,a(c,{get when(){return e.editable&&e.itemsDeletable&&void 0!==e.activeQuery},get children(){return a(Js,{get activeQuery(){return e.activeQuery},dataPath:w})}}),null),f(e=>{var r=o().row,i=o().label;return r!==e.e&&p(t,e.e=r),i!==e.t&&p(n,e.t=i),e},{e:void 0,t:void 0}),t}}),null),f(()=>p(x,o().entry)),x;var x}var ra=(e,t)=>{const{colors:n,font:r,size:o,border:i}=Ui,s=(t,n)=>"light"===e?t:n;return{entry:t`
      & * {
        font-size: ${r.size.xs};
        font-family:
          ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
          'Liberation Mono', 'Courier New', monospace;
      }
      position: relative;
      outline: none;
      word-break: break-word;
    `,subEntry:t`
      margin: 0 0 0 0.5em;
      padding-left: 0.75em;
      border-left: 2px solid ${s(n.gray[300],n.darkGray[400])};
      /* outline: 1px solid ${n.teal[400]}; */
    `,expander:t`
      & path {
        stroke: ${n.gray[400]};
      }
      & svg {
        width: ${o[3]};
        height: ${o[3]};
      }
      display: inline-flex;
      align-items: center;
      transition: all 0.1s ease;
      /* outline: 1px solid ${n.blue[400]}; */
    `,expanderButtonContainer:t`
      display: flex;
      align-items: center;
      line-height: ${o[4]};
      min-height: ${o[4]};
      gap: ${o[2]};
    `,expanderButton:t`
      cursor: pointer;
      color: inherit;
      font: inherit;
      outline: inherit;
      height: ${o[5]};
      background: transparent;
      border: none;
      padding: 0;
      display: inline-flex;
      align-items: center;
      gap: ${o[1]};
      position: relative;
      /* outline: 1px solid ${n.green[400]}; */

      &:focus-visible {
        border-radius: ${i.radius.xs};
        outline: 2px solid ${n.blue[800]};
      }

      & svg {
        position: relative;
        left: 1px;
      }
    `,info:t`
      color: ${s(n.gray[500],n.gray[500])};
      font-size: ${r.size.xs};
      margin-left: ${o[1]};
      /* outline: 1px solid ${n.yellow[400]}; */
    `,label:t`
      color: ${s(n.gray[700],n.gray[300])};
      white-space: nowrap;
    `,value:t`
      color: ${s(n.purple[600],n.purple[400])};
      flex-grow: 1;
    `,actions:t`
      display: inline-flex;
      gap: ${o[2]};
      align-items: center;
    `,row:t`
      display: inline-flex;
      gap: ${o[2]};
      width: 100%;
      margin: ${o[.25]} 0px;
      line-height: ${o[4.5]};
      align-items: center;
    `,editableInput:t`
      border: none;
      padding: ${o[.5]} ${o[1]} ${o[.5]} ${o[1.5]};
      flex-grow: 1;
      border-radius: ${i.radius.xs};
      background-color: ${s(n.gray[200],n.darkGray[500])};

      &:hover {
        background-color: ${s(n.gray[300],n.darkGray[600])};
      }
    `,actionButton:t`
      background-color: transparent;
      color: ${s(n.gray[500],n.gray[500])};
      border: none;
      display: inline-flex;
      padding: 0px;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      width: ${o[3]};
      height: ${o[3]};
      position: relative;
      z-index: 1;

      &:hover svg {
        color: ${s(n.gray[600],n.gray[400])};
      }

      &:focus-visible {
        border-radius: ${i.radius.xs};
        outline: 2px solid ${n.blue[800]};
        outline-offset: 2px;
      }
    `}},oa=e=>ra("light",e),ia=e=>ra("dark",e);y(["click"]);var sa=u('<div><div aria-hidden=true></div><button type=button aria-label="Open Tanstack query devtools"class=tsqd-open-btn>'),aa=u("<div>"),la=u('<aside aria-label="Tanstack query devtools"><div></div><button aria-label="Close tanstack query devtools">'),da=u("<select name=tsqd-queries-filter-sort>"),ca=u("<select name=tsqd-mutations-filter-sort>"),ua=u("<span>Asc"),ga=u("<span>Desc"),fa=u('<button aria-label="Open in picture-in-picture mode"title="Open in picture-in-picture mode">'),pa=u("<div>Settings"),ha=u("<span>Position"),ya=u("<span>Top"),ba=u("<span>Bottom"),ma=u("<span>Left"),va=u("<span>Right"),wa=u("<span>Theme"),xa=u("<span>Light"),ka=u("<span>Dark"),$a=u("<span>System"),Sa=u("<span>Disabled Queries"),Ca=u("<span>Show"),Ea=u("<span>Hide"),qa=u("<div><div class=tsqd-queries-container>"),Ma=u("<div><div class=tsqd-mutations-container>"),La=u('<div><div><div><button aria-label="Close Tanstack query devtools"><span>TANSTACK</span><span> v</span></button></div></div><div><div><div><input aria-label="Filter queries by query key"type=text placeholder=Filter name=tsqd-query-filter-input></div><div></div><button class=tsqd-query-filter-sort-order-btn></button></div><div><button aria-label="Clear query cache"></button><button>'),Fa=u("<option>Sort by "),Da=u("<div class=tsqd-query-disabled-indicator>disabled"),Ta=u("<div class=tsqd-query-static-indicator>static"),Aa=u("<button><div></div><code class=tsqd-query-hash>"),Oa=u("<div role=tooltip id=tsqd-status-tooltip>"),Ia=u("<span>"),Pa=u("<button><span></span><span>"),za=u("<button><span></span> Error"),Ka=u('<div><span></span>Trigger Error<select><option value=""disabled selected>'),Ra=u('<div class="tsqd-query-details-explorer-container tsqd-query-details-data-explorer">'),Ba=u("<form><textarea name=data></textarea><div><span></span><div><button type=button>Cancel</button><button>Save"),Ha=u('<div><div>Query Details</div><div><div class=tsqd-query-details-summary><pre><code></code></pre><span></span></div><div class=tsqd-query-details-observers-count><span>Observers:</span><span></span></div><div class=tsqd-query-details-last-updated><span>Last Updated:</span><span></span></div></div><div>Actions</div><div><button><span></span>Refetch</button><button><span></span>Invalidate</button><button><span></span>Reset</button><button><span></span>Remove</button><button><span></span> Loading</button></div><div>Data </div><div>Query Explorer</div><div class="tsqd-query-details-explorer-container tsqd-query-details-query-explorer">'),Ga=u("<option>"),Ua=u('<div><div>Mutation Details</div><div><div class=tsqd-query-details-summary><pre><code></code></pre><span></span></div><div class=tsqd-query-details-last-updated><span>Submitted At:</span><span></span></div></div><div>Variables Details</div><div class="tsqd-query-details-explorer-container tsqd-query-details-query-explorer"></div><div>Context Details</div><div class="tsqd-query-details-explorer-container tsqd-query-details-query-explorer"></div><div>Data Explorer</div><div class="tsqd-query-details-explorer-container tsqd-query-details-query-explorer"></div><div>Mutations Explorer</div><div class="tsqd-query-details-explorer-container tsqd-query-details-query-explorer">'),[Va,ja]=r(null),[Na,Qa]=r(null),[Wa,_a]=r(0),[Xa,Za]=r(!1),Ya=e=>{const t=he(),n=ce().shadowDOMTarget?Be.bind({target:ce().shadowDOMTarget}):Be,r=s(()=>"dark"===t()?ml(n):bl(n)),u=s(()=>ce().onlineManager);o(()=>{const e=u().subscribe(e=>{Za(!e)});m(()=>{e()})});const h=fe(),y=s(()=>ce().buttonPosition||"bottom-right"),b=s(()=>"true"===e.localStore.open||"false"!==e.localStore.open&&(ce().initialIsOpen||false)),v=s(()=>e.localStore.position||ce().position||se);let w;i(()=>{const t=w.parentElement,n=e.localStore.height||500,r=e.localStore.width||500,o=v();t.style.setProperty("--tsqd-panel-height",`${"top"===o?"-":""}${n}px`),t.style.setProperty("--tsqd-panel-width",`${"left"===o?"-":""}${r}px`)}),o(()=>{const e=()=>{const e=w.parentElement,t=getComputedStyle(e).fontSize;e.style.setProperty("--tsqd-font-size",t)};e(),window.addEventListener("focus",e),m(()=>{window.removeEventListener("focus",e)})});const x=s(()=>e.localStore.pip_open??"false");return[a(c,{get when(){return d(()=>!!h().pipWindow)()&&"true"==x()},get children(){return a(l,{get mount(){return h().pipWindow?.document.body},get children(){return a(Ja,{get children(){return a(tl,e)}})}})}}),(k=aa(),"function"==typeof w?S(w,k):w=k,g(k,a(Xe,{name:"tsqd-panel-transition",get children(){return a(c,{get when(){return d(()=>!(!b()||h().pipWindow))()&&"false"==x()},get children(){return a(el,{get localStore(){return e.localStore},get setLocalStore(){return e.setLocalStore}})}})}}),null),g(k,a(Xe,{name:"tsqd-button-transition",get children(){return a(c,{get when(){return!b()},get children(){var t=sa(),n=t.firstChild,o=n.nextSibling;return g(n,a(zs,{})),o.$$click=()=>e.setLocalStore("open","true"),g(o,a(zs,{})),f(()=>p(t,Ge(r().devtoolsBtn,r()[`devtoolsBtn-position-${y()}`],"tsqd-open-btn-container"))),t}})}}),null),f(()=>p(k,Ge(n`
            & .tsqd-panel-transition-exit-active,
            & .tsqd-panel-transition-enter-active {
              transition:
                opacity 0.3s,
                transform 0.3s;
            }

            & .tsqd-panel-transition-exit-to,
            & .tsqd-panel-transition-enter {
              ${"top"===v()||"bottom"===v()?"transform: translateY(var(--tsqd-panel-height));":"transform: translateX(var(--tsqd-panel-width));"}
            }

            & .tsqd-button-transition-exit-active,
            & .tsqd-button-transition-enter-active {
              transition:
                opacity 0.3s,
                transform 0.3s;
              opacity: 1;
            }

            & .tsqd-button-transition-exit-to,
            & .tsqd-button-transition-enter {
              transform: ${"relative"===y()?"none;":"top-left"===y()?"translateX(-72px);":"top-right"===y()?"translateX(72px);":"translateY(72px);"};
              opacity: 0;
            }
          `,"tsqd-transitions-container"))),k)];var k},Ja=e=>{const t=fe(),n=he(),r=ce().shadowDOMTarget?Be.bind({target:ce().shadowDOMTarget}):Be,o=s(()=>"dark"===n()?ml(r):bl(r));return i(()=>{const e=t().pipWindow,n=()=>{e&&_a(e.innerWidth)};e&&(e.addEventListener("resize",n),n()),m(()=>{e&&e.removeEventListener("resize",n)})}),(a=aa()).style.setProperty("--tsqd-font-size","16px"),a.style.setProperty("max-height","100vh"),a.style.setProperty("height","100vh"),a.style.setProperty("width","100vw"),g(a,()=>e.children),f(()=>p(a,Ge(o().panel,(()=>{const{colors:e}=Ui,t=(e,t)=>"dark"===n()?t:e;return Wa()<ie?r`
        flex-direction: column;
        background-color: ${t(e.gray[300],e.gray[600])};
      `:r`
      flex-direction: row;
      background-color: ${t(e.gray[200],e.darkGray[900])};
    `})(),{[r`
            min-width: min-content;
          `]:Wa()<700},"tsqd-main-panel"))),a;var a},el=e=>{const t=he(),n=ce().shadowDOMTarget?Be.bind({target:ce().shadowDOMTarget}):Be,l=s(()=>"dark"===t()?ml(n):bl(n)),[d,c]=r(!1),u=s(()=>e.localStore.position||ce().position||se),h=t=>{const n=t.currentTarget.parentElement;if(!n)return;c(!0);const{height:r,width:o}=n.getBoundingClientRect(),i=t.clientX,s=t.clientY;let a=0;const l=A(3.5),g=A(12),f=t=>{if(t.preventDefault(),"left"===u()||"right"===u()){const r="right"===u()?i-t.clientX:t.clientX-i;a=Math.round(o+r),a<g&&(a=g),e.setLocalStore("width",String(Math.round(a)));const s=n.getBoundingClientRect().width;Number(e.localStore.width)<s&&e.setLocalStore("width",String(s))}else{const n="bottom"===u()?s-t.clientY:t.clientY-s;a=Math.round(r+n),a<l&&(a=l,ja(null)),e.setLocalStore("height",String(Math.round(a)))}},p=()=>{d()&&c(!1),document.removeEventListener("mousemove",f,!1),document.removeEventListener("mouseUp",p,!1)};document.addEventListener("mousemove",f,!1),document.addEventListener("mouseup",p,!1)};let y;o(()=>{tt(y,({width:e},t)=>{t===y&&_a(e)})}),i(()=>{const t=y.parentElement?.parentElement?.parentElement;if(!t)return;const n=e.localStore.position||se,r=$("padding",n),o="left"===e.localStore.position||"right"===e.localStore.position,i=(({padding:e,paddingTop:t,paddingBottom:n,paddingLeft:r,paddingRight:o})=>({padding:e,paddingTop:t,paddingBottom:n,paddingLeft:r,paddingRight:o}))(t.style);t.style[r]=`${o?e.localStore.width:e.localStore.height}px`,m(()=>{Object.entries(i).forEach(([e,n])=>{t.style[e]=n})})});return b=la(),v=b.firstChild,w=v.nextSibling,"function"==typeof y?S(y,b):y=b,v.$$mousedown=h,w.$$click=()=>e.setLocalStore("open","false"),g(w,a(hs,{})),g(b,a(tl,e),null),f(r=>{var o=Ge(l().panel,l()[`panel-position-${u()}`],(()=>{const{colors:e}=Ui,r=(e,n)=>"dark"===t()?n:e;return Wa()<ie?n`
        flex-direction: column;
        background-color: ${r(e.gray[300],e.gray[600])};
      `:n`
      flex-direction: row;
      background-color: ${r(e.gray[200],e.darkGray[900])};
    `})(),{[n`
            min-width: min-content;
          `]:Wa()<700&&("right"===u()||"left"===u())},"tsqd-main-panel"),i="bottom"===u()||"top"===u()?`${e.localStore.height||500}px`:"auto",s="right"===u()||"left"===u()?`${e.localStore.width||500}px`:"auto",a=Ge(l().dragHandle,l()[`dragHandle-position-${u()}`],"tsqd-drag-handle"),d=Ge(l().closeBtn,l()[`closeBtn-position-${u()}`],"tsqd-minimize-btn");return o!==r.e&&p(b,r.e=o),i!==r.t&&(null!=(r.t=i)?b.style.setProperty("height",i):b.style.removeProperty("height")),s!==r.a&&(null!=(r.a=s)?b.style.setProperty("width",s):b.style.removeProperty("width")),a!==r.o&&p(v,r.o=a),d!==r.i&&p(w,r.i=d),r},{e:void 0,t:void 0,a:void 0,o:void 0,i:void 0}),b;var b,v,w},tl=e=>{let t;cl(),fl();const n=he(),o=ce().shadowDOMTarget?Be.bind({target:ce().shadowDOMTarget}):Be,i=s(()=>"dark"===n()?ml(o):bl(o)),l=fe(),[u,h]=r("queries"),y=s(()=>e.localStore.sort||ae),b=s(()=>Number(e.localStore.sortOrder)||1),m=s(()=>e.localStore.mutationSort||le),$=s(()=>Number(e.localStore.mutationSortOrder)||1),C=s(()=>v[y()]),E=s(()=>w[m()]),q=s(()=>ce().onlineManager),M=s(()=>ce().client.getQueryCache()),L=s(()=>ce().client.getMutationCache()),F=ul(e=>e().getAll().length,!1),D=s(x(()=>[F(),e.localStore.filter,y(),b(),e.localStore.hideDisabledQueries],()=>{const t=M().getAll();let n=e.localStore.filter?t.filter(t=>qe(t.queryHash,e.localStore.filter||"").passed):[...t];"true"===e.localStore.hideDisabledQueries&&(n=n.filter(e=>!e.isDisabled()));return C()?n.sort((e,t)=>C()(e,t)*b()):n})),T=pl(e=>e().getAll().length,!1),A=s(x(()=>[T(),e.localStore.mutationFilter,m(),$()],()=>{const t=L().getAll(),n=e.localStore.mutationFilter?t.filter(t=>qe(`${t.options.mutationKey?JSON.stringify(t.options.mutationKey)+" - ":""}${new Date(t.state.submittedAt).toLocaleString()}`,e.localStore.mutationFilter||"").passed):[...t];return E()?n.sort((e,t)=>E()(e,t)*$()):n})),O=t=>{e.setLocalStore("position",t)},I=e=>{const n=getComputedStyle(t).getPropertyValue("--tsqd-font-size");e.style.setProperty("--tsqd-font-size",n)};return[(z=La(),K=z.firstChild,R=K.firstChild,B=R.firstChild,H=B.firstChild,G=H.nextSibling,U=G.firstChild,V=K.nextSibling,j=V.firstChild,N=j.firstChild,Q=N.firstChild,W=N.nextSibling,_=W.nextSibling,X=j.nextSibling,Z=X.firstChild,Y=Z.nextSibling,"function"==typeof t?S(t,z):t=z,B.$$click=()=>{l().pipWindow||e.showPanelViewOnly?e.onClose&&e.onClose():e.setLocalStore("open","false")},g(G,()=>ce().queryFlavor,U),g(G,()=>ce().version,null),g(R,a(ho.Root,{get class(){return Ge(i().viewToggle)},get value(){return u()},onChange:e=>{h(e),ja(null),Qa(null)},get children(){return[a(ho.Item,{value:"queries",class:"tsqd-radio-toggle",get children(){return[a(ho.ItemInput,{}),a(ho.ItemControl,{get children(){return a(ho.ItemIndicator,{})}}),a(ho.ItemLabel,{title:"Toggle Queries View",children:"Queries"})]}}),a(ho.Item,{value:"mutations",class:"tsqd-radio-toggle",get children(){return[a(ho.ItemInput,{}),a(ho.ItemControl,{get children(){return a(ho.ItemIndicator,{})}}),a(ho.ItemLabel,{title:"Toggle Mutations View",children:"Mutations"})]}})]}}),null),g(K,a(c,{get when(){return"queries"===u()},get children(){return a(ol,{})}}),null),g(K,a(c,{get when(){return"mutations"===u()},get children(){return a(il,{})}}),null),g(N,a(fs,{}),Q),Q.$$input=t=>{"queries"===u()?e.setLocalStore("filter",t.currentTarget.value):e.setLocalStore("mutationFilter",t.currentTarget.value)},g(W,a(c,{get when(){return"queries"===u()},get children(){var t=da();return t.addEventListener("change",t=>{e.setLocalStore("sort",t.currentTarget.value)}),g(t,()=>Object.keys(v).map(e=>{return(t=Fa()).value=e,g(t,e,null),t;var t})),f(()=>t.value=y()),t}}),null),g(W,a(c,{get when(){return"mutations"===u()},get children(){var t=ca();return t.addEventListener("change",t=>{e.setLocalStore("mutationSort",t.currentTarget.value)}),g(t,()=>Object.keys(w).map(e=>{return(t=Fa()).value=e,g(t,e,null),t;var t})),f(()=>t.value=m()),t}}),null),g(W,a(hs,{}),null),_.$$click=()=>{"queries"===u()?e.setLocalStore("sortOrder",String(-1*b())):e.setLocalStore("mutationSortOrder",String(-1*$()))},g(_,a(c,{get when(){return 1===("queries"===u()?b():$())},get children(){return[ua(),a(ys,{})]}}),null),g(_,a(c,{get when(){return-1===("queries"===u()?b():$())},get children(){return[ga(),a(bs,{})]}}),null),Z.$$click=()=>{"queries"===u()?(hl({type:"CLEAR_QUERY_CACHE"}),M().clear()):(hl({type:"CLEAR_MUTATION_CACHE"}),L().clear())},g(Z,a(ps,{})),Y.$$click=()=>{q().setOnline(!q().isOnline())},g(Y,(P=d(()=>!!Xa()),()=>P()?a(Ss,{}):a($s,{}))),g(X,a(c,{get when(){return d(()=>!l().pipWindow)()&&!l().disabled},get children(){var t=fa();return t.$$click=()=>{l().requestPipWindow(Number(window.innerWidth),Number(e.localStore.height??500))},g(t,a(Es,{})),f(()=>p(t,Ge(i().actionsBtn,"tsqd-actions-btn","tsqd-action-open-pip"))),t}}),null),g(X,a(Ri.Root,{gutter:4,get children(){return[a(Ri.Trigger,{get class(){return Ge(i().actionsBtn,"tsqd-actions-btn","tsqd-action-settings")},get children(){return a(Cs,{})}}),a(Ri.Portal,{ref:e=>I(e),get mount(){return d(()=>!!l().pipWindow)()?l().pipWindow.document.body:document.body},get children(){return a(Ri.Content,{get class(){return Ge(i().settingsMenu,"tsqd-settings-menu")},get children(){return[(t=pa(),f(()=>p(t,Ge(i().settingsMenuHeader,"tsqd-settings-menu-header"))),t),a(c,{get when(){return!e.showPanelViewOnly},get children(){return a(Ri.Sub,{overlap:!0,gutter:8,shift:-4,get children(){return[a(Ri.SubTrigger,{get class(){return Ge(i().settingsSubTrigger,"tsqd-settings-menu-sub-trigger","tsqd-settings-menu-sub-trigger-position")},get children(){return[ha(),a(hs,{})]}}),a(Ri.Portal,{ref:e=>I(e),get mount(){return d(()=>!!l().pipWindow)()?l().pipWindow.document.body:document.body},get children(){return a(Ri.SubContent,{get class(){return Ge(i().settingsMenu,"tsqd-settings-submenu")},get children(){return[a(Ri.Item,{onSelect:()=>{O("top")},as:"button",get class(){return Ge(i().settingsSubButton,"tsqd-settings-menu-position-btn","tsqd-settings-menu-position-btn-top")},get children(){return[ya(),a(ys,{})]}}),a(Ri.Item,{onSelect:()=>{O("bottom")},as:"button",get class(){return Ge(i().settingsSubButton,"tsqd-settings-menu-position-btn","tsqd-settings-menu-position-btn-bottom")},get children(){return[ba(),a(bs,{})]}}),a(Ri.Item,{onSelect:()=>{O("left")},as:"button",get class(){return Ge(i().settingsSubButton,"tsqd-settings-menu-position-btn","tsqd-settings-menu-position-btn-left")},get children(){return[ma(),a(ms,{})]}}),a(Ri.Item,{onSelect:()=>{O("right")},as:"button",get class(){return Ge(i().settingsSubButton,"tsqd-settings-menu-position-btn","tsqd-settings-menu-position-btn-right")},get children(){return[va(),a(vs,{})]}})]}})}})]}})}}),a(Ri.Sub,{overlap:!0,gutter:8,shift:-4,get children(){return[a(Ri.SubTrigger,{get class(){return Ge(i().settingsSubTrigger,"tsqd-settings-menu-sub-trigger","tsqd-settings-menu-sub-trigger-position")},get children(){return[wa(),a(hs,{})]}}),a(Ri.Portal,{ref:e=>I(e),get mount(){return d(()=>!!l().pipWindow)()?l().pipWindow.document.body:document.body},get children(){return a(Ri.SubContent,{get class(){return Ge(i().settingsMenu,"tsqd-settings-submenu")},get children(){return[a(Ri.Item,{onSelect:()=>{e.setLocalStore("theme_preference","light")},as:"button",get class(){return Ge(i().settingsSubButton,"light"===e.localStore.theme_preference&&i().themeSelectedButton,"tsqd-settings-menu-position-btn","tsqd-settings-menu-position-btn-top")},get children(){return[xa(),a(ws,{})]}}),a(Ri.Item,{onSelect:()=>{e.setLocalStore("theme_preference","dark")},as:"button",get class(){return Ge(i().settingsSubButton,"dark"===e.localStore.theme_preference&&i().themeSelectedButton,"tsqd-settings-menu-position-btn","tsqd-settings-menu-position-btn-bottom")},get children(){return[ka(),a(xs,{})]}}),a(Ri.Item,{onSelect:()=>{e.setLocalStore("theme_preference","system")},as:"button",get class(){return Ge(i().settingsSubButton,"system"===e.localStore.theme_preference&&i().themeSelectedButton,"tsqd-settings-menu-position-btn","tsqd-settings-menu-position-btn-left")},get children(){return[$a(),a(ks,{})]}})]}})}})]}}),a(Ri.Sub,{overlap:!0,gutter:8,shift:-4,get children(){return[a(Ri.SubTrigger,{get class(){return Ge(i().settingsSubTrigger,"tsqd-settings-menu-sub-trigger","tsqd-settings-menu-sub-trigger-disabled-queries")},get children(){return[Sa(),a(hs,{})]}}),a(Ri.Portal,{ref:e=>I(e),get mount(){return d(()=>!!l().pipWindow)()?l().pipWindow.document.body:document.body},get children(){return a(Ri.SubContent,{get class(){return Ge(i().settingsMenu,"tsqd-settings-submenu")},get children(){return[a(Ri.Item,{onSelect:()=>{e.setLocalStore("hideDisabledQueries","false")},as:"button",get class(){return Ge(i().settingsSubButton,"true"!==e.localStore.hideDisabledQueries&&i().themeSelectedButton,"tsqd-settings-menu-position-btn","tsqd-settings-menu-position-btn-show")},get children(){return[Ca(),a(c,{get when(){return"true"!==e.localStore.hideDisabledQueries},get children(){return a(As,{})}})]}}),a(Ri.Item,{onSelect:()=>{e.setLocalStore("hideDisabledQueries","true")},as:"button",get class(){return Ge(i().settingsSubButton,"true"===e.localStore.hideDisabledQueries&&i().themeSelectedButton,"tsqd-settings-menu-position-btn","tsqd-settings-menu-position-btn-hide")},get children(){return[Ea(),a(c,{get when(){return"true"===e.localStore.hideDisabledQueries},get children(){return a(As,{})}})]}})]}})}})]}})];var t}})}})]}}),null),g(z,a(c,{get when(){return"queries"===u()},get children(){var e=qa(),t=e.firstChild;return g(t,a(Je,{by:e=>e.queryHash,get each(){return D()},children:e=>a(nl,{get query(){return e()}})})),f(()=>p(e,Ge(i().overflowQueryContainer,"tsqd-queries-overflow-container"))),e}}),null),g(z,a(c,{get when(){return"mutations"===u()},get children(){var e=Ma(),t=e.firstChild;return g(t,a(Je,{by:e=>e.mutationId,get each(){return A()},children:e=>a(rl,{get mutation(){return e()}})})),f(()=>p(e,Ge(i().overflowQueryContainer,"tsqd-mutations-overflow-container"))),e}}),null),f(e=>{var t=Ge(i().queriesContainer,Wa()<ie&&(Va()||Na())&&o`
              height: 50%;
              max-height: 50%;
            `,Wa()<ie&&!(Va()||Na())&&o`
              height: 100%;
              max-height: 100%;
            `,"tsqd-queries-container"),n=Ge(i().row,"tsqd-header"),r=i().logoAndToggleContainer,s=Ge(i().logo,"tsqd-text-logo-container"),a=Ge(i().tanstackLogo,"tsqd-text-logo-tanstack"),l=Ge(i().queryFlavorLogo,"tsqd-text-logo-query-flavor"),d=Ge(i().row,"tsqd-filters-actions-container"),c=Ge(i().filtersContainer,"tsqd-filters-container"),g=Ge(i().filterInput,"tsqd-query-filter-textfield-container"),f=Ge("tsqd-query-filter-textfield"),h=Ge(i().filterSelect,"tsqd-query-filter-sort-container"),y="Sort order "+(-1===("queries"===u()?b():$())?"descending":"ascending"),m=-1===("queries"===u()?b():$()),v=Ge(i().actionsContainer,"tsqd-actions-container"),w=Ge(i().actionsBtn,"tsqd-actions-btn","tsqd-action-clear-cache"),x=`Clear ${u()} cache`,S=Ge(i().actionsBtn,Xa()&&i().actionsBtnOffline,"tsqd-actions-btn","tsqd-action-mock-offline-behavior"),C=Xa()?"Unset offline mocking behavior":"Mock offline behavior",E=Xa(),q=Xa()?"Unset offline mocking behavior":"Mock offline behavior";return t!==e.e&&p(z,e.e=t),n!==e.t&&p(K,e.t=n),r!==e.a&&p(R,e.a=r),s!==e.o&&p(B,e.o=s),a!==e.i&&p(H,e.i=a),l!==e.n&&p(G,e.n=l),d!==e.s&&p(V,e.s=d),c!==e.h&&p(j,e.h=c),g!==e.r&&p(N,e.r=g),f!==e.d&&p(Q,e.d=f),h!==e.l&&p(W,e.l=h),y!==e.u&&k(_,"aria-label",e.u=y),m!==e.c&&k(_,"aria-pressed",e.c=m),v!==e.w&&p(X,e.w=v),w!==e.m&&p(Z,e.m=w),x!==e.f&&k(Z,"title",e.f=x),S!==e.y&&p(Y,e.y=S),C!==e.g&&k(Y,"aria-label",e.g=C),E!==e.p&&k(Y,"aria-pressed",e.p=E),q!==e.b&&k(Y,"title",e.b=q),e},{e:void 0,t:void 0,a:void 0,o:void 0,i:void 0,n:void 0,s:void 0,h:void 0,r:void 0,d:void 0,l:void 0,u:void 0,c:void 0,w:void 0,m:void 0,f:void 0,y:void 0,g:void 0,p:void 0,b:void 0}),f(()=>Q.value="queries"===u()?e.localStore.filter||"":e.localStore.mutationFilter||""),z),a(c,{get when(){return d(()=>"queries"===u())()&&Va()},get children(){return a(al,{})}}),a(c,{get when(){return d(()=>"mutations"===u())()&&Na()},get children(){return a(ll,{})}})];var P,z,K,R,B,H,G,U,V,j,N,Q,W,_,X,Z,Y},nl=e=>{const t=he(),n=ce().shadowDOMTarget?Be.bind({target:ce().shadowDOMTarget}):Be,r=s(()=>"dark"===t()?ml(n):bl(n)),{colors:o,alpha:i}=Ui,l=(e,n)=>"dark"===t()?n:e,d=ul(t=>t().find({queryKey:e.query.queryKey})?.state,!0,t=>t.query.queryHash===e.query.queryHash),u=ul(t=>t().find({queryKey:e.query.queryKey})?.isDisabled()??!1,!0,t=>t.query.queryHash===e.query.queryHash),h=ul(t=>t().find({queryKey:e.query.queryKey})?.isStatic()??!1,!0,t=>t.query.queryHash===e.query.queryHash),y=ul(t=>t().find({queryKey:e.query.queryKey})?.isStale()??!1,!0,t=>t.query.queryHash===e.query.queryHash),b=ul(t=>t().find({queryKey:e.query.queryKey})?.getObserversCount()??0,!0,t=>t.query.queryHash===e.query.queryHash),m=s(()=>L({queryState:d(),observerCount:b(),isStale:y()}));return a(c,{get when(){return d()},get children(){var t=Aa(),s=t.firstChild,d=s.nextSibling;return t.$$click=()=>ja(e.query.queryHash===Va()?null:e.query.queryHash),g(s,b),g(d,()=>e.query.queryHash),g(t,a(c,{get when(){return u()},get children(){return Da()}}),null),g(t,a(c,{get when(){return h()},get children(){return Ta()}}),null),f(a=>{var d=Ge(r().queryRow,Va()===e.query.queryHash&&r().selectedQueryRow,"tsqd-query-row"),c=`Query key ${e.query.queryHash}`,u=Ge("gray"===m()?n`
        background-color: ${l(o[m()][200],o[m()][700])};
        color: ${l(o[m()][700],o[m()][300])};
      `:n`
      background-color: ${l(o[m()][200]+i[80],o[m()][900])};
      color: ${l(o[m()][800],o[m()][300])};
    `,"tsqd-query-observer-count");return d!==a.e&&p(t,a.e=d),c!==a.t&&k(t,"aria-label",a.t=c),u!==a.a&&p(s,a.a=u),a},{e:void 0,t:void 0,a:void 0}),t}})},rl=e=>{const t=he(),n=ce().shadowDOMTarget?Be.bind({target:ce().shadowDOMTarget}):Be,r=s(()=>"dark"===t()?ml(n):bl(n)),{colors:o,alpha:i}=Ui,l=(e,n)=>"dark"===t()?n:e,u=pl(t=>{const n=t().getAll().find(t=>t.mutationId===e.mutation.mutationId);return n?.state}),h=pl(t=>{const n=t().getAll().find(t=>t.mutationId===e.mutation.mutationId);return!!n&&n.state.isPaused}),y=pl(t=>{const n=t().getAll().find(t=>t.mutationId===e.mutation.mutationId);return n?n.state.status:"idle"}),b=s(()=>M({isPaused:h(),status:y()}));return a(c,{get when(){return u()},get children(){var t=Aa(),s=t.firstChild,u=s.nextSibling;return t.$$click=()=>{Qa(e.mutation.mutationId===Na()?null:e.mutation.mutationId)},g(s,a(c,{get when(){return"purple"===b()},get children(){return a(Ps,{})}}),null),g(s,a(c,{get when(){return"green"===b()},get children(){return a(As,{})}}),null),g(s,a(c,{get when(){return"red"===b()},get children(){return a(Is,{})}}),null),g(s,a(c,{get when(){return"yellow"===b()},get children(){return a(Os,{})}}),null),g(u,a(c,{get when(){return e.mutation.options.mutationKey},get children(){return[d(()=>JSON.stringify(e.mutation.options.mutationKey))," -"," "]}}),null),g(u,()=>new Date(e.mutation.state.submittedAt).toLocaleString(),null),f(a=>{var d=Ge(r().queryRow,Na()===e.mutation.mutationId&&r().selectedQueryRow,"tsqd-query-row"),c=`Mutation submitted at ${new Date(e.mutation.state.submittedAt).toLocaleString()}`,u=Ge("gray"===b()?n`
        background-color: ${l(o[b()][200],o[b()][700])};
        color: ${l(o[b()][700],o[b()][300])};
      `:n`
      background-color: ${l(o[b()][200]+i[80],o[b()][900])};
      color: ${l(o[b()][800],o[b()][300])};
    `,"tsqd-query-observer-count");return d!==a.e&&p(t,a.e=d),c!==a.t&&k(t,"aria-label",a.t=c),u!==a.a&&p(s,a.a=u),a},{e:void 0,t:void 0,a:void 0}),t}})},ol=()=>{const e=ul(e=>e().getAll().filter(e=>"stale"===q(e)).length),t=ul(e=>e().getAll().filter(e=>"fresh"===q(e)).length),n=ul(e=>e().getAll().filter(e=>"fetching"===q(e)).length),r=ul(e=>e().getAll().filter(e=>"paused"===q(e)).length),o=ul(e=>e().getAll().filter(e=>"inactive"===q(e)).length),i=he(),l=ce().shadowDOMTarget?Be.bind({target:ce().shadowDOMTarget}):Be,d=s(()=>"dark"===i()?ml(l):bl(l));return c=aa(),g(c,a(sl,{label:"Fresh",color:"green",get count(){return t()}}),null),g(c,a(sl,{label:"Fetching",color:"blue",get count(){return n()}}),null),g(c,a(sl,{label:"Paused",color:"purple",get count(){return r()}}),null),g(c,a(sl,{label:"Stale",color:"yellow",get count(){return e()}}),null),g(c,a(sl,{label:"Inactive",color:"gray",get count(){return o()}}),null),f(()=>p(c,Ge(d().queryStatusContainer,"tsqd-query-status-container"))),c;var c},il=()=>{const e=pl(e=>e().getAll().filter(e=>"green"===M({isPaused:e.state.isPaused,status:e.state.status})).length),t=pl(e=>e().getAll().filter(e=>"yellow"===M({isPaused:e.state.isPaused,status:e.state.status})).length),n=pl(e=>e().getAll().filter(e=>"purple"===M({isPaused:e.state.isPaused,status:e.state.status})).length),r=pl(e=>e().getAll().filter(e=>"red"===M({isPaused:e.state.isPaused,status:e.state.status})).length),o=he(),i=ce().shadowDOMTarget?Be.bind({target:ce().shadowDOMTarget}):Be,l=s(()=>"dark"===o()?ml(i):bl(i));return d=aa(),g(d,a(sl,{label:"Paused",color:"purple",get count(){return n()}}),null),g(d,a(sl,{label:"Pending",color:"yellow",get count(){return t()}}),null),g(d,a(sl,{label:"Success",color:"green",get count(){return e()}}),null),g(d,a(sl,{label:"Error",color:"red",get count(){return r()}}),null),f(()=>p(d,Ge(l().queryStatusContainer,"tsqd-query-status-container"))),d;var d},sl=e=>{const t=he(),n=ce().shadowDOMTarget?Be.bind({target:ce().shadowDOMTarget}):Be,o=s(()=>"dark"===t()?ml(n):bl(n)),{colors:i,alpha:l}=Ui,u=(e,n)=>"dark"===t()?n:e;let h;const[y,b]=r(!1),[m,v]=r(!1),w=s(()=>!(Va()&&Wa()<1024&&Wa()>ie)&&!(Wa()<ie));return x=Pa(),k=x.firstChild,$=k.nextSibling,"function"==typeof h?S(h,x):h=x,x.addEventListener("mouseleave",()=>{b(!1),v(!1)}),x.addEventListener("mouseenter",()=>b(!0)),x.addEventListener("blur",()=>v(!1)),x.addEventListener("focus",()=>v(!0)),P(x,z({get disabled(){return w()},get class(){return Ge(o().queryStatusTag,!w()&&n`
            cursor: pointer;
            &:hover {
              background: ${u(i.gray[200],i.darkGray[400])}${l[80]};
            }
          `,"tsqd-query-status-tag",`tsqd-query-status-tag-${e.label.toLowerCase()}`)}},()=>y()||m()?{"aria-describedby":"tsqd-status-tooltip"}:{}),!1,!0),g(x,a(c,{get when(){return d(()=>!w())()&&(y()||m())},get children(){var t=Oa();return g(t,()=>e.label),f(()=>p(t,Ge(o().statusTooltip,"tsqd-query-status-tooltip"))),t}}),k),g(x,a(c,{get when(){return w()},get children(){var t=Ia();return g(t,()=>e.label),f(()=>p(t,Ge(o().queryStatusTagLabel,"tsqd-query-status-tag-label"))),t}}),$),g($,()=>e.count),f(t=>{var r=Ge(n`
            width: ${Ui.size[1.5]};
            height: ${Ui.size[1.5]};
            border-radius: ${Ui.border.radius.full};
            background-color: ${Ui.colors[e.color][500]};
          `,"tsqd-query-status-tag-dot"),s=Ge(o().queryStatusCount,e.count>0&&"gray"!==e.color&&n`
              background-color: ${u(i[e.color][100],i[e.color][900])};
              color: ${u(i[e.color][700],i[e.color][300])};
            `,"tsqd-query-status-tag-count");return r!==t.e&&p(k,t.e=r),s!==t.t&&p($,t.t=s),t},{e:void 0,t:void 0}),x;var x,k,$},al=()=>{const e=he(),t=ce().shadowDOMTarget?Be.bind({target:ce().shadowDOMTarget}):Be,n=s(()=>"dark"===e()?ml(t):bl(t)),{colors:o}=Ui,l=(t,n)=>"dark"===e()?n:t,u=ce().client,[h,y]=r(!1),[b,m]=r("view"),[v,w]=r(!1),x=s(()=>ce().errorTypes||[]),$=ul(e=>e().getAll().find(e=>e.queryHash===Va()),!1),S=ul(e=>e().getAll().find(e=>e.queryHash===Va()),!1),C=ul(e=>e().getAll().find(e=>e.queryHash===Va())?.state,!1),E=ul(e=>e().getAll().find(e=>e.queryHash===Va())?.state.data,!1),M=ul(e=>{const t=e().getAll().find(e=>e.queryHash===Va());return t?q(t):"inactive"}),L=ul(e=>{const t=e().getAll().find(e=>e.queryHash===Va());return t?t.state.status:"pending"}),A=ul(e=>e().getAll().find(e=>e.queryHash===Va())?.getObserversCount()??0),O=s(()=>F(M())),I=()=>{hl({type:"REFETCH",queryHash:$()?.queryHash});const e=$()?.fetch();e?.catch(()=>{})},P=e=>{const t=$();if(!t)return;hl({type:"TRIGGER_ERROR",queryHash:t.queryHash,metadata:{error:e?.name}});const n=e?.initializer(t)??new Error("Unknown error from devtools"),r=t.options;t.setState({status:"error",error:n,fetchMeta:{...t.state.fetchMeta,__previousQueryOptions:r}})};i(()=>{"fetching"!==M()&&y(!1)});return a(c,{get when(){return d(()=>!!$())()&&C()},get children(){var e=Ha(),r=e.firstChild,i=r.nextSibling,s=i.firstChild,d=s.firstChild,q=d.firstChild,F=d.nextSibling,z=s.nextSibling,K=z.firstChild.nextSibling,R=z.nextSibling.firstChild.nextSibling,B=i.nextSibling,H=B.nextSibling,G=H.firstChild,U=G.firstChild,V=G.nextSibling,j=V.firstChild,N=V.nextSibling,Q=N.firstChild,W=N.nextSibling,_=W.firstChild,X=W.nextSibling,Z=X.firstChild,Y=Z.nextSibling,J=H.nextSibling,ee=J.nextSibling,te=ee.nextSibling;return g(q,()=>D($().queryKey,!0)),g(F,M),g(K,A),g(R,()=>new Date(C().dataUpdatedAt).toLocaleTimeString()),G.$$click=I,V.$$click=()=>{hl({type:"INVALIDATE",queryHash:$()?.queryHash}),u.invalidateQueries($())},N.$$click=()=>{hl({type:"RESET",queryHash:$()?.queryHash}),u.resetQueries($())},W.$$click=()=>{hl({type:"REMOVE",queryHash:$()?.queryHash}),u.removeQueries($()),ja(null)},X.$$click=()=>{if(void 0===$()?.state.data)y(!0),(()=>{const e=$();if(!e)return;hl({type:"RESTORE_LOADING",queryHash:e.queryHash});const t=e.state,n=e.state.fetchMeta?e.state.fetchMeta.__previousQueryOptions:null;e.cancel({silent:!0}),e.setState({...t,fetchStatus:"idle",fetchMeta:null}),n&&e.fetch(n)})();else{const e=$();if(!e)return;hl({type:"TRIGGER_LOADING",queryHash:e.queryHash});const t=e.options;e.fetch({...t,queryFn:()=>new Promise(()=>{}),gcTime:-1}),e.setState({data:void 0,status:"pending",fetchMeta:{...e.state.fetchMeta,__previousQueryOptions:t}})}},g(X,()=>"pending"===L()?"Restore":"Trigger",Y),g(H,a(c,{get when(){return 0===x().length||"error"===L()},get children(){var e=za(),n=e.firstChild,r=n.nextSibling;return e.$$click=()=>{$().state.error?(hl({type:"RESTORE_ERROR",queryHash:$()?.queryHash}),u.resetQueries($())):P()},g(e,()=>"error"===L()?"Restore":"Trigger",r),f(r=>{var i=Ge(t`
                  color: ${l(o.red[500],o.red[400])};
                `,"tsqd-query-details-actions-btn","tsqd-query-details-action-error"),s="pending"===L(),a=t`
                  background-color: ${l(o.red[500],o.red[400])};
                `;return i!==r.e&&p(e,r.e=i),s!==r.t&&(e.disabled=r.t=s),a!==r.a&&p(n,r.a=a),r},{e:void 0,t:void 0,a:void 0}),e}}),null),g(H,a(c,{get when(){return!(0===x().length||"error"===L())},get children(){var e=Ka(),r=e.firstChild,o=r.nextSibling.nextSibling;return o.addEventListener("change",e=>{const t=x().find(t=>t.name===e.currentTarget.value);P(t)}),g(o,a(T,{get each(){return x()},children:e=>{return t=Ga(),g(t,()=>e.name),f(()=>t.value=e.name),t;var t}}),null),g(e,a(hs,{}),null),f(i=>{var s=Ge(n().actionsSelect,"tsqd-query-details-actions-btn","tsqd-query-details-action-error-multiple"),a=t`
                  background-color: ${Ui.colors.red[400]};
                `,l="pending"===L();return s!==i.e&&p(e,i.e=s),a!==i.t&&p(r,i.t=a),l!==i.a&&(o.disabled=i.a=l),i},{e:void 0,t:void 0,a:void 0}),e}}),null),g(J,()=>"view"===b()?"Explorer":"Editor",null),g(e,a(c,{get when(){return"view"===b()},get children(){var e=Ra();return g(e,a(na,{label:"Data",defaultExpanded:["Data"],get value(){return E()},editable:!0,onEdit:()=>m("edit"),get activeQuery(){return $()}})),f(t=>null!=(t=Ui.size[2])?e.style.setProperty("padding",t):e.style.removeProperty("padding")),e}}),ee),g(e,a(c,{get when(){return"edit"===b()},get children(){var e=Ba(),r=e.firstChild,i=r.nextSibling,s=i.firstChild,a=s.nextSibling,d=a.firstChild,c=d.nextSibling;return e.addEventListener("submit",e=>{e.preventDefault();const t=new FormData(e.currentTarget).get("data");try{const e=JSON.parse(t);$().setState({...$().state,data:e}),m("view")}catch(n){w(!0)}}),r.addEventListener("focus",()=>w(!1)),g(s,()=>v()?"Invalid Value":""),d.$$click=()=>m("view"),f(u=>{var g=Ge(n().devtoolsEditForm,"tsqd-query-details-data-editor"),f=n().devtoolsEditTextarea,h=v(),y=n().devtoolsEditFormActions,b=n().devtoolsEditFormError,m=n().devtoolsEditFormActionContainer,w=Ge(n().devtoolsEditFormAction,t`
                      color: ${l(o.gray[600],o.gray[300])};
                    `),x=Ge(n().devtoolsEditFormAction,t`
                      color: ${l(o.blue[600],o.blue[400])};
                    `);return g!==u.e&&p(e,u.e=g),f!==u.t&&p(r,u.t=f),h!==u.a&&k(r,"data-error",u.a=h),y!==u.o&&p(i,u.o=y),b!==u.i&&p(s,u.i=b),m!==u.n&&p(a,u.n=m),w!==u.s&&p(d,u.s=w),x!==u.h&&p(c,u.h=x),u},{e:void 0,t:void 0,a:void 0,o:void 0,i:void 0,n:void 0,s:void 0,h:void 0}),f(()=>r.value=JSON.stringify(E(),null,2)),e}}),ee),g(te,a(na,{label:"Query",defaultExpanded:["Query","queryKey"],get value(){return S()}})),f(s=>{var a=Ge(n().detailsContainer,"tsqd-query-details-container"),d=Ge(n().detailsHeader,"tsqd-query-details-header"),c=Ge(n().detailsBody,"tsqd-query-details-summary-container"),u=Ge(n().queryDetailsStatus,"gray"===O()?t`
        background-color: ${l(o[O()][200],o[O()][700])};
        color: ${l(o[O()][700],o[O()][300])};
        border-color: ${l(o[O()][400],o[O()][600])};
      `:t`
      background-color: ${l(o[O()][100],o[O()][900])};
      color: ${l(o[O()][700],o[O()][300])};
      border-color: ${l(o[O()][400],o[O()][600])};
    `),g=Ge(n().detailsHeader,"tsqd-query-details-header"),f=Ge(n().actionsBody,"tsqd-query-details-actions-container"),y=Ge(t`
                color: ${l(o.blue[600],o.blue[400])};
              `,"tsqd-query-details-actions-btn","tsqd-query-details-action-refetch"),b="fetching"===M(),m=t`
                background-color: ${l(o.blue[600],o.blue[400])};
              `,v=Ge(t`
                color: ${l(o.yellow[600],o.yellow[400])};
              `,"tsqd-query-details-actions-btn","tsqd-query-details-action-invalidate"),w="pending"===L(),x=t`
                background-color: ${l(o.yellow[600],o.yellow[400])};
              `,k=Ge(t`
                color: ${l(o.gray[600],o.gray[300])};
              `,"tsqd-query-details-actions-btn","tsqd-query-details-action-reset"),$="pending"===L(),S=t`
                background-color: ${l(o.gray[600],o.gray[400])};
              `,C=Ge(t`
                color: ${l(o.pink[500],o.pink[400])};
              `,"tsqd-query-details-actions-btn","tsqd-query-details-action-remove"),E="fetching"===M(),q=t`
                background-color: ${l(o.pink[500],o.pink[400])};
              `,D=Ge(t`
                color: ${l(o.cyan[500],o.cyan[400])};
              `,"tsqd-query-details-actions-btn","tsqd-query-details-action-loading"),T=h(),A=t`
                background-color: ${l(o.cyan[500],o.cyan[400])};
              `,I=Ge(n().detailsHeader,"tsqd-query-details-header"),P=Ge(n().detailsHeader,"tsqd-query-details-header"),z=Ui.size[2];return a!==s.e&&p(e,s.e=a),d!==s.t&&p(r,s.t=d),c!==s.a&&p(i,s.a=c),u!==s.o&&p(F,s.o=u),g!==s.i&&p(B,s.i=g),f!==s.n&&p(H,s.n=f),y!==s.s&&p(G,s.s=y),b!==s.h&&(G.disabled=s.h=b),m!==s.r&&p(U,s.r=m),v!==s.d&&p(V,s.d=v),w!==s.l&&(V.disabled=s.l=w),x!==s.u&&p(j,s.u=x),k!==s.c&&p(N,s.c=k),$!==s.w&&(N.disabled=s.w=$),S!==s.m&&p(Q,s.m=S),C!==s.f&&p(W,s.f=C),E!==s.y&&(W.disabled=s.y=E),q!==s.g&&p(_,s.g=q),D!==s.p&&p(X,s.p=D),T!==s.b&&(X.disabled=s.b=T),A!==s.T&&p(Z,s.T=A),I!==s.A&&p(J,s.A=I),P!==s.O&&p(ee,s.O=P),z!==s.I&&(null!=(s.I=z)?te.style.setProperty("padding",z):te.style.removeProperty("padding")),s},{e:void 0,t:void 0,a:void 0,o:void 0,i:void 0,n:void 0,s:void 0,h:void 0,r:void 0,d:void 0,l:void 0,u:void 0,c:void 0,w:void 0,m:void 0,f:void 0,y:void 0,g:void 0,p:void 0,b:void 0,T:void 0,A:void 0,O:void 0,I:void 0}),e}})},ll=()=>{const e=he(),t=ce().shadowDOMTarget?Be.bind({target:ce().shadowDOMTarget}):Be,n=s(()=>"dark"===e()?ml(t):bl(t)),{colors:r}=Ui,o=(t,n)=>"dark"===e()?n:t,i=pl(e=>{const t=e().getAll().find(e=>e.mutationId===Na());return!!t&&t.state.isPaused}),l=pl(e=>{const t=e().getAll().find(e=>e.mutationId===Na());return t?t.state.status:"idle"}),d=s(()=>M({isPaused:i(),status:l()})),u=pl(e=>e().getAll().find(e=>e.mutationId===Na()),!1);return a(c,{get when(){return u()},get children(){var e=Ua(),i=e.firstChild,s=i.nextSibling,h=s.firstChild,y=h.firstChild,b=y.firstChild,m=y.nextSibling,v=h.nextSibling.firstChild.nextSibling,w=s.nextSibling,x=w.nextSibling,k=x.nextSibling,$=k.nextSibling,S=$.nextSibling,C=S.nextSibling,E=C.nextSibling,q=E.nextSibling;return g(b,a(c,{get when(){return u().options.mutationKey},fallback:"No mutationKey found",get children(){return D(u().options.mutationKey,!0)}})),g(m,a(c,{get when(){return"purple"===d()},children:"pending"}),null),g(m,a(c,{get when(){return"purple"!==d()},get children(){return l()}}),null),g(v,()=>new Date(u().state.submittedAt).toLocaleTimeString()),g(x,a(na,{label:"Variables",defaultExpanded:["Variables"],get value(){return u().state.variables}})),g($,a(na,{label:"Context",defaultExpanded:["Context"],get value(){return u().state.context}})),g(C,a(na,{label:"Data",defaultExpanded:["Data"],get value(){return u().state.data}})),g(q,a(na,{label:"Mutation",defaultExpanded:["Mutation"],get value(){return u()}})),f(a=>{var l=Ge(n().detailsContainer,"tsqd-query-details-container"),c=Ge(n().detailsHeader,"tsqd-query-details-header"),u=Ge(n().detailsBody,"tsqd-query-details-summary-container"),g=Ge(n().queryDetailsStatus,"gray"===d()?t`
        background-color: ${o(r[d()][200],r[d()][700])};
        color: ${o(r[d()][700],r[d()][300])};
        border-color: ${o(r[d()][400],r[d()][600])};
      `:t`
      background-color: ${o(r[d()][100],r[d()][900])};
      color: ${o(r[d()][700],r[d()][300])};
      border-color: ${o(r[d()][400],r[d()][600])};
    `),f=Ge(n().detailsHeader,"tsqd-query-details-header"),h=Ui.size[2],y=Ge(n().detailsHeader,"tsqd-query-details-header"),b=Ui.size[2],v=Ge(n().detailsHeader,"tsqd-query-details-header"),M=Ui.size[2],L=Ge(n().detailsHeader,"tsqd-query-details-header"),F=Ui.size[2];return l!==a.e&&p(e,a.e=l),c!==a.t&&p(i,a.t=c),u!==a.a&&p(s,a.a=u),g!==a.o&&p(m,a.o=g),f!==a.i&&p(w,a.i=f),h!==a.n&&(null!=(a.n=h)?x.style.setProperty("padding",h):x.style.removeProperty("padding")),y!==a.s&&p(k,a.s=y),b!==a.h&&(null!=(a.h=b)?$.style.setProperty("padding",b):$.style.removeProperty("padding")),v!==a.r&&p(S,a.r=v),M!==a.d&&(null!=(a.d=M)?C.style.setProperty("padding",M):C.style.removeProperty("padding")),L!==a.l&&p(E,a.l=L),F!==a.u&&(null!=(a.u=F)?q.style.setProperty("padding",F):q.style.removeProperty("padding")),a},{e:void 0,t:void 0,a:void 0,o:void 0,i:void 0,n:void 0,s:void 0,h:void 0,r:void 0,d:void 0,l:void 0,u:void 0}),e}})},dl=new Map,cl=()=>{const e=s(()=>ce().client.getQueryCache()),t=e().subscribe(t=>{E(()=>{for(const[n,r]of dl.entries())r.shouldUpdate(t)&&r.setter(n(e))})});return m(()=>{dl.clear(),t()}),t},ul=(e,t=!0,n=()=>!0)=>{const o=s(()=>ce().client.getQueryCache()),[a,l]=r(e(o),t?void 0:{equals:!1});return i(()=>{l(e(o))}),dl.set(e,{setter:l,shouldUpdate:n}),m(()=>{dl.delete(e)}),a},gl=new Map,fl=()=>{const e=s(()=>ce().client.getMutationCache()),t=e().subscribe(()=>{for(const[t,n]of gl.entries())queueMicrotask(()=>{n(t(e))})});return m(()=>{gl.clear(),t()}),t},pl=(e,t=!0)=>{const n=s(()=>ce().client.getMutationCache()),[o,a]=r(e(n),t?void 0:{equals:!1});return i(()=>{a(e(n))}),gl.set(e,a),m(()=>{gl.delete(e)}),o},hl=({type:e,queryHash:t,metadata:n})=>{const r=new CustomEvent("@tanstack/query-devtools-event",{detail:{type:e,queryHash:t,metadata:n},bubbles:!0,cancelable:!0});window.dispatchEvent(r)},yl=(e,t)=>{const{colors:n,font:r,size:o,alpha:i,shadow:s,border:a}=Ui,l=(t,n)=>"light"===e?t:n;return{devtoolsBtn:t`
      z-index: 100000;
      position: fixed;
      padding: 4px;
      text-align: left;

      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 9999px;
      box-shadow: ${s.md()};
      overflow: hidden;

      & div {
        position: absolute;
        top: -8px;
        left: -8px;
        right: -8px;
        bottom: -8px;
        border-radius: 9999px;

        & svg {
          position: absolute;
          width: 100%;
          height: 100%;
        }
        filter: blur(6px) saturate(1.2) contrast(1.1);
      }

      &:focus-within {
        outline-offset: 2px;
        outline: 3px solid ${n.green[600]};
      }

      & button {
        position: relative;
        z-index: 1;
        padding: 0;
        border-radius: 9999px;
        background-color: transparent;
        border: none;
        height: 40px;
        display: flex;
        width: 40px;
        overflow: hidden;
        cursor: pointer;
        outline: none;
        & svg {
          position: absolute;
          width: 100%;
          height: 100%;
        }
      }
    `,panel:t`
      position: fixed;
      z-index: 9999;
      display: flex;
      gap: ${Ui.size[.5]};
      & * {
        box-sizing: border-box;
        text-transform: none;
      }

      & *::-webkit-scrollbar {
        width: 7px;
      }

      & *::-webkit-scrollbar-track {
        background: transparent;
      }

      & *::-webkit-scrollbar-thumb {
        background: ${l(n.gray[300],n.darkGray[200])};
      }

      & *::-webkit-scrollbar-thumb:hover {
        background: ${l(n.gray[400],n.darkGray[300])};
      }
    `,parentPanel:t`
      z-index: 9999;
      display: flex;
      height: 100%;
      gap: ${Ui.size[.5]};
      & * {
        box-sizing: border-box;
        text-transform: none;
      }

      & *::-webkit-scrollbar {
        width: 7px;
      }

      & *::-webkit-scrollbar-track {
        background: transparent;
      }

      & *::-webkit-scrollbar-thumb {
        background: ${l(n.gray[300],n.darkGray[200])};
      }

      & *::-webkit-scrollbar-thumb:hover {
        background: ${l(n.gray[400],n.darkGray[300])};
      }
    `,"devtoolsBtn-position-bottom-right":t`
      bottom: 12px;
      right: 12px;
    `,"devtoolsBtn-position-bottom-left":t`
      bottom: 12px;
      left: 12px;
    `,"devtoolsBtn-position-top-left":t`
      top: 12px;
      left: 12px;
    `,"devtoolsBtn-position-top-right":t`
      top: 12px;
      right: 12px;
    `,"devtoolsBtn-position-relative":t`
      position: relative;
    `,"panel-position-top":t`
      top: 0;
      right: 0;
      left: 0;
      max-height: 90%;
      min-height: ${o[14]};
      border-bottom: ${l(n.gray[400],n.darkGray[300])} 1px solid;
    `,"panel-position-bottom":t`
      bottom: 0;
      right: 0;
      left: 0;
      max-height: 90%;
      min-height: ${o[14]};
      border-top: ${l(n.gray[400],n.darkGray[300])} 1px solid;
    `,"panel-position-right":t`
      bottom: 0;
      right: 0;
      top: 0;
      border-left: ${l(n.gray[400],n.darkGray[300])} 1px solid;
      max-width: 90%;
    `,"panel-position-left":t`
      bottom: 0;
      left: 0;
      top: 0;
      border-right: ${l(n.gray[400],n.darkGray[300])} 1px solid;
      max-width: 90%;
    `,closeBtn:t`
      position: absolute;
      cursor: pointer;
      z-index: 5;
      display: flex;
      align-items: center;
      justify-content: center;
      outline: none;
      background-color: ${l(n.gray[50],n.darkGray[700])};
      &:hover {
        background-color: ${l(n.gray[200],n.darkGray[500])};
      }
      &:focus-visible {
        outline: 2px solid ${n.blue[600]};
      }
      & svg {
        color: ${l(n.gray[600],n.gray[400])};
        width: ${o[2]};
        height: ${o[2]};
      }
    `,"closeBtn-position-top":t`
      bottom: 0;
      right: ${o[2]};
      transform: translate(0, 100%);
      border-right: ${l(n.gray[400],n.darkGray[300])} 1px solid;
      border-left: ${l(n.gray[400],n.darkGray[300])} 1px solid;
      border-top: none;
      border-bottom: ${l(n.gray[400],n.darkGray[300])} 1px solid;
      border-radius: 0px 0px ${a.radius.sm} ${a.radius.sm};
      padding: ${o[.5]} ${o[1.5]} ${o[1]} ${o[1.5]};

      &::after {
        content: ' ';
        position: absolute;
        bottom: 100%;
        left: -${o[2.5]};
        height: ${o[1.5]};
        width: calc(100% + ${o[5]});
      }

      & svg {
        transform: rotate(180deg);
      }
    `,"closeBtn-position-bottom":t`
      top: 0;
      right: ${o[2]};
      transform: translate(0, -100%);
      border-right: ${l(n.gray[400],n.darkGray[300])} 1px solid;
      border-left: ${l(n.gray[400],n.darkGray[300])} 1px solid;
      border-top: ${l(n.gray[400],n.darkGray[300])} 1px solid;
      border-bottom: none;
      border-radius: ${a.radius.sm} ${a.radius.sm} 0px 0px;
      padding: ${o[1]} ${o[1.5]} ${o[.5]} ${o[1.5]};

      &::after {
        content: ' ';
        position: absolute;
        top: 100%;
        left: -${o[2.5]};
        height: ${o[1.5]};
        width: calc(100% + ${o[5]});
      }
    `,"closeBtn-position-right":t`
      bottom: ${o[2]};
      left: 0;
      transform: translate(-100%, 0);
      border-right: none;
      border-left: ${l(n.gray[400],n.darkGray[300])} 1px solid;
      border-top: ${l(n.gray[400],n.darkGray[300])} 1px solid;
      border-bottom: ${l(n.gray[400],n.darkGray[300])} 1px solid;
      border-radius: ${a.radius.sm} 0px 0px ${a.radius.sm};
      padding: ${o[1.5]} ${o[.5]} ${o[1.5]} ${o[1]};

      &::after {
        content: ' ';
        position: absolute;
        left: 100%;
        height: calc(100% + ${o[5]});
        width: ${o[1.5]};
      }

      & svg {
        transform: rotate(-90deg);
      }
    `,"closeBtn-position-left":t`
      bottom: ${o[2]};
      right: 0;
      transform: translate(100%, 0);
      border-left: none;
      border-right: ${l(n.gray[400],n.darkGray[300])} 1px solid;
      border-top: ${l(n.gray[400],n.darkGray[300])} 1px solid;
      border-bottom: ${l(n.gray[400],n.darkGray[300])} 1px solid;
      border-radius: 0px ${a.radius.sm} ${a.radius.sm} 0px;
      padding: ${o[1.5]} ${o[1]} ${o[1.5]} ${o[.5]};

      &::after {
        content: ' ';
        position: absolute;
        right: 100%;
        height: calc(100% + ${o[5]});
        width: ${o[1.5]};
      }

      & svg {
        transform: rotate(90deg);
      }
    `,queriesContainer:t`
      flex: 1 1 700px;
      background-color: ${l(n.gray[50],n.darkGray[700])};
      display: flex;
      flex-direction: column;
      & * {
        font-family: ui-sans-serif, Inter, system-ui, sans-serif, sans-serif;
      }
    `,dragHandle:t`
      position: absolute;
      transition: background-color 0.125s ease;
      &:hover {
        background-color: ${n.purple[400]}${l("",i[90])};
      }
      z-index: 4;
    `,"dragHandle-position-top":t`
      bottom: 0;
      width: 100%;
      height: 3px;
      cursor: ns-resize;
    `,"dragHandle-position-bottom":t`
      top: 0;
      width: 100%;
      height: 3px;
      cursor: ns-resize;
    `,"dragHandle-position-right":t`
      left: 0;
      width: 3px;
      height: 100%;
      cursor: ew-resize;
    `,"dragHandle-position-left":t`
      right: 0;
      width: 3px;
      height: 100%;
      cursor: ew-resize;
    `,row:t`
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: ${Ui.size[2]} ${Ui.size[2.5]};
      gap: ${Ui.size[2.5]};
      border-bottom: ${l(n.gray[300],n.darkGray[500])} 1px solid;
      align-items: center;
      & > button {
        padding: 0;
        background: transparent;
        border: none;
        display: flex;
        gap: ${o[.5]};
        flex-direction: column;
      }
    `,logoAndToggleContainer:t`
      display: flex;
      gap: ${Ui.size[3]};
      align-items: center;
    `,logo:t`
      cursor: pointer;
      display: flex;
      flex-direction: column;
      background-color: transparent;
      border: none;
      gap: ${Ui.size[.5]};
      padding: 0px;
      &:hover {
        opacity: 0.7;
      }
      &:focus-visible {
        outline-offset: 4px;
        border-radius: ${a.radius.xs};
        outline: 2px solid ${n.blue[800]};
      }
    `,tanstackLogo:t`
      font-size: ${r.size.md};
      font-weight: ${r.weight.bold};
      line-height: ${r.lineHeight.xs};
      white-space: nowrap;
      color: ${l(n.gray[600],n.gray[300])};
    `,queryFlavorLogo:t`
      font-weight: ${r.weight.semibold};
      font-size: ${r.size.xs};
      background: linear-gradient(
        to right,
        ${l("#ea4037, #ff9b11","#dd524b, #e9a03b")}
      );
      background-clip: text;
      -webkit-background-clip: text;
      line-height: 1;
      -webkit-text-fill-color: transparent;
      white-space: nowrap;
    `,queryStatusContainer:t`
      display: flex;
      gap: ${Ui.size[2]};
      height: min-content;
    `,queryStatusTag:t`
      display: flex;
      gap: ${Ui.size[1.5]};
      box-sizing: border-box;
      height: ${Ui.size[6.5]};
      background: ${l(n.gray[50],n.darkGray[500])};
      color: ${l(n.gray[700],n.gray[300])};
      border-radius: ${Ui.border.radius.sm};
      font-size: ${r.size.sm};
      padding: ${Ui.size[1]};
      padding-left: ${Ui.size[1.5]};
      align-items: center;
      font-weight: ${r.weight.medium};
      border: ${l("1px solid "+n.gray[300],"1px solid transparent")};
      user-select: none;
      position: relative;
      &:focus-visible {
        outline-offset: 2px;
        outline: 2px solid ${n.blue[800]};
      }
    `,queryStatusTagLabel:t`
      font-size: ${r.size.xs};
    `,queryStatusCount:t`
      font-size: ${r.size.xs};
      padding: 0 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${l(n.gray[500],n.gray[400])};
      background-color: ${l(n.gray[200],n.darkGray[300])};
      border-radius: 2px;
      font-variant-numeric: tabular-nums;
      height: ${Ui.size[4.5]};
    `,statusTooltip:t`
      position: absolute;
      z-index: 1;
      background-color: ${l(n.gray[50],n.darkGray[500])};
      top: 100%;
      left: 50%;
      transform: translate(-50%, calc(${Ui.size[2]}));
      padding: ${Ui.size[.5]} ${Ui.size[2]};
      border-radius: ${Ui.border.radius.sm};
      font-size: ${r.size.xs};
      border: 1px solid ${l(n.gray[400],n.gray[600])};
      color: ${l(n.gray[600],n.gray[300])};

      &::before {
        top: 0px;
        content: ' ';
        display: block;
        left: 50%;
        transform: translate(-50%, -100%);
        position: absolute;
        border-color: transparent transparent
          ${l(n.gray[400],n.gray[600])} transparent;
        border-style: solid;
        border-width: 7px;
        /* transform: rotate(180deg); */
      }

      &::after {
        top: 0px;
        content: ' ';
        display: block;
        left: 50%;
        transform: translate(-50%, calc(-100% + 2px));
        position: absolute;
        border-color: transparent transparent
          ${l(n.gray[100],n.darkGray[500])} transparent;
        border-style: solid;
        border-width: 7px;
      }
    `,filtersContainer:t`
      display: flex;
      gap: ${Ui.size[2]};
      & > button {
        cursor: pointer;
        padding: ${Ui.size[.5]} ${Ui.size[1.5]} ${Ui.size[.5]}
          ${Ui.size[2]};
        border-radius: ${Ui.border.radius.sm};
        background-color: ${l(n.gray[100],n.darkGray[400])};
        border: 1px solid ${l(n.gray[300],n.darkGray[200])};
        color: ${l(n.gray[700],n.gray[300])};
        font-size: ${r.size.xs};
        display: flex;
        align-items: center;
        line-height: ${r.lineHeight.sm};
        gap: ${Ui.size[1.5]};
        max-width: 160px;
        &:focus-visible {
          outline-offset: 2px;
          border-radius: ${a.radius.xs};
          outline: 2px solid ${n.blue[800]};
        }
        & svg {
          width: ${Ui.size[3]};
          height: ${Ui.size[3]};
          color: ${l(n.gray[500],n.gray[400])};
        }
      }
    `,filterInput:t`
      padding: ${o[.5]} ${o[2]};
      border-radius: ${Ui.border.radius.sm};
      background-color: ${l(n.gray[100],n.darkGray[400])};
      display: flex;
      box-sizing: content-box;
      align-items: center;
      gap: ${Ui.size[1.5]};
      max-width: 160px;
      min-width: 100px;
      border: 1px solid ${l(n.gray[300],n.darkGray[200])};
      height: min-content;
      color: ${l(n.gray[600],n.gray[400])};
      & > svg {
        width: ${o[3]};
        height: ${o[3]};
      }
      & input {
        font-size: ${r.size.xs};
        width: 100%;
        background-color: ${l(n.gray[100],n.darkGray[400])};
        border: none;
        padding: 0;
        line-height: ${r.lineHeight.sm};
        color: ${l(n.gray[700],n.gray[300])};
        &::placeholder {
          color: ${l(n.gray[700],n.gray[300])};
        }
        &:focus {
          outline: none;
        }
      }

      &:focus-within {
        outline-offset: 2px;
        border-radius: ${a.radius.xs};
        outline: 2px solid ${n.blue[800]};
      }
    `,filterSelect:t`
      padding: ${Ui.size[.5]} ${Ui.size[2]};
      border-radius: ${Ui.border.radius.sm};
      background-color: ${l(n.gray[100],n.darkGray[400])};
      display: flex;
      align-items: center;
      gap: ${Ui.size[1.5]};
      box-sizing: content-box;
      max-width: 160px;
      border: 1px solid ${l(n.gray[300],n.darkGray[200])};
      height: min-content;
      & > svg {
        color: ${l(n.gray[600],n.gray[400])};
        width: ${Ui.size[2]};
        height: ${Ui.size[2]};
      }
      & > select {
        appearance: none;
        color: ${l(n.gray[700],n.gray[300])};
        min-width: 100px;
        line-height: ${r.lineHeight.sm};
        font-size: ${r.size.xs};
        background-color: ${l(n.gray[100],n.darkGray[400])};
        border: none;
        &:focus {
          outline: none;
        }
      }
      &:focus-within {
        outline-offset: 2px;
        border-radius: ${a.radius.xs};
        outline: 2px solid ${n.blue[800]};
      }
    `,actionsContainer:t`
      display: flex;
      gap: ${Ui.size[2]};
    `,actionsBtn:t`
      border-radius: ${Ui.border.radius.sm};
      background-color: ${l(n.gray[100],n.darkGray[400])};
      border: 1px solid ${l(n.gray[300],n.darkGray[200])};
      width: ${Ui.size[6.5]};
      height: ${Ui.size[6.5]};
      justify-content: center;
      display: flex;
      align-items: center;
      gap: ${Ui.size[1.5]};
      max-width: 160px;
      cursor: pointer;
      padding: 0;
      &:hover {
        background-color: ${l(n.gray[200],n.darkGray[500])};
      }
      & svg {
        color: ${l(n.gray[700],n.gray[300])};
        width: ${Ui.size[3]};
        height: ${Ui.size[3]};
      }
      &:focus-visible {
        outline-offset: 2px;
        border-radius: ${a.radius.xs};
        outline: 2px solid ${n.blue[800]};
      }
    `,actionsBtnOffline:t`
      & svg {
        stroke: ${l(n.yellow[700],n.yellow[500])};
        fill: ${l(n.yellow[700],n.yellow[500])};
      }
    `,overflowQueryContainer:t`
      flex: 1;
      overflow-y: auto;
      & > div {
        display: flex;
        flex-direction: column;
      }
    `,queryRow:t`
      display: flex;
      align-items: center;
      padding: 0;
      border: none;
      cursor: pointer;
      color: ${l(n.gray[700],n.gray[300])};
      background-color: ${l(n.gray[50],n.darkGray[700])};
      line-height: 1;
      &:focus {
        outline: none;
      }
      &:focus-visible {
        outline-offset: -2px;
        border-radius: ${a.radius.xs};
        outline: 2px solid ${n.blue[800]};
      }
      &:hover .tsqd-query-hash {
        background-color: ${l(n.gray[200],n.darkGray[600])};
      }

      & .tsqd-query-observer-count {
        padding: 0 ${Ui.size[1]};
        user-select: none;
        min-width: ${Ui.size[6.5]};
        align-self: stretch;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${r.size.xs};
        font-weight: ${r.weight.medium};
        border-bottom-width: 1px;
        border-bottom-style: solid;
        border-bottom: 1px solid ${l(n.gray[300],n.darkGray[700])};
      }
      & .tsqd-query-hash {
        user-select: text;
        font-size: ${r.size.xs};
        display: flex;
        align-items: center;
        min-height: ${Ui.size[6]};
        flex: 1;
        padding: ${Ui.size[1]} ${Ui.size[2]};
        font-family:
          ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
          'Liberation Mono', 'Courier New', monospace;
        border-bottom: 1px solid ${l(n.gray[300],n.darkGray[400])};
        text-align: left;
        text-overflow: clip;
        word-break: break-word;
      }

      & .tsqd-query-disabled-indicator {
        align-self: stretch;
        display: flex;
        align-items: center;
        padding: 0 ${Ui.size[2]};
        color: ${l(n.gray[800],n.gray[300])};
        background-color: ${l(n.gray[300],n.darkGray[600])};
        border-bottom: 1px solid ${l(n.gray[300],n.darkGray[400])};
        font-size: ${r.size.xs};
      }

      & .tsqd-query-static-indicator {
        align-self: stretch;
        display: flex;
        align-items: center;
        padding: 0 ${Ui.size[2]};
        color: ${l(n.teal[800],n.teal[300])};
        background-color: ${l(n.teal[100],n.teal[900])};
        border-bottom: 1px solid ${l(n.teal[300],n.teal[700])};
        font-size: ${r.size.xs};
      }
    `,selectedQueryRow:t`
      background-color: ${l(n.gray[200],n.darkGray[500])};
    `,detailsContainer:t`
      flex: 1 1 700px;
      background-color: ${l(n.gray[50],n.darkGray[700])};
      color: ${l(n.gray[700],n.gray[300])};
      font-family: ui-sans-serif, Inter, system-ui, sans-serif, sans-serif;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      display: flex;
      text-align: left;
    `,detailsHeader:t`
      font-family: ui-sans-serif, Inter, system-ui, sans-serif, sans-serif;
      position: sticky;
      top: 0;
      z-index: 2;
      background-color: ${l(n.gray[200],n.darkGray[600])};
      padding: ${Ui.size[1.5]} ${Ui.size[2]};
      font-weight: ${r.weight.medium};
      font-size: ${r.size.xs};
      line-height: ${r.lineHeight.xs};
      text-align: left;
    `,detailsBody:t`
      margin: ${Ui.size[1.5]} 0px ${Ui.size[2]} 0px;
      & > div {
        display: flex;
        align-items: stretch;
        padding: 0 ${Ui.size[2]};
        line-height: ${r.lineHeight.sm};
        justify-content: space-between;
        & > span {
          font-size: ${r.size.xs};
        }
        & > span:nth-child(2) {
          font-variant-numeric: tabular-nums;
        }
      }

      & > div:first-child {
        margin-bottom: ${Ui.size[1.5]};
      }

      & code {
        font-family:
          ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
          'Liberation Mono', 'Courier New', monospace;
        margin: 0;
        font-size: ${r.size.xs};
        line-height: ${r.lineHeight.xs};
        max-width: 100%;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        word-break: break-word;
      }

      & pre {
        margin: 0;
        display: flex;
        align-items: center;
      }
    `,queryDetailsStatus:t`
      border: 1px solid ${n.darkGray[200]};
      border-radius: ${Ui.border.radius.sm};
      font-weight: ${r.weight.medium};
      padding: ${Ui.size[1]} ${Ui.size[2.5]};
    `,actionsBody:t`
      flex-wrap: wrap;
      margin: ${Ui.size[2]} 0px ${Ui.size[2]} 0px;
      display: flex;
      gap: ${Ui.size[2]};
      padding: 0px ${Ui.size[2]};
      & > button {
        font-family: ui-sans-serif, Inter, system-ui, sans-serif, sans-serif;
        font-size: ${r.size.xs};
        padding: ${Ui.size[1]} ${Ui.size[2]};
        display: flex;
        border-radius: ${Ui.border.radius.sm};
        background-color: ${l(n.gray[100],n.darkGray[600])};
        border: 1px solid ${l(n.gray[300],n.darkGray[400])};
        align-items: center;
        gap: ${Ui.size[2]};
        font-weight: ${r.weight.medium};
        line-height: ${r.lineHeight.xs};
        cursor: pointer;
        &:focus-visible {
          outline-offset: 2px;
          border-radius: ${a.radius.xs};
          outline: 2px solid ${n.blue[800]};
        }
        &:hover {
          background-color: ${l(n.gray[200],n.darkGray[500])};
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        & > span {
          width: ${o[1.5]};
          height: ${o[1.5]};
          border-radius: ${Ui.border.radius.full};
        }
      }
    `,actionsSelect:t`
      font-size: ${r.size.xs};
      padding: ${Ui.size[.5]} ${Ui.size[2]};
      display: flex;
      border-radius: ${Ui.border.radius.sm};
      overflow: hidden;
      background-color: ${l(n.gray[100],n.darkGray[600])};
      border: 1px solid ${l(n.gray[300],n.darkGray[400])};
      align-items: center;
      gap: ${Ui.size[2]};
      font-weight: ${r.weight.medium};
      line-height: ${r.lineHeight.sm};
      color: ${l(n.red[500],n.red[400])};
      cursor: pointer;
      position: relative;
      &:hover {
        background-color: ${l(n.gray[200],n.darkGray[500])};
      }
      & > span {
        width: ${o[1.5]};
        height: ${o[1.5]};
        border-radius: ${Ui.border.radius.full};
      }
      &:focus-within {
        outline-offset: 2px;
        border-radius: ${a.radius.xs};
        outline: 2px solid ${n.blue[800]};
      }
      & select {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        appearance: none;
        background-color: transparent;
        border: none;
        color: transparent;
        outline: none;
      }

      & svg path {
        stroke: ${Ui.colors.red[400]};
      }
      & svg {
        width: ${Ui.size[2]};
        height: ${Ui.size[2]};
      }
    `,settingsMenu:t`
      display: flex;
      & * {
        font-family: ui-sans-serif, Inter, system-ui, sans-serif, sans-serif;
      }
      flex-direction: column;
      gap: ${o[.5]};
      border-radius: ${Ui.border.radius.sm};
      border: 1px solid ${l(n.gray[300],n.gray[700])};
      background-color: ${l(n.gray[50],n.darkGray[600])};
      font-size: ${r.size.xs};
      color: ${l(n.gray[700],n.gray[300])};
      z-index: 99999;
      min-width: 120px;
      padding: ${o[.5]};
    `,settingsSubTrigger:t`
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-radius: ${Ui.border.radius.xs};
      padding: ${Ui.size[1]} ${Ui.size[1]};
      cursor: pointer;
      background-color: transparent;
      border: none;
      color: ${l(n.gray[700],n.gray[300])};
      & svg {
        color: ${l(n.gray[600],n.gray[400])};
        transform: rotate(-90deg);
        width: ${Ui.size[2]};
        height: ${Ui.size[2]};
      }
      &:hover {
        background-color: ${l(n.gray[200],n.darkGray[500])};
      }
      &:focus-visible {
        outline-offset: 2px;
        outline: 2px solid ${n.blue[800]};
      }
      &.data-disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    `,settingsMenuHeader:t`
      padding: ${Ui.size[1]} ${Ui.size[1]};
      font-weight: ${r.weight.medium};
      border-bottom: 1px solid ${l(n.gray[300],n.darkGray[400])};
      color: ${l(n.gray[500],n.gray[400])};
      font-size: ${r.size.xs};
    `,settingsSubButton:t`
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: ${l(n.gray[700],n.gray[300])};
      font-size: ${r.size.xs};
      border-radius: ${Ui.border.radius.xs};
      padding: ${Ui.size[1]} ${Ui.size[1]};
      cursor: pointer;
      background-color: transparent;
      border: none;
      & svg {
        color: ${l(n.gray[600],n.gray[400])};
      }
      &:hover {
        background-color: ${l(n.gray[200],n.darkGray[500])};
      }
      &:focus-visible {
        outline-offset: 2px;
        outline: 2px solid ${n.blue[800]};
      }
    `,themeSelectedButton:t`
      background-color: ${l(n.purple[100],n.purple[900])};
      color: ${l(n.purple[700],n.purple[300])};
      & svg {
        color: ${l(n.purple[700],n.purple[300])};
      }
      &:hover {
        background-color: ${l(n.purple[100],n.purple[900])};
      }
    `,viewToggle:t`
      border-radius: ${Ui.border.radius.sm};
      background-color: ${l(n.gray[200],n.darkGray[600])};
      border: 1px solid ${l(n.gray[300],n.darkGray[200])};
      display: flex;
      padding: 0;
      font-size: ${r.size.xs};
      color: ${l(n.gray[700],n.gray[300])};
      overflow: hidden;

      &:has(:focus-visible) {
        outline: 2px solid ${n.blue[800]};
      }

      & .tsqd-radio-toggle {
        opacity: 0.5;
        display: flex;
        & label {
          display: flex;
          align-items: center;
          cursor: pointer;
          line-height: ${r.lineHeight.md};
        }

        & label:hover {
          background-color: ${l(n.gray[100],n.darkGray[500])};
        }
      }

      & > [data-checked] {
        opacity: 1;
        background-color: ${l(n.gray[100],n.darkGray[400])};
        & label:hover {
          background-color: ${l(n.gray[100],n.darkGray[400])};
        }
      }

      & .tsqd-radio-toggle:first-child {
        & label {
          padding: 0 ${Ui.size[1.5]} 0 ${Ui.size[2]};
        }
        border-right: 1px solid ${l(n.gray[300],n.darkGray[200])};
      }

      & .tsqd-radio-toggle:nth-child(2) {
        & label {
          padding: 0 ${Ui.size[2]} 0 ${Ui.size[1.5]};
        }
      }
    `,devtoolsEditForm:t`
      padding: ${o[2]};
      & > [data-error='true'] {
        outline: 2px solid ${l(n.red[200],n.red[800])};
        outline-offset: 2px;
        border-radius: ${a.radius.xs};
      }
    `,devtoolsEditTextarea:t`
      width: 100%;
      max-height: 500px;
      font-family: 'Fira Code', monospace;
      font-size: ${r.size.xs};
      border-radius: ${a.radius.sm};
      field-sizing: content;
      padding: ${o[2]};
      background-color: ${l(n.gray[100],n.darkGray[800])};
      color: ${l(n.gray[900],n.gray[100])};
      border: 1px solid ${l(n.gray[200],n.gray[700])};
      resize: none;
      &:focus {
        outline-offset: 2px;
        border-radius: ${a.radius.xs};
        outline: 2px solid ${l(n.blue[200],n.blue[800])};
      }
    `,devtoolsEditFormActions:t`
      display: flex;
      justify-content: space-between;
      gap: ${o[2]};
      align-items: center;
      padding-top: ${o[1]};
      font-size: ${r.size.xs};
    `,devtoolsEditFormError:t`
      color: ${l(n.red[700],n.red[500])};
    `,devtoolsEditFormActionContainer:t`
      display: flex;
      gap: ${o[2]};
    `,devtoolsEditFormAction:t`
      font-family: ui-sans-serif, Inter, system-ui, sans-serif, sans-serif;
      font-size: ${r.size.xs};
      padding: ${o[1]} ${Ui.size[2]};
      display: flex;
      border-radius: ${a.radius.sm};
      background-color: ${l(n.gray[100],n.darkGray[600])};
      border: 1px solid ${l(n.gray[300],n.darkGray[400])};
      align-items: center;
      gap: ${o[2]};
      font-weight: ${r.weight.medium};
      line-height: ${r.lineHeight.xs};
      cursor: pointer;
      &:focus-visible {
        outline-offset: 2px;
        border-radius: ${a.radius.xs};
        outline: 2px solid ${n.blue[800]};
      }
      &:hover {
        background-color: ${l(n.gray[200],n.darkGray[500])};
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    `}},bl=e=>yl("light",e),ml=e=>yl("dark",e);y(["click","mousedown","input"]);var vl=e=>{const[t,n]=ne({prefix:"TanstackQueryDevtools"}),r=X(),o=s(()=>{const e=t.theme_preference||"system";return"system"!==e?e:r()});return a(de.Provider,{value:e,get children(){return a(ge,{localStore:t,setLocalStore:n,get children(){return a(pe.Provider,{value:o,get children(){return a(Ya,{localStore:t,setLocalStore:n})}})}})}})};export{vl as default};
