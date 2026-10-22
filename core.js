/* Original source. No runtime dependencies. */
(function(root){
'use strict';
const EP1=['月曜の朝、私の企画書が消えていた。','課長は言った。「君は何もしていない」','会議では、私の案が課長の手柄になった。','悔しくても、その場では言い返さなかった。','私は保存していた変更履歴を開いた。','初稿の日付も、修正者の名前も残っていた。','翌朝、部長に事実だけを報告した。','部長は全員の前で作成者を尋ねた。','課長は笑って「私です」と答えた。','そこで画面に、変更履歴が映し出された。','部長が聞いた。「この名前は誰ですか」','課長は黙った。会議室が静まり返った。','部長は私に企画の説明を任せた。','準備した言葉が、今度は皆に届いた。','帰り道、胸を張って会社の扉を出た。'];
const EP2=['金曜の夜、また私だけが残業だった。','先輩は「新人の仕事だ」と帰っていった。','当番表を見ると、毎週私の名前があった。','私は怒る前に、三か月分の表を集めた。','担当回数を数え、小さな一覧にまとめた。','翌週、当番の決め方を会議で尋ねた。','先輩は「公平に回している」と答えた。','私は一覧を配り、数字を読み上げた。','私が十二回。ほかの人は一回ずつだった。','部長が当番表と照らし合わせた。','先輩は「断らないから」とつぶやいた。','部長は言った。「それは公平ではない」','当番は全員で順番に回すことになった。','その金曜日、私は時間通りに席を立った。','夕焼けの中、久しぶりに友人へ電話した。'];
const safeName=s=>typeof s==='string'&&s.length>0&&s.length<160&&!/[\\/\x00-\x1f]/.test(s)&&s!=='.'&&s!=='..';
function template(ep=1){return {schema_version:1,title:ep===1?'消えた企画書':'押しつけられた当番表',mode:'test',narration_verified:false,bgm:'bgm.wav',sfx:'sfx.wav',mix:{bgm:.15,sfx:.35,narration:1},sfx_events:[{scene:7,offset:0}],segments:(ep===1?EP1:EP2).map((text,i)=>({text,image:`${String(i).padStart(2,'0')}.png`,audio:`${String(i).padStart(2,'0')}.wav`})),licenses:{}};}
function names(m){return [...new Set([...m.segments.flatMap(s=>[s.image,s.audio]),m.bgm,m.sfx])];}
function validate(m,files){
 if(!m||!['test','production'].includes(m.mode)||typeof m.title!=='string'||!m.title.trim())throw Error('title / mode を確認してください。');
 if(!Array.isArray(m.segments)||m.segments.length<12||m.segments.length>18)throw Error('静止画・字幕は12〜18シーン必要です。');
 for(const s of m.segments){if(typeof s.text!=='string'||!s.text.trim()||[...s.text].length>45||/[\r\n\x00-\x1f]/.test(s.text))throw Error('字幕は改行なしの1〜45文字で指定してください。');}
 for(const n of names(m)){
  if(!safeName(n))throw Error('素材名はフォルダなしのファイル名で指定してください。');
  if(!files.has(n))throw Error('素材がありません: '+n);
  const l=m.licenses?.[n];
  if(l?.commercial_allowed!==true||typeof l.evidence!=='string'||!l.evidence.trim())throw Error('商用条件の確認記録がありません: '+n);
  if(m.mode==='production'&&l.placeholder)throw Error('本番モードで仮素材は使えません: '+n);
 }
 if(m.mode==='production'&&m.narration_verified!==true)throw Error('日本語ナレーションの確認が必要です。');
 for(const [k,v]of Object.entries(m.mix||{}))if(!['bgm','sfx','narration'].includes(k)||!Number.isFinite(v)||v<0||v>2)throw Error('mix音量は0〜2で指定してください。');
 for(const e of m.sfx_events||[{scene:Math.floor(m.segments.length/2),offset:0}])if(!Number.isInteger(e.scene)||e.scene<0||e.scene>=m.segments.length||!Number.isFinite(e.offset)||e.offset<0)throw Error('効果音のscene / offsetが不正です。');
}
function timeline(ds){let t=0;return ds.map((d,i)=>{if(!Number.isFinite(d)||d<=0||d>30)throw Error('1シーンの音声は0〜30秒の範囲で用意してください。');const start=t;t+=d;return {i,start,end:t,duration:d};});}
function sceneAt(t,tl){return tl.findIndex(s=>t<s.end);}
function wrap(text,max=15){const out=[];let line='';for(const c of [...text]){if([...line].length>=max){out.push(line);line='';}line+=c;}if(line)out.push(line);return out;}
function mp4Mime(Recorder){return ['video/mp4;codecs=avc1.42E028,mp4a.40.2','video/mp4;codecs=avc1,mp4a.40.2','video/mp4'].find(m=>Recorder?.isTypeSupported?.(m))||null;}
function wav(seconds,kind){const rate=24000,n=Math.round(rate*seconds),ab=new ArrayBuffer(44+n*2),v=new DataView(ab);const str=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i));};str(0,'RIFF');v.setUint32(4,36+n*2,true);str(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);str(36,'data');v.setUint32(40,n*2,true);for(let i=0;i<n;i++){let t=i/rate,f=[220,261.63,329.63,293.66][Math.floor(t/2)%4];let a=kind==='bgm'?.10*(Math.sin(2*Math.PI*f*t)+.4*Math.sin(2*Math.PI*f*1.5*t)):kind==='sfx'?.32*Math.sin(2*Math.PI*(700+400*t)*t)*Math.max(0,1-t/.4):.08*Math.sin(2*Math.PI*440*t)*(t%1<.12?1:0);a*=Math.min(1,t/.02,Math.max(0,(seconds-t)/.04));v.setInt16(44+i*2,Math.round(32767*a),true);}return new Blob([ab],{type:'audio/wav'});}
let crcTable;function crc32(bytes){if(!crcTable)crcTable=Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
// Store-only ZIP for files exported by this app. No dependencies; ZIP64 not supported.
async function zip(entries){let offset=0;const local=[],central=[];for(const [name,blob]of entries){if(!safeName(name))throw Error('不正なZIP名');const n=new TextEncoder().encode(name),data=new Uint8Array(await blob.arrayBuffer()),crc=crc32(data);const h=new Uint8Array(30+n.length),v=new DataView(h.buffer);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint32(14,crc,true);v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,n.length,true);h.set(n,30);local.push(h,blob);const c=new Uint8Array(46+n.length),cv=new DataView(c.buffer);cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x800,true);cv.setUint32(16,crc,true);cv.setUint32(20,data.length,true);cv.setUint32(24,data.length,true);cv.setUint16(28,n.length,true);cv.setUint32(42,offset,true);c.set(n,46);central.push(c);offset+=h.length+data.length;}const size=central.reduce((s,b)=>s+b.length,0),e=new Uint8Array(22),ev=new DataView(e.buffer);ev.setUint32(0,0x06054b50,true);ev.setUint16(8,entries.length,true);ev.setUint16(10,entries.length,true);ev.setUint32(12,size,true);ev.setUint32(16,offset,true);return new Blob([...local,...central,e],{type:'application/zip'});}
async function unzip(blob){if(blob.size>150*1024**2)throw Error('ZIPは150MiB以内にしてください。');const data=new Uint8Array(await blob.arrayBuffer()),v=new DataView(data.buffer),out=new Map();let p=0;while(p+4<=data.length&&v.getUint32(p,true)===0x04034b50){if(p+30>data.length)throw Error('ZIP破損');const flags=v.getUint16(p+6,true),method=v.getUint16(p+8,true),crc=v.getUint32(p+14,true),size=v.getUint32(p+18,true),nl=v.getUint16(p+26,true),el=v.getUint16(p+28,true);if(method!==0||(flags&9))throw Error('このアプリが保存した非圧縮ZIPのみ読み込めます。');const start=p+30+nl+el,end=start+size;if(end>data.length||out.size>64)throw Error('ZIP破損またはファイル数超過');const name=new TextDecoder().decode(data.subarray(p+30,p+30+nl)),bytes=data.subarray(start,end);if(!safeName(name)||out.has(name)||crc32(bytes)!==crc)throw Error('ZIPの名前・CRCが不正です。');out.set(name,new File([bytes],name));p=end;}if(!out.size)throw Error('対応ZIPではありません。');return out;}
const api={template,names,validate,timeline,sceneAt,wrap,mp4Mime,wav,zip,unzip,safeName};if(typeof module!=='undefined')module.exports=api;root.StudioCore=api;
})(typeof window==='undefined'?globalThis:window);
