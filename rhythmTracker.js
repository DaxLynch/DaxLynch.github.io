
class RhythmTracker {
    constructor(audioContext) {
        this.audioContext = audioContext;
        //this.pitchDisplay = document.getElementById("rhythm-tracker");
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
		analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0;

		const bufferLength = analyser.frequencyBinCount;
		const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray); 
    
        // Get a canvas defined with ID "oscilloscope"
        const canvas = document.getElementById("oscilloscope");
        const canvasCtx = canvas.getContext("2d");

        function draw() {
            requestAnimationFrame(draw);

            analyser.getByteTimeDomainData(dataArray);

            canvasCtx.fillStyle = "rgb(200 200 200)";
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = "rgb(0 0 0)";

            canvasCtx.beginPath();

            const sliceWidth = (canvas.width * 1.0) / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = (v * canvas.height) / 2;
                if (i === 0) {
                    canvasCtx.moveTo(x, y);
                } else {
                   canvasCtx.lineTo(x, y);
                }
                x += sliceWidth;
            }

            canvasCtx.lineTo(canvas.width, canvas.height / 2);
            canvasCtx.stroke();
        }

    draw();
    })
    }
};		
