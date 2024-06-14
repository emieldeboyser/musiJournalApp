import React from "react";
import { View, StyleSheet, SafeAreaView } from "react-native";
import Header from "../../components/headerTwo";

import {
  TileStreak,
  TileCalender,
  TileMap,
  TileAlbumWall,
  TileMedal,
} from "./../../components/tiles";

const HomeScreen = () => {
  return (
    <>
      <View style={{ paddingBottom: 25, backgroundColor: "white" }}>
        <Header name={"Home"} />
      </View>
      <SafeAreaView
        style={styles.container}
        stickyHeaderIndices={[1]} // Index of the header component (0-based)
      >
        <View
          style={styles.container}
          stickyHeaderIndices={[1]} // Index of the header component (0-based)
        >
          <View style={styles.content}>
            <View style={styles.tileContainer}>
              <TileCalender />
            </View>
            <View style={styles.rowContainer}>
              <TileMap />
              <TileStreak />
            </View>
            <View
              style={{
                justifyContent: "center",
                alignItems: "center",
                gap: 15,
                width: "95%",
              }}
            >
              <TileAlbumWall />
              <TileMedal />
            </View>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  container: {
    gap: 10,
    flex: 1,
    backgroundColor: "white",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 15,
  },
  tileContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
    borderRadius: 20,
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginHorizontal: 10,
    gap: 10,
  },
});

export default HomeScreen;
