export async function registerForPushNotificationsAsync() {
  console.log('Push notifications are not supported on web.');
  return null;
}

export async function scheduleLocalNotification(title, body) {
  console.log('Local notifications are disabled on web:', title, body);
  return Promise.resolve();
}