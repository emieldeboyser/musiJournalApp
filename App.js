import { NavigationContainer, useFocusEffect } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Alert, StyleSheet, View, AppState } from "react-native";

import React, { useEffect, useState } from "react";

import LoginScreen from "./app/screens/auth/login";
import RegisterScreen from "./app/screens/auth/register";
import HomeScreen from "./app/screens/home";
import { supabase } from "./lib/supabase";
import ProfileScreen from "./app/screens/profile";
import { Session } from "@supabase/supabase-js";
import CollectionScreen from "./app/screens/collection";
import MemorieDetail from "./app/screens/detailScreens/memorieDetail";
import CalenderScreen from "./app/screens/calender";
import Map from "./app/screens/map";
import Edit from "./app/screens/detailScreens/edit";
import Badge from "./app/screens/badge";
import DetailBadge from "./app/screens/detailScreens/badge";
import TropheesScreen from "./app/screens/detailScreens/trophees";

const Stack = createNativeStackNavigator();

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const { authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      if (authListener) {
        authListener?.subscription.unsubscribe();
      }
    };
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen
              name="Calender"
              component={CalenderScreen}
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen
              name="Collection"
              component={CollectionScreen}
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{
                headerStyle: {
                  backgroundColor: "white",
                  shadowColor: "transparent",
                  marginTop: 10,
                },
                headerTitleStyle: {
                  fontSize: 30,
                  fontWeight: "bold",
                },

                headerBackTitle: "Back",
                headerTintColor: "#654321",
                headerBackTitleStyle: {
                  fontSize: 12,
                  fontWeight: "bold",
                },
                headerShadowVisible: false, // applied here
                headerBackTitleVisible: false,
              }}
            />

            <Stack.Screen
              name="Map"
              component={Map}
              options={{ headerShown: false, gestureEnabled: true }}
            />

            <Stack.Screen
              name="Detail"
              component={MemorieDetail}
              options={{
                headerStyle: {
                  backgroundColor: "white",
                  shadowColor: "transparent",
                  marginTop: 10,
                },
                headerTitleStyle: {
                  fontSize: 30,
                  fontWeight: "bold",
                },

                headerBackTitle: "Back",
                headerTintColor: "#654321",
                headerBackTitleStyle: {
                  fontSize: 12,
                  fontWeight: "bold",
                },
                headerShadowVisible: false, // applied here
                headerBackTitleVisible: false,
              }}
            />

            <Stack.Screen
              name="Edit"
              component={Edit}
              options={{
                headerStyle: {
                  backgroundColor: "white",
                  shadowColor: "transparent",
                  marginTop: 10,
                },
                headerTitleStyle: {
                  fontSize: 30,
                  fontWeight: "bold",
                },

                headerBackTitle: "Back",
                headerTintColor: "#654321",
                headerBackTitleStyle: {
                  fontSize: 12,
                  fontWeight: "bold",
                },
                headerShadowVisible: false, // applied here
                headerBackTitleVisible: false,
              }}
            />
            <Stack.Screen
              name="Badge"
              component={Badge}
              options={{ headerShown: false, gestureEnabled: true }}
            />
            <Stack.Screen
              name="Badge Detail"
              component={DetailBadge}
              options={{
                headerStyle: {
                  backgroundColor: "white",
                  shadowColor: "transparent",
                  marginTop: 10,
                },
                headerTitleStyle: {
                  fontSize: 30,
                  fontWeight: "bold",
                },

                headerBackTitle: "Back",
                headerTintColor: "#654321",
                headerBackTitleStyle: {
                  fontSize: 12,
                  fontWeight: "bold",
                },
                headerShadowVisible: false, // applied here
                headerBackTitleVisible: false,
              }}
            />
            <Stack.Screen
              name="Trophees"
              component={TropheesScreen}
              options={{
                headerStyle: {
                  backgroundColor: "white",
                  shadowColor: "transparent",
                  marginTop: 10,
                },
                headerTitleStyle: {
                  fontSize: 30,
                  fontWeight: "bold",
                },

                headerBackTitle: "Back",
                headerTintColor: "#654321",
                headerBackTitleStyle: {
                  fontSize: 12,
                  fontWeight: "bold",
                },
                headerShadowVisible: false, // applied here
                headerBackTitleVisible: false,
              }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ headerShown: false, gestureEnabled: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
