
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Preferences } from '@capacitor/preferences';
import { notificationService } from "@/services/NotificationService";
import { Capacitor } from "@capacitor/core";
import { BellRing, BellOff, Sparkles, Brain } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const NOTIFICATIONS_ENABLED_KEY = 'notificationsEnabled';

const NotificationSettings = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [smartNotificationsEnabled, setSmartNotificationsEnabled] = useState(false);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    // Check if running on a native platform
    setIsNative(Capacitor.isNativePlatform());
    
    // Load notification settings
    const loadSettings = async () => {
      try {
        const { value } = await Preferences.get({ key: NOTIFICATIONS_ENABLED_KEY });
        setNotificationsEnabled(value === 'true');
        
        const smartEnabled = await notificationService.getSmartNotificationsEnabled();
        setSmartNotificationsEnabled(smartEnabled);
      } catch (error) {
        console.error('Error loading notification settings:', error);
      }
    };
    
    loadSettings();
  }, []);

  const handleToggleNotifications = async (enabled: boolean) => {
    try {
      setNotificationsEnabled(enabled);
      await Preferences.set({ key: NOTIFICATIONS_ENABLED_KEY, value: String(enabled) });
      
      if (enabled) {
        await notificationService.initialize();
      } else {
        await notificationService.cancelAllNotifications();
        // Also disable smart notifications if regular notifications are disabled
        if (smartNotificationsEnabled) {
          await handleToggleSmartNotifications(false);
        }
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
    }
  };

  const handleToggleSmartNotifications = async (enabled: boolean) => {
    try {
      // Can't enable smart notifications if regular notifications are disabled
      if (enabled && !notificationsEnabled) {
        toast.error("Please enable regular notifications first");
        return;
      }
      
      setSmartNotificationsEnabled(enabled);
      await notificationService.toggleSmartNotifications(enabled);
      
      if (enabled) {
        toast.success("Smart notifications enabled");
        // Send a test smart notification immediately
        await notificationService.scheduleSmartNotifications();
      } else {
        toast.success("Smart notifications disabled");
      }
    } catch (error) {
      console.error('Error toggling smart notifications:', error);
      toast.error("Failed to update smart notifications settings");
    }
  };

  const handleTestNotification = async () => {
    if (!isNative) {
      console.log('Notifications only work on native platforms');
      return;
    }

    try {
      await notificationService.testNotification();
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  };

  const handleTestSmartNotification = async () => {
    if (!isNative) {
      console.log('Notifications only work on native platforms');
      return;
    }

    try {
      await notificationService.sendTestSmartNotification();
      toast.success("Smart notification test triggered");
    } catch (error) {
      console.error('Error sending smart notification:', error);
      toast.error("Failed to send smart notification");
    }
  };

  // Don't render this component if not on a native platform
  if (!isNative) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {notificationsEnabled ? <BellRing className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
            Motivational Notifications
          </CardTitle>
          <CardDescription>
            Receive random motivational quotes throughout the day to keep you on track with your financial goals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch 
              id="notifications-mode"
              checked={notificationsEnabled}
              onCheckedChange={handleToggleNotifications}
            />
            <Label htmlFor="notifications-mode">
              {notificationsEnabled ? "Notifications enabled" : "Notifications disabled"}
            </Label>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            onClick={handleTestNotification}
            disabled={!notificationsEnabled}
          >
            Send Test Notification
          </Button>
        </CardFooter>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            AI Smart Notifications
          </CardTitle>
          <CardDescription>
            Receive personalized, context-aware notifications based on your spending patterns and financial habits.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch 
              id="smart-notifications-mode"
              checked={smartNotificationsEnabled}
              onCheckedChange={handleToggleSmartNotifications}
              disabled={!notificationsEnabled}
            />
            <Label htmlFor="smart-notifications-mode">
              {smartNotificationsEnabled ? "Smart notifications enabled" : "Smart notifications disabled"}
            </Label>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-1">
              <Brain className="h-4 w-4" /> How it works
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
              <li>Analyzes your spending patterns throughout the day</li>
              <li>Compares today's expenses to your 7-day average</li>
              <li>Sends personalized insights 3-4 times daily</li>
              <li>Uses AI to create engaging, helpful messages</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            onClick={handleTestSmartNotification}
            disabled={!smartNotificationsEnabled}
          >
            Test Smart Notification
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default NotificationSettings;
