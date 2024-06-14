import React, { useState } from "react";
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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons"; // Assuming you're using Ionicons for icons
import { supabase } from "../../../lib/supabase";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hidePassword, setHidePassword] = useState(true);

  const navigation = useNavigation();

  async function register() {
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
      const { user, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      const NUser = await supabase.auth.getUser();

      const now = new Date();
      now.setHours(now.getHours() + 2);

      const { addedUser, errorr } = await supabase.from("users").insert([
        {
          id: NUser.data.user.id,
          email: NUser.data.user.email,
          created_at: now,
        },
      ]);

      if (errorr) {
        throw errorr;
      }
    } catch (error) {
      console.error("Registration error:", error.message);
      Alert.alert("Registration error", error.message);
    }
  }

  const togglePasswordVisibility = () => {
    setHidePassword(!hidePassword);
  };

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.infoPart}>
          <Text style={styles.h1}>MusiJournal</Text>
          <Image
            source={require("../../../assets/logo.png")}
            style={{ width: 200, height: 200 }}
          />
          <Text style={styles.h2}>Your getaway</Text>
        </View>
      </TouchableWithoutFeedback>
      <KeyboardAvoidingView
        style={styles.inputArea}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.inputContainer}>
          <Ionicons name="mail" size={20} color="#888" style={styles.icon} />
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            textContentType="oneTimeCode"
          />
        </View>
        <View style={styles.inputContainer}>
          <Ionicons
            name="lock-closed"
            size={20}
            color="#888"
            style={styles.icon}
          />
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={hidePassword}
            style={styles.input}
          />
          <TouchableOpacity onPress={togglePasswordVisibility}>
            <Ionicons
              name={hidePassword ? "eye-off" : "eye"}
              size={20}
              color="#888"
              style={styles.icon}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.buttonContainer} onPress={register}>
          <Text style={styles.buttonContext}>Register</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>

      <Text style={styles.signUp}>
        Already have an account?{" "}
        <Text
          style={{ color: "#966919", fontWeight: "bold" }}
          onPress={() => navigation.navigate("Login")}
        >
          Log in
        </Text>
      </Text>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#D3C4AA",
  },
  input: {
    height: 40,
    paddingHorizontal: 25,
    height: 53,
    backgroundColor: "#F7F7F7",
    color: "#966919",
  },
  inputArea: {
    marginTop: 20,
  },
  infoPart: {
    alignItems: "center",
    height: 350,
  },
  h1: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#966919",
  },
  h2: {
    fontSize: 25,
    color: "#966919",
    fontWeight: "thin",
  },
  buttonContainer: {
    alignItems: "center",
    backgroundColor: "#966919",
    paddingVertical: 15,
    paddingHorizontal: 40,
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
    marginBottom: 12,
    paddingHorizontal: 25,
    borderRadius: 20,
    height: 53,
    backgroundColor: "#F7F7F7",
    color: "#966919",
  },
  input: {
    flex: 1,
    paddingLeft: 10,
  },
  icon: {
    marginRight: 10,
    color: "#966919",
  },
  signUp: {
    textAlign: "center",
    color: "#966919",
  },
};
