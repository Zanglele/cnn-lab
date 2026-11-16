/* CNN 疑问专题的真实运算。固定单通道小图，手工权重，不训练。 */
(function(root){
 const math=typeof module!=='undefined'?require('./math.js'):root.CNNMath;
 const input=Array.from({length:4},()=>[0,0,1,1]);
 const vertical=[[-.5,.5],[-.5,.5]],horizontal=[[-.5,-.5],[.5,.5]];
 const kernels=[vertical,horizontal];
 function setExample(kind='vertical',position=2,direction='vertical'){
   input.splice(0,4,...Array.from({length:4},(_,r)=>Array.from({length:4},(_,c)=>kind==='uniform'?1:kind==='horizontal'?Number(r>=position):kind==='reverse'?Number(c<position):Number(c>=position))));
   kernels.splice(0,2,...(direction==='vertical'?[vertical,horizontal]:[horizontal,vertical]));
 }
 function rgbExample(greenWeight=0){
   const planes=[[[0,1],[0,1]],[[1,1],[1,1]],[[0,0],[0,0]]];
   const filters=[[vertical,[[greenWeight,greenWeight],[greenWeight,greenWeight]],[[0,0],[0,0]]],[horizontal,[[.25,.25],[.25,.25]],[[0,0],[0,0]]]];
   const contributions=filters.map(filter=>planes.map((plane,i)=>math.convolve(plane,filter[i])[0][0]));
   return {planes,filters,contributions,outputs:contributions.map(v=>v.reduce((a,b)=>a+b,0))};
 }
 function pool(m,k=2,stride=2,mode='max'){if(mode==='none')return m.map(r=>r.slice());const n=Math.floor((m.length-k)/stride)+1;return Array.from({length:n},(_,r)=>Array.from({length:n},(_,c)=>{const values=[];for(let i=0;i<k;i++)for(let j=0;j<k;j++)values.push(m[r*stride+i][c*stride+j]);return mode==='avg'?values.reduce((a,b)=>a+b,0)/(k*k):Math.max(...values);}));}
 function size(N,K,S,P,C){const out=Math.floor((N+2*P-K)/S)+1;return {side:out,count:out*out*C,parameters:(K*K+1)*C};}
 function pipeline(mode='none'){
   const conv=kernels.map(k=>math.convolve(input,k)),relu=conv.map(math.relu),pooled=relu.map(m=>pool(m,2,2,mode));
   // 第二层为覆盖全部输入通道的 1×1 卷积，两个输出核分别取 [1,1]、[1,-1]。
   const second=[1,-1].map(sign=>pooled[0].map((row,r)=>row.map((v,c)=>v+sign*pooled[1][r][c])));
   const active=second.map(math.relu),means=active.map(m=>m.flat().reduce((a,b)=>a+b,0)/m.flat().length),logits=[means[0]-means[1],means[1]-means[0]];
   return {conv,relu,pooled,second,active,means,logits};
 }
 root.CNNBridgeModel={input,kernels,pool,size,pipeline,setExample,rgbExample};if(typeof module!=='undefined')module.exports=root.CNNBridgeModel;
})(globalThis);
