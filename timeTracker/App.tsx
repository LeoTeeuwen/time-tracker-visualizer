import { NewAppScreen } from '@react-native/new-app-screen';
import { NativeModules, StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
const { UsageStatsModule } = NativeModules;


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
