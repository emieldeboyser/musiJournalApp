import React from "react";
import { View, StyleSheet } from "react-native";
import MapView from "react-native-maps";
import Maps from "../../components/map";
import Header from "../../components/headerTwo";
import { globalStyles } from "../../constants/global";

const Map = () => {
  return (
    <View style={globalStyles.container}>
      <Header name={"Map"} link={"Home"} />
      <Maps />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

export default Map;
