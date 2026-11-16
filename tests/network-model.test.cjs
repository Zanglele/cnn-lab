const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx=vm.createContext({});for(const f of ['math','network-model'])vm.runInContext(fs.readFileSync(`docs/${f}.js`,'utf8'),ctx);
const gray=Array.from({length:8},()=>Array(8).fill(1));
const block={k:3,channels:3,stride:1,padding:'same',relu:true,pool:'none'};
let r=ctx.NetworkModel.build(gray,{input:'gray',blocks:[block]});assert.equal(r.total,30);assert.equal(r.layers[1].n,8);assert.equal(r.layers[1].data[2][3][3],1);assert.equal(r.layers[1].data[0][3][3],0);
r=ctx.NetworkModel.build(gray,{input:'rgb',blocks:[block,{...block,channels:6,pool:'max'}]});assert.equal(r.total,252);assert.equal(r.layers[0].channels,3);assert.equal(r.layers.at(-2).n,4);assert.equal(r.layers.at(-1).channels,6);
// R has a left/right boundary. A horizontal-difference kernel contributes only R here;
// G is constant along columns and B is spatially constant.
assert.equal(r.layers[1].data[0][3][3],.5);
r=ctx.NetworkModel.build([[1]],{input:'gray',blocks:[{...block,padding:'valid'}]});assert.match(r.error,/无有效输出/);assert.equal(r.layers.length,1);
r=ctx.NetworkModel.build([[1]],{input:'gray',blocks:[{...block,k:1,pool:'max'}]});assert.match(r.error,/池化/);
for(const input of ['gray','rgb'])for(const k of [1,3,5])for(const stride of [1,2])for(const pool of ['none','max','avg']){
 r=ctx.NetworkModel.build(gray,{input,blocks:[{...block,k,stride,pool}]});assert.equal(r.error,null);assert.ok(r.layers.every(l=>l.data.length===l.channels&&l.data.every(m=>m.length===l.n&&m.every(row=>row.length===l.n&&row.every(Number.isFinite)))));
}
console.log('Passed: 36 model configurations, cross-channel numerical contribution, parameter counts and invalid-size handling.');
