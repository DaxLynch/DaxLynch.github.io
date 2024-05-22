// Get the pitch display element
const audioContext = new AudioContext();
const tuner = new Tuner(audioContext, 'pitch-display');
tuner.initialize();
const metronome = new Metronome(audioContext);
metronome.initialize();
const rhythmTracker = new RhythmTracker(audioContext);
rhythmTracker.initialize();

