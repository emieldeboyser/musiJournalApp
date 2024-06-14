import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import Header from "../../components/headerTwo";
import { supabase } from "../../lib/supabase";
import { imageMaps } from "../../constants/global";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import { colorThemes } from "../../constants/global";

const Badge = () => {
  const navigation = useNavigation();
  const [colorTheme, setColorTheme] = useState("brown");
  const currentTheme = colorThemes[colorTheme];

  const [badges, setBadges] = useState([]);
  const [emotions, setEmotions] = useState([]);
  const [emotionCounts, setEmotionCounts] = useState({}); // Define emotionCounts state
  const [daysAdded, setDaysAdded] = useState(0);
  const [daysOnTime, setDaysOnTime] = useState(0);
  const [daysTooLate, setDaysTooLate] = useState(0);
  const [averageEntryHour, setAverageEntryHour] = useState("");

  const fetchBadges = async () => {
    // Fetch all badges from the database
    const user = await supabase.auth.getSession();
    const { data, error } = await supabase
      .from("user_medals")
      .select(
        "medal_id, medal_id:medals(id, title, description, image), created_at"
      )
      .eq("user_id", user.data.session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.log("Error fetching badges", error);
    }
    setBadges(data);
  };

  const fetchTheme = async () => {
    const theme = await SecureStore.getItemAsync("colorTheme");
    if (theme) {
      setColorTheme(theme);
    }
  };

  const fetchEmotions = async () => {
    // Fetch all emotions from the database
    const user = await supabase.auth.getSession();
    const { data, error } = await supabase
      .from("journalData")
      .select("id, emotion_id, created_at")
      .eq("user_id", user.data.session.user.id);

    if (error) {
      console.log("Error fetching emotions", error);
      return;
    }
    // Count duplicate emotions and merge them into a single object
    const emotionCounts = data.reduce((counts, entry) => {
      const { emotion_id } = entry;
      counts[emotion_id] = (counts[emotion_id] || 0) + 1;
      return counts;
    }, {});

    // Set emotions data into state
    setEmotions(data);
    setEmotionCounts(emotionCounts); // Set emotionCounts state
  };

  useEffect(() => {
    fetchBadges();
    fetchEmotions();
    getStats();
    fetchTheme();
  }, []);

  const maxCount = Math.max(...Object.values(emotionCounts));

  // Get sorted emotion IDs based on their counts in descending order
  const sortedEmotionIds = Object.keys(emotionCounts).sort(
    (a, b) => emotionCounts[b] - emotionCounts[a]
  );

  const getStats = async () => {
    // Fetch all journal entries from the database
    const user = await supabase.auth.getSession();
    const { data, error } = await supabase
      .from("journalData")
      .select("id, emotion_id, created_at, on_time")
      .eq("user_id", user.data.session.user.id);

    if (error) {
      console.log("Error fetching journal entries", error);
      return;
    }

    const stripTimezone = (timestamp) => {
      return timestamp.split("+")[0];
    };

    const calculateAverageHour = (data) => {
      const totalTime = data.reduce(
        (total, entry) => {
          const naiveTimestamp = stripTimezone(entry.created_at);
          const date = new Date(naiveTimestamp);

          total.hours += date.getHours();
          total.minutes += date.getMinutes();
          total.seconds += date.getSeconds();
          return total;
        },
        { hours: 0, minutes: 0, seconds: 0 }
      );

      // Calculate average hours, minutes, and seconds
      const dataLength = data.length;
      const averageHours = Math.floor(totalTime.hours / dataLength);
      const averageMinutes = Math.floor(totalTime.minutes / dataLength);

      // Return the formatted average time string
      return `${String(averageHours).padStart(2, "0")}:${String(
        averageMinutes
      ).padStart(2, "0")}`;
    };

    // Calculate statistics based on journal entries
    setDaysAdded(data.length);
    setDaysOnTime(data.filter((entry) => entry.on_time === true).length);
    setDaysTooLate(data.filter((entry) => entry.on_time === false).length);
    setAverageEntryHour(calculateAverageHour(data));
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchBadges();
      fetchEmotions();
      getStats();
      fetchTheme();
    }, [])
  );

  return (
    <>
      <Header name={"Achievements"} link={"Home"} />

      <SafeAreaView style={styles.container}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <Text style={[styles.h1, { color: currentTheme.dark }]}>
            Trophees
          </Text>
          <TouchableOpacity
            style={{
              padding: 10,
              borderRadius: 10,
              marginRight: 10,
            }}
            onPress={() => navigation.navigate("Trophees", { badges })}
          >
            <Text style={{ color: currentTheme.dark, fontSize: 16 }}>
              View all
            </Text>
          </TouchableOpacity>
        </View>
        {/* Recap of all medals earned */}
        <ScrollView
          horizontal
          style={[styles.scrollView, { backgroundColor: currentTheme.mid }]}
          contentContainerStyle={styles.scrollViewContent}
        >
          {badges.map((badge, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => navigation.navigate("Badge Detail", badge)}
              style={[styles.touchableOpacity]}
            >
              <Image
                source={imageMaps[badge.medal_id.id]}
                style={{ width: 130, height: 130 }}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={[styles.h1, { color: currentTheme.dark }]}>
          Frequent emotions:
        </Text>
        {/* Recap of all medals earned */}
        <ScrollView
          horizontal
          style={[styles.scrollView, { backgroundColor: currentTheme.mid }]}
          contentContainerStyle={styles.scrollViewContent}
        >
          {sortedEmotionIds.map((emotion_id) => (
            <View key={emotion_id} style={styles.emotionContainer}>
              <Text style={styles.emotionText}>{emotion_id}</Text>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height:
                        (emotionCounts[emotion_id] / maxCount) * 100 + "%",
                      backgroundColor: currentTheme.dark,
                    },
                  ]}
                />
              </View>
              <Text style={styles.count}>{emotionCounts[emotion_id]}</Text>
            </View>
          ))}
        </ScrollView>
        <Text style={[styles.h1, { color: currentTheme.dark }]}>
          Statistics
        </Text>
        <View
          style={[styles.statsContainer, { backgroundColor: currentTheme.mid }]}
        >
          <View style={styles.statItem}>
            <Text style={[styles.statText, { color: currentTheme.dark }]}>
              Days added:
            </Text>
            <Text style={[styles.statTextBold, { color: currentTheme.dark }]}>
              {daysAdded}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statText, { color: currentTheme.dark }]}>
              Days on time:
            </Text>
            <Text style={[styles.statTextBold, { color: currentTheme.dark }]}>
              {daysOnTime}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statText, { color: currentTheme.dark }]}>
              Days too late:
            </Text>
            <Text style={[styles.statTextBold, { color: currentTheme.dark }]}>
              {daysTooLate}
            </Text>
          </View>
          <View style={[styles.statItem, { borderBottomWidth: 0 }]}>
            <Text style={[styles.statText, { color: currentTheme.dark }]}>
              Average entry hour:
            </Text>
            <Text style={[styles.statTextBold, { color: currentTheme.dark }]}>
              {averageEntryHour}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  h1: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#966919",
    marginVertical: 16,
    marginHorizontal: 20,
  },
  scrollView: {
    backgroundColor: "#E3D6BC",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 10,
    marginVertical: 10,
    height: 100,
  },
  scrollViewContent: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  touchableOpacity: {
    display: "flex",
    marginHorizontal: 5,
  },
  statsContainer: {
    backgroundColor: "#E3D6BC",
    borderRadius: 20,
    marginHorizontal: 10,
    marginVertical: 10,
    padding: 20,
    height: 200,
    gap: 15,
  },
  statItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomColor: "white",
    borderBottomWidth: 1,
    paddingBottom: 10,
  },
  statText: {
    fontSize: 18,
    color: "white",
  },
  statTextBold: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#966919",
  },
  emotionContainer: {
    alignItems: "center",
    marginRight: 10,
  },
  emotionText: {
    fontSize: 35,
    marginBottom: 5,
  },
  barContainer: {
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    width: 10,
    height: 50,
  },
  bar: {
    backgroundColor: "#966919",
    borderRadius: 5,
    width: 10,
  },
  count: {
    marginTop: 5,
    fontSize: 18,
  },
});

export default Badge;
