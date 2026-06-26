import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useRouter, useFocusEffect } from "expo-router";
import { useState, useCallback } from "react";

import {
    BackHandler,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { ROUTES } from '@/constants/routes';
import { useAppTheme } from "@/context/ThemeContext";

const STORAGE_KEY = "buggee_profile";


export default function EditGender() {
    const router = useRouter();
    const { colors, isDark } = useAppTheme();
    const [gender, setGender] = useState("Male");

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



    const saveGender = async () => {


        const old =
            await AsyncStorage.getItem(STORAGE_KEY);


        const data = old ? JSON.parse(old) : {};


        await AsyncStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                ...data,
                gender
            })
        );



        router.replace(ROUTES.EDIT_PROFILE);


    }



    return (

        <View style={[styles.container, { backgroundColor: colors.bg }]}>


            <SafeAreaView>


                <View style={styles.header}>


                    <TouchableOpacity
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
                            router.replace(ROUTES.EDIT_PROFILE);
                        }}
                    >

                        <Ionicons
                            name="arrow-back"
                            size={24}
                            color={colors.accent}
                        />

                    </TouchableOpacity>



                    <Text style={[styles.title, { color: colors.text }]}>
                        Gender
                    </Text>



                    <TouchableOpacity
                        onPress={saveGender}
                    >

                        <Ionicons
                            name="checkmark"
                            size={28}
                            color={colors.accent}
                        />

                    </TouchableOpacity>


                </View>





                {["Male", "Female", "Other"].map((item) => (


                    <TouchableOpacity

                        key={item}

                        style={[
                            styles.option,
                            { backgroundColor: colors.card, borderColor: colors.border },
                            gender === item && [styles.active, { borderColor: colors.accent, backgroundColor: colors.accentDim }]
                        ]}

                        onPress={() => setGender(item)}

                    >


                        <Text
                            style={[
                                styles.text,
                                { color: colors.textSub },
                                gender === item && [styles.activeText, { color: colors.accent }]
                            ]}
                        >

                            {item}

                        </Text>



                        {
                            gender === item &&

                            <Ionicons
                                name="checkmark-circle"
                                size={22}
                                color={colors.accent}
                            />

                        }


                    </TouchableOpacity>


                ))}




            </SafeAreaView>


        </View>


    )

}



const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "#080818",
        paddingHorizontal: 18
    },


    header: {
        height: 60,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    },


    title: {
        color: "white",
        fontSize: 22,
        fontWeight: "800"
    },


    option: {

        backgroundColor: "#0C0C1E",

        height: 70,

        borderRadius: 18,

        paddingHorizontal: 20,

        flexDirection: "row",

        alignItems: "center",

        justifyContent: "space-between",

        marginTop: 15,

        borderWidth: 1,

        borderColor: "#222"

    },



    active: {
        borderColor: "#B46CFF",
        backgroundColor: "#18102c"
    },


    text: {
        color: "#aaa",
        fontSize: 18,
        fontWeight: "600"
    },


    activeText: {
        color: "#B46CFF"
    }


});