// script.js is in charge of intalizing each of the three main scripts [rhythmtracker.js, tuner.js, and metronome.js]
// Authors: Miles Anderson, Ryan Helms, Dax Lynch, and Harry Robertson
// Last Edited: 6/2/24

const audioContext = new AudioContext();
const tuner = new Tuner(audioContext, 'pitch-display');
tuner.initialize();
const metronome = new Metronome(audioContext);
metronome.initialize();
const rhythmTracker = new RhythmTracker(audioContext);
rhythmTracker.initialize();



