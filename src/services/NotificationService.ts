
import { Capacitor } from '@capacitor/core';
import motivationalNotificationService from './notifications/MotivationalNotificationService';
import smartNotificationService from './notifications/SmartNotificationService';

class NotificationService {
  async initialize() {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    
    await motivationalNotificationService.initialize();
  }

  async testNotification() {
    return motivationalNotificationService.testNotification();
  }

  async scheduleDailyNotifications() {
    return motivationalNotificationService.scheduleDailyNotifications();
  }
  
  async scheduleSmartNotifications() {
    return smartNotificationService.scheduleSmartNotifications();
  }

  async sendTestSmartNotification() {
    return smartNotificationService.sendTestSmartNotification();
  }

  async toggleSmartNotifications(enabled: boolean) {
    return smartNotificationService.toggleSmartNotifications(enabled);
  }

  async getSmartNotificationsEnabled() {
    return smartNotificationService.getSmartNotificationsEnabled();
  }
  
  async cancelAllNotifications() {
    await motivationalNotificationService.cancelAllNotifications();
  }
}

export const notificationService = new NotificationService();
