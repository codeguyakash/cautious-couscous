import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, Text } from "react-native";
import Video from "react-native-video";

const RealTimeVideoPlayer = () => {
    const [currentVideo, setCurrentVideo] = useState<any>(null);
    const [retryCount, setRetryCount] = useState(0); // Track reconnection attempts
    const wsRef = useRef<WebSocket | null>(null);
    const videoPlayerRef = useRef(null);

    const MAX_RETRY_DELAY = 30000; // Maximum delay (30 seconds)

    const connectWebSocket = () => {
        // const ws = new WebSocket("ws://192.168.29.16:3000");
        const ws = new WebSocket("wss://prowtechnode.zenoheal.com");
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("Connected to WebSocket server");
            setRetryCount(0); // Reset retry count on successful connection
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.type === "start_video") {
                console.log("Received video start message:", message.video);
                setCurrentVideo(message.video);
            }
        };

        ws.onclose = () => {
            console.log("Disconnected from WebSocket server. Attempting to reconnect...");
            reconnectWebSocket(); // Trigger reconnection logic
        };

        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
            ws.close(); // Close WebSocket on error to trigger reconnection
        };
    };

    const reconnectWebSocket = () => {
        // Implement exponential backoff for reconnection attempts
        const retryDelay = Math.min(1000 * 2 ** retryCount, MAX_RETRY_DELAY); // Exponential delay

        console.log(`Reconnecting in ${retryDelay / 1000} seconds...`);
        setTimeout(() => {
            setRetryCount((prev) => prev + 1); // Increment retry count
            connectWebSocket(); // Attempt to reconnect
        }, 0);
    };

    useEffect(() => {
        // connectWebSocket();

        // Cleanup WebSocket on component unmount
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, []);

    const handleVideoLoad = (data: any) => {
        console.log("Video loaded:", data);
    };

    const handleVideoEnd = () => {
        console.log("Video ended");
        setCurrentVideo(null);
    };

    return (
        <View style={styles.container}>
            {currentVideo ? (
                <Video
                    ref={videoPlayerRef}
                    source={{ uri: currentVideo.video_url }}
                    style={styles.video}
                    resizeMode="contain"
                    paused={false}
                    onLoad={handleVideoLoad}
                    onEnd={handleVideoEnd}
                />
            ) : (
                <Text style={styles.message}>Waiting for next video...</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "black",
    },
    video: {
        width: "100%",
        height: "100%",
    },
    message: {
        color: "white",
        fontSize: 18,
    },
});

export default RealTimeVideoPlayer;
