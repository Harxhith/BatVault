import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { morningQuotes, noonQuotes, eveningQuotes, randomQuotes } from '@/data/Quotes';
import BaseNotificationService from './BaseNotificationService';

class MotivationalNotificationService extends BaseNotificationService {
  // 🔐 Returns the same quote for same day+time, different quote for each day/time
  private getDeterministicQuote(seed: string, quotes: string[]) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0; // Convert to 32-bit int
    }
    const index = Math.abs(hash) % quotes.length;
    return quotes[index];
  }

  // 🔄 Gets a "random-looking" quote that changes daily per hour slot
  getRandomQuoteForHour(hour: number) {
    const today = new Date().toISOString().slice(0, 10); // e.g. "2025-06-01"

    if (hour < 12) {
      return this.getDeterministicQuote(today + 'morning', morningQuotes);
    } else if (hour < 17) {
      return this.getDeterministicQuote(today + 'noon', noonQuotes);
    } else {
      return this.getDeterministicQuote(today + 'evening', eveningQuotes);
    }
  }

  // 🔔 Manually test a random quote notification (fires after 1 second)
  async testNotification() {
    const id = Math.floor(Math.random() * 100000); // Avoid ID conflicts
    const randomQuote = randomQuotes[Math.floor(Math.random() * randomQuotes.length)];

    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title: 'BatVault',
          body: randomQuote,
          schedule: { at: new Date(Date.now() + 1000) },
          smallIcon: 'ic_noti',
        },
      ],
    });

    console.log(`Test notification scheduled with ID: ${id}`);
  }

  // ⏰ Schedules 3 daily notifications (7 AM, 1 PM, 7 PM) with dynamic quotes
  async scheduleDailyNotifications() {
    if (!Capacitor.isNativePlatform()) {
      console.warn('Not a native platform – notifications will not be scheduled.');
      return;
    }

    const dailyTimes = [
      { hour: 7, minute: 0 },  // 7 AM
      { hour: 13, minute: 0 }, // 1 PM
      { hour: 19, minute: 0 }, // 7 PM
    ];

    const notifications = dailyTimes.map((time, index) => ({
      id: 10000 + index,
      title: 'BatVault',
      body: this.getRandomQuoteForHour(time.hour),
      schedule: {
        on: {
          hour: time.hour,
          minute: time.minute,
        },
        repeats: true,
      },
      smallIcon: 'ic_noti',
      sound: null,
      actionTypeId: '',
      extra: null,
    }));

    try {
      await LocalNotifications.schedule({ notifications });
      notifications.forEach(n => {
        console.log(`Scheduled daily notification at ${n.schedule?.on?.hour}:${n.schedule?.on?.minute}`);
      });
    } catch (error) {
      console.error('Error scheduling daily notifications:', error);
    }
  }
}

export default new MotivationalNotificationService();
