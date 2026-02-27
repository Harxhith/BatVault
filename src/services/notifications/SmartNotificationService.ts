
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { auth, db } from "@/integrations/firebase/client";
import { collection, query, where, getDocs } from "firebase/firestore";
import { callNetlifyFunction } from "@/utils/netlifyFunctions";
import { format } from 'date-fns';
import BaseNotificationService from './BaseNotificationService';
import { getUserGoalsWithProgress } from "@/utils/GoalsSummary";

class SmartNotificationService extends BaseNotificationService {
  private readonly SMART_NOTIFICATIONS_KEY = 'smart_notifications_enabled';
  private readonly LAST_NOTIFICATION_TIME_KEY = 'last_notification_time';
  private isScheduling = false;

  async scheduleSmartNotifications() {
    if (!Capacitor.isNativePlatform()) {
      console.warn('Not a native platform – smart notifications will not be scheduled.');
      return;
    }

    if (this.isScheduling) {
      console.log('Already scheduling a smart notification — skipping.');
      return;
    }
  
    this.isScheduling = true;

    const { value: isEnabled } = await Preferences.get({ key: this.SMART_NOTIFICATIONS_KEY });
    if (isEnabled !== 'true') {
      console.log('Smart notifications are disabled.');
      return;
    }

    try {
      // Check if we should send a notification based on timing
      if (!await this.shouldSendNotificationNow()) {
        console.log('Not sending smart notification now due to timing.');
        return;
      }

      // Get current user
      const user = auth.currentUser;
      if (!user) {
        console.warn('No authenticated user found for smart notifications.');
        return;
      }

      // Get transaction data
      const today = format(new Date(), 'yyyy-MM-dd');
      const sevenDaysAgo = format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      
      // Fetch today's expenses
      const todayQ = query(
        collection(db, 'expenses'), 
        where('user_id', '==', user.uid), 
        where('type', '==', 'expense'), 
        where('date', '>=', today)
      );
      const todaySnap = await getDocs(todayQ);
      const todayExpenses = todaySnap.docs.map(doc => doc.data() as any);
      
      // Fetch last 7 days expenses
      const weekQ = query(
        collection(db, 'expenses'), 
        where('user_id', '==', user.uid), 
        where('type', '==', 'expense'), 
        where('date', '>=', sevenDaysAgo), 
        where('date', '<', today)
      );
      const weekSnap = await getDocs(weekQ);
      const weekExpenses = weekSnap.docs.map(doc => doc.data() as any);

      // Calculate totals and averages
      const todayTotal = todayExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || '0'), 0);
      const weekTotal = weekExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || '0'), 0);
      const averageDaily = weekExpenses.length > 0 ? weekTotal / 7 : 0;

      // Get categories breakdown
      const catQ = query(collection(db, 'categories'), where('user_id', '==', user.uid));
      const catSnap = await getDocs(catQ);
      const categories = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

      // Build category breakdown
      const categoryMap = new Map();
      if (categories) {
        todayExpenses.forEach(expense => {
          const category = categories.find(c => c.id === expense.category_id);
          if (category) {
            const amount = parseFloat(expense.amount);
            if (categoryMap.has(category.id)) {
              categoryMap.set(category.id, {
                id: category.id,
                name: category.name,
                amount: categoryMap.get(category.id).amount + amount
              });
            } else {
              categoryMap.set(category.id, {
                id: category.id,
                name: category.name,
                amount
              });
            }
          }
        });
      }

      // Format categories for AI
      const categoryData = Array.from(categoryMap.values()).map(cat => {
        return {
          name: cat.name,
          amount: String(cat.amount), // Convert to string explicitly
          percentage: Math.round((cat.amount / todayTotal) * 100)
        };
      }).sort((a, b) => Number(b.amount) - Number(a.amount));

      // Determine time of day
      const hour = new Date().getHours();
      let timeOfDay = "morning";
      if (hour >= 12 && hour < 17) {
        timeOfDay = "noon";
      } else if (hour >= 17) {
        timeOfDay = "evening";
      }

      const { formattedGoals } = await getUserGoalsWithProgress();

      // Generate AI notification message
      const notificationData = {
        userId: user.uid,
        todayTotal: String(todayTotal),
        averageDaily: String(averageDaily),
        categories: categoryData.slice(0, 3),
        goals: formattedGoals,
        timeOfDay
      };

      console.log('Generating smart notification with data:', notificationData);

      let message = '';
      try {
        const response = await callNetlifyFunction('generateSmartNotification', notificationData);
        const data = response.data as any;
        message = data.message;
      } catch (error: any) {
        throw new Error(`Function error: ${error.message}`);
      }

      console.log('Generated smart notification message:', message);

      // Send the notification
      const id = Math.floor(Math.random() * 100000) + 20000; // Random ID starting from 20000
      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title: 'BatVault Insights',
            body: message,
            smallIcon: 'ic_noti',
          },
        ],
      });

      console.log(`Smart notification scheduled with ID: ${id}`);
      
      // Record the time we sent this notification
      await Preferences.set({ 
        key: this.LAST_NOTIFICATION_TIME_KEY, 
        value: new Date().toISOString() 
      });
      
    } catch (error) {
      console.error('Error scheduling smart notification:', error);
    }
  }

  private async shouldSendNotificationNow(): Promise<boolean> {
    const { value: lastTimeStr } = await Preferences.get({ key: this.LAST_NOTIFICATION_TIME_KEY });
    
    if (!lastTimeStr) {
      return true;
    }
    
    const lastTime = new Date(lastTimeStr);
    const now = new Date();
    const hoursSinceLastNotification = (now.getTime() - lastTime.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceLastNotification >= 4;
  }

  async toggleSmartNotifications(enabled: boolean) {
    await Preferences.set({ key: this.SMART_NOTIFICATIONS_KEY, value: String(enabled) });
    
    if (enabled) {
      await this.scheduleSmartNotifications();
    }
    
    return enabled;
  }

  async getSmartNotificationsEnabled(): Promise<boolean> {
    const { value } = await Preferences.get({ key: this.SMART_NOTIFICATIONS_KEY });
    return value === 'true';
  }

  async sendTestSmartNotification() {
    
    if (!Capacitor.isNativePlatform()) {
      console.warn('Not a native platform – smart notifications will not be scheduled.');
      return;
    }

    try {
      // Get current user
      const user = auth.currentUser;
      if (!user) {
        console.warn('No authenticated user found for smart notifications.');
        return;
      }

      // Get transaction data
      const today = format(new Date(), 'yyyy-MM-dd');
      const sevenDaysAgo = format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      
      // Fetch today's expenses
      const todayQ = query(
        collection(db, 'expenses'), 
        where('user_id', '==', user.uid), 
        where('type', '==', 'expense'), 
        where('date', '>=', today)
      );
      const todaySnap = await getDocs(todayQ);
      const todayExpenses = todaySnap.docs.map(doc => doc.data() as any);
      
      // Fetch last 7 days expenses
      const weekQ = query(
        collection(db, 'expenses'), 
        where('user_id', '==', user.uid), 
        where('type', '==', 'expense'), 
        where('date', '>=', sevenDaysAgo), 
        where('date', '<', today)
      );
      const weekSnap = await getDocs(weekQ);
      const weekExpenses = weekSnap.docs.map(doc => doc.data() as any);

      // Calculate totals and averages
      const todayTotal = todayExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || '0'), 0);
      const weekTotal = weekExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || '0'), 0);
      const averageDaily = weekExpenses.length > 0 ? weekTotal / 7 : 0;

      // Get categories breakdown
      const catQ = query(collection(db, 'categories'), where('user_id', '==', user.uid));
      const catSnap = await getDocs(catQ);
      const categories = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

      // Build category breakdown
      const categoryMap = new Map();
      if (categories) {
        todayExpenses.forEach(expense => {
          const category = categories.find(c => c.id === expense.category_id);
          if (category) {
            const amount = parseFloat(expense.amount);
            if (categoryMap.has(category.id)) {
              categoryMap.set(category.id, {
                id: category.id,
                name: category.name,
                amount: categoryMap.get(category.id).amount + amount
              });
            } else {
              categoryMap.set(category.id, {
                id: category.id,
                name: category.name,
                amount
              });
            }
          }
        });
      }

      // Format categories for AI
      const categoryData = Array.from(categoryMap.values()).map(cat => {
        return {
          name: cat.name,
          amount: String(cat.amount), // Convert to string explicitly
          percentage: Math.round((cat.amount / todayTotal) * 100)
        };
      }).sort((a, b) => Number(b.amount) - Number(a.amount));

      // Determine time of day
      const hour = new Date().getHours();
      let timeOfDay = "morning";
      if (hour >= 12 && hour < 17) {
        timeOfDay = "noon";
      } else if (hour >= 17) {
        timeOfDay = "evening";
      }

      // Generate AI notification message
      const notificationData = {
        userId: user.uid,
        todayTotal: String(todayTotal),
        averageDaily: String(averageDaily),
        categories: categoryData.slice(0, 3), // Top 3 categories
        timeOfDay
      };

      console.log('Generating smart notification with data:', notificationData);

      let message = '';
      try {
        const response = await callNetlifyFunction('generateSmartNotification', notificationData);
        const data = response.data as any;
        message = data.message;
      } catch (error: any) {
        throw new Error(`Function error: ${error.message}`);
      }

      console.log('Generated smart notification message:', message);

      // Send the notification
      const id = Math.floor(Math.random() * 100000) + 20000; // Random ID starting from 20000
      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title: 'BatVault Insights',
            body: message,
            smallIcon: 'ic_noti',
          },
        ],
      });

      console.log(`Smart notification scheduled with ID: ${id}`);
      
    } catch (error) {
      console.error('Error scheduling smart notification:', error);
    }
  }
}

export default new SmartNotificationService();
