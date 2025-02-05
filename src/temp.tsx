import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  StyleSheet,
  Text,
  Animated,
  Image,
  Dimensions,
} from 'react-native';
import RNFS from 'react-native-fs';
import Video from 'react-native-video';

const folderPath = `${RNFS.DocumentDirectoryPath}/Prowtech`;

const TempVideoPlayer = () => {
  const videoRef = useRef(null);
  const [videoFiles, setVideoFiles] = useState<string[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current; // Initially hidden

  useEffect(() => {
    fetchVideoFiles();
  }, []);

  const fetchVideoFiles = async () => {
    try {
      const exists = await RNFS.exists(folderPath);
      if (!exists) {
        console.log('Folder does not exist:', folderPath);
        return;
      }

      const files = await RNFS.readDir(folderPath);
      const videos = files
        .filter(file => file.isFile() && /\.(mp4|mkv)$/.test(file.name))
        .map(file => file.path);

      if (videos.length > 0) {
        setVideoFiles(videos);
      } else {
        console.log('No video files found in folder:', folderPath);
      }
    } catch (err) {
      console.log('Error fetching video files:', err);
    }
  };

  const handleVideoEnd = () => {
    if (videoFiles.length === 0) return;

    // Fade out current video and show loading image
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 1, // Smooth fade-out
      useNativeDriver: true,
    }).start(() => {
      const nextIndex = (currentVideoIndex + 1) % videoFiles.length;
      setCurrentVideoIndex(nextIndex);
      setIsLoading(true); // Show loading image
    });
  };

  const handleLoadStart = () => setIsLoading(true);

  const handleReady = () => {
    setIsLoading(false); // Hide image when video is fully ready
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1, // Smooth fade-in for video
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.container}>
      {videoFiles.length > 0 ? (
        <>
          {isLoading && (
            <View style={styles.loadingContainer}>
              {/* <Image
                source={require('./assets/images/loading.jpg')} // Replace with actual path
                style={styles.image}
                resizeMode="cover"
              /> */}
            </View>
          )}
          <Animated.View style={{...styles.videoContainer, opacity: fadeAnim}}>
            <Video
              key={videoFiles[currentVideoIndex]}
              source={{uri: videoFiles[currentVideoIndex]}}
              ref={videoRef}
              style={styles.video}
              resizeMode="cover"
              repeat={false}
              onLoadStart={handleLoadStart}
              onReadyForDisplay={handleReady}
              onEnd={handleVideoEnd}
              muted
            />
          </Animated.View>
        </>
      ) : (
        <View style={styles.noVideosContainer}>
          <Text style={styles.noVideosText}>No Videos Available</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  noVideosContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noVideosText: {
    color: '#fff',
    fontSize: 18,
  },
  loadingContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  image: {
    width: Dimensions.get('window').width, // Full width
    height: Dimensions.get('window').height, // Full height
  },
});

export default TempVideoPlayer;
