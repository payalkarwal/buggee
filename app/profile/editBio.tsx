import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useRouter, useFocusEffect } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import {
    ActivityIndicator,
    BackHandler,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ROUTES } from '@/constants/routes';
import { useAppTheme } from "@/context/ThemeContext";

const STORAGE_KEY = "buggee_profile";

export default function EditBio() {
    const router = useRouter();
    const { colors, isDark } = useAppTheme();
    const [bio, setBio] = useState("");
    const [isFocused, setIsFocused] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useFocusEffect(
        useCallback(() => {
            const backAction = () => {
                router.replace(ROUTES.EDIT_PROFILE);
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

    useEffect(() => {
        const loadBio = async () => {
            try {
                const raw = await AsyncStorage.getItem(STORAGE_KEY);
                if (raw) {
                    const saved = JSON.parse(raw);
                    if (saved.bio !== undefined) {
                        setBio(saved.bio);
                    }
                }
            } catch (err) {
                console.error("Error loading bio:", err);
            }
        };
        loadBio();
    }, []);

    const handleSave = async () => {
        const trimmedBio = bio.trim();
        if (trimmedBio.length > 150) {
            setError("Bio cannot exceed 150 characters");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { });
            return;
        }

        setLoading(true);
        setError(null);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });

        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            let profileData = {};
            if (raw) {
                profileData = JSON.parse(raw);
            }

            const updatedProfile = {
                ...profileData,
                bio: trimmedBio,
            };

            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });

            setTimeout(() => {
                setLoading(false);
                router.replace(ROUTES.EDIT_PROFILE);
            }, 500);
        } catch (err) {
            console.error("Error saving bio:", err);
            setLoading(false);
            setError("Failed to save changes. Please try again.");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { });
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
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
                                router.replace(ROUTES.EDIT_PROFILE);
                            }}
                            style={[styles.circle, { backgroundColor: colors.card, borderColor: colors.border }]}
                            activeOpacity={0.75}
                        >
                            <Ionicons name="arrow-back" size={18} color={colors.accent} />
                        </TouchableOpacity>

                        <Text style={[styles.heading, { color: colors.text }]}>Bio</Text>

                        <TouchableOpacity
                            onPress={handleSave}
                            disabled={loading}
                            style={styles.saveBtn}
                            activeOpacity={0.7}
                        >
                            {loading ? (
                                <ActivityIndicator color={colors.accent} size="small" />
                            ) : (
                                <Text style={[styles.saveBtnText, { color: colors.accent }]}>Save</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20 }}
                    >
                        <View style={styles.inputWrapper}>
                            <View
                                style={[
                                    styles.inputBox,
                                    { backgroundColor: colors.card, borderColor: colors.border },
                                    isFocused && { borderColor: colors.accent, backgroundColor: colors.surface },
                                    styles.bioInputBox,
                                    error ? styles.inputBoxError : null,
                                ]}
                            >
                                <Ionicons
                                    name="chatbubble-ellipses-outline"
                                    size={20}
                                    color={error ? "#FF4D4F" : isFocused ? colors.accent : colors.textMuted}
                                    style={{ marginTop: 2 }}
                                />

                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                        <Text
                                            style={[
                                                styles.label,
                                                { color: colors.textMuted },
                                                isFocused && { color: colors.accent },
                                                error ? styles.labelError : null,
                                            ]}
                                        >
                                            Bio
                                        </Text>
                                        <Text style={[
                                            styles.bioCharCounter,
                                            { color: colors.textMuted },
                                            bio.length >= 135 && { color: "#FF4D4F" }
                                        ]}>
                                            {bio.length}/150
                                        </Text>
                                    </View>

                                    <TextInput
                                        value={bio}
                                        onChangeText={(text) => {
                                            if (text.length <= 150) {
                                                setBio(text);
                                                if (error) setError(null);
                                            }
                                        }}
                                        placeholder="Write a short bio about yourself..."
                                        placeholderTextColor={colors.textMuted}
                                        multiline
                                        numberOfLines={4}
                                        style={[styles.text, styles.bioText, { color: colors.text }]}
                                        autoFocus
                                        onFocus={() => setIsFocused(true)}
                                        onBlur={() => setIsFocused(false)}
                                    />
                                </View>
                            </View>
                            {error ? <Text style={styles.errorText}>{error}</Text> : null}
                        </View>

                        <Text style={[styles.helperText, { color: colors.textSub }]}>
                            Share a brief description about yourself so that riders or drivers can know you better (e.g. your ride preferences, music choices, etc.).
                        </Text>
                    </ScrollView>
                </SafeAreaView>
            </View>
        </KeyboardAvoidingView>
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
    saveBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        justifyContent: "center",
        alignItems: "center",
    },
    saveBtnText: {
        color: "#B46CFF",
        fontSize: 15,
        fontWeight: "700",
    },
    inputWrapper: {
        marginTop: 10,
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
    inputBoxFocused: {
        borderColor: "#8B5CF6",
        backgroundColor: "#0f0f2d",
    },
    inputBoxError: {
        borderColor: "#FF4D4F",
    },
    bioInputBox: {
        alignItems: "flex-start",
        minHeight: 120,
    },
    bioCharCounter: {
        color: "#555570",
        fontSize: 11,
        fontWeight: "600",
    },
    label: {
        color: "#666",
        fontSize: 11,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    labelFocused: {
        color: "#B46CFF",
    },
    labelError: {
        color: "#FF4D4F",
    },
    text: {
        color: "white",
        fontSize: 15,
        marginTop: 4,
        fontWeight: "500",
        padding: 0,
    },
    bioText: {
        minHeight: 80,
        textAlignVertical: "top",
        marginTop: 6,
        width: "100%",
    },
    errorText: {
        color: "#FF4D4F",
        fontSize: 12,
        marginTop: 6,
        marginLeft: 6,
        fontWeight: "500",
    },
    helperText: {
        color: "#555570",
        fontSize: 12,
        marginTop: 15,
        marginHorizontal: 6,
        lineHeight: 18,
        fontWeight: "500",
    },
});
