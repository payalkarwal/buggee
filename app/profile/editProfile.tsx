import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    BackHandler,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ROUTES } from '@/constants/routes';
import { useAppTheme } from "@/context/ThemeContext";

const STORAGE_KEY = "buggee_profile";

export default function EditProfile() {
    const router = useRouter();
    const { colors, isDark } = useAppTheme();

    // Form States
    const [name, setName] = useState("Arjun Kumar");
    const [phone, setPhone] = useState("+91 8448162173");
    const [email, setEmail] = useState("arjun@gmail.com");
    const [gender, setGender] = useState("Male");
    const [dob, setDob] = useState(new Date(2003, 5, 12));
    const [image, setImage] = useState<string | null>(null);
    const [bio, setBio] = useState("Frequent traveller | Smooth rides & good music 🎵\nDelhi NCR");

    // UI States
    const [saveStatus, setSaveStatus] = useState<"idle" | "loading" | "success">("idle");

    // Button Spring Scale Animation
    const saveScale = useState(new Animated.Value(1))[0];

    // Save Button Scaling Animations
    const handlePressIn = () => {
        Animated.spring(saveScale, {
            toValue: 0.95,
            useNativeDriver: true,
            tension: 120,
            friction: 5,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(saveScale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 120,
            friction: 5,
        }).start();
    };

    // Load saved profile on focus (loads data updated on separate pages)
    useFocusEffect(
        useCallback(() => {

            const loadProfileData = async () => {
                try {
                    const raw = await AsyncStorage.getItem(STORAGE_KEY);

                    if (raw) {
                        const saved = JSON.parse(raw);

                        if (saved.name) setName(saved.name);
                        if (saved.phone) setPhone(saved.phone);
                        if (saved.email) setEmail(saved.email);
                        if (saved.gender) setGender(saved.gender);

                        if (saved.dob) {
                            setDob(new Date(saved.dob));
                        }

                        if (saved.image !== undefined) setImage(saved.image);
                        if (saved.bio !== undefined) setBio(saved.bio);
                    }

                } catch (err) {
                    console.error(
                        "Error loading profile from AsyncStorage:",
                        err
                    );
                }
            };


            loadProfileData();


            // Android back button handling
            const backAction = () => {
                router.back();
                return true;
            };


            const handler = BackHandler.addEventListener(
                "hardwareBackPress",
                backAction
            );


            return () => {
                handler.remove();
            };


        }, [])
    );

    // Get initials for profile picture fallback
    const getInitials = (fullName: string) => {
        const parts = fullName.trim().split(" ");
        const first = parts[0]?.[0] ?? "";
        const last = parts[1]?.[0] ?? "";
        return (first + last).toUpperCase() || "?";
    };

    // Pick image from gallery
    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                quality: 0.8,
            });

            if (!result.canceled) {
                setImage(result.assets[0].uri);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
        } catch (err) {
            console.error("Error picking image:", err);
        }
    };

    // Save gender and image profile updates to AsyncStorage
    const handleSave = async () => {
        setSaveStatus("loading");
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            let profileData = {};
            if (raw) {
                profileData = JSON.parse(raw);
            }

            const updatedProfile = {
                ...profileData,
                gender,
                image,
            };

            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile));

            setSaveStatus("success");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Brief delay for premium visual confirmation
            setTimeout(() => {
                setSaveStatus("idle");
                router.replace(ROUTES.PROFILE);
            }, 400);
        } catch (err) {
            console.error("Error saving profile:", err);
            setSaveStatus("idle");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <View style={[styles.container, { backgroundColor: colors.bg }]}>
                <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />

                <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <TouchableOpacity
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.back();
                            }}
                            style={[styles.circle, { backgroundColor: colors.card, borderColor: colors.border }]}
                            activeOpacity={0.75}
                        >
                            <Ionicons name="arrow-back" size={18} color={colors.accent} />
                        </TouchableOpacity>

                        <Text style={[styles.heading, { color: colors.text }]}>Edit Profile</Text>

                        <View style={{ width: 36 }} />
                    </View>

                    {/* Content */}
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
                    >
                        {/* Profile Image Picker */}
                        <View style={styles.profile}>
                            <TouchableOpacity
                                onPress={pickImage}
                                activeOpacity={0.8}
                                style={styles.avatarContainer}
                            >
                                <View style={[styles.dp, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                    {image ? (
                                        <Image
                                            source={{ uri: image }}
                                            style={styles.avatarImage}
                                            contentFit="cover"
                                        />
                                    ) : (
                                        <LinearGradient
                                            colors={[colors.card, colors.surface]}
                                            style={styles.avatarGradient}
                                        >
                                            <Text style={[styles.initial, { color: colors.accent }]}>
                                                {getInitials(name)}
                                            </Text>
                                        </LinearGradient>
                                    )}
                                </View>
                                <View style={[styles.camBadge, { backgroundColor: colors.accent, borderColor: colors.bg }]}>
                                    <Ionicons name="camera" size={12} color="#000" />
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={pickImage} activeOpacity={0.7}>
                                <Text style={[styles.change, { color: colors.accent }]}>Change Photo</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Editable Fields list (Instagram-style) */}
                        <ProfileRow
                            icon="person-outline"
                            title="Name"
                            value={name}
                            placeholder="Add your name"
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
                                router.push(ROUTES.EDIT_NAME);
                            }}
                        />

                        <ProfileRow
                            icon="call-outline"
                            title="Phone Number"
                            value={phone}
                            placeholder="Add your phone number"
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
                                router.push(ROUTES.EDIT_PHONE);
                            }}
                        />

                        <ProfileRow
                            icon="mail-outline"
                            title="Email"
                            value={email}
                            placeholder="Add your email address"
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
                                router.push(ROUTES.EDIT_EMAIL);
                            }}
                        />

                        <ProfileRow
                            icon="chatbubble-ellipses-outline"
                            title="Bio"
                            value={bio}
                            placeholder="Write a short bio..."
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
                                router.push(ROUTES.EDIT_BIO);
                            }}
                        />

                        <ProfileRow
                            icon="calendar-outline"
                            title="Date of Birth"
                            value={dob.toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                            placeholder="Add your date of birth"
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
                                router.push(ROUTES.EDIT_DOB);
                            }}
                        />

                        {/* Gender Selector (kept inline for convenience) */}
                        <ProfileRow
                            icon="transgender-outline"
                            title="Gender"
                            value={gender}
                            placeholder="Select gender"
                            onPress={() => {
                                Haptics.impactAsync(
                                    Haptics.ImpactFeedbackStyle.Light
                                ).catch(() => { });

                                router.push(ROUTES.EDIT_GENDER);
                            }}
                        />

                        {/* Save Button for Image and Gender changes */}
                        <Animated.View style={{ transform: [{ scale: saveScale }], marginTop: 30, marginBottom: 20 }}>
                            <TouchableOpacity
                                onPressIn={handlePressIn}
                                onPressOut={handlePressOut}
                                onPress={handleSave}
                                disabled={saveStatus !== "idle"}
                                activeOpacity={1}
                            >
                                <LinearGradient
                                    colors={
                                        saveStatus === "success"
                                            ? ["#10B981", "#059669"]
                                            : [colors.accent, "#D4B022"]
                                    }
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[
                                        styles.save,
                                        saveStatus === "loading" && { opacity: 0.8 },
                                        styles.saveGlowShadow,
                                        { shadowColor: colors.accent }
                                    ]}
                                >
                                    {saveStatus === "loading" && (
                                        <ActivityIndicator color="#000" size="small" />
                                    )}
                                    {saveStatus === "success" && (
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                            <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                                            <Text style={styles.saveText}>Changes Saved!</Text>
                                        </View>
                                    )}
                                    {saveStatus === "idle" && (
                                        <Text style={[styles.saveText, { color: "#000" }]}>Save Changes</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    </ScrollView>
                </SafeAreaView>
            </View >
        </KeyboardAvoidingView >
    );
}



function ProfileRow({
    icon,
    title,
    value,
    placeholder,
    onPress,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    value: string;
    placeholder?: string;
    onPress: () => void;
}) {
    const { colors, isDark } = useAppTheme();
    return (
        <View style={styles.inputWrapper}>
            <TouchableOpacity
                style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={onPress}
                activeOpacity={0.75}
            >
                <Ionicons
                    name={icon}
                    size={20}
                    color={isDark ? "white" : "black"}
                />

                <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: colors.textMuted }]}>
                        {title}
                    </Text>
                    <Text
                        numberOfLines={title === "Bio" ? 3 : 1}
                        style={[styles.value, { color: colors.text }, !value && { color: colors.textMuted }]}
                    >
                        {value || placeholder || `Add your ${title.toLowerCase()}`}
                    </Text>
                </View>

                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: 5 }} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#080818",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.03)",
    },
    heading: {
        color: "white",
        fontSize: 17,
        fontWeight: "800",
        letterSpacing: 0.3,
    },
    circle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#1a1a2e",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        justifyContent: "center",
        alignItems: "center",
    },
    profile: {
        alignItems: "center",
        marginVertical: 25,
    },
    avatarContainer: {
        position: "relative",
    },
    dp: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: "#1e1e38",
        borderWidth: 3,
        borderColor: "#2a2a44",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
    },
    avatarImage: {
        width: "100%",
        height: "100%",
    },
    avatarGradient: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
    },
    initial: {
        color: "#B46CFF",
        fontSize: 32,
        fontWeight: "800",
    },
    camBadge: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#8B5CF6",
        borderWidth: 3,
        borderColor: "#080818",
        justifyContent: "center",
        alignItems: "center",
    },
    change: {
        color: "#8B5CF6",
        marginTop: 12,
        fontWeight: "700",
        fontSize: 14,
    },
    inputWrapper: {
        marginTop: 15,
        width: "100%",
    },
    inputBox: {
        backgroundColor: "#0C0C1E",
        borderRadius: 18,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 15,
        borderWidth: 1.5,
        borderColor: "rgba(255, 255, 255, 0.03)",
    },
    label: {
        color: "#666",
        fontSize: 11,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    value: {
        color: "#eee",
        fontSize: 15,
        marginTop: 5,
        fontWeight: "500",
        lineHeight: 20,
    },
    genderRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 10,
    },
    genderPill: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: "#13132A",
        borderWidth: 1.5,
        borderColor: "rgba(255, 255, 255, 0.05)",
        alignItems: "center",
        justifyContent: "center",
    },
    genderPillActive: {
        backgroundColor: "rgba(139, 92, 246, 0.12)",
        borderColor: "#8B5CF6",
    },
    genderText: {
        color: "#666",
        fontSize: 13,
        fontWeight: "600",
    },
    genderTextActive: {
        color: "#B46CFF",
        fontWeight: "700",
    },
    save: {
        padding: 16,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        height: 56,
    },
    saveText: {
        color: "white",
        fontSize: 16,
        fontWeight: "800",
        letterSpacing: 0.5,
    },
    saveGlowShadow: {
        shadowColor: "#8B5CF6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 6,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        flexShrink: 0,
    },
});