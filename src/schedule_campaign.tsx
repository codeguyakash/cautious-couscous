import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from "react-native";
import VideoPlayer from "./video_player";

const { width } = Dimensions.get("window");

const ScheduleContent = ({ campaignData }: any) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [campaigns, setCampaigns] = useState<any[]>(campaignData || []);
  const [playingVideoId, setPlayingVideoId] = useState<number | null>(null);
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // const checkAndPlayVideo = () => {
  //   const currentDate = new Date();

  //   for (const campaign of campaigns) {
  //     const campaignStartDate = new Date(campaign.start_date);
  //     const campaignEndDate = new Date(campaign.end_date);
  //     const campaignStartTime = campaign.start_time.split(":");

  //     if (
  //       currentDate >= campaignStartDate &&
  //       currentDate <= campaignEndDate &&
  //       currentDate.getHours() === parseInt(campaignStartTime[0], 10) &&
  //       currentDate.getMinutes() === parseInt(campaignStartTime[1], 10)
  //     ) {
  //       setPlayingVideoUrl(campaign.video_url);
  //       setIsVideoPlaying(true);
  //       return;
  //     }
  //   }

  //   setPlayingVideoUrl(null);
  //   setIsVideoPlaying(false);
  // };


  // useEffect(() => {
  //   const interval = setInterval(checkAndPlayVideo, 1000);
  //   return () => clearInterval(interval);
  // }, [campaigns]);

  useEffect(() => {
    setCampaigns(campaignData || []);

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [campaignData]);

  const handlePlay = (campaignId: number) => {
    setPlayingVideoId(campaignId === playingVideoId ? null : campaignId);
  };

  const PlayNextVideo = (video_url: any) => {
    return <VideoPlayer url={video_url} />;
  };

  if (isVideoPlaying && playingVideoUrl) {
    return (
      <View style={styles.videoContainer}>
        <VideoPlayer url={playingVideoUrl} />
      </View>
    );
  }

  const renderCampaignCard = (campaign: any) => {
    // const capitalize = (str: string) =>
    //   str
    //     .split(' ')
    //     .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    //     .join(' ');
    return (
      <View key={campaign.video_url} style={styles.card}>
        <View style={styles.campaignHeader}>
          <Text style={styles.campaignName}>
            {campaign.campaign_name}
          </Text>
          <Text style={styles.campaignId}>ID: {campaign.campaign_id}</Text>
        </View>
        <View style={styles.campaignDatesAndTime}>
          <View style={styles.dateTimeRow}>
            <Text style={styles.dateTimeLabel}>Start Date & Time:</Text>
            <Text style={styles.dateTimeValue}>
              {campaign.start_date} — {campaign.start_time}
            </Text>
          </View>
          <View style={styles.dateTimeRow}>
            <Text style={styles.dateTimeLabel}>End Date & Time:</Text>
            <Text style={styles.dateTimeValue}>
              {campaign.end_date} — {campaign.end_time}
            </Text>
          </View>
        </View>

        {playingVideoId === parseInt(campaign.campaign_id) ? (
          <VideoPlayer url={campaign.video_url} />
        ) : (
          <TouchableOpacity onPress={() => handlePlay(parseInt(campaign.campaign_id))}>
            <Image
              source={{
                uri: campaign.thumbnail,
              }}
              style={styles.thumbnail}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {!campaigns || campaigns.length === 0 ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        campaigns?.map(renderCampaignCard)
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },

  campaignDatesAndTime: {
    marginVertical: 10,
  },
  campaignHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateTimeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dateTimeLabel: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#333",
  },
  dateTimeValue: {
    fontSize: 14,
    color: "#666",
  },
  card: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  campaignName: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 10,
  },
  campaignId: {
    fontSize: 12,
    borderBlockColor: "#505E73",
    borderWidth: 1,
    padding: 5,
    width: 70,
    textAlign: "center",
    borderRadius: 50,
    fontWeight: "bold",

  },
  thumbnail: {
    width: "100%",
    height: 150,
    borderRadius: 4,
    marginBottom: 10,
    borderBlockColor: "#505E73",
    borderWidth: 0.2,
  },
  playButton: {
    padding: 10,
    borderRadius: 1,
    alignItems: "center",
    backgroundColor: "#505E73",
  },
  playButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  videoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ScheduleContent;
