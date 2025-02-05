import React, { useEffect, useState } from 'react';
import { Text, View, ScrollView, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMethod } from './network/network_api_calls';


const DeviceDetails = () => {
    const [deviceDetails, setDeviceDetails] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getDeviceDetails();
    }, []);

    const getDeviceDetails = async () => {
        const storedDeviceId = await AsyncStorage.getItem('device_id');
        if (!storedDeviceId) {
            console.error('Device ID not found in AsyncStorage.');
            setLoading(false);
            return;
        }

        try {
            const data = await getMethod(`/api/devices/show/${storedDeviceId}`);
            setDeviceDetails(data.data);
            console.log(`Device Name: ${data.data.device_name} @@ Status: ${data.status}`);
        } catch (error: any) {
            console.error('Error fetching device details:', error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Loading...</Text>
            </View>
        );
    }

    if (!deviceDetails) {
        return (
            <View style={styles.loadingContainer}>
                <Text>No Device Details Available</Text>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {Object.keys(deviceDetails).map((key) => (
                <Detail key={key} label={key.replace(/_/g, ' ')} value={deviceDetails[key]} />
            ))}
        </ScrollView>
    );
};

const Detail = ({ label, value }: { label: string, value: any }) => {
    const capitalize = (str: string) =>
        str
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

    return (
        <View style={styles.detailContainer}>
            <Text style={styles.detailKey}>{capitalize(label)}:</Text>
            <Text style={styles.detailValue}>{value || 'N/A'}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 20,
    },
    detailContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    detailKey: {
        flex: 3,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginRight: 10,
        textAlign: 'left',
    },
    detailValue: {
        flex: 2,
        fontSize: 14,
        color: '#555',
        textAlign: 'right',
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    },
});

export default DeviceDetails;
