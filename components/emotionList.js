import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { supabase } from "../lib/supabase";
import ActivityLoader from "./activityLoader";
import AlbumArt from "./albumArt";
import { useNavigation } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { vw, vh, vmin, vmax } from "react-native-expo-viewport-units";
import { FontAwesome } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { colorThemes } from "./../constants/global";

const EmotionList = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState(null);
  const [filteredData, setFilteredData] = useState(null);
  const [filteredEmotions, setFilteredEmotions] = useState([]);
  const uniqueEmotions = new Set();

  const [search, setSearch] = useState(null);

  const navigation = useNavigation();

  const [colorTheme, setColorTheme] = useState("brown");
  const currentTheme = colorThemes[colorTheme];

  // Fetch data from the database
  useEffect(() => {
    const fetchData = async () => {
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

    fetchTheme();
    fetchData();
  }, []);

  useEffect(() => {
    if (data) {
      const filtered = data.filter((item) => {
        if (!uniqueEmotions.has(item.emotion_id)) {
          uniqueEmotions.add(item.emotion_id);
          return true;
        }
        return false;
      });
      setFilteredEmotions(filtered);
    }
  }, [data]);

  useEffect(() => {
    if (filter === null || data === null) {
      setFilteredData(data); // Show all items if filter is null or data is not yet loaded
    } else {
      const filtered = data.filter((item) => item.emotion_id === filter);
      setFilteredData(filtered); // Apply filter otherwise
    }
  }, [filter, data]);

  useEffect(() => {
    if (data && search !== null) {
      const filtered = data.filter((item) => {
        return item.motivation.includes(search);
      });
      setFilteredData(filtered);
    }
  }, [search]);

  if (loading) {
    return <ActivityLoader />;
  }

  const openDetail = (item) => {
    navigation.navigate("Detail", { item });
  };

  const renderDatePicker = () => {
    return (
      <View>
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            // Ensure selectedDate is a valid Date object
            let currentDate = new Date(
              selectedDate || event.nativeEvent.timestamp
            );

            // Filter data based on the selected date
            const filtered = data.filter((item) => {
              const itemDate = new Date(item.created_at);
              return (
                itemDate.getDate() === currentDate.getDate() &&
                itemDate.getMonth() === currentDate.getMonth() &&
                itemDate.getFullYear() === currentDate.getFullYear()
              );
            });

            // Update the filtered data using the functional form of setState
            setFilteredData((prevFilteredData) => filtered);
          }}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View
        style={{
          flexDirection: "row",
          width: "250",
        }}
      >
        <FontAwesome
          name="search"
          size={24}
          color={currentTheme.dark}
          style={{ position: "absolute", zIndex: 1, left: 20, top: 10 }}
        />
        <TextInput
          style={[
            styles.searchBar,
            {
              color: currentTheme.dark,
              backgroundColor: currentTheme.light,
            },
          ]}
          placeholder="Search"
          value={search || ""}
          onChangeText={(text) => setSearch(text)}
          placeholderTextColor={currentTheme.dark}
        />
      </View>
      <ScrollView
        style={styles.filterContainer}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {filteredEmotions.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.emotionCard,
              {
                backgroundColor:
                  item.emotion_id === filter ? "yellow" : currentTheme.dark,
              },
            ]}
            onPress={() => {
              if (item.emotion_id === filter) {
                setFilter(null);
              } else {
                setFilter(item.emotion_id);
              }
            }}
          >
            <Text style={styles.emotion}>{item.emotion_id}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityLoader />
      ) : (
        <ScrollView contentContainerStyle={[styles.albumWall, { gap: 11 }]}>
          {filteredData &&
            filteredData.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  openDetail(item);
                }}
              >
                <AlbumArt trackId={item.song_id} day={item.day} />
              </TouchableOpacity>
            ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = {
  searchBar: {
    height: 40,
    paddingLeft: 55,
    borderRadius: 10,
    padding: 10,
    margin: 5,
    backgroundColor: "#F4EEE2",
    marginBottom: 10,
    width: "100%",
  },
  filterContainer: {
    flexDirection: "row",
    paddingBottom: 6,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "black",
  },

  h1: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#966919",
  },
  h2: {
    fontSize: 20,
    color: "#966919",
    fontWeight: "thin",
  },

  emotionCard: {
    padding: 5,
    borderRadius: 15,
    height: 35,
    width: 35,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
  },
  emotion: {
    fontSize: 15,
  },
  albumWall: {
    marginTop: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    minHeight: "100%",
  },
};

export default EmotionList;
