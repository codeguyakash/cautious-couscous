import React, {useEffect, useState, useRef} from 'react';
import {ActivityIndicator, Alert, Platform} from 'react-native';
import {View, Text, StyleSheet, Dimensions, Image} from 'react-native';
import Video from 'react-native-video';
import RNFS from 'react-native-fs';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {BASE_URL, SOCKET_BASE_URL} from '../env/base_url';
import {getMethod, postMethod} from './network/network_api_calls';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ViewShot, {captureRef} from 'react-native-view-shot';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';
import axios from 'axios';
import {ScrollView} from 'react-native-gesture-handler';
import RNRestart from 'react-native-restart';

const MAX_LOGS = 40;
const VideoPlayerComponent = () => {
  const [videoFiles, setVideoFiles] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [currentVideo, setCurrentVideo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const navigation = useNavigation();
  const [deviceInformation, setDeviceInformation] = useState<any>(null);
  const folderPath = `${RNFS.DocumentDirectoryPath}/Prowtech`;
  const [isFilesLoaded, setIsFilesLoaded] = useState(false);
  const [nextVideoTime, setNextVideoTime] = useState(0);

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const [progress, setProgress] = useState<number>(0);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const [takenScreenShot, setTakenScreenShot] = useState<boolean>(false);

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

  // Screen Position States
  const [screenPosition, setScreenPosition] = useState({
    unit: 'px',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: 200, // Default width
    height: 150, // Default height
  });
  //Bug Position States
  const [bugPosition, setBugPosition] = useState({
    top: 50,
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
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const isSocketConnected = useRef(false);

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
  const connectWebSocket = async () => {
    const device_id = await AsyncStorage.getItem('device_id');
    console.log('Device ID:', device_id);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('WebSocket is already connected.');
      return;
    }

    console.log('Establishing WebSocket connection...');
    const ws = new WebSocket(`wss://${SOCKET_BASE_URL}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to WebSocket server');
      isSocketConnected.current = true;

      // Send device information when the socket connects
      if (deviceInformation) {
        ws.send(
          JSON.stringify({
            type: 'device_connected',
            data: deviceInformation,
          }),
        );
        console.log('Device information sent to WebSocket.');
      }
    };

    ws.onmessage = event => {
      try {
        const message = JSON.parse(event.data);
        console.log('MESSAGE RECEIVED:', message);

        if (message.type === 'start_video') {
          console.log('Start video request received.');
        } else if (message.type === 'download_video') {
          console.log('Download video request received.');
          addBugLog('Download video request received.');
          getCampaigns();
        }

        if (typeof message === 'object' && message !== null) {
          if (message.type === 'logo') {
            if (message.device_id === device_id) {
              console.log(
                'Logo overlay message:',
                message.action === 'on' ? 'ON' : 'OFF',
              );
              if (message.action === 'on') setIsLogoOverlayOn(true);
              if (message.action === 'off') setIsLogoOverlayOn(false);
            }
          }
          if (message.type === 'bug') {
            if (message.device_id === device_id) {
              console.log(
                'Bug overlay message:',
                message.action === 'on' ? 'ON' : 'OFF',
              );
              if (message.action === 'on') setIsBugCheckOverlayOn(true);
              if (message.action === 'off') setIsBugCheckOverlayOn(false);
            }
          }
          if (message.type === 'date') {
            if (message.device_id === device_id) {
              console.log(
                'Date overlay message:',
                message.action === 'on' ? 'ON' : 'OFF',
              );
              if (message.action === 'on') setIsDateAndTimeOverlayOn(true);
              if (message.action === 'off') setIsDateAndTimeOverlayOn(false);
            }
          }
          if (message.type === 'capture_screenshot') {
            if (message.device_id === device_id) {
              takeScreenshot();
              console.log('Screenshot captured.');
            }
          }
          if (message.type === 'reboot') {
            if (message.device_id === device_id) {
              console.log('Rebooting device...');
            }
          }
          if (
            message.type === 'screen_position' &&
            message.device_id === device_id
          ) {
            if (message.positions) {
              setScreenPosition(prev => ({
                unit: 'px',
                top:
                  message.positions.top !== ''
                    ? parseInt(message.positions.top) || prev.top
                    : prev.top,
                left:
                  message.positions.left !== ''
                    ? parseInt(message.positions.left) || prev.left
                    : prev.left,
                bottom:
                  message.positions.bottom !== ''
                    ? parseInt(message.positions.bottom) || prev.bottom
                    : prev.bottom,
                right:
                  message.positions.right !== ''
                    ? parseInt(message.positions.right) || prev.right
                    : prev.right,
                width:
                  message.positions.width !== ''
                    ? parseInt(message.positions.width) || prev.width
                    : prev.width,
                height:
                  message.positions.height !== ''
                    ? parseInt(message.positions.height) || prev.height
                    : prev.height,
              }));
            }
          }

          if (
            message.type === 'bug_position' &&
            message.device_id === device_id
          ) {
            if (message.positions) {
              setBugPosition(prev => ({
                top:
                  message.positions.top !== ''
                    ? parseInt(message.positions.top) || prev.top
                    : prev.top,
                left:
                  message.positions.left !== ''
                    ? parseInt(message.positions.left) || prev.left
                    : prev.left,
                bottom:
                  message.positions.bottom !== ''
                    ? parseInt(message.positions.bottom) || prev.bottom
                    : prev.bottom,
                right:
                  message.positions.right !== ''
                    ? parseInt(message.positions.right) || prev.right
                    : prev.right,
                width:
                  message.positions.width !== ''
                    ? parseInt(message.positions.width) || prev.width
                    : prev.width,
                height:
                  message.positions.height !== ''
                    ? parseInt(message.positions.height) || prev.height
                    : prev.height,
              }));
              console.log('Bug Position', message.positions);
            }
          }

          if (message.type === 'restart_app') {
            if (message.device_id === device_id) {
              restartApp();
            }
          }
        } else if (typeof message === 'string') {
          if (message === 'Welcome to the WebSocket server!') {
            console.log('Welcome message received');
          }
        }
      } catch (err) {
        console.log('@@Error Error parsing WebSocket message:', err);
        addBugLog('Error parsing WebSocket message.');
      }
    };

    ws.onclose = event => {
      console.log('Disconnected from WebSocket server:', event.reason);
      isSocketConnected.current = false;

      if (reconnectTimeout.current === null) {
        console.log('Attempting to reconnect...');
        reconnectTimeout.current = setTimeout(() => {
          connectWebSocket();
          reconnectTimeout.current = null;
        }, 0); // Retry after 2 seconds
      }
    };

    ws.onerror = error => {
      console.log('@@Error WebSocket error:', error);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  };

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
        uploadScreenshot(uri);
        console.log('Screenshot captured. Check your Photos.');
      } else {
        console.log('Screenshot captured:', uri);
      }
    } catch (error) {
      console.log('@@Error Screenshot error:', error);
    }
  };
  const uploadScreenshot = async (uri: any) => {
    console.log(uri);

    try {
      const token = await AsyncStorage.getItem('access_token');
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: 'screenshot.png',
        type: 'image/png',
      });

      // Send the POST request
      const res = await axios.post(
        `https://${SOCKET_BASE_URL}/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `${token}`,
          },
        },
      );

      console.log('Screenshot uploaded successfully:', res.data);
    } catch (error) {
      console.log('Error uploading screenshot:', error);
    }
  };

  const fetchVideoFiles = async () => {
    console.log('Fetching video files...'); // Debug log

    try {
      const exists = await RNFS.exists(folderPath);

      if (!exists) {
        console.log('Directory does not exist:', folderPath); // Debug log
        setError('Directory does not exist.');
        setIsLoading(false);
        return;
      }

      const files = await RNFS.readDir(folderPath);

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
        console.log('No video files found in the directory.'); // Debug log
        setError('No video files found in the directory.');
        setIsLoading(false);
        return;
      }

      setVideoFiles(videoFiles);
      setIsFilesLoaded(true); // Signal that files are loaded

      setIsLoading(false);
    } catch (err: any) {
      console.log('@@Error Error fetching video files:', err); // Debug log
      setError(`Error fetching video files: ${err.message}`);
      setIsLoading(false);
    }
  };
  const downloadVideos = async (campaigns: any[]): Promise<string[]> => {
    try {
      const downloadedVideos: any[] = [];
      const totalVideos = campaigns.length;
      let completedVideos = 0;

      for (let i = 0; i < campaigns.length; i++) {
        const campaign = campaigns[i];
        const videoUrl: any = campaign.video_url;

        if (!videoUrl.startsWith(BASE_URL)) {
          console.log(`Invalid domain, skipping: ${videoUrl}`);
          continue;
        }

        const fileName = videoUrl.split('/').pop();
        const filePath = `${folderPath}/${fileName}`;

        const fileExists = await RNFS.exists(filePath);
        if (!fileExists) {
          console.log(`Downloading video: ${fileName}`);
          try {
            await RNFS.downloadFile({
              fromUrl: videoUrl,
              toFile: filePath,
              progress: res => {
                // Update collective progress
                const progressPercentage =
                  ((completedVideos + res.bytesWritten / res.contentLength) /
                    totalVideos) *
                  100;
                setProgress(progressPercentage);
              },
              progressDivider: 1,
            }).promise;

            // console.log(`Downloaded: ${fileName}`);
            downloadedVideos.push(filePath);
          } catch (err) {
            console.log(`@@Error Error downloading video: ${fileName}`, err);
          }
        } else {
          console.log(`Video already exists: ${fileName}`);
          downloadedVideos.push(filePath);
        }

        completedVideos += 1;
        setProgress((completedVideos / totalVideos) * 100); // Update progress for each completed video
      }

      return downloadedVideos;
    } catch (err) {
      console.log('@@Error Error downloading videos:', err);
      throw err;
    }
  };

  const ensureDirectoryExists = async (): Promise<void> => {
    try {
      const exists = await RNFS.exists(folderPath);
      if (!exists) {
        console.log('Creating folder:', folderPath);
        await RNFS.mkdir(folderPath);
      } else {
        console.log('Folder already exists:', folderPath);
      }
    } catch (err) {
      console.log('@@Error Error ensuring directory exists:', err);
      throw err;
    }
  };
  const getCampaignsForToday = async (): Promise<void> => {
    setIsDownloading(true);
    setIsInitializing(false); // Initialization complete
    // console.log('DEVICE INFO', deviceInformation);

    try {
      const device_id = await AsyncStorage.getItem('device_id');

      const response = await postMethod('/api/fetch-device-campaigns', {
        device_id: device_id,
      });
      // console.log('CAMPAIGNS', response.status, response.campaigns.length);

      if (response && Array.isArray(response.campaigns)) {
        setCampaigns(response.campaigns);
      } else {
        setCampaigns([]); // Fallback to empty array if campaigns are missing or not an array
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError('Error fetching campaigns.');
    } finally {
      setIsDownloading(false); // Reset downloading state
      setIsInitializing(false);
    }
  };
  const getCampaigns = async (): Promise<void> => {
    setIsDownloading(true);
    setIsInitializing(false); // Initialization complete
    try {
      const response = await getMethod('/download_campaigns_videos');
      const campaigns = response.campaigns || [];
      // console.log('Fetched campaigns:', campaigns);

      await ensureDirectoryExists();
      const downloadedVideos: any = await downloadVideos(campaigns);

      if (downloadedVideos.length > 0) {
        setIsDownloading(false);
        console.log('All videos downloaded successfully.');
      } else {
        setError('No videos available to play.');
      }
    } catch (err) {
      console.log('@@Error Error fetching campaigns:', err);
      setError('Error fetching campaigns.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    connectWebSocket(); // Connect WebSocket after files are fetched
  }, [videoFiles]);

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({animated: true});
    }
  }, [bugLogs]); // Runs when `bugLogs` updates
  useEffect(() => {
    console.log('Running useEffect for initial setup'); // Debug log

    const initialize = async () => {
      await fetchVideoFiles(); // Ensure files are fetched first
      await getDeviceInformation();
    };

    initialize();
    getCampaignsForToday();

    const updateCurrentTime = () => {
      // MM/DD/YYYY or DD/MM/YYYY
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
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      clearInterval(intervalId);
    };
  }, []); // Runs once on first render

  const getDeviceInformation = async () => {
    try {
      const deviceInfo = await AsyncStorage.getItem('device_info');
      if (deviceInfo) {
        const parsedDeviceInfo = JSON.parse(deviceInfo);
        setDeviceInformation(parsedDeviceInfo);

        if (parsedDeviceInfo?.device_logo_on_status_file) {
          setOverlayImage(parsedDeviceInfo.device_logo_on_status_file);
        }
      }
    } catch (error) {
      console.log('@@Error fetching device information:', error);
    }
  };
  const getDeviceInfoById = async (id: any) => {
    try {
      const deviceInfo = await getMethod(`/api/devices/show/${id}`);

      if (deviceInfo.data) {
        await AsyncStorage.setItem(
          'device_info',
          JSON.stringify(deviceInfo.data),
        );
      }
    } catch (error) {
      console.log('@@Error Error fetching device information:', error);
    }
  };
  useEffect(() => {
    if (deviceInformation) {
      setOverlayImage(
        isLogoOverlayOn
          ? deviceInformation?.device_logo_on_status_file
          : deviceInformation?.device_logo_off_status_file,
      );

      //Default Value
      let bug =
        deviceInformation.device_overlay_bug_check_display_status === '1';
      let logo = deviceInformation.device_overlay_logo_status === '1';
      let date = deviceInformation.device_overlay_date_time_status === '1';

      setIsBugCheckOverlayOn(bug);
      setIsLogoOverlayOn(logo);
      setIsDateAndTimeOverlayOn(date);

      setScreenPosition({
        unit: '',
        top: parseInt(deviceInformation.device_screen_dimension_top) || 0,
        left: parseInt(deviceInformation.device_screen_dimension_left) || 0,
        bottom: parseInt(deviceInformation.device_screen_dimension_width) || 0,
        right: parseInt(deviceInformation.device_screen_dimension_height) || 0,
        //Width and Height
        width: parseInt(deviceInformation.device_screen_dimension_width) || 200,
        height:
          parseInt(deviceInformation.device_screen_dimension_height) || 150,
      });

      setBugPosition({
        top: parseInt(deviceInformation.device_overlay_bug_check_top),
        left: parseInt(deviceInformation.device_overlay_bug_check_left),
        bottom: parseInt(deviceInformation.device_overlay_bug_check_width),
        right: parseInt(deviceInformation.device_overlay_bug_check_height),
        //Width and Height
        width:
          parseInt(deviceInformation.device_overlay_bug_check_width) || 200,
        height:
          parseInt(deviceInformation.device_overlay_bug_check_height) || 150,
      });
    }
  }, [deviceInformation, isLogoOverlayOn]);

  useFocusEffect(
    React.useCallback(() => {
      console.log('Screen is focused, re-fetching video files'); // Debug log
      fetchVideoFiles(); // Fetch files when the screen is focused
    }, []),
  );

  const handleVideoEnd = () => {
    console.log('Video ended');
    setCurrentVideo(null); // Reset current video after playback
  };

  const handleVideoError = (err: any) => {
    console.log('@@Error Video error:', err);
    setError('Failed to play the video.');
  };
  const handleProgress = (progress: any) => {
    // console.log('Video progress:', progress);
    let remainingSeconds = Math.floor(
      progress.playableDuration - progress.currentTime,
    );
    setNextVideoTime(remainingSeconds);
  };

  const handleVideoLoad = (data: any) => {
    setCurrentVideo(false);
    console.log('Video loaded:');
  };
  useEffect(() => {
    if (campaigns) {
      console.log('Scheduling videos');
      scheduleCampaignVideos();
      // Call this function once to start the schedule
    }
  }, [campaigns]);

  useEffect(() => {
    const fetchData = async () => {
      console.log('🔄 Fetching campaigns on first render...');
      await getCampaignsForToday();
    };

    fetchData(); // Call API on first render
  }, []); // Empty dependency array ensures this runs only once

  let currentVideoIndex = 0;
  let campaignSchedule: any = [];
  let timeoutId: any = null;

  // Function to clear previous schedules
  const clearPreviousSchedules = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    currentVideoIndex = 0;
    console.log('✅ Cleared previous schedules.');
  };

  // Function to schedule campaign videos based on start time in Vietnam Time (UTC+7)
  const scheduleCampaignVideos = () => {
    clearPreviousSchedules(); // Clear any previous schedules before rescheduling

    if (!campaigns?.length) {
      console.log('No campaigns available for scheduling.');
      addBugLog('No campaigns available for scheduling.');
      return;
    }

    campaignSchedule = campaigns.filter(campaign => campaign.start_time);

    if (!campaignSchedule.length) {
      console.log('No valid campaign schedules available.');
      addBugLog('No valid campaign schedules available.');
      return;
    }

    console.log('Campaign videos scheduled for today (Vietnam Time):');

    // Start scheduling videos
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

      // Skip to the next video after a short delay
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

  // Function to play the video
  const playVideo = (video: any) => {
    setCurrentVideo(video);
    addBugLog(`Playing scheduled video: ${video.name}`);

    setTimeout(() => {
      currentVideoIndex++;
      scheduleNextVideo();
    }, video.duration * 1000);
  };

  // Function to convert time to Vietnam Time (UTC+7) safely
  const convertToVietnamTime = (date: any) => {
    console.log('Original date:', date);

    try {
      // Convert to Vietnam Time (UTC+7) and extract only the time in 24-hour format
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
      console.log(`❌ Error converting date: ${date}`, error);
      addBugLog(`❌ Error converting date: ${date}`);
      return null;
    }
  };

  const convertTimeToMilliseconds = (timeString: any) => {
    try {
      const [hours, minutes, seconds] = timeString.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
        throw new Error('Invalid time format');
      }
      return (hours * 3600 + minutes * 60 + seconds) * 1000; // Convert to milliseconds
    } catch (error) {
      console.log(
        `❌ Error converting time to milliseconds: ${timeString}`,
        error,
      );
      return NaN;
    }
  };
  const [isRowLayout, setIsRowLayout] = useState(true);

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
            borderWidth: 1,
          },
        ]}>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : isLoading ? (
          <ActivityIndicator size="large" color="#505E73" />
        ) : currentVideo ? (
          <>
            <View>
              {currentVideo && (
                <Video
                  key={currentVideo.path}
                  source={{uri: `file://${currentVideo.path}`}}
                  style={[styles.video]}
                  // controls
                  resizeMode="contain"
                  onLoad={handleVideoLoad}
                  onEnd={handleVideoEnd}
                  onError={handleVideoError}
                  onProgress={handleProgress}
                  poster={
                    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9hN28VhVYenw0Og7z1j95n6hQDYw6lMriBA&s'
                  }
                  posterResizeMode="cover"
                />
              )}
            </View>
            {/* {isLogoOverlayOn && ( */}
            <View style={styles.overlayImage}>
              <Image
                source={{uri: overlayImage}}
                style={{width: 80, height: 80}}
              />
            </View>
            {/* )} */}

            {isDateAndTimeOverlayOn && (
              <View
                style={[
                  styles.dateTimeOverlay,
                  {
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignContent: 'center',
                    padding: 5,
                    borderRadius: 5,
                  },
                ]}>
                <Text style={{color: 'white', fontSize: 22, fontWeight: '400'}}>
                  {currentTime}
                </Text>
              </View>
            )}

            {isBugCheckOverlayOn && (
              <View
                style={[
                  styles.bugOverlay,
                  {
                    position: 'absolute',
                    top: bugPosition.top,
                    left: bugPosition.left,
                    right: bugPosition.right,
                    bottom: bugPosition.bottom,
                    width: bugPosition.width,
                    height: bugPosition.height,
                  },
                ]}>
                <Text
                  style={[
                    {
                      textAlign: 'center',
                      fontSize: 22,
                      color: '#FFF',
                      marginBottom: 10,
                    },
                  ]}>
                  Bug Checking
                </Text>
                <ScrollView
                  ref={scrollViewRef}
                  style={[styles.scrollContainer]}
                  showsVerticalScrollIndicator={false}>
                  {bugLogs.map((log, index) => (
                    <Text key={index} style={styles.bugText}>
                      {log.timestamp}: {log.message}
                    </Text>
                  ))}
                </ScrollView>
              </View>
            )}

            <Text style={styles.secondsRemaining}>{nextVideoTime}</Text>
            {isDownloading && (
              <Text style={styles.downloadingText}>Downloading video...</Text>
            )}
            {/* </ViewShot> */}
          </>
        ) : (
          <View style={styles.ImageContainer}>
            <Image
              source={require('./assets/images/loading.jpg')} // Replace with actual path
              style={styles.image}
              resizeMode="contain" // Adjust how the image scales
            />

            {/* <View style={styles.loader}>
              <ActivityIndicator size="large" color="#505E73" />
              <Text style={styles.loadingText}>Please wait...</Text>
            </View>  */}
          </View>
        )}
      </View>
    </ViewShot>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  video: {
    width: '100%',
    minHeight: '100%',
  },

  videoTitle: {
    color: '#fff',
    fontSize: 16,
    position: 'absolute',
    zIndex: 10,
    bottom: 20,
  },
  loadingText: {
    color: '#000',
    fontSize: 18,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  image: {
    width: Dimensions.get('window').width, // Full width
    height: Dimensions.get('window').height, // Full height
  },
  secondsRemaining: {
    position: 'absolute',
    bottom: 10,
    right: 40,
    color: '#000',
    fontSize: 16,
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 50,
    width: 30,
    height: 30,
    textAlign: 'center',
    paddingTop: 3,
  },
  ImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5', // Background color (optional)
  },
  downloadingText: {
    position: 'absolute', // Position the text above the video
    bottom: 20, // Place it near the bottom
    right: 20, // Align to the bottom-right corner
    color: '#fff',
    fontSize: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Add a semi-transparent background
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
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
    top: 0,
    right: 0,
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
    overflow: 'hidden',
    position: 'absolute',
    // top: '50%',
    // left: '50%',
    // width: '90%',
    // height: '60%',
    // transform: [{translateX: '-50%'}, {translateY: '-50%'}],
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    color: '#fff',
    borderRadius: 5,
    padding: 10,
    borderWidth: 1,
    borderColor: 'red',
  },
  bugOverlayOld: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    borderWidth: 1,
    borderColor: 'red',
    color: '#fff',
    borderRadius: 5,
    padding: 10,
  },
  scrollContainer: {
    overflow: 'hidden', // Ensures no extra content is visible outside
  },
  bugText: {
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: 13,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
const styles2 = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  videoContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowLayout: {
    flexDirection: 'row', // Videos placed side-by-side
    justifyContent: 'space-between',
  },
  columnLayout: {
    flexDirection: 'column', // Videos stacked
    justifyContent: 'center',
  },
  video: {
    width: '45%', // Adjust for side-by-side view
    height: 200,
    backgroundColor: '#333',
  },
});

export default VideoPlayerComponent;
