class Tuner {
    constructor(audioContext, pitchDisplayId) {
        this.audioContext = audioContext;
        this.pitchDisplay = document.getElementById(pitchDisplayId);
    }

    initialize() {
	navigator.mediaDevices.getUserMedia({ audio: true })
	    .then(stream => {
		// Set up the audio context and analyzer
		const analyser = audioContext.createAnalyser();
		const source = audioContext.createMediaStreamSource(stream);
		source.connect(analyser);

		// Set up the analyser
		analyser.fftSize = 2048;
		const bufferLength = analyser.frequencyBinCount;
		const dataArray = new Uint8Array(bufferLength);

		// Function to update the pitch display
		const updatePitchDisplay = () => {
		    analyser.getByteFrequencyData(dataArray);
		    const maxIndex = dataArray.indexOf(Math.max(...dataArray));
		    const pitch = Math.round(maxIndex * audioContext.sampleRate / analyser.fftSize);
		    this.pitchDisplay.textContent = `${pitch} Hz`;
		    requestAnimationFrame(updatePitchDisplay);
		}

		// Start the pitch detection loop
		updatePitchDisplay();
	    })
	    .catch(error => {
		console.error('Error accessing microphone:', error);
	    });
    }
};		
