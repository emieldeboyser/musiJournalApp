import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useNavigation, useRoute } from "@react-navigation/native";
import { AntDesign, Ionicons } from "@expo/vector-icons";

const Header = () => {
  const [image, setImage] = useState(null);
  const navigation = useNavigation();
  const [user, setUser] = useState(null);

  const profile = async () => {
    navigation.navigate("Profile");
  };

  useEffect(() => {
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
    fetchUser();
  }, []);

  return (
    <>
      <View style={styles.headerContainer}>
        <Text
          style={styles.title}
          onPress={() => navigation.navigate("Collection")}
        >
          Journal <AntDesign name="caretdown" size={10} color="#654321" />
        </Text>
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
