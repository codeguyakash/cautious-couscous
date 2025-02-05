import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  Platform,
  Alert,
  PermissionsAndroid,
} from 'react-native';
import Video from 'react-native-video';
import { getMethod } from './network/network_api_calls';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import RNRestart from 'react-native-restart';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import moment from 'moment';
import sample_video from './assets/videos/sample_video.mp4';

const VPlayer = ({ navigation }: any) => {
  const [isLoading, setIsLoading] = useState(false);
  const [videos, setVideos] = useState<any>([]);
  const [defaultvideos, setDefaultVideos] = useState<any>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentVideoDuration, setCurrentVideoDuration] = useState(0);
  const [isImage, setIsImage] = useState(false);

  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  const localCamps = {
    status: 200,
    campaigns: [
      {
        campaign_name: 'advertisement',
        start_time: '12:25:59',
        end_time: '12:26:28',
        video_url: 'assets/videos/1736537315_0d17bccefbdf4a742821.mp4', // correct path
        duration: 29,
      },
    ],
  };

  let time = new Date().toLocaleString().toLocaleUpperCase();

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const [isLogoOverlayOn, setIsLogoOverlayOn] = useState(false);
  const [isBugCheckOverlayOn, setIsBugCheckOverlayOn] = useState(false);
  const [isDateAndTimeOverlayOn, setIsDateAndTimeOverlayOn] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [showSeekTime, setSeekTime] = useState<any>('');

  const videoPlayerRef = useRef(null);
  const viewRefs = useRef(null);

  const formatDateTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
  };

  const getDeviceInfo = async () => {
    try {
      const deviceData = await AsyncStorage.getItem('device_info');
      if (deviceData) {
        const deviceInfo = JSON.parse(deviceData);
        setDeviceInfo(deviceInfo);
      }
      if (deviceInfo?.device_logo_display == '1') {
        setIsLogoOverlayOn(true);
      } else {
        setIsLogoOverlayOn(false);
      }
    } catch (error) {
      console.error('Error checking access token:', error);
    }
  };

  useEffect(() => {
    getCampaigns();
    getDefaultVideos();
    getDeviceInfo();
    downloadCampaignsLocal();

    let ws: any;

    const connectWebSocket = () => {
      ws = new WebSocket('wss://prowtechnode.zenoheal.com');

      ws.onopen = () => {
        console.log('Connected to WebSocket server');
        ws.send(JSON.stringify({ type: 'greeting', payload: 'Hello Server' }));
      };

      ws.onmessage = (event: any) => {
        try {
          const receivedMessage = event.data;
          let message;
          try {
            message = JSON.parse(receivedMessage);
            console.log('Parsed JSON message:', message);
          } catch (jsonError) {
            console.log('Plain string message received:', receivedMessage);
          }

          if (receivedMessage === 'get_more_campaigns') {
            console.log('Received get_more_campaigns');
            getCampaigns();
          }

          if (typeof message === 'object' && message !== null) {
            if (message.type === 'logo') {
              if (message.action === 'on') setIsLogoOverlayOn(true);
              if (message.action === 'off') setIsLogoOverlayOn(false);
            }
            if (message.type === 'bug') {
              if (message.action === 'on') setIsBugCheckOverlayOn(true);
              if (message.action === 'off') setIsBugCheckOverlayOn(false);
            }
            if (message.type === 'date') {
              if (message.action === 'on') setIsDateAndTimeOverlayOn(true);
              if (message.action === 'off') setIsDateAndTimeOverlayOn(false);
            }
            if (message.type === 'download_campaigns_local') {
              downloadCampaignsLocal();
            }
          } else if (typeof receivedMessage === 'string') {
            if (receivedMessage === 'Welcome to the WebSocket server!') {
              console.log('Welcome message received');
            }
          }

          if (receivedMessage === 'capture_screenshot') {
            takeScreenshot();
          }
        } catch (error) {
          console.log('Error handling message:', error);
        }
      };

      ws.onclose = () => {
        console.log('Disconnected from WebSocket server. Reconnecting...');
        connectWebSocket();
      };

      ws.onerror = (error: any) => {
        console.log('WebSocket encountered an error:', error);
        ws.close();
      };
    };

    connectWebSocket();

    const updateCurrentTime = () => {
      const now = new Date();
      setCurrentTime(formatDateTime(now));
    };
    const intervalId = setInterval(updateCurrentTime, 1000);

    return () => {
      if (ws) ws.close();
      clearInterval(intervalId);
    };
  }, []);

  const getCampaigns = async () => {
    setIsLoading(true);
    try {
      const response = await getMethod('/api/fetch-campaigns-for-today_test');
      // Append immediate campaigns to the existing videos array
      console.log('response', response.campaigns.length, currentIndex);

      setVideos(response.campaigns || []);
      setCurrentIndex(0);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setIsLoading(false);
    }
  };
  const getDefaultVideos = async () => {
    setIsLoading(true);
    try {
      const response = await getMethod('/api/default-videos');
      setDefaultVideos(response.default_videos || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setIsLoading(false);
    }
  };

  const restartApp = () => {
    RNRestart.Restart();
  };

  const downloadCampaignsLocal = async () => {
    const response = localCamps;
    const campaigns = response?.campaigns;

    if (!campaigns || campaigns.length === 0) {
      console.log('No campaigns available');
      return;
    }

    const videoUrl = campaigns[0]?.video_url;

    if (typeof videoUrl === 'string' && videoUrl.startsWith('assets')) {
      await createFolder();
    } else {
      console.log('Invalid or missing video URL:', videoUrl);
    }

    try {
      // console.log("Campaigns downloaded locally",campaigns);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const requestStoragePermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission Required',
          message: 'This app needs access to your storage to save files.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const createFolder = async () => {
    console.log('Starting folder and file management...');
    try {
      if (Platform.OS === 'android') {
        // const hasPermission = await requestStoragePermission();
        // if (!hasPermission) {
        //     Alert.alert('Permission Denied', 'Storage permission is required to create folders and manage files.');
        //     return;
        // }

        const folderPath = `${RNFS.DocumentDirectoryPath}/LocalCampaigns`;
        const sampleVideoPath = `${RNFS.DocumentDirectoryPath}/sample_video.mp4`;
        const destinationPath = `${folderPath}/sample_video.mp4`;

        // const folderPath = `${RNFS.ExternalStorageDirectoryPath}/LocalCampaigns`;
        // const sampleVideoPath = `${RNFS.ExternalStorageDirectoryPath}/sample_video.mp4`;
        // const destinationPath = `${folderPath}/sample_video.mp4`;

        console.log('Target folder path:', folderPath);
        console.log('Sample video path:', sampleVideoPath);

        // Check if the folder exists
        const folderExists = await RNFS.exists(folderPath);

        if (!folderExists) {
          // Create the folder if it doesn't exist
          console.log('Folder does not exist, creating...');
          await RNFS.mkdir(folderPath);
          console.log('Folder created successfully at:', folderPath);
        } else {
          console.log('Folder already exists at:', folderPath);
        }

        // Check if the sample video file exists
        const fileExists = await RNFS.exists(sampleVideoPath);

        if (!fileExists) {
          // Handle missing file (create or download)
          console.log(
            'Sample video does not exist. Creating dummy video file...',
          );
          await RNFS.writeFile(
            sampleVideoPath,
            'Dummy video content for testing',
            'utf8',
          );
          console.log('Sample video created at:', sampleVideoPath);
        } else {
          console.log('Sample video file already exists at:', sampleVideoPath);
        }

        // Move the file into the folder
        console.log(`Moving file to: ${destinationPath}`);
        await RNFS.moveFile(sampleVideoPath, destinationPath);
        console.log('File moved successfully.');

        // Read and log the contents of the directory
        const directoryContents = await RNFS.readDir(folderPath);
        console.log('Directory contents:', directoryContents);
        directoryContents.forEach(item => {
          console.log('Item:', item.name, item.size, item.path);
        });

        console.log('Operation completed!');
      }
    } catch (error: any) {
      console.error('Error during folder and file operations:', error);
      Alert.alert('Error', error.message);
    }
  };

  // Screenshot Logic
  const takeScreenshot = async () => {
    try {
      const uri = await captureRef(viewRefs, {
        format: 'png',
        quality: 0.8,
      });

      if (Platform.OS === 'android') {
        await CameraRoll.save(uri, { type: 'photo' });
        Alert.alert('Success', 'Screenshot saved to gallery.');
      } else {
        Alert.alert('Success', 'Screenshot captured. Check your Photos.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture screenshot.');
      console.error('Screenshot error:', error);
    }
  };

  const handleVideoEnd = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
      setVideos(defaultvideos);
    }
  };

  const handleVideoEndw = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      console.log('Playlist ended');
      setCurrentIndex(0);
      setVideos(defaultvideos);
    }
  };

  // useEffect(() => {
  //     if (videos.length > 0) {
  //         const currentMedia = videos[currentIndex];
  //         if (currentMedia.file_type === 'image') {
  //             setIsImage(true);
  //             setTimeout(() => handleVideoEnd(), (currentMedia.duration || 5) * 1000);
  //         } else {
  //             setIsImage(false);
  //         }
  //     }
  // }, [currentIndex, videos]);
  useEffect(() => {
    if (videos.length > 0) {
      const currentMedia = videos[currentIndex];

      if (currentMedia && currentMedia.start_time) {
        const currentTime = new Date();
        const startTime = parseTimeToTimestamp(currentMedia.start_time);

        console.log('Current Time:', currentTime.getTime());
        console.log('Start Time:', startTime);

        const delay = Math.max(0, startTime - currentTime.getTime()); // Delay until start_time (in ms)
        console.log('Delay:', delay);

        if (delay > 0) {
          // Display the placeholder image until the video start_time
          setIsImage(true);

          // Schedule playback to start at the exact start_time
          const timer = setTimeout(() => {
            setIsImage(false); // Switch to video
            playMedia(currentMedia);
          }, delay);

          // Cleanup the timeout if component unmounts or index changes
          return () => clearTimeout(timer);
        } else {
          // If start_time has already passed, play the video immediately
          setIsImage(false);
          playMedia(currentMedia);
        }
      }
    }
  }, [currentIndex, videos]);

  const parseTimeToTimestamp = (time: any) => {
    // Split the `HH:mm:ss` format
    const [hours, minutes, seconds] = time.split(':').map(Number);

    // Get the current date
    const currentDate = new Date();
    currentDate.setHours(hours, minutes, seconds, 0); // Set the time on the current date

    return currentDate.getTime(); // Return the timestamp
  };

  const playMedia = (media: any) => {
    if (media.file_type === 'image') {
      setIsImage(true);
      // Hold image for specified duration
      setTimeout(() => handleMediaEnd(), (media.duration || 5) * 1000);
    } else if (media.file_type === 'video') {
      setIsImage(false);
      if (videoPlayerRef.current) {
        const videoElement = videoPlayerRef.current as any;
        // For react-native-video, seek to a specific time if necessary
        videoElement.seek(media.seek_time || 0); // Seek to start or specified time
        // No need to call `play()`, the video will play automatically if configured correctly
      }
    }
  };

  const handleMediaEnd = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Switch to default videos when campaign playlist ends
      setVideos(defaultvideos);
      setCurrentIndex(0);
    }
  };

  const handleVideoLoad = (data: any) => {
    setCurrentVideoDuration(data.duration);

    // Seek to the `seek_time` if provided for the current video
    const seekTime = videos[currentIndex]?.seek_time;
    if (seekTime && videoPlayerRef.current) {
      (videoPlayerRef.current as any).seek(seekTime);
    }
  };

  const handleError = (error: any) => {
    console.log('Video Error:', error);
    handleVideoEnd();
  };
  const handleProgress = (event: any) => {
    // console.log('Video status:', event.currentTime);
    setSeekTime(Math.floor(event.currentTime));
  };

  const renderMedia = () => {
    const currentMedia = videos[currentIndex];

    if (!currentMedia) return null;

    if (isImage) {
      return (
        <Image
          source={{ uri: currentMedia.thumbnail }}
          style={styles.image}
          resizeMode="contain"
        />
      );
    } else {
      return (
        <ViewShot ref={viewRefs} style={styles.container}>
          <Video
            ref={videoPlayerRef}
            source={{ uri: currentMedia.video_url }}
            style={styles.video}
            controls={false}
            paused={false} // Ensure the video plays automatically
            resizeMode="contain"
            onEnd={handleMediaEnd}
            onError={handleError}
            // onLoad={handleVideoLoad}
            onProgress={handleProgress}
            poster={
              'https://prowtechapi.zenoheal.com/uploads/Default%20Videos/1736806241_a1c4125be6295b4b6f71.png'
            }
            // poster={currentMedia.thumbnail}
            posterResizeMode="cover"
            repeat={false}
          />

          {/* {isLogoOverlayOn && ( */}
          <View style={styles.overlayImage}>
            <Image
              source={{
                uri: isLogoOverlayOn
                  ? deviceInfo?.device_logo_on_status_file
                  : deviceInfo?.device_logo_off_status_file,
              }}
              style={{ width: 80, height: 80 }}
            />
            <Text>
              {showSeekTime + '/' + videos[currentIndex].duration}----
              {videos[currentIndex].start_time}-{videos[currentIndex].end_time}
            </Text>
          </View>
          {/* )} */}

          {isDateAndTimeOverlayOn && (
            <View style={styles.dateTimeOverlay}>
              <Text style={{ color: 'black', fontSize: 24, fontWeight: '600' }}>
                {currentTime}
              </Text>
            </View>
          )}

          {isBugCheckOverlayOn && (
            <View style={styles.bugOverlay}>
              <View>
                <Text
                  style={{ textAlign: 'center', fontSize: 22, color: '#FFF' }}>
                  Bug Checking
                </Text>
                <Text style={styles.bugText}>Logs:</Text>
                <Text style={styles.bugText}>Log entry 1...</Text>
                <Text style={styles.bugText}>Log entry 2...</Text>
              </View>
            </View>
          )}
        </ViewShot>
      );
    }
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : (
        renderMedia()
      )}
      <View style={styles.controls}>
        <Text style={styles.controlButton}>
          Playing media {currentIndex + 1} of {videos.length}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    // justifyContent: 'center', // Center vertically
    // alignItems: 'center', // Center horizontally
    // backgroundColor: 'black', // Ensure the background is black for a clean full-screen experience
  },
  video: {
    width: '100%',
    height: '100%',
    // backgroundColor: 'black', // Prevent the black screen blink
  },
  image: {
    width: '100%',
    height: '100%',
  },
  controls: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  controlButton: {
    color: '#fff',
    fontSize: 18,
    marginTop: 10,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
  },
  overlay: {
    position: 'absolute', // Overlay on top of video
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },

  dateTimeOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'transparent',
    padding: 5,
    borderRadius: 5,
    fontSize: 18,
  },

  //Logo Overlay
  overlayImage: {
    position: 'absolute',
    top: 5,
    left: 5,
    right: 0,
    bottom: 0,
  },

  //Bug Overlay
  bugOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '90%',
    height: '60%',
    transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: '#fff',
    borderRadius: 5,
    padding: 10,
  },
  bugText: {
    color: '#fff',
  },
});

export default VPlayer;
