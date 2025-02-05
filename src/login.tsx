import axios from 'axios';
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {useNavigation} from '@react-navigation/native'; // Import useNavigation hook
import {StyleSheet, Image, ScrollView} from 'react-native';
import Toast from './components/Toast';

const LoginScreen = () => {
  // const [deviceId, setDeviceId] = useState('NZfpqhEjo488s5FghbOb3P1ogwHEpx1734420344137');
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState('P5JQ7V5O');
  const [isLoading, setIsLoading] = useState(false);
  const navigation: any = useNavigation(); // Initialize the navigation object

  useEffect(() => {
    const checkAccessToken = async () => {
      try {
        const accessToken = await AsyncStorage.getItem('access_token');
        const type = await AsyncStorage.getItem('type');
        if (type === 'online' && accessToken) {
          navigation.navigate('Dashboard'); // Redirect to Dashboard if token exists
        } else if (type === 'offline') {
          navigation.navigate('OfflineDashboard');
        }
      } catch (error) {
        console.error('Error checking access token:', error);
      }
    };

    checkAccessToken();
  }, [navigation]);
  const login = async () => {
    if (!verificationCode) {
      setToast({message: 'Verification Code are required', type: 'error'});
      return;
    }
    setIsLoading(true);

    const payload = {
      device_verification_code: verificationCode,
    };

    try {
      const response = await axios.post(
        'https://prowtechapi.zenoheal.com/app_login',
        payload,
      );
      if (response.status === 200) {
        setToast({message: 'Login successful', type: 'success'});
        const {access_token, data} = response.data;
        const device_id = data.device_id;
        const device_uid = data.device_unique_id;

        console.log('Login Success', [response.status]);

        await AsyncStorage.setItem('type', 'online');
        await AsyncStorage.setItem('device_info', JSON.stringify(data));

        await AsyncStorage.setItem('device_uid', device_uid);
        await AsyncStorage.setItem('device_id', device_id);
        await AsyncStorage.setItem('access_token', access_token);
        navigation.navigate('Dashboard');
      } else {
        const errorMessage = response.data?.message || 'Login failed';
        console.error('Login failed:', errorMessage);
        setToast({message: errorMessage, type: 'error'});
      }
    } catch (error) {
      console.error('Error during login:', (error as any).message);
      setToast({message: 'An error occurred during login', type: 'error'});
    } finally {
      setIsLoading(false);
    }
  };
  const offlineSetup = async () => {
    navigation.navigate('OfflineDashboard');
    await AsyncStorage.setItem('type', 'offline');
  };
  const resetLocalHandler = async () => {
    try {
      await AsyncStorage.clear();
      setToast({message: 'Reset', type: 'success'});
    } catch (error) {
      console.log('error', error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image
        source={require('./assets/images/prowtech_favicon.png')}
        style={styles.logo}
      />
      <Text style={styles.title}>
        Welcome to Prowtech International Vina JSC
      </Text>
      <Text style={styles.subtitle}>
        Welcome back! Login with the data you entered during registration.
      </Text>
      {/* 
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Device ID</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your Device ID"
          value={deviceId}
          onChangeText={setDeviceId}
          placeholderTextColor="#777"
        />
      </View> */}

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Verification Code</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your Verification Code"
          value={verificationCode}
          onChangeText={setVerificationCode}
          placeholderTextColor="#777"
        />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#505E73" />
      ) : (
        <TouchableOpacity
          style={[styles.button, {backgroundColor: '#0095e7'}]}
          onPress={() => login()}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.button, {backgroundColor: '#505E73'}]}
        onPress={offlineSetup}>
        <Text style={styles.buttonText}>Offline Setup</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={resetLocalHandler}>
        <Text style={{color: '#000', fontSize: 20, marginTop: 10}}>Reset</Text>
      </TouchableOpacity>
      {toast && <Toast message={toast.message} type={toast.type} />}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f7fa',
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 30,
    fontStyle: 'italic',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    shadowColor: '#ccc',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },

  button: {
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#505E73',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    marginVertical: 4,
  },
  buttonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default LoginScreen;
