import { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,

    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Alert,
    PermissionsAndroid,
    Platform,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import DeviceInfo from 'react-native-device-info';
import Geolocation from '@react-native-community/geolocation';


const folderPath = `${RNFS.DocumentDirectoryPath}/Secret`;
const deviceInfoPath = `${folderPath}/device_info.json`;
const secretFilePath = `${folderPath}/secret.json`;



function Modal({ onClose, onSubmitted }: any) {
    const SECRET_KEY: any = 'Pa$$w0rd';
    const [coordinate, setCoordinate] = useState<any | null>(null);
    const [permissionDenied, setPermissionDenied] = useState<boolean | null>(
        false,
    );
    const ensureDirectoryExists = async () => {
        try {
            const exists = await RNFS.exists(folderPath);
            if (!exists) {
                console.log('Folder does not exist. Creating...');
                await RNFS.mkdir(folderPath);
                console.log('Folder created:', folderPath);
            } else {
                console.log('Folder already exists:', folderPath);
            }
        } catch (err) {
            console.log('Error creating folder:', err);
            throw err;
        }
    };
    const [info, setInfo] = useState<any>({});


    async function getDeviceInfo() {
        try {
            const deviceInfo: any = {
                device_id: "",
                device_unique_id: "",
                device_verification_code: "NVH1OXNQZA",
                device_name: "",
                device_label: "",
                device_manager_name: "",
                device_orientation: "",
                device_synchronization: "",
                device_status: "Active",
                device_connection_status: "Online",
                device_type: "USB",
                device_restart_time: null,
                device_restart_app: null,
                is_auto_restart: "No",
                device_auto_restart_app: "",
                network_name: "",
                layout_default_name: "",
                playlist_default_name: "",
                location_name: "",
                country_name: "",
                region_name: "",
                zone_name: "",
                subzone_name: "",
                device_manager_phone_number: "2147483647",
                device_address: "",
                device_screen_time_start: "10:00:00",
                device_screen_time_stop: "22:00:00",
                device_screen_dimension_unit: "Percentage",
                device_screen_dimension_left: "60",
                device_screen_dimension_top: "51",
                device_screen_dimension_width: "51",
                device_screen_dimension_height: "51",
                device_latency: "3",

                device_volume: "100",
                device_lastoffline_Time: "0000-00-00 00:00:00",
                device_start_status: "1",
                device_start_time: "06:54:00",
                device_auto_restart_status: "1",
                device_auto_restart_time: "02:29:00",
                device_app_restart_status: "1",
                device_app_restart_time: "18:09:00",
                device_overlay_date_time_status: "1",
                device_overlay_date_time_value: "MM/DD/YYYY",
                device_overlay_logo_status: "1",
                device_overlay_logo_value: "On",
                device_overlay_duration_checking: "1",
                device_overlay_bug_check_display_status: "1",
                device_overlay_bug_check_top: "80",
                device_overlay_bug_check_left: "95",
                device_overlay_bug_check_width: "32",
                device_overlay_bug_check_height: "21",
            };

            // **Dynamically Fetched Values**
            deviceInfo.device_platform = DeviceInfo.getSystemName();
            deviceInfo.device_build = DeviceInfo.getSystemVersion();
            deviceInfo.device_latitude = coordinate ? coordinate.latitude : 0;
            deviceInfo.device_longitude = coordinate ? coordinate.longitude : 0;
            deviceInfo.device_p_name = `${DeviceInfo.getBrand()} ${await DeviceInfo.getModel()}`;
            deviceInfo.device_model = await DeviceInfo.getModel();
            deviceInfo.device_version = DeviceInfo.getSystemVersion();
            deviceInfo.device_serial = await DeviceInfo.getSerialNumber();
            deviceInfo.device_uuid = (await DeviceInfo.getUniqueId()).toString();
            deviceInfo.device_manufacturer = await DeviceInfo.getManufacturer();
            deviceInfo.total_memory = ((await DeviceInfo.getTotalMemory()) / 1024 ** 3).toFixed(2);
            deviceInfo.free_disk_storage = ((await DeviceInfo.getFreeDiskStorage()) / 1024 ** 3).toFixed(2);
            deviceInfo.total_disk_capacity = ((await DeviceInfo.getTotalDiskCapacity()) / 1024 ** 3).toFixed(2);
            setInfo(deviceInfo);
        } catch (error) {
            console.error("Error fetching device information:", error);
        }
    }

    const handleChange = (key: any, value: any) => {
        setInfo((prevState: any) => ({
            ...prevState,
            [key]: value,
        }));
    };
    const requestLocationPermission = async () => {
        try {
            if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                );
                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    console.log('Location permission granted');
                    fetchLocation();
                } else {
                    console.log('Location permission denied');
                }
            } else {
                fetchLocation();
            }
        } catch (err) {
            console.log('Permission Error:', err);
        }
    };

    const fetchLocation = () => {
        Geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                console.log('Location fetched:', { latitude, longitude });
                setCoordinate({ latitude, longitude });
                console.log('Coordinate:', coordinate);
            },
            error => {
                console.log('Location Error:', error);
                setPermissionDenied(true);
                fallbackToManualCoords();
            },
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
        );
    };
    const fallbackToManualCoords = () => {
        const defaultCoords = {
            latitude: 0.0,
            longitude: 0.0,
        };

        Alert.alert(
            'Location Permission Denied',
            'Location access is required for better accuracy. Using default coordinates.',
            [
                {
                    text: 'Use Defaults',
                    onPress: () => setCoordinate(defaultCoords),
                },
                {
                    text: 'Enter Manually',
                    onPress: () => manualCoordInput(),
                },
            ],
        );
    };

    const manualCoordInput = () => {
        const manualCoords = {
            latitude: parseFloat(prompt('Enter Latitude:', '0.0')),
            longitude: parseFloat(prompt('Enter Longitude:', '0.0')),
        };

        setCoordinate(manualCoords);
    };

    function prompt(arg0: string, arg1: string): string {
        throw new Error('Function not implemented.');
    }

    useEffect(() => {
        getDeviceInfo();
        requestLocationPermission();
    }, []);

    const handleSubmit = async () => {
        await ensureDirectoryExists();

        RNFS.writeFile(
            `${folderPath}/device_info.json`,
            JSON.stringify(info),
            'utf8',
        );
        await RNFS.writeFile(deviceInfoPath, JSON.stringify(info, null, 2), 'utf8');

        // Save only verification code & UUID in secret.json
        const secretData = {
            device_verification: info.device_verification_code,
            device_uuid: info.device_uuid,
        };
        await RNFS.writeFile(secretFilePath, JSON.stringify(secretData, null, 2), 'utf8');

        onSubmittedHandler();
        Alert.alert('Success', 'Device information and secrets saved successfully.');
        onClose(false);
    };
    const onClosed = () => {
        onClose(false);
        onSubmitted(false);
    }
    const onSubmittedHandler = () => {
        onSubmitted(true);
    }

    useEffect(() => {
        const initialSetup: any = async () => {
        }
        initialSetup();
    }, []);
    return (
        <View >
            <View style={modalStyles.modalContainer}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 5 }}>
                    <View>
                        <Text style={modalStyles.title}>Enter Device Information</Text>
                    </View>
                    <View>
                        <TouchableOpacity onPress={onClosed}>
                            <Text style={{ fontSize: 25, color: 'black', cursor: 'pointer' }}>
                                &#x2715;
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <ScrollView contentContainerStyle={modalStyles.scrollContainer}>
                    <View style={modalStyles.formRow}>
                        {Object.keys(info).map(key => (
                            <View key={key} style={modalStyles.inputContainer}>
                                <Text style={modalStyles.label}>
                                    {key.replace(/_/g, ' ').toUpperCase()}
                                </Text>
                                <TextInput
                                    style={modalStyles.input}
                                    placeholder={`Enter ${key.replace(/_/g, ' ')}`}
                                    value={info[key] === 'unknown' ? '' : info[key]}
                                    onChangeText={value => handleChange(key, value)}
                                />
                            </View>
                        ))}
                    </View>
                </ScrollView>
                <TouchableOpacity
                    style={[modalStyles.button, { backgroundColor: '#505E73' }]}
                    onPress={handleSubmit}>
                    <Text style={modalStyles.buttonText}>Submit</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const modalStyles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    modalContainer: {
        width: '100%',
        backgroundColor: '#fff',
        padding: 10,
    },
    scrollContainer: {
        paddingVertical: 10,
    },
    button: {
        borderRadius: 10,
        alignItems: 'center',
        marginVertical: 4,
        paddingHorizontal: 10,
        paddingVertical: 10,
        width: '50%',
        marginHorizontal: 'auto',
    },
    buttonText: {
        fontSize: 18,
        color: '#fff',
        fontWeight: 'bold',
    },
    title: {
        fontSize: 25,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
    formRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        columnGap: 10,
    },
    inputContainer: {
        marginBottom: 10,
        width: '48%',
    },
    label: {
        color: '#333',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 1,
    },
    input: {
        padding: 5,
        height: 40,
        width: 'auto',
        borderWidth: 1,
        borderRadius: 5,
        borderColor: '#ddd',
        color: '#333',
        backgroundColor: '#f5f5f5',
        fontSize: 12,
    },
});
export default Modal;
