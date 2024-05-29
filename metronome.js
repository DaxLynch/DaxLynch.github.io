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

        this.timeSignatureContainer = document.getElementById('time-signature-container');
        this.barContainer = document.getElementById('bar-container');
        this.timeSignatureInput = document.getElementById('time-signature-input');
        this.bpmInput = document.getElementById('bpm-input'); // Get the BPM input element
        this.playButton = document.getElementById('play-button');

        this.polyRatio  = 3.0/2.0

        this.currentBeat = 0; // keeps track of current beat
        this.currentBeatP = 0; // keeps track of current beat
        this.timeSignature =  4;
        this.timeSignatureP = this.timeSignature * this.polyRatio
        this.bpm = this.bpmInput.value; // Get the initial BPM value

        this.audiosPerBeat = [0,0,0,0] //keeps track of which audio is to be played
        this.audiosPerBeatP = Array(this.timeSignatureP).fill(1)  //keeps track of which audio is to be played, polyrhythm

        this.notePeriod = 60 / this.bpm; // Calculate the initial note period based on BPM
        this.notePeriodP = 60 / (this.bpm  * this.polyRatio); // Calculate the polyrhythms initial note period based on BPM

        this.timeSignatureInput.addEventListener('input', (event) => {
            this.timeSignature = event.target.value;
            this.timeSignatureP = this.timeSignature * this.polyRatio
            this.generateBar();
        });

        // Add event listener to update BPM and note period when BPM changes
        this.bpmInput.addEventListener('input', (event) => {
            this.bpm = event.target.value;
            this.notePeriod = 60 / this.bpm; // Update note period based on new BPM
            this.notePeriodP = 60 / (this.bpm  * this.polyRatio); // Calculate the polyrhythms initial note period based on BPM
        });

        //Need A polyrhythm button


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
            this.lastNote = this.audioContext.currentTime - this.notePeriod + .001;
            this.lastNoteP = this.lastNote + this.notePeriod - this.notePeriodP; //remove this or alter it for polyrhythms n shit
            this.polyrhythmActive = true
            this.currentBeat = 0; // Reset the current beat when the metronome starts.
            this.currentBeatP = 0; // Reset the current beat when the metronome starts.
        }
    }

    playNote() {
        const beatIndex = this.currentBeat % this.timeSignature;
    
        const sourceNode = this.audioContext.createBufferSource();
        if (beatIndex == 0){ //We are on the first note of a bar, so play the uppitched version
            sourceNode.buffer = this.audioBuffer[this.audiosPerBeat[beatIndex] + this.audioFiles.length/2]; //The audioFiles should have each audio.wav in a list, and then each audio_high.wav
        }
        else { //We are NOT on the first beat of the bar
            sourceNode.buffer = this.audioBuffer[this.audiosPerBeat[beatIndex]];
        }
        sourceNode.connect(this.audioContext.destination);
        sourceNode.start(this.lastNote + this.notePeriod);
        this.lastNote += this.notePeriod;
        this.currentBeat++;
    }
    playNotePoly() {
        const beatIndex = this.currentBeat % this.timeSignature;
        const beatIndexP = this.currentBeatP % this.timeSignatureP;
    
        const sourceNode = this.audioContext.createBufferSource();
        //Figure out which beat get played next,
        console.log(beatIndex)
        console.log(beatIndexP)
        if ((beatIndex == 0) && (beatIndexP == 0)){ //If both beats are at 0, play only the first track
            //Play the first sound, increment both sets,
            sourceNode.buffer = this.audioBuffer[0 + this.audioFiles.length/2];  //FIXME once new sounds are added
            sourceNode.connect(this.audioContext.destination);
            sourceNode.start(this.lastNote + this.notePeriod);

            this.currentBeatP++;
            this.currentBeat++;
            this.lastNote += this.notePeriod;
            this.lastNoteP += this.notePeriodP; 
        } else {if (this.lastNote + this.notePeriod < this.lastNoteP + this.notePeriodP){ //Playing the normal track
             if (beatIndex == 0){ //First Track First Beat
                sourceNode.buffer = this.audioBuffer[this.audiosPerBeat[beatIndex] + this.audioFiles.length/2]; 
            }
            else { //First track not first beat
                sourceNode.buffer = this.audioBuffer[this.audiosPerBeat[beatIndex]];
            }
            this.currentBeat++;
            sourceNode.connect(this.audioContext.destination);
            sourceNode.start(this.lastNote + this.notePeriod);
            this.lastNote += this.notePeriod; 
        } else {   //The polyrhythm note is to be played next
             if (beatIndexP == 0){ //Second Track First Beat
                sourceNode.buffer = this.audioBuffer[1]//this.audiosPerBeatP[beatIndexP]  + this.audioFiles.length/2];   onnce new audios are in FIXME
            }
            else { //Second Track Not First Beat")
                sourceNode.buffer = this.audioBuffer[this.audiosPerBeatP[beatIndexP]];
            }
            this.currentBeatP++;
            sourceNode.connect(this.audioContext.destination);
            console.log(this.lastNoteP + this.notePeriodP)
            sourceNode.start(this.lastNoteP + this.notePeriodP);
            this.lastNoteP += this.notePeriodP; //Only do this if this is the note we incremented

        }}

     }

   scheduler() { // Schedules the next notes
        if (this.playing) {
            if (this.polyrhythmActive == false){
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
    noteToBePlayed(){
        if (this.polyrhythmActive == false){
                return (this.lastNote + this.notePeriod < this.audioContext.currentTime + this.evalPeriod) 
            } else { 
                return (this.lastNote + this.notePeriod < this.audioContext.currentTime + this.evalPeriod) || (this.lastNoteP + this.notePeriodP < this.audioContext.currentTime + this.evalPeriod)
        }
    }

    async initialize() { // Initializes the WebAudio objects and starts the scheduler
        this.playButton.addEventListener('click', this.onOff);

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
            this.audiosPerBeat = Array(beatsPerBar).fill(0) 
            this.barContainer.innerHTML = '';
            for (let i = 0; i < beatsPerBar; i++) {
                const beatContainer = document.createElement('div');
                beatContainer.classList.add('beat-container'); // Create a container

                const soundFileNames = ['assets/chime.png', 'assets/cymbal.png', 'assets/cowbell.png'];
                soundFileNames.forEach((iconSrc, index) => {
                    const iconImg = document.createElement('img');
                    iconImg.src = iconSrc;
                    iconImg.alt = `Sound ${index + 1}`;
                    iconImg.dataset.sound = index; // Store the sound index as data
                    iconImg.addEventListener('click', this.handleSoundSelection.bind(this));
                    beatContainer.appendChild(iconImg);
                });

                this.barContainer.appendChild(beatContainer);
            }
        }
    }

    handleSoundSelection(event) {
        const selectedSound = parseInt(event.target.dataset.sound);
        const beatIndex = Array.from(event.target.parentNode.parentNode.children).indexOf(event.target.parentNode);
        this.updateMetronomeSound(selectedSound, beatIndex);
    }

    updateMetronomeSound(selectedSound, beatIndex) {
        this.audiosPerBeat[beatIndex] = selectedSound;
        console.log(`Selected sound ${selectedSound} for beat ${beatIndex}`);
    }
}

