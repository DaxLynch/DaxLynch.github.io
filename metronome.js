/* JS builtin timer works very poorly. Having a sound element played according to setInterval has a time error of 10's of ms to even seconds if the window is not active
WebAudio api, which is in all modern web browsers has much higher temporal accuracy,
but you can only schedule events to run in time, and you can't unschedule them. So
for a metronome you might want to schedule a bunch of events in the future, but if you
stop the metronome, they will continue to play.

SO the workaround is call setInterval on some sort of schedule function, that schedules
the next notes at the right time. It schedules in advanced a period in the 100ms, so when
you stop the metronome it might at most place for .1 seconds.
*/


class Metronome {
    constructor(audioContext) {
        
        this.audioContext = audioContext;
        this.audio = ["tick.wav"];                      //Names of audio files for metronome
        this.lastNote = this.audioContext.currentTime;  //Time the last note was played
        this.evalPeriod = .100;                         //Time the scheduler gets called in seconds
        this.notePeriod = .3;                        //Current period of the metronome in seconds
        this.playing = false;                           //Boolean if the metronome is playing
        this.sourceNode = null;                         //These three are for the audioBuffer, maybe not needed
        this.arrayBuffer = null;     
        this.response = null;
        this.audioBuffer = null;
 
        this.intervalId = null;                         //setInterval is assigned to this, so that 
                                                        //scheduler can be started and stopped        
        this.onOff = this.onOff.bind(this);             //Bind the onOff function to the class instance

        this.timeSignatureContainer = document.getElementById('time-signature-container');
        this.barContainer = document.getElementById('bar-container');
        this.timeSignatureInput = document.getElementById('time-signature-input');
        this.playButton = document.getElementById('play-button');
 
        // Set the initial time signature value, and set the listener
        this.timeSignature = this.timeSignatureInput.value;
        this.timeSignatureInput.addEventListener('input', (event) => {
            this.timeSignature = event.target.value;
            this.generateBar();
        }); 

        //generate the bar of icons
        this.generateBar(); 
        this.intervalId = setInterval(() => this.scheduler(),100)

        

    }
    onOff() {                                           //Allows the play button to operate as a toggle
        const currentValue = this.playButton.value;
        if (currentValue === "On") {
            this.playButton.value = "Off";
            console.log("Turned off");
            // Add code to stop the metronome if it's playing
            this.playing = false;
            this.lastNote = 0;
        } else {
            this.playButton.value = "On";
            console.log("Turned on");
            // Add code to start the metronome if it's not playing
            this.playing = true;
            this.lastNote = this.audioContext.currentTime;
        }
    }

    scheduler(){                                        //Schedules the next notes
        console.log("Scheduler Called")
        if (this.playing){
            while(this.lastNote + this.notePeriod < this.audioContext.currentTime + this.evalPeriod){
                this.lastNote = this.lastNote + this.notePeriod;
                this.sourceNode.start(this.lastNote + this.notePeriod);// This plays the note
                this.sourceNode = this.audioContext.createBufferSource(); //Every time you play a AudioBufferSourceNode it deletes it
                this.sourceNode.buffer = this.audioBuffer; //The above line recreates the node object, and this fills its buffer
                this.sourceNode.connect(this.audioContext.destination); //This connects the output to the speaker
            }
        }
    }  
    async initialize(){                          //Initializes the WebAudio objects and starts the scheduler

        // Add the event listener to the play/pause button
        this.playButton.addEventListener('click', this.onOff);

        //initialize the time
        this.lastNote = this.audioContext.currentTime;
        
        //Load the initial audio
        const response = await fetch(this.audio[0]);
        this.arrayBuffer = await response.arrayBuffer();
        this.audioBuffer = await this.audioContext.decodeAudioData(this.arrayBuffer);
        this.sourceNode = this.audioContext.createBufferSource();
        this.sourceNode.buffer = this.audioBuffer;
        this.sourceNode.connect(this.audioContext.destination);
    }
   
    generateBar() {
        this.barContainer.innerHTML = ''; // Clear the previous bar

        const beatsPerBar = parseInt(this.timeSignatureInput.value);

        console.log(beatsPerBar);
    
        for (let i = 0; i < beatsPerBar; i++) {
            const beatContainer = document.createElement('div');
            beatContainer.classList.add('beat-container');

            const soundFileNames = ['assets/chime.png', 'assets/cymbal.png', 'assets/cowbell.png'];
            soundFileNames.forEach((iconSrc, index) => {
                const iconImg = document.createElement('img');
                iconImg.src = iconSrc;
                iconImg.alt = `Sound ${index + 1}`;
                iconImg.dataset.sound = index; // Store the sound index as data
                iconImg.addEventListener('click', this.handleSoundSelection.bind(this));
                beatContainer.appendChild(iconImg);
            })

            this.barContainer.appendChild(beatContainer);
        }
    }




    handleSoundSelection(event) {
        const selectedSound = parseInt(event.target.dataset.sound);
        const beatIndex = Array.from(event.target.parentNode.parentNode.children).indexOf(event.target.parentNode);
        // Update the metronome with the selected sound and beat index
        updateMetronomeSound(selectedSound, beatIndex);
    }
    updateMetronomeSound(selectedSound, beatIndex) {
        // Implement your metronome update logic here
    console.log(`Selected sound ${selectedSound} for beat ${beatIndex}`);
    }
       
}
