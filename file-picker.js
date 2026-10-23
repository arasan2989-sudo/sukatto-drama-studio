/* Original local file classification and conservative verification target selection. */
(function(root){'use strict';
function info(file){return{name:file.name,type:file.type||'',bytes:file.size,lastModified:Number.isFinite(file.lastModified)?file.lastModified:null};}
async function classify(file){if(!file.size)return{kind:'empty',message:'空のファイルです。保存したMP4を選び直してください。'};if(file.size>512*1024**2)return{kind:'too-large',message:'検査できるのは512MiBまでです。'};const b=new Uint8Array(await file.slice(0,65536).arrayBuffer()),text=new TextDecoder().decode(b).replace(/^\uFEFF/,'').trimStart();let p=0;for(let n=0;n<16&&p+8<=b.length;n++){const v=new DataView(b.buffer,b.byteOffset+p,b.length-p),size=v.getUint32(0),type=String.fromCharCode(...b.subarray(p+4,p+8));if(type==='ftyp')return{kind:'mp4',message:'MP4互換のコンテナを検出しました。映像トラックを確認します。'};if(size<8||p+size>b.length)break;p+=size;}
if(/^[{[]/.test(text)||/\.json$/i.test(file.name)||/^(application|text)\/(.+\+)?json\b/i.test(file.type||''))return{kind:'json',message:'選択したのは診断JSONです。動画ではないためMP4照合は行いません。下の「このJSONを照合対象として読み込む」を押し、その後MP4を選んでください。'};
if((b[0]===80&&b[1]===75)||/\.zip$/i.test(file.name))return{kind:'zip',message:'選択したのはZIPです。「ファイル」で展開し、中にある.mp4をこのアプリの選択ボタンから選んでください。'};return{kind:'unsupported',message:'MP4として確認できません。拡張子や種類だけで成功にはしません。保存した元の.mp4を選び直してください。'};}
function chooseTarget(list,selectedId,activeId){if(selectedId)return list.find(t=>t.artifactId===selectedId)||null;if(activeId)return list.find(t=>t.artifactId===activeId)||null;return list.length===1?list[0]:null;}
const api={info,classify,chooseTarget};root.SavedFilePicker=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
