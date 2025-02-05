import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Image,
} from 'react-native';
import Video from 'react-native-video';
import RNFS from 'react-native-fs';

const VideoPlayerComponent2 = () => {
  const [videoFiles, setVideoFiles] = useState<any[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isPlayingFirst, setIsPlayingFirst] = useState(true); // Toggle between two video players

  const videoRef1 = useRef(null);
  const videoRef2 = useRef(null);
  const folderPath = `${RNFS.DocumentDirectoryPath}/Prowtech`;

  useEffect(() => {
    fetchVideoFiles();
  }, []);

  // Fetch video files
  const fetchVideoFiles = async () => {
    try {
      const exists = await RNFS.exists(folderPath);
      if (!exists) return;
      const files = await RNFS.readDir(folderPath);
      const videoFiles = files
        .filter(
          file =>
            file.isFile() &&
            (file.name.endsWith('.mp4') || file.name.endsWith('.mkv')),
        )
        .map(file => file.path);

      if (videoFiles.length > 0) setVideoFiles(videoFiles);
    } catch (err) {
      console.log('Error fetching video files:', err);
    }
  };

  // Handle video playback completion
  const handleVideoEnd = () => {
    const nextIndex = (currentVideoIndex + 1) % videoFiles.length;
    setIsBuffering(true);

    setTimeout(() => {
      setCurrentVideoIndex(nextIndex);
      setIsPlayingFirst(!isPlayingFirst); // Toggle video player
      setIsBuffering(false);
    }, 100); // Minimal delay for smooth transition
  };

  return (
    <View style={styles.container}>
      {videoFiles.length > 0 ? (
        <>
          {/* First Video Player */}
          {isPlayingFirst ? (
            <Video
              ref={videoRef1}
              source={{uri: `file://${videoFiles[currentVideoIndex]}`}}
              style={styles.video}
              resizeMode="cover"
              onEnd={handleVideoEnd}
              paused={!isPlayingFirst}
              onBuffer={() => setIsBuffering(true)}
              onReadyForDisplay={() => setIsBuffering(false)}
              bufferConfig={{
                minBufferMs: 2000,
                maxBufferMs: 10000,
                bufferForPlaybackMs: 1500,
                bufferForPlaybackAfterRebufferMs: 2000,
              }}
            />
          ) : (
            <Video
              ref={videoRef2}
              source={{uri: `file://${videoFiles[currentVideoIndex]}`}}
              style={styles.video}
              resizeMode="cover"
              onEnd={handleVideoEnd}
              paused={isPlayingFirst}
              onBuffer={() => setIsBuffering(true)}
              onReadyForDisplay={() => setIsBuffering(false)}
              bufferConfig={{
                minBufferMs: 2000,
                maxBufferMs: 10000,
                bufferForPlaybackMs: 1500,
                bufferForPlaybackAfterRebufferMs: 2000,
              }}
            />
          )}
        </>
      ) : (
        <View style={styles.noVideosContainer}>
          <Text style={styles.noVideosText}>No videos found</Text>
        </View>
      )}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  loadingContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
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

export default VideoPlayerComponent2;
