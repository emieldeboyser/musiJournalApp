import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Linking,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { Buffer } from "buffer";
import { SongCard, SongCardTwo, SongTile, SongTileMap } from "./songCard";

import { supabase } from "../lib/supabase";

import ActivityLoader from "./activityLoader";
import FirstTime from "./firstTime";
import { vw, vh, vmin, vmax } from "react-native-expo-viewport-units";
import Header from "./headerTwo";
import Notification from "./notification";
import {
  Ionicons,
  Entypo,
  MaterialIcons,
  FontAwesome,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";

import { FontAwesome5 } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import {
  getAccessToken,
  globalStyles,
  journalQuestions,
  refreshAccessToken,
} from "../constants/global";

import { emojis } from "../constants/global";
import { journalingQuestions } from "../constants/global";

// UPLOAD IMAGE
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";
import { Image } from "react-native";
import MapView, { Marker } from "react-native-maps";

import { colorThemes } from "../constants/global";

const Calander = (props) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // getMonth() is zero-based, so we add 1
  const nameOfMonths = today.toLocaleString("default", { month: "long" });
  const [nameOfMonth, setNameOfMonth] = useState(nameOfMonths);
  const day = String(today.getDate()).padStart(2, "0");
  const [journalMedia, setJournalMedia] = useState(null);

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

  today.setHours(today.getHours() + 2); // Add 2 hours to the current time
  let todaysDate = today.toISOString().split("T")[0]; // Get the date part in ISO format

  const formattedDate = `${year}-${month}-${day}`;

  const [loading, setLoading] = useState(false);
  const [songLoader, setSongLoader] = useState(false);
  const [dayView, setDayView] = useState(null);

  const [selectedDay, setSelectedDay] = useState(formattedDate);
  const [emotion, setEmotion] = useState(null);
  const [comments, setComments] = useState([]);
  const [querySong, setQuerySong] = useState("");
  const [allTracks, setAllTracks] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [firstTime, setFirstTime] = useState(false);

  const [recomendations, setRecomendations] = useState([]);
  const [recomendationsLoader, setRecomendationsLoader] = useState(false);

  const navigation = useNavigation();

  // FOR CALENDER
  const [calenderData, setCalenderData] = useState([]);

  const [song, setSong] = useState(null);

  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const [location, setLocation] = useState(false);

  const client_id = process.env.SPOTIFY_CLIENT_ID; // Add your Spotify client ID
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET; // Add your Spotify client secret

  const [step, setStep] = useState(1);

  // noti message
  const [notiMessage, setNotiMessage] = useState("");

  // POPUP
  const [multiMediaPopUp, setMultiMediaPopUp] = useState(false);
  const [media, setMedia] = useState(null);

  const [user, setUser] = useState(null);
  const [imageLoader, setImageLoader] = useState(false);

  // template
  const [templateItems, setTemplateItems] = useState([]);

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

  const submit = async () => {
    try {
      let text = "";
      setLoading(true);
      let now = new Date().toISOString();
      // now add 2 hours to the current time
      now = new Date(now);
      now.setHours(now.getHours() + 2);

      if (templateItems.length > 0) {
        // combine all index of comments and templateItems into a single array
        const combinedTextArray = templateItems.map((item, index) => {
          const filteredItem = item.filter((i) => i !== "*").join("");
          return `${filteredItem}: ${comments[index]}`;
        });

        const combinedTextString = combinedTextArray.join(". ");
        const sanitizedComments = combinedTextString.replace(/[*]/g, "");

        text = sanitizedComments;

        // Here you would send combinedTextForDB to your database
      } else {
        text = comments[0];
      }

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) throw new Error("Error getting user session");
      const user = sessionData.session.user;

      if (!emotion || !text || !selectedTrack) {
        Alert.alert("Please fill all fields");
        setLoading(false);
        return;
      }

      // Check if user has already entered data for the day
      const { data: existingData, error: existingDataError } = await supabase
        .from("journalData")
        .select("*")
        .eq("day", selectedDay)
        .eq("user_id", user.id);

      if (existingDataError) throw new Error("Error checking existing data");
      if (existingData.length > 0) {
        Alert.alert("You have already entered data for the day");
        setLoading(false);
        return;
      }

      // INPUT VALIDATION
      if (text.length > 1000 || text.length < 1 || text.includes("*")) {
        Alert.alert(
          "Comments should be less than 1000 characters and not contain '*'"
        );
        setLoading(false);
        return;
      }

      const sanitizedComments = text.replace(/[*]/g, "");

      if (media) {
        // check if user already has the medal
        const { data: existingMedalData, error: existingMedalError } =
          await supabase
            .from("user_medals")
            .select("*")
            .eq("user_id", user.id)
            .eq("medal_id", 25);

        if (existingMedalData.length === 0) {
          const { data: medalData, error: medalError } = await supabase
            .from("user_medals")
            .insert([{ user_id: user.id, medal_id: 25 }]);
          if (medalError) console.log("Error adding medal", medalError);
        }
        const base64 = await FileSystem.readAsStringAsync(media.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const filePath = `${user.id}/${selectedDay}`;
        const contentType = media.type;

        const { data: dataImage, error: errorImage } = await supabase.storage
          .from("journal")
          .upload(filePath, decode(base64), { contentType });

        if (errorImage) {
          console.log("Error uploading file: ", errorImage.message);
          if (errorImage.message === "The resource already exists") {
            const { data: updateData, error: updateError } =
              await supabase.storage
                .from("journal")
                .update(filePath, decode(base64), { contentType });

            if (updateError) {
              console.log("Error updating file: ", updateError.message);
            } else {
              setLoading(false);
              setMultiMediaPopUp(false);
            }
          }
        }
      }

      console.log(selectedDay === todaysDate ? true : false);
      const { data, error } = await supabase.from("journalData").insert([
        {
          created_at: now,
          emotion_id: emotion,
          motivation: sanitizedComments,
          user_id: user.id,
          song_id: selectedTrack.id,
          day: selectedDay,
          latitude: latitude || null,
          longitude: longitude || null,
          media: media ? true : false,
          on_time: selectedDay === todaysDate ? true : false,
        },
      ]);

      // ADD MEDALS
      function countWords(str) {
        return str.trim().split(/\s+/).length;
      }

      if (countWords(sanitizedComments) > 500) {
        // first check if user already has the medal
        const { data: existingMedalData, error: existingMedalError } =
          await supabase
            .from("user_medals")
            .select("*")
            .eq("user_id", user.id)
            .eq("medal_id", 23);

        if (existingMedalData.length === 0) {
          const { data: medalData, error: medalError } = await supabase
            .from("user_medals")
            .insert([{ user_id: user.id, medal_id: 23, created_at: now }]);

          if (medalError) console.log("Error adding medal", medalError);
        } else {
          console.log("User already has medal 23");
        }
      } else if (countWords(sanitizedComments) < 50) {
        // first check if user already has the medal
        const { data: existingMedalData, error: existingMedalError } =
          await supabase
            .from("user_medals")
            .select("*")
            .eq("user_id", user.id)
            .eq("medal_id", 24);

        if (existingMedalData.length === 0) {
          const { data: medalData, error: medalError } = await supabase
            .from("user_medals")
            .insert([{ user_id: user.id, medal_id: 24, created_at: now }]);
          if (medalError) console.log("Error adding medal", medalError);
        } else {
          console.log("User already has medal 24");
        }
      }
      if (error) throw new Error("Error inserting journal data");

      // if current day is being added, update streak in user table
      if (selectedDay === todaysDate) {
        let medal_id = null;

        // GET USER
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();
        if (userError) console.log("Error getting user data", userError);

        // Assuming userData.birthday is a Date object
        const userBirthday = new Date(userData.birthday);
        const today = new Date();
        // add 2 hours to the current time
        today.setHours(today.getHours() + 2);
        // Check if it's the same month and day
        if (
          userBirthday.getMonth() === today.getMonth() &&
          userBirthday.getDate() === today.getDate()
        ) {
          // It's the user's birthday!
          const birthdayMedal = 35;
          // First check if user already has the medal
          const { data: existingMedalData, error: existingMedalError } =
            await supabase
              .from("user_medals")
              .select("*")
              .eq("user_id", user.id)
              .eq("medal_id", birthdayMedal);

          if (existingMedalData.length === 0) {
            const { data: medalData, error: medalError } = await supabase
              .from("user_medals")
              .insert([
                { user_id: user.id, medal_id: birthdayMedal, created_at: now },
              ]);
            if (medalError) console.log("Error adding medal", medalError);
          } else {
            console.log("User already has medal 35");
          }
        }

        // UPDATE STREAK
        const { data: streakData, error: streakError } = await supabase
          .from("users")
          .update({ streak: userData.streak + 1 })
          .eq("id", user.id);

        let newStreak = userData.streak + 1;

        if (newStreak === 3) {
          medal_id = 1;
        } else if (newStreak === 7) {
          medal_id = 2;
        } else if (newStreak === 14) {
          medal_id = 3;
        } else if (newStreak === 30) {
          medal_id = 4;
        } else if (newStreak === 90) {
          medal_id = 5;
        } else if (newStreak === 180) {
          medal_id = 6;
        } else if (newStreak === 365) {
          medal_id = 7;
        }

        // ADD STREAK MEDAL
        if (medal_id) {
          const { data: medalData, error: medalError } = await supabase
            .from("user_medals")
            .insert([
              { user_id: user.id, medal_id: medal_id, created_at: now },
            ]);
          if (medalError) console.log("Error adding medal", medalError);
        }

        // ADD ANIVERSARY MEDAL
        const todaysDate2 = new Date();
        todaysDate2.setHours(todaysDate2.getHours() + 2);
        const milestoneMemory = new Date(userData.created_at);
        const oneYearLater = new Date(milestoneMemory);
        oneYearLater.setHours(oneYearLater.getHours() + 2);
        oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

        // Check if one year has passed
        if (oneYearLater.getTime() <= todaysDate2.getTime()) {
          // first check if user already has the medal
          const { data: existingMedalData, error: existingMedalError } =
            await supabase
              .from("user_medals")
              .select("*")
              .eq("user_id", user.id)
              .eq("medal_id", 36);

          if (existingMedalData.length === 0) {
            const { data: medalData, error: medalError } = await supabase
              .from("user_medals")
              .insert([{ user_id: user.id, medal_id: 36, created_at: now }]);
            if (medalError) console.log("Error adding medal", medalError);
          } else {
            console.log("User already has medal 36");
          }
        }

        if (streakError) console.log("Error updating streak", streakError);

        // HAPPY NEW YEAR MEDAL
        if (selectedDay && formattedDate === `${year}-01-01`) {
          const { data: medalData, error: medalError } = await supabase
            .from("user_medals")
            .insert([{ user_id: user.id, medal_id: 33, created_at: now }]);
          if (medalError) console.log("Error adding medal", medalError);
        }

        const currentTime = new Date(); // Current date and time
        const twoHoursLater = new Date();

        const wakeUpTime = new Date(currentTime); // Copy current time
        wakeUpTime.setHours(7); // Set wake-up time to 7 am
        wakeUpTime.setMinutes(0);
        wakeUpTime.setSeconds(0);

        const nightTime = new Date(currentTime); // Copy current time
        nightTime.setHours(22);
        nightTime.setMinutes(0);
        nightTime.setSeconds(0);

        const lunchStart = new Date(currentTime); // Copy current time
        lunchStart.setHours(12);
        lunchStart.setMinutes(0);
        lunchStart.setSeconds(0);

        const lunchEnd = new Date(currentTime); // Copy current time
        lunchEnd.setHours(21);
        lunchEnd.setMinutes(0);
        lunchEnd.setSeconds(0);

        // between two times
        if (twoHoursLater < wakeUpTime) {
          // Check if user already has the medal
          const { data: existingMedalData, error: existingMedalError } =
            await supabase
              .from("user_medals")
              .select("*")
              .eq("user_id", user.id)
              .eq("medal_id", 20);

          if (existingMedalData.length === 0) {
            // If the user doesn't have the medal yet, award it
            const { data: medalData, error: medalError } = await supabase
              .from("user_medals")
              .insert([{ user_id: user.id, medal_id: 20, created_at: now }]);
            if (medalError) console.log("Error adding medal", medalError);
          } else {
            console.log("User already has medal 20");
          }
        } else if (twoHoursLater > nightTime) {
          // Check if user already has the medal
          const { data: existingMedalData, error: existingMedalError } =
            await supabase
              .from("user_medals")
              .select("*")
              .eq("user_id", user.id)
              .eq("medal_id", 21);

          if (existingMedalData.length === 0) {
            // If the user doesn't have the medal yet, award it
            const { data: medalData, error: medalError } = await supabase
              .from("user_medals")
              .insert([{ user_id: user.id, medal_id: 21, created_at: now }]);
            if (medalError) console.log("Error adding medal", medalError);
          } else {
            console.log("User already has medal 21");
          }
        } else if (twoHoursLater > lunchStart && twoHoursLater < lunchEnd) {
          // Check if user already has the medal
          const { data: existingMedalData, error: existingMedalError } =
            await supabase
              .from("user_medals")
              .select("*")
              .eq("user_id", user.id)
              .eq("medal_id", 22);

          if (existingMedalData.length === 0) {
            // If the user doesn't have the medal yet, award it
            const { data: medalData, error: medalError } = await supabase
              .from("user_medals")
              .insert([{ user_id: user.id, medal_id: 22, created_at: now }]);
            if (medalError) console.log("Error adding medal", medalError);
          } else {
            console.log("User already has medal 22");
          }
        }
      }

      setDayView({
        created_at: now,
        emotion_id: emotion,
        motivation: sanitizedComments,
        user_id: user.id,
        song_id: getTrackInfo(selectedTrack.id),
        day: selectedDay,
        media: media ? media.uri : null,
        latitude: latitude || null,
        longitude: longitude || null,
      });

      // ADD TO DATA ARRAY
      setCalenderData((prev) => [
        ...prev,
        {
          created_at: now,
          emotion_id: emotion,
          motivation: sanitizedComments,
          user_id: user.id,
          song_id: selectedTrack.id,
          day: selectedDay,
          media: media ? media.uri : null,
          latitude: latitude || null,
          longitude: longitude || null,
        },
      ]);
      // ADD TO CALANDER MARKS ARRAY

      setNotiMessage("Entry added");
      setStep(1);
      setEmotion(null);
      setComments("");
      setSelectedTrack(null);
      setMedia(media);
    } catch (error) {
      console.error("An error occurred: ", error.message);
      Alert.alert("An error occurred", error.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
      fetchTheme();
      return () => {
        null;
      };
    }, [])
  );

  // GET ALL PREVIOUS DATE FROM DB
  async function fetchData() {
    setLoading(true);
    const user = await supabase.auth.getSession();
    setUser(user);

    let { data: journalData } = await supabase
      .from("journalData")
      .select("*")
      .eq("user_id", user.data.session.user.id);

    if (journalData.length === 0) {
      journalData = [];
      setFirstTime(true);
      return setCalenderData(journalData);
    }

    if (journalData.length > 0) {
      setFirstTime(false);
      checkIfDataExists(selectedDay, journalData);
    }
    setCalenderData(journalData);
    setLoading(false);
  }

  const markedDates = {
    ...calenderData.reduce((acc, e) => {
      acc[e.day] = {
        marked: true,
        dotColor: currentTheme.dark,
      };
      return acc;
    }, {}),
    [selectedDay]: {
      selected: true,
      selectedColor: currentTheme.dark,
    },
  };

  const getTrackInfo = async (trackId) => {
    setSongLoader(true);
    async function getTrackInfo(access_token) {
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
    }
    getToken().then((response) => {
      if (response && response.access_token) {
        getTrackInfo(response.access_token).then((profile) => {
          if (profile) {
            setSong(profile);
            setSongLoader(false);
          }
        });
      }
    });
  };

  const checkIfDataExists = (selectedDay, data) => {
    // Iterate through the data array
    for (let item of data) {
      // Check if the day matches the selected day
      if (item.day === selectedDay) {
        if (item.media) {
          const fetchMedia = async () => {
            try {
              setImageLoader(true);

              const user = await supabase.auth.getSession();
              // Check if user and necessary properties are defined
              if (
                !user ||
                !user.data ||
                !user.data.session ||
                !user.data.session.user ||
                !user.data.session.user.id
              ) {
                throw new Error("User data is not properly defined");
              }

              const { data, error } = await supabase.storage
                .from("journal")
                .download(`${user.data.session.user.id}/${selectedDay}`);

              if (error) {
                throw error;
              }

              if (data) {
                const blob = URL.createObjectURL(data);
                setJournalMedia(blob);
                setImageLoader(false);
              } else {
                setJournalMedia(null); // Corrected from setImage to setJournalMedia
                setImageLoader(false); // Corrected from setLoading to setImageLoader
              }
            } catch (error) {
              console.error("Error fetching image", error);
              setJournalMedia(null); // Corrected from setImage to setJournalMedia
              setImageLoader(false); // Corrected from setLoading to setImageLoader
            }
          };
          fetchMedia();
        }
        console.log(item);
        setDayView(item);
        getTrackInfo(item.song_id);

        return true;
      }
    }
    setDayView(null);
    return false;
  };

  // when selected day changes, check if data exists
  useEffect(() => {
    if (calenderData.length === 0) return;
    checkIfDataExists(selectedDay, calenderData);
  }, [selectedDay]);

  if (firstTime) {
    return <FirstTime />;
  }

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

  const template = () => {
    const random = Math.floor(Math.random() * journalQuestions.length);

    const journalHelp = journalQuestions[random].split("*");
    // add item to the state array

    setTemplateItems([...templateItems, journalHelp]);
    setComments([...comments, ""]); // Initialize corresponding comment entry
  };

  const multimedia = () => {
    setMultiMediaPopUp(true);
  };

  const pickImage = async () => {
    const options = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    };
    let result = await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled) {
      try {
        const img = result.assets[0];
        setMedia(img);
        setMultiMediaPopUp(false);
      } catch (error) {
        console.log("Error processing file: ", error.message);
      }
    }
  };

  const takeImage = async () => {
    const status = await ImagePicker.requestCameraPermissionsAsync();
    const options = {
      saveToPhotos: true,
      mediaType: "photo",
      includeBase64: false,
      includeExtra: true,
    };

    let result = await ImagePicker.launchCameraAsync();

    if (!result.canceled) {
      try {
        const img = result.assets[0];
        setMedia(img);
        setMultiMediaPopUp(false);
      } catch (error) {
        console.log("Error processing file: ", error.message);
      }
    }
  };

  if (loading) {
    return <ActivityLoader visible={loading} />;
  }

  const getRecentlyPlayed = async (token) => {
    setRecomendationsLoader(true);
    const response = await fetch(
      "https://api.spotify.com/v1/me/player/recently-played?limit=25",
      {
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    );
    const data = await response.json();
    const reformattedArray = data.items.map((item) => {
      const { played_at, ...rest } = item;
      return { played_at, ...rest };
    });

    setRecomendations(reformattedArray);
    setRecomendationsLoader(false);
    return "Success";
  };

  const authenticateSpotify = async () => {
    const response = await refreshAccessToken();
    if (response === 400) {
      console.log("Error refreshing access token");
      Alert.alert("Please link your spotify account in settings");
      navigation.navigate("Profile");
      return;
    }
    const recentlPlayed = await getRecentlyPlayed(response);
  };

  const handleCommentChange = (text, index) => {
    const newComments = [...comments];
    newComments[index] = text;
    setComments(newComments);
  };

  return (
    <View style={globalStyles.container}>
      <Header name={nameOfMonth} link={"Home"} />
      {notiMessage && <Notification message={notiMessage} />}
      {multiMediaPopUp ? (
        <View
          style={{
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: currentTheme.light,
            height: 150,
            position: "absolute",
            top: 400,
            right: 20,
            left: 20,
            borderRadius: 20,
          }}
        >
          <FontAwesome
            name="close"
            size={25}
            color={currentTheme.dark}
            style={{ position: "absolute", top: 10, right: 20 }}
            onPress={() => setMultiMediaPopUp(false)}
          />
          <TouchableOpacity
            onPress={pickImage}
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 20,
              padding: 10,
              borderRadius: 20,
              margin: 10,
            }}
          >
            <MaterialIcons
              name="photo-library"
              size={25}
              color={currentTheme.dark}
            />
            <Text
              style={{
                color: currentTheme.dark,
                fontSize: 20,
                fontWeight: "bold",
              }}
            >
              Upload image
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={takeImage}
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 20,
              padding: 10,
              borderRadius: 20,
              margin: 10,
            }}
          >
            <Entypo name="camera" size={25} color={currentTheme.dark} />
            <Text
              style={{
                color: currentTheme.dark,
                fontSize: 20,
                fontWeight: "bold",
              }}
            >
              Take a picture
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ActivityLoader visible={loading} />

          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
              {step === 2 || step === 3 ? null : (
                <View style={styles.calender}>
                  <Calendar
                    onDayPress={(day) => {
                      setSelectedDay(day.dateString);
                      setStep(1);
                      setEmotion(null);
                      setComments("");
                      setSelectedTrack(null);
                    }}
                    style={{
                      borderRadius: 10,
                      paddingLeft: 20,
                      paddingRight: 20,
                      margin: 10,
                    }}
                    theme={{
                      backgroundColor: "#ffffff",
                      calendarBackground: "#ffffff",
                      todayTextColor: "#654321",
                      todayFontWeigth: "bold",
                      dayTextColor: "#222222",

                      textDisabledColor: "#d9e1e8",
                      monthTextColor: "#654321",

                      textDayFontWeight: "300",
                      textMonthFontWeight: "bold",
                      textDayHeaderFontWeight: "500",
                      textDayFontSize: 16,
                      textMonthFontSize: 18,
                      selectedDayBackgroundColor: "#654321",
                      selectedDayTextColor: "white",
                      textDayHeaderFontSize: 8,
                      monthTextFontSize: 16,
                      textDayHeaderFontWeight: "bold",
                    }}
                    firstDay={1}
                    monthFormat={"MMMM yyyy"}
                    hideArrows
                    enableSwipeMonths={true}
                    markedDates={markedDates}
                    maxDate={todaysDate}
                    scrollEnabled={true}
                    horizontal={true}
                    headerStyle={{
                      height: 0,
                      opacity: 0,
                    }}
                    showScrollIndicator={true}
                    onMonthChange={(month) => {
                      function getMonthName(monthNumber) {
                        const monthNames = [
                          "January",
                          "February",
                          "March",
                          "April",
                          "May",
                          "June",
                          "July",
                          "August",
                          "September",
                          "October",
                          "November",
                          "December",
                        ];

                        if (monthNumber < 1 || monthNumber > 12) {
                          return "Invalid month number";
                        }

                        return `${monthNames[monthNumber - 1]} ${month.year}`;
                      }
                      setNameOfMonth(getMonthName(month.month));
                    }}
                  />
                </View>
              )}

              {dayView ? (
                <TouchableOpacity
                  onPress={() => {
                    const item = dayView;
                    navigation.navigate("Detail", { item });
                  }}
                  style={{
                    height: 500,
                    justifyContent: "center",
                  }}
                >
                  <View
                    style={{
                      zIndex: 1,
                      backgroundColor: currentTheme.light,
                      borderRadius: 20,
                      borderBottomRightRadius: 0,
                      position: "absolute",
                      right: 10,
                      width: 60,
                      height: 80,
                      top: 25,
                      paddingTop: 5,
                    }}
                  >
                    <Text style={styles.emojiToday}>{dayView.emotion_id}</Text>
                  </View>
                  {dayView.media ? (
                    <View style={styles.topPartContainer}>
                      {imageLoader ? (
                        <View
                          style={{
                            height: 180,
                            width: 180,
                            borderRadius: 20,
                            marginTop: 10,
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: "#F4EEE2",
                          }}
                        >
                          <ActivityIndicator size="large" color="#96691" />
                        </View>
                      ) : (
                        <Image
                          source={{ uri: journalMedia }}
                          style={{
                            height: 190,
                            width: 190,
                            borderRadius: 20,
                            marginTop: 10,
                          }}
                        />
                      )}

                      <View
                        style={[
                          styles.addedImages,
                          { backgroundColor: currentTheme.light },
                        ]}
                      >
                        <ScrollView
                          showsVerticalScrollIndicator
                          style={[
                            styles.motiEmojis,
                            { backgroundColor: currentTheme.light },
                          ]}
                        >
                          <Text
                            style={[
                              styles.motivations,
                              { color: currentTheme.dark },
                            ]}
                          >
                            {dayView.motivation}
                          </Text>
                        </ScrollView>
                      </View>
                    </View>
                  ) : (
                    <ScrollView
                      showsVerticalScrollIndicator
                      style={[
                        styles.motiEmoji,
                        { backgroundColor: currentTheme.light },
                      ]}
                      contentContainerStyle={{
                        flexGrow: 1,
                        justifyContent: "space-between",
                      }}
                    >
                      <Text
                        style={[
                          styles.motivation,
                          { color: currentTheme.dark },
                        ]}
                      >
                        {dayView.motivation}
                      </Text>
                    </ScrollView>
                  )}

                  {/* IF LOCATION THEN CHANGE VIEW */}
                  {dayView.latitude && dayView.longitude ? (
                    <View
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: 10,
                      }}
                    >
                      {/* Album */}
                      <View>
                        {songLoader ? (
                          <View style={styles.loader}>
                            <ActivityIndicator
                              size="large"
                              color={currentTheme.dark}
                            />
                          </View>
                        ) : (
                          <View
                            style={{
                              height: 190,
                              width: 190,
                              borderRadius: 20,
                            }}
                          >
                            <SongTile object={song} />
                          </View>
                        )}
                      </View>
                      {/* MAPVIEW */}
                      <View>
                        <MapView
                          style={tiles.map}
                          initialRegion={{
                            latitude: dayView.latitude,
                            longitude: dayView.longitude,
                            latitudeDelta: 0.0922,
                            longitudeDelta: 0.0421,
                          }}
                          scrollEnabled={false}
                        >
                          <Marker
                            coordinate={{
                              latitude: dayView.latitude,
                              longitude: dayView.longitude,
                            }}
                            title={"Location"}
                            description={"Location"}
                          >
                            <SongTileMap object={song} />
                          </Marker>
                        </MapView>
                      </View>
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.addedTrack,
                        { marginHorizontal: 10, marginTop: 20 },
                      ]}
                    >
                      {songLoader ? (
                        <View style={styles.loader}>
                          <ActivityIndicator size="large" color="#654321" />
                        </View>
                      ) : (
                        <>
                          <SongCardTwo object={song} />
                        </>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              ) : (
                <>
                  <View style={styles.container}>
                    {/* STEP 1; EMOJI */}
                    {step === 1 && (
                      <View>
                        <Text
                          style={[
                            styles.titleSpecial,
                            { color: currentTheme.dark },
                          ]}
                        >
                          How are you today?
                        </Text>
                        <Text
                          style={[
                            styles.subTitle,
                            { color: currentTheme.dark },
                          ]}
                        >
                          Please choose one emoji
                        </Text>
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
                                emotion !== e &&
                                  emotion !== null &&
                                  styles.notSelectedEmoji,
                              ]}
                              key={`emoji_${index}`}
                              onPress={() =>
                                setEmotion((prevEmotion) =>
                                  prevEmotion === e ? null : e
                                )
                              }
                            >
                              {e}
                            </Text>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                    {/* STEP 2; MOTIVATION */}
                    {step === 2 && emotion && (
                      <View style={styles.inputSection}>
                        <Text
                          style={[styles.title, { color: currentTheme.dark }]}
                        >
                          Tell me more
                        </Text>
                        {templateItems.length > 0 ? (
                          <ScrollView
                            style={[
                              styles.templateContainer,
                              {
                                height: media ? 320 : 540,
                              },
                            ]}
                          >
                            {templateItems.map((item, index) => {
                              const filteredItem = item
                                .filter((i) => i !== "*")
                                .join("");

                              return (
                                <React.Fragment key={index}>
                                  <Text
                                    style={{
                                      fontSize: 20,
                                      fontWeight: "medium",
                                      color: currentTheme.dark,
                                      paddingHorizontal: 10,
                                    }}
                                  >
                                    {filteredItem}
                                  </Text>
                                  <TextInput
                                    style={{
                                      backgroundColor: currentTheme.mid,
                                      borderRadius: 10,
                                      padding: 10,
                                      margin: 10,
                                      height: 100,
                                    }}
                                    placeholder="Write here"
                                    value={comments[index] || ""}
                                    multiline
                                    numberOfLines={7}
                                    onChangeText={(text) =>
                                      handleCommentChange(text, index)
                                    }
                                  />
                                </React.Fragment>
                              );
                            })}
                          </ScrollView>
                        ) : (
                          <ScrollView
                            style={[
                              styles.inputArea,
                              {
                                height: media ? 330 : 540,
                                backgroundColor: currentTheme.light,
                                color: currentTheme.dark,
                              },
                            ]}
                          >
                            <TextInput
                              style={[
                                styles.input,
                                { color: currentTheme.dark },
                              ]}
                              placeholder="Write here"
                              value={comments[0] || ""}
                              multiline
                              numberOfLines={7}
                              onChangeText={(text) => {
                                setComments([text]);
                              }}
                              placeholderTextColor={currentTheme.dark}
                            />
                          </ScrollView>
                        )}

                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: 0,
                          }}
                        >
                          <TouchableOpacity
                            style={[
                              styles.buttonContainer,
                              {
                                height: 60,
                                width: media ? 400 : 290,
                                backgroundColor: currentTheme.light,
                              },
                            ]}
                            onPress={template}
                          >
                            <Text
                              style={[
                                styles.templateText,
                                { color: currentTheme.dark },
                              ]}
                            >
                              I need some help!
                            </Text>
                          </TouchableOpacity>

                          {!media && (
                            <TouchableOpacity
                              style={[
                                styles.buttonContainer,
                                {
                                  height: 60,
                                  width: 80,
                                  backgroundColor: currentTheme.dark,
                                },
                              ]}
                              onPress={multimedia}
                            >
                              <Entypo
                                name="camera"
                                size={35}
                                color={currentTheme.light}
                              />
                            </TouchableOpacity>
                          )}
                        </View>
                        {media && (
                          <View
                            style={[
                              styles.addedImage,
                              { backgroundColor: currentTheme.light },
                            ]}
                          >
                            <Image
                              source={{ uri: media.uri }}
                              style={{ height: 180, width: 180 }}
                            />
                            <MaterialCommunityIcons
                              name="delete-circle"
                              size={35}
                              color={currentTheme.dark}
                              onPress={() => setMedia(null)}
                              style={{
                                position: "absolute",
                                top: 0,
                                right: 70,
                              }}
                            />
                          </View>
                        )}
                      </View>
                    )}

                    {/* STEP 3, MUSIC */}
                    {step === 3 && (
                      <View style={styles.trackSection}>
                        {selectedTrack ? (
                          <>
                            <Text
                              style={[
                                styles.title,
                                { color: currentTheme.dark },
                              ]}
                            >
                              Added track
                            </Text>
                            <TouchableOpacity
                              onPress={() => setSelectedTrack(null)}
                              style={{
                                justifyContent: "center",
                                alignItems: "center",
                                gap: 10,
                                marginBottom: 30,
                              }}
                            >
                              <Image
                                source={{
                                  uri: selectedTrack.album.images[0].url,
                                }}
                                style={{
                                  height: 400,
                                  width: 400,
                                  borderRadius: 10,
                                }}
                              />
                              <Text
                                style={{
                                  color: currentTheme.dark,
                                  fontSize: 35,
                                  fontWeight: "bold",
                                  textAlign: "center",
                                  height: 50,
                                  width: 400,
                                  overflow: "hidden",
                                }}
                              >
                                {selectedTrack.name}
                              </Text>
                              <Text
                                style={{
                                  color: currentTheme.dark,
                                  fontSize: 20,
                                  fontWeight: "bold",
                                }}
                              >
                                {selectedTrack.artists[0].name}
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[
                                styles.location,
                                {
                                  backgroundColor: currentTheme.light,
                                },
                              ]}
                              onPress={getCurrentPosition}
                            >
                              <FontAwesome5
                                name="location-arrow"
                                size={24}
                                color={currentTheme.dark}
                              />
                              <Text
                                style={[
                                  styles.locationText,
                                  { color: currentTheme.dark },
                                ]}
                              >
                                Location{" "}
                              </Text>
                              <Text
                                style={[
                                  styles.locationTextBold,
                                  { color: currentTheme.dark },
                                ]}
                              >
                                {location ? "On" : "Off"}{" "}
                              </Text>
                            </TouchableOpacity>
                          </>
                        ) : (
                          <>
                            <Text
                              style={[styles.h2, { color: currentTheme.dark }]}
                            >
                              Add a track
                            </Text>

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
                                <FontAwesome
                                  name="search"
                                  size={28}
                                  color={currentTheme.dark}
                                />
                                <TextInput
                                  style={[
                                    styles.searchTrackText,
                                    {
                                      color: currentTheme.dark,
                                      backgroundColor: currentTheme.light,
                                    },
                                  ]}
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
                              <TouchableOpacity
                                style={[
                                  styles.buttonContainer,
                                  {
                                    height: 60,
                                    width: 400,
                                    backgroundColor: currentTheme.dark,
                                    marginBottom: 20,
                                  },
                                ]}
                                onPress={authenticateSpotify}
                              >
                                <Text
                                  style={[
                                    styles.templateText,
                                    { color: "white" },
                                  ]}
                                >
                                  What did I listen today?
                                </Text>
                              </TouchableOpacity>
                              {recomendationsLoader ? (
                                <View style={styles.loader}>
                                  <ActivityIndicator
                                    size="large"
                                    color={currentTheme.dark}
                                  />
                                </View>
                              ) : (
                                allTracks.length === 0 &&
                                recomendations.length > 0 && (
                                  <ScrollView style={{ height: 400 }}>
                                    {recomendations.map((track, index) => (
                                      <TouchableOpacity
                                        key={`track_${index}`}
                                        onPress={() => {
                                          setQuerySong("");
                                          setAllTracks([]);
                                          setSelectedTrack(track.track);
                                        }}
                                        style={{ width: 400 }}
                                      >
                                        <SongCard object={track.track} />
                                      </TouchableOpacity>
                                    ))}
                                  </ScrollView>
                                )
                              )}

                              {allTracks.length > 0 && (
                                <ScrollView style={{ height: 400 }}>
                                  {allTracks.map((track, index) => (
                                    <TouchableOpacity
                                      key={`track_${index}`}
                                      onPress={() => {
                                        setQuerySong("");
                                        setAllTracks([]);
                                        setSelectedTrack(track);
                                      }}
                                      style={{ width: 400 }}
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
                  </View>
                  {/* CONTROLS OF STEPS */}
                  <View style={styles.bottomContainer}>
                    {step < 4 && (
                      <View style={styles.submit}>
                        {step > 1 ? (
                          <TouchableOpacity
                            onPress={() => {
                              setStep(step - 1);
                              setTemplateItems([]);
                            }}
                            style={[
                              styles.submitItem,
                              { backgroundColor: currentTheme.light },
                            ]}
                          >
                            <Text
                              style={[
                                styles.submitText,
                                { color: currentTheme.dark },
                              ]}
                            >
                              Back
                            </Text>
                          </TouchableOpacity>
                        ) : null}
                        <>
                          {step === 3 ? (
                            <TouchableOpacity
                              onPress={submit}
                              style={[
                                styles.submitItem,
                                {
                                  backgroundColor: currentTheme.light,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.submitText,
                                  { color: currentTheme.dark },
                                ]}
                              >
                                Submit
                              </Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              onPress={() => {
                                if (
                                  (step === 1 && emotion === "") ||
                                  (step === 2 && comments === "") ||
                                  (step === 3 && !selectedTrack)
                                ) {
                                  Alert.alert("Please fill all fields");
                                  return;
                                }
                                navigation.setOptions({
                                  title: selectedDay,
                                });

                                setStep(step + 1);
                              }}
                              style={[
                                styles.submitItem,
                                {
                                  backgroundColor: currentTheme.light,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.submitText,
                                  { color: currentTheme.dark },
                                ]}
                              >
                                Next
                              </Text>
                            </TouchableOpacity>
                          )}
                        </>
                      </View>
                    )}

                    <Text
                      style={[styles.stepText, { color: currentTheme.dark }]}
                    >
                      Step {step} of 3
                    </Text>
                  </View>
                </>
              )}
            </View>
          </TouchableWithoutFeedback>
        </>
      )}
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    height: "100%",
  },
  buttonContainer: {
    backgroundColor: "#F4EEE2",
    padding: 10,
    borderRadius: 20,
    marginHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,

    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },

  templateText: {
    color: "#966919",
    fontSize: 24,
    fontWeight: "bold",
  },

  addedTrack: {
    height: 150,
  },
  emojiToday: {
    fontSize: 35,
    textAlign: "center",
  },
  motiEmoji: {
    padding: 10,
    border: "1px solid #654321",
    backgroundColor: "#F4EEE2",
    borderRadius: 20,
    margin: 10,
    height: 250,
    marginTop: 40,
  },
  motivation: {
    fontSize: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    color: "#A4A3A2",
  },
  motivations: {
    fontSize: 15,
    paddingBottom: 10,
    paddingTop: 10,
    paddingVertical: 5,
    color: "#A4A3A2",
    zIndex: 10,
  },
  h2: {
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 10,
    fontWeight: "bold",
    fontSize: 20,
    color: "#966919",
  },
  emoji: {
    fontSize: 35,
    marginHorizontal: 1,
  },

  inputArea: {
    backgroundColor: "#F4EEE2",
    color: "#966919",
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 10,
    borderRadius: 20,
    height: 490,
  },
  input: {
    color: "#966919",
    fontSize: 20,
    height: 320,
  },
  submit: {
    flexDirection: "row",
    justifyContent: "space-between",
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

  title: {
    // marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 10,
    fontWeight: "bold",
    fontSize: 20,
    color: "#966919",
  },
  titleSpecial: {
    paddingHorizontal: 10,
    fontWeight: "bold",
    fontSize: 20,
    color: "#966919",
  },
  subTitle: {
    paddingHorizontal: 10,
    fontSize: 16,
    color: "#966919",
    marginBottom: 20,
    fontWeight: "light",
  },
  inputSection: {
    paddingTop: 20,
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
    height: 360,
    display: "flex",
  },
  notSelectedEmoji: {
    opacity: 0.1,
  },
  trackSection: {
    marginTop: 20,
  },
  trackItem: {
    height: 150,
    backgroundColor: "#F4EEE2",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 10,
  },
  bottomContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  stepText: {
    color: "#966919",
    fontSize: 20,
    marginBottom: 20,
    marginTop: 10,
  },
  searchTrack: {
    alignItems: "center",
  },
  searchTrackText: {
    color: "#966919",
    fontSize: 20,
    backgroundColor: "#F4EEE2",
    height: 42,
    margin: 10,
    padding: 10,
    borderRadius: 10,
  },
  trashCan: {
    position: "absolute",
    bottom: 120,
    right: 10,
    zIndex: 10,
  },
  location: {
    flexDirection: "row",
    alignItems: "center",
    margin: 10,
    backgroundColor: "#F4EEE2",
    padding: 12,
    borderRadius: 10,
    alignContent: "center",
    justifyContent: "center",
    height: 80,
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
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  addedImage: {
    justifyContent: "center",
    alignItems: "center",
    margin: 10,
    height: 200,
    backgroundColor: "#F4EEE2",
    borderRadius: 20,
  },
  addedImages: {
    justifyContent: "center",
    alignItems: "center",
    // margin: 10,
    height: 190,
    backgroundColor: "#F4EEE2",
    borderRadius: 20,
    width: 190,
  },
  topPartContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 10,
    marginTop: 35,
  },
  motiEmojis: {
    padding: 10,
    border: "1px solid #654321",
    backgroundColor: "#F4EEE2",
    borderRadius: 20,
    height: 180,
    width: 180,
  },
  templateContainer: {
    height: 540,
  },
};

const tiles = {
  image: {
    width: 190,
    height: 190,
    borderRadius: 20,
  },
  map: {
    width: 190,
    height: 190,
    borderRadius: 20,
  },
};

export default Calander;
