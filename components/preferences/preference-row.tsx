import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

type BaseProps = {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    isDanger?: boolean;
    isLast?: boolean;
};

type NavigateRow = BaseProps & {
    type?: "navigate";
    onPress: () => void;
    value?: never;
    onValueChange?: never;
};

type ToggleRow = BaseProps & {
    type: "toggle";
    value: boolean;
    onValueChange: (val: boolean) => void;
    onPress?: never;
};

export type PreferenceRowProps = NavigateRow | ToggleRow;

// ─── Component ────────────────────────────────────────────────────────────────

export function PreferenceRow({
    icon,
    title,
    subtitle,
    isDanger = false,
    isLast = false,
    type = "navigate",
    value,
    onValueChange,
    onPress,
}: PreferenceRowProps) {
    const iconColor = isDanger ? "#F87171" : "#FFFFFF";

    const inner = (
        <View style={[styles.row, isLast && styles.lastRow]}>
            <Ionicons name={icon} size={20} color={iconColor} />

            <View style={styles.textWrap}>
                <Text style={[styles.title, isDanger && styles.titleDanger]}>
                    {title}
                </Text>
                {subtitle ? (
                    <Text style={styles.subtitle}>{subtitle}</Text>
                ) : null}
            </View>

            {type === "toggle" ? (
                <Switch
                    value={value}
                    onValueChange={onValueChange}
                    trackColor={{ false: "#1C1C30", true: "#8B5CF650" }}
                    thumbColor={value ? "#B46CFF" : "#3A3A50"}
                    ios_backgroundColor="#1C1C30"
                />
            ) : (
                <Ionicons
                    name="chevron-forward"
                    size={16}
                    color="rgba(255,255,255,0.35)"
                />
            )}
        </View>
    );

    if (type === "toggle") {
        return inner;
    }

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.6}>
            {inner}
        </TouchableOpacity>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 18,
        paddingVertical: 15,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "rgba(255,255,255,0.05)",
        gap: 14,
    },
    lastRow: {
        borderBottomWidth: 0,
    },
    textWrap: {
        flex: 1,
    },
    title: {
        color: "#D8D8EC",
        fontSize: 15,
        fontWeight: "500",
        letterSpacing: 0.1,
    },
    titleDanger: {
        color: "#F87171",
    },
    subtitle: {
        color: "#4A4A65",
        fontSize: 12,
        marginTop: 2,
    },
});