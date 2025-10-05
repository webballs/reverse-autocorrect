// background.js
(() => {
    const totalParticles = 50;
    const G = 1000; 
    const minDistance = 30; 
    const maxPull = 5; 
    const returnSpeed = 0.05; // Geschwindigkeit der Rückkehr zur Basisgeschwindigkeit
  
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '-1';
    canvas.style.pointerEvents = 'none';
    document.body.appendChild(canvas);
  
    const ctx = canvas.getContext('2d');
  
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();
  
    let mouse = { x: 0, y: 0, pressed: false };
    window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener('mousedown', e => { if(e.button === 0) mouse.pressed = true; });
    window.addEventListener('mouseup', e => { if(e.button === 0) mouse.pressed = false; });
  
    class Particle {
      constructor() {
        this.reset();
      }
  
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = 2 + Math.random() * 4;
        this.vx = this.baseVx = -0.5 + Math.random();
        this.vy = this.baseVy = -0.5 + Math.random();
        this.color = `hsl(${Math.random() * 360}, 80%, 60%)`;
        this.mass = 1 + Math.random() * 2;
      }
  
      update() {
        if (mouse.pressed) {
          let dx = mouse.x - this.x;
          let dy = mouse.y - this.y;
          let distanceSq = dx*dx + dy*dy;
          let distance = Math.sqrt(distanceSq);
          if (distance < minDistance) distance = minDistance;
          distanceSq = distance * distance;
  
          let force = G * this.mass / distanceSq;
          let ax = (dx / distance) * force;
          let ay = (dy / distance) * force;
  
          // Maximal begrenzen
          ax = Math.max(-maxPull, Math.min(maxPull, ax));
          ay = Math.max(-maxPull, Math.min(maxPull, ay));
  
          this.vx += ax;
          this.vy += ay;
        } else {
          // Sanft zurück zur Basisgeschwindigkeit
          this.vx += (this.baseVx - this.vx) * returnSpeed;
          this.vy += (this.baseVy - this.vy) * returnSpeed;
        }
  
        this.x += this.vx;
        this.y += this.vy;
  
        // Wrap-around
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
      }
  
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        ctx.fill();
      }
    }
  
    const particles = [];
    for (let i = 0; i < totalParticles; i++) particles.push(new Particle());
  
    function drawWaves(time) {
      const waveCount = 3;
      for (let i = 0; i < waveCount; i++) {
        const yOffset = canvas.height / waveCount * i + 50 + 100;
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x += 10) {
          const y = yOffset + Math.sin((x + time * 0.002 + i * 100) * 0.02) * 30;
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `hsl(${i * 120 + (time*0.05)%360}, 80%, 50%)`;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.stroke();
      }
    }
  
    function animate(time) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawWaves(time);
      particles.forEach(p => { p.update(); p.draw(); });
      requestAnimationFrame(animate);
    }
  
    requestAnimationFrame(animate);
  })();
  