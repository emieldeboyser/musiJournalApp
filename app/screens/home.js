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
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.tileContainer}>
            <TileCalender />
          </View>
          <View style={styles.rowContainer}>
            <TileMap />
            <TileStreak />
          </View>
          <View style={styles.centeredTiles}>
            <TileAlbumWall />
            <TileMedal />
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
  centeredTiles: {
    justifyContent: "center",
    alignItems: "center",
    gap: 15,
    width: "95%",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayButton: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
  },
  overlayText: {
    color: "black",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default HomeScreen;
