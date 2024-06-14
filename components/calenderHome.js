import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { Calendar } from "react-native-calendars";

import { supabase } from "../lib/supabase";

import ActivityLoader from "./activityLoader";

import { FontAwesome5 } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";

import { colorThemes } from "../constants/global";

const Calander = (props) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // getMonth() is zero-based, so we add 1
  const nameOfMonths = today.toLocaleString("default", { month: "long" });
  const [nameOfMonth, setNameOfMonth] = useState(nameOfMonths);
  const day = String(today.getDate()).padStart(2, "0");
  const [colorTheme, setColorTheme] = useState("brown");

  //
  const currentTheme = colorThemes[colorTheme];

  const todaysDate = today.toISOString().split("T")[0];

  const formattedDate = `${year}-${month}-${day}`;

  const [loading, setLoading] = useState(false);

  const [dayView, setDayView] = useState(null);

  const [selectedDay, setSelectedDay] = useState(formattedDate);
  const [firstTime, setFirstTime] = useState(false);

  //
  const navigation = useNavigation();

  // FOR CALENDER
  const [calenderData, setCalenderData] = useState([]);

  // noti message
  const [notiMessage, setNotiMessage] = useState("");

  useEffect(() => {
    if (notiMessage) {
      setTimeout(() => {
        setNotiMessage("");
      }, 5000);
    }
  }, [notiMessage]);

  // GET ALL PREVIOUS DATE FROM DB

  async function fetchData() {
    const user = await supabase.auth.getSession();

    let { data: journalData } = await supabase
      .from("journalData")
      .select("*")
      .eq("user_id", user.data.session.user.id);

    if (journalData.length === 0) {
      journalData = [];
      setFirstTime(true);
    }

    setCalenderData(journalData);
  }

  const fetchTheme = async () => {
    const theme = await SecureStore.getItemAsync("colorTheme");
    if (theme) {
      setColorTheme(theme);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
      fetchTheme();
      return () => {
        null;
      };
    }, [])
  );

  const markedDates = {
    ...calenderData.reduce((acc, e) => {
      acc[e.day] = {
        marked: true,
        dotColor: currentTheme.dark,
      };
      return acc;
    }, {}),
    [selectedDay]: { selected: true, selectedColor: currentTheme.dark },
  };

  return (
    <>
      <ActivityLoader visible={loading} />

      <View style={[styles.calender, { borderColor: currentTheme.mid }]}>
        <Calendar
          theme={{
            backgroundColor: "#F4EEE2",
            calendarBackground: "#ffffff",
            todayTextColor: "#654321",
            todayFontWeigth: "bold",
            dayTextColor: "#222222",
            textDisabledColor: "#d9e1e8",
            monthTextColor: "#654321",
            textDayFontWeight: "300",
            textMonthFontWeight: "bold",
            textDayHeaderFontWeight: "500",
            textDayFontSize: 12,
            textMonthFontSize: 12,
            selectedDayBackgroundColor: "#654321",
            selectedDayTextColor: "white",
            textDayHeaderFontSize: 12,
            textDayHeaderFontWeight: "bold",
          }}
          firstDay={1}
          monthFormat={"MMMM yyyy"}
          hideArrows
          enableSwipeMonths={false}
          markedDates={markedDates}
          maxDate={todaysDate}
          scrollEnabled={true}
          horizontal={true}
          headerStyle={{
            height: 0,
            opacity: 0,
          }}
          onDayPress={(day) => {
            navigation.navigate("Calender");
          }}
          disableAllTouchEventsForDisabledDays={true}
        />
      </View>
    </>
  );
};

const styles = {
  calender: {
    flex: 1,
    width: "auto",
    overflow: "hidden",
    borderRadius: 20,
    height: 500,
    borderWidth: 5,
    borderColor: "#F4EEE2",
    backgroundColor: "white",
  },
};

export default Calander;
