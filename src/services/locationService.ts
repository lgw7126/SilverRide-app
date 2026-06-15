import * as Location from 'expo-location';

export const locationService = {
  async requestPermission(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  },

  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    const granted = await this.requestPermission();
    if (!granted) return null;
    return Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  },

  async watchLocation(
    callback: (location: Location.LocationObject) => void
  ): Promise<Location.LocationSubscription> {
    await this.requestPermission();
    return Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 10 },
      callback
    );
  },
};
