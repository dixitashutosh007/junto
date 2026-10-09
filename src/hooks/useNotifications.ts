'use client';

import { useState } from 'react';
import { useIsClient } from '@/hooks/useIsClient';

export function useNotifications() {
  const isClient = useIsClient();
  const isSupported = isClient && 'Notification' in window && 'serviceWorker' in navigator;
  // Set after the user answers the permission prompt; otherwise read the browser's value
  const [answeredPermission, setPermission] = useState<NotificationPermission | null>(null);
  const permission: NotificationPermission =
    answeredPermission ?? (isSupported ? Notification.permission : 'default');

  const requestPermission = async () => {
    if (!isSupported) return false;
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        // Send a friendly local test notification
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          reg.showNotification('Junto Notifications Enabled', {
            body: 'You will now receive updates on matches, seat requests, and confirmations.',
            icon: '/icons/icon-192.png',
          });
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error requesting notification permission', e);
      return false;
    }
  };

  return {
    isSupported,
    permission,
    requestPermission,
  };
}
