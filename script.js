// Get the pitch display element
const pitchDisplay = document.getElementById('pitch-display');

navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
        // Set up the audio context and analyzer
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        // Set up the analyser
        analyser.fftSize = 2048;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        // Function to update the pitch display
        function updatePitchDisplay() {
            analyser.getByteFrequencyData(dataArray);
            const maxIndex = dataArray.indexOf(Math.max(...dataArray));
            const pitch = Math.round(maxIndex * audioContext.sampleRate / analyser.fftSize);
            pitchDisplay.textContent = `${pitch} Hz`;
            requestAnimationFrame(updatePitchDisplay);
        }

        // Start the pitch detection loop
        updatePitchDisplay();
    })
    .catch(error => {
        console.error('Error accessing microphone:', error);
    });
	
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

