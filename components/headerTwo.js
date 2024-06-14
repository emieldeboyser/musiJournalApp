import React, { createRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { supabase } from "../lib/supabase";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { AntDesign, Ionicons } from "@expo/vector-icons";

import { colorThemes } from "./../constants/global";

const Header = ({ name, link }) => {
  const [loading, setLoading] = useState(true);
  const [image, setImage] = useState(null);
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [colorTheme, setColorTheme] = useState("brown");
  const currentTheme = colorThemes[colorTheme];

  const profile = async () => {
    navigation.navigate("Profile");
  };

  const fetchUser = async () => {
    const userData = await supabase.auth.getSession();
    setUser(userData.data.session.user);

    // Fetch the profile picture
    const { data, error } = await supabase.storage
      .from("profilePicture")
      .download(`${userData.data.session.user.id}/profilePicture`);

    if (error) {
      setImage(null);
    }

    if (data) {
      setImage(URL.createObjectURL(data));
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
      fetchUser();
      fetchTheme();
      return () => {
        null;
      };
    }, [])
  );

  return (
    <>
      <View style={styles.headerContainer}>
        {link ? (
          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name="chevron-back-sharp"
              size={35}
              style={{ color: currentTheme.dark }}
            />
            <Text style={[styles.title, { color: currentTheme.dark }]}>
              {name ?? "Collection"}{" "}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={[styles.title, { color: currentTheme.dark }]}>Home</Text>
        )}

        <TouchableOpacity onPress={() => profile()}>
          {image ? (
            <Image source={{ uri: image }} style={styles.logo} />
          ) : (
            <Image
              source={require("../assets/profilePic.jpeg")}
              style={styles.logo}
            />
          )}
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    backgroundColor: "white",
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#654321",
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 50,
    zIndex: 100,
  },
});

export default Header;
