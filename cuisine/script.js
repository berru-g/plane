const roomWrap = document.querySelector('.room-wrap');
const room = document.querySelector('.room');

const views = ['back-view', 'left-view', 'front-view', 'right-view'];
const walls = ['wall-back', 'wall-left', 'wall-front', 'wall-right'];
let currentViewIndex = 2; // Start at 'front-view'
let currentRotationY = 180;

const updateView = (direction) => {
  if (direction === 'left') {
    currentViewIndex = (currentViewIndex + 1) % views.length;
    currentRotationY -= 90;
  } else if (direction === 'right') {
    currentViewIndex = (currentViewIndex - 1 + views.length) % views.length;
    currentRotationY += 90;
  }

  roomWrap.classList.remove(...views);
  roomWrap.classList.add(views[currentViewIndex]);

  roomWrap.classList.add('rotating');
  setTimeout(() => roomWrap.classList.remove('rotating'), 500);

  document.querySelectorAll('.room div').forEach(wall => wall.classList.remove('active'));
  document.querySelector(`.${walls[currentViewIndex]}`).classList.add('active');

  updateRoomTransform(0, 0);
};

const updateRoomTransform = (offsetX, offsetY) => {
  room.style.transform = `rotateX(${offsetY}deg) rotateY(${currentRotationY + offsetX}deg)`;
};

updateView();

// Click events
document.getElementById('turnLeft').addEventListener('click', () => updateView('left'));
document.getElementById('turnRight').addEventListener('click', () => updateView('right'));

// Arrow key support
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') updateView('left');
  else if (e.key === 'ArrowRight') updateView('right');
});

// Mobile swipe support
let touchStartX = null;

roomWrap.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
});

roomWrap.addEventListener('touchend', (e) => {
  if (!touchStartX) return;

  let touchEndX = e.changedTouches[0].screenX;
  let diffX = touchStartX - touchEndX;

  if (Math.abs(diffX) > 30) { // Minimum swipe distance threshold
    if (diffX > 0) updateView('left');
    else updateView('right');
  }

  touchStartX = null;
});

// Mouse movement interactivity
roomWrap.addEventListener("mousemove", (e) => {
  const xPercent = (e.clientX / window.innerWidth - 0.5) * 2;
  const yPercent = (e.clientY / window.innerHeight - 0.5) * 2;

  const rotateYOffset = (-yPercent * 15).toFixed(2);
  const rotateXOffset = (xPercent * 15).toFixed(2);

  updateRoomTransform(parseFloat(rotateXOffset), parseFloat(rotateYOffset));
});


document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.cube').forEach(cube => {
    const faces = ['top', 'left', 'front', 'right', 'back', 'bottom'];

    faces.forEach(face => {
      const faceElement = document.createElement('div');
      faceElement.classList.add(`cube-${face}`);
      cube.appendChild(faceElement);
    });
  });
});

