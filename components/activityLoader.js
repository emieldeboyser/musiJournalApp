import React from "react";
import { View, ActivityIndicator, StyleSheet, Modal } from "react-native";

const ActivityLoader = ({ visible }) => {
  return (
    <Modal
      transparent={true}
      animationType={"none"}
      visible={visible}
      onRequestClose={() => {}}
    >
      <View style={styles.modalBackground}>
        <View style={styles.activityIndicatorWrapper}>
          <ActivityIndicator animating={visible} size="large" color="#ffffff" />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)", // 80% opacity
  },
  activityIndicatorWrapper: {
    backgroundColor: "#00000000",
    height: 100,
    width: 100,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default ActivityLoader;
