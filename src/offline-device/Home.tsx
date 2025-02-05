import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { unzip } from "react-native-zip-archive";
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import DocumentPicker from 'react-native-document-picker';
import Modal from './model';
import { useNavigation } from '@react-navigation/native';
import Toast from '../components/Toast';


const folderPath = `${RNFS.DocumentDirectoryPath}/Secret`;
const secretFilePath = `${folderPath}/secret.json`;
const Home = () => {

  const navigation: any = useNavigation();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const [modalVisible, setModalVisible] = useState(true);
  const [authVerified, setAuthVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isZipExtracted, setIsZipExtracted] = useState(false);

  useEffect(() => {
    const Initialize = async () => {
      let _submitted = await AsyncStorage.getItem("onSubmitted");
      let isAuthorized = await AsyncStorage.getItem("isAuthorized")
      if (_submitted === 'true') {
        setModalVisible(false);
      }
      if (isAuthorized) {
        console.log("Already isAuthorized ")
        setAuthVerified(true)
        navigation.replace('OfflineVideoPlayer');
      }
    }
    Initialize();
    setModalVisible(true);
    ensureDirectoryExists(folderPath);
  }, []);

  const ensureDirectoryExists = async (folder: any) => {
    try {
      const exists = await RNFS.exists(folder);
      if (!exists) {
        console.log('Folder does not exist. Creating...');
        await RNFS.mkdir(folder);
        console.log('Folder created:', folder);
      }
    } catch (err) {
      console.log('Error creating folder:', err);
    }
  };

  const browseSecretFile = async () => {
    try {
      const fileContent = await RNFS.readFile(secretFilePath, 'utf8');
      const secretFileDate = JSON.parse(fileContent);

      const result = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.allFiles],
      });

      if (result.uri) {
        ;
        const fileContent = await RNFS.readFile(result.uri, 'utf8');
        const parsedData = JSON.parse(fileContent);

        console.log('USB Data:', parsedData.device_verification, 'Secret:', secretFileDate.device_verification);

        if (parsedData.device_verification === secretFileDate.device_verification) {
          setAuthVerified(true);
          await AsyncStorage.setItem("isAuthorized", "true")
          setToast({ message: "USB Authentication Successful", type: "success" });

        } else {
          setToast({ message: "Invalid Code", type: "error" });
        }
      }
    } catch (error) {
      console.log('Error browsing secret file:', error);
      setToast({ message: "Error browsing secret file", type: "error" });
    }
  };


  const closeHandler = () => {
    setModalVisible(false);
  };
  const onSubmittedHandler = async (event: boolean) => {

    await AsyncStorage.setItem("onSubmitted", event.toString());
    setModalVisible(false);
    let _submitted = await AsyncStorage.getItem("onSubmitted");
    console.log('Submitted', _submitted);
  }
  const removeLocal = async () => {
    try {
      await AsyncStorage.clear();
      navigation.replace('Login');
      await AsyncStorage.setItem("onSubmitted", "false");
      RNFS.unlink(secretFilePath);
      setToast({ message: "Secret Removed", type: "success" });
    } catch (error) {
      console.log('Error removing local secret:', error);
    }
  }
  const browseZipFile = async () => {
    try {

      const res: any = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.zip],
      });

      if (!res.uri) {
        setToast({ message: "No file selected", type: "error" })
        return;
      }

      const targetPath = `${RNFS.DocumentDirectoryPath}/Local`;
      const tempZipPath = `${RNFS.DocumentDirectoryPath}/temp.zip`;

      await ensureDirectoryExists(targetPath);

      await RNFS.copyFile(res.uri, tempZipPath);

      console.log("Temporary ZIP Path:", tempZipPath);

      const fileStats = await RNFS.stat(tempZipPath);
      console.log("File size:", fileStats.size);

      if (fileStats.size < 100) {
        throw new Error("Downloaded ZIP file is too small. File may be corrupted.");
      }

      await unzip(tempZipPath, targetPath);
      console.log("ZIP file extracted successfully at:", targetPath);
      setToast({ message: `Extracted Success`, type: "success" })
      setIsZipExtracted(true);
      navigation.replace('OfflineVideoPlayer');
    } catch (error: any) {
      console.log("Error extracting ZIP:", error);
      setToast({ message: `Error: ${error.message}`, type: "error" })
    }
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      {modalVisible ? (
        <Modal onClose={closeHandler} onSubmitted={onSubmittedHandler} />
      ) : authVerified ? (
        <View style={styles.container}>
          <Text style={styles.title}>Videos</Text>
          <View>
            {
              authVerified && <TouchableOpacity onPress={browseZipFile} style={styles.button}>
                <Text style={styles.buttonText}>Browse Zip</Text>
              </TouchableOpacity>}
            {
              isZipExtracted &&
              <TouchableOpacity onPress={() => navigation.replace('OfflineVideoPlayer')} style={styles.button}>
                <Text style={styles.buttonText}>Play Video</Text>
              </TouchableOpacity>
            }
            {
              isError && <TouchableOpacity onPress={browseZipFile} style={styles.buttonError}>
                <Text style={styles.buttonText}>Try Again</Text>
              </TouchableOpacity>
            }
          </View>
        </View>
      ) : (
        <View style={styles.container}>
          <Text style={styles.title}>Browser Auth File</Text>
          <TouchableOpacity style={styles.button} onPress={browseSecretFile}>
            <Text style={styles.buttonText}>Browse Secret File</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={removeLocal} style={styles.buttonError}>
            <Text style={styles.buttonText}>Remove Secret</Text>
          </TouchableOpacity>
        </View>
      )}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </ScrollView>
  );

};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
    backgroundColor: '#1E90FF',
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  buttonError: {
    marginTop: 20,
    backgroundColor: 'red',
    paddingVertical: 5,
    paddingHorizontal: 10,
    textAlign: 'center',
  },
  buttonText: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
  },
  textBtn: {
    color: 'black',
  }
});

export default Home;
