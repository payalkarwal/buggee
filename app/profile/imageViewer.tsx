import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    Dimensions,
    FlatList,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppTheme } from "@/context/ThemeContext";

const { width } = Dimensions.get("window");

const IMAGE_HEIGHT = width; // Square images, taking up full width of screen
const DIVIDER_HEIGHT = 8; // Separation spacer between images
const STORAGE_KEY = "buggee_profile";

const IMAGES = [
    { uri: "https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=800&q=90" },
    { uri: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=90" },
    { uri: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=800&q=90" },
    { uri: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=90" },
    { uri: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=90" },
];

export default function ImageViewer() {
    const router = useRouter();
    const { index } = useLocalSearchParams();
    const active = Number(index) || 0;
    const flatListRef = useRef<FlatList>(null);
    const { colors, isDark } = useAppTheme();

    const [userName, setUserName] = useState("Arjun Kumar");
    const [userImage, setUserImage] = useState<string | null>(null);

    // Load profile data on mount
    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
            if (raw) {
                const saved = JSON.parse(raw);
                if (saved.name) setUserName(saved.name);
                if (saved.image) setUserImage(saved.image);
            }
        });
    }, []);

    const initials = () => {
        const parts = userName.trim().split(" ");
        return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
    };



    return (
        <>
            <Stack.Screen
                options={{
                    animation: "slide_from_right",
                    gestureEnabled: true,
                    animationDuration: 300,
                }}
            />

            <View style={[styles.container, { backgroundColor: colors.bg }]}>
                <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />

                <SafeAreaView
                    edges={["top"]}
                    style={[styles.headerSafeArea, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}
                >
                    <View style={[styles.header, { backgroundColor: colors.bg }]}>

                        <TouchableOpacity
                            style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
                                router.back();
                            }}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="arrow-back" size={22} color={colors.accent} />
                        </TouchableOpacity>


                        <View style={styles.userBox}>
                            <View style={[styles.smallAvatar, { backgroundColor: colors.surface, borderColor: colors.accent }]}>
                                {userImage ? (
                                    <Image
                                        source={{ uri: userImage }}
                                        style={styles.avatarImg}
                                        contentFit="cover"
                                    />
                                ) : (
                                    <Text style={[styles.avatarInitials, { color: colors.accent }]}>
                                        {initials()}
                                    </Text>
                                )}
                            </View>


                            <View style={styles.userInfo}>
                                <View style={styles.nameRow}>
                                    <Text style={[styles.userName, { color: colors.text }]}>
                                        {userName}
                                    </Text>

                                    <View style={styles.verify}>
                                        <Ionicons
                                            name="checkmark"
                                            size={7}
                                            color="white"
                                        />
                                    </View>

                                </View>
                            </View>

                        </View>

                    </View>
                </SafeAreaView>

                <FlatList
                    ref={flatListRef}
                    style={{ marginTop: -8, backgroundColor: colors.bg }}
                    data={IMAGES}
                    pagingEnabled={false}
                    showsVerticalScrollIndicator={true}

                    // Directly sets scroll offset on native side during initial render, preventing layout jumps/glitches
                    contentOffset={{ x: 0, y: (IMAGE_HEIGHT + DIVIDER_HEIGHT) * active }}

                    // Optimized list props for maximum performance and buttery smooth scrolling
                    initialNumToRender={5}
                    maxToRenderPerBatch={5}
                    windowSize={3}
                    removeClippedSubviews={false}

                    contentContainerStyle={styles.listContent}
                    getItemLayout={(_, i) => ({
                        length: IMAGE_HEIGHT + DIVIDER_HEIGHT,
                        offset: (IMAGE_HEIGHT + DIVIDER_HEIGHT) * i,
                        index: i
                    })}
                    renderItem={({ item }) => (
                        <View style={[styles.imageContainer, { backgroundColor: colors.bg }]}>
                            <Image
                                source={{ uri: item.uri }}
                                style={styles.image}
                                contentFit="cover"
                            />
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        </View>
                    )}
                    keyExtractor={(_, i) => i.toString()}
                />
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#080818",
    },
    headerSafeArea: {
        backgroundColor: "#080818",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(180, 108, 255, 0.12)",
        paddingBottom: 14,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        height: 70,
        backgroundColor: "#080818",
    },
    backButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.08)",
        justifyContent: "center",
        alignItems: "center",
    },
    userBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        flex: 1,
        marginLeft: 12,
    },
    smallAvatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: "#1e1e38",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: "#B46CFF",
        overflow: "hidden",
    },
    avatarImg: {
        width: "100%",
        height: "100%",
    },
    avatarInitials: {
        color: "#B46CFF",
        fontSize: 13,
        fontWeight: "800",
    },
    userInfo: {
        justifyContent: "center",
    },
    nameRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    userName: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "700",
        letterSpacing: 0.2,
    },
    verify: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: "#2563EB",
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 5,
    },
    listContent: {
        paddingTop: 0,
    },
    imageContainer: {
        width: width,
        height: IMAGE_HEIGHT + DIVIDER_HEIGHT,
        backgroundColor: "#080818",
    },
    image: {
        width: width,
        height: IMAGE_HEIGHT,
    },
    divider: {
        height: 8,
        backgroundColor: "#050510",
    },
});