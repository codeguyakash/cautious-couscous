import React, {useState, useRef, useEffect} from 'react';
import {View, StyleSheet, Text, Image} from 'react-native';
import Video from 'react-native-video';
import {getMethod} from './network/network_api_calls';

const VideoPlaylist = (videoSchedule: any) => {
  const [isLoading, setIsLoading] = useState(false);

  const [videos, setVideos] = useState<any>([]);

  const getCampaigns = async () => {
    setIsLoading(true);
    try {
      const response = await getMethod('/api/fetch-campaigns-for-today');
      // console.warn("##", response.campaigns, response.status)
      setVideos(response.campaigns || []);
      setIsLoading(false);
    } catch (error) {
      // console.log("Error", error)
    }
  };

  const [currentIndex, setCurrentIndex] = useState<any>(0);
  const [showErrorImage, setShowErrorImage] = useState(false);
  const videoPlayerRef = useRef(null);
  const [currentVideoDuration, setCurrentVideoDuration] = useState('');
  const [repeat, setRepeat] = useState(0);
  const [repeatCountTemp, setRepeatCountTemp] = useState(1);
  const [isRepeat, setIsRepeat] = useState(false);

  useEffect(() => {
    getCampaigns();
  }, []);
  const handleVideoEnd1 = () => {
    if (currentIndex < videos.length - 1) {
      if (videos[currentIndex]?.repeat > 1) {
        //ci =0

        if (
          videos[currentIndex]?.campaign_id ==
          videos[currentIndex + 1]?.campaign_id
        ) {
          setRepeatCountTemp(repeatCountTemp + 1); //3
          setRepeat(
            videos[currentIndex]?.repeat + videos[currentIndex + 1]?.repeat,
          ); //4

          setCurrentIndex(currentIndex + 1); //1
        } else {
          setCurrentIndex(currentIndex - 1); //0
          setRepeatCountTemp(repeatCountTemp + 1); //3
        }
      } else {
        setRepeatCountTemp(repeat + 1); //3

        if (repeatCountTemp < repeat) {
          setCurrentIndex(currentIndex + 1);
          return;
        }
        if (
          videos[currentIndex]?.repeat > 1 &&
          videos[currentIndex]?.campaign_id ==
            videos[currentIndex + 1]?.campaign_id
        ) {
          setCurrentIndex(currentIndex - 1);
        } else {
          setCurrentIndex(currentIndex + 1);
        }
        setCurrentIndex(currentIndex + 1);
      }
      // setCurrentIndex(currentIndex + 1);
      // setShowErrorImage(false); // Reset error image state
    } else {
      console.log('Playlist ended');
      setCurrentIndex(0);
      setShowErrorImage(false); // Reset error image state
    }
  };

  const handleVideoEnd = () => {
    const currentCampaignId = videos[currentIndex]?.campaign_id;
    if (!currentCampaignId) return 0;

    const filteredVideos = videos.filter(
      (video: {campaign_id: any}) => video.campaign_id === currentCampaignId,
    );

    if (currentIndex < videos.length - 1) {
      if (videos[currentIndex]?.repeat > 1) {
        if (currentCampaignId == videos[currentIndex + 1]?.campaign_id) {
          console.log(repeatCountTemp > repeat, repeatCountTemp, repeat);

          if (repeatCountTemp > repeat) {
            console.log('yaha gya');

            setCurrentIndex(filteredVideos?.length);
          } else {
            console.log('ki yaha gya');
            console.log('current index', currentIndex);

            setCurrentIndex(currentIndex + 1);
            setRepeatCountTemp(repeatCountTemp + 1);
          }
          // setCurrentIndex(currentIndex + 1);
        } else {
          console.log('yah v gya hai');
          if (repeatCountTemp >= repeat) {
            setCurrentIndex(filteredVideos?.length);
            setRepeatCountTemp(1);
          } else {
            console.log('yaha fasa cm');

            setCurrentIndex(currentIndex - 1);
            setRepeatCountTemp(repeatCountTemp + 1);

          }
        }
      } else {
        console.log('yaha aa chuka hu');

        setCurrentIndex(currentIndex + 1);
      }
    } else {
      console.log('Playlist ended');
      setCurrentIndex(null);
      setShowErrorImage(false); // Reset error image state
    }
  };

  const handleError = (error: any) => {
    console.log('Video Error:', error);

    // Show the error image
    setShowErrorImage(true);

    // Wait for the duration of the current video before moving to the next
    let currentVideoDuration: any = videos[currentIndex]?.duration || 0;
    setCurrentVideoDuration(currentVideoDuration);
    let intervval = setInterval(() => {
      currentVideoDuration = currentVideoDuration - 1;
      setCurrentVideoDuration(currentVideoDuration);
    }, 1000);

    setTimeout(() => {
      clearInterval(intervval);
      if (currentIndex < videos.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCurrentIndex(0);
      }
      setShowErrorImage(false); // Reset error image state
    }, currentVideoDuration * 1000);
  };

  const handleVideoLoad = (data: any) => {
    // console.log('Video Metadata:', data);
    const currentCampaignId = videos[currentIndex]?.campaign_id;
    console.log('currentCampaignId', currentCampaignId);
    if(currentCampaignId == null && videos[currentIndex]?.campaign_name=='advertisement'){
      console.log('Gap Video');
      // setRepeatCountTemp(repeatCountTemp + 1);
      // setCurrentIndex(currentIndex + 1);
      setTimeout(() => {
        const filteredVideosGaps = videos.filter(
          (video: {campaign_name: any}) => video.campaign_name === 'advertisement',
        );
        setCurrentIndex(filteredVideosGaps?.length);
      }, videos[currentIndex]?.gap *1000 );

    }else if(!currentCampaignId){
      
      return 0;
    }else{
      const filteredVideos = videos.filter(
        (video: {campaign_id: any}) => video.campaign_id === currentCampaignId,
      );
  
      const totalRepeats = filteredVideos.reduce(
        (sum: number, video: any) => sum + parseInt(video.repeat || 0, 10),
        0,
      );
      setRepeat(totalRepeats);
    }

  
    setCurrentVideoDuration(data.duration); // Duration in seconds
  };
  const handleProgress = (data: any) => {
    // console.log('Video Metadata:', Math.floor(data.currentTime));
    // console.log('Video Metadata:', data);
    if (data.currentTime >= 10 && videos[currentIndex]?.campaign_id == null) {
      handleVideoEnd();
    }
    // setCurrentVideoDuration(data.duration); // Duration in seconds
  };

  return (
    <View style={styles.container}>
      {showErrorImage ? (
        <Image
          source={{uri: videos[currentIndex]?.thumbnail}}
          style={styles.image}
          resizeMode="contain"
        />
      ) : (
        <Video
          ref={videoPlayerRef}
          source={{uri: videos[currentIndex]?.video_url}}
          style={styles.video}
          controls={true}
          resizeMode="contain"
          onEnd={handleVideoEnd}
          onError={handleError}
          onLoad={handleVideoLoad} // Get duration when video is loaded
          poster={videos[currentIndex]?.thumbnail}
          posterResizeMode="cover"
          onProgress={handleProgress}
          repeat={isRepeat}
        />
      )}
      <View style={styles.controls}>
        <Text style={styles.controlButton}>
          Playing video {currentIndex + 1} of {videos.length}{' '}
          {currentVideoDuration}
          REPEAT COUNT TEMP: {repeatCountTemp}
          CURRENT INDEX : {currentIndex}
          REPEAT COUNT : {repeat}
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
