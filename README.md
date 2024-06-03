# MetroGnome


# Descritption #


The MetroGnome project is a web-based application aimed at combining a tuner, metronome, and rhythm tracker into a single, integrated tool for musicians. The application is designed to enhance musicians' practice sessions by reducing distractions and providing accurate rhythm tracking. JavaScript is used to control the back end functionality, while HTML and CSS work in conjunction for the User Interface.


# Authors #


- Miles Anderson
- Ryan Helms
- Dax Lynch
- Harry Robertson


This Repository was made Thursday May 8th 2024 for Anthony Hornof's CS 422 Software Methodologies at the University of Oregon. This is our submission for our project 2.




# Usage #


To run this, use Pythons builtin http server, run:
`python3 -m http.server 8880` in your console
And then in your browser you MUST go to http://localhost:8880/


# Installation #


Please complete the steps found in [Installation.md] Once you have installed the requirements and set up a local server. You are ready to launch the program.


# Dependencies #


The code runs on Python 3.12, as it's built in http server functionality allowed for ease of testing and desgin when we were desgining our system.


As our system sends and recieves audio, an audioContext object is initalizied upon loading up the web app to give the user the ability to input sound sources. This is a built in part of JavaScripts WebAudio API


No external libraries are used, everything is built into JS, CSS and HTML.


# Classes #


Rhythm Tracker -
The Rhythm Tracker class analyzes audio input in real-time to track rhythmic patterns. It detects beats and displays them on a visual interface, allowing users to record and analyze their performances.


Tuner -
The Tuner class provides real-time pitch detection and display. It analyzes audio input from the user's microphone and determines the current pitch. The detected pitch is displayed along with the deviation in cents from the nearest note.


Metronome -
The Metronome class generates metronome beats based on user-defined tempo and time signature. It offers features such as regular and polyrhythmic modes, allowing users to customize their rhythmic patterns.




Each of these is a seperate JavaScript file, which are all initalized in [script.js], [index.html] and [styles.css] handle the user interface.





