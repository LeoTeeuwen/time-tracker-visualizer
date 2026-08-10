# Time Tracker Visualizer

A repository consisting of 3 different projects combining to collect, push, and visualize the User's daily routines on their devices


## Getting Started

You need the ENV keys for each repo. Put those in an ENV file in the root for each folder. 

"desktop-app" is an electron project. "npm start" runs the program.

"chrome-extension" is a chrome extension built with WebPack. "npm build" will build the app and allow you to load the unpacked extension under the dist folder

"timeTracker" is a React Native app. Use "npm run android" to start the metro server instance and deploy to a connected emulator or physical device for android.

## Current bugs being addressed

1. Idle state is not handled properly, so a user going off idle isn't pushed as an activity marker

