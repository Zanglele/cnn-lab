// 轻量 DOM/Canvas 替身测试状态连线；不能代替真实浏览器视觉与指针测试。
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('docs/index.html','utf8'),elements=new Map();
const context2d=new Proxy({getImageData:()=>({data:new Uint8ClampedArray(288*288*4).fill(255)})},{get:(t,k)=>k in t?t[k]:()=>{},set:(t,k,v)=>(t[k]=v,true)});
class Element {
 constructor(tag='div'){this.tagName=tag;this.children=[];this.style={setProperty(){}};this.classList={toggle(){},add(){}};this.dataset={};this.value='';this.validity={valid:true};this.listeners={};}
 set innerHTML(v){this.children=[];} get innerHTML(){return '';}
 append(...items){this.children.push(...items);} setAttribute(){} addEventListener(k,f){this.listeners[k]=f;}
 getContext(){return context2d;} getBoundingClientRect(){return {left:0,top:0,width:288,height:288};}
 setPointerCapture(){} click(){this.onclick?.({target:this,currentTarget:this});}
 get valueAsNumber(){return Number(this.value);}
}
for(const m of html.matchAll(/id="([^"]+)"/g)){assert.ok(!elements.has(m[1]),'Duplicate id '+m[1]);elements.set(m[1],new Element());}
for(const [key,value] of Object.entries({resolution:'12','kernel-size':'3',channels:'3',stride:'1',padding:'0',bias:'0','pool-type':'max',speed:'600',yaw:'-18',pitch:'-15',zoom:'100',brush:'22','draw-tool':'pen'}))elements.get(key).value=value;
elements.get('net-input').value='gray';elements.get('net-depth').value='2';for(let i=0;i<3;i++)for(const [key,value] of Object.entries({k:'3',channels:i===0?'3':'6',stride:'1',padding:'same',relu:'yes',pool:i===0?'max':'none'}))elements.get(`net-${i}-${key}`).value=value;
const modes=['classification','segmentation'].map(mode=>{const e=new Element('button');e.dataset.mode=mode;return e;});
const document={getElementById:id=>{assert.ok(elements.has(id),'Missing element '+id);return elements.get(id);},createElement:tag=>new Element(tag),querySelectorAll:()=>modes,querySelector:()=>modes[0],addEventListener(){}};
const sandbox=vm.createContext({document,console,setInterval:()=>1,clearInterval(){},requestAnimationFrame:f=>f()});
for(const file of ['math','drawing','network-model','network','app'])vm.runInContext(fs.readFileSync(`docs/${file}.js`,'utf8'),sandbox,{filename:file+'.js'});
const run=code=>vm.runInContext(code,sandbox);
assert.equal(run('maps.length'),3);assert.equal(run('maps[0].length'),10);
elements.get('next').click();assert.equal(run('cursor'),1);
elements.get('finish').click();assert.equal(run('cursor'),99);
elements.get('kernel-size').value='5';elements.get('kernel-size').onchange();assert.equal(run('cursor'),0);assert.equal(run('maps[0].length'),8);
elements.get('channels').value='6';elements.get('channels').onchange();assert.equal(run('filters.length'),6);
elements.get('filter-index').value='2';elements.get('filter-index').onchange();elements.get('bias').value='2';elements.get('bias').oninput();
assert.equal(run('filters[2].bias'),2);assert.equal(run('filters[0].bias'),0);assert.equal(run('maps[2][0][0]'),2);
elements.get('resolution').value='8';elements.get('resolution').onchange();elements.get('stride').value='3';elements.get('stride').onchange();assert.equal(run('pooledMaps[0].length'),1);
elements.get('padding').value='2';elements.get('padding').onchange();assert.equal(run('maps[0].length'),3);
elements.get('reset').click();assert.equal(run('input.length'),8);assert.equal(run('filters.length'),3);assert.equal(run('maps[0].length'),6);
run('network.select(6)');assert.match(elements.get('network-detail').textContent,/没有训练/);
run('network.select(1)');assert.match(elements.get('network-detail').textContent,/真实计算/);
assert.equal(elements.get('feature-bank').children.length,3);
console.log('Passed: page initialization, scan, kernel resize, per-kernel bias, channel count, resolution, padding, reset, 3D layer descriptions.');

elements.get('net-input').value='rgb';elements.get('net-input').onchange();assert.equal(run('network.layers[0].channels'),3);assert.equal(run('network.layers[1].parameters'),84);
elements.get('net-0-channels').value='8';elements.get('net-0-channels').onchange();assert.equal(run('network.layers[1].channels'),8);assert.equal(run('network.layers[4].parameters'),438);
elements.get('net-depth').value='1';elements.get('net-depth').onchange();assert.equal(run('network.layers.length'),5);assert.ok(elements.get('net-block-1').hidden);
elements.get('net-0-stride').value='2';elements.get('net-0-stride').onchange();assert.equal(run('network.layers[1].n'),4);elements.get('net-0-pool').value='none';elements.get('net-0-pool').onchange();assert.equal(run('network.layers.length'),4);
elements.get('net-reset').click();assert.equal(run('network.layers[0].channels'),1);console.log('Passed: RGB/gray, channels, layer count, stride, optional pooling and reset update the 3D model.');

// Check native fullscreen and in-page fallback without requiring a browser.
(async()=>{
 const button=elements.get('network-fullscreen'),viewer=elements.get('network-viewer');
 button.focus=()=>{};viewer.classList.remove=()=>{};document.body={style:{overflow:'auto'}};
 viewer.requestFullscreen=async()=>{document.fullscreenElement=viewer;};
 document.exitFullscreen=async()=>{document.fullscreenElement=null;};
 await button.onclick();assert.equal(document.fullscreenElement,viewer);assert.match(button.textContent,/退出/);
 await button.onclick();assert.equal(document.fullscreenElement,null);
 viewer.requestFullscreen=async()=>{throw new Error('not allowed');};
 await button.onclick();assert.equal(run('network.overlay'),true);assert.equal(document.body.style.overflow,'hidden');
 await button.onclick();assert.equal(run('network.overlay'),false);assert.equal(document.body.style.overflow,'auto');
 console.log('Passed: native fullscreen entry/exit and rejected-request overlay fallback.');
})().catch(e=>{console.error(e);process.exitCode=1;});
