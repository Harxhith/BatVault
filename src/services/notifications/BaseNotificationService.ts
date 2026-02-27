
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

class BaseNotificationService {
  protected readonly SCHEDULED_KEY = 'notifications_scheduled';

  async initialize() {
    if (Capacitor.isNativePlatform()) {
      try {
        const { value: alreadyScheduled } = await Preferences.get({ key: this.SCHEDULED_KEY });

        if (alreadyScheduled === 'true') {
          console.log('Notifications already scheduled.');
          return;
        }

        const permissionStatus = await LocalNotifications.requestPermissions();

        if (permissionStatus.display === 'granted') {
          console.log('Notification permissions granted');
          await this.scheduleDailyNotifications();
          await Preferences.set({ key: this.SCHEDULED_KEY, value: 'true' });
        } else {
          console.log('Notification permissions denied');
        }
      } catch (error) {
        console.error('Error during notification initialization:', error);
      }
    }
  }

  async testNotification() {
    const id = Math.floor(Math.random() * 100000); // Random ID to avoid conflicts
    const message = "This is a test notification from BatVault";
  
    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title: 'BatVault',
          body: message,
          schedule: { at: new Date(Date.now() + 1000) }, // 1 second delay
          smallIcon: 'ic_noti',
        },
      ],
    });
  
    console.log(`Test notification scheduled with ID: ${id}`);
  }

  async scheduleDailyNotifications() {
    console.warn('scheduleDailyNotifications method should be implemented by subclasses');
  }
  
  async cancelAllNotifications() {
    if (Capacitor.isNativePlatform()) {
      try {
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
          await LocalNotifications.cancel({ notifications: pending.notifications });
        }
      } catch (error) {
        console.error('Error canceling notifications:', error);
      }
    }
  }
}

export default BaseNotificationService;
