/* 独立计算模块：采用深度学习中通常称为卷积的互相关（不翻转核）。 */
(function(root){
  function convolve(input,kernel,stride=1,padding=0,bias=0){
    const n=Math.floor((input.length+2*padding-kernel.length)/stride)+1;
    return Array.from({length:n},(_,r)=>Array.from({length:n},(_,c)=>kernel.reduce((sum,row,i)=>sum+row.reduce((s,k,j)=>s+(input[r*stride+i-padding]?.[c*stride+j-padding]??0)*k,0),bias)));
  }
  function relu(matrix){return matrix.map(row=>row.map(x=>Math.max(0,x)));}
  function pool(matrix,mode='max'){
    const n=Math.floor(matrix.length/2);
    return Array.from({length:n},(_,r)=>Array.from({length:n},(_,c)=>{const a=[matrix[2*r][2*c],matrix[2*r][2*c+1],matrix[2*r+1][2*c],matrix[2*r+1][2*c+1]];return mode==='max'?Math.max(...a):a.reduce((s,x)=>s+x,0)/4;}));
  }
  function sampleGrayscale(rgba,width,height,n){
    return Array.from({length:n},(_,r)=>Array.from({length:n},(_,c)=>{
      let sum=0,count=0;
      for(let y=Math.floor(r*height/n);y<Math.floor((r+1)*height/n);y++)
        for(let x=Math.floor(c*width/n);x<Math.floor((c+1)*width/n);x++){
          const i=(y*width+x)*4,alpha=rgba[i+3]/255;
          const gray=.299*rgba[i]+.587*rgba[i+1]+.114*rgba[i+2];
          sum+=(1-gray/255)*alpha;count++;
        }
      return Math.max(0,Math.min(1,sum/count));
    }));
  }
  function makeKernel(kind,k){
    const mid=Math.floor(k/2);
    return Array.from({length:k},(_,r)=>Array.from({length:k},(_,c)=>{
      if(kind==='blur')return 1/(k*k);
      if(kind==='identity')return Number(r===mid&&c===mid);
      if(kind==='vertical')return Math.sign(c-mid);
      if(kind==='horizontal')return Math.sign(r-mid);
      if(kind==='outline')return r===mid&&c===mid?k*k-1:-1;
      return 0;
    }));
  }
  root.CNNMath={convolve,relu,pool,sampleGrayscale,makeKernel};
  if(typeof module!=='undefined')module.exports=root.CNNMath;
})(globalThis);
