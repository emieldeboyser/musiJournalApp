import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import Calander from "./calenderHome";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { AntDesign } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";

import MapView from "react-native-maps";
import AlbumTile from "./albumTile";
import { supabase } from "../lib/supabase";
import { imageMaps } from "../constants/global";
import * as SecureStore from "expo-secure-store";
import { colorThemes } from "../constants/global";

const TileCalender = () => {
  const navigation = useNavigation();
  const [noEntryToday, setNoEntryToday] = useState(false);
  const [colorTheme, setColorTheme] = useState("brown");
  const currentTheme = colorThemes[colorTheme];

  const fetchData = async () => {
    console.log("Fetching data");
    const user = await supabase.auth.getSession();
    const { data, error } = await supabase
      .from("journalData")
      .select("*")
      .eq("user_id", user.data.session.user.id)
      .order("day", { ascending: false })
      .limit(1);

    if (error) {
      console.error(error);
    }

    if (data.length === 0) {
      setNoEntryToday(true);
    } else {
      setNoEntryToday(false);
    }
  };

  const fetchTheme = async () => {
    const theme = await SecureStore.getItemAsync("colorTheme");
    if (theme) {
      setColorTheme(theme);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchTheme();
      fetchData();
      return () => {
        null;
      };
    }, [])
  );

  return (
    <TouchableOpacity
      style={[styles.containerCalender]}
      onPress={() => navigation.navigate("Calender")}
    >
      {noEntryToday ? (
        <View
          style={{
            justifyContent: "center",
            alignItems: "center",
            height: 180,
            width: 370,
            borderRadius: 20,
          }}
        >
          <AntDesign
            name="calendar"
            size={100}
            style={{ color: currentTheme.dark }}
          />
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              color: currentTheme.dark,
              marginHorizontal: 10,
              textAlign: "center",
            }}
          >
            Click here to get started!
          </Text>
        </View>
      ) : (
        <Calander />
      )}
    </TouchableOpacity>
  );
};

const TileMap = () => {
  const navigation = useNavigation();
  return (
    <TouchableOpacity
      style={styles.containerQuickAdd}
      onPress={() => navigation.navigate("Map")}
    >
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 51.054588,
          longitude: 3.72188,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        scrollEnabled={false}
      ></MapView>
    </TouchableOpacity>
  );
};

const TileStreak = () => {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [noEntryToday, setNoEntryToday] = useState(false);
  const [colorTheme, setColorTheme] = useState("brown");
  const currentTheme = colorThemes[colorTheme];

  const fetchTheme = async () => {
    const theme = await SecureStore.getItemAsync("colorTheme");
    if (theme) {
      setColorTheme(theme);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      calculateStreak();
      fetchTheme();
      return () => {
        null;
      };
    }, [])
  );

  const calculateStreak = async () => {
    console.log("Calculating streak");
    const user = await supabase.auth.getSession();
    const userData = await supabase
      .from("journalData")
      .select("id, day, on_time")
      .eq("user_id", user.data.session.user.id)
      .eq("on_time", true)
      .order("day", { ascending: false });

    const latestEntry = userData.data[0];
    if (!latestEntry) {
      setNoEntryToday(true);
      return;
    }
    console.log("latestEntry", latestEntry);
    const now = new Date();
    now.setHours(now.getHours() + 2);
    console.log("now", now);

    const latestEntryDate = new Date(latestEntry.day);
    console.log("latestEntryDate", latestEntryDate);

    let streak = 0;

    if (
      latestEntryDate.toISOString().split("T")[0] ===
      now.toISOString().split("T")[0]
    ) {
      let arrayOfOneTimeEntries = [];

      for (let i = 0; i < userData.data.length; i++) {
        if (userData.data[i].on_time) {
          arrayOfOneTimeEntries.push(userData.data[i]);
        } else {
          break;
        }
      }

      // check to see if days are consecutive
      streak = 1;
      console.log("arrayOfOneTimeEntries", arrayOfOneTimeEntries);

      for (let i = 0; i < arrayOfOneTimeEntries.length - 1; i++) {
        let currentDate = new Date(arrayOfOneTimeEntries[i].day); // Convert current day to Date object
        let nextDate = new Date(arrayOfOneTimeEntries[i + 1].day); // Convert next day to Date object

        // Add 1 day to current date
        currentDate.setDate(currentDate.getDate() - 1);

        // Check if the incremented current date matches the next date
        if (
          currentDate.toISOString().split("T")[0] ===
          nextDate.toISOString().split("T")[0]
        ) {
          streak++; // Increment streak if the incremented current date matches the next date
        } else {
          break; // Break the loop as soon as a different day is encountered
        }
      }

      setCurrentStreak(streak);
      setNoEntryToday(false);
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(yesterday.getHours() + 2);

      const yesterdayEntry = userData.data.find(
        (entry) => entry.day === yesterday.toISOString().split("T")[0]
      );

      if (yesterdayEntry) {
        setNoEntryToday(true);
      } else {
        streak = 0;
        setCurrentStreak(0);
      }
    }

    const { data: userStreak, error: userError } = await supabase
      .from("users")
      .update({ streak: streak })
      .eq("id", user.data.session.user.id);

    if (userError) {
      console.error(userError);
    }
  };

  return (
    <View
      style={[styles.containerStreak, { backgroundColor: currentTheme.light }]}
    >
      <View style={[styles.streak, noEntryToday && { gap: 0 }]}>
        {noEntryToday ? (
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              color: currentTheme.dark,
              marginHorizontal: 10,
              width: 100,
              textAlign: "center",
            }}
          >
            No entry today
          </Text>
        ) : (
          <Text style={[styles.streakText, { color: currentTheme.dark }]}>
            {currentStreak}
          </Text>
        )}
        <Ionicons name="flame-sharp" size={75} style={{ color: "brown" }} />
      </View>
    </View>
  );
};

const TileAlbumWall = () => {
  const navigation = useNavigation();
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [colorTheme, setColorTheme] = useState("brown");
  const currentTheme = colorThemes[colorTheme];

  const fetchData = async () => {
    console.log("Fetching data");
    let user;
    setLoading(true);
    const userData = await supabase.auth.getSession();
    const extraData = await supabase
      .from("users")
      .select()
      .eq("id", userData.data.session.user.id);

    user = userData.data.session.user;
    user = { ...user, ...extraData.data[0] };

    const { data, error } = await supabase
      .from("journalData")
      .select("*")
      .eq("user_id", user.id)
      .range(0, 2)
      .order("day", { ascending: false }); // or { ascending: false } for descending order
    if (error) {
      console.log("error fetching emotions", error);
    }

    if (data) {
      setData(data);
      setFilteredData(data);
      setLoading(false);
    }

    setUser(user);
  };

  const fetchTheme = async () => {
    const theme = await SecureStore.getItemAsync("colorTheme");
    if (theme) {
      setColorTheme(theme);
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

  return (
    <TouchableOpacity
      style={[styles.containerAlbumWall, { backgroundColor: currentTheme.mid }]}
      onPress={() => navigation.navigate("Collection")}
    >
      <AlbumTile object={data} loading={loading} />
    </TouchableOpacity>
  );
};

const TileMedal = () => {
  const navigation = useNavigation();
  const [badges, setBadges] = useState([]);
  const [colorTheme, setColorTheme] = useState("brown");
  const currentTheme = colorThemes[colorTheme];

  const fetchMedals = async () => {
    let medal = null;
    const user = await supabase.auth.getSession();

    const { data: journalData, error: journalError } = await supabase
      .from("journalData")
      .select("*")
      .eq("user_id", user.data.session.user.id);

    if (journalData.length === 10) {
      medal = 9;
    } else if (journalData.length === 25) {
      medal = 10;
    } else if (journalData.length === 50) {
      medal = 11;
    } else if (journalData.length === 100) {
      medal = 12;
    } else if (journalData.length === 500) {
      medal = 13;
    } else if (journalData.length === 1000) {
      medal = 14;
    }

    if (medal) {
      const { data: medalData, error: medalError } = await supabase
        .from("user_medals")
        .insert([{ user_id: user.data.session.user.id, medal_id: medal }]);

      if (medalError) {
        console.error(medalError);
      }
    }

    // NOW FETCH THE ACTUAL MEDALS
    const { data: medalData, error: medalError } = await supabase
      .from("user_medals")
      .select("medal_id, medal_id:medals(id, title, description, image)")
      .eq("user_id", user.data.session.user.id)
      .order("created_at", { ascending: false });

    if (medalError) {
      console.error(medalError);
    }

    if (medalData) {
      setBadges(medalData);
    }
  };

  const fetchTheme = async () => {
    const theme = await SecureStore.getItemAsync("colorTheme");
    if (theme) {
      setColorTheme(theme);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchMedals();
      fetchTheme();
      return () => {
        null;
      };
    }, [])
  );

  const renderedMedals = badges.slice(0, 3);

  return (
    <TouchableOpacity
      style={[styles.containerMedals, { backgroundColor: currentTheme.mid }]}
      onPress={() => navigation.navigate("Badge")}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "center",
        }}
      >
        {badges.length > 0 ? (
          renderedMedals.map((badge) => {
            if (!badge.medal_id.id) return null;
            return (
              <View key={badge.medal_id.id}>
                <Image
                  source={imageMaps[badge.medal_id.id]}
                  style={{ width: 100, height: 100 }}
                />
              </View>
            );
          })
        ) : (
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              color: currentTheme.dark,
              marginHorizontal: 10,
              width: 100,
              textAlign: "center",
            }}
          >
            No medals yet
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  containerCalender: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  containerQuickAdd: {
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    height: 180,
    width: 180,
    borderRadius: 20,

    justifyContent: "flex-end",
    alignItems: "center",
  },
  containerStreak: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4EEE2",
    height: 180,
    width: 180,
    borderRadius: 20,
    paddingVertical: 20,
  },
  containerAlbumWall: {
    backgroundColor: "#F4EEE2",
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    height: 117,
  },
  containerMedals: {
    backgroundColor: "#F4EEE2",
    width: "100%",
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 10,
    overflow: "hidden",
  },
  streak: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  streakText: {
    fontSize: 30,
    fontWeight: "bold",
    color: "black",
    marginHorizontal: 10,
    color: "#654321",
  },
  h1: {
    fontSize: 26,
    fontWeight: "bold",
    color: "black",
    marginVertical: 10,
    color: "#654321",
    textAlign: "center",
  },
  map: {
    width: 180,
    height: 180,
    borderRadius: 20,
  },
});

export { TileCalender, TileMap, TileStreak, TileAlbumWall, TileMedal };
