export type InboxNotificationType =
  | 'citizen_activity'
  | 'citizen_report_resolved'
  | 'alert_dispatched'
  | 'disaster_survey'
  | 'ida_application'
  | 'ai_report'
  | 'responder_approval'
  | 'system';

export type InboxNotificationPriority = 'low' | 'normal' | 'high' | 'critical';

export type InboxNotificationItem = {
  id: string;
  type: InboxNotificationType;
  title: string;
  body: string;
  priority: InboxNotificationPriority;
  read: boolean;
  deepLink?: string;
  meta?: Record<string, unknown>;
  createdAt: string;
  displayTime: string;
};

export type InboxNotificationListResponse = {
  items: InboxNotificationItem[];
  unreadCount: number;
  total: number;
};
