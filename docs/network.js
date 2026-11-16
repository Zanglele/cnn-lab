/* 无外部依赖的 3D 透视投影：在三维空间排列特征平面，再投影到 Canvas。 */
class NetworkView {
  constructor(){
    this.canvas=document.getElementById('network-canvas');this.ctx=this.canvas.getContext('2d');this.selected=1;this.timer=null;this.state=null;this.drag=null;
    const get=id=>document.getElementById(id);this.get=get;
    this.viewHeight=600;
    const viewer=get('network-viewer'),fullscreen=get('network-fullscreen');
    const sync=()=>{const active=document.fullscreenElement===viewer||this.overlay;fullscreen.textContent=active?'↙ 退出全屏':'⛶ 全屏查看';fullscreen.setAttribute('aria-expanded',String(Boolean(active)));get('fullscreen-note').textContent=active?'按 Esc 可退出':'';this.draw();};
    const closeOverlay=()=>{this.overlay=false;viewer.classList.remove('viewer-overlay');document.body.style.overflow=this.previousOverflow||'';sync();fullscreen.focus();};
    fullscreen.onclick=async()=>{
      if(document.fullscreenElement===viewer){await document.exitFullscreen();return;}
      if(this.overlay){closeOverlay();return;}
      try{if(!viewer.requestFullscreen)throw new Error('unsupported');await viewer.requestFullscreen();}
      catch{this.previousOverflow=document.body.style.overflow;this.overlay=true;viewer.classList.add('viewer-overlay');document.body.style.overflow='hidden';}
      sync();fullscreen.focus();
    };
    document.addEventListener('fullscreenchange',()=>{sync();fullscreen.focus();});
    document.addEventListener('keydown',e=>{if(this.overlay&&e.key==='Escape'){e.preventDefault();closeOverlay();}if(this.overlay&&e.key==='Tab'){const focusable=Array.from(viewer.querySelectorAll('button,input,select,[tabindex]')).filter(el=>!el.disabled&&el.getClientRects().length);const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
    if(typeof ResizeObserver!=='undefined'){this.resizeObserver=new ResizeObserver(()=>this.draw());this.resizeObserver.observe(this.canvas);}
    globalThis.addEventListener?.('resize',()=>this.draw());
    this.config=()=>({input:get('net-input').value,blocks:Array.from({length:Number(get('net-depth').value)},(_,i)=>({k:Number(get(`net-${i}-k`).value),channels:Number(get(`net-${i}-channels`).value),stride:Number(get(`net-${i}-stride`).value),padding:get(`net-${i}-padding`).value,relu:get(`net-${i}-relu`).value==='yes',pool:get(`net-${i}-pool`).value}))});
    const ids=['net-input','net-depth',...Array.from({length:3},(_,i)=>['k','channels','stride','padding','relu','pool'].map(k=>`net-${i}-${k}`)).flat()];
    ids.forEach(id=>get(id).onchange=()=>{this.stop();if(this.state)this.update(this.state);});
    get('net-channel').onchange=()=>this.showMatrix();
    get('net-reset').onclick=()=>{get('net-input').value='gray';get('net-depth').value='2';for(let i=0;i<3;i++)for(const [key,value] of Object.entries({k:3,channels:i===0?3:6,stride:1,padding:'same',relu:'yes',pool:i===0?'max':'none'}))get(`net-${i}-${key}`).value=value;this.stop();if(this.state)this.update(this.state);};
    ['yaw','pitch','zoom'].forEach(id=>get(id).oninput=()=>this.draw());
    get('view-reset').onclick=()=>{get('yaw').value=-18;get('pitch').value=-15;get('zoom').value=115;this.draw();};
    get('network-play').onclick=()=>{if(this.timer){this.stop();return;}this.select(0);get('network-play').textContent='Ⅱ 暂停讲解';this.timer=setInterval(()=>{if(this.selected===this.layers.length-1){this.stop();return;}this.select(this.selected+1);},2000);};
    this.canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;this.canvas.setPointerCapture(e.pointerId);this.drag={x:e.clientX,y:e.clientY,yaw:Number(get('yaw').value),pitch:Number(get('pitch').value),moved:false};});
    this.canvas.addEventListener('pointermove',e=>{if(!this.drag)return;const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;this.drag.moved ||= Math.abs(dx)+Math.abs(dy)>4;get('yaw').value=this.drag.yaw+dx*.2;get('pitch').value=this.drag.pitch+dy*.2;this.draw();});
    this.canvas.addEventListener('pointerup',e=>{if(this.drag&&!this.drag.moved){const rect=this.canvas.getBoundingClientRect(),x=(e.clientX-rect.left)*1200/rect.width,y=(e.clientY-rect.top)*this.viewHeight/rect.height;const hit=this.hits?.findLast(h=>x>=h.x0&&x<=h.x1&&y>=h.y0&&y<=h.y1);if(hit){this.stop();this.select(hit.index);}}this.drag=null;});
    ['pointercancel','lostpointercapture'].forEach(name=>this.canvas.addEventListener(name,()=>{this.drag=null;}));
    this.canvas.addEventListener('wheel',e=>{e.preventDefault();get('zoom').value=Number(get('zoom').value)+(e.deltaY<0?5:-5);this.draw();},{passive:false});
    this.canvas.addEventListener('keydown',e=>{const map={ArrowLeft:['yaw',-4],ArrowRight:['yaw',4],ArrowUp:['pitch',-4],ArrowDown:['pitch',4],'+':['zoom',5],'=':['zoom',5],'-':['zoom',-5]};if(map[e.key]){e.preventDefault();const [id,d]=map[e.key];get(id).value=Number(get(id).value)+d;this.draw();}});
  }
  stop(){clearInterval(this.timer);this.timer=null;this.get('network-play').textContent='▶ 沿网络讲解';}
  update(s){this.state=s;const config=this.config(),result=NetworkModel.build(s.input,config);this.layers=result.layers;
    for(let i=0;i<3;i++)this.get(`net-block-${i}`).hidden=i>=config.blocks.length;
    this.get('net-error').textContent=result.error?result.error+' 下方只显示已成功计算的步骤，不显示旧结果。':'';
    this.get('net-summary').textContent=`${config.blocks.length} 个计划卷积层 · ${this.layers.length} 个已计算步骤 · 卷积参数共 ${result.total} 个（含偏置）`;
    this.get('net-shapes').innerHTML='<table><thead><tr><th>处理步骤</th><th>宽 × 高 × 通道</th><th>参数量</th></tr></thead><tbody>'+this.layers.map(l=>`<tr><td>${l.name}</td><td>${l.n} × ${l.n} × ${l.channels}</td><td>${l.parameters}</td></tr>`).join('')+'</tbody></table>';
    this.get('layer-buttons').innerHTML='';this.layers.forEach((l,i)=>{const b=document.createElement('button');b.textContent=`${i+1}. ${l.name} · ${l.n}×${l.n}×${l.channels}`;b.className='secondary';b.onclick=()=>{this.stop();this.select(i);};this.get('layer-buttons').append(b);});this.select(Math.min(this.selected,this.layers.length-1));
  }
  select(i){this.selected=i;Array.from(this.get('layer-buttons').children).forEach((b,j)=>{b.classList.toggle('active',i===j);b.setAttribute('aria-pressed',i===j);});const l=this.layers[i];this.get('network-detail').textContent=l.detail;this.get('net-channel').innerHTML=Array.from({length:l.channels},(_,c)=>`<option value="${c}">${l.rgb?['R 红','G 绿','B 蓝'][c]:'特征通道 '+(c+1)}</option>`).join('');this.get('net-channel').value='0';this.showMatrix();this.draw();}
  showMatrix(){const l=this.layers[this.selected],ch=Number(this.get('net-channel').value)||0,m=l.data[ch];this.get('net-matrix').innerHTML='<table aria-label="所选通道的真实数值"><tbody>'+m.map(row=>'<tr>'+row.map(v=>`<td>${Number(v.toFixed(3))}</td>`).join('')+'</tr>').join('')+'</tbody></table>';this.draw();}
  x(i){return (i-(this.layers.length-1)/2)*(1000/Math.max(6,this.layers.length));}
  project([x,y,z]){const yaw=Number(this.get('yaw').value)*Math.PI/180,pitch=Number(this.get('pitch').value)*Math.PI/180;const xx=x*Math.cos(yaw)+z*Math.sin(yaw),zz=-x*Math.sin(yaw)+z*Math.cos(yaw),yy=y*Math.cos(pitch)-zz*Math.sin(pitch),depth=y*Math.sin(pitch)+zz*Math.cos(pitch);const scale=1000/(1000+depth)*Number(this.get('zoom').value)/100;return [600+xx*scale,this.viewHeight/2-30+yy*scale,depth];}
  quad(points,fill,stroke,dash=false){const c=this.ctx,ps=points.map(p=>this.project(p));c.beginPath();ps.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1.3;c.setLineDash(dash?[4,3]:[]);c.stroke();c.setLineDash([]);}return ps;}
  draw(){if(!this.state)return;const ctx=this.ctx,rect=this.canvas.getBoundingClientRect();if(rect.width>0&&rect.height>0){this.viewHeight=1200*rect.height/rect.width;const dpr=globalThis.devicePixelRatio||1,w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}ctx.setTransform(w/1200,0,0,h/this.viewHeight,0,0);}ctx.clearRect(0,0,1200,this.viewHeight);ctx.fillStyle='#edf3ee';ctx.fillRect(0,0,1200,this.viewHeight);this.hits=[];const planes=[];this.layers.forEach((l,i)=>{const x=this.x(i),size=Math.min(115,700/this.layers.length)*(0.3+0.7*l.n/Math.max(...this.layers.map(v=>v.n))),depth=l.channels;for(let ch=0;ch<depth;ch++){const z=(ch-(depth-1)/2)*13;planes.push({l,i,ch,x,z,size,d:this.project([x,0,z])[2]});}});planes.sort((a,b)=>b.d-a.d);
    for(let i=0;i<this.layers.length-1;i++){const a=this.project([this.x(i)+63,0,0]),b=this.project([this.x(i+1)-63,0,0]);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.strokeStyle='#89a694';ctx.stroke();}
    planes.forEach(({l,i,ch,x,z,size})=>{const corners=[[x-size/2,-size/2,z],[x+size/2,-size/2,z],[x+size/2,size/2,z],[x-size/2,size/2,z]];const actual=Boolean(l.data),m=l.data?.[ch];this.quad(corners,actual?'#e5eee6':'#e1e5e0',null);if(m){const max=Math.max(1,...l.data.flat(2).map(Math.abs));m.forEach((row,r)=>row.forEach((v,col)=>{const d=size/l.n,left=x-size/2+col*d,top=-size/2+r*d,a=Math.abs(v)/max;let fill=i===0?`rgb(${255*(1-v)},${255*(1-v)},${255*(1-v)})`:v<0?`rgb(${230-40*a},${210-120*a},${220-65*a})`:`rgb(${235-215*a},${243-110*a},${231-120*a})`;if(l.rgb){const rgb=[0,0,0];rgb[ch]=Math.round(255*v);fill=`rgb(${rgb.join(',')})`;}this.quad([[left,top,z],[left+d,top,z],[left+d,top+d,z],[left,top+d,z]],fill,null);}));}
      const ps=this.quad(corners,null,this.selected===i&&ch===Number(this.get('net-channel').value)?'#da8c35':actual?'#518a72':'#a3ada3',!actual);this.hits.push({index:i,x0:Math.min(...ps.map(p=>p[0])),x1:Math.max(...ps.map(p=>p[0])),y0:Math.min(...ps.map(p=>p[1])),y1:Math.max(...ps.map(p=>p[1]))});
    });
    this.layers.forEach((l,i)=>{const p=this.project([this.x(i),95,0]);ctx.textAlign='center';ctx.font='bold 16px Segoe UI, Microsoft YaHei';ctx.fillStyle=i===this.selected?'#ae651f':'#244d3a';ctx.fillText(l.name,p[0],p[1]);ctx.font='15px monospace';ctx.fillText(`${l.n} × ${l.n} × ${l.channels}`,p[0],p[1]+20);ctx.font='13px Segoe UI, Microsoft YaHei';ctx.fillStyle='#748574';ctx.fillText(l.data?'实际特征':'结构示意',p[0],p[1]+38);});
    ctx.textAlign='left';ctx.font='12px Segoe UI, Microsoft YaHei';ctx.fillStyle='#547864';ctx.fillText('拖拽旋转 · 滚轮缩放 · 点击层查看说明',22,28);
  }
}
