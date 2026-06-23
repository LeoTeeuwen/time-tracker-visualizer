import { NewAppScreen } from '@react-native/new-app-screen';
import { useEffect } from 'react';
import { NativeModules, StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import BackgroundJob from 'react-native-background-actions';
// Needed for supabase
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { DB_PUBLISHABLE_KEY } from '@env';
const { UsageStatsModule } = NativeModules;


const supabase = createClient('https://dhyrzbqugxgtjaurnczc.supabase.co', DB_PUBLISHABLE_KEY);


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
        delay: 1000,
    },
    foregroundServiceType: ['dataSync'],
};

const sleep = (time: any) => new Promise<void>((resolve) => setTimeout(() => resolve(), time));

const veryIntensiveTask = async (taskDataArguments: any) => {
  const { delay } = taskDataArguments;
  console.log(BackgroundJob.isRunning(), delay)

  await new Promise( async (resolve) => {
      for (let i = 0; BackgroundJob.isRunning(); i++) {
          console.log(i);
          await sleep(delay);
      }
  });

  // setInterval(() => {
  //   console.log("Pushing to DB!");

  //   const currentApplication = {
  //       device: "test",
  //       event_time: new Date(),
  //       application_name: "test",
  //       state: "active",
  //       app_type: "test"
  //   }
  //   supabase.from('time_events').insert(currentApplication).select().then((data) => {
  //     console.log("data: ", data);
  //     console.log("error: ", data.error);
  //   })
  // }, 5000);
}

const fetchUsageData = async () => {
  const hasPermission = await UsageStatsModule.checkPermission();
  if (!hasPermission) {
    UsageStatsModule.openSettings();
    return;
  }

  const packageName = await UsageStatsModule.getFocusedApp();
  return packageName;
};

function App() {
  const isDarkMode = useColorScheme() === 'dark';
    
  useEffect(() => {
    BackgroundJob.start(veryIntensiveTask, options);
  },[])

  useEffect(() => {

    setInterval(() => {
      fetchUsageData().then((packageName: string) => {
        console.log(`Current package is: ${packageName}`);
      });
    }, 5000);
  
  }, [])

  fetchUsageData().then((packageName: string) => {
    console.log(`Current package is: ${packageName}`);
  });

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <NewAppScreen
        templateFileName="App.tsx"
        safeAreaInsets={safeAreaInsets}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
