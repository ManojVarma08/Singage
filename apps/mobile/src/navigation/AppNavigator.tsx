import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { ScannerScreen } from '../screens/ScannerScreen';
import { TVDetailScreen } from '../screens/TVDetailScreen';
import { LayoutScreen } from '../screens/LayoutScreen';
import { MediaScreen } from '../screens/MediaScreen';
import type { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: '#0a1628' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: '800' },
          headerShadowVisible: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Scanner" component={ScannerScreen} options={{ title: 'Scan TV QR Code' }} />
        <Stack.Screen name="TVDetail" component={TVDetailScreen} options={{ title: 'TV Control' }} />
        <Stack.Screen name="Layout" component={LayoutScreen} options={{ title: 'Select Layout' }} />
        <Stack.Screen name="Media" component={MediaScreen} options={{ title: 'Push Media' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
