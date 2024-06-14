import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { supabase } from "../lib/supabase";
import { Buffer } from "buffer";
import { Image } from "react-native";
const AlbumTile = ({ object, loading }) => {
  return (
    <View style={styles.container}>
      {object.length === 0 ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            borderRadius: 20,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              color: "#966919",
              marginHorizontal: 10,
              justifyContent: "center",
            }}
          >
            Add your first entry!
          </Text>
        </View>
      ) : loading ? (
        <Text>Loading...</Text>
      ) : (
        object.map((item) => {
          return (
            <AlbumArt key={item.day} day={item.day} trackId={item.song_id} />
          );
        })
      )}
      <AlbumArt />
    </View>
  );
};

const AlbumArt = ({ day, trackId }) => {
  if (!trackId) return null;
  const [track, setTrack] = useState(null);
  const client_id = process.env.SPOTIFY_CLIENT_ID;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

  const formatDate = (date) => {
    const d = new Date(date);
    return `${d.getDate()} ${d.toLocaleString("default", {
      month: "long",
    })}`;
  };

  useEffect(() => {
    const fetchTrackInfo = async () => {
      try {
        const tokenResponse = await getToken();
        if (tokenResponse && tokenResponse.access_token) {
          const trackInfo = await getTrackInfo(
            tokenResponse.access_token,
            trackId
          );
          if (trackInfo) {
            setTrack(trackInfo);
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
      console.error("Error fetching track infos:", error);
      return null;
    }
  };

  if (!track) {
    return null; // Or a loading indicator
  }

  return (
    <View>
      <Image
        source={{ uri: track.album.images[0]?.url || "" }} // Use optional chaining to prevent errors
        style={{ width: 118, height: 118 }}
      />
      <Text style={albumStyles.dayText}>{formatDate(day)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
});

const albumStyles = StyleSheet.create({
  dayText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#966919",
    position: "absolute",
    bottom: 0,
    right: 0,

    backgroundColor: "rgba(255, 255, 255, 0.7)",
  },
});
export default AlbumTile;
