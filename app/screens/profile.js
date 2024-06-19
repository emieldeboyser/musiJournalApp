import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  Image,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
  Linking,
} from "react-native";
import { supabase } from "../../lib/supabase";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";
import ActivityLoader from "../../components/activityLoader";
import { Ionicons, Entypo } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { formatBday, getAccessToken } from "../../constants/global";
import * as SecureStore from "expo-secure-store";
import { colorThemes } from "../../constants/global";

const ProfileScreen = () => {
  const [image, setImage] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [accountAge, setAccountAge] = useState(0);
  const [newBirthday, setNewBirthday] = useState("");
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date());
  const [authenticated, setAuthenticated] = useState(false);
  const [colorTheme, setColorTheme] = useState("brown");
  const currentTheme = colorThemes[colorTheme];

  const navigation = useNavigation();

  const logout = async () => {
    await supabase.auth.signOut();
    await SecureStore.deleteItemAsync("refresh_token");
    await SecureStore.deleteItemAsync("colorTheme");
  };

  const fetchUser = async () => {
    try {
      setLoading(true);
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      const userId = sessionData?.session?.user?.id;
      if (!userId) throw new Error("User ID not found");

      const { data: extraData, error: userError } = await supabase
        .from("users")
        .select()
        .eq("id", userId);

      if (userError) throw userError;

      const user = sessionData.session.user;
      const userExtraData = extraData[0];
      setUser({ ...user, ...userExtraData });

      const accountCreationDate = new Date(user.created_at);
      const currentDate = new Date();
      const diffTime = Math.abs(currentDate - accountCreationDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setAccountAge(diffDays);

      const { data: imageData, error: imageError } = await supabase.storage
        .from("profilePicture")
        .download(`${userId}/profilePicture`);

      if (imageError) {
        console.log("error fetching image", imageError);
        setImage(null);
      } else if (imageData) {
        setImage(URL.createObjectURL(imageData));
      }
    } catch (error) {
      console.error("Error fetching user data:", error.message);
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();

    getTheme();
    const fetchSpotifyToken = async () => {
      const token = await SecureStore.getItemAsync("refresh_token");

      if (token) {
        setAuthenticated(true);
      }
    };
    fetchSpotifyToken();

    // set logout button in header
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={logout}>
          <Text style={{ color: "#654321", marginRight: 10 }}>Logout</Text>
        </TouchableOpacity>
      ),
    });

    const handleUrlEvent = async (event) => {
      if (event.url.includes("error=access_denied")) {
        setError("Access denied");
        return;
      }

      const accesToken = await getAccessToken(event.url);
      if (accesToken) {
        setAuthenticated(true);
      }
      return accesToken;
    };
    const urlListener = Linking.addEventListener("url", handleUrlEvent);

    setLoading(false);
    return () => {
      urlListener.remove();
    };
  }, []);

  const pickImage = async () => {
    const options = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    };
    let result = await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled) {
      setLoading(true);
      try {
        const img = result.assets[0];
        const base64 = await FileSystem.readAsStringAsync(img.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const filePath = `${user.id}/profilePicture`;
        const contentType = img.type;

        const { data, error } = await supabase.storage
          .from("profilePicture")
          .upload(filePath, decode(base64), { contentType });

        if (error) {
          if (error.message === "The resource already exists") {
            const { data, error } = await supabase.storage
              .from("profilePicture")
              .update(filePath, decode(base64), { contentType });

            if (error) {
              console.log("Error updating file: ", error.message);
            } else {
              setLoading(false);
              fetchUser();
            }
          }
        } else {
          setLoading(false);
          fetchUser();
        }
      } catch (error) {
        console.log("Error processing file: ", error.message);
      }
    }
  };

  if (loading) {
    return <ActivityLoader visible={loading} />;
  }

  const change = async (prop) => {
    if (prop == "username") {
      setPrompt(prop);

      const { data, error } = await supabase
        .from("users")
        .update({ username: newUsername })
        .eq("id", user.id);

      if (error) {
        console.log("error updating username", error);
      } else {
        fetchUser();
      }
    } else if (prop == "email") {
      const { data, error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) {
        console.log("error updating email", error);
      }

      Alert.alert("Email updated", "Please log in again");
      await supabase.auth.signOut();
    } else if (prop == "password") {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.log("error updating password", error);
      }

      Alert.alert("Password updated", "Please log in again");
      await supabase.auth.signOut();
    } else if (prop == "birthday") {
      const { data, error } = await supabase
        .from("users")
        .update({ birthday: newBirthday })
        .eq("id", user.id);

      if (error) {
        console.log("error updating birthday", error);
      }

      fetchUser();
    }
    setNewEmail("");
    setNewPassword("");
    setNewUsername("");
    setNewBirthday("");

    fetchUser();
    setPrompt(null);
  };

  const authenticateSpotify = async () => {
    const client_id = process.env.SPOTIFY_CLIENT_ID;
    // kot
    // const redirect_uri = "exp://192.168.200.251:8081";
    // mama
    const redirect_uri = "exp://172.20.10.3:8081";
    const scopes = ["user-read-recently-played, playlist-modify-private"];
    const loginUrl = `https://accounts.spotify.com/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&scope=${scopes.join(
      "%20"
    )}&response_type=code&show_dialog=true`;
    await Linking.openURL(loginUrl);
  };

  const unAuthenticateSpotify = async () => {
    await SecureStore.deleteItemAsync("acces_token");
    setAuthenticated(false);
  };

  const getTheme = async () => {
    const theme = await SecureStore.getItemAsync("colorTheme");
    if (theme) {
      setColorTheme(theme);
      navigation.setOptions({
        headerTintColor: colorThemes[theme].dark,
        headerBackTitleStyle: {
          color: colorThemes[theme].dark,
        },
        headerRight: () => (
          <TouchableOpacity onPress={logout}>
            <Text style={{ color: colorThemes[theme].dark, marginRight: 10 }}>
              Logout
            </Text>
          </TouchableOpacity>
        ),
      });
    }
  };

  const popUpColor = async () => {
    Alert.alert("Color Theme", "Please select a color theme", [
      {
        text: "Brown",
        onPress: async () => {
          setColorTheme("brown");
          await SecureStore.setItemAsync("colorTheme", "brown");
          navigation.setOptions({
            headerTintColor: colorThemes["brown"].dark,
            headerBackTitleStyle: {
              color: colorThemes["brown"].dark,
            },
            headerRight: () => (
              <TouchableOpacity onPress={logout}>
                <Text
                  style={{ color: colorThemes["brown"].dark, marginRight: 10 }}
                >
                  Logout
                </Text>
              </TouchableOpacity>
            ),
          });
        },
      },
      {
        text: "Yellow",
        onPress: async () => {
          setColorTheme("yellow");
          await SecureStore.setItemAsync("colorTheme", "yellow");
          navigation.setOptions({
            headerTintColor: colorThemes["yellow"].dark,
            headerBackTitleStyle: {
              color: colorThemes["yellow"].dark,
            },
            headerRight: () => (
              <TouchableOpacity onPress={logout}>
                <Text
                  style={{ color: colorThemes["yellow"].dark, marginRight: 10 }}
                >
                  Logout
                </Text>
              </TouchableOpacity>
            ),
          });
        },
      },
      {
        text: "Blue",
        onPress: async () => {
          setColorTheme("blue");
          await SecureStore.setItemAsync("colorTheme", "blue");
          navigation.setOptions({
            headerTintColor: colorThemes["blue"].dark,
            headerBackTitleStyle: {
              color: colorThemes["blue"].dark,
            },
            headerRight: () => (
              <TouchableOpacity onPress={logout}>
                <Text
                  style={{ color: colorThemes["blue"].dark, marginRight: 10 }}
                >
                  Logout
                </Text>
              </TouchableOpacity>
            ),
          });
        },
      },
      {
        text: "Green",
        onPress: async () => {
          setColorTheme("green");
          await SecureStore.setItemAsync("colorTheme", "green");
          navigation.setOptions({
            headerTintColor: colorThemes["green"].dark,
            headerBackTitleStyle: {
              color: colorThemes["green"].dark,
            },
            headerRight: () => (
              <TouchableOpacity onPress={logout}>
                <Text
                  style={{ color: colorThemes["green"].dark, marginRight: 10 }}
                >
                  Logout
                </Text>
              </TouchableOpacity>
            ),
          });
        },
      },
      {
        text: "Pink",
        onPress: async () => {
          setColorTheme("pink");
          await SecureStore.setItemAsync("colorTheme", "pink");
          navigation.setOptions({
            headerTintColor: colorThemes["pink"].dark,
            headerBackTitleStyle: {
              color: colorThemes["pink"].dark,
            },
            headerRight: () => (
              <TouchableOpacity onPress={logout}>
                <Text
                  style={{ color: colorThemes["pink"].dark, marginRight: 10 }}
                >
                  Logout
                </Text>
              </TouchableOpacity>
            ),
          });
        },
      },
      {
        text: "Purple",
        onPress: async () => {
          setColorTheme("purple");
          await SecureStore.setItemAsync("colorTheme", "purple");
          navigation.setOptions({
            headerTintColor: colorThemes["purple"].dark,
            headerBackTitleStyle: {
              color: colorThemes["purple"].dark,
            },
            headerRight: () => (
              <TouchableOpacity onPress={logout}>
                <Text
                  style={{ color: colorThemes["purple"].dark, marginRight: 10 }}
                >
                  Logout
                </Text>
              </TouchableOpacity>
            ),
          });
        },
      },
      {
        text: "Red",
        onPress: async () => {
          setColorTheme("red");
          await SecureStore.setItemAsync("colorTheme", "red");
          navigation.setOptions({
            headerTintColor: colorThemes["red"].dark,
            headerBackTitleStyle: {
              color: colorThemes["red"].dark,
            },
            headerRight: () => (
              <TouchableOpacity onPress={logout}>
                <Text
                  style={{ color: colorThemes["red"].dark, marginRight: 10 }}
                >
                  Logout
                </Text>
              </TouchableOpacity>
            ),
          });
        },
      },
      {
        text: "Cancel",
        onPress: () => console.log("Cancel Pressed"),
        style: "cancel",
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        {prompt && (
          <View style={styles.promptContainer}>
            <View style={styles.prompt}>
              <Ionicons
                name="close"
                size={30}
                color={"#654321"}
                onPress={(e) => setPrompt(null)}
                style={styles.closePrompt}
              />
              <Text style={styles.h3}>Change {prompt}</Text>
              {prompt === "birthday" ? (
                <>
                  {Platform.OS === "ios" ? (
                    <DateTimePicker
                      value={date}
                      mode="date"
                      display="default"
                      onChange={(event, selectedDate) => {
                        // add 2 hours to selected date to fix timezone issue
                        selectedDate.setHours(selectedDate.getHours() + 2);
                        const currentDate = selectedDate || date;
                        setDate(currentDate);
                        setOpen(false);
                        setNewBirthday(currentDate);
                      }}
                      style={{ width: 200 }}
                      maximumDate={new Date(2020, 10, 20)}
                    />
                  ) : (
                    <>
                      <Button title="Open" onPress={() => setOpen(true)} />
                      {open && (
                        <DateTimePicker
                          value={date}
                          mode="date"
                          display="default"
                          onChange={(event, selectedDate) => {
                            const currentDate = selectedDate || date;
                            setOpen(false);
                            setNewBirthday(currentDate);
                          }}
                        />
                      )}
                    </>
                  )}
                </>
              ) : (
                <TextInput
                  onChangeText={(text) => {
                    if (prompt === "username") {
                      setNewUsername(text);
                    } else if (prompt === "email") {
                      setNewEmail(text);
                    } else if (prompt === "password") {
                      setNewPassword(text);
                    }
                  }}
                  placeholder={`New ${prompt}`}
                  style={styles.promptInput}
                  inputMode={prompt === "email" ? "email" : "text"}
                  secureTextEntry={prompt === "password"}
                />
              )}

              <TouchableOpacity
                onPress={(e) => change(prompt)}
                style={styles.submitContainerPrompt}
              >
                <Text style={styles.submitTextPrompt}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        <View style={styles.profileContainer}>
          {image ? (
            <Image source={{ uri: image }} style={styles.image} />
          ) : (
            <Image
              source={require("./../../assets/profilePic.jpeg")}
              style={styles.image}
            />
          )}
          <TouchableOpacity
            style={[
              styles.changePictureButton,
              { backgroundColor: currentTheme.dark },
            ]}
            onPress={pickImage}
          >
            <Ionicons
              name="camera-outline"
              size={30}
              color={currentTheme.light}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.containerInput}>
          <TouchableOpacity
            onPress={popUpColor}
            style={{
              backgroundColor: currentTheme.dark,
              padding: 10,
              borderRadius: 8,
              marginTop: 10,
              textAlign: "center",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: currentTheme.light,
                fontSize: 16,
                fontWeight: "bold",
                textTransform: "uppercase",
              }}
            >
              Change theme
            </Text>
          </TouchableOpacity>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: currentTheme.light },
            ]}
          >
            <Text style={[styles.label, { color: currentTheme.dark }]}>
              Username:
            </Text>
            <Text style={[styles.value, { color: currentTheme.dark }]}>
              {user?.username}
            </Text>
            <Ionicons
              name="pencil"
              size={15}
              color={currentTheme.dark}
              style={styles.pen}
              onPress={(e) => setPrompt("username")}
            />
          </View>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: currentTheme.light },
            ]}
          >
            <Text style={[styles.label, { color: currentTheme.dark }]}>
              E-mail:
            </Text>
            <Text style={[styles.value, { color: currentTheme.dark }]}>
              {user?.email}
            </Text>
            <Ionicons
              name="pencil"
              size={15}
              color={currentTheme.dark}
              style={styles.pen}
              onPress={(e) => setPrompt("email")}
            />
          </View>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: currentTheme.light },
            ]}
          >
            <Text style={[styles.label, { color: currentTheme.dark }]}>
              Birthday:
            </Text>
            <Text style={[styles.value, { color: currentTheme.dark }]}>
              {formatBday(user?.birthday)}
            </Text>
            <Ionicons
              name="pencil"
              size={15}
              color={currentTheme.dark}
              style={styles.pen}
              onPress={(e) => setPrompt("birthday")}
            />
          </View>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: currentTheme.light },
            ]}
          >
            <Text style={[styles.label, { color: currentTheme.dark }]}>
              Password:
            </Text>
            <Text style={[styles.value, { color: currentTheme.dark }]}>
              ********
            </Text>
            <Ionicons
              name="pencil"
              size={15}
              color={currentTheme.dark}
              style={styles.pen}
              onPress={(e) => setPrompt("password")}
            />
          </View>
        </View>
        <TouchableOpacity
          onPress={authenticated ? unAuthenticateSpotify : authenticateSpotify}
          style={styles.submitContainer}
        >
          <Entypo name="spotify" size={35} color="white" />
          <Text style={styles.submitText}>
            {authenticated ? "Unlink" : "Link"} Spotify
          </Text>
        </TouchableOpacity>
        <Text>{accountAge} days a trusted member</Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginTop: 16,
  },
  profileContainer: {
    position: "relative",
    marginTop: 20,
  },

  changePictureButton: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#654321",
    borderRadius: 50,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  containerInput: {
    width: "80%",
    marginTop: 20,

    justifyContent: "center",
    gap: 20,
  },
  inputContainer: {
    backgroundColor: "#FEF5EA",
    padding: 15,
    borderRadius: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#654321",
  },
  value: {
    fontSize: 16,
    color: "#654321",
  },
  submitContainer: {
    backgroundColor: "#1ED760",
    padding: 10,
    borderRadius: 8,
    width: "80%",
    alignItems: "center",
    marginVertical: 20,
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
  submitText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 20,
    textTransform: "uppercase",
  },
  submitContainerPrompt: {
    backgroundColor: "#654321",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 20,
  },
  submitTextPrompt: {
    color: "white",
    fontWeight: "bold",
  },
  pen: {
    position: "absolute",
    right: 10,
    top: 10,
  },
  promptContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  prompt: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 8,
    width: "80%",
    height: 250,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  promptInput: {
    borderColor: "#654321",
    borderBottom: 1,
    backgroundColor: "#FEF5EA",
    padding: 10,
    borderRadius: 8,
  },
  closePrompt: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  h3: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
});

export default ProfileScreen;
