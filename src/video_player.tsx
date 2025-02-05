import React from 'react';
import { View, StyleSheet } from 'react-native';
import Video from 'react-native-video';

const VideoPlayer = ({ url }: any) => (

    <View style={styles.container}>
        <Video
            source={{ uri: url }}
            style={styles.video}
            controls={false}
            fullscreen={true}
        />
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    video: {
        width: '100%',
        height: 200,
    },
});

export default VideoPlayer;
