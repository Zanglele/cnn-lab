const assert=require('node:assert/strict');
const {convolve,relu,pool}=require('../docs/math.js');
assert.deepEqual(convolve([[1,2,3],[4,5,6],[7,8,9]],[[1,0,-1],[1,0,-1],[1,0,-1]]),[[-6]]);
assert.deepEqual(relu([[-6,0,3]]),[[0,0,3]]);
assert.deepEqual(pool([[1,2,7],[3,4,8],[9,9,9]]),[[4]]);
assert.deepEqual(pool([[1,2],[3,4]],'avg'),[[2.5]]);
assert.deepEqual(convolve([[2]],[[1]],1,1,3),[[3,3,3],[3,5,3],[3,3,3]]);
for(const p of [0,1])for(const s of [1,2]){
 const m=Array.from({length:8},()=>Array(8).fill(1));
 const result=convolve(m,[[0,0,0],[0,1,0],[0,0,0]],s,p);
 assert.equal(result.length,Math.floor((8+2*p-3)/s)+1);
 assert.ok(result.flat().every(v=>v===1));
}
console.log('Passed: convolution sign, bias, zero-padding, stride, ReLU, max/average pooling, odd-edge truncation.');
const {sampleGrayscale,makeKernel}=require('../docs/math.js');
const pixels=Uint8ClampedArray.from([0,0,0,255,255,255,255,255,128,128,128,255,0,0,0,0]);
assert.ok(Math.abs(sampleGrayscale(pixels,2,2,1)[0][0]-(1+(1-128/255))/4)<1e-12);
assert.equal(sampleGrayscale(pixels,2,2,2)[0][0],1);
assert.equal(sampleGrayscale(pixels,2,2,2)[1][1],0);
for(const N of [8,12,16])for(const k of [1,3,5])for(const s of [1,2,3])for(const p of [0,1,2]){
 const input=Array.from({length:N},(_,r)=>Array.from({length:N},(_,c)=>(r*N+c)/(N*N)));
 const kernel=makeKernel('vertical',k),bias=.3,result=convolve(input,kernel,s,p,bias);
 const n=Math.floor((N+2*p-k)/s)+1;
 assert.equal(result.length,n);
 for(let r=0;r<n;r++)for(let c=0;c<n;c++){
   let expected=bias;
   for(let i=0;i<k;i++)for(let j=0;j<k;j++){
     const y=r*s+i-p,x=c*s+j-p;
     if(y>=0&&y<N&&x>=0&&x<N)expected+=input[y][x]*kernel[i][j];
   }
   assert.ok(Math.abs(result[r][c]-expected)<1e-10);
 }
 assert.ok(pool(relu(result)).length>=1);
}
for(const k of [1,3,5])assert.ok(Math.abs(makeKernel('blur',k).flat().reduce((s,v)=>s+v,0)-1)<1e-12);
console.log('Passed: area-average grayscale, transparency, 81 dimension/stride/padding combinations and independent window sums.');
