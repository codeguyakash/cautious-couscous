import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import RNFS from 'react-native-fs';
import {PermissionsAndroid, Platform} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {getMethod} from './network/network_api_calls';
import {BASE_URL} from '../env/base_url';
import * as Progress from 'react-native-progress'; // Import react-native-progress

const VideoDownloaderComponent: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0); // Collective progress
  const [isInitializing, setIsInitializing] = useState<boolean>(true); // To display initialization message
  const folderPath = `${RNFS.DocumentDirectoryPath}/Prowtech`;
  const navigation: any = useNavigation();

  const requestStoragePermissions = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
            {
              title: 'Media Permission Required',
              message:
                'This app needs access to your media files to download videos.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            },
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        } else {
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          ]);
          return (
            granted[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] ===
              PermissionsAndroid.RESULTS.GRANTED &&
            granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] ===
              PermissionsAndroid.RESULTS.GRANTED
          );
        }
      }
      return true; // No permissions needed for iOS
    } catch (err) {
      console.warn('Permission error:', err);
      return false;
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
      console.error('Error ensuring directory exists:', err);
      throw err;
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
          // console.log(`Downloading video: ${fileName}`);
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
            console.error(`Error downloading video: ${fileName}`, err);
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
      console.error('Error downloading videos:', err);
      throw err;
    }
  };

  const getCampaigns = async (): Promise<void> => {
    setIsLoading(true);
    setIsInitializing(false); // Initialization complete
    try {
      const response = await getMethod('/download_campaigns_videos');
      const campaigns = response.campaigns || [];
      // console.log('Fetched campaigns:', campaigns);

      await ensureDirectoryExists();
      const downloadedVideos: any = await downloadVideos(campaigns);

      if (downloadedVideos.length > 0) {
        console.log('All videos downloaded successfully.');
        navigation.navigate('RealVideoPlayer');
      } else {
        setError('No videos available to play.');
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError('Error fetching campaigns.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async (): Promise<void> => {
      const hasPermissions = await requestStoragePermissions();
      if (!hasPermissions) {
        setError('Storage permissions denied.');
        return;
      }
      await getCampaigns();
    };

    initialize();
  }, []);

  return (
    <View style={styles.container}>
      {isInitializing ? (
        <View style={styles.initializingContainer}>
          <ActivityIndicator size="large" color="#6200EE" />
          <Text style={styles.initializingText}>
            Please wait while initializing...
          </Text>
        </View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {isLoading
              ? `Please wait while initializing...`
              : 'Initialization done.'}
          </Text>
          <Progress.Bar
            progress={progress / 100}
            width={300}
            color="#6200EE"
            borderRadius={5}
          />
          <Text style={styles.progressPercentage}>{Math.floor(progress)}%</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  initializingContainer: {
    alignItems: 'center',
  },
  initializingText: {
    marginTop: 10,
    fontSize: 18,
    color: '#333',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  progressText: {
    fontSize: 18,
    color: '#000',
    marginBottom: 10,
  },
  progressPercentage: {
    marginTop: 8,
    fontSize: 16,
    color: '#000',
  },
});

export default VideoDownloaderComponent;
