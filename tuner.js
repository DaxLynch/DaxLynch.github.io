//Fixed tuner error, one small one where sometimes it spits undefined for the note, as I think a negative one is given to the pitches array. Please fix


class Tuner {
    constructor(audioContext, pitchDisplayId) {
        this.audioContext = audioContext;
        this.pitchDisplay = document.getElementById(pitchDisplayId);
        this.centsDisplay = document.getElementById("cents-display");
        this.pendulum = document.getElementById("pendulum");
    }
 
 
    initialize() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
        // Set up the audio context and analyzer
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
 
 
        // Set up the analyser
        analyser.minDecibels = -80;
        analyser.fftSize = 32768;
        analyser.smoothingTimeConstant = 0;
 
 
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
 
 
       
       
        function pitchClassAndCents(pitch){
                if (pitch == 0) { return ["0", 0];};
                let pitchInOctave0 = pitch;
                while (pitchInOctave0 > 55.0){ //This ensures pitch in octave is greater than 27.5
                    pitchInOctave0 = pitchInOctave0/2;
                }
                let pitches = [29.13523509488056, 30.867706328507698, 32.703195662574764, 34.647828872108946, 36.708095989675876, 38.890872965260044, 41.20344461410867, 43.65352892912541, 46.24930283895422, 48.99942949771858, 51.913087197493056, 55.0]
                let indexOfPitchAbove = pitches.findIndex((x) => {return x > pitchInOctave0}) //This is the pitch above
                let centsBelowNextNote = 1200.0 * Math.log2(pitchInOctave0/pitches[indexOfPitchAbove])
                let centsAbovePriorNote = 100.0 + centsBelowNextNote;
                let pitchClasses = ["A#","B","C","C#","D","D#","E","F","F#","G","G#","A"]
                if (centsAbovePriorNote <= -1 * centsBelowNextNote ){
                    let noteIndex = (indexOfPitchAbove - 1 + 12)% 12;
                    return [pitchClasses[noteIndex], Math.round(centsAbovePriorNote)];
                } else {
                    let noteIndex = indexOfPitchAbove;
                    return [pitchClasses[noteIndex], Math.round(centsBelowNextNote)];
                }
        };
       
 
 
        // Function to update the pitch display
        const updatePitchDisplay = () => {
            analyser.getByteFrequencyData(dataArray);
            const maxIndex = dataArray.indexOf(Math.max(...dataArray));
            const pitch = maxIndex * this.audioContext.sampleRate / analyser.fftSize;
            const [note, cents] = pitchClassAndCents(pitch);
            this.pitchDisplay.textContent = `${note}`;
            this.centsDisplay.textContent = `${cents}`;

            const maxAngle = 45; // Increased swing range
            const angle = ((cents / 50) * maxAngle)+180;
            this.pendulum.style.transform = `rotate(${angle}deg)`;

            const redIntensity = Math.min(255, Math.abs(cents) * 5);
            const greenIntensity = Math.max(0, 255 - Math.abs(cents) * 5);
            const color = `rgb(${redIntensity}, ${greenIntensity}, 0)`;
            this.pendulum.style.backgroundColor = color;
            this.pendulum.style.setProperty('--pendulum-color', color);

            requestAnimationFrame(updatePitchDisplay);
        };
 
        // Start the pitch detection loop
        updatePitchDisplay();
        })
        .catch(error => {
        console.error('Error accessing microphone:', error);
        });
    }
 };
 