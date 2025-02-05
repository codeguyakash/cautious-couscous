import React, {useEffect, useState, useRef} from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {View, Text, StyleSheet, Dimensions, Image} from 'react-native';
import Video from 'react-native-video';
import RNFS from 'react-native-fs';
import {useFocusEffect, useNavigation} from '@react-navigation/native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import ViewShot, {captureRef} from 'react-native-view-shot';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';
import axios from 'axios';
import {ScrollView} from 'react-native-gesture-handler';
import RNRestart from 'react-native-restart';
import Toast from '../components/Toast';

const OfflineVideoPlayer = () => {
  const MAX_LOGS = 40;
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [videoFiles, setVideoFiles] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]); // json here
  const [currentVideo, setCurrentVideo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const navigation: any = useNavigation();
  const [deviceInformation, setDeviceInformation] = useState<any>(null);

  const folderPath = `${RNFS.DocumentDirectoryPath}/Local/campaigns`;
  const campaignFilePath = `${folderPath}/campaigns.json`;
  const [isFilesLoaded, setIsFilesLoaded] = useState(false);
  const [nextVideoTime, setNextVideoTime] = useState(0);

  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // Overlays States
  const [isLogoOverlayOn, setIsLogoOverlayOn] = useState(true);
  const [isBugCheckOverlayOn, setIsBugCheckOverlayOn] = useState(true);
  const [isDateAndTimeOverlayOn, setIsDateAndTimeOverlayOn] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [overlayImage, setOverlayImage] = useState<string>('');
  const [bugLogs, setBugLogs] = useState<any[]>([
    {
      message: 'Bug checking in progress...',
      timestamp: new Date().toLocaleString(),
    },
  ]);

  //Campaign Details
  const [campaignDetails, setCampaignDetails] = useState<any>([]);

  const [screenPosition, setScreenPosition] = useState({
    unit: 'px',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: 200,
    height: 150,
  });

  const [bugPosition, setBugPosition] = useState<any>({
    top: 5,
    left: 5,
    bottom: 5,
    right: 5,
    width: 500,
    height: 60,
  });

  let time = new Date().toLocaleString().toLocaleUpperCase();
  const videoPlayerRef = useRef(null);
  const viewRefs = useRef(null);

  // WebSocket logic States

  const scrollViewRef = useRef<ScrollView | null>(null);

  const formatDateTime = (date: Date, format: any) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    if (format === 'DD/MM/YYYY') {
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    } else if (format === 'MM/DD/YYYY') {
      return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
    } else {
      return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
    }
  };

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });

    (async () => {
      try {
        let isAuthorized = await AsyncStorage.getItem('isAuthorized');
        console.log('isAuthorized Video', isAuthorized);
        await fetchVideoFiles();
      } catch (error) {
        console.error('Error fetching isAuthorized:', error);
        setToast({message: 'Error fetching isAuthorized', type: 'error'});
      }
    })();
    scheduleCampaignVideos();
  }, [navigation]);

  // Add Bug Log
  const addBugLog = (message: string) => {
    setBugLogs(prevLogs => {
      const newLogs = [
        ...prevLogs,
        {
          message,
          timestamp: formatDateTime(new Date(), 'DD/MM/YYYY'),
        },
      ];

      return newLogs.length > MAX_LOGS ? newLogs.slice(-MAX_LOGS) : newLogs;
    });
  };

  //Restart App
  const restartApp = () => {
    console.log('Restarting app...');
    if (Platform.OS === 'android') {
      RNRestart.Restart();
    }
  };

  //Take Screenshot Logic
  const takeScreenshot = async () => {
    try {
      const uri = await captureRef(viewRefs, {
        format: 'png',
        quality: 0.8,
      });

      if (Platform.OS === 'android') {
        await CameraRoll.save(uri, {type: 'photo'});
        setToast({message: 'Screenshot saved to gallery.', type: 'success'});
      } else {
        console.log('Screenshot captured:', uri);
        setToast({message: 'Screenshot captured.', type: 'success'});
      }
    } catch (error) {
      console.log('@@Error Screenshot error:', error);
      setToast({message: 'Error capturing screenshot.', type: 'error'});
    }
  };

  const fetchVideoFiles = async () => {
    console.log('Fetching video files...');
    try {
      const exists = await RNFS.exists(folderPath);

      if (!exists) {
        console.log('Directory does not exist:', folderPath);
        setError('Directory does not exist.');
        setIsLoading(false);
        return;
      }

      const files = await RNFS.readDir(folderPath);
      console.log('Files fetched:', files);

      const campaignDetails: any = files.find(
        file => file.isFile() && file.name === 'campaigns.json',
      );
      const campaignsData = await RNFS.readFile(campaignDetails.path, 'utf8');
      setCampaigns(JSON.parse(campaignsData));

      console.log('Campaigns Data:');

      const videoFiles: any = files
        .filter(
          file =>
            file.isFile() &&
            (file.name.endsWith('.mp4') || file.name.endsWith('.mkv')),
        )
        .map(file => ({
          path: file.path,
          name: file.name,
        }));

      if (videoFiles.length === 0) {
        console.log('No video files found in the directory.');
        setError('No video files found in the directory.');
        setIsLoading(false);
        return;
      }

      setVideoFiles(videoFiles);
      setIsFilesLoaded(true);

      setIsLoading(false);
    } catch (err: any) {
      console.log('@@Error Error fetching video files:', err);
      setError(`Error fetching video files: ${err.message}`);
      setIsLoading(false);
    }
  };

  const scheduleCampaignVideos = () => {
    clearPreviousSchedules();

    if (!campaigns?.length) {
      console.log('No campaigns available for scheduling.');
      addBugLog('No campaigns available for scheduling.');
      return;
    }

    campaignSchedule = campaigns.filter(
      (campaign: {start_time: any}) => campaign.start_time,
    );

    if (!campaignSchedule.length) {
      console.log('No valid campaign schedules available.');
      addBugLog('No valid campaign schedules available.');
      return;
    }

    console.log(
      'Campaign videos scheduled for today (Vietnam Time):',
      campaignSchedule,
    );
    scheduleNextVideo();
  };

  // Function to schedule the next video based on its start time
  const scheduleNextVideo = () => {
    if (currentVideoIndex >= campaignSchedule.length) {
      console.log('All scheduled videos have been played.');
      return;
    }

    const scheduledCampaign = campaignSchedule[currentVideoIndex];

    if (!scheduledCampaign) {
      console.log(`No valid campaign found at index: ${currentVideoIndex}`);
      addBugLog(`No valid campaign found at index: ${currentVideoIndex}`);
      return;
    }

    const video = videoFiles.find(
      file => String(file.name) === String(scheduledCampaign.file_name),
    );

    if (!video) {
      console.log(`Error: Video not found - ${scheduledCampaign.file_name}`);
      addBugLog(`Error: Video not found - ${scheduledCampaign.file_name}`);
      setTimeout(() => {
        currentVideoIndex++;
        scheduleNextVideo();
      }, 5000);
      return;
    }

    const now = convertToVietnamTime(new Date());
    const startTime = scheduledCampaign.start_time;
    if (!now || !startTime) {
      console.log('❌ Invalid time detected. Skipping video scheduling.');
      addBugLog('❌ Invalid time detected. Skipping video scheduling.');
      return;
    }

    const nowMs = convertTimeToMilliseconds(now);
    const startTimeMs = convertTimeToMilliseconds(startTime);

    if (isNaN(nowMs) || isNaN(startTimeMs)) {
      console.log('❌ Error in time conversion. Skipping video scheduling.');
      addBugLog('❌ Error in time conversion. Skipping video scheduling.');
      return;
    }

    const delay = startTimeMs - nowMs;

    console.log(`🕒 Now (ms since midnight): ${nowMs}`);
    console.log(`🎥 Scheduled Start Time (ms since midnight): ${startTimeMs}`);
    console.log(`⏳ Delay before playing: ${delay} ms`);

    if (delay > 0) {
      console.log(`✅ Video will play in ${delay / 1000} seconds.`);
      addBugLog(`✅ Video will play in ${delay / 1000} seconds.`);
      timeoutId = setTimeout(() => {
        playVideo(video);
      }, delay);
    } else {
      console.log(`🚀 Playing delayed video immediately.`);
      playVideo(video);
    }
  };

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({animated: true});
    }
  }, [bugLogs]);
  useEffect(() => {
    console.log('Running useEffect for initial setup');

    const initialize = async () => {
      await fetchVideoFiles();
    };

    initialize();

    const updateCurrentTime = () => {
      if (deviceInformation?.device_overlay_date_time_status == '1') {
        const now = formatDateTime(new Date(), 'MM/DD/YYYY');
        setCurrentTime(now);
        return;
      }
      const now = formatDateTime(new Date(), 'DD/MM/YYYY');
      setCurrentTime(now);
    };
    const intervalId = setInterval(updateCurrentTime, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (campaigns) {
      console.log('Scheduling videos');
      scheduleCampaignVideos();
    }
  }, [campaigns]);

  const handleVideoEnd = () => {
    console.log('Video ended');
    setCurrentVideo(null);
  };

  const handleVideoError = (err: any) => {
    console.log('@@Error Video error:', err);
    setError('Failed to play the video.');
  };
  const handleProgress = (progress: any) => {
    let remainingSeconds = Math.floor(
      progress.playableDuration - progress.currentTime,
    );
    setNextVideoTime(remainingSeconds);
  };

  const handleVideoLoad = (data: any) => {
    let d = data.videoTracks[0];

    if (d.height > d.width) {
      console.log('Vertical', `Height:${d.height} Width:${d.width}`);
    } else {
      console.log('Horizontal', `Height:${d.height} Width:${d.width}`);
    }
  };

  let currentVideoIndex = 0;
  let campaignSchedule: any = [];
  let timeoutId: any = null;

  const clearPreviousSchedules = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    currentVideoIndex = 0;
    console.log(' Cleared previous schedules.');
  };

  const playVideo = (video: any) => {
    setCurrentVideo(video);
    addBugLog(`Playing scheduled video: ${video.name}`);

    setTimeout(() => {
      currentVideoIndex++;
      scheduleNextVideo();
    }, video.duration * 1000);
  };

  const convertToVietnamTime = (date: any) => {
    console.log('Original date:', date);
    try {
      const vietnamTime = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(new Date(date));

      console.log('Vietnam Time (24-hour format):', vietnamTime);
      return vietnamTime;
    } catch (error) {
      console.log(`Error converting date: ${date}`, error);
      addBugLog(`Error converting date: ${date}`);
      return null;
    }
  };

  const convertTimeToMilliseconds = (timeString: any) => {
    try {
      const [hours, minutes, seconds] = timeString.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
        throw new Error('Invalid time format');
      }
      return (hours * 3600 + minutes * 60 + seconds) * 1000;
    } catch (error) {
      console.log(
        `Error converting time to milliseconds: ${timeString}`,
        error,
      );
      return NaN;
    }
  };
  const [isRowLayout, setIsRowLayout] = useState(true);

  const handleLogOut = async () => {
    try {
      navigation.navigate('OfflineDashboard');
    } catch (error) {
      console.error('Error logging out:', error);
      setToast({message: 'Error logging out', type: 'error'});
    }
  };

  return (
    <ViewShot ref={viewRefs} style={[styles.container]}>
      <View
        style={[
          styles.container,
          {
            position: 'absolute',
            top: screenPosition.top,
            left: screenPosition.left,
            right: screenPosition.right,
            bottom: screenPosition.bottom,
          },
        ]}>
        {currentVideo ? (
          <Video
            key={currentVideo.path}
            source={{uri: `file://${currentVideo.path}`}}
            style={[styles.video]}
            resizeMode="contain"
            onLoad={handleVideoLoad}
            onEnd={handleVideoEnd}
            onError={handleVideoError}
            onProgress={handleProgress}
            posterResizeMode="cover"
          />
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="black" />
            <Text style={styles.loadingText}>Loading Video...</Text>
          </View>
        )}
      </View>
    </ViewShot>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'black',
    marginTop: 10,
  },
});

export default OfflineVideoPlayer;
