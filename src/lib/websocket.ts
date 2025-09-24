// Enterprise WebSocket connection manager with auto-reconnect and message queuing

import { EventEmitter } from 'events';
import { useNotificationStore } from '../stores/notificationStore';
import { createNotification } from '../stores/notificationStore';
import type { WebSocketMessage, ConnectionState } from '../stores/types';

// WebSocket event types
export type WebSocketEventType = 
  | 'market-price-update'
  | 'market-status-change'
  | 'dashboard-data-update'
  | 'notification'
  | 'system-alert'
  | 'user-action'
  | 'heartbeat'
  | 'error';

// Message priority levels
export type MessagePriority = 'low' | 'medium' | 'high' | 'critical';

// WebSocket configuration
interface WebSocketConfig {
  url: string;
  protocols?: string | string[];
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  messageQueueSize: number;
  enableCompression: boolean;
  enableAutoReconnect: boolean;
}

// Default configuration
const defaultConfig: WebSocketConfig = {
  url: process.env.VITE_WS_URL || 'ws://localhost:5000/ws',
  reconnectInterval: 1000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000, // 30 seconds
  messageQueueSize: 1000,
  enableCompression: true,
  enableAutoReconnect: true,
};

// Message queue item
interface QueuedMessage {
  id: string;
  type: string;
  channel: string;
  data: any;
  priority: MessagePriority;
  timestamp: Date;
  retries: number;
  maxRetries: number;
}

// Subscription
interface Subscription {
  id: string;
  channel: string;
  callback: (message: WebSocketMessage) => void;
  filter?: (message: WebSocketMessage) => boolean;
  priority: MessagePriority;
  active: boolean;
}

class WebSocketManager extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private connectionState: ConnectionState;
  private subscriptions: Map<string, Subscription> = new Map();
  private messageQueue: QueuedMessage[] = [];
  private reconnectAttempts = 0;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isIntentionallyClosed = false;
  private latencyMeasurement: { start: number; end: number | null } = { start: 0, end: null };

  constructor(config: Partial<WebSocketConfig> = {}) {
    super();
    this.config = { ...defaultConfig, ...config };
    this.connectionState = {
      status: 'disconnected',
      lastConnected: null,
      lastDisconnected: null,
      reconnectAttempts: 0,
      latency: null,
      error: null,
    };

    // Bind methods
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.send = this.send.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.unsubscribe = this.unsubscribe.bind(this);

    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
      window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    }
  }

  // Connect to WebSocket
  async connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    this.isIntentionallyClosed = false;
    this.updateConnectionState({ status: 'connecting', error: null });

    try {
      const protocols = this.config.protocols;
      this.ws = new WebSocket(this.config.url, protocols);

      // Set up event listeners
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);

      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);

        const handleOpen = () => {
          clearTimeout(timeout);
          this.ws?.removeEventListener('open', handleOpen);
          this.ws?.removeEventListener('error', handleError);
          resolve();
        };

        const handleError = (error: Event) => {
          clearTimeout(timeout);
          this.ws?.removeEventListener('open', handleOpen);
          this.ws?.removeEventListener('error', handleError);
          reject(new Error('Connection failed'));
        };

        this.ws?.addEventListener('open', handleOpen);
        this.ws?.addEventListener('error', handleError);
      });
    } catch (error) {
      this.updateConnectionState({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown connection error',
      });
      throw error;
    }
  }

  // Disconnect from WebSocket
  disconnect(): void {
    this.isIntentionallyClosed = true;
    this.clearTimers();
    
    if (this.ws) {
      this.ws.close(1000, 'Intentional disconnect');
      this.ws = null;
    }

    this.updateConnectionState({
      status: 'disconnected',
      lastDisconnected: new Date(),
    });
  }

  // Send message through WebSocket
  send(type: string, channel: string, data: any, priority: MessagePriority = 'medium'): Promise<void> {
    const message: WebSocketMessage = {
      id: this.generateId(),
      type,
      channel,
      data,
      timestamp: new Date(),
      priority,
    };

    return this.sendMessage(message);
  }

  // Send message with queuing support
  private async sendMessage(message: WebSocketMessage): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        this.emit('messageSent', message);
        return;
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    }

    // Queue message if not connected
    if (this.messageQueue.length < this.config.messageQueueSize) {
      const queuedMessage: QueuedMessage = {
        id: message.id,
        type: message.type,
        channel: message.channel,
        data: message.data,
        priority: message.priority,
        timestamp: message.timestamp,
        retries: 0,
        maxRetries: message.priority === 'critical' ? 5 : 3,
      };

      this.messageQueue.push(queuedMessage);
      this.sortMessageQueue();
      this.emit('messageQueued', queuedMessage);
    } else {
      throw new Error('Message queue full');
    }
  }

  // Subscribe to channel with callback
  subscribe(
    channel: string,
    callback: (message: WebSocketMessage) => void,
    options: {
      filter?: (message: WebSocketMessage) => boolean;
      priority?: MessagePriority;
    } = {}
  ): string {
    const subscriptionId = this.generateId();
    
    const subscription: Subscription = {
      id: subscriptionId,
      channel,
      callback,
      filter: options.filter,
      priority: options.priority || 'medium',
      active: true,
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Send subscription message to server
    this.send('subscribe', channel, { subscriptionId }, options.priority);

    this.emit('subscribed', { subscriptionId, channel });
    return subscriptionId;
  }

  // Unsubscribe from channel
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    
    if (subscription) {
      subscription.active = false;
      this.subscriptions.delete(subscriptionId);

      // Send unsubscription message to server
      this.send('unsubscribe', subscription.channel, { subscriptionId });

      this.emit('unsubscribed', { subscriptionId, channel: subscription.channel });
    }
  }

  // Get connection status
  getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  // Get subscription count
  getSubscriptionCount(): number {
    return Array.from(this.subscriptions.values()).filter(sub => sub.active).length;
  }

  // Get message queue status
  getQueueStatus(): { length: number; size: number } {
    return {
      length: this.messageQueue.length,
      size: this.config.messageQueueSize,
    };
  }

  // Event handlers
  private handleOpen(): void {
    console.log('WebSocket connected');
    
    this.reconnectAttempts = 0;
    this.updateConnectionState({
      status: 'connected',
      lastConnected: new Date(),
      reconnectAttempts: 0,
      error: null,
    });

    // Start heartbeat
    this.startHeartbeat();

    // Process message queue
    this.processMessageQueue();

    // Resubscribe to all active channels
    this.resubscribeAll();

    this.emit('connected');
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      // Handle heartbeat response
      if (message.type === 'heartbeat_response') {
        this.latencyMeasurement.end = Date.now();
        const latency = this.latencyMeasurement.end - this.latencyMeasurement.start;
        this.updateConnectionState({ latency });
        return;
      }

      // Route message to subscribers
      this.routeMessage(message);
      
      this.emit('message', message);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
      this.emit('parseError', error);
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log('WebSocket disconnected:', event.code, event.reason);
    
    this.clearTimers();
    this.ws = null;
    
    this.updateConnectionState({
      status: 'disconnected',
      lastDisconnected: new Date(),
    });

    this.emit('disconnected', { code: event.code, reason: event.reason });

    // Auto-reconnect if enabled and not intentionally closed
    if (this.config.enableAutoReconnect && !this.isIntentionallyClosed) {
      this.scheduleReconnect();
    }
  }

  private handleError(error: Event): void {
    console.error('WebSocket error:', error);
    
    this.updateConnectionState({
      status: 'error',
      error: 'WebSocket connection error',
    });

    this.emit('error', error);

    // Show user notification for connection errors
    const notificationStore = useNotificationStore.getState();
    notificationStore.actions.addNotification(
      createNotification.error(
        'Connection Error',
        'Lost connection to real-time data. Attempting to reconnect...',
        { category: 'connection' }
      )
    );
  }

  // Auto-reconnect logic
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      this.updateConnectionState({
        status: 'error',
        error: 'Max reconnection attempts exceeded',
      });
      return;
    }

    this.reconnectAttempts++;
    this.updateConnectionState({
      status: 'connecting',
      reconnectAttempts: this.reconnectAttempts,
    });

    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      30000
    );

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  // Heartbeat management
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.latencyMeasurement.start = Date.now();
        this.latencyMeasurement.end = null;
        
        this.ws.send(JSON.stringify({
          id: this.generateId(),
          type: 'heartbeat',
          channel: 'system',
          data: { timestamp: Date.now() },
          timestamp: new Date(),
          priority: 'low',
        }));
      }
    }, this.config.heartbeatInterval);
  }

  // Message routing
  private routeMessage(message: WebSocketMessage): void {
    const relevantSubscriptions = Array.from(this.subscriptions.values())
      .filter(sub => 
        sub.active && 
        sub.channel === message.channel &&
        (!sub.filter || sub.filter(message))
      )
      .sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority));

    relevantSubscriptions.forEach(subscription => {
      try {
        subscription.callback(message);
      } catch (error) {
        console.error('Error in subscription callback:', error);
        this.emit('callbackError', { error, subscription, message });
      }
    });
  }

  // Message queue management
  private processMessageQueue(): void {
    const messagesToSend = [...this.messageQueue];
    this.messageQueue = [];

    messagesToSend.forEach(queuedMessage => {
      const message: WebSocketMessage = {
        id: queuedMessage.id,
        type: queuedMessage.type,
        channel: queuedMessage.channel,
        data: queuedMessage.data,
        timestamp: queuedMessage.timestamp,
        priority: queuedMessage.priority,
      };

      this.sendMessage(message).catch(error => {
        // Re-queue with retry logic
        if (queuedMessage.retries < queuedMessage.maxRetries) {
          queuedMessage.retries++;
          this.messageQueue.push(queuedMessage);
        } else {
          console.error('Message delivery failed after max retries:', queuedMessage);
          this.emit('messageDeliveryFailed', queuedMessage);
        }
      });
    });
  }

  private sortMessageQueue(): void {
    this.messageQueue.sort((a, b) => {
      const priorityDiff = this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority);
      if (priorityDiff !== 0) return priorityDiff;
      return a.timestamp.getTime() - b.timestamp.getTime();
    });
  }

  private getPriorityWeight(priority: MessagePriority): number {
    switch (priority) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 1;
    }
  }

  // Resubscription after reconnect
  private resubscribeAll(): void {
    Array.from(this.subscriptions.values())
      .filter(sub => sub.active)
      .forEach(subscription => {
        this.send('subscribe', subscription.channel, {
          subscriptionId: subscription.id,
        }, subscription.priority);
      });
  }

  // Utility methods
  private updateConnectionState(updates: Partial<ConnectionState>): void {
    this.connectionState = { ...this.connectionState, ...updates };
    this.emit('connectionStateChanged', this.connectionState);
  }

  private clearTimers(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private generateId(): string {
    return `${Date.now()}-${crypto.randomUUID().substr(2, 9)}`;
  }

  // Network event handlers
  private handleOnline(): void {
    console.log('Network came online');
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connect();
    }
  }

  private handleOffline(): void {
    console.log('Network went offline');
    // Don't close connection immediately, let it timeout naturally
  }

  private handleBeforeUnload(): void {
    this.isIntentionallyClosed = true;
    this.disconnect();
  }

  // Cleanup
  destroy(): void {
    this.disconnect();
    
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline.bind(this));
      window.removeEventListener('offline', this.handleOffline.bind(this));
      window.removeEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    }

    this.subscriptions.clear();
    this.messageQueue = [];
    this.removeAllListeners();
  }
}

// Global WebSocket manager instance
let wsManager: WebSocketManager | null = null;

export const getWebSocketManager = (config?: Partial<WebSocketConfig>): WebSocketManager => {
  if (!wsManager) {
    wsManager = new WebSocketManager(config);
  }
  return wsManager;
};

export const destroyWebSocketManager = (): void => {
  if (wsManager) {
    wsManager.destroy();
    wsManager = null;
  }
};

export { WebSocketManager };
export type { WebSocketConfig, QueuedMessage, Subscription };