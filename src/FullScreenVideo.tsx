import React from 'react';
import { View, StyleSheet } from 'react-native';
import Video from 'react-native-video';

const FullScreenVideo = ({ route }: any) => {
  const { videoUrl } = route.params;

  // route.setOptions({
  //   headerShown: false,
  // });

  return (
    <View style={styles.container}>
      <Video
        source={{ uri: videoUrl }}
        style={styles.video}
        controls={false}
        resizeMode="contain"
      />
    </View>
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
  },
});

export default FullScreenVideo;
