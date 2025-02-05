import React, { useState, useEffect } from "react";
import { Animated, Text, StyleSheet } from "react-native";

interface ToastProps {
    message: string;
    type: "success" | "error" | "info"; // Only required props
}

const Toast: React.FC<ToastProps> = ({ message, type }) => {
    const [visible, setVisible] = useState<boolean>(true);
    const fadeAnim = useState(new Animated.Value(0))[0];

    useEffect(() => {
        // Fade in animation
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();

        // Hide toast after 3 seconds
        const timer = setTimeout(() => {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(() => setVisible(false));
        }, 2000);

        return () => clearTimeout(timer); // Cleanup
    }, [fadeAnim]);

    if (!visible) return null;

    return (
        <Animated.View style={[styles.toastContainer, styles[type], { opacity: fadeAnim }]}>
            <Text style={styles.toastText}>{message}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    toastContainer: {
        position: "absolute",
        bottom: 50,
        alignSelf: "center",
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 50,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
        minWidth: "50%",
        maxWidth: "80%",
    },
    toastText: {
        fontSize: 16,
        textAlign: "center",
    },
    success: {
        backgroundColor: "green",
        color: "white",
    },
    error: {
        backgroundColor: "red",
        color: "white",
    },
    info: {
        backgroundColor: "yellow",
        color: "black",
    },
});


export default Toast;
