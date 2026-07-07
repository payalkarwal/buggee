// Settings Screen — Redesigned to match the premium profile/instagram layout
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Clipboard,
    Dimensions,
    Modal,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import Reanimated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/context/ThemeContext';
import CustomTabBar from '@/components/navigation/CustomTabBar';

const { width: SW, height: SH } = Dimensions.get('window');
const THUMB = (SW - 4) / 3; // Matches paddingHorizontal: 16 and gaps of 4px between 3 columns

const STORAGE_KEY = 'buggee_profile';

const STATS = [
    { val: '340', label: 'Rides', icon: 'car-outline', color: '#FF4F8B', bg: '#1a1035', tint: '#7C5CBF' },
    { val: '4.9', label: 'Rating', icon: 'star-outline', color: '#FF4F8B', bg: '#1a2510', tint: '#3A9E5F' },
    { val: '128', label: 'Reviews', icon: 'chatbubble-ellipses-outline', color: '#FF4F8B', bg: '#101828', tint: '#3B72C4' },
    { val: '98%', label: 'Response', icon: 'flash-outline', color: '#FF4F8B', bg: '#1a1508', tint: '#B88A12' },
];

const GRID_ITEMS = [
    { uri: 'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=400&q=80' },
    { uri: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=400&q=80' },
    { uri: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=400&q=80' },
    { uri: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80' },
    { uri: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80' },
];

export default function SettingsScreen() {
    const router = useRouter();
    const { colors, isDark } = useAppTheme();
    const insets = useSafeAreaInsets();
    const [userName, setUserName] = useState('Arjun Kumar');
    const [userEmail, setUserEmail] = useState('arjun@email.com');
    const [userImage, setUserImage] = useState<string | null>(null);
    const [userBio, setUserBio] = useState('Frequent traveller  |  Smooth rides & good music 🎵\nDelhi NCR');
    const [vibes, setVibes] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'grid' | 'video' | 'saved'>('grid');
    const [shareVisible, setShareVisible] = useState(false);
    const [isDpPreviewVisible, setDpPreviewVisible] = useState(false);

    // Instagram-style DP preview animation values
    const dpScale = useSharedValue(0.05);
    const dpBackdrop = useSharedValue(0);

    const openDpPreview = () => {
        // Reset scale to tiny first so the pop always starts fresh
        dpScale.value = 0.05;
        dpBackdrop.value = 0;
        setDpPreviewVisible(true);
        // Backdrop darkens quickly
        dpBackdrop.value = withTiming(1, { duration: 160 });
        // Image springs open from tiny to full — no fade, pure scale pop
        dpScale.value = withSpring(1, {
            damping: 18,
            stiffness: 220,
            mass: 0.8,
            overshootClamping: false,
        });
    };

    const closeDpPreview = () => {
        // Shrink back with tight spring
        dpScale.value = withSpring(0.05, {
            damping: 22,
            stiffness: 300,
            mass: 0.6,
        });
        // Backdrop fades out; dismiss modal only after backdrop is gone
        dpBackdrop.value = withTiming(0, { duration: 200 }, (finished) => {
            if (finished) runOnJS(setDpPreviewVisible)(false);
        });
    };

    const dpAvatarStyle = useAnimatedStyle(() => ({
        transform: [{ scale: dpScale.value }],
    }));

    // Use opacity on a solid-black view (avoids worklet rgba string issues)
    const dpBackdropStyle = useAnimatedStyle(() => ({
        opacity: dpBackdrop.value,
    }));

    const profileLink =
        `https://buggee.app/profile/${userName.replace(/\s/g, "")}`;

    const translateY = useRef(new Animated.Value(0)).current;

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    // Load profile data on focus
    useFocusEffect(
        useCallback(() => {
            AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
                if (raw) {
                    const saved = JSON.parse(raw);
                    if (saved.name) setUserName(saved.name);
                    if (saved.email) setUserEmail(saved.email);
                    if (saved.image !== undefined) setUserImage(saved.image);
                    if (saved.bio) setUserBio(saved.bio);
                    if (saved.vibes) setVibes(saved.vibes);
                }
            });
        }, [])
    );

    useEffect(() => {
        // Entrance animation
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 12, useNativeDriver: true }),
        ]).start();
    }, []);

    const initials = () => {
        const parts = userName.trim().split(' ');
        return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
    };

    return (
        <View style={[s.root, { backgroundColor: colors.bg }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />
            <SafeAreaView edges={['top']} style={{ backgroundColor: colors.bg, flex: 0 }}>
                {/* ── Header Bar ── */}
                <View style={[s.headerBar, { backgroundColor: colors.bg }]}>
                    <View style={{ width: 36 }} />

                    <Text style={[s.headerTitle, { color: colors.text }]}>Profile</Text>
                    <View style={s.rightHeaderBtns}>
                        <TouchableOpacity
                            style={[s.headerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
                                router.push(ROUTES.PREFERENCES)
                            }}
                            activeOpacity={0.75}
                        >
                            <Ionicons name="settings-outline" size={24} color={isDark ? "#FFFFFF" : "#000000"} />
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>

            <ScrollView
                style={[s.container, { backgroundColor: colors.bg }]}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                <View style={{ flex: 1 }}>

                    {/* ── Profile Header Section ── */}
                    <View style={s.profileSection}>
                        <View style={s.avatarInfoRow}>
                            <Pressable
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
                                    openDpPreview();
                                }}
                                onLongPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
                                    openDpPreview();
                                }}
                                delayLongPress={200}
                                style={({ pressed }) => [
                                    s.avatarWrap,
                                    pressed && { opacity: 0.9, transform: [{ scale: 0.96 }] }
                                ]}
                            >
                                <View style={[s.avatar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                    {userImage ? (
                                        <Image source={{ uri: userImage }} style={s.avatarImg} contentFit="cover" />
                                    ) : (
                                        <Text style={[s.avInitials, { color: colors.accent }]}>{initials()}</Text>
                                    )}
                                </View>
                            </Pressable>
                            <View style={s.nameBlock}>
                                <Text style={[s.pname, { color: colors.text }]}>{userName}</Text>
                                <View style={s.unameRow}>
                                    <Text style={[s.uname, { color: colors.textSub }]}>@{userName.toLowerCase().replace(/\s+/g, '')}_rides</Text>
                                    <View style={s.vDot}>
                                        <Ionicons name="checkmark" size={8} color="#fff" />
                                    </View>
                                </View>
                            </View>
                        </View>

                        <Text style={[s.bio, { color: colors.textSub }]}>{userBio}</Text>

                        {/* Dynamic Vibe Tags */}
                        {vibes && vibes.length > 0 && (
                            <View style={s.vibesRow}>
                                {vibes.map((v) => (
                                    <View key={v} style={[s.vibeBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                        <Text style={[s.vibeBadgeText, { color: colors.text }]}>{v}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Stats Row */}
                        <View style={[s.statsRow, { borderColor: colors.border }]}>
                            {STATS.map((st, idx) => (
                                <View key={st.label} style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={s.statCol}>
                                        <View style={s.statValRow}>
                                            <Ionicons name={st.icon as any} size={12} color={colors.accent} style={{ marginRight: 4 }} />
                                            <Text style={[s.statVal, { color: colors.text }]}>{st.val}</Text>
                                        </View>
                                        <Text style={[s.statLbl, { color: colors.textSub }]}>{st.label}</Text>
                                    </View>
                                    {idx < STATS.length - 1 && <View style={[s.statDivider, { backgroundColor: colors.border }]} />}
                                </View>
                            ))}
                        </View>

                        {/* Buttons Row (Edit Profile & Share Profile) */}
                        <View style={s.actionRow}>
                            <TouchableOpacity
                                style={[s.btnEdit, { backgroundColor: colors.accent }]}
                                onPress={() => router.push(ROUTES.EDIT_PROFILE)}
                                activeOpacity={0.85}
                            >
                                <Ionicons name="create-outline" size={15} color="#000" />
                                <Text style={[s.btnEditTxt, { color: "#000" }]}>Edit Profile</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[s.btnShare, { borderColor: colors.border }]}
                                activeOpacity={0.85}
                                onPress={() => setShareVisible(true)}
                            >
                                <Ionicons name="share-social-outline" size={15} color={colors.text} />
                                <Text style={[s.btnShareTxt, { color: colors.text }]}>Share Profile</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* ── Tab Strip ── */}

                    {/* ── Tab Contents ── */}
                    {activeTab === 'grid' && (
                        <View style={s.grid}>
                            {GRID_ITEMS.map((item, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={s.thumb}
                                    activeOpacity={0.8}
                                    onPress={() =>
                                        router.push({
                                            pathname: ROUTES.IMAGE_VIEWER,
                                            params: {
                                                index: i.toString()
                                            }
                                        })
                                    }
                                >
                                    <Image source={{ uri: item.uri }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {activeTab === 'video' && (
                        <View style={s.emptyTab}>
                            <Ionicons name="videocam-outline" size={40} color={colors.iconMuted} />
                            <Text style={[s.emptyTxt, { color: colors.textMuted }]}>No videos yet</Text>
                        </View>
                    )}

                    {activeTab === 'saved' && (
                        <View style={s.emptyTab}>
                            <Ionicons name="bookmark-outline" size={40} color={colors.iconMuted} />
                            <Text style={[s.emptyTxt, { color: colors.textMuted }]}>Nothing saved yet</Text>
                        </View>
                    )}

                </View>
            </ScrollView>

            {/* Custom Bottom Tab Bar overlay — same floating pill as Home */}
            <CustomTabBar activeTab="profile" />


            {/* DP Preview — Instagram-style spring scale pop (no fade on image) */}
            <Modal
                visible={isDpPreviewVisible}
                transparent
                animationType="none"
                statusBarTranslucent
                onRequestClose={closeDpPreview}
            >
                <Reanimated.View style={[s.dpModalOverlay, { backgroundColor: 'rgba(0,0,0,0.93)' }, dpBackdropStyle]}>
                    <Pressable
                        style={StyleSheet.absoluteFillObject}
                        onPress={closeDpPreview}
                    />
                    {/* The avatar springs open — scale only, zero opacity change on the image */}
                    <Reanimated.View style={[s.dpPreviewContainer, dpAvatarStyle]}>
                        {/* Circular avatar — no border, just clean image like Instagram */}
                        <View style={s.dpLargeAvatar}>
                            {userImage ? (
                                <Image
                                    source={{ uri: userImage }}
                                    style={s.dpLargeImg}
                                    contentFit="cover"
                                />
                            ) : (
                                <View style={[s.dpLargeInitialBg, { backgroundColor: colors.surface }]}>
                                    <Text style={[s.dpLargeInitials, { color: colors.accent }]}>{initials()}</Text>
                                </View>
                            )}
                        </View>
                        {/* Name below avatar, appears with the scale pop */}
                        <Text style={[s.dpPreviewName, { color: '#fff' }]}>{userName}</Text>
                        <Text style={[s.dpPreviewUname, { color: 'rgba(255,255,255,0.55)' }]}>
                            @{userName.toLowerCase().replace(/\s+/g, '')}_rides
                        </Text>
                    </Reanimated.View>
                </Reanimated.View>
            </Modal>

            {/* Share Profile Modal */}
            <Modal
                visible={shareVisible}
                transparent
                statusBarTranslucent={true}
                animationType="slide"
                onRequestClose={() => setShareVisible(false)}
            >
                <Pressable
                    style={[s.overlay, { backgroundColor: colors.overlay }]}
                    onPress={() => setShareVisible(false)}
                >
                    <View style={[s.shareSheet, { backgroundColor: colors.modalBg, borderTopWidth: 1, borderColor: colors.border, paddingBottom: Math.max(insets.bottom, 35) }]}>
                        <View style={s.shareHeader}>
                            <Ionicons
                                name="share-social-outline"
                                size={24}
                                color={colors.accent}
                            />
                            <Text style={[s.shareTitle, { color: colors.text }]}>
                                Share Profile
                            </Text>
                        </View>

                        <View style={[s.profileShareCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                            <View style={[s.avatarSmall, { backgroundColor: colors.surface }]}>
                                {userImage ? (
                                    <Image
                                        source={{ uri: userImage }}
                                        style={s.avatarSmallImg}
                                    />
                                ) : (
                                    <Text style={[s.shareInitial, { color: colors.accent }]}>
                                        {initials()}
                                    </Text>
                                )}
                            </View>

                            <Text style={[s.shareUsername, { color: colors.accent }]}>
                                @{userName.toLowerCase().replace(/\s+/g, '')}_rides
                            </Text>
                            <Text style={[s.shareName, { color: colors.text }]}>
                                {userName}
                            </Text>
                        </View>

                        <View style={s.qrBox}>
                            <QRCode
                                value={profileLink}
                                size={130}
                            />
                        </View>

                        <View style={s.shareOptions}>
                            <TouchableOpacity
                                style={s.shareOption}
                                onPress={() => {
                                    Clipboard.setString(profileLink);
                                    Alert.alert("Copied", "Profile link copied");
                                }}
                            >
                                <Ionicons
                                    name="copy-outline"
                                    size={25}
                                    color={colors.accent}
                                />
                                <Text style={{ color: colors.text, fontSize: 11, fontWeight: '600' }}>
                                    Copy Link
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={s.shareOption}>
                                <Ionicons
                                    name="logo-whatsapp"
                                    size={25}
                                    color="#25D366"
                                />
                                <Text style={{ color: colors.text, fontSize: 11, fontWeight: '600' }}>
                                    WhatsApp
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={s.shareOption}>
                                <Ionicons
                                    name="logo-instagram"
                                    size={25}
                                    color="#E1306C"
                                />
                                <Text style={{ color: colors.text, fontSize: 11, fontWeight: '600' }}>
                                    Instagram
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={s.shareOption}>
                                <Ionicons
                                    name="ellipsis-horizontal"
                                    size={25}
                                    color={colors.text}
                                />
                                <Text style={{ color: colors.text, fontSize: 11, fontWeight: '600' }}>
                                    More
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[s.closeShare, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
                            onPress={() => setShareVisible(false)}
                            activeOpacity={0.8}
                        >
                            <Text style={[s.closeShareText, { color: colors.text }]}>
                                Cancel
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>

        </View>
    );
}

/* ─── Styles ─────────────────────────────────────────────────────────── */

const s = StyleSheet.create({
    root: { flex: 1 },

    /* Header */
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    rightHeaderBtns: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    container: { flex: 1 },

    /* Profile Header Section */
    profileSection: { paddingHorizontal: 16, paddingTop: 12 },
    avatarInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
    avatarWrap: { position: 'relative', flexShrink: 0 },
    avatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 2.5,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImg: {
        width: '100%',
        height: '100%',
        borderRadius: 45,
    },
    avInitials: {
        fontSize: 30,
        fontWeight: '800'
    },
    camBadge: {
        position: 'absolute',
        bottom: 1,
        right: 1,
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nameBlock: { flex: 1 },
    pname: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
    unameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    uname: { fontSize: 12, fontWeight: '500' },
    vDot: { width: 15, height: 15, borderRadius: 8, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
    bio: { fontSize: 13, lineHeight: 20, marginBottom: 16 },

    /* Stats Row */
    statsRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        marginVertical: 6,
    },
    statCol: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statValRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    statVal: {
        fontSize: 16,
        fontWeight: '800',
    },
    statLbl: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    statDivider: {
        width: 1,
        height: 20,
    },

    /* Action Buttons Row */
    actionRow: { flexDirection: 'row', gap: 10, marginTop: 12, marginBottom: 8 },
    btnEdit: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderRadius: 12,
        paddingVertical: 12,
    },
    btnEditTxt: { fontSize: 13, fontWeight: '700' },
    btnShare: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderWidth: 1.5,
        borderRadius: 12,
        paddingVertical: 12,
    },
    btnShareTxt: { fontSize: 13, fontWeight: '700' },

    /* Grid */
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 2,
        paddingHorizontal: 0,
        paddingTop: 2,
    },
    thumb: {
        width: THUMB,
        height: THUMB,
        borderRadius: 0,
        overflow: 'hidden',
    },
    emptyTab: { alignItems: 'center', paddingTop: 60, gap: 12 },
    emptyTxt: { fontSize: 13, fontWeight: '600' },
    vibesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4,
        marginBottom: 10,
    },
    vibeBadge: {
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    vibeBadgeText: {
        fontSize: 12,
        fontWeight: '500',
    },


    overlay: {
        flex: 1,
        justifyContent: "flex-end"
    },

    shareSheet: {
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 22,
        paddingBottom: 35,
        alignItems: "center"
    },

    profileShareCard: {
        width: "100%",
        borderRadius: 22,
        padding: 18,
        alignItems: "center"
    },

    avatarSmall: {
        width: 70,
        height: 70,
        borderRadius: 35,
        overflow: "hidden",
        justifyContent: "center",
        alignItems: "center"
    },

    avatarSmallImg: {
        width: "100%",
        height: "100%"
    },

    shareInitial: {
        fontSize: 25,
        fontWeight: "800"
    },

    shareName: {
        fontSize: 18,
        fontWeight: "800",
        marginTop: 10
    },

    qrBox: {
        backgroundColor: "white",
        padding: 15,
        borderRadius: 20,
        marginVertical: 20
    },

    shareOptions: {
        flexDirection: "row",
        justifyContent: "space-around",
        width: "100%"
    },

    shareOption: {
        alignItems: "center",
        gap: 8
    },

    closeShare: {
        marginTop: 20,
        width: "100%",
        padding: 14,
        borderRadius: 18,
        alignItems: "center"
    },
    shareHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 18,
    },

    shareTitle: {
        fontSize: 20,
        fontWeight: "800",
    },
    shareUsername: {
        fontSize: 14,
        fontWeight: "700",
        marginTop: 10,
    },

    closeShareText: {
        fontSize: 15,
        fontWeight: "700",
    },

    /* DP Preview — Instagram-style spring pop */
    dpModalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dpPreviewContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
    },
    dpLargeAvatar: {
        // Exact square then borderRadius makes perfect circle — no border
        width: SW * 0.82,
        height: SW * 0.82,
        borderRadius: (SW * 0.82) / 2,
        overflow: 'hidden',
        // Deep shadow for depth
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.6,
        shadowRadius: 24,
        elevation: 20,
    },
    dpLargeInitialBg: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dpLargeImg: {
        width: '100%',
        height: '100%',
    },
    dpLargeInitials: {
        fontSize: 80,
        fontWeight: '900',
    },
    dpPreviewName: {
        fontSize: 22,
        fontWeight: '800',
        marginTop: 4,
    },
    dpPreviewUname: {
        fontSize: 14,
        fontWeight: '600',
    },
});
