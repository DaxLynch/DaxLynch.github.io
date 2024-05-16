// Get the BPM input and play button elements
const bpmInput = document.getElementById('bpm-input');
const playButton = document.getElementById('play-button');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let metronomeInterval = null;

function playMetronome(bpm) {
  const audioContext = new AudioContext();
  const beatDuration = Math.floor(60 * 1000.0 / bpm); // Calculate the duration between beats in milliseconds
  const startTime = audioContext.currentTime;

  console.log('Hello');

  const tick = document.getElementById('tick');

  metronomeInterval = setInterval(() => {
    tick.play();
  }, beatDuration);
  
}

playButton.addEventListener('click', () => {
  let bpm = parseInt(bpmInput.value, 10);
  if (!isNaN(bpm)) {
    bpm = 40
  }
    playMetronome(bpm);
});
