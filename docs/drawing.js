/* 原始笔画与采样结果分离，改变分辨率不会改写笔画。 */
class DrawingPad {
  constructor(onChange){
    this.canvas=document.getElementById('drawing');this.ctx=this.canvas.getContext('2d',{willReadFrequently:true});
    this.overlay=document.getElementById('drawing-overlay');this.onChange=onChange;this.point=null;this.pending=false;
    const pos=e=>{const r=this.canvas.getBoundingClientRect();return [(e.clientX-r.left)*288/r.width,(e.clientY-r.top)*288/r.height];};
    this.canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();this.canvas.setPointerCapture(e.pointerId);this.point=pos(e);this.stroke(this.point,this.point);});
    this.canvas.addEventListener('pointermove',e=>{if(!this.point)return;const next=pos(e);this.stroke(this.point,next);this.point=next;});
    ['pointerup','pointercancel','lostpointercapture'].forEach(t=>this.canvas.addEventListener(t,()=>{this.point=null;}));
    document.getElementById('clear').onclick=()=>{this.clear();this.onChange();};
    document.getElementById('example').onclick=()=>{this.example();this.onChange();};
    document.getElementById('brush').oninput=e=>document.getElementById('brush-value').textContent=e.target.value+' px';
    this.example();
  }
  clear(){this.ctx.fillStyle='#fff';this.ctx.fillRect(0,0,288,288);}
  example(){this.clear();const c=this.ctx;c.strokeStyle='#161616';c.lineWidth=22;c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(76,86);c.bezierCurveTo(95,20,230,40,205,110);c.bezierCurveTo(194,141,114,170,80,224);c.lineTo(216,224);c.stroke();}
  stroke(a,b){const c=this.ctx;c.strokeStyle=document.getElementById('draw-tool').value==='eraser'?'#fff':'#000';c.fillStyle=c.strokeStyle;c.lineWidth=Number(document.getElementById('brush').value);c.lineCap='round';c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();c.beginPath();c.arc(b[0],b[1],c.lineWidth/2,0,2*Math.PI);c.fill();if(!this.pending){this.pending=true;requestAnimationFrame(()=>{this.pending=false;this.onChange();});}}
  sample(n){return CNNMath.sampleGrayscale(this.ctx.getImageData(0,0,288,288).data,288,288,n);}
  highlight(r,c,n){const ctx=this.overlay.getContext('2d'),d=288/n;ctx.clearRect(0,0,288,288);ctx.strokeStyle='#e3913a';ctx.lineWidth=3;ctx.strokeRect(c*d+1.5,r*d+1.5,d-3,d-3);}
}
