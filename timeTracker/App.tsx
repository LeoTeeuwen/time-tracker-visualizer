import { NewAppScreen } from '@react-native/new-app-screen';
import { useEffect } from 'react';
import { NativeModules, StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import BackgroundJob from 'react-native-background-actions';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
const { UsageStatsModule } = NativeModules;

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

const veryIntensiveTask = async (taskDataArguments: any) => {
    console.log("Starting!");
    await new Promise(async (resolve) => {
      console.log("finished!");
      console.log(BackgroundJob.isRunning(), taskDataArguments)
  });
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
