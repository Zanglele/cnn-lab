(function(root){
function build(gray,config){
 const math=root.CNNMath,n=gray.length;
 let data=config.input==='rgb'?Array.from({length:3},(_,ch)=>Array.from({length:n},(_,r)=>Array.from({length:n},(_,c)=>ch===0?Number(c>=n/2):ch===1?Number(r>=n/2):.25))):[gray];
 const layers=[{name:config.input==='rgb'?'RGB 输入':'灰度输入',n,channels:data.length,data,rgb:config.input==='rgb',parameters:0,detail:config.input==='rgb'?'三片是同一幅彩色示例的 R、G、B 数值平面。R 随左右变化，G 随上下变化，B 固定为 0.25；不是三张独立图片。':'手绘采样得到一个灰度通道，黑色墨迹为 1、白底为 0。不是 RGB 三通道。'}];
 let total=0;
 for(let i=0;i<config.blocks.length;i++){
  const b=config.blocks[i],cin=data.length,side=data[0].length,p=b.padding==='same'?Math.floor(b.k/2):0;
  const out=Math.floor((side+2*p-b.k)/b.stride)+1;
  if(out<1)return {layers,total,error:`卷积 ${i+1} 无有效输出：输入 ${side}，核 ${b.k}，补零 ${p}。请减小核、开启补零或减少之前的下采样。`};
  const previous=data;
  data=Array.from({length:b.channels},(_,o)=>{
   const parts=previous.map((plane,c)=>{const kind=['vertical','horizontal','blur','identity'][o%4];const kernel=math.makeKernel(kind,b.k).map(row=>row.map(v=>v*(c+1)/(cin*(cin+1)/2)));return math.convolve(plane,kernel,b.stride,p,0);});
   return parts[0].map((row,r)=>row.map((_,col)=>parts.reduce((sum,m)=>sum+m[r][col],0)));
  });
  const params=(b.k*b.k*cin+1)*b.channels;total+=params;
  layers.push({name:`卷积 ${i+1}`,n:out,channels:b.channels,data,parameters:params,detail:`真实计算：${side} × ${side} × ${cin} → ${out} × ${out} × ${b.channels}。${b.channels} 个完整核，每个 ${b.k} × ${b.k} × ${cin}；步幅 ${b.stride}、补零 ${p}。输出边长 = ⌊(${side}+2×${p}−${b.k})/${b.stride}⌋+1。参数 (${b.k}²×${cin}+1)×${b.channels}=${params}。每个输出通道都汇总全部输入通道，绝不是分别处理 R、G、B 后各留一片。`});
  if(b.relu){data=data.map(math.relu);layers.push({name:`ReLU ${i+1}`,n:out,channels:data.length,data,parameters:0,detail:'逐元素保留正值、负值置零。宽、高、通道数不变，无可学习参数。'});}
  if(b.pool!=='none'){
   if(out<2)return {layers,total,error:`池化 ${i+1} 无法放入 2×2 窗口：当前只有 ${out}×${out}。请关闭此池化或增大之前的特征图。`};
   data=data.map(m=>math.pool(m,b.pool));layers.push({name:`${b.pool==='max'?'最大':'平均'}池化 ${i+1}`,n:data[0].length,channels:data.length,data,parameters:0,detail:'每个通道独立使用 2×2 窗口、步幅 2，不补零，舍弃不足窗口的边缘。只缩小空间尺寸，不减少通道数；最大值不等于语义上最重要。'});
  }
 }
 const side=data[0].length;data=data.map(m=>[[m.flat().reduce((a,b)=>a+b,0)/(side*side)]]);
 layers.push({name:'全局平均',n:1,channels:data.length,data,parameters:0,detail:`每张特征图的 ${side}×${side} 个数取平均，得到 ${data.length} 个特征数。这里没有训练分类器，也没有输出识别概率。`});
 return {layers,total,error:null};
}
root.NetworkModel={build};
})(globalThis);
