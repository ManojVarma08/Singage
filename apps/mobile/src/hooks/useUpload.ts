import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { uploadToS3 } from '../services/storage';
import { useTVStore } from '../store/tvStore';

export function useUpload(tvId: string, cellIndex: number) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const { setMedia } = useTVStore();

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') throw new Error('Permission denied');

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });

    if (!result.canceled) await upload(result.assets[0].uri, 'image');
  };

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') throw new Error('Permission denied');

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      videoMaxDuration: 60,
    });

    if (!result.canceled) await upload(result.assets[0].uri, 'video');
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') throw new Error('Permission denied');

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.85,
    });

    if (!result.canceled) await upload(result.assets[0].uri, 'image');
  };

  const upload = async (uri: string, type: 'image' | 'video') => {
    setUploading(true);
    setProgress('Uploading to AWS S3...');
    try {
      const ext = type === 'video' ? 'mp4' : 'jpg';
      const filename = `${Date.now()}.${ext}`;
      const contentType = type === 'video' ? 'video/mp4' : 'image/jpeg';

      const url = await uploadToS3(uri, filename, contentType);

      setProgress('Pushing to TV...');
      await setMedia(tvId, cellIndex, url, type);

      setProgress('');
      return url;
    } finally {
      setUploading(false);
      setProgress('');
    }
  };

  return { uploading, progress, pickImage, pickVideo, takePhoto };
}
