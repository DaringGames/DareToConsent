// Minimal QR code generator (qrcode-generator v1 API subset)
// To keep things simple and offline, we embed a tiny generator.
export default function QR(){
  function canvas(canvas, text){
    // Use a simple library-free placeholder: draw the text as blocks.
    // For development only; can be swapped with a real QR implementation later.
    const ctx = canvas.getContext('2d');
    const size = 220; canvas.width = size; canvas.height = size;
    ctx.fillStyle = '#111'; ctx.fillRect(0,0,size,size);
    ctx.fillStyle = '#7cacf8';
    // naive hash visual
    let h=0; for(let i=0;i<text.length;i++) h = (h*31 + text.charCodeAt(i))>>>0;
    const N=25; const cell=size/N; let x=0,y=0; let s=h;
    for(let i=0;i<N*N;i++){
      if((s>>>0)&1) ctx.fillRect(x*cell+1,y*cell+1,cell-2,cell-2);
      s = (s*1664525 + 1013904223)>>>0;
      x++; if(x===N){x=0;y++;}
    }
  }
  return { canvas };
}

