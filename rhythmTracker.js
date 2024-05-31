class RhythmTracker {
    constructor(audioContext) {
        //Canvas variables and functions
        this.draw = this.draw.bind(this);
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

        this.BPM = 90.0;
        this.bars = 4;
        this.beats = 4;
        this.notePeriod = 60.0 / this.BPM;

        //Variables for beat detection algorithm
        this.sensitivity = 200;
        this.temporalSensitivity = 1 / 3;
        this.lastBeatTime = this.audioContext.currentTime;
        this.beatSpacing = (60.0 * this.temporalSensitivity / this.BPM);

        //Variables for recording beats
        this.startTime = this.audioContext.currentTime;
        this.metronomeBeatArray = [];
        this.recordedBeatArray = [];
        this.record = this.record.bind(this);
        this.recording = false;

        const button = document.getElementById("rhythm-button");
        button.addEventListener("click", () => {
            if (this.recording == false) {
                this.recordedBeatArray = [];
                this.metronomeBeatArray = [];
                this.startTime = this.audioContext.currentTime;
                this.schedule();
                this.recording = true;
            }
        });
    }

    async initialize() {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                const source = audioContext.createMediaStreamSource(stream);
                const analyser = this.analyser;
                source.connect(analyser);

                this.bufferLength = analyser.frequencyBinCount;
                analyser.getByteFrequencyData(this.dataArray);

                this.draw();
            });

        // Load the initial audio for regular tick
        const response = await fetch("assets/tick.wav");
        this.arrayBuffer = await response.arrayBuffer();
        this.audioBuffer = await this.audioContext.decodeAudioData(this.arrayBuffer);
        this.sourceNode = this.audioContext.createBufferSource();
        this.sourceNode.buffer = this.audioBuffer;
        this.sourceNode.connect(this.audioContext.destination);

        // Load the high note for the beginning of each four bars
        const responseHigh = await fetch("assets/tick_high.wav");
        this.arrayBufferHigh = await responseHigh.arrayBuffer();
        this.audioBufferHigh = await this.audioContext.decodeAudioData(this.arrayBufferHigh);

        requestAnimationFrame(this.record);
    }

    schedule() {
        for (let i = 0; i < (this.bars + 1) * this.beats; i++) {
            if (i > (this.beats - 1)) {
                this.metronomeBeatArray.push(this.startTime + i * this.notePeriod);
            }

            if (i % (this.beats * this.bars) === 0) {
                const highSource = this.audioContext.createBufferSource();
                highSource.buffer = this.audioBufferHigh;
                highSource.connect(this.audioContext.destination);
                highSource.start(this.startTime + i * this.notePeriod);
            } else {
                const sourceNode = this.audioContext.createBufferSource();
                sourceNode.buffer = this.audioBuffer;
                sourceNode.connect(this.audioContext.destination);
                sourceNode.start(this.startTime + i * this.notePeriod);
            }
        }
        this.stopTime = this.metronomeBeatArray[this.beats * this.bars - 1] + this.notePeriod;
    }

    record() {
        requestAnimationFrame(this.record);
        if (this.recording && (this.audioContext.currentTime < this.stopTime) && (this.audioContext.currentTime > this.metronomeBeatArray[0])) {
            this.analyser.getByteFrequencyData(this.dataArray);
            let limit = this.bufferLength;
            if (this.bufferLength > 1024) {
                limit = limit / (this.analyser.fftSize / 2048);
            }

            let power = 0;
            for (let i = 0; i < limit; i++) {
                power += this.dataArray[i];
            }
            if (power > this.sensitivity && (this.audioContext.currentTime > this.lastBeatTime + this.beatSpacing)) {
                this.recordedBeatArray.push(this.audioContext.currentTime);
                this.lastBeatTime = this.audioContext.currentTime;
            }
        }

        this.draw();
        if (this.recording == true && this.audioContext.currentTime > this.stopTime) {
            this.recording = false;
        }
    }

    draw() {
        this.canvasCtx.fillStyle = "rgb(200 200 200)";
        this.canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.canvasCtx.lineWidth = 2;
        this.canvasCtx.strokeStyle = "rgb(0 0 0)";

        const currentTime = this.audioContext.currentTime;
        const startTime = this.metronomeBeatArray[0] - (1 * this.notePeriod);
        const stopTime = this.stopTime;
        const ctx = this.canvasCtx;
        const canvas = this.canvas;
        const canvasWidth = canvas.width;
        const timeScale = canvasWidth / (stopTime - startTime);

        const canvasRect = this.canvas.getBoundingClientRect();
        const containerRect = this.canvas.parentElement.getBoundingClientRect();
        const offsetX = canvasRect.left - containerRect.left;

        if (currentTime >= startTime && currentTime <= stopTime) {
            const scrollerX = (currentTime - startTime) * timeScale + offsetX;
            this.scroller.style.left = `${scrollerX}px`;
        }

        ctx.strokeStyle = 'black';
        for (let i = 0; i < this.beats * this.bars; i++) {
            let beat = this.metronomeBeatArray[i];
            if ((i % this.beats) == 0) {
                this.canvasCtx.lineWidth = 4;
            }
            const x = (beat - startTime) * timeScale;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
            if ((i % this.beats) == 0) {
                this.canvasCtx.lineWidth = 2;
            }
        }

        ctx.strokeStyle = 'red';
        this.recordedBeatArray.forEach(beat => {
            const x = (beat - startTime + .25) * timeScale;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        });
    }
};
