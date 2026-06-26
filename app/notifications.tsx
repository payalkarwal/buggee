import { useAppTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    FlatList,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const notifications = [
    {
        id: "1",
        icon: "car-sport-outline",
        title: "Your ride is confirmed ",
        message: "Your Buggee captain will arrive in 3 mins. Get ready!",
        time: "2 min ago",
    },
    {
        id: "2",
        icon: "navigate-outline",
        title: "Captain is on the way",
        message: "Your driver has started the trip and is heading to your pickup location.",
        time: "5 min ago",
    },
    {
        id: "3",
        icon: "pricetag-outline",
        title: "Special offer unlocked ",
        message: "Save ₹50 on your next ride. Offer valid for today only.",
        time: "1 hour ago",
    },
    {
        id: "4",
        icon: "star-outline",
        title: "Rate your recent ride",
        message: "Your feedback helps us improve every Buggee experience.",
        time: "Yesterday",
    },
    {
        id: "5",
        icon: "shield-checkmark-outline",
        title: "Safety check complete",
        message: "Your ride details and captain information are verified.",
        time: "Yesterday",
    },
    {
        id: "6",
        icon: "wallet-outline",
        title: "Payment successful",
        message: "₹249 has been paid for your last ride.",
        time: "Yesterday",
    },
];

export default function Notifications() {
    const router = useRouter();
    const { colors, isDark } = useAppTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.bg }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />
            <SafeAreaView edges={["top"]} style={{ flex: 1 }}>

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={[styles.back, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                        <Ionicons
                            name="arrow-back"
                            size={20}
                            color={colors.accent}
                        />
                    </TouchableOpacity>

                    <Text style={[styles.heading, { color: colors.text }]}>
                        Notifications
                    </Text>

                    <View style={{ width: 35 }} />
                </View>

                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{
                        paddingBottom: 20,
                    }}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.notificationRow,
                                {
                                    borderBottomColor: colors.border
                                }
                            ]}
                        >

                            <View
                                style={[
                                    styles.iconBox,
                                    {
                                        backgroundColor: isDark
                                            ? "rgba(212,176,34,0.15)"
                                            : "rgba(0,0,0,0.06)"
                                    }
                                ]}
                            >
                                <Ionicons
                                    name={item.icon as any}
                                    size={22}
                                    color={isDark ? "#D4B022" : "#000000"}
                                />
                            </View>


                            <View style={styles.textContainer}>

                                <Text
                                    style={[styles.title, { color: colors.text }]}
                                    numberOfLines={1}
                                >
                                    {item.title}
                                </Text>

                                <Text
                                    style={[styles.message, { color: colors.textSub }]}
                                    numberOfLines={2}
                                >
                                    {item.message}
                                </Text>

                            </View>


                            <Text style={[styles.time, { color: colors.textMuted }]}>
                                {item.time}
                            </Text>


                        </TouchableOpacity>
                    )}
                />
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16
    },
    back: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center"
    },
    heading: {
        fontSize: 18,
        fontWeight: "800"
    },
    notificationRow: {
        flexDirection: "row",
        alignItems: "center",

        paddingVertical: 16,
        paddingHorizontal: 16,

        borderBottomWidth: 1,

        gap: 14,
    },


    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 22,

        justifyContent: "center",
        alignItems: "center",

        flexShrink: 0,
    },


    textContainer: {
        flex: 1,
    },


    title: {
        fontSize: 15,
        fontWeight: "700",
    },


    message: {
        fontSize: 13,
        marginTop: 4,
        lineHeight: 18,
    },


    time: {
        width: 65,

        textAlign: "right",

        fontSize: 11,
        fontWeight: "500",

        marginLeft: 8,
    },

});

