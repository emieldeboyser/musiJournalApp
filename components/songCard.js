import React from "react";
import { View, Text, Image, TouchableOpacity, Linking } from "react-native";
import * as SecureStore from "expo-secure-store";
import { useFocusEffect } from "@react-navigation/native";
import { colorThemes } from "./../constants/global";

const SongCard = ({ object }) => {
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
  if (!object) {
    return null;
  }

  let albumImage = object.album.images[0].url;
  if (albumImage === undefined) {
    albumImage = null;
  }

  useFocusEffect(
    React.useCallback(() => {
      fetchTheme();
      return () => {
        null;
      };
    }, [])
  );

  return (
    <View
      style={[
        styles.addedTodayContainer,
        { backgroundColor: currentTheme.mid },
      ]}
    >
      {albumImage && (
        <Image style={styles.image} source={{ uri: albumImage }} />
      )}

      <View>
        <Text style={[styles.trackName, { color: currentTheme.dark }]}>
          {object.name}
        </Text>
        <Text style={{ color: currentTheme.dark }}>
          {object.artists[0].name}
        </Text>
      </View>
    </View>
  );
};

const SongCardTwo = ({ object }) => {
  const [colorTheme, setColorTheme] = React.useState("brown");
  const currentTheme = colorThemes[colorTheme];

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
  if (!object) {
    return null;
  }

  let albumImage = object.album.images[0].url;
  if (albumImage === undefined) {
    albumImage = null;
  }

  return (
    <View
      style={[
        songCard.addedTodayContainer,
        { backgroundColor: currentTheme.mid },
      ]}
    >
      <Image
        style={songCard.image}
        source={{ uri: object.album.images[0]?.url || "" }}
      />

      <View style={songCard.despo}>
        <Text style={[songCard.trackName, { color: currentTheme.dark }]}>
          {object.name}
        </Text>
        <Text style={[songCard.artist, { color: currentTheme.dark }]}>
          {object.artists[0].name}
        </Text>
      </View>
    </View>
  );
};

const SongTile = ({ object }) => {
  if (!object) {
    return null;
  }

  let albumImage = object.album.images[0].url;
  if (albumImage === undefined) {
    albumImage = null;
  }

  return (
    <View style={[songCard.addedTodayContainer, { height: 190, width: 190 }]}>
      <Image
        style={songTile.image}
        source={{ uri: object.album.images[0]?.url || "" }} // Use optional chaining to prevent errors
      />
    </View>
  );
};

const SongTileMap = ({ object }) => {
  const [colorTheme, setColorTheme] = React.useState("brown");
  const currentTheme = colorThemes[colorTheme];

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
  if (!object) {
    return null;
  }

  let albumImage = object.album.images[0].url;
  if (albumImage === undefined) {
    albumImage = null;
  }

  return (
    <View
      style={[
        songCard.addedTodayContainer,
        { backgroundColor: currentTheme.mid },
      ]}
    >
      <Image
        style={map.image}
        source={{ uri: object.album.images[0]?.url || "" }} // Use optional chaining to prevent errors
      />
    </View>
  );
};

const styles = {
  addedTodayContainer: {
    alignItems: "center",
    display: "flex",
    flexDirection: "row",
    margin: 10,
    gap: 10,
    backgroundColor: "#F4EEE2",
    borderRadius: 5,
  },
  image: {
    width: 100,
    height: 100,
  },
  trackName: {
    fontWeight: "bold",
    width: 200,
    overflow: "hidden",
  },
};

const songCard = {
  addedTodayContainer: {
    alignItems: "center",
    display: "flex",
    flexDirection: "row",
    backgroundColor: "#F4EEE2",
    borderRadius: 20,
    overflow: "hidden",
  },
  image: {
    width: 170,
    height: 170,
  },
  trackName: {
    fontWeight: "bold",
    fontSize: 20,
    textAlign: "center",
    color: "#654321",
  },
  artist: {
    textAlign: "center",
    color: "#654321",
  },
  despo: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    width: 186,
    height: 170,
  },
};

const songTile = {
  image: {
    width: 190,
    height: 190,
    borderRadius: 20,
  },
};

const map = {
  image: {
    width: 50,
    height: 50,
    borderRadius: 20,
  },
};

export { SongCard, SongCardTwo, SongTile, SongTileMap };
