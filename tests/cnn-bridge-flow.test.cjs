const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const els=new Map();class El{constructor(){this.html='';this.nodes=[];this.dataset={};this.value='';this.disabled=false;}
set innerHTML(s){this.html=s;this.nodes=[];for(const m of s.matchAll(/<[a-z][\w-]*\b[^>]*>/g)){const tag=m[0],e=new El();e.disabled=/\sdisabled/.test(tag);const id=tag.match(/id="([^"]*)"/)?.[1];if(id)els.set(id,e);for(const d of tag.matchAll(/data-([a-z]+)="([^"]*)"/g))e.dataset[d[1]]=d[2];this.nodes.push(e);}}
get innerHTML(){return this.html;}querySelectorAll(s){const key=s.match(/data-([a-z]+)/)[1];return this.nodes.filter(e=>key in e.dataset);}click(){if(!this.disabled)this.onclick?.();}focus(){}scrollIntoView(){}}
const root=new El();els.set('cnn-bridge',root);const context=vm.createContext({document:{getElementById:id=>els.get(id)||null},window:{addEventListener(){}},location:{hash:''},requestAnimationFrame:fn=>fn(),CNNBridgeModel:require('../docs/cnn-bridge-model.js'),CNNMath:require('../docs/math.js')});vm.runInContext(fs.readFileSync('docs/cnn-bridge.js','utf8'),context);
const click=id=>els.get('b-'+id).click(),change=(id,v)=>{els.get('b-'+id).value=String(v);els.get('b-'+id).onchange();},data=(key,v)=>root.querySelectorAll(`[data-${key}]`).find(el=>el.dataset[key]===String(v)).click();
assert.match(root.html,/从图片开始/);assert.doesNotMatch(root.html,/全连接/);change('edge','uniform');assert.match(root.html,/全白/);change('edge','vertical');change('boundary',1);change('direction','horizontal');change('direction','vertical');change('boundary',2);
click('next');click('scan-next');assert.match(root.html,/位置 2 \/ 9/);data('scan',8);assert.ok(els.get('b-scan-next').disabled);
click('next');click('size-more');assert.match(root.html,/3 × 3 × 10 = 90/);click('size-same');assert.match(root.html,/4 × 4 × 1 = 16/);
click('next');change('greenWeight',.25);assert.match(root.html,/1 × 1 × 2：\[2, 1\]/);change('greenWeight',-.25);assert.match(root.html,/1 × 1 × 2：\[0, 1\]/);
click('next');change('color','edge');assert.match(root.html,/经过 ReLU 后为 1/);change('color','reverse');assert.match(root.html,/反向边界得到 −1/);
click('next');change('pool','avg');assert.match(root.html,/平均 \[1, 3, 2, 4\] = 2.5/);change('pool','none');assert.match(root.html,/原样保留/);change('pattern','noise');change('pool','max');assert.match(root.html,/max \[0.1, 0.1, 0.1, 5\] = 5/);
click('next');for(let i=0;i<5;i++)click('stage-next');assert.match(root.html,/全局平均 → 线性分类头/);change('flow','max');data('stage',3);assert.match(root.html,/1 × 1 × 2/);change('flow','none');assert.match(root.html,/3 × 3 × 2/);
console.log('Passed: seven-step navigation, edge controls, multi-channel sums, scan jumps, dimension presets, pooling/RGB comparisons and optional-pooling flow.');
