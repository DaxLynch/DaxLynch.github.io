// Get the pitch display element
const audioContext = new AudioContext();
const tuner = new Tuner(audioContext, 'pitch-display');
tuner.initialize();
const metronome = new Metronome(audioContext)
const rhythmTracker = new RhythmTracker(audioContext);
rhythmTracker.initialize();

