// Get the pitch display element
const audioContext = new AudioContext();
const tuner = new Tuner(audioContext, 'pitch-display');
const metronome = new Metronome(audioContext);
metronome.initialize();
const rhythmTracker = new RhythmTracker(audioContext);
rhythmTracker.initialize();

document.getElementById('toggle-tuner').addEventListener('click', function() {
    if (tuner.isRunning) {
        tuner.stopTuner();
        this.textContent = 'Start Tuning';
    } else {
        tuner.startTuner();
        this.textContent = 'Stop Tuning';
    }
});

