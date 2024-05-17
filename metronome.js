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
//        this.metronomeDisplay = document.getElementById(metronomeDisplayId);
        this.audio = ["tick.wav"];
        this.lastNote = this.audioContext.currentTime;
        this.evalPeriod = .100; //in seconds
        this.notePeriod = 1.500;
        this.playing = false;
        this.sourceNode = null;
        this.intervalId = null;

        // Get a reference to the play/pause button
        this.playButton = document.getElementById('play-button');

        // Bind the onOff function to the class instance
        this.onOff = this.onOff.bind(this);

        // Add the event listener to the play/pause button
        this.playButton.addEventListener('click', this.onOff);
    }

    onOff() {
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
    scheduler(){
        console.log("Scheduler Called")
        console.log(this.lastNote);
        if (this.playing){
            console.log("Here")
            while(this.lastNote + this.notePeriod < this.audioContext.currentTime + this.evalPeriod){
                this.lastNote = this.lastNote + this.notePeriod;
                this.sourceNode.start(this.lastNote);
            }
        }
    }  
    initialize = async ()  =>{
        this.lastNote = this.audioContext.currentTime;
        const response = await fetch(this.audio[0]);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        this.sourceNode = audioContext.createBufferSource();
        this.sourceNode.buffer = audioBuffer;
        this.sourceNode.connect(audioContext.destination);
        this.intervalId = setInterval(() => this.scheduler(),1000)
    }


}
