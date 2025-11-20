(() => {
  const logo = document.querySelector('.logo-container img');
  const mouseIndicator = document.querySelector('.mouse-indicator');

  let inactivityTimout = null;
  let autoAnimationFrameId = null;
  let autoAnimationLastFrameTime = null;
  let mouseIndicatorStartTimeout = null;

  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  const circleRadius = window.innerHeight * 0.4;
  const maxDistance = Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2) / 2;

  const getPosition = (x, y) => {
    const deltaX = x - centerX;
    const deltaY = y - centerY;
    const angle = Math.atan2(deltaY, deltaX);
    return { deltaX, deltaY, angle };
  };

  const getCirclePosition = (angle) => ({
    deltaX: Math.cos(angle) * circleRadius,
    deltaY: Math.sin(angle) * circleRadius,
    angle,
  });

  const getState = (position) => {
    const { deltaX, deltaY, angle } = position;
    const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
    const normalizedDistance = Math.min(distance / maxDistance, 1);

    return {
      hue: angle / Math.PI * 180,
      saturation: 40 + normalizedDistance * 20,
      lightness: 30 + normalizedDistance * 15,
      rotateY: deltaX / maxDistance * 20,
      rotateX: -(deltaY / maxDistance) * 20
    };
  }

  let lastPosition = getCirclePosition(Math.random() * Math.PI * 2);
  let currentState = getState(lastPosition);
  let targetState = currentState;

  const update = (skipInterpolation = false) => {
    const interpolationSpeed = skipInterpolation ? 1 : 0.1;
    currentState.hue = targetState.hue; // no interpolation for hue to avoid color banding
    ['saturation', 'lightness', 'rotateX', 'rotateY'].forEach(prop => {
      currentState[prop] += (targetState[prop] - currentState[prop]) * interpolationSpeed;
    });
    const { hue, saturation, lightness, rotateX, rotateY } = currentState;
    document.body.style.backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    logo.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  }

  const animate = () => {
    update();
    requestAnimationFrame(animate);
  }

  const updateTargetFromPosition = (position) => {
    targetState = getState(position);
    lastPosition = position;
  }

  const animateAuto = () => {
    if (!autoAnimationLastFrameTime) return;
    const frameTime = Date.now();
    const delta = frameTime - autoAnimationLastFrameTime;
    const newAngle = lastPosition.angle + delta * (Math.PI / 3000); // full rotation in 8 seconds
    const newPosition = getCirclePosition(newAngle);
    updateTargetFromPosition(newPosition);
    mouseIndicator.style.left = `${centerX + newPosition.deltaX}px`;
    mouseIndicator.style.top = `${centerY + newPosition.deltaY}px`;
    autoAnimationLastFrameTime = frameTime;
    autoAnimationFrameId = requestAnimationFrame(animateAuto);
  };

  const startAutoAnimation = () => {
    autoAnimationLastFrameTime = Date.now();
    animateAuto();
    mouseIndicatorStartTimeout = setTimeout(() => {
      mouseIndicator.classList.add('visible');
      setTimeout(() => { mouseIndicator.classList.remove('visible'); }, 2000);
    }, 2000);
  };

  const stopAutoAnimation = () => {
    autoAnimationLastFrameTime = null;
    if (autoAnimationFrameId) {
      cancelAnimationFrame(autoAnimationFrameId);
      autoAnimationFrameId = null;
    }
    clearInterval(mouseIndicatorStartTimeout);
    mouseIndicator.classList.remove('visible');
  };

  document.addEventListener('mousemove', (e) => {
    if (autoAnimationLastFrameTime) stopAutoAnimation();
    clearTimeout(inactivityTimout);
    const position = getPosition(e.clientX, e.clientY);
    updateTargetFromPosition(position);
    inactivityTimout = setTimeout(() => startAutoAnimation(), 2000);
  });

  update(true);
  animate();
  startAutoAnimation();
})();