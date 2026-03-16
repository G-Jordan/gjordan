
export class G73Visualizer{

constructor(audioCtx,analyser,canvas){
this.canvas=canvas
this.ctx=canvas.getContext("2d")
this.analyser=analyser
this.data=new Uint8Array(analyser.frequencyBinCount)

this.bars=64
this.spacing=2
this.mode="single"

this.glow=8
this.opacity=1
this.running=true

this.loop()
}

loop(){
if(!this.running)return
requestAnimationFrame(()=>this.loop())

this.analyser.getByteFrequencyData(this.data)

const w=this.canvas.width
const h=this.canvas.height

const maxBars=Math.floor(w/12)
const bars=Math.min(this.bars,maxBars)
const step=Math.floor(this.data.length/bars)

this.ctx.clearRect(0,0,w,h)

for(let i=0;i<bars;i++){
const v=this.data[i*step]/255
const barHeight=v*h
const x=i*(w/bars)

this.drawBar(x,barHeight)

if(this.mode==="mirror")
this.drawBar(w-x,barHeight)

if(this.mode==="mirror-invert")
this.drawBar(w-x,-barHeight)
}
}

drawBar(x,height){
const ctx=this.ctx
ctx.globalAlpha=this.opacity
ctx.shadowBlur=this.glow
ctx.fillRect(
x,
this.canvas.height-height,
8,
height
)
}
}
