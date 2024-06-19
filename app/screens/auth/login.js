import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  Alert,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../../lib/supabase";
import * as SecureStore from "expo-secure-store";
import { colorThemes } from "../../../constants/global";

export default function LoginScreen() {
  const [email, setEmail] = useState("expo@gmail.com");
  const [password, setPassword] = useState("abc123");
  const [hidePassword, setHidePassword] = useState(true);
  const [colorTheme, setColorTheme] = useState("brown");

  const navigation = useNavigation();

  async function login() {
    if (!email || !password) {
      Alert.alert("Missing fields", "Please fill in all fields");
      return;
    }

    if (
      !email.includes("@") ||
      !email.includes(".") ||
      email.length < 5 ||
      email.length > 50
    ) {
      Alert.alert("Invalid email", "Please enter a valid email address");
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      navigation.navigate("Home");
    } catch (error) {
      console.error("Login error:", error.message);
      Alert.alert("Login error", error.message);
    }
  }

  const togglePasswordVisibility = () => {
    setHidePassword(!hidePassword);
  };

  useEffect(() => {
    const getColorTheme = async () => {
      const res = await SecureStore.getItemAsync("colorTheme");
      if (res) {
        setColorTheme(res);
      }
    };

    getColorTheme();
  }, []);

  const currentTheme = colorThemes[colorTheme];

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.mid }]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.infoPart}>
          <Text style={[styles.h1, { color: currentTheme.dark }]}>
            MusiJournal
          </Text>
          <Image
            source={require("../../../assets/logo.png")}
            style={{ width: 200, height: 200 }}
          />
          <Text style={[styles.h2, { color: currentTheme.dark }]}>
            Your getaway
          </Text>
        </View>
      </TouchableWithoutFeedback>
      <KeyboardAvoidingView
        style={styles.inputArea}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[styles.inputContainer, { backgroundColor: "white" }]}>
          <Ionicons
            name="mail"
            size={20}
            color={currentTheme.dark}
            style={styles.icon}
          />
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[styles.input, { color: currentTheme.dark }]}
            textContentType="oneTimeCode"
            placeholderTextColor={currentTheme.dark}
          />
        </View>
        <View style={[styles.inputContainer, { backgroundColor: "white" }]}>
          <Ionicons
            name="lock-closed"
            size={20}
            color={currentTheme.dark}
            style={styles.icon}
          />
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={hidePassword}
            style={[styles.input, { color: currentTheme.dark }]}
            placeholderTextColor={currentTheme.dark}
          />
          <TouchableOpacity onPress={togglePasswordVisibility}>
            <Ionicons
              name={hidePassword ? "eye-off" : "eye"}
              size={20}
              color={currentTheme.dark}
              style={styles.icon}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.buttonContainer,
            { backgroundColor: currentTheme.dark },
          ]}
          onPress={login}
        >
          <Text style={styles.buttonContext}>Login</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>

      <Text style={[styles.signUp, { color: currentTheme.dark }]}>
        Don't have an account?{" "}
        <Text
          style={{ color: currentTheme.dark, fontWeight: "bold" }}
          onPress={() => navigation.navigate("Register")}
        >
          Sign up
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  inputArea: {
    marginBottom: 20,
  },
  infoPart: {
    alignItems: "center",
    height: 350,
  },
  h1: {
    fontSize: 42,
    fontWeight: "bold",
  },
  h2: {
    fontSize: 25,
    fontWeight: "thin",
  },
  buttonContainer: {
    alignItems: "center",
    width: "100%",
    padding: 15,
    borderRadius: 20,
    marginBottom: 20,
  },
  buttonContext: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    height: 40,
    borderColor: "transparent",
    paddingHorizontal: 25,
    borderRadius: 20,
    height: 53,
  },
  input: {
    flex: 1,
    paddingLeft: 10,
  },
  icon: {
    marginRight: 10,
  },
  signUp: {
    textAlign: "center",
  },
});
