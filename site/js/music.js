/* Background music */
(function () {
  var VOLUME = 0.12;
  var KEY_ENABLED = 'otel-koans-music';
  var KEY_TIME = 'otel-koans-music-time';

  var isRoot = !location.pathname.match(/\/koans\//);
  var audioSrc = isRoot ? 'audio/bg-music.mp3' : '../audio/bg-music.mp3';

  var audio = new Audio(audioSrc);
  audio.loop = true;
  audio.volume = VOLUME;
  audio.preload = 'auto';

  // Save position periodically so next page can resume near same spot
  setInterval(function () {
    if (!audio.paused) {
      localStorage.setItem(KEY_TIME, String(audio.currentTime));
    }
  }, 1000);

  window.addEventListener('beforeunload', function () {
    if (!audio.paused) {
      localStorage.setItem(KEY_TIME, String(audio.currentTime));
    }
  });

  // Create toggle button
  var btn = document.createElement('button');
  btn.className = 'music-toggle';
  btn.setAttribute('aria-label', 'Toggle music');
  btn.title = 'Toggle music';

  function updateBtn() {
    var on = !audio.paused;
    btn.textContent = on ? '\u266B' : '\u266A';
    btn.classList.toggle('music-on', on);
  }

  function startPlayback() {
    var savedTime = parseFloat(localStorage.getItem(KEY_TIME) || '0');
    if (savedTime && isFinite(savedTime) && savedTime < audio.duration) {
      audio.currentTime = savedTime;
    }
    audio.play().then(updateBtn).catch(function () {});
  }

  // Toggle on click
  btn.addEventListener('click', function () {
    if (audio.paused) {
      localStorage.setItem(KEY_ENABLED, '1');
      startPlayback();
    } else {
      localStorage.setItem(KEY_ENABLED, '0');
      audio.pause();
    }
    updateBtn();
  });

  // If music was enabled on a previous page, auto-resume on first user gesture
  var enabled = localStorage.getItem(KEY_ENABLED) === '1';
  if (enabled) {
    // Try playing immediately (works if browser has media engagement for this origin)
    startPlayback();
    // Fallback: resume on any user interaction
    var resumeHandler = function () {
      if (audio.paused && localStorage.getItem(KEY_ENABLED) === '1') {
        startPlayback();
      }
      document.removeEventListener('click', resumeHandler, true);
      document.removeEventListener('keydown', resumeHandler, true);
    };
    document.addEventListener('click', resumeHandler, true);
    document.addEventListener('keydown', resumeHandler, true);
  }

  updateBtn();
  document.body.appendChild(btn);
})();
