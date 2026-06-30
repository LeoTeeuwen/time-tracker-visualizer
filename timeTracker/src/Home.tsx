import React from 'react';
import { useEffect } from 'react';
import { NativeModules, StatusBar, TouchableOpacity, StyleSheet, Text, useColorScheme, View } from 'react-native';
import BackgroundJob from 'react-native-background-actions';
// Needed for supabase
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { DB_PUBLISHABLE_KEY } from '@env';
import { getApplicationName, getDeviceName } from 'react-native-device-info';
const { UsageStatsModule, DeviceStateModule } = NativeModules;

// For idling maybe this link? https://stackoverflow.com/questions/70917367/react-native-detect-if-a-mobile-device-is-in-use-without-user-interaction-and-w

const supabase = createClient('https://dhyrzbqugxgtjaurnczc.supabase.co', DB_PUBLISHABLE_KEY);

let currentApplication: {device: string|null, event_time: Date|null, application_name: string|null, state: string|null, app_type: string|null} = {
    device: null,
    event_time: null,
    application_name: null,
    state: null,
    app_type: null
}

const options = {
    taskName: 'Example',
    taskTitle: 'ExampleTask title',
    taskDesc: 'ExampleTask description',
    taskIcon: {
        name: 'ic_launcher',
        type: 'mipmap',
    },
    color: '#ff00ff',
    parameters: {
        delay: 5000,
    },
    foregroundServiceType: ['dataSync'],
};

const sleep = (time: any) => new Promise<void>((resolve) => setTimeout(() => resolve(), time));

const veryIntensiveTask = async (taskDataArguments: any) => {
  const { delay } = taskDataArguments;
  console.log(BackgroundJob.isRunning(), delay)

  await new Promise( async (resolve) => {
      for (let i = 0; BackgroundJob.isRunning(); i++) {
          fetchUsageData().then((packageName: string) => {
            console.log(`Current package is: ${packageName}`);
            DeviceStateModule.isPhoneSleeping().then((sleepBool: boolean) => {
              getDeviceName().then((deviceName) => {
                  if (packageName === "UNKNOWN") {
                    return;
                  }
                  currentApplication = {
                  ...currentApplication,
                  device: deviceName,
                  application_name: packageName,
                  event_time: new Date(),
                  state: sleepBool? "idle" : "active",
                  app_type: "mobile"
                };
              })
            })
          });
          await sleep(delay);
      }
  });
}

const fetchUsageData = async () => {
  const hasPermission = await UsageStatsModule.checkPermission();
  if (!hasPermission) {
    UsageStatsModule.openSettings();
    return;
  }

  const packageName = await UsageStatsModule.getFocusedApp();
  // TODO maybe use this package instead of the weird custom Kotlin one?? 
  // return getApplicationName();
  return packageName;
};

const startWorker = () => {
  if (BackgroundJob.isRunning()) {
    console.log("Worker already running!");
    return;
  }

  BackgroundJob.start(veryIntensiveTask, options);
};

const endWorker = () => {
  if (!BackgroundJob.isRunning()) {
    console.log("Worker is already not running!");
    return;
  }

  BackgroundJob.stop();
};

const pushToDatabase = () => {
  if (currentApplication.application_name === null) {
    console.log("Wait until it grabs the user's application!");
    return;
  }
  
  supabase.from('time_events').insert(currentApplication).select().then((data) => {
    console.log("data: ", data);
    console.log("error: ", data.error);
  })
};

export default function Home() {
    useEffect(() => {
        BackgroundJob.start(veryIntensiveTask, options);
    },[])
  
    return (
    <View style={styles.container}>
        {/* Start button */}
        <TouchableOpacity onPress={() => startWorker()} style={[styles.button, styles.startButton]}>
            <Text style={styles.buttonText}>Start</Text>
        </TouchableOpacity>
        
        <View style={styles.spacer} />
        
        {/* Stop button */}
        <TouchableOpacity onPress={() => endWorker()} style={[styles.button, styles.stopButton]}>
            <Text style={styles.buttonText}>Stop</Text>
        </TouchableOpacity>
        
        <View style={styles.spacer} />
        
        {/* Stop button */}
        <TouchableOpacity onPress={() => pushToDatabase()} style={[styles.button, styles.pushButton]}>
            <Text style={styles.buttonText}>Push</Text>
        </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black', // Sets the background to black
    justifyContent: 'center', // Centers items vertically
    alignItems: 'center',     // Centers items horizontally (width-wise)
  },
  button: {
    width: 200,               // Set a fixed width for the buttons
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: 'green',
  },
  stopButton: {
    backgroundColor: 'red',
  },
  pushButton: {
    backgroundColor: '#3150ff',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  spacer: {
    height: '10%',            // Creates the exact 10% height difference space
  },
});