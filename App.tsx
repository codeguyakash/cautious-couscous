import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

import VideoPlayer from './src/video_player';
import LoginScreen from './src/login';
import Dashboard from './src/dashboard';
import DeviceDetails from './src/device_details';
import Home from './src/offline-device/Home';

// import VideoPlayerComponent from './src/videoplayer';
import VideoPlayerComponent from './src/videoplayer2';
import LayoutVideoPlayer from './src/layoutplayer';

import VideoDownloaderComponent from './src/VideoDownloaderComponent ';
import LocalVideoPlayerComponent from './src/offline-device/OfflineVideoPlayer';
import VideoPlayerComponentNew from './src/videoplayer_new';
import VideoPlayerComponent2 from './src/videoplayer2';
import TempVideoPlayer from './src/temp';

const Stack = createStackNavigator();

function App(): React.JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerLeft: () => null,
        }}>
        <Stack.Screen name="VideoPlayer" component={VideoPlayer} />

        <Stack.Screen name="Device Details" component={DeviceDetails} />

        <Stack.Screen name="Login" component={LoginScreen} />

        <Stack.Screen name="Dashboard" component={Dashboard} />

        <Stack.Screen
          name="FullScreenVideo"
          component={VideoDownloaderComponent}
        />
        {/* <Stack.Screen
          name="RealVideoPlayer"
          component={VideoPlayerComponent}
          options={{headerShown: false}}
        /> */}

        <Stack.Screen
          name="RealVideoPlayer"
          component={TempVideoPlayer}
          options={{headerShown: false}}
        />
        {/* ==========================++++++++Offline Routes++++++++++================================*/}
        <Stack.Screen
          name="OfflineDashboard"
          component={Home}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="OfflineVideoPlayer"
          component={LocalVideoPlayerComponent}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
