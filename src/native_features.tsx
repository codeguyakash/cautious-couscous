import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import React, { useRef } from 'react';
import {
    StyleSheet,
    Button,
    Platform,
    ScrollView,
    Alert,
    View,
} from 'react-native';
import RNRestart from 'react-native-restart';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { NativeModules } from 'react-native';


function NativeFeatures(): React.JSX.Element {
    // const { RebootModule, ShellCommandModule } = NativeModules;
    const { ShellCommandModule } = NativeModules;
    const viewRef = useRef(null);

    const restartApp = () => {
        RNRestart.Restart();
    };

    // const rebootDevice = () => {
    //   if (Platform.OS === 'android') {
    //     console.log(Platform.OS);
    //     RebootModule.rebootDevice();
    //     return;
    //   }
    // };
    const rebootWithADB = () => {
        if (Platform.OS === 'android') {
            ShellCommandModule.rebootDevice();
            return;
        }

    };

    const takeScreenshot = async () => {
        try {
            const uri = await captureRef(viewRef, {
                format: 'png',
                quality: 0.8,
            });

            if (Platform.OS === 'android') {
                await CameraRoll.save(uri, { type: 'photo' });
                Alert.alert('Success', 'Screenshot saved to gallery.');
            } else {
                Alert.alert('Success', 'Screenshot captured. Check your Photos.');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to capture screenshot.');
            console.error('Screenshot error:', error);
        }
    };

    return (
        <ViewShot style={styles.wrapper} ref={viewRef}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.button}>
                    <View style={styles.buttonSpacing}>
                        <Button color={'black'} title="Restart App" onPress={restartApp} />
                    </View>
                    <View style={styles.buttonSpacing}>
                        <Button color={'black'} title="Reboot" onPress={rebootWithADB} />
                    </View>
                    <View>
                        <Button color={'black'} title="Take Screenshot" onPress={takeScreenshot} />
                    </View>
                </View>
            </ScrollView>
        </ViewShot>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: '#FFF',
    },
    container: {
        flex: 2,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,

    },
    button: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
        color: 'black',
        gap: 15,
        width: '60%',

    },
    buttonSpacing: {
        marginBottom: 15,
        width: '100%',
        alignSelf: 'center',
    },

});

export default NativeFeatures;
