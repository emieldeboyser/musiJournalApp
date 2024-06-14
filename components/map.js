import React, { useEffect, useState } from "react";
import {
  View,
  ActivityIndicator,
  Text,
  TouchableHighlight,
  Image,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { supabase } from "../lib/supabase";
import { useNavigation } from "@react-navigation/native";
import { Buffer } from "buffer";
import { getDistance } from "geolib";

const Map = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialRegion, setInitialRegion] = useState({
    latitude: 51.05850587581974,
    longitude: 3.7075180350252954,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [showMarker, setShowMarker] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(13); // Default zoom level
  const client_id = process.env.SPOTIFY_CLIENT_ID;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

  const navigation = useNavigation();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const userData = await supabase.auth.getSession();
        const user = userData.data.session?.user;

        if (user) {
          const { data, error } = await supabase
            .from("journalData")
            .select("*")
            .eq("user_id", user.id);

          if (error) {
            console.log("error fetching emotions", error);
          } else {
            setData(data);
            if (data && data.length > 0) {
              const firstValidLocation = data.find(
                (item) => item.latitude && item.longitude
              );
              if (firstValidLocation) {
                setShowMarker(true);
                setInitialRegion({
                  latitude: parseFloat(firstValidLocation.latitude),
                  longitude: parseFloat(firstValidLocation.longitude),
                  latitudeDelta: 0.0922,
                  longitudeDelta: 0.0421,
                });
              }
            }
          }
        }
      } catch (error) {
        console.log("error", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchMarkers = async () => {
      const tokenData = await getToken();
      if (!tokenData || tokenData === null) {
        console.error("Error fetching access token.");
        return;
      }

      const fetchedMarkers = await Promise.all(
        data.map(async (item, index) => {
          if (!item || !item.latitude || !item.longitude) {
            console.log("no location founds for", item, index);
            return null;
          }

          const trackInfo = await getTrackInfo(
            tokenData.access_token,
            item.song_id
          );

          if (
            !trackInfo ||
            !trackInfo.album ||
            !trackInfo.album.images ||
            trackInfo.album.images.length === 0
          ) {
            console.log("no album image found");
            return null;
          }

          const albumImage = trackInfo.album.images[0].url;

          return {
            index,
            latitude: parseFloat(item.latitude),
            longitude: parseFloat(item.longitude),
            title: formatDate(item.day) || "No date",
            description: item.motivation || "No motivation",
            albumImage,
          };
        })
      );

      const validMarkers = fetchedMarkers.filter((marker) => marker !== null);
      const clusteredMarkers = clusterMarkers(validMarkers, 50); // Adjust the distance threshold as needed
      setMarkers(clusteredMarkers);
    };

    if (showMarker) {
      fetchMarkers();
    }
  }, [data, showMarker]);

  const clusterMarkers = (markers, distanceThreshold) => {
    const clusteredMarkers = [];

    markers.forEach((marker, index) => {
      let addedToCluster = false;

      for (const cluster of clusteredMarkers) {
        if (
          getDistance(
            { latitude: marker.latitude, longitude: marker.longitude },
            {
              latitude: cluster.latitude,
              longitude: cluster.longitude,
            }
          ) < distanceThreshold
        ) {
          cluster.count += 1;
          cluster.images.push(marker.albumImage);
          addedToCluster = true;
          break;
        }
      }

      if (!addedToCluster) {
        clusteredMarkers.push({
          ...marker,
          count: 1,
          images: [marker.albumImage],
        });
      }
    });

    return clusteredMarkers;
  };

  const formatDate = (date) => {
    const d = new Date(date);
    return `${d.getDate()} ${d.toLocaleString("default", {
      month: "long",
    })} ${d.getFullYear()}`;
  };

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

  const handleRegionChangeComplete = (region) => {
    const zoom = Math.round(Math.log(360 / region.longitudeDelta) / Math.LN2);
    setZoomLevel(zoom);
  };

  const getMarkerSize = () => {
    if (zoomLevel >= 15) return 45;
    if (zoomLevel >= 12) return 40;
    return 25;
  };

  return (
    <View style={{ flex: 1 }}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <MapView
          style={{ flex: 1 }}
          initialRegion={initialRegion}
          zoomControlEnabled={true}
          onRegionChangeComplete={handleRegionChangeComplete}
        >
          {showMarker &&
            markers.map((marker, index) => (
              <Marker
                key={index}
                coordinate={{
                  latitude: marker.latitude,
                  longitude: marker.longitude,
                }}
                title={`${
                  marker.count === 1 ? marker.title : `${marker.count} items`
                } `}
              >
                <TouchableHighlight style={styles.marker}>
                  <View>
                    {marker.count === 1 ? (
                      <Image
                        source={{ uri: marker.albumImage }}
                        style={{
                          width: getMarkerSize(),
                          height: getMarkerSize(),
                          borderRadius: 10,
                        }}
                      />
                    ) : (
                      <View
                        style={{
                          flexDirection: "row",
                          flexWrap: "wrap",
                          justifyContent: "center",
                          maxHeight: 150,
                          maxWidth: 150,
                        }}
                      >
                        {zoomLevel >= 13 ? (
                          marker.images.map((image, index) => (
                            <Image
                              key={index}
                              source={{ uri: image }}
                              style={{
                                width: getMarkerSize(),
                                height: getMarkerSize(),
                              }}
                            />
                          ))
                        ) : (
                          <Text
                            style={{
                              fontSize: getMarkerSize(),
                              fontWeight: "bold",
                              backgroundColor: "white",
                              borderRadius: 50,
                              padding: 5,
                            }}
                          >
                            {marker.count}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                </TouchableHighlight>
              </Marker>
            ))}
        </MapView>
      )}
    </View>
  );
};

const styles = {
  marker: {
    borderRadius: 10,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
};

export default Map;
