import React from 'react';
import {StyleSheet, Dimensions} from 'react-native';
import Video from 'react-native-video';

interface VideoPlayerProps {
  source: string;
  onBuffer: (e: any) => void;
  onError: (error: any) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  source,
  onBuffer,
  onError,
}) => {
  return (
    <Video
      source={{uri: source}}
      style={styles.video}
      resizeMode="contain"
      repeat
      onBuffer={onBuffer}
      onError={onError}
    />
  );
};

const {width, height} = Dimensions.get('window');

const styles = StyleSheet.create({
  video: {
    width: width,
    height: height / 2,
  },
});

export default VideoPlayer;
