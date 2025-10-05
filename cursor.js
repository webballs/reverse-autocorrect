const outer = document.getElementById('cursorOuter');
const inner = document.getElementById('cursorInner');

let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let pos = { x: mouse.x, y: mouse.y };

document.addEventListener('mousemove', e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

document.addEventListener('mousedown', () => {
  inner.style.transform = 'translate(-50%, -50%) scale(0)';
  outer.style.transform = 'translate(-50%, -50%) scale(0.7)';
});

document.addEventListener('mouseup', () => {
  inner.style.transform = 'translate(-50%, -50%) scale(1)';
  outer.style.transform = 'translate(-50%, -50%) scale(1)';
});

(function anim() {
  pos.x += (mouse.x - pos.x) * 0.1;
  pos.y += (mouse.y - pos.y) * 0.1;
  inner.style.left = pos.x + 'px';
  inner.style.top = pos.y + 'px';
  outer.style.left = pos.x + 'px';
  outer.style.top = pos.y + 'px';

  const el = document.elementFromPoint(pos.x, pos.y);
  if (el && (el.tagName === 'BUTTON' || el.tagName === 'TEXTAREA' || el.type === 'range')) {
    inner.style.opacity = 0.1;
    outer.style.opacity = 0.1;
  } else {
    inner.style.opacity = 1;
    outer.style.opacity = 1;
  }

  requestAnimationFrame(anim);
})();
