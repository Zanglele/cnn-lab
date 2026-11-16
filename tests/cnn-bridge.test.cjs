const assert=require('node:assert/strict'),M=require('../docs/cnn-bridge-model.js'),math=require('../docs/math.js');
assert.deepEqual(math.convolve(M.input,M.kernels[0]),[[0,1,0],[0,1,0],[0,1,0]]);
M.setExample('vertical',1);assert.deepEqual(math.convolve(M.input,M.kernels[0]),[[1,0,0],[1,0,0],[1,0,0]]);
M.setExample('uniform');assert.ok(math.convolve(M.input,M.kernels[0]).flat().every(v=>v===0));
M.setExample('horizontal',2,'horizontal');assert.deepEqual(math.convolve(M.input,M.kernels[0]),[[0,0,0],[1,1,1],[0,0,0]]);
M.setExample();
assert.deepEqual(M.rgbExample(0).outputs,[1,1]);assert.deepEqual(M.rgbExample(.25).outputs,[2,1]);assert.deepEqual(M.rgbExample(-.25).outputs,[0,1]);
assert.deepEqual(M.size(4,2,1,0,1),{side:3,count:9,parameters:5});
assert.deepEqual(M.size(4,3,1,1,1),{side:4,count:16,parameters:10});
assert.deepEqual(M.size(4,2,1,0,10),{side:3,count:90,parameters:50});
const m=[[1,3,2,0],[2,4,1,5],[0,1,3,2],[2,0,1,4]];
assert.deepEqual(M.pool(m),[[4,5],[2,4]]);assert.deepEqual(M.pool(m,2,2,'avg'),[[2.5,2],[.75,2.5]]);assert.equal(M.pool(m,2,1).length,3);assert.deepEqual(M.pool(m,2,2,'none'),m);
const a=[[.9,.1],[.1,.1]],b=[[.1,.1],[.1,.9]];
assert.deepEqual(M.pool(a),M.pool(b));assert.ok(Math.abs(M.pool(a,2,2,'avg')[0][0]-.3)<1e-12);
const k=[[-.5,.5],[-.5,.5]];assert.equal(math.convolve([[1,1],[1,1]],k)[0][0],0);assert.equal(math.convolve([[0,1],[0,1]],k)[0][0],1);assert.equal(math.convolve([[1,0],[1,0]],k)[0][0],-1);
assert.deepEqual([0,1,2].map(c=>Math.max(...[[255,0,0],[0,255,0],[0,0,255],[0,0,0]].map(rgb=>rgb[c]))),[255,255,255]);
for(const mode of ['none','max','avg']){const p=M.pipeline(mode),n=mode==='none'?3:1;assert.equal(p.conv.length,2);assert.equal(p.pooled[0].length,n);for(let r=0;r<n;r++)for(let c=0;c<n;c++){assert.equal(p.second[0][r][c],p.pooled[0][r][c]+p.pooled[1][r][c]);assert.equal(p.second[1][r][c],p.pooled[0][r][c]-p.pooled[1][r][c]);}assert.equal(p.logits[0],p.means[0]-p.means[1]);assert.ok(p.logits.every(Number.isFinite));}
console.log('Passed: convolution trace, counts, pooling windows, information-loss counterexample, RGB maximum, edge response and complete two-layer forward pass.');
