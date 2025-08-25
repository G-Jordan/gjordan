// js/player/ui-events.js
(function(){
  const wrapper = document.querySelector(".wrapper");
  const prevBtn = document.querySelector("#prev");
  const nextBtn = document.querySelector("#next");
  const playPauseBtn = document.querySelector(".play-pause");
  const repeatBtn = document.querySelector("#repeat-plist");
  const moreMusicBtn = document.querySelector("#more-music");
  const musicList = document.querySelector(".music-list");
  const closeMoreMusic = document.querySelector("#close");

  function animateButton(btn){
    btn.classList.add("btn-animate");
    setTimeout(() => btn.classList.remove("btn-animate"), 300);
  }

  playPauseBtn.addEventListener("click", () => {
    const isPlaying = wrapper.classList.contains("paused");
    isPlaying ? window.pauseMusic() : window.playMusic();
  });
  prevBtn.addEventListener("click", () => { animateButton(prevBtn); window.prevMusic(); });
  nextBtn.addEventListener("click", () => { animateButton(nextBtn); window.nextMusic(); });

  let mode = "repeat";
  repeatBtn.addEventListener("click", () => {
    if (mode === "repeat") { mode = "repeat_one"; repeatBtn.innerText = "repeat_one"; repeatBtn.title = "Repeat current song"; }
    else if (mode === "repeat_one") { mode = "shuffle"; repeatBtn.innerText = "shuffle"; repeatBtn.title = "Shuffle playlist"; }
    else { mode = "repeat"; repeatBtn.innerText = "repeat"; repeatBtn.title = "Playlist looped"; }
    window.setRepeatMode(mode);
  });

  moreMusicBtn.addEventListener("click", () => musicList.classList.toggle("show"));
  closeMoreMusic.addEventListener("click", () => musicList.classList.remove("show"));

  // progress bar seek + dot indicator
  const progressArea = document.querySelector(".progress-area");
  const progressBar = progressArea.querySelector(".progress-bar");
  const dotIndicator = document.createElement('div');
  dotIndicator.className = 'dot-indicator';
  Object.assign(dotIndicator.style, { width:'10px',height:'10px',background:'limegreen',borderRadius:'50%',position:'absolute',transform:'translate(-50%, -50%)',display:'none',zIndex:'10'});
  progressArea.appendChild(dotIndicator);

  function updateDotVisibility(x){
    const w = progressArea.clientWidth;
    x = Math.max(0, Math.min(x, w));
    dotIndicator.style.left = `${x}px`; // FIXED backticks
  }
  function setTimeAt(clientX){
    const rect = progressArea.getBoundingClientRect();
    const x = clientX - rect.left;
    const audio = document.querySelector('#main-audio');
    const duration = audio.duration || 0;
    audio.currentTime = (x / rect.width) * duration;
    updateDotVisibility(x);
  }

  progressArea.addEventListener('click', (e)=> setTimeAt(e.clientX));
  progressArea.addEventListener('touchstart', (e)=>{ dotIndicator.style.display='block'; setTimeAt(e.touches[0].clientX); }, {passive:true});
  progressArea.addEventListener('touchmove', (e)=> setTimeAt(e.touches[0].clientX), {passive:true});
  progressArea.addEventListener('touchend', ()=> dotIndicator.style.display='none');

  // expose for button onclicks
  window.animateButton = animateButton;
})();