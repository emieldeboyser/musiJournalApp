import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Header from "./../../components/headerTwo";
import EmotionList from "../../components/emotionList";
import Map from "../../components/map";

import { useFocusEffect, useNavigation } from "@react-navigation/native";
import ExportCollection from "../../components/exportCollection";
import { FontAwesome } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";

import { colorThemes } from "./../../constants/global";

const CollectionScreen = () => {
  const [collection, setCollection] = useState(true);
  const [exports, setExports] = useState(false);
  const navigation = useNavigation();
  const [colorTheme, setColorTheme] = useState("brown");

  const currentTheme = colorThemes[colorTheme];

  const fetchTheme = async () => {
    console.log("fetching theme");
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

  return (
    <View style={styles.container}>
      <Header name={"Collection"} link={"Home"} />
      {exports ? (
        <ExportCollection />
      ) : collection ? (
        <EmotionList user="User" />
      ) : null}
      {!exports && (
        <TouchableOpacity
          style={{
            position: "absolute",
            bottom: 20,
            right: 20,
            zIndex: 1,
            backgroundColor: currentTheme.dark,
            borderRadius: 50,
            padding: 15,
          }}
          onPress={() => setExports(true)}
        >
          <FontAwesome name="music" size={30} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    textAlign: "center",
  },
  h1: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#966919",
    marginVertical: 16,
    marginHorizontal: 20,
  },
  navBar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  navBarItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    padding: 10,
    margin: 2,
    borderRadius: 10,
  },
  navBarLink: {
    fontSize: 20,
    color: "#966919",
  },
  checked: {
    color: "#654321",
    fontWeight: "bold",
  },
});

export default CollectionScreen;
