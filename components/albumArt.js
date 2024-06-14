import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, Text, TouchableOpacity } from "react-native";
import { Buffer } from "buffer";
import { View } from "react-native";

const AlbumArt = ({ trackId, day }) => {
  const [track, setTrack] = useState(null);
  const client_id = process.env.SPOTIFY_CLIENT_ID;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
  const [loading, setLoading] = useState(true);

  const formatDate = (date) => {
    const d = new Date(date);
    return `${d.getDate()} ${d.toLocaleString("default", {
      month: "long",
    })}`;
  };

  useEffect(() => {
    const fetchTrackInfo = async () => {
      try {
        setLoading(true);
        const tokenResponse = await getToken();
        if (tokenResponse && tokenResponse.access_token) {
          const trackInfo = await getTrackInfo(
            tokenResponse.access_token,
            trackId
          );
          if (trackInfo) {
            setTrack(trackInfo);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Error fetching track info:", error);
      }
    };

    fetchTrackInfo();
  }, [trackId]); // Depend on trackId to refetch when it changes

  const getToken = async () => {
    try {
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        body: new URLSearchParams({
          grant_type: "client_credentials",
        }).toString(),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(`${client_id}:${client_secret}`).toString("base64"),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch access token");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching token:", error);
      return null;
    }
  };

  const getTrackInfo = async (access_token, trackId) => {
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/tracks/${trackId}`,
        {
          method: "GET",
          headers: { Authorization: "Bearer " + access_token },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch track info");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching track info:", error);
      return null;
    }
  };

  if (!track) {
    return null; // Or a loading indicator
  }

  return (
    <>
      {loading ? (
        <View style={{ width: 117, height: 117 }}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : (
        <Image
          source={{ uri: track.album.images[0]?.url || "" }} // Use optional chaining to prevent errors
          style={{ width: 117, height: 117 }}
        />
      )}

      <Text style={styles.dayText}>{formatDate(day)}</Text>
    </>
  );
};

const styles = {
  dayText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#966919",
    position: "absolute",
    bottom: 0,
    right: 0,

    backgroundColor: "rgba(255, 255, 255, 0.7)",
  },
};
export default AlbumArt;
