import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Buffer } from "buffer";
import { Entypo } from "@expo/vector-icons";
import { vw, vh, vmin, vmax } from "react-native-expo-viewport-units";
import { supabase } from "../../../lib/supabase";
import { FontAwesome5, FontAwesome } from "@expo/vector-icons";
import { SongCardTwo } from "../../../components/songCard";

import * as SecureStore from "expo-secure-store";
import { colorThemes } from "../../../constants/global";

const MemorieDetail = ({ route }) => {
  const navigation = useNavigation();
  const [map, setMap] = useState(false);
  const [track, setTrack] = useState(null);
  const [loading, setLoading] = useState(true);

  const [popup, setPopup] = useState(false);
  const [media, setMedia] = useState(null);
  const [imageLoader, setImageLoader] = useState(true);
  const [musicLoader, setMusicLoader] = useState(true);
  const [fullPicture, setFullPicture] = useState(false);
  const [colorTheme, setColorTheme] = React.useState("brown");
  const currentTheme = colorThemes[colorTheme];

  const fetchTheme = async () => {
    const theme = await SecureStore.getItemAsync("colorTheme");
    if (theme) {
      setColorTheme(theme);
      navigation.setOptions({
        headerTintColor: colorThemes[theme].dark,
        headerBackStyle: { color: colorThemes[theme].dark },
      });
    }
  };
  useFocusEffect(
    React.useCallback(() => {
      fetchTheme();
      return () => {
        null;
      };
    }, [])
  );

  const formatDate = (date) => {
    const d = new Date(date);
    // day, full month and year
    return `${d.getDate()} ${d.toLocaleString("default", {
      month: "long",
    })} ${d.getFullYear()}`;
  };

  // Set the title of the screen to the date of the memory
  useEffect(() => {
    setLoading(true);
    navigation.setOptions({ title: formatDate(route.params.item.day) });

    if (route.params.item.latitude && route.params.item.longitude) {
      setMap(true);
    }
  }, []);

  // SPOTIFY PART
  const client_id = process.env.SPOTIFY_CLIENT_ID;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

  useEffect(() => {
    const fetchTrackInfo = async () => {
      setMusicLoader(true);
      try {
        const tokenResponse = await getToken();
        if (tokenResponse && tokenResponse.access_token) {
          const trackInfo = await getTrackInfo(
            tokenResponse.access_token,
            route.params.item.song_id
          );
          if (trackInfo) {
            setTrack(trackInfo);
            setMusicLoader(false);
          }
        }
      } catch (error) {
        console.error("Error fetching track info:", error);
      }
    };

    fetchTrackInfo();
  }, [route.params.item.song_id]); // Depend on trackId to refetch when it changes

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

  const popUpDelete = () => {
    navigation.setOptions({ headerShown: false });
    const handleDelete = async () => {
      // DELETE THE ENTRY
      const { data, error } = await supabase
        .from("journalData")
        .delete()
        .eq("id", route.params.item.id);

      if (error) {
        console.log(error);
      }

      setPopup(false);

      navigation.navigate("Calender");
    };
    return (
      <View style={deleteStyles.popupContainer}>
        <View
          style={[deleteStyles.popup, { backgroundColor: currentTheme.light }]}
        >
          <Text style={[deleteStyles.deleteText, { color: currentTheme.dark }]}>
            Are you sure you want to delete this memory?
          </Text>
          <View style={deleteStyles.nav}>
            <TouchableOpacity
              style={[
                deleteStyles.closeButton,
                { backgroundColor: currentTheme.dark },
              ]}
              onPress={() => {
                setPopup(false);
                navigation.setOptions({ headerShown: true });
              }}
            >
              <Text
                style={{
                  color: "white",
                  textTransform: "uppercase",
                  fontWeight: "bold",
                }}
              >
                No
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                deleteStyles.closeButton,
                { backgroundColor: currentTheme.dark },
              ]}
              onPress={handleDelete}
            >
              <Text
                style={{
                  color: "white",
                  textTransform: "uppercase",
                  fontWeight: "bold",
                }}
              >
                Yes
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  useEffect(() => {
    if (route.params.item.media) {
      const fetchMedia = async () => {
        setImageLoader(true);
        const user = await supabase.auth.getSession();
        const { data, error } = await supabase.storage
          .from("journal")
          .download(`${user.data.session.user.id}/${route.params.item.day}`);
        if (error) {
          console.log(error);
        }
        if (data) {
          const url = URL.createObjectURL(data);
          setMedia(url);
          setImageLoader(false);
        }
        setImageLoader(false);
      };
      fetchMedia();
    }
  }, []);

  const openImage = () => {
    navigation.setOptions({ headerShown: false });
    setFullPicture(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.container, popup && styles.hide]}>
        <View>
          {media ? (
            <TouchableOpacity onPress={openImage}>
              {imageLoader ? (
                <View
                  style={{
                    width: vw(90),
                    height: vh(27),
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    justifyContent: "center",
                    backgroundColor: currentTheme.light,
                  }}
                >
                  <ActivityIndicator size="large" color={currentTheme.dark} />
                </View>
              ) : (
                <Image
                  source={{ uri: media }}
                  style={{
                    width: vw(90),
                    height: vh(27),
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                  }}
                />
              )}
            </TouchableOpacity>
          ) : null}

          <View
            style={[
              styles.emoticonContainer,
              !media && { top: 0 },
              { backgroundColor: currentTheme.light },
            ]}
          >
            <Text style={styles.emoticon}>{route.params.item.emotion_id}</Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("Edit", {
                ...route.params.item,
                media: media,
                track: track,
              })
            }
            style={[
              styles.editButton,
              !media && { top: 0 },
              { backgroundColor: currentTheme.light },
            ]}
          >
            <FontAwesome5 name="pen" size={24} color={currentTheme.dark} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setPopup(true)}
            style={[
              styles.deleteButton,
              !media && { top: 0 },
              { backgroundColor: currentTheme.light },
            ]}
          >
            <FontAwesome5 name="trash" size={24} color="#912200" />
          </TouchableOpacity>
          <View
            style={[
              styles.motivation,
              media && { height: vh(32), marginTop: 0 },
              { backgroundColor: currentTheme.light },
            ]}
          >
            <Text style={[styles.broodtekst, { color: currentTheme.dark }]}>
              {route.params.item.motivation}
            </Text>
          </View>
        </View>
        {map ? (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: parseFloat(route.params.item.latitude),
              longitude: parseFloat(route.params.item.longitude),
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            zoomControlEnabled={true}
          >
            {track ? (
              musicLoader ? (
                <ActivityIndicator size="large" color="#0000ff" />
              ) : (
                <Marker
                  coordinate={{
                    latitude: parseFloat(route.params.item.latitude),
                    longitude: parseFloat(route.params.item.longitude),
                  }}
                  title={track.name}
                  description={track.artists[0].name}
                  onPress={() => Linking.openURL(track.external_urls.spotify)}
                >
                  <Image
                    source={{ uri: track.album.images[0].url }}
                    style={{ width: 50, height: 50 }}
                  />
                </Marker>
              )
            ) : (
              <Marker
                coordinate={{
                  latitude: parseFloat(route.params.item.latitude),
                  longitude: parseFloat(route.params.item.longitude),
                }}
                title={route.params.item.emotion_id}
                description={route.params.item.day}
              />
            )}
          </MapView>
        ) : musicLoader ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <TouchableOpacity
            onPress={() => Linking.openURL(track.external_urls.spotify)}
            style={{
              width: vw(90),
            }}
          >
            <SongCardTwo object={track} />
          </TouchableOpacity>
        )}
      </View>
      {popup && popUpDelete()}
      {fullPicture && (
        <View
          style={{
            width: vw(100),
            backgroundColor: "white",
            borderRadius: 20,
            overflow: "hidden",
            height: vh(100),
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: "center",
          }}
        >
          <Image
            source={{ uri: media }}
            style={{
              width: vw(100),
              height: vh(100),
              resizeMode: "contain",
            }}
          />
          {/* close full screen */}
          <View
            style={{
              position: "absolute",
              top: 50,
              right: 15,
              zIndex: 1,
            }}
          >
            <TouchableOpacity
              style={{
                backgroundColor: currentTheme.dark,
                padding: 10,
                borderRadius: 15,
              }}
              onPress={() => {
                navigation.setOptions({ headerShown: true });
                setFullPicture(false);
              }}
            >
              <FontAwesome name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  popupContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  nav: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
  },
  closeButton: {
    backgroundColor: "#966919",
    padding: 10,
    borderRadius: 5,
    width: 100,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    textTransform: "uppercase",
    fontWeight: "bold",
  },
  hide: {
    display: "none",
  },
  container: {
    flex: 1,
    alignItems: "center",
    padding: 20,
    justifyContent: "space-between",
    backgroundColor: "white",
    height: vh(100),
    alignContent: "flex-end",
  },
  trackInfo: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    width: vw(90),
    backgroundColor: "#D3C4AA",
    overflow: "hidden",
    borderRadius: 20,
  },
  trackImage: {
    width: 125,
    height: 125,
    resizeMode: "cover",
  },
  emoticonContainer: {
    position: "absolute",
    top: 206,
    right: 0,
    zIndex: 1,
    backgroundColor: "#F4EEE2",
    padding: 5,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  emoticon: {
    fontSize: 35,
  },
  songInfo: {
    marginLeft: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  map: {
    width: vw(90),
    height: 180,
    borderRadius: 20,
  },
  h1: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#966919",
    textAlign: "center",
    overflow: "hidden",
    width: 200,
  },
  h2: {
    fontSize: 12,
    color: "#966919",
    fontWeight: "thin",
  },
  broodtekst: {
    fontSize: 16,
    marginHorizontal: 20,
    marginVertical: 10,
    height: "100%",
  },
  motivation: {
    backgroundColor: "#F4EEE2",
    padding: 10,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: "hidden",
    width: vw(91),
    height: vh(56),
    color: "#966919",
    marginTop: 40,
  },
  editButton: {
    backgroundColor: "#F4EEE2",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    position: "absolute",
    top: 206,
    left: 0,
    width: 50,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    zIndex: 1,
  },
  deleteButton: {
    backgroundColor: "#F4EEE2",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    position: "absolute",
    top: 206,
    left: 55,
    width: 50,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    zIndex: 1,
  },
  buttonText: {
    color: "white",
    textTransform: "uppercase",
    fontWeight: "bold",
  },
  popup: {
    position: "absolute",
    top: vh(30),
    left: 15,
    right: 15,
    height: vh(20),
    justifyContent: "center",
    zIndex: 1,
    backgroundColor: "white",
    flexDirection: "column",
    flex: 1,
    borderRadius: 20,
  },
  deleteText: {
    color: "red",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
});

const deleteStyles = StyleSheet.create({
  popupContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  popup: {
    position: "absolute",
    top: vh(40),

    width: vw(70),
    height: vh(20),
    justifyContent: "center",
    zIndex: 1,
    backgroundColor: "#F4EEE2",
    flexDirection: "column",
    flex: 1,
    borderRadius: 20,
  },
  nav: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    marginTop: 20,
  },
  closeButton: {
    backgroundColor: "#966919",
    padding: 10,
    borderRadius: 5,
    width: 125,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    textTransform: "uppercase",
    fontWeight: "bold",
  },
  deleteText: {
    color: "#966919",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default MemorieDetail;
