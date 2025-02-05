import axios from 'axios';
import { BASE_URL } from '../../env/base_url';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getToken = async () => {
    return await AsyncStorage.getItem('access_token');
};

// @@GET Method
export const getMethod = async (endpoint) => {
    try {
        const token = await getToken();
        const response = await axios.get(`${BASE_URL}${endpoint}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error(`GET request error @ ${endpoint}:`, error.message);
        throw error;
    }
};

// @@POST Method
export const postMethod = async (endpoint, data) => {
    try {
        const token = await getToken();
        const response = await axios.post(`${BASE_URL}${endpoint}`, data, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error(`POST request error @ ${endpoint}:`, error.message);
        throw error;
    }
};

// @@PUT Method
export const putMethod = async (endpoint, data) => {
    try {
        const token = await getToken();
        const response = await axios.put(`${BASE_URL}${endpoint}`, data, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error(`PUT request error @ ${endpoint}:`, error.message);
        throw error;
    }
};

// @@DELETE Method
export const deleteMethod = async (endpoint) => {
    try {
        const token = await getToken();
        const response = await axios.delete(`${BASE_URL}${endpoint}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error(`DELETE request error @ ${endpoint}:`, error.message);
        throw error;
    }
};
