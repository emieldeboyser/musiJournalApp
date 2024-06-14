import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  SafeAreaView,
  ScrollView,
  Image,
  Linking,
  Button,
} from "react-native";
import { vw, vh, vmin, vmax } from "react-native-expo-viewport-units";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import ActivityLoader from "../../../components/activityLoader";
import {
  Entypo,
  FontAwesome5,
  FontAwesome,
  AntDesign,
} from "@expo/vector-icons";

import { emojis } from "../../../constants/global";
import { supabase } from "../../../lib/supabase";

import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";
import { SongCard, SongCardTwo } from "../../../components/songCard";
import { Buffer } from "buffer";

import * as SecureStore from "expo-secure-store";
import { colorThemes } from "../../../constants/global";

const Edit = ({ route }) => {
  const navigation = useNavigation();
  const [colorTheme, setColorTheme] = React.useState("brown");
  const currentTheme = colorThemes[colorTheme];

  const fetchTheme = async () => {
    const theme = await SecureStore.getItemAsync("colorTheme");
    if (theme) {
      setColorTheme(theme);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchTheme();
      navigation.setOptions({
        headerTintColor: currentTheme.dark,
        headerBackStyle: { color: currentTheme.dark },
      });
      return () => {
        null;
      };
    }, [])
  );

  const [loading, setLoading] = useState(true);
  const [motivation, setMotivation] = useState("");
  const [emotion, setEmotion] = useState(null);

  const [popup, setPopup] = useState(false);
  const [deletePopup, setDeletePopup] = useState(false);
  const [media, setMedia] = useState(null);
  const [imageLoader, setImageLoader] = useState(true);
  const [newMedia, setNewMedia] = useState(null);
  const [searchSong, setSearchSong] = useState(false);
  const [querySong, setQuerySong] = useState("");
  const [allTracks, setAllTracks] = useState([]);
  const [recomendations, setRecomendations] = useState([]);
  const [recomendationsLoader, setRecomendationsLoader] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState(null);

  const client_id = process.env.SPOTIFY_CLIENT_ID;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

  const formatDate = (date) => {
    const d = new Date(date);
    return `${d.getDate()} ${d.toLocaleString("default", {
      month: "long",
    })}`;
  };

  useEffect(() => {
    if (!route.params.id) {
      return null;
    }
    setLoading(true);
    navigation.setOptions({
      title: formatDate(route.params.day),
    });
    if (route.params.media) {
      setMedia(route.params.media);
      setImageLoader(false);
    }
    setLoading(false);
  }, []);

  // Function to dismiss the keyboard
  const handleBackButtonPress = () => {
    Keyboard.dismiss();
  };

  const handleSave = () => {
    const save = async () => {
      setLoading(true);
      const user = await supabase.auth.getSession();
      const { data, error } = await supabase
        .from("journalData")
        .update([
          {
            emotion_id: emotion ? emotion : route.params.emotion_id,
            motivation: motivation,
            song_id: selectedTrack ? selectedTrack.id : route.params.track.id,
          },
        ])
        .eq("id", route.params.id)

        .eq("user_id", user.data.session.user.id);

      if (error) {
        console.log(error);
      }

      // Update the motivation in the state
      setMotivation(motivation);

      if (newMedia) {
        const user = await supabase.auth.getSession();
        const base64 = await FileSystem.readAsStringAsync(newMedia.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const filePath = `${user.data.session.user.id}/${route.params.day}`;
        const { data: updateData, error: updateError } = await supabase.storage
          .from("journal")
          .upload(filePath, decode(base64), { contentType: "image" });

        // TODO SHOW JOURNAL ENTRY THAT THERE IS AN IMAGE

        if (updateError) {
          if (updateError.message === "The resource already exists") {
            const { data: updateData, error: updateError } =
              await supabase.storage
                .from("journal")
                .update(filePath, decode(base64), { contentType: "image" });

            if (updateError) {
              console.log("Error updating file: ", updateError.message);
            }
          }
        }
        navigation.goBack();
      }
      setLoading(false);
      navigation.goBack();
    };
    save();
  };

  const changeEmoticon = () => {
    setPopup(!popup);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Sorry, we need camera roll permissions to make this work!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const img = result.assets[0];
      setNewMedia(img);
      setImageLoader(false);
    }
  };

  const popUp = () => {
    const save = async () => {
      setPopup(false);

      // SAVE THE EMOTION
      const { data, error } = await supabase
        .from("journalData")
        .update({ emotion_id: emotion });

      // Update the emotion in the state
      setEmotion(emotion);
    };

    return (
      <View style={styles.popup}>
        <View style={styles.nav}>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: currentTheme.dark }]}
            onPress={() => setPopup(false)}
          >
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: currentTheme.dark }]}
            onPress={save}
          >
            <Text style={styles.buttonText}>save</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          style={[
            styles.emojiContainer,
            { backgroundColor: currentTheme.light },
          ]}
          contentContainerStyle={styles.emojiScroll}
        >
          {emojis.map((e, index) => (
            <Text
              style={[
                styles.emoji,
                emotion !== e && emotion !== null && styles.notSelectedEmoji,
              ]}
              key={`emoji_${index}`}
              onPress={() =>
                setEmotion((prevEmotion) => (prevEmotion === e ? null : e))
              }
            >
              {e}
            </Text>
          ))}
        </ScrollView>
      </View>
    );
  };

  async function getToken() {
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
            Buffer.from(client_id + ":" + client_secret).toString("base64"),
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
  }

  useEffect(() => {
    if (!querySong) return;

    if (querySong.length < 3) {
      return;
    }

    async function getTrackInfo(access_token) {
      try {
        const response = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(
            querySong
          )}&type=track&limit=10`,
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
    }

    getToken().then((response) => {
      if (response && response.access_token) {
        getTrackInfo(response.access_token).then((profile) => {
          if (profile) {
            setAllTracks(profile.tracks.items); // Assuming tracks are stored in profile.tracks.items
          }
        });
      }
    });
  }, [querySong]);

  const changeSong = () => {
    setSearchSong(true);
    navigation.setOptions({
      headerBackVisible: false,
      headerTitle: "",
      headerRight: () => (
        <TouchableOpacity
          style={{
            backgroundColor: currentTheme.dark,
            padding: 10,
            borderRadius: 20,
            position: "absolute",
            right: 10,
          }}
          onPress={() => {
            setSearchSong(false);
            setQuerySong("");
            setAllTracks([]);
            navigation.setOptions({
              headerBackVisible: true,
              headerRight: null,
              headerTitle: formatDate(route.params.day),
            });
          }}
        >
          <AntDesign name="close" size={15} color="white" />
        </TouchableOpacity>
      ),
    });
  };

  const searchSongPopup = () => {
    return (
      <View style={[styles.popup]}>
        <View style={styles.searchTrack}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "center",
              width: 400,
              backgroundColor: currentTheme.light,
              borderRadius: 20,
              padding: 10,
              color: currentTheme.dark,
              paddingLeft: 20,
            }}
          >
            <FontAwesome name="search" size={28} color={currentTheme.dark} />
            <TextInput
              style={[styles.searchTrackText, { color: currentTheme.dark }]}
              placeholderTextColor={currentTheme.dark}
              placeholder="Search for a track"
              onChangeText={(text) => {
                setQuerySong(text);
                if (!text) {
                  setAllTracks([]);
                }
              }}
            />
          </View>

          {allTracks.length > 0 && (
            <ScrollView style={{ height: 650 }}>
              {allTracks.map((track, index) => (
                <TouchableOpacity
                  key={`track_${index}`}
                  onPress={() => {
                    setQuerySong("");
                    setAllTracks([]);
                    setSelectedTrack(track);
                    setSearchSong(false);
                    navigation.setOptions({
                      headerBackVisible: true,
                      headerRight: null,
                      headerTitle: formatDate(route.params.day),
                    });
                  }}
                  style={{ width: 400 }}
                >
                  <SongCard object={track} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    );
  };

  return (
    <>
      <SafeAreaView style={[styles.container, popup && styles.hide]}>
        <TouchableWithoutFeedback onPress={handleBackButtonPress}>
          {loading ? (
            <View style={styles.container}>
              <ActivityLoader loading={loading} />
            </View>
          ) : (
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.container}
              onPress={handleBackButtonPress}
            >
              <View style={styles.content}>
                {(media || newMedia) && (
                  <View>
                    {imageLoader ? (
                      <ActivityLoader loading={imageLoader} />
                    ) : (
                      <>
                        <Image
                          source={{ uri: newMedia ? newMedia.uri : media }}
                          style={{
                            width: vw(90),
                            height: vh(27),
                            borderBottomLeftRadius: 0,
                            borderBottomRightRadius: 0,
                            borderTopLeftRadius: 20,
                            borderTopRightRadius: 20,
                          }}
                        />
                        <TouchableOpacity
                          style={{
                            position: "absolute",
                            right: 10,
                            top: 10,
                            backgroundColor: currentTheme.mid,
                            padding: 10,
                            borderRadius: 20,
                          }}
                          onPress={() => {
                            setMedia(null);
                            setNewMedia(null);
                          }}
                        >
                          <FontAwesome5
                            name="pen"
                            size={24}
                            color={currentTheme.dark}
                          />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.saveContainer,
                    { top: media || newMedia ? 190 : 0 },
                    { backgroundColor: currentTheme.light },
                  ]}
                  onPress={handleSave}
                >
                  <Text style={[styles.save, { color: currentTheme.dark }]}>
                    SAVE
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.emoticonContainer,
                    { top: media || newMedia ? 190 : 0 },
                    { backgroundColor: currentTheme.light },
                  ]}
                  onPress={changeEmoticon}
                >
                  <Text style={styles.emoticon}>
                    {emotion ? emotion : route.params.emotion_id}
                  </Text>
                </TouchableOpacity>
                {!media && !newMedia && (
                  <TouchableOpacity
                    style={[
                      styles.imageContainer,
                      { backgroundColor: currentTheme.light },
                    ]}
                    onPress={pickImage}
                  >
                    <Entypo name="camera" size={24} color="brown" />
                  </TouchableOpacity>
                )}
                <View
                  style={[
                    styles.motivation,
                    { marginTop: media || newMedia ? 0 : 40 },
                    { backgroundColor: currentTheme.light },
                    { height: media || newMedia ? vh(37) : vh(60) },
                  ]}
                >
                  <TextInput
                    style={[styles.broodtekst, { color: currentTheme.dark }]}
                    defaultValue={route.params.motivation}
                    placeholder="Title"
                    onChangeText={(text) => setMotivation(text)}
                    multiline
                  />
                </View>
                {route.params.track && (
                  <TouchableOpacity
                    onPress={changeSong}
                    style={{
                      width: vw(90),
                    }}
                  >
                    {selectedTrack ? (
                      <SongCardTwo object={selectedTrack} />
                    ) : (
                      <SongCardTwo object={route.params.track} />
                    )}
                    <TouchableOpacity
                      style={{
                        position: "absolute",
                        right: 10,
                        top: 10,
                        backgroundColor: currentTheme.dark,
                        padding: 10,
                        borderRadius: 20,
                      }}
                      onPress={changeSong}
                    >
                      <FontAwesome5
                        name="pen"
                        size={15}
                        color={currentTheme.light}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                )}
              </View>
            </KeyboardAvoidingView>
          )}
        </TouchableWithoutFeedback>
      </SafeAreaView>
      {popup && popUp()}
      {searchSong && searchSongPopup()}
    </>
  );
};

// Add styles for the content inside KeyboardAvoidingView
const styles = StyleSheet.create({
  ...StyleSheet.flatten({
    nav: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 12,
    },
    container: {
      flex: 1,
      padding: 20,
      justifyContent: "flex-start",
      backgroundColor: "white",
      height: vh(100),
    },
    h1: {
      fontSize: 50,
      fontWeight: "bold",
      color: "#966919",
      marginVertical: 10,
    },
    emoticonContainer: {
      position: "absolute",
      right: 1,
      zIndex: 1,
      backgroundColor: "#F4EEE2",
      borderTopRightRadius: 20,
      borderTopLeftRadius: 20,
      padding: 10,
    },
    emoticon: {
      fontSize: 40,
    },
    saveContainer: {
      position: "absolute",
      left: 1,
      zIndex: 1,
      backgroundColor: "#F4EEE2",
      borderTopRightRadius: 20,
      borderTopLeftRadius: 20,
      padding: 10,
      height: 60,
      width: 120,
      justifyContent: "center",
    },
    save: {
      fontSize: 21,
      fontWeight: "bold",
      textAlign: "center",
      color: "#966919",
    },
    imageContainer: {
      position: "absolute",
      left: 140,
      zIndex: 1,
      backgroundColor: "#F4EEE2",
      borderTopRightRadius: 20,
      borderTopLeftRadius: 20,
      padding: 10,
      height: 60,
      width: 60,
      justifyContent: "center",
      alignItems: "center",
    },
    motivation: {
      backgroundColor: "#F4EEE2",
      padding: 10,
      borderRadius: 20,
      borderTopRightRadius: 0,
      width: vw(90),
      color: "#966919",
      height: vh(35),
      marginBottom: 20,
    },
    broodtekst: {
      fontSize: 16,
      marginHorizontal: 20,
      marginVertical: 10,
      height: "100%",
    },
    button: {
      backgroundColor: "#966919",
      padding: 10,
      borderRadius: 5,
      marginTop: 10,
      width: vw(90),
      height: 50,

      justifyContent: "center",
      alignItems: "center",
    },
    closeButton: {
      backgroundColor: "#966919",
      padding: 10,
      borderRadius: 5,
      marginTop: 10,
      width: vw(40),
      height: 50,
      justifyContent: "center",
      alignItems: "center",
    },
    buttonText: {
      color: "white",
      textTransform: "uppercase",
      fontWeight: "bold",
    },
    emojiSection: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      flexWrap: "wrap",
      marginBottom: 20,
    },
    emojiScroll: {
      flexGrow: 1,
      alignItems: "center",
      flexDirection: "column",
      flexWrap: "wrap",
    },
    emojiContainer: {
      backgroundColor: "#E3D6BC",
      borderRadius: 20,
      paddingHorizontal: 15,
      paddingVertical: 10,
      marginHorizontal: 10,
      flexWrap: "wrap",
      flexDirection: "row",
      height: 200,
      display: "flex",
    },
    notSelectedEmoji: {
      opacity: 0.1,
    },
    emoji: {
      fontSize: 35,
      marginHorizontal: 1,
    },
    hide: {
      display: "none",
    },

    popup: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: vh(100),
      zIndex: 1,
      backgroundColor: "white",
    },
    searchTrack: {
      padding: 20,
    },
    searchTrackText: {
      fontSize: 16,
      color: "#966919",
      marginLeft: 10,
    },
    buttonContainer: {
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 20,
      marginTop: 20,
    },
    templateText: {
      fontSize: 16,
      fontWeight: "bold",
    },
    loader: {
      justifyContent: "center",
      alignItems: "center",
      marginTop: 20,
    },
  }),
});

export default Edit;
