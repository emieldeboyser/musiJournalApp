import React, { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Linking,
  Alert,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import ActivityLoader from "./activityLoader";
import { supabase } from "../lib/supabase";
import AlbumArt from "./albumArt";
import { Fontisto } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  addSong,
  getAccessToken,
  makePlaylist,
  refreshAccessToken,
} from "../constants/global";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import { colorThemes } from "./../constants/global";

const ExportCollection = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState(null);
  const [filteredData, setFilteredData] = useState(null);
  const [filteredEmotions, setFilteredEmotions] = useState([]);
  const uniqueEmotions = new Set();
  const [exports, setExports] = useState([]);
  const [uri, setURIS] = useState([]);

  const [search, setSearch] = useState(null);

  const navigator = useNavigation();

  const [colorTheme, setColorTheme] = useState("brown");
  const currentTheme = colorThemes[colorTheme];

  // Fetch data from the database
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      let user;
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

    const handleUrlEvent = async (event) => {
      if (event.url.includes("error=access_denied")) {
        setError("Access denied");
        return;
      }

      const makeItwork = await makeItWork(event.url);
    };

    const urlListener = Linking.addEventListener("url", handleUrlEvent);

    fetchData();
    setLoading(false);
    return () => {
      urlListener.remove();
    };
  }, []);

  // Filter out duplicate emotions
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

  // Apply filter to data
  useEffect(() => {
    if (filter === null || data === null) {
      setFilteredData(data); // Show all items if filter is null or data is not yet loaded
    } else {
      const filtered = data.filter((item) => item.emotion_id === filter);
      setFilteredData(filtered); // Apply filter otherwise
    }
  }, [filter, data]);

  // Apply search to data
  useEffect(() => {
    if (data && search !== null) {
      const searchLower = search.toLowerCase();
      const filtered = data.filter((item) => {
        return item.motivation.toLowerCase().includes(searchLower);
      });
      setFilteredData(filtered);
    } else {
      setFilteredData(data); // Show all data if search is empty or null
    }
  }, [search, data]);

  const authenticateSpotify = async () => {
    const result = await makeItWork();
    if (result !== "No tracks selected!!") {
      navigator.navigate("Home");
      setData(null);
      setExports([]);
      setFilter(null);
      setFilteredData(null);
      setFilteredEmotions([]);
      setSearch(null);
      Linking.openURL(result);
    }
  };

  const makeItWork = async () => {
    if (Array.isArray(exports) && exports.length === 0) {
      console.log("No tracks selected!!");
      return "No tracks selected!!";
    }
    const token = await SecureStore.getItemAsync("refresh_token");
    if (token) {
      const accesToken = await refreshAccessToken();
      const playListID = await makePlaylist(accesToken);
      const addTracks = await addSong(
        accesToken,
        playListID.playlistId,
        exports,
        playListID.playlistUrl
      );
      return addTracks;
    } else {
      Alert.alert("Please link your spotify account in settings");
      navigator.navigate("Profile");
      return;
    }
  };

  const handleUrlEvent = async (event) => {
    if (event.url.includes("error=access_denied")) {
      setError("Access denied");
      return;
    }

    // Capture the current value of exports
    const currentExports = exports;
    const makeItworkResult = await makeItWork(event.url, currentExports);
    if (makeItworkResult !== "No tracks selected!!") {
      navigator.navigate("Home");
      setData(null);
      setExports([]);
      setFilter(null);
      setFilteredData(null);
      setFilteredEmotions([]);
      setSearch(null);
      Linking.openURL(makeItworkResult);
    }
  };

  useEffect(() => {
    const urlListener = Linking.addEventListener("url", handleUrlEvent);
    return () => {
      urlListener.remove();
    };
  }, [exports]); // Ensure the effect re-runs when exports change

  const handleAdd = (text, index) => {
    setExports((prevExports) => {
      let newChecked;
      if (prevExports.includes(text)) {
        newChecked = prevExports.filter((item) => item !== text);
      } else {
        newChecked = [...prevExports, text];
      }

      // Filter out any undefined values
      newChecked = newChecked.filter((item) => item !== undefined);

      return newChecked;
    });
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
      return () => {
        null;
      };
    }, [])
  );

  if (loading) {
    return <ActivityLoader />;
  }

  return (
    <View style={styles.container}>
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
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 20,
          }}
        >
          {exports.length > 0 ? (
            <TouchableOpacity
              onPress={authenticateSpotify}
              style={{
                backgroundColor: currentTheme.dark,
                padding: 10,
                borderRadius: 10,
                margin: 5,
                width: 150,
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: "white",
                  textAlign: "center",
                  fontSize: 20,
                  fontWeight: "bold",
                }}
              >
                Export
              </Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            onPress={() => setExports([])}
            style={{
              backgroundColor: currentTheme.light,
              padding: 10,
              borderRadius: 10,
              margin: 5,
            }}
          >
            <Text
              style={{
                color: currentTheme.dark,
                textAlign: "center",
                fontSize: 20,
                fontWeight: "bold",
              }}
            >
              Clear selection
            </Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityLoader />
        ) : (
          <ScrollView contentContainerStyle={styles.albumWall}>
            {filteredData &&
              filteredData.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    openDetail(item);
                  }}
                >
                  <TouchableOpacity
                    onPress={() => handleAdd(item.song_id, index)}
                  >
                    <View
                      style={{
                        backgroundColor: currentTheme.mid,
                        position: "absolute",
                        zIndex: 1,
                        right: 5,
                        top: 5,
                      }}
                    >
                      {exports.includes(item.song_id) ? (
                        <MaterialCommunityIcons
                          name="checkbox-marked"
                          size={24}
                          color={currentTheme.dark}
                        />
                      ) : (
                        <MaterialCommunityIcons
                          name="checkbox-blank"
                          size={24}
                          color={currentTheme.dark}
                        />
                      )}
                    </View>
                    <AlbumArt trackId={item.song_id} day={item.day} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = {
  searchBar: {
    height: 40,
    borderRadius: 10,
    padding: 10,
    margin: 5,
    backgroundColor: "#F4EEE2",
    marginBottom: 10,
    width: "100%",
    paddingLeft: 55,
    color: "#966919",
  },
  filterContainer: {
    flexDirection: "row",
    paddingBottom: 6,
  },
  container: {
    flex: 1,
    padding: 10,
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
    height: 40,
    width: 35,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
    marginBottom: 10,
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
    gap: 11,
  },
};

export default ExportCollection;
