import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import Video from 'react-native-video';
import { getMethod } from './network/network_api_calls';
import moment from 'moment'; // Install moment.js for easier date-time comparisons
const VideoPlaylist = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [videos, setVideos] = useState<any>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentVideoDuration, setCurrentVideoDuration] = useState(0);
  const [showErrorImage, setShowErrorImage] = useState(false);
  const [isImage, setIsImage] = useState(false);

  const videoPlayerRef = useRef(null);

  useEffect(() => {
    getCampaigns();
  }, []);

  // const getCampaigns = async () => {
  //   setIsLoading(true);
  //   try {
  //     const response = await getMethod('/api/fetch-campaigns-for-today');
  //     setVideos(response.campaigns || []);
  //     setIsLoading(false);
  //   } catch (error) {
  //     console.error('Error fetching campaigns:', error);
  //     setIsLoading(false);
  //   }
  // };

  const getCampaigns = async () => {
    setIsLoading(true);
    try {
      const response = await getMethod('/api/fetch-campaigns-for-today');
      const currentTime = moment(); // Get current time
  
      // Campaigns to play now
      const immediateCampaigns:any = [];
      // Campaigns to schedule
      const upcomingCampaigns:any = [];
  
      // Process campaigns
      (response.campaigns || []).forEach((campaign: any) => {
        if (!campaign.start_time) {
          console.warn('Campaign start_time is missing:', campaign);
          return; // Skip this campaign
        }
  
        // Parse start time in 24-hour format
        const campaignStartTime = moment(campaign.start_time, 'HH:mm:ss', true);
        if (!campaignStartTime.isValid()) {
          console.warn('Invalid campaign start_time format:', campaign.start_time);
          return; // Skip this campaign
        }
  
        // Calculate time difference
        const timeDifference = campaignStartTime.diff(currentTime, 'milliseconds');
        if (timeDifference <= 0 && Math.abs(timeDifference) < 60000) {
          // Campaign is within the current minute
          immediateCampaigns.push(campaign);
        } else if (timeDifference > 0) {
          // Schedule campaign
          upcomingCampaigns.push({ campaign, delay: timeDifference });
        }
      });
  
      // Set immediate campaigns
      setVideos(immediateCampaigns);
  
      // Schedule upcoming campaigns
      upcomingCampaigns.forEach(({ campaign, delay }:any) => {
        console.log(`Scheduling campaign "${campaign.campaign_name}" to start in ${delay}ms`);
        setTimeout(() => {
          setVideos((prevVideos:any) => [...prevVideos, campaign]); // Add campaign to the video list
        }, delay);
      });
  
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setIsLoading(false);
    }
  };
  const handleVideoEnd = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowErrorImage(false);
      setIsImage(false);
    } else {
      console.log('Playlist ended');
      setCurrentIndex(0);
      setShowErrorImage(false);
      setIsImage(false);
    }
  };

  const handleImageDisplay = (duration: number) => {
    setTimeout(() => {
      handleVideoEnd();
    }, duration * 1000);
  };

  const handleVideoLoad = (data: any) => {
    setCurrentVideoDuration(data.duration); // Set video duration
  };

  const handleProgress = (data: any) => {
    if (isImage && data.currentTime >= currentVideoDuration) {
      handleVideoEnd();
    }
  };

  const handleError = (error: any) => {
    console.error('Video Error:', error);
    setShowErrorImage(true);
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
        <Video
          ref={videoPlayerRef}
          source={{ uri: currentMedia.video_url }}
          style={styles.video}
          controls={true}
          resizeMode="contain"
          onEnd={handleVideoEnd}
          onError={handleError}
          onLoad={handleVideoLoad}
          onProgress={handleProgress}
          poster={currentMedia.thumbnail}
          posterResizeMode="cover"
          repeat={false}
        />
      );
    }
  };

  useEffect(() => {
    if (videos.length > 0) {
      const currentMedia = videos[currentIndex];
      if (currentMedia.file_type === 'image') {
        setIsImage(true);
        handleImageDisplay(currentMedia.duration);
      } else {
        setIsImage(false);
      }
    }
  }, [currentIndex, videos]);

  return (
    <View style={styles.container}>
      {renderMedia()}
      <View style={styles.controls}>
        <Text style={styles.controlButton}>
          Playing media {currentIndex + 1} of {videos.length}
          {'\n'}
          Duration: {currentVideoDuration}s
        </Text>
      </View>
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
    height: '80%',
  },
  image: {
    width: '100%',
    height: '80%',
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
});

export default VideoPlaylist;
