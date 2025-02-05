import { Alert, PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export interface Coordinate {
    latitude: number;
    longitude: number;
}

export const requestLocationPermission = async (): Promise<boolean> => {
    try {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true;
    } catch (err) {
        console.error('Location permission request error:', err);
        return false;
    }
};

export const fetchLocation = async (): Promise<Coordinate | null> => {
    return new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                console.log('Location fetched:', { latitude, longitude });
                resolve({ latitude, longitude });
            },
            (error) => {
                console.error('Location Error:', error);
                reject(error);
            },
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
        );
    });
};



