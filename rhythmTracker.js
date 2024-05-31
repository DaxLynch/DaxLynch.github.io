
class RhythmTracker {
    constructor(audioContext) {

        //Canvas variables and functions
        this.draw = this.draw.bind(this);                       //Bind the onOff function to the class instance
        this.canvas = document.getElementById("rhythm-display");
        this.scroller = document.getElementById("scrolling-triangle");
        this.canvasCtx = this.canvas.getContext("2d");
        this.canvas.width = .75 * window.innerWidth;
    
		// Set up the analyser
        this.audioContext = audioContext;
        this.analyser = audioContext.createAnalyser();
        this.bufferLength = this.analyser.frequencyBinCount;
		this.dataArray = new Uint8Array(this.bufferLength);
        this.analyser.minDecibels = -50;
        this.analyser.maxDecibels = 0;
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0;
       
        //Audio Buffer variables 
        this.sourceNode = null;   
        this.arrayBuffer = null;     
        this.audioBuffer = null;

       
        this.BPM = 90.0
        this.bars = 4; 
        this.beats = 4
        this.notePeriod = 60.0/this.BPM                         //Time in between each click in seconds

        //Variables for beat detection algorithm
        this.sensitivity = 200                                  //Arbitrary number, should be adjustable by user.
        this.temporalSensitivity = 1/3                          //Stops a beat being detected within 1/3 of a BPM period 
        this.lastBeatTime = this.audioContext.currentTime;
        this.beatSpacing = (60.0 * this.temporalSensitivity /  this.BPM) 
        
        //Variables for recording beats
        this.startTime = this.audioContext.currentTime;
        this.metronomeBeatArray = []
        this.recordedBeatArray = []
        this.record = this.record.bind(this);                   //Bind the record function to the class instance
        this.recording = false
        
        const button = document.getElementById("rhythm-button")
        button.addEventListener("click", () => {               //If play is clicked, schedule the metronome beats and start recording
            if (this.recording == false){                      //Dont record if we are already recording
                this.recordedBeatArray = []                    
                this.metronomeBeatArray = []
                this.startTime = this.audioContext.currentTime;
                this.schedule();
                this.recording = true
            }
        })

    }

    async initialize() {
	navigator.mediaDevices.getUserMedia({ audio: true })
	    .then(stream => {
		// Set up the audio context and analyzer
		const source = audioContext.createMediaStreamSource(stream);
        const analyser = this.analyser;
		source.connect(analyser);

        this.bufferLength = analyser.frequencyBinCount
        analyser.getByteFrequencyData(this.dataArray);        

        this.draw() 
        }) 

        //Load the initial audio
        const response = await fetch("assets/tick.wav");
        this.arrayBuffer = await response.arrayBuffer();
        this.audioBuffer = await this.audioContext.decodeAudioData(this.arrayBuffer);
        this.sourceNode = this.audioContext.createBufferSource();
        this.sourceNode.buffer = this.audioBuffer;
        this.sourceNode.connect(this.audioContext.destination);
        requestAnimationFrame(this.record);                   //Call record every frame
    }
    
    schedule(){
        for (let i = 0; i < (this.bars+1)*this.beats; i++){  //This counts you in an extra bar
            if (i > (this.beats - 1)) {                      //THis ensures you don't record the count in beats
                this.metronomeBeatArray.push(this.startTime + i * this.notePeriod)
            }
            //Schedule the sound and refresh the bufferSourceNode
            this.sourceNode.start(this.startTime + i * this.notePeriod)
            this.sourceNode = this.audioContext.createBufferSource();
            this.sourceNode.buffer = this.audioBuffer;
            this.sourceNode.connect(this.audioContext.destination); 
        }
        //Stop recording 1 beat after the final metronome click
        this.stopTime = this.metronomeBeatArray[this.beats*this.bars -1] + this.notePeriod;
    }

    record(){
        requestAnimationFrame(this.record);                  //This is running once per frame
        if (this.recording && (this.audioContext.currentTime < this.stopTime) && (this.audioContext.currentTime > this.metronomeBeatArray[0])){

            //The above if statement means we should only record once recording is true,
            //and after the count in and up to 1 beat after the final metronome click
            this.analyser.getByteFrequencyData(this.dataArray);     
            let limit = this.bufferLength
            if (this.bufferLength >  1024) {
                limit = limit / (this.analyser.fftSize/2048)
            }
            
            let power = 0                                    //This is a quantity proportional to the power in the spectrum
            for (let i = 0; i < limit; i++) {
                power += this.dataArray[i]                   //This line numerically integrates the power
            }
            if (power > this.sensitivity && (this.audioContext.currentTime > this.lastBeatTime + this.beatSpacing)){
                //The above tests if the current power of the spectrum is higher than the sensitivity, and then
                //if it has been less than the beat spacing

                //Record the detected beat
                this.recordedBeatArray.push(this.audioContext.currentTime)
                this.lastBeatTime = this.audioContext.currentTime;
            }
        }

        this.draw() 
        if (this.recording == true && this.audioContext.currentTime > this.stopTime){ 
            //If we are passed the stopTime but recording is still on, turn it off and draw
            this.recording = false;
        }
    }

    draw() {
        //Simple function to draw each line on the graph
        this.canvasCtx.fillStyle = "rgb(200 200 200)";
        this.canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.canvasCtx.lineWidth = 2;
        this.canvasCtx.strokeStyle = "rgb(0 0 0)";
        
        const currentTime = this.audioContext.currentTime;
        const startTime = this.metronomeBeatArray[0] - (1 * this.notePeriod); //This is 1 beat before the first metronome beat
        const stopTime = this.stopTime;                                 //This is 1 beat after the final metronome click 
        const ctx = this.canvasCtx;
        const canvas = this.canvas;
        const canvasWidth = canvas.width;
        const timeScale = canvasWidth / (stopTime - startTime); 

        if (currentTime >= startTime && currentTime <= stopTime){
            const scrollerX = (currentTime - startTime) * timeScale;
            this.scroller.style.left = `${scrollerX}px + 10px`;
        }

        

        ctx.strokeStyle = 'black';
        for (let i = 0; i < this.beats*this.bars; i++){
            let beat = this.metronomeBeatArray[i];
            if ((i % this.beats) == 0){
                this.canvasCtx.lineWidth = 4;
            }
            const x = (beat - startTime ) * timeScale;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
            if ((i % this.beats) == 0){
                this.canvasCtx.lineWidth = 2;
            }
        }
       
        ctx.strokeStyle = 'red';
        this.recordedBeatArray.forEach(beat => {
            const x = (beat - startTime - .1) * timeScale;             //.25 represents the FFT latency on my machine
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }); 
           
    }

  
};		
