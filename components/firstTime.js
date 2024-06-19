import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../lib/supabase";
import { Buffer } from "buffer";
import SongAddedToday, { SongCard } from "./songCard";
import { useNavigation } from "@react-navigation/native";
import { TouchableWithoutFeedback } from "react-native";
import { Image } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { FontAwesome5, FontAwesome } from "@expo/vector-icons";
import * as Location from "expo-location";
import { emojis } from "../constants/global";

const FirstTime = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  // INPUT FIELDS
  const [emotion, setEmotion] = useState(null);
  const [motivation, setMotivation] = useState("");
  const [selectedTrack, setSelectedTrack] = useState(null);

  const navigation = useNavigation();

  const [location, setLocation] = useState(false);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  // STEPS
  const [step, setStep] = useState(1);

  const client_id = process.env.SPOTIFY_CLIENT_ID; // Add your Spotify client ID
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET; // Add your Spotify client secret

  useEffect(() => {
    setLoading(true);
    async function checkUser() {
      const user = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    }
    checkUser();
  }, []);

  const submit = async () => {
    setLoading(true);
    const now = new Date();
    // add 2 hours to get the correct time
    now.setHours(now.getHours() + 2);
    const user = await supabase.auth.getSession();

    // get todays date in format YYYY-MM-DD
    const today = new Date();
    // add 2 hours to get the correct time
    today.setHours(today.getHours() + 2);
    const selectedDay = today.toISOString().split("T")[0];

    const { data, error } = await supabase.from("journalData").insert([
      {
        created_at: now,
        emotion_id: emotion, // Ensure 'emotion' is defined somewhere in your scope
        motivation: motivation, // Ensure 'comments' is defined somewhere in your scope
        user_id: user.data.session.user.id, // This should ideally be dynamic based on the logged-in user
        song_id: selectedTrack.id, // Ensure 'song' object has an 'id' property
        day: selectedDay,
        latitude: latitude,
        longitude: longitude,
        on_time: true,
      },
    ]);
    // first check if the user has already received the medal
    const { data1, error1 } = await supabase
      .from("user_medals")
      .select("*")
      .eq("user_id", user.data.session.user.id)
      .eq("medal_id", 8);

    if (!data1) {
      // give medal with ID 8 to user
      const { data2, error2 } = await supabase.from("user_medals").insert([
        {
          user_id: user.data.session.user.id,
          medal_id: 8,
          created_at: now,
        },
      ]);

      if (error) {
        console.error("Error inserting data:", error);
        setLoading(false);
        Alert.alert("Error inserting data:", error);
      }
    }

    setLoading(false);
    navigation.navigate("Home");
  };

  const [querySong, setQuerySong] = useState("");
  const [allTracks, setAllTracks] = useState([]);

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

  const getCurrentPosition = async () => {
    setLoading(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setErrorMsg("Permission to access location was denied");
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    setLatitude(location.coords.latitude);
    setLongitude(location.coords.longitude);
    setLocation(true);
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="white" />
        <Text style={{ color: "white" }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ImageBackground
          source={require("../assets/notebook.png")}
          style={styles.notebook}
        >
          {/* SCREEN 1 */}
          {step === 1 && (
            <>
              <Text style={styles.title}>How are you?</Text>
              <ScrollView
                contentContainerStyle={styles.emojiContainer}
                style={styles.emojisContainer}
              >
                {emojis.map((emoji, index) => (
                  <Text
                    key={index}
                    style={[
                      styles.emoji,
                      {
                        transform: [
                          { rotate: index % 2 === 0 ? "-10deg" : "10deg" },
                        ],
                      },
                    ]}
                    onPress={() => {
                      setEmotion(emoji);
                      setStep(2);
                    }}
                  >
                    {emoji}
                  </Text>
                ))}
              </ScrollView>
            </>
          )}
          {/* SCREEN 2 */}
          {step === 2 && emotion && (
            <>
              <Text style={styles.title}>What's on your mind?</Text>
              <TextInput
                style={styles.input}
                multiline
                placeholder="Write something..."
                onChangeText={(text) => {
                  setMotivation(text);
                }}
              ></TextInput>
            </>
          )}

          {/* SCREEN 3 */}
          {/* STEP 3, MUSIC */}
          {step === 3 && motivation && (
            <View style={styles.trackSection}>
              {selectedTrack ? (
                <>
                  <Text style={styles.title}>Added track</Text>
                  <View style={styles.trackItem}>
                    <View style={styles.addedTrack}>
                      <TouchableOpacity
                        onPress={() => setSelectedTrack(null)}
                        style={styles.imageCard}
                      >
                        <View
                          style={{
                            position: "absolute",
                            top: 15,
                            right: 10,
                            zIndex: 1,
                            backgroundColor: "white",
                            borderRadius: 20,
                          }}
                        >
                          <AntDesign
                            name="closecircle"
                            size={30}
                            color="#966919"
                            style={styles.remove}
                          />
                        </View>
                        <Image
                          source={{ uri: selectedTrack.album.images[0].url }}
                          style={styles.trackImage}
                        />
                        <Text style={styles.trackName}>
                          {selectedTrack.name}
                        </Text>
                        <Text style={styles.trackArtist}>
                          {selectedTrack.artists[0].name}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.location}
                    onPress={getCurrentPosition}
                  >
                    <FontAwesome5
                      name="location-arrow"
                      size={24}
                      color={"#654321"}
                    />
                    <Text style={styles.locationText}>Location </Text>
                    <Text style={styles.locationTextBold}>
                      {location ? "On" : "Off"}{" "}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.title}>Add a track</Text>
                  <View>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "flex-start",
                        alignItems: "center",
                        width: 330,
                        backgroundColor: "#F4EEE2",
                        borderRadius: 20,
                        padding: 10,
                        color: "#966919",
                        marginLeft: 10,
                        marginTop: 12,
                      }}
                    >
                      <FontAwesome name="search" size={28} color="#966919" />
                      <TextInput
                        style={styles.searchTrackText}
                        placeholderTextColor={"#966919"}
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
                      <ScrollView style={styles.songList}>
                        {allTracks.map((track, index) => (
                          <TouchableOpacity
                            key={`track_${index}`}
                            onPress={() => {
                              setQuerySong("");
                              setAllTracks([]);
                              setSelectedTrack(track);
                            }}
                          >
                            <SongCard object={track} />
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                </>
              )}
            </View>
          )}

          {/* CONTROLS OF STEPS */}
          <View style={styles.bottomContainer}>
            {step < 4 && (
              <View style={styles.submit}>
                {step ? (
                  <View style={styles.submitItem}>
                    <TouchableOpacity
                      onPress={() =>
                        step === 1
                          ? navigation.navigate("Home")
                          : setStep(step - 1)
                      }
                    >
                      <Text style={styles.submitText}>Back</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
                <View style={styles.submitItem}>
                  {step === 3 ? (
                    <TouchableOpacity onPress={submit}>
                      <Text style={styles.submitText}>Submit</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => {
                        if (
                          (step === 1 && emotion === "") ||
                          (step === 2 && motivation === "") ||
                          (step === 3 && !selectedTrack)
                        ) {
                          Alert.alert("Please fill all fields");
                          return;
                        }

                        setStep(step + 1);
                      }}
                    >
                      <Text style={styles.submitText}>Next</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            <Text style={styles.stepText}>Step {step} of 3</Text>
          </View>
        </ImageBackground>
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#966919",
  },
  notebook: {
    padding: 20,
    borderTopLeftRadius: 20,
    overflow: "hidden",
    height: 780,
    width: 365,
    position: "absolute",
    bottom: 0,
    right: 0,
  },
  title: {
    fontSize: 35,
    fontWeight: "bold",
    color: "#654321",
    marginLeft: 15,
    marginTop: 2,
    lineHeight: 42,
  },
  stepText: {
    color: "#966919",
    fontSize: 20,
    marginBottom: 20,
    marginTop: 10,
  },
  searchTrackText: {
    color: "#966919",
    fontSize: 16,
    backgroundColor: "#F4EEE2",

    padding: 10,
    borderRadius: 10,
  },
  title2: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#654321",
    marginLeft: 15,
    marginTop: 0,
    lineHeight: 30,
  },
  emojisContainer: {
    height: 450,
  },
  emojiContainer: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
  },
  emoji: {
    fontSize: 100,
    margin: 5,
  },
  input: {
    backgroundColor: "#F4EEE2",
    padding: 10,
    margin: 10,
    height: 500,
    marginLeft: 10,
    borderRadius: 10,
    width: 320,
    color: "#654321",
  },
  bottomContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  submit: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    alignItems: "center",
  },
  submitItem: {
    flex: 1,
    backgroundColor: "#F4EEE2",
    padding: 15,
    borderRadius: 20,
    marginHorizontal: 10,
    alignItems: "center",
  },
  submitText: {
    color: "#966919",
    fontSize: 20,
    fontWeight: "bold",
  },
  searchBox: {
    backgroundColor: "#F4EEE2",

    height: 42,
    margin: 10,
    padding: 10,
    borderRadius: 10,
    marginLeft: 12,
  },
  songList: {
    height: 495,
    width: 350,
  },
  imageCard: {
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  trackImage: {
    width: 300,
    height: 300,
    borderRadius: 10,
  },
  trackName: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#654321",
    width: 300,
    textAlign: "center",
    overflow: "hidden",
    marginTop: 10,
  },
  trackArtist: {
    fontSize: 20,
    color: "#654321",
    marginTop: 16,
  },
  trackSection: {
    marginTop: 20,
  },
  location: {
    flexDirection: "row",
    alignItems: "center",
    margin: 10,
    backgroundColor: "#F4EEE2",
    padding: 12,
    borderRadius: 10,
    height: 90,
    alignContent: "center",
    justifyContent: "center",
  },
  locationText: {
    fontSize: 20,
    color: "#654321",
    marginLeft: 10,
  },
  locationTextBold: {
    fontSize: 20,
    color: "#654321",
    fontWeight: "bold",
  },
});

export default FirstTime;
