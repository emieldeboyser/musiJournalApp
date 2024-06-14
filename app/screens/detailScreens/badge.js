import React from "react";
import { View, Image, Text, StyleSheet } from "react-native";
import { imageMaps, formatDate } from "../../../constants/global";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import { colorThemes } from "../../../constants/global";

const DetailBadge = (badge) => {
  const data = badge.route.params;
  const [colorTheme, setColorTheme] = React.useState("brown");
  const currentTheme = colorThemes[colorTheme];

  const navigation = useNavigation();

  useFocusEffect(
    React.useCallback(() => {
      fetchTheme();
    }, [])
  );

  const fetchTheme = async () => {
    const theme = await SecureStore.getItemAsync("colorTheme");
    if (theme) {
      setColorTheme(theme);
      navigation.setOptions({
        headerTintColor: colorThemes[theme].dark,
      });
    }
  };
  return (
    <View style={styles.container}>
      <View
        style={[styles.imageContainer, { backgroundColor: currentTheme.dark }]}
      >
        <Image source={imageMaps[data.medal_id.id]} style={styles.image} />
      </View>
      <View>
        <Text style={[styles.h1, { color: currentTheme.dark }]}>
          {data.medal_id.title}
        </Text>
        <Text style={styles.description}>{data.medal_id.description}</Text>
      </View>
      <Text style={[styles.thin, { color: currentTheme.dark }]}>
        {formatDate(data.created_at)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    // justifyContent: "space-around",
    backgroundColor: "white",
  },
  imageContainer: {
    marginVertical: 20,
    width: 360,
    height: 360,
    backgroundColor: "#966919",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: 350,
    height: 350,
  },
  h1: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#966919",
    marginVertical: 16,
    marginHorizontal: 20,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
  },
  thin: {
    fontSize: 12,
    color: "#966919",
    marginVertical: 16,
    textAlign: "center",
  },
});

export default DetailBadge;
