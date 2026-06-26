import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/context/ThemeContext';

export default function Preferences() {
    const router = useRouter();
    const { isDark, colors, setDark } = useAppTheme();

    // Toggle States
    const [locationAccess, setLocationAccess] = useState(true);

    // Modal States
    const [logoutVisible, setLogoutVisible] = useState(false);
    const [deleteVisible, setDeleteVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    // Toggle Handler
    const toggleSwitch = (setting: string, val: boolean, setter: (v: boolean) => void) => {
        setter(val);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
    };

    // Confirm Logout Action
    const handleLogout = async () => {
        setLoading(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
        try {
            // Simulate clearing auth data
            await AsyncStorage.removeItem("buggee_profile");
            await AsyncStorage.removeItem("userLocation");
            setTimeout(() => {
                setLoading(false);
                setLogoutVisible(false);
                router.replace(ROUTES.HOME);
            }, 1000);
        } catch (error) {
            setLoading(false);
            setLogoutVisible(false);
            console.error("Error logging out:", error);
        }
    };

    // Confirm Delete Account Action
    const handleDeleteAccount = async () => {
        setLoading(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => { });
        try {
            // Clear all data
            await AsyncStorage.clear();
            setTimeout(() => {
                setLoading(false);
                setDeleteVisible(false);
                Alert.alert("Account Deleted", "Your account and all associated data have been permanently deleted.", [
                    {
                        text: "OK",
                        onPress: () => router.replace(ROUTES.HOME),
                    },
                ]);
            }, 1200);
        } catch (error) {
            setLoading(false);
            setDeleteVisible(false);
            console.error("Error deleting account:", error);
        }
    };

    return (
        <View style={[s.container, { backgroundColor: colors.bg }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />
            <SafeAreaView edges={["top"]} style={{ flex: 1 }}>

                {/* ── Header Bar ── */}
                <View style={s.header}>
                    <TouchableOpacity
                        style={[s.circle, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
                            router.replace(ROUTES.PROFILE);
                        }}
                    >
                        <Ionicons name="arrow-back" size={18} color={colors.accent} />
                    </TouchableOpacity>
                    <Text style={[s.title, { color: colors.text }]}>Settings</Text>
                    <View style={{ width: 36 }} />
                </View>

                {/* ── Scrollable Settings List ── */}
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 40 }}
                >

                    {/* SECTION 1: ACCOUNT & PROFILE */}
                    <Text style={[s.sectionHeader, { color: colors.textSub }]}>Account Settings</Text>
                    <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Item
                            icon="person-outline"
                            iconColor={colors.accent}
                            title="Personal Information"
                            sub="Update name, email, phone number"
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
                                router.push(ROUTES.EDIT_PROFILE);
                            }}
                        />
                        <Item
                            icon="card-outline"
                            iconColor={colors.accent}
                            title="Payment Methods"
                            sub="Manage cards, wallets, and UPI"
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
                                Alert.alert("Payment Methods", "Payment integrations are configured in billing setup.", [{ text: "OK" }]);
                            }}
                        />
                        <Item
                            icon="location-outline"
                            iconColor={colors.accent}
                            title="Saved Addresses"
                            sub="Home, work, and frequent destinations"
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
                                Alert.alert("Saved Addresses", "Manage your frequent destinations on checkout.", [{ text: "OK" }]);
                            }}
                            isLast
                        />
                    </View>

                    {/* SECTION 2: SECURITY & PRIVACY */}
                    <Text style={[s.sectionHeader, { color: colors.textSub }]}>Security & Privacy</Text>
                    <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Item
                            icon="shield-checkmark-outline"
                            iconColor={colors.accent}
                            title="Security Settings"
                            sub="Change password, enable two-factor auth"
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
                                Alert.alert("Security Settings", "Two-factor authentication is active on this device.", [{ text: "OK" }]);
                            }}
                        />

                        <View style={[s.rowItem, s.lastItem]}>
                            <Ionicons name="navigate-outline" size={20} color={isDark ? "white" : "black"} />
                            <View style={s.itemBody}>
                                <Text style={[s.itemTitle, { color: colors.text }]}>Location Access</Text>
                                <Text style={[s.itemSub, { color: colors.textSub }]}>Allow real-time ride tracking</Text>
                            </View>
                            <Switch
                                value={locationAccess}
                                onValueChange={(val) => toggleSwitch("locationAccess", val, setLocationAccess)}
                                trackColor={{ false: colors.border, true: colors.accentDim }}
                                thumbColor={locationAccess ? colors.accent : colors.iconMuted}
                            />
                        </View>
                    </View>

                    {/* SECTION 3: APP PREFERENCES */}
                    <Text style={[s.sectionHeader, { color: colors.textSub }]}>App Preferences</Text>
                    <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Item
                            icon="notifications-outline"
                            iconColor={colors.accent}
                            title="Push Notifications"
                            sub="Ride status, promotions & alerts"
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
                                router.push(ROUTES.NOTIFICATIONS);
                            }}
                        />
                        <Item
                            icon="language-outline"
                            iconColor={colors.accent}
                            title="Language"
                            sub="English (US) / हिंदी"
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
                                Alert.alert("Language Settings", "Language selection is currently set to English.", [{ text: "OK" }]);
                            }}
                        />
                        <View style={[s.rowItem, s.lastItem]}>
                            <Ionicons name="moon-outline" size={20} color={isDark ? "white" : "black"} />
                            <View style={s.itemBody}>
                                <Text style={[s.itemTitle, { color: colors.text }]}>Dark Mode</Text>
                                <Text style={[s.itemSub, { color: colors.textSub }]}>Yellow & Black battery saver theme</Text>
                            </View>
                            <Switch
                                value={isDark}
                                onValueChange={(val) => {
                                    setDark(val);
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
                                }}
                                trackColor={{ false: colors.border, true: colors.accentDim }}
                                thumbColor={isDark ? colors.accent : colors.iconMuted}
                            />
                        </View>
                    </View>

                    {/* SECTION 4: ACTIONS / DANGER ZONE */}
                    <Text style={[s.sectionHeader, { color: colors.textSub }]}>Account Actions</Text>
                    <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Item
                            icon="log-out-outline"
                            iconColor={colors.danger}
                            title="Log Out"
                            titleColor={colors.danger}
                            sub="Sign out from this device"
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
                                setLogoutVisible(true);
                            }}
                        />
                        <Item
                            icon="trash-outline"
                            iconColor={colors.danger}
                            title="Delete Account"
                            titleColor={colors.danger}
                            sub="Permanently erase your profile data"
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => { });
                                setDeleteVisible(true);
                            }}
                            isLast
                        />
                    </View>

                </ScrollView>
            </SafeAreaView>

            {/* ── Modal Dialog: Log Out ── */}
            <Modal
                visible={logoutVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setLogoutVisible(false)}
            >
                <View style={[s.modalOverlay, { backgroundColor: colors.overlay }]}>
                    <TouchableOpacity
                        style={StyleSheet.absoluteFillObject}
                        activeOpacity={1}
                        onPress={() => setLogoutVisible(false)}
                    />
                    <View style={[s.modalBox, { backgroundColor: colors.modalBg, borderColor: colors.border }]}>
                        <View style={[s.modalIconWrap, { backgroundColor: colors.dangerDim }]}>
                            <Ionicons name="log-out" size={28} color={colors.danger} />
                        </View>
                        <Text style={[s.modalTitle, { color: colors.text }]}>Log Out</Text>
                        <Text style={[s.modalText, { color: colors.textSub }]}>
                            Are you sure you want to log out of your Buggee account? You will need to log back in to book rides.
                        </Text>

                        {loading ? (
                            <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 15 }} />
                        ) : (
                            <View style={s.modalBtnRow}>
                                <TouchableOpacity
                                    style={[s.modalCancelBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
                                        setLogoutVisible(false);
                                    }}
                                    activeOpacity={0.75}
                                >
                                    <Text style={[s.modalCancelTxt, { color: colors.textSub }]}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={s.modalConfirmBtn}
                                    onPress={handleLogout}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={[colors.danger, "#B91C1C"]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={s.gradientBtn}
                                    >
                                        <Text style={s.modalConfirmTxt}>Log Out</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            {/* ── Modal Dialog: Delete Account ── */}
            <Modal
                visible={deleteVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setDeleteVisible(false)}
            >
                <View style={[s.modalOverlay, { backgroundColor: colors.overlay }]}>
                    <TouchableOpacity
                        style={StyleSheet.absoluteFillObject}
                        activeOpacity={1}
                        onPress={() => setDeleteVisible(false)}
                    />
                    <View style={[s.modalBox, { backgroundColor: colors.modalBg, borderColor: colors.border }]}>
                        <View style={[s.modalIconWrap, { backgroundColor: colors.dangerDim, borderColor: colors.danger, borderWidth: 1 }]}>
                            <Ionicons name="warning-outline" size={28} color={colors.danger} />
                        </View>
                        <Text style={[s.modalTitle, { color: colors.danger }]}>Delete Account?</Text>
                        <Text style={[s.modalText, { color: colors.textSub }]}>
                            This action is permanent and cannot be undone. You will lose your travel history, ratings, reviews, and saved addresses.
                        </Text>

                        {loading ? (
                            <ActivityIndicator size="small" color={colors.danger} style={{ marginVertical: 15 }} />
                        ) : (
                            <View style={s.modalBtnRow}>
                                <TouchableOpacity
                                    style={[s.modalCancelBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
                                        setDeleteVisible(false);
                                    }}
                                    activeOpacity={0.75}
                                >
                                    <Text style={[s.modalCancelTxt, { color: colors.textSub }]}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={s.modalConfirmBtn}
                                    onPress={handleDeleteAccount}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={["#B91C1C", "#991B1B"]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={s.gradientBtn}
                                    >
                                        <Text style={s.modalConfirmTxt}>Delete</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// Subcomponent: Navigation/Action item
interface ItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    title: string;
    titleColor?: string;
    sub: string;
    onPress: () => void;
    isLast?: boolean;
}

function Item({ icon, title, titleColor, sub, onPress, isLast }: ItemProps) {
    const { colors, isDark } = useAppTheme();

    return (
        <TouchableOpacity
            style={[s.rowItem, isLast && s.lastItem, { borderBottomColor: colors.borderSub }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Ionicons name={icon} size={20} color={isDark ? "white" : "black"} />
            <View style={s.itemBody}>
                <Text style={[s.itemTitle, { color: titleColor || colors.text }]}>
                    {title}
                </Text>
                <Text style={[s.itemSub, { color: colors.textSub }]}>{sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.iconMuted} />
        </TouchableOpacity>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 10,
        marginBottom: 10,
    },
    title: {
        fontSize: 17,
        fontWeight: "800",
        letterSpacing: 0.3,
    },
    circle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    sectionHeader: {
        fontSize: 11,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 1.2,
        marginTop: 22,
        marginBottom: 10,
        paddingHorizontal: 4,
    },
    card: {
        borderRadius: 18,
        borderWidth: 1,
        overflow: "hidden",
    },
    rowItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 15,
        borderBottomWidth: 1,
        gap: 14,
    },
    lastItem: {
        borderBottomWidth: 0,
    },
    iconBox: {
        width: 42,
        height: 42,
        borderRadius: 13,
        justifyContent: "center",
        alignItems: "center",
        flexShrink: 0,
    },
    itemBody: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 15,
        fontWeight: "600",
    },
    itemSub: {
        fontSize: 12,
        marginTop: 2,
        fontWeight: "400",
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    modalBox: {
        width: "100%",
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        alignItems: "center",
    },
    modalIconWrap: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 19,
        fontWeight: "800",
        marginBottom: 8,
        letterSpacing: 0.2,
    },
    modalText: {
        fontSize: 14,
        textAlign: "center",
        lineHeight: 20,
        marginBottom: 24,
        paddingHorizontal: 8,
    },
    modalBtnRow: {
        flexDirection: "row",
        width: "100%",
        gap: 12,
    },
    modalCancelBtn: {
        flex: 1,
        height: 48,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
    },
    modalCancelTxt: {
        fontSize: 14,
        fontWeight: "700",
    },
    modalConfirmBtn: {
        flex: 1,
        height: 48,
        borderRadius: 14,
        overflow: "hidden",
    },
    gradientBtn: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
    },
    modalConfirmTxt: {
        color: "white",
        fontSize: 14,
        fontWeight: "700",
    },
});