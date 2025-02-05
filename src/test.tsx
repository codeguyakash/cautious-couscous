import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, Image, Platform } from 'react-native';
import Video from 'react-native-video';
import { getMethod } from './network/network_api_calls';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import RNRestart from 'react-native-restart';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// const domain: String = 'prowtechnode.zenoheal.com';
const domain: String = 'chinese-marcus-ser-manchester.trycloudflare.com';

const Test = ({ navigation }: any) => {
    const [isLoading, setIsLoading] = useState(false);
    const [videos, setVideos] = useState<any>([]);
    const [defaultvideos, setDefaultVideos] = useState<any>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentVideoDuration, setCurrentVideoDuration] = useState(0);
    const [isImage, setIsImage] = useState(false);

    const [deviceInfo, setDeviceInfo] = useState<any>(null);



    let time = new Date().toLocaleString().toLocaleUpperCase();

    useEffect(() => {
        // Update navigation options inside useEffect
        navigation.setOptions({
            headerShown: false, // Hide the header
        });
    }, [navigation]);


    const [isLogoOverlayOn, setIsLogoOverlayOn] = useState(false);
    const [isBugCheckOverlayOn, setIsBugCheckOverlayOn] = useState(false);
    const [isDateAndTimeOverlayOn, setIsDateAndTimeOverlayOn] = useState(false);
    const [currentTime, setCurrentTime] = useState<string>('');

    const videoPlayerRef = useRef(null);
    const viewRefs = useRef(null);

    const formatDateTime = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
    };

    const getDeviceInfo = async () => {
        try {
            const deviceData = await AsyncStorage.getItem('device_info');
            if (deviceData) {
                setDeviceInfo(JSON.parse(deviceData));
            }
            if (deviceInfo?.device_logo_display === '1') {
                setIsLogoOverlayOn(true);
            } else {
                setIsLogoOverlayOn(false);
            }

        } catch (error) {
            console.error('Error checking access token:', error);
        }
    };


    useEffect(() => {
        getCampaigns();
        getDefaultVideos();
        getDeviceInfo();
        let webSocket: WebSocket;
        const connectWebSocket = () => {
            webSocket = new WebSocket(`wss://${domain}`);
            webSocket.onopen = () => {
                console.log('Connected to WebSocket server');
                webSocket.send(JSON.stringify({ type: 'greeting', payload: 'Hello Server' }));
            };
            webSocket.onmessage = (event: any) => {
                try {
                    const receivedMessage = event.data;
                    const message = JSON.parse(receivedMessage);

                    console.log('Received message:', message);

                    if (message.type === 'restart_app') {
                        restartApp();
                        return;
                    }
                    if (message.type === 'logo') {
                        const shouldShowLogo = message.action === 'on';
                        if (isLogoOverlayOn !== shouldShowLogo) {
                            setIsLogoOverlayOn(shouldShowLogo);
                        }
                        return;
                    }
                    if (message.type === 'bug') {
                        const shouldShowBugOverlay = message.action === 'on';
                        if (isBugCheckOverlayOn !== shouldShowBugOverlay) {
                            setIsBugCheckOverlayOn(shouldShowBugOverlay);
                        }
                        return;
                    }
                    if (message.type === 'date') {
                        const shouldShowDateOverlay = message.action === 'on';
                        if (isDateAndTimeOverlayOn !== shouldShowDateOverlay) {
                            setIsDateAndTimeOverlayOn(shouldShowDateOverlay);
                        }
                        return;
                    }
                    if (message.type === 'capture_screenshot') {
                        takeScreenshot();
                        return;
                    }

                } catch (error) {
                    console.log('Error parsing WebSocket message:', error);
                }
            };

            webSocket.onclose = () => {
                console.log('Disconnected from WebSocket server. Reconnecting...');
                connectWebSocket();
            };
            webSocket.onerror = (error: any) => {
                console.log('WebSocket encountered an error:', error);
                webSocket.close();
            };
        };
        connectWebSocket();

        const updateCurrentTime = () => {
            const now = new Date();
            setCurrentTime(formatDateTime(now));
        };
        const intervalId = setInterval(updateCurrentTime, 1000);

        return () => {
            if (webSocket) { webSocket.close(); }
            clearInterval(intervalId);
        };
    }, []);


    const getCampaigns = async () => {
        setIsLoading(true);
        // /api/device_log/save_device_log
        try {
            const response = await getMethod('/api/fetch-campaigns-for-today');
            // Append immediate campaigns to the existing videos array
            console.log('Array Length', response.campaigns.length, currentIndex);

            setVideos(response.campaigns || []);
            setCurrentIndex(0);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching campaigns:', error);
            setIsLoading(false);
        }
    };
    const getDefaultVideos = async () => {
        setIsLoading(true);
        try {
            const response = await getMethod('/api/default-videos');
            //   console.log("response", response);
            // Process campaigns
            setDefaultVideos(response.default_videos || []);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching campaigns:', error);
            setIsLoading(false);
        }
    };

    const restartApp = () => {
        RNRestart.Restart();
    };


    // Screenshot Logic
    const takeScreenshot = async () => {
        try {
            const uri = await captureRef(viewRefs, {
                format: 'png',
                quality: 0.8,
            });
            if (Platform.OS === 'android') {
                await CameraRoll.save(uri, { type: 'photo' });
                console.log('Screenshot saved to gallery:', uri);
                uploadScreenshot(uri);
            } else {
                console.log('Screenshot captured:', uri);
            }
        } catch (error) {
            console.log('Screenshot error:', error);
        }
    };

    const uploadScreenshot = async (uri: any) => {
        console.log(uri);

        try {
            const formData = new FormData();
            formData.append('file', {
                uri,
                name: 'screenshot.png',
                type: 'image/png',
            });

            // Send the POST request
            const res = await axios.post(`https://${domain}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('Screenshot uploaded successfully:', res.data);
        } catch (error) {
            console.log('Error uploading screenshot:', error);
        }

    };

    const handleVideoEnd = () => {
        if (currentIndex < videos.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            console.log('Playlist ended');
            setCurrentIndex(0);
            setVideos(defaultvideos);
        }
    };

    useEffect(() => {
        if (videos.length > 0) {
            const currentMedia = videos[currentIndex];
            if (currentMedia.file_type === 'image') {
                setIsImage(true);
                setTimeout(() => handleVideoEnd(), (currentMedia.duration || 5) * 1000);
            } else {
                setIsImage(false);
            }
        }
    }, [currentIndex, videos]);

    const handleVideoLoad = (data: any) => {
        setCurrentVideoDuration(data.duration);
    };

    const handleError = (error: any) => {
        console.error('Video Error:', error);
        handleVideoEnd();
    };


    const renderMedia = () => {
        const currentMedia = videos[currentIndex];

        if (!currentMedia) return null;

        if (isImage) {
            return (
                <Image
                    source={{ uri: currentMedia.video_url }}
                    style={styles.image}
                    resizeMode="contain"
                />
            );
        } else {
            return (
                <ViewShot ref={viewRefs} style={styles.container}>
                    <Video
                        ref={videoPlayerRef}
                        source={{ uri: currentMedia.video_url }}
                        style={styles.video}
                        controls={false}
                        resizeMode="contain"
                        onEnd={handleVideoEnd}
                        onError={handleError}
                        onLoad={handleVideoLoad}
                        poster={currentMedia.thumbnail}
                        posterResizeMode="cover"
                        repeat={false}
                    />

                    {/* {isLogoOverlayOn && ( */}
                    <View style={styles.overlayImage}>
                        <Image
                            source={{ uri: isLogoOverlayOn ? deviceInfo?.device_logo_on_status_file : deviceInfo?.device_logo_off_status_file }}
                            style={{ width: 80, height: 80 }}
                        />
                    </View>
                    {/* )} */}

                    {isDateAndTimeOverlayOn && (
                        <View style={styles.dateTimeOverlay}>
                            <Text style={{ color: "black", fontSize: 24, fontWeight: '600' }}>{currentTime}</Text>
                        </View>
                    )}

                    {isBugCheckOverlayOn && (
                        <View style={styles.bugOverlay}>
                            <View >
                                <Text style={{ textAlign: 'center', fontSize: 22, color: '#FFF' }}>Bug Checking</Text>
                                <Text style={styles.bugText}>Logs:</Text>
                                <Text style={styles.bugText}>Log entry 1...</Text>
                                <Text style={styles.bugText}>Log entry 2...</Text>
                            </View>
                        </View>
                    )}
                </ViewShot>


            );
        }
    };

    return (
        <View style={styles.container}>
            {isLoading ? (
                <Text style={styles.loadingText}>Loading...</Text>
            ) : (
                renderMedia()
            )}
            <View style={styles.controls}>
                <Text style={styles.controlButton}>
                    Playing media {currentIndex + 1} of {videos.length}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // justifyContent: 'center', // Center vertically
        // alignItems: 'center', // Center horizontally
        backgroundColor: 'transparent', // Ensure the background is black for a clean full-screen experience
    },
    video: {
        width: '100%',
        height: '100%',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    controls: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    controlButton: {
        color: '#fff',
        fontSize: 18,
        marginTop: 10,
    },
    loadingText: {
        color: '#fff',
        fontSize: 18,
        textAlign: 'center',
        marginTop: 20,
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
        top: 10,
        right: 10,
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
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '90%',
        height: '60%',
        transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        color: '#fff',
        borderRadius: 5,
        padding: 10,
    },
    bugText: {
        color: '#fff',
    },
});

export default Test;
