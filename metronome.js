class Metronome {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.audioFiles = ["assets/tick.wav", "assets/chime.wav", "assets/cymbal.wav","assets/tick_high.wav", "assets/chime_high.wav", "assets/cymbal_high.wav"]; // Add the high-pitched sound for the first beat

        this.lastNote = this.audioContext.currentTime; // Time the last note was played
        this.lastNoteP = this.audioContext.currentTime; // Time the last note was played, polyrhythm
        this.evalPeriod = 0.100; // Time the scheduler gets called in seconds
        this.playing = false; // Boolean if the metronome is playing
        this.arrayBuffer = [];
        this.audioBuffer = [];
        this.polyrhythmActive = false;
        this.intervalId = null; // setInterval is assigned to
        this.onOff = this.onOff.bind(this);
        this.polyOnOff = this.polyOnOff.bind(this);

        this.timeSignatureContainer = document.getElementById('time-signature-container');
        this.barsContainer = document.getElementById('bars-container');
        this.barContainer = document.getElementById('bar-container');
        this.polyBarContainer = document.getElementById('poly-bar-container');
        this.timeSignatureInput = document.getElementById('time-signature-input');
        this.bpmInput = document.getElementById('bpm-input'); // Get the BPM input element
        this.polyInput = null; 
        this.playButton = document.getElementById('play-button');
        this.polyButton = document.getElementById('poly-button');

        this.polyRatio  = 3.0/2.0;

        this.currentBeat = 0; // keeps track of current beat
        this.currentBeatP = 0; // keeps track of current beat
        this.timeSignature =  4;
        this.timeSignatureP = this.timeSignature * this.polyRatio;
        this.bpm = this.bpmInput.value; // Get the initial BPM value

        this.audiosPerBeat = [0,0,0,0]; //keeps track of which audio is to be played
        this.audiosPerBeatP = Array(Math.ceil(this.timeSignatureP)).fill(1);  //keeps track of which audio is to be played, polyrhythm

        this.notePeriod = 60 / this.bpm; // Calculate the initial note period based on BPM
        this.notePeriodP = 60 / (this.bpm  * this.polyRatio); // Calculate the polyrhythms initial note period based on BPM

        this.timeSignatureInput.addEventListener('input', (event) => {
            this.timeSignature = parseInt(event.target.value);
            this.timeSignatureP = this.timeSignature * this.polyRatio;
            this.playButton.value = "Off";
            this.lastNote = 0;
            this.lastNoteP = 0;
            this.playing = false;
            this.generateBar();
        }); 

        // Add event listener to update BPM and note period when BPM changes
        this.bpmInput.addEventListener('input', (event) => {
            this.bpm = parseInt(event.target.value);
            this.playButton.value = "Off";
            this.lastNote = 0;
            this.lastNoteP = 0;
            this.playing = false;
                
            this.notePeriod = 60 / this.bpm; // Update note period based on new BPM
            this.notePeriodP = 60 / (this.bpm  * this.polyRatio); // Calculate the polyrhythms initial note period based on BPM
        });

        // Add event listener to polyButton to toggle polyrhythm mode
        this.polyButton.addEventListener('click', this.polyOnOff);

        this.generateBar();
        this.intervalId = setInterval(() => this.scheduler(), 100);
    }

    onOff() { // Allows the play button to operate as a toggle
        const currentValue = this.playButton.value;
        if (currentValue === "On") {
            this.playButton.value = "Off";
            console.log("Turned off"); // Add code to stop the metronome if it's playing
            this.playing = false;
            this.lastNote = 0;
            this.lastNoteP = 0;
        } else {
            this.playButton.value = "On"; 
            console.log("Turned on");
            this.playing = true;
            this.lastNote = this.audioContext.currentTime - this.notePeriod + 0.001;
            if (this.polyrhythmActive) {
                this.lastNoteP = this.audioContext.currentTime - this.notePeriodP + 0.001;
            }
            this.currentBeat = 0; // Reset the current beat when the metronome starts.
            this.currentBeatP = 0; // Reset the current beat when the metronome starts.
        }
    }

    polyOnOff() { // Allows the poly button to operate as a toggle
        const currentValue = this.polyButton.value;
        if (currentValue === "On") {
            this.polyButton.innerText = "Add Polyrhythm";
            this.polyButton.value = "Off";
            this.playButton.value = "Off";
            this.polyrhythmActive = false;
            this.lastNote = 0;
            this.lastNoteP = 0;
            this.playing = false;
            document.getElementById("time-signature-container").removeChild(this.polyInputLabel);
            document.getElementById("time-signature-container").removeChild(this.polyInput);
            
            this.generateBar();
        } else {
            this.polyButton.value = "On";
            this.playButton.value = "Off";

            this.polyInput = document.createElement('input');
            this.polyInputLabel = document.createElement('label');
            this.polyInput.type = "number";
            this.polyInput.id = "poly-input";
            this.polyInput.min = "3";
            this.polyInput.value = "6";
            this.polyInput.max = "9";
            this.polyInputLabel.htmlFor = "poly-input";
            this.polyInputLabel.innerText  = "Time Signature for Poly";
            document.getElementById("time-signature-container").appendChild(this.polyInputLabel);
            document.getElementById("time-signature-container").appendChild(this.polyInput);
            this.polyInput.addEventListener('input', (event) => {
                this.polyRatio = event.target.value / this.timeSignature;
                this.timeSignatureP = this.timeSignature * this.polyRatio;
                this.notePeriodP = 60 / (this.bpm  * this.polyRatio); // Calculate the polyrhythms initial note period based on BPM
                this.playButton.value = "Off";
                this.lastNote = 0;
                this.lastNoteP = 0;
                this.playing = false;
                
                this.generateBar();
            });
            this.polyButton.innerText = "Remove Polyrhythm";
            this.polyrhythmActive = true;
            this.lastNote = 0; 
            this.lastNoteP = 0;
            this.currentBeat = 0; 
            this.currentBeatP = 0; 
            this.playing = false;
            this.generateBar();
        }
    }

    playNote() {
        const beatIndex = this.currentBeat % this.timeSignature;
        const sourceNode = this.audioContext.createBufferSource();
        if (beatIndex === 0) { // First note of a bar
            sourceNode.buffer = this.audioBuffer[this.audiosPerBeat[beatIndex] + this.audioFiles.length / 2]; // High-pitched sound
        } else { // Not the first beat of the bar
            sourceNode.buffer = this.audioBuffer[this.audiosPerBeat[beatIndex]];
        }
        sourceNode.connect(this.audioContext.destination);
        sourceNode.start(this.lastNote + this.notePeriod);
        this.lastNote += this.notePeriod;
        this.currentBeat++;
    }

    playNotePoly() {
        const beatIndex = this.currentBeat % this.timeSignature;
        const beatIndexP = this.currentBeatP % Math.ceil(this.timeSignatureP);
    
        const sourceNode = this.audioContext.createBufferSource();
        const sourceNodeP = this.audioContext.createBufferSource();
    
        if (this.lastNote <= this.lastNoteP) {
            // Play the regular track note
            if (beatIndex === 0) {
                sourceNode.buffer = this.audioBuffer[this.audiosPerBeat[beatIndex] + this.audioFiles.length / 2];
            } else {
                sourceNode.buffer = this.audioBuffer[this.audiosPerBeat[beatIndex]];
            }
            sourceNode.connect(this.audioContext.destination);
            sourceNode.start(this.lastNote + this.notePeriod);
            this.lastNote += this.notePeriod;
            this.currentBeat++;
        }
    
        if (this.lastNoteP <= this.lastNote) {
            // Play the polyrhythm note
            if (beatIndexP === 0) {
                sourceNodeP.buffer = this.audioBuffer[this.audiosPerBeatP[beatIndexP] + this.audioFiles.length / 2];
            } else {
                sourceNodeP.buffer = this.audioBuffer[this.audiosPerBeatP[beatIndexP]];
            }
            sourceNodeP.connect(this.audioContext.destination);
            sourceNodeP.start(this.lastNoteP + this.notePeriodP);
            this.lastNoteP += this.notePeriodP;
            this.currentBeatP++;
        }
    }

    scheduler() { // Schedules the next notes
        if (this.playing) {
            if (this.polyrhythmActive === false) {
                while (this.noteToBePlayed()) {
                    this.playNote();
                }
            } else { 
                while (this.noteToBePlayed()) {
                    this.playNotePoly();
                }
            }
        }
    }

    noteToBePlayed() {
        if (this.polyrhythmActive === false) {
            return this.lastNote + this.notePeriod < this.audioContext.currentTime + this.evalPeriod;
        } else {
            return (this.lastNote + this.notePeriod < this.audioContext.currentTime + this.evalPeriod) || 
                   (this.lastNoteP + this.notePeriodP < this.audioContext.currentTime + this.evalPeriod);
        }
    }

    async initialize() { // Initializes the WebAudio objects and starts the scheduler
        this.playButton.addEventListener('click', this.onOff);
        this.polyButton.addEventListener('click', this.polyOnOff);

        // Load the audio files
        for (let i = 0; i < this.audioFiles.length; i++) { // initializes the audio files from array
            const response = await fetch(this.audioFiles[i]);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.arrayBuffer.push(arrayBuffer);
            this.audioBuffer.push(audioBuffer);
        }
    }

    generateBar() { // Generates the bar of icons
        const beatsPerBar = parseInt(this.timeSignatureInput.value);
        if (!isNaN(beatsPerBar)) {
            if (this.polyrhythmActive === false) {
                this.audiosPerBeat = Array(beatsPerBar).fill(0);
                this.polyBarContainer.innerHTML = '';
                this.barContainer.innerHTML = '';
                for (let i = 0; i < beatsPerBar; i++) {
                    const beatContainer = document.createElement('div');
                    beatContainer.classList.add('beat-container'); // Create a container

                    const soundFileNames = ['assets/cowbell.png', 'assets/chime.png', 'assets/cymbal.png'];
                    soundFileNames.forEach((iconSrc, index) => {
                        const iconImg = document.createElement('img');
                        iconImg.src = iconSrc;
                        iconImg.alt = `Sound ${index + 1}`;
                        iconImg.dataset.sound = index; // Store the sound index as data
                        iconImg.dataset.track = "standard"; // Store which track it belongs to
                        iconImg.addEventListener('click', this.handleSoundSelection.bind(this));
                        beatContainer.appendChild(iconImg);
                    });

                    this.barContainer.appendChild(beatContainer);
                }
            } else {
                this.audiosPerBeat = Array(beatsPerBar).fill(0);
                this.barContainer.innerHTML = '';
                for (let i = 0; i < beatsPerBar; i++) {
                    const beatContainer = document.createElement('div');
                    beatContainer.classList.add('beat-container'); // Create a container

                    const soundFileNames = ['assets/cowbell.png', 'assets/chime.png', 'assets/cymbal.png'];
                    soundFileNames.forEach((iconSrc, index) => {
                        const iconImg = document.createElement('img');
                        iconImg.src = iconSrc;
                        iconImg.alt = `Sound ${index + 1}`;
                        iconImg.dataset.sound = index; // Store the sound index as data
                        iconImg.dataset.track = "standard"; // Store which track it belongs to
                        iconImg.addEventListener('click', this.handleSoundSelection.bind(this));
                        beatContainer.appendChild(iconImg);
                    });

                    this.barContainer.appendChild(beatContainer);
                }

                const polyBeatsPerBar = Math.ceil(beatsPerBar * this.polyRatio);
                this.audiosPerBeatP = Array(polyBeatsPerBar).fill(1);
                this.polyBarContainer.innerHTML = '';
                for (let i = 0; i < polyBeatsPerBar; i++) {
                    const beatContainer = document.createElement('div');
                    beatContainer.classList.add('beat-container'); // Create a container

                    const soundFileNames = ['assets/cowbell.png', 'assets/chime.png', 'assets/cymbal.png'];
                    soundFileNames.forEach((iconSrc, index) => {
                        const iconImg = document.createElement('img');
                        iconImg.src = iconSrc;
                        iconImg.alt = `Sound ${index + 1}`;
                        iconImg.dataset.sound = index; // Store the sound index as data
                        iconImg.dataset.track = "poly"; // Store which track it belongs to
                        iconImg.addEventListener('click', this.handleSoundSelection.bind(this));
                        beatContainer.appendChild(iconImg);
                    });

                    this.polyBarContainer.appendChild(beatContainer);
                }
            }
        }
    }

    handleSoundSelection(event) {
        const selectedSound = parseInt(event.target.dataset.sound);
        const beatIndex = Array.from(event.target.parentNode.parentNode.children).indexOf(event.target.parentNode);
        const track = event.target.dataset.track;
        this.updateMetronomeSound(selectedSound, beatIndex, track);
    }

    updateMetronomeSound(selectedSound, beatIndex, track) {
        if (track === "standard") {
            this.audiosPerBeat[beatIndex] = selectedSound;
        } else {
            this.audiosPerBeatP[beatIndex] = selectedSound;
        }
        console.log(`Selected sound ${selectedSound} for beat ${beatIndex} for the ${track} track`);
    }
}
