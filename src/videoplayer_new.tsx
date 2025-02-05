import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, View, Text } from 'react-native';
import Video from 'react-native-video';
import RNFS from 'react-native-fs';
import { useNavigation } from '@react-navigation/native';
import ViewShot from 'react-native-view-shot';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { postMethod } from './network/network_api_calls';

let scheduledTimeouts: any[] = [];

const VideoPlayerComponentNew = () => {
  const [videoFiles, setVideoFiles] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [currentVideo, setCurrentVideo] = useState<any>(null);
  const [videoIndex, setVideoIndex] = useState<number>(0);
  const [isVideoReady, setIsVideoReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [videoKey, setVideoKey] = useState<number>(0);

  const navigation = useNavigation();
  const folderPath = `${RNFS.DocumentDirectoryPath}/Prowtech`;

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
    fetchVideoFiles();
  }, []);

  useEffect(() => {
    if (campaigns.length > 0) {
      scheduleVideos(campaigns);
    }
  }, [campaigns]);

  const fetchVideoFiles = async () => {
    console.log('Fetching video files...');
    try {
      const exists = await RNFS.exists(folderPath);
      if (!exists) {
        console.log('❌ Directory does not exist:', folderPath);
        setError('❌ Directory does not exist.');
        setIsLoading(false);
        return;
      }

      const files = await RNFS.readDir(folderPath);
      const videoFiles = files
        .filter(file => file.isFile() && (file.name.endsWith('.mp4') || file.name.endsWith('.mkv')))
        .map(file => ({ path: file.path, name: file.name }));

      if (videoFiles.length === 0) {
        console.log('❌ No video files found.');
        setError('❌ No video files found.');
        setIsLoading(false);
        return;
      }

      setVideoFiles(videoFiles);
      setIsLoading(false);
      getCampaignsForToday();
    } catch (err: any) {
      console.log('❌ Error fetching video files:', err);
      setError(`❌ Error: ${err.message}`);
      setIsLoading(false);
    }
  };

  const getCampaignsForToday = async (): Promise<void> => {
    try {
      const device_id = await AsyncStorage.getItem('device_id');
      const response = await postMethod('/api/fetch-device-campaigns', { device_id });

      console.log('📢 CAMPAIGNS:', response.status, response.campaigns.length);
      if (response && Array.isArray(response.campaigns)) {
        setCampaigns(response.campaigns);
      } else {
        setCampaigns([]);
      }
    } catch (err) {
      console.error('❌ Error fetching campaigns:', err);
      setError('❌ Error fetching campaigns.');
    }
  };

  const clearScheduledVideos = () => {
    scheduledTimeouts.forEach(clearTimeout);
    scheduledTimeouts = [];
    console.log('🗑️ Cleared all scheduled videos.');
  };

  const scheduleVideos = (videos: any[]) => {
    console.log('📅 Scheduling videos...');
    clearScheduledVideos();

    videos.forEach((video, index) => {
      const startTime = parseTimeToTimestamp(video.start_time);
      const nowTime = new Date().getTime();
      let delay = startTime - nowTime;

      if (delay < 0) {
        // If the scheduled time has already passed, play the video immediately
        console.log(`🚀 Video ${video.file_name} is late, playing now!`);
        delay = 0;
      } else {
        console.log(`⏳ Video ${video.file_name} scheduled in ${delay}ms`);
      }

      const timeoutId = setTimeout(() => {
        playScheduledVideo(video, index);
      }, delay);

      scheduledTimeouts.push(timeoutId);
    });

    console.log('✅ Videos scheduled.');
  };

  const parseTimeToTimestamp = (timeString: string) => {
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    const now = new Date();
    now.setHours(hours, minutes, seconds, 0);
    return now.getTime();
  };

  const playScheduledVideo = (campaignVideo: any, index: number) => {
    setIsVideoReady(false);
    const foundVideo = videoFiles.find(file => String(file.name) === String(campaignVideo.file_name));

    if (foundVideo) {
      setTimeout(() => {
        setVideoIndex(index);
        setCurrentVideo(foundVideo);
        setVideoKey(prevKey => prevKey + 1);
      }, 50);
    } else {
      console.log(`❌ Error: Video not found for campaign: ${campaignVideo.file_name}`);
    }
  };

  const handleVideoLoad = () => {
    setIsVideoReady(true);
  };

  const handleVideoEnd = () => {
    console.log('🎬 Video ended.');

    const nextIndex = videoIndex + 1;
    if (nextIndex < campaigns.length) {
      playScheduledVideo(campaigns[nextIndex], nextIndex);
    } else {
      console.log('🎥 Restarting campaign videos.');
      playScheduledVideo(campaigns[0], 0);
    }
  };

  return (
    <ViewShot style={styles.container}>
      <View style={styles.container}>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : isLoading ? (
          <ActivityIndicator size="large" color="#505E73" />
        ) : (
          <>
            {currentVideo && (
              <Video
                key={videoKey}
                source={{ uri: `file://${currentVideo.path}` }}
                style={styles.video}
                resizeMode="contain"
                onLoad={handleVideoLoad}
                onEnd={handleVideoEnd}
                repeat={false}
                useTextureView={false}
              />
            )}
          </>
        )}
      </View>
    </ViewShot>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default VideoPlayerComponentNew;
