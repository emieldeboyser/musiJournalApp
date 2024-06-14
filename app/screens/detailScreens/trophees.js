import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import { imageMaps } from "../../../constants/global";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";

import { colorThemes } from "../../../constants/global";

const TropheesScreen = (object) => {
  const [colorTheme, setColorTheme] = React.useState("brown");
  const currentTheme = colorThemes[colorTheme];

  if (!object) {
    return null;
  }
  const navigation = useNavigation();
  // first order the data by created_at
  const data = object.route.params.badges;
  data.sort((b, a) => new Date(a.created_at) - new Date(b.created_at));

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
      <Text style={[styles.h1, { color: currentTheme.dark }]}>
        All your trophees
      </Text>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 25,
        }}
      >
        {data ? (
          data.map((trophee, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.tropheeContainer,
                { backgroundColor: currentTheme.mid },
              ]}
              onPress={() => navigation.navigate("Badge Detail", trophee)}
            >
              <Image
                source={imageMaps[trophee.medal_id.id]}
                style={{ width: 130, height: 130 }}
              />
              <Text style={[styles.tropheeText, { color: currentTheme.dark }]}>
                {trophee.medal_id.title}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text>No trophees yet</Text>
        )}
      </ScrollView>
    </View>
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
  tropheeContainer: {
    alignItems: "center",
    marginHorizontal: 10,
    backgroundColor: "#F4EEE2",
    padding: 10,
    borderRadius: 25,
    width: 172,
  },
  tropheeText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#966919",
  },
});

export default TropheesScreen;
