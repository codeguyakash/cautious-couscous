import React, { useEffect, useState } from 'react';
import {
  View,
  Alert,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Button,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScheduleContent from './schedule_campaign';
// import DeviceInformation from './get_device_info';
import { getMethod } from './network/network_api_calls';
import VideoScheduler from './video_scheduler';
import VideoPlaylist from './video_scheduler';
import VPlayer from './v_player';

const Dashboard = ({ navigation }: any) => {
  // const { deviceInfo, permissionDenied } = DeviceInformation();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [defaultVideoUrl, setDefaultVideoUrl] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const formatDateTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const fetchDataFromStorage = async () => {
    try {
      const storedDeviceId = await AsyncStorage.getItem('device_id');
      const storedAccessToken = await AsyncStorage.getItem('access_token');

      if (storedDeviceId) setDeviceId(storedDeviceId);
      if (storedAccessToken) setAccessToken(storedAccessToken);
    } catch (error) {
      console.error('Error fetching data from AsyncStorage', error);
    }
  };

  const getCampaigns = async () => {
    setIsLoading(true);
    try {
      const response = await getMethod('/api/default-videos');
      console.log(
        '[@Response]',
        response.default_videos.length,
        response.status,
      );
      setCampaigns(response.default_videos || []);
      setDefaultVideoUrl(response.default_video || null);
      setIsLoading(false);
    } catch (error) {
      console.log('Error', error);
    }
  };

  const handlePlayVideo = () => {
    navigation.navigate('FullScreenVideo');
  };

  useEffect(() => {
    let timer: any
    const initialize = async () => {
      let type = await AsyncStorage.getItem("type")
      console.log(type)
      if (type === 'online') {
        timer = setTimeout(() => {
          navigation.navigate('FullScreenVideo');
        }, 2000);
      }
    }
    initialize()


    return () => clearTimeout(timer);
  }, []);


  const handleLogout = async () => {
    await AsyncStorage.clear();
    Alert.alert('Logged Out', 'You have been logged out.');
    navigation.replace('Login');
  };

  useEffect(() => {
    // console.log(deviceInfo, permissionDenied);
    fetchDataFromStorage();
    getCampaigns();

    const updateCurrentTime = () => {
      const now = new Date();
      setCurrentTime(formatDateTime(now));

      navigation.setOptions({
        headerTitle: formatDateTime(now),
        headerTitleStyle: {
          color: 'black',
          fontWeight: 'bold',
        },
        headerLeft: () => null,
      });
    };

    const intervalId = setInterval(updateCurrentTime, 1000);
    return () => clearInterval(intervalId);
  }, [navigation]);
  const showDeviceInfo = () => {
    navigation.navigate('Device Details');
  };
  const handleRefresh = () => {
    fetchDataFromStorage();
    getCampaigns();
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtonsContainer}>
          <TouchableOpacity
            onPress={showDeviceInfo}
            style={styles.iconContainer}>
            <Image
              source={require('./assets/icons/info.png')}
              style={styles.icon}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleRefresh}
            style={styles.iconContainer}>
            <Image
              source={require('./assets/icons/refresh.png')}
              style={styles.icon}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handlePlayVideo}
            style={styles.iconContainer}>
            <Image
              source={require('./assets/icons/play.png')}
              style={styles.icon}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.iconContainer}>
            <Image
              source={require('./assets/icons/logout.png')}
              style={styles.icon}
            />
          </TouchableOpacity>
        </View>
      ),
      headerLeft: () => null,
    });
  }, [defaultVideoUrl]);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePlayVideo} style={styles.playButton}>
        {/* <Ionicons name="play" size={64} color="white" /> */}
        <Image source={require('./assets/icons/play.png')} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  iconContainer: {
    marginHorizontal: 10,
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: '#000', // Optional: For better contrast
  },
  playButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    // backgroundColor: '#ff0000', // Red background for the button
    justifyContent: 'center',
    alignItems: 'center',
    // elevation: 5, // For shadow on Android
    // shadowColor: '#000', // For shadow on iOS
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.3,
    // shadowRadius: 4,
    backgroundColor: 'white',
  },
});

export default Dashboard;
