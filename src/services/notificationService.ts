// Push Notification Service for Villa Sun Staff Management
export interface NotificationData {
  id: string;
  recipient: string; // 'admin' | 'all' | specific userId
  sender: string;
  message: string;
  type: 'task_completion' | 'login' | 'checkout_request' | 'task_approved' | 'task_rejected' | 
        'checkout_approved' | 'checkout_rejected' | 'new_task' | 'schedule_published' | 'points_earned';
  timestamp: Date;
  read: boolean;
}

class NotificationService {
  private notifications: NotificationData[] = [];
  private listeners: ((notification: NotificationData) => void)[] = [];

  constructor() {
    // Request notification permission on initialization
    this.requestPermission();
  }

  private async requestPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }

  private showBrowserNotification(title: string, body: string) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.png',
        badge: '/favicon.png',
        tag: 'villa-sun-notification'
      });
    }
  }

  public sendNotification(data: Omit<NotificationData, 'id' | 'timestamp' | 'read'>) {
    const notification: NotificationData = {
      ...data,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };

    this.notifications.push(notification);
    
    // Show browser notification
    this.showBrowserNotification('Villa Sun', notification.message);
    
    // Notify listeners
    this.listeners.forEach(listener => listener(notification));
    
    // Store in localStorage for persistence
    localStorage.setItem('villa_sun_notifications', JSON.stringify(this.notifications));
    
    console.log(`Push notification sent to ${data.recipient}: ${data.message} (${data.type})`);
  }

  // Admin notifications
  public notifyAdminTaskCompleted(staffName: string, taskTitle: string) {
    this.sendNotification({
      recipient: 'admin',
      sender: 'system',
      message: `${staffName} hat Aufgabe "${taskTitle}" als erledigt gemeldet`,
      type: 'task_completion'
    });
  }

  public notifyAdminStaffLogin(staffName: string) {
    this.sendNotification({
      recipient: 'admin',
      sender: 'system',
      message: `${staffName} hat sich eingeloggt`,
      type: 'login'
    });
  }

  public notifyAdminCheckoutRequest(staffName: string, reason?: string) {
    const message = reason 
      ? `${staffName} hat Feierabend beantragt: ${reason}`
      : `${staffName} hat Feierabend beantragt`;
    
    this.sendNotification({
      recipient: 'admin',
      sender: 'system',
      message,
      type: 'checkout_request'
    });
  }

  // Staff notifications
  public notifyStaffTaskApproved(staffId: string, taskTitle: string) {
    this.sendNotification({
      recipient: staffId,
      sender: 'admin',
      message: `Ihre Aufgabe "${taskTitle}" wurde bestätigt`,
      type: 'task_approved'
    });
  }

  public notifyStaffTaskRejected(staffId: string, taskTitle: string) {
    this.sendNotification({
      recipient: staffId,
      sender: 'admin',
      message: `Ihre Aufgabe "${taskTitle}" wurde abgelehnt`,
      type: 'task_rejected'
    });
  }

  public notifyStaffCheckoutApproved(staffId: string) {
    this.sendNotification({
      recipient: staffId,
      sender: 'admin',
      message: `Ihr Feierabend wurde genehmigt - Sie können ausstempeln`,
      type: 'checkout_approved'
    });
  }

  public notifyStaffCheckoutRejected(staffId: string) {
    this.sendNotification({
      recipient: staffId,
      sender: 'admin',
      message: `Ihr Feierabend-Antrag wurde abgelehnt`,
      type: 'checkout_rejected'
    });
  }

  public notifyStaffNewTask(staffId: string | 'all', taskTitle: string) {
    const message = `Neue Aufgabe erstellt: "${taskTitle}"`;
    
    if (staffId === 'all') {
      this.sendNotification({
        recipient: 'all',
        sender: 'admin',
        message,
        type: 'new_task'
      });
    } else {
      this.sendNotification({
        recipient: staffId,
        sender: 'admin',
        message,
        type: 'new_task'
      });
    }
  }

  public notifyStaffSchedulePublished() {
    this.sendNotification({
      recipient: 'all',
      sender: 'admin',
      message: `Neuer Dienstplan wurde veröffentlicht`,
      type: 'schedule_published'
    });
  }

  public notifyStaffLogin(staffId: string, staffName: string) {
    this.sendNotification({
      recipient: staffId,
      sender: 'system',
      message: `Sie haben sich erfolgreich eingeloggt`,
      type: 'login'
    });
  }

  public notifyStaffPointsEarned(staffId: string, points: number, taskTitle: string) {
    this.sendNotification({
      recipient: staffId,
      sender: 'system',
      message: `Sie haben ${points} Punkte für "${taskTitle}" erhalten`,
      type: 'points_earned'
    });
  }

  // Utility methods
  public getNotifications(userId: string): NotificationData[] {
    return this.notifications.filter(n => 
      n.recipient === userId || 
      n.recipient === 'all' || 
      (n.recipient === 'admin' && userId === 'admin')
    );
  }

  public markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      localStorage.setItem('villa_sun_notifications', JSON.stringify(this.notifications));
    }
  }

  public getUnreadCount(userId: string): number {
    return this.getNotifications(userId).filter(n => !n.read).length;
  }

  public addListener(listener: (notification: NotificationData) => void) {
    this.listeners.push(listener);
  }

  public removeListener(listener: (notification: NotificationData) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  // Load notifications from localStorage
  public loadNotifications() {
    const stored = localStorage.getItem('villa_sun_notifications');
    if (stored) {
      this.notifications = JSON.parse(stored);
    }
  }
}

// Create singleton instance and export it as named export
const notificationServiceInstance = new NotificationService();

// Initialize notifications on app start
notificationServiceInstance.loadNotifications();

// Export both named and default exports
export const notificationService = notificationServiceInstance;
export default notificationServiceInstance;