
class RhythmTracker {
    constructor(audioContext) {
        this.audioContext = audioContext;
        //this.pitchDisplay = document.getElementById("rhythm-tracker");
        this.temp = false;
        this.analyser = audioContext.createAnalyser();
        this.bufferLength = this.analyser.frequencyBinCount;
		//this.dataArray = new Float32Array(this.bufferLength);
		this.dataArray = new Uint8Array(this.bufferLength);
        this.canvasCtx = null;
        this.canvas = null;
        this.draw = this.draw.bind(this);             //Bind the onOff function to the class instance
    
		// Set up the analyser
        this.analyser.minDecibels = -50;
        this.analyser.maxDecibels = 0;
		this.analyser.fftSize = 2048*4;
        this.analyser.smoothingTimeConstant = 0;
       
        this.sensitivity = 200
        this.lastAmplitude = 0 
        
        this.BPM = 90.0
        this.lastBeatTime = this.audioContext.currentTime;
        this.beatSpacing = (30.0 / this.BPM) 
    }

    initialize() {
	navigator.mediaDevices.getUserMedia({ audio: true })
	    .then(stream => {
		// Set up the audio context and analyzer
		const source = audioContext.createMediaStreamSource(stream);
        const analyser = this.analyser
		source.connect(analyser);

        this.bufferLength = analyser.frequencyBinCount
        analyser.getByteFrequencyData(this.dataArray);        

        // Get a canvas defined with ID "oscilloscope"
        this.canvas = document.getElementById("oscilloscope");
        this.canvasCtx = this.canvas.getContext("2d");
        this.draw() 
        }) 
       // setInterval(this.draw,50)
    }

    draw() {
        const analyser = this.analyser
        const dataArray = this.dataArray

        
        requestAnimationFrame(this.draw);
        analyser.getByteFrequencyData(dataArray);

        this.canvasCtx.fillStyle = "rgb(200 200 200)";
        this.canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.canvasCtx.lineWidth = 2;
        this.canvasCtx.strokeStyle = "rgb(0 0 0)";

        this.canvasCtx.beginPath();

        let x = 0;
        let amplitude = 0
        let limit = this.bufferLength
        if (this.bufferLength >  1024) {
            limit = limit / (analyser.fftSize/2048)
        }
        const sliceWidth = (this.canvas.width * 1.0) / limit;
        for (let i = 0; i < limit; i++) {
           
            //const v = (dataArray[i] + 140.0)/140.0 
            const v = dataArray[i]/128.0 
            const y = (v * this.canvas.height);
            if (i === 0) {
                this.canvasCtx.moveTo(x, y);
            } else {
               this.canvasCtx.lineTo(x, y);
            }
            x += sliceWidth;
            amplitude += dataArray[i]
        }
        if (amplitude > this.sensitivity && this.audioContext.currentTime > this.lastBeatTime + this.beatSpacing){
            console.log("Peak")
            console.log(amplitude)
            this.lastAmplitude = amplitude
            this.lastBeatTime = this.audioContext.currentTime;
        }
        
        this.canvasCtx.lineTo(this.canvas.width, this.canvas.height / 2);
        this.canvasCtx.stroke();
}

  
};		
