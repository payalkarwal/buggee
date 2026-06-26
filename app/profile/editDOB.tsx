import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    BackHandler,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppTheme } from "@/context/ThemeContext";

const STORAGE_KEY = "buggee_profile";

const monthsList = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const weekdaysShort = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function EditDOB() {
    const router = useRouter();
    const { colors, isDark } = useAppTheme();
    const [dob, setDob] = useState(new Date(2003, 5, 12));
    const [calendarDate, setCalendarDate] = useState(new Date(2003, 5, 12));
    const [activeCalendarMonth, setActiveCalendarMonth] = useState(new Date(2003, 5, 12));
    const [calendarViewMode, setCalendarViewMode] = useState<"days" | "months" | "years">("days");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useFocusEffect(
        useCallback(() => {
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

    useEffect(() => {
        const loadDOB = async () => {
            try {
                const raw = await AsyncStorage.getItem(STORAGE_KEY);
                if (raw) {
                    const saved = JSON.parse(raw);
                    if (saved.dob) {
                        const parsedDate = new Date(saved.dob);
                        setDob(parsedDate);
                        setCalendarDate(parsedDate);
                        setActiveCalendarMonth(parsedDate);
                    }
                }
            } catch (err) {
                console.error("Error loading DOB:", err);
            }
        };
        loadDOB();
    }, []);

    const getDaysInMonth = (month: number, year: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (month: number, year: number) => {
        return new Date(year, month, 1).getDay();
    };

    const handlePrevMonth = () => {
        const d = new Date(activeCalendarMonth);
        d.setMonth(d.getMonth() - 1);
        setActiveCalendarMonth(d);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
    };

    const handleNextMonth = () => {
        const d = new Date(activeCalendarMonth);
        d.setMonth(d.getMonth() + 1);
        const today = new Date();
        if (d.getFullYear() < today.getFullYear() || (d.getFullYear() === today.getFullYear() && d.getMonth() <= today.getMonth())) {
            setActiveCalendarMonth(d);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
        }
    };

    const yearsList: number[] = [];
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1940; y--) {
        yearsList.push(y);
    }

    const handleSave = async () => {
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
                dob: calendarDate.toISOString(),
            };

            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });

            setTimeout(() => {
                setLoading(false);
                router.back();
            }, 500);
        } catch (err) {
            console.error("Error saving DOB:", err);
            setLoading(false);
            setError("Failed to save changes. Please try again.");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { });
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.bg }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />

            <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
                            router.back();
                        }}
                        style={[styles.circle, { backgroundColor: colors.card, borderColor: colors.border }]}
                        activeOpacity={0.75}
                    >
                        <Ionicons name="arrow-back" size={18} color={colors.accent} />
                    </TouchableOpacity>

                    <Text style={[styles.heading, { color: colors.text }]}>Date of Birth</Text>

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
                    contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, alignItems: "center" }}
                >
                    {/* Selected DOB Display */}
                    <View style={[styles.displayContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.displaySubLabel, { color: colors.textMuted }]}>SELECTED DATE OF BIRTH</Text>
                        <Text style={[styles.displayVal, { color: colors.text }]}>
                            {calendarDate.toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </Text>
                    </View>

                    {/* Interactive Calendar Widget */}
                    <View style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {/* Navigation Header */}
                        <View style={styles.calendarNavRow}>
                            {calendarViewMode === "days" ? (
                                <TouchableOpacity
                                    onPress={handlePrevMonth}
                                    style={[styles.calendarNavBtn, { backgroundColor: colors.surface }]}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="chevron-back" size={18} color={colors.text} />
                                </TouchableOpacity>
                            ) : <View style={{ width: 36 }} />}

                            <View style={styles.calendarNavCenter}>
                                <TouchableOpacity
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
                                        setCalendarViewMode(calendarViewMode === "months" ? "days" : "months");
                                    }}
                                    style={[
                                        styles.calendarNavTab,
                                        { backgroundColor: colors.surface },
                                        calendarViewMode === "months" && [styles.calendarNavTabActive, { borderColor: colors.accent, backgroundColor: colors.accentDim }]
                                    ]}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[
                                        styles.calendarNavTabText,
                                        { color: colors.textSub },
                                        calendarViewMode === "months" && [styles.calendarNavTabTextActive, { color: colors.accent }]
                                    ]}>
                                        {monthsList[activeCalendarMonth.getMonth()]} ▾
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
                                        setCalendarViewMode(calendarViewMode === "years" ? "days" : "years");
                                    }}
                                    style={[
                                        styles.calendarNavTab,
                                        { backgroundColor: colors.surface },
                                        calendarViewMode === "years" && [styles.calendarNavTabActive, { borderColor: colors.accent, backgroundColor: colors.accentDim }]
                                    ]}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[
                                        styles.calendarNavTabText,
                                        { color: colors.textSub },
                                        calendarViewMode === "years" && [styles.calendarNavTabTextActive, { color: colors.accent }]
                                    ]}>
                                        {activeCalendarMonth.getFullYear()} ▾
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {calendarViewMode === "days" ? (
                                <TouchableOpacity
                                    onPress={handleNextMonth}
                                    style={[styles.calendarNavBtn, { backgroundColor: colors.surface }]}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="chevron-forward" size={18} color={colors.text} />
                                </TouchableOpacity>
                            ) : <View style={{ width: 36 }} />}
                        </View>

                        {/* Calendar Body */}
                        <View style={styles.calendarBody}>
                            {calendarViewMode === "days" && (
                                <View>
                                    {/* Weekday headers */}
                                    <View style={styles.calendarWeekdays}>
                                        {weekdaysShort.map((wk) => (
                                            <Text key={wk} style={[styles.calendarWeekdayText, { color: colors.textMuted }]}>
                                                {wk}
                                            </Text>
                                        ))}
                                    </View>

                                    {/* Days Grid */}
                                    <View style={styles.calendarDaysGrid}>
                                        {(() => {
                                            const year = activeCalendarMonth.getFullYear();
                                            const month = activeCalendarMonth.getMonth();
                                            const totalDays = getDaysInMonth(month, year);
                                            const firstDayIndex = getFirstDayOfMonth(month, year);
                                            const today = new Date();

                                            const cells = [];
                                            // Render blank offsets
                                            for (let i = 0; i < firstDayIndex; i++) {
                                                cells.push(
                                                    <View key={`offset-${i}`} style={styles.calendarDayCellEmpty} />
                                                );
                                            }

                                            // Render month days
                                            for (let d = 1; d <= totalDays; d++) {
                                                const cellDate = new Date(year, month, d);
                                                const isFuture = cellDate.getTime() > today.getTime();
                                                const isSelected =
                                                    calendarDate.getDate() === d &&
                                                    calendarDate.getMonth() === month &&
                                                    calendarDate.getFullYear() === year;

                                                cells.push(
                                                    <TouchableOpacity
                                                        key={`day-${d}`}
                                                        disabled={isFuture}
                                                        onPress={() => {
                                                            const newDate = new Date(year, month, d);
                                                            setCalendarDate(newDate);
                                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
                                                        }}
                                                        style={[
                                                            styles.calendarDayCell,
                                                            isSelected && styles.calendarDayCellSelected,
                                                            isFuture && styles.calendarDayCellDisabled
                                                        ]}
                                                        activeOpacity={0.7}
                                                    >
                                                        {isSelected ? (
                                                            <LinearGradient
                                                                colors={[colors.accent, "#D4B022"]}
                                                                style={styles.calendarSelectedGradient}
                                                            >
                                                                <Text style={[styles.calendarDayTextSelected, { color: "#000" }]}>
                                                                    {d}
                                                                </Text>
                                                            </LinearGradient>
                                                        ) : (
                                                            <Text style={[
                                                                styles.calendarDayText,
                                                                { color: colors.text },
                                                                isFuture && [styles.calendarDayTextDisabled, { color: colors.textMuted }]
                                                            ]}>
                                                                {d}
                                                            </Text>
                                                        )}
                                                    </TouchableOpacity>
                                                );
                                            }
                                            return cells;
                                        })()}
                                    </View>
                                </View>
                            )}

                            {calendarViewMode === "months" && (
                                <View style={styles.calendarMonthsGrid}>
                                    {monthsList.map((m, index) => {
                                        const isCurrent = activeCalendarMonth.getMonth() === index;
                                        return (
                                            <TouchableOpacity
                                                key={m}
                                                onPress={() => {
                                                    const d = new Date(activeCalendarMonth);
                                                    d.setMonth(index);
                                                    setActiveCalendarMonth(d);
                                                    setCalendarViewMode("days");
                                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
                                                }}
                                                style={[
                                                    styles.calendarMonthPill,
                                                    { backgroundColor: colors.surface },
                                                    isCurrent && [styles.calendarMonthPillActive, { borderColor: colors.accent, backgroundColor: colors.accentDim }]
                                                ]}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={[
                                                    styles.calendarMonthPillText,
                                                    { color: colors.textSub },
                                                    isCurrent && [styles.calendarMonthPillTextActive, { color: colors.accent }]
                                                ]}>
                                                    {m.substring(0, 3)}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            )}

                            {calendarViewMode === "years" && (
                                <ScrollView
                                    style={styles.calendarYearsScroll}
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={styles.calendarYearsGrid}
                                >
                                    {yearsList.map((y) => {
                                        const isCurrent = activeCalendarMonth.getFullYear() === y;
                                        return (
                                            <TouchableOpacity
                                                key={y}
                                                onPress={() => {
                                                    const d = new Date(activeCalendarMonth);
                                                    d.setFullYear(y);
                                                    setActiveCalendarMonth(d);
                                                    setCalendarViewMode("days");
                                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
                                                }}
                                                style={[
                                                    styles.calendarYearPill,
                                                    { backgroundColor: colors.surface },
                                                    isCurrent && [styles.calendarYearPillActive, { borderColor: colors.accent, backgroundColor: colors.accentDim }]
                                                ]}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={[
                                                    styles.calendarYearPillText,
                                                    { color: colors.textSub },
                                                    isCurrent && [styles.calendarYearPillTextActive, { color: colors.accent }]
                                                ]}>
                                                    {y}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            )}
                        </View>
                    </View>

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <Text style={[styles.helperText, { color: colors.textSub }]}>
                        Providing your correct date of birth ensures you are eligible for carpooling rides on Buggee. This information is private and not shared with other users.
                    </Text>
                </ScrollView>
            </SafeAreaView>
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
        width: "100%",
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
    displayContainer: {
        backgroundColor: "#0C0C1E",
        borderRadius: 18,
        padding: 16,
        borderWidth: 1.5,
        borderColor: "rgba(255, 255, 255, 0.03)",
        width: "100%",
        marginBottom: 20,
        alignItems: "center",
    },
    displaySubLabel: {
        color: "#666",
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 1,
        marginBottom: 6,
    },
    displayVal: {
        color: "white",
        fontSize: 20,
        fontWeight: "800",
    },
    calendarCard: {
        width: "100%",
        backgroundColor: "#0C0C1E",
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: "rgba(255, 255, 255, 0.06)",
        padding: 20,
        overflow: "hidden",
    },
    calendarNavRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 15,
    },
    calendarNavBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#15152A",
        justifyContent: "center",
        alignItems: "center",
    },
    calendarNavCenter: {
        flexDirection: "row",
        gap: 8,
    },
    calendarNavTab: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        backgroundColor: "#15152A",
        borderWidth: 1,
        borderColor: "transparent",
    },
    calendarNavTabActive: {
        borderColor: "#8B5CF6",
        backgroundColor: "rgba(139, 92, 246, 0.1)",
    },
    calendarNavTabText: {
        color: "#a0a0b0",
        fontSize: 13,
        fontWeight: "600",
    },
    calendarNavTabTextActive: {
        color: "#B46CFF",
        fontWeight: "700",
    },
    calendarBody: {
        minHeight: 220,
        justifyContent: "center",
    },
    calendarWeekdays: {
        flexDirection: "row",
        marginBottom: 8,
    },
    calendarWeekdayText: {
        width: "14.28%",
        textAlign: "center",
        color: "#555570",
        fontSize: 12,
        fontWeight: "700",
    },
    calendarDaysGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        rowGap: 6,
    },
    calendarDayCell: {
        width: "14.28%",
        height: 38,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 19,
    },
    calendarDayCellEmpty: {
        width: "14.28%",
        height: 38,
    },
    calendarDayCellSelected: {
        overflow: "hidden",
    },
    calendarSelectedGradient: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 19,
    },
    calendarDayCellDisabled: {
        opacity: 0.25,
    },
    calendarDayText: {
        color: "#ddd",
        fontSize: 14,
        fontWeight: "500",
    },
    calendarDayTextSelected: {
        color: "white",
        fontSize: 14,
        fontWeight: "700",
    },
    calendarDayTextDisabled: {
        color: "#333",
    },
    calendarMonthsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        justifyContent: "center",
    },
    calendarMonthPill: {
        width: "30%",
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: "#15152A",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "transparent",
    },
    calendarMonthPillActive: {
        borderColor: "#8B5CF6",
        backgroundColor: "rgba(139, 92, 246, 0.15)",
    },
    calendarMonthPillText: {
        color: "#8a8a9a",
        fontSize: 14,
        fontWeight: "600",
    },
    calendarMonthPillTextActive: {
        color: "#B46CFF",
        fontWeight: "700",
    },
    calendarYearsScroll: {
        height: 210,
    },
    calendarYearsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        justifyContent: "center",
        paddingVertical: 4,
    },
    calendarYearPill: {
        width: "30%",
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: "#15152A",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "transparent",
    },
    calendarYearPillActive: {
        borderColor: "#8B5CF6",
        backgroundColor: "rgba(139, 92, 246, 0.15)",
    },
    calendarYearPillText: {
        color: "#8a8a9a",
        fontSize: 14,
        fontWeight: "600",
    },
    calendarYearPillTextActive: {
        color: "#B46CFF",
        fontWeight: "700",
    },
    errorText: {
        color: "#FF4D4F",
        fontSize: 12,
        marginTop: 15,
        fontWeight: "500",
    },
    helperText: {
        color: "#555570",
        fontSize: 12,
        marginTop: 20,
        marginHorizontal: 6,
        lineHeight: 18,
        fontWeight: "500",
        textAlign: "center",
    },
});
