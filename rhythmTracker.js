
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
       
        this.sensitivity = 0         //Arbitrary number, should be adjustable by user.
        this.temporalSensitivity = 1/4 //I.e, the algo wont detect a beat 1/4 of a BPM after the last, this is so a single peak isn't detected multiple times
        this.lastAmplitude = 0 
        
        this.BPM = 90.0
        this.notePeriod = 60.0/this.BPM //Time in between each click in seconds

        this.lastBeatTime = this.audioContext.currentTime;
        this.beatSpacing = (60.0 * this.temporalSensitivity /  this.BPM) 
        
        this.startTime = this.audioContext.currentTime;
        this.metronomeBeatArrays = []
        this.recordedBeatArrays = []
       
        this.bars = 4; 
        this.beats = 4
    
        this.record = this.record.bind(this);             //Bind the record function to the class instance

        this.recording = false
        const button = document.getElementById("rhythm-button")
        button.addEventListener("click", () => {
            this.recordedBeatArrays = []
            this.metronomeBeatArrays = []
            this.startTime = this.audioContext.currentTime;
            this.schedule();
            this.recording = true
        })

        this.sourceNode = null;                         //These are for the audioBuffers
        this.arrayBuffer = null;     
        this.audioBuffer = null;
    }

    async initialize() {
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

        //Load the initial audio
        const response = await fetch("tick.wav");
        this.arrayBuffer = await response.arrayBuffer();
        this.audioBuffer = await this.audioContext.decodeAudioData(this.arrayBuffer);
        this.sourceNode = this.audioContext.createBufferSource();
        this.sourceNode.buffer = this.audioBuffer;
        this.sourceNode.connect(this.audioContext.destination);
        requestAnimationFrame(this.record);
    }
    
    schedule(){ //Do we want to allow changes in time signature???

        for (let i = 0; i < (this.bars+1)*this.beats; i++){ //This counts you in an extra bar
        //Make sure to set startTime = currentTIme when you atart this fuction

            if (i > this.beats - 1) {
                this.metronomeBeatArrays.push(this.startTime + i * this.notePeriod)
            }
            this.sourceNode.start(this.startTime + i * this.notePeriod)
            this.sourceNode = this.audioContext.createBufferSource();
            this.sourceNode.buffer = this.audioBuffer;
            this.sourceNode.connect(this.audioContext.destination); 
        }
        this.stopTime = this.metronomeBeatArrays[this.beats*this.bars -1] + this.notePeriod; //Stop recording 1 beat after the final metronome click
    }

    record(){
        requestAnimationFrame(this.record);
        if (this.recording && this.audioContext.currentTime < this.stopTime){

            this.analyser.getByteFrequencyData(this.dataArray);     
            let limit = this.bufferLength
            if (this.bufferLength >  1024) {
                limit = limit / (this.analyser.fftSize/2048)
            }
            
            let power = 0  //This is a quantity proportional to the power in the spectrum
            for (let i = 0; i < limit; i++) {
                power += this.dataArray[i]
            }
            if (power > this.sensitivity && (this.audioContext.currentTime > this.lastBeatTime + this.beatSpacing)){
                console.log("Beat Detected")
                console.log(power)
                this.recordedBeatArrays.push(this.audioContext.currentTime)
                this.lastBeatTime = this.audioContext.currentTime;
            }
        }
        if (this.recording == true && this.audioContext.currentTime > this.stopTime){
            this.recording = false;
        }
    }

    draw() {
        const dataArray = this.dataArray
        this.canvasCtx.fillStyle = "rgb(200 200 200)";
        this.canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.canvasCtx.lineWidth = 2;
        this.canvasCtx.strokeStyle = "rgb(0 0 0)";

        this.canvasCtx.beginPath();

        let x = 0;
        let amplitude = 0
        let limit = this.bufferLength
        if (this.bufferLength >  1024) {
            limit = limit / (this.analyser.fftSize/2048)
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
            console.log("Beat Detected")
            console.log(amplitude)
            this.lastAmplitude = amplitude
            this.lastBeatTime = this.audioContext.currentTime;
        }
        
        this.canvasCtx.lineTo(this.canvas.width, this.canvas.height / 2);
        this.canvasCtx.stroke();
}

  
};		
