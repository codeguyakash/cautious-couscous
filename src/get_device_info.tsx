import { useEffect, useState } from 'react';
import {
    Alert,
    PermissionsAndroid,
    Platform,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import Geolocation from '@react-native-community/geolocation';
import { postMethod } from './network/network_api_calls';
import AsyncStorage from '@react-native-async-storage/async-storage';


interface DeviceInfoType {
    device_id: string | null;
    device_platform: string;
    device_build: string;
    device_latitude: number;
    device_longitude: number;
    device_p_name: string;
    device_model: string;
    device_version: string;
    device_serial: string;
    device_uuid: string;
    device_manufacturer: string;
    total_memory: string;
    free_disk_storage: string;
    total_disk_capacity: string;
}
interface Coordinate {
    latitude: number;
    longitude: number;
}


const DeviceInformation = () => {
    const [deviceInfo, setDeviceInfo] = useState<DeviceInfoType | null>(null);
    const [coordinate, setCoordinate] = useState<Coordinate | null>(null);
    const [permissionDenied, setPermissionDenied] = useState<boolean | null>(false);

    useEffect(() => {
        requestLocationPermission();
    }, []);

    useEffect(() => {
        if (coordinate) {
            fetchDeviceInfo();
        }
    }, [coordinate]);

    const fetchDeviceInfo = async () => {
        try {
            const device_uid = await AsyncStorage.getItem('device_uid');
            const info = {
                device_id: device_uid,
                device_platform: DeviceInfo.getSystemName(),
                device_build: DeviceInfo.getSystemVersion(),
                device_latitude: coordinate ? coordinate.latitude : 0,
                device_longitude: coordinate ? coordinate.longitude : 0,
                device_p_name: `${DeviceInfo.getBrand()} ${await DeviceInfo.getModel()}`,
                device_model: await DeviceInfo.getModel(),
                device_version: DeviceInfo.getSystemVersion(),
                device_serial: await DeviceInfo.getSerialNumber(),
                device_uuid: (await DeviceInfo.getUniqueId()).toString(),
                device_manufacturer: await DeviceInfo.getManufacturer(),
                total_memory: (await DeviceInfo.getTotalMemory() / (1024 ** 3)).toFixed(2),
                free_disk_storage: (await DeviceInfo.getFreeDiskStorage() / (1024 ** 3)).toFixed(2),
                total_disk_capacity: (await DeviceInfo.getTotalDiskCapacity() / (1024 ** 3)).toFixed(2),
            };

            setDeviceInfo(info);
            updateDeviceInfo(info);
        } catch (error) {
            console.error('Error fetching device info:', error);
        }
    };



    const updateDeviceInfo = async (info: DeviceInfoType): Promise<void> => {
        console.log('Device Info:@@@', info);
        try {
            const res = await postMethod('/api/devices/update_device_information', info);
            console.log(res.message, res.status);
            Alert.alert('Info Updated:', 'Device Info Updated Successfully');
        } catch (error: any) {
            console.error('Device Info Update Error:', error);
            Alert.alert('Device Info Update Error:', error.message);
        }
    };

    const requestLocationPermission = async () => {
        try {
            if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                );
                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    console.warn('Location permission granted');
                    fetchLocation();
                } else {
                    console.error('Location permission denied');
                }
            } else {
                fetchLocation();
            }
        } catch (err) {
            console.error('Permission Error:', err);
        }
    };

    const fetchLocation = () => {
        Geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                console.warn('Location fetched:', { latitude, longitude });
                setCoordinate({ latitude, longitude });
                console.log('Coordinate:', coordinate);
            },
            (error) => {
                console.error('Location Error:', error);
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
            ]
        );
    };

    const manualCoordInput = () => {
        const manualCoords = {
            latitude: parseFloat(prompt('Enter Latitude:', '0.0')),
            longitude: parseFloat(prompt('Enter Longitude:', '0.0')),
        };

        setCoordinate(manualCoords);
    };

    return { deviceInfo, permissionDenied };
};

export default DeviceInformation;

function prompt(arg0: string, arg1: string): string {
    throw new Error('Function not implemented.');
}

