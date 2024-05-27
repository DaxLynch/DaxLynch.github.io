//Fixed tuner error, one small one where sometimes it spits undefined for the note, as I think a negative one is given to the pitches array. Please fix


class Tuner {
    constructor(audioContext, pitchDisplayId) {

        this.audioContext = audioContext;

		// Set up the analyser
		this.analyser = this.audioContext.createAnalyser();
        this.analyser.minDecibels = -80;
		this.analyser.fftSize = 32768;
        this.analyser.smoothingTimeConstant = 0;
        this.bufferLength = this.analyser.frequencyBinCount;
		this.dataArray = new Uint8Array(this.bufferLength);
        	
        this.pitchDisplay = document.getElementById(pitchDisplayId);
        this.updatePitchDisplay = this.updatePitchDisplay.bind(this)
    }

    initialize() {
	navigator.mediaDevices.getUserMedia({ audio: true })
	    .then(stream => {
		// Set up the audio context and analyzer
		const source = this.audioContext.createMediaStreamSource(stream);
		source.connect(this.analyser);

		// Start the pitch detection loop
		this.updatePitchDisplay();
	    })
	    .catch(error => {
		console.error('Error accessing microphone:', error);
	    });
    }

    updatePitchDisplay(){
		    this.analyser.getByteFrequencyData(this.dataArray);
		    const maxIndex = this.dataArray.indexOf(Math.max(...this.dataArray));
		    let pitch = maxIndex * this.audioContext.sampleRate / this.analyser.fftSize;
            let pCAC = this.pitchClassAndCents(pitch);
		    this.pitchDisplay.textContent = `${pCAC[1]} cents away from ${pCAC[0]}`;
		    requestAnimationFrame(this.updatePitchDisplay);
		}

    pitchClassAndCents(pitch){
        if (pitch == 0) { return ["0", 0];};                                          //If FFT does not have a signal, return 0,0
        let pitchInOctave0 = pitch;
        while (pitchInOctave0 > 55.0){                                                //This ensures pitch in octave0 is greater than 27.5
            pitchInOctave0 = pitchInOctave0/2;
        }
        //Below are the pitches for the notes in octave 0. 
        let pitches = [29.13523509488056, 30.867706328507698, 32.703195662574764, 34.647828872108946, 36.708095989675876, 38.890872965260044, 41.20344461410867, 43.65352892912541, 46.24930283895422, 48.99942949771858, 51.913087197493056, 55.0]
        let indexOfPitchAbove = pitches.findIndex((x) => {return x > pitchInOctave0}) //This is the freq of the note above the given  pitch

        let centsBelowNextNote = 1200.0 * Math.log2(pitchInOctave0/pitches[indexOfPitchAbove])
        let centsAbovePriorNote = 100.0 + centsBelowNextNote;

        let pitchClasses = ["A#","B","C","C#","D","D#","E","F","F#","G","G#","A"]
        if (centsAbovePriorNote <= -1 * centsBelowNextNote ){                         //Calculating which note is closest to given pitch, and returning that note and the distance
            let noteIndex = (indexOfPitchAbove - 1 + 12)% 12;                                         
            return [pitchClasses[noteIndex], Math.round(centsAbovePriorNote)];
        } else {
            let noteIndex = indexOfPitchAbove;
            return [pitchClasses[noteIndex], Math.round(centsBelowNextNote)];
        }
    };

};		
