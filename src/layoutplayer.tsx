import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  StyleSheet,
  Text,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import Video from 'react-native-video';
import RNFS from 'react-native-fs';

const LayoutVideoPlayer = () => {
  const [videoFiles, setVideoFiles] = useState<string[]>([]);
  const [currentIndex1, setCurrentIndex1] = useState(0);
  const [currentIndex2, setCurrentIndex2] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);

  const videoRef1 = useRef<any | null>(null);
  const videoRef2 = useRef<any | null>(null);
  const folderPath = `${RNFS.DocumentDirectoryPath}/Prowtech`;

  useEffect(() => {
    fetchVideoFiles();
  }, []);

  // Fetch videos from local storage with retries
  const fetchVideoFiles = async (retryCount = 0) => {
    try {
      const exists = await RNFS.exists(folderPath);
      if (!exists) {
        setIsLoading(false);
        return;
      }

      const files = await RNFS.readDir(folderPath);
      const videos = files
        .filter(
          file =>
            file.isFile() &&
            (file.name.endsWith('.mp4') || file.name.endsWith('.mkv')),
        )
        .map(file => file.path);

      if (videos.length > 1) {
        setVideoFiles(videos);
        setIsLoading(false);
      } else if (retryCount < 3) {
        setTimeout(() => fetchVideoFiles(retryCount + 1), 1000); // Retry after 1 sec
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      console.log('Error fetching video files:', err);
      setIsLoading(false);
    }
  };

  // Handles switching for video 1
  const handleVideoEnd1 = () => {
    setIsBuffering(true);
    requestAnimationFrame(() => {
      setCurrentIndex1(prev => (prev + 2) % videoFiles.length);
      setIsBuffering(false);
    });
  };

  // Handles switching for video 2
  const handleVideoEnd2 = () => {
    setIsBuffering(true);
    requestAnimationFrame(() => {
      setCurrentIndex2(prev => (prev + 2) % videoFiles.length);
      setIsBuffering(false);
    });
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Loading videos...</Text>
        </View>
      ) : videoFiles.length > 1 ? (
        <>
          {/* First Video Player */}
          <Video
            ref={videoRef1}
            source={{uri: `file://${videoFiles[currentIndex1]}`}}
            style={styles.video}
            resizeMode="contain"
            onEnd={handleVideoEnd1}
            paused={false}
            onBuffer={() => setIsBuffering(true)}
            onReadyForDisplay={() => setIsBuffering(false)}
          />

          {/* Second Video Player */}
          <Video
            ref={videoRef2}
            source={{uri: `file://${videoFiles[currentIndex2]}`}}
            style={styles.video}
            resizeMode="contain"
            onEnd={handleVideoEnd2}
            paused={false}
            muted={true}
            onBuffer={() => setIsBuffering(true)}
            onReadyForDisplay={() => setIsBuffering(false)}
          />
        </>
      ) : (
        <View style={styles.noVideosContainer}>
          <Text style={styles.noVideosText}>Not enough videos found</Text>
        </View>
      )}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
  },
  video: {
    width: '100%',
    height: '50%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 10,
  },
  noVideosContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  noVideosText: {
    color: '#fff',
    fontSize: 18,
  },
});

export default LayoutVideoPlayer;
