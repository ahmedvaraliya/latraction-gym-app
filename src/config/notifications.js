import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Web par handler set karne par error deta hai, isliye sirf mobile par chalayein
if (Platform.OS !== 'web') {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (e) {
    console.log(e);
  }
}

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web') {
    return null;
  }

  try {
    let token;
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  } catch (error) {
    console.log('Push token error:', error);
    return null;
  }
}

export async function scheduleLocalNotification(title, body) {
  if (Platform.OS === 'web') {
    console.log('Local notifications are not supported on web.');
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `⚡ LATRACTION: ${title}`,
        body: body,
        sound: 'default',
      },
      trigger: null, // Turant show hoga
    });
  } catch (error) {
    console.log('Schedule notification error:', error);
  }
}