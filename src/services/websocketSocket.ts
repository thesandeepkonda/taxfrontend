// src/services/websocketSocket.ts
import { Client, StompSubscription } from '@stomp/stompjs';

export class WebSocketService {
  private client: Client | null = null;
  private url: string;
  private onMessageCallback: ((msg: any) => void) | null = null;
  private onConnectCallback: (() => void) | null = null;
  private onDisconnectCallback: (() => void) | null = null;

  // Trackers for dynamic group subscriptions
  private groupSubscriptions: Map<string, StompSubscription> = new Map();
  private pendingGroupSubscriptions: number[] = [];

  constructor(url: string) {
    this.url = url;
  }

  public connect(
    token: string,
    onMessage: (msg: any) => void,
    onConnect: () => void,
    onDisconnect: () => void
  ) {
    this.onMessageCallback = onMessage;
    this.onConnectCallback = onConnect;
    this.onDisconnectCallback = onDisconnect;

    if (this.client && this.client.active) {
      console.log('[WebSocket] Already connected or connecting.');
      return;
    }

    try {
      const wsUrl = `${this.url}?token=${token}`;
      console.log(`[WebSocket] Initiating STOMP connection to: ${wsUrl}`);

      this.client = new Client({
        brokerURL: wsUrl,
        connectHeaders: {
          Authorization: `Bearer ${token}` 
        },
        reconnectDelay: 5000, 
        onConnect: () => {
          console.log('[WebSocket] Connection OPENED successfully!');
          
          const handleMessage = (message: any) => {
            try {
              const parsedData = JSON.parse(message.body);
              console.log('[WebSocket] Message Received:', parsedData);
              
              if (parsedData.isOnline !== undefined || parsedData.unreadCount !== undefined) {
                 parsedData._isSystemEvent = true;
                 parsedData.content = parsedData.content || "SYSTEM_EVENT";
                 parsedData.id = parsedData.id || parsedData.userId || Date.now();
              }
              
              if (this.onMessageCallback) this.onMessageCallback(parsedData);
            } catch (err) {
              console.error('[WebSocket] Message parsing error:', err);
            }
          };

          const handleReceipt = (message: any) => {
            try {
              const parsedData = JSON.parse(message.body);
              console.log('[WebSocket] Receipt Received:', parsedData);
              
              // Wrap single receipt in array and add a flag to identify it
              const dataToDispatch = Array.isArray(parsedData) ? parsedData : [parsedData];
              dataToDispatch.forEach((d: any) => d._isReceipt = true);
              
              if (this.onMessageCallback) this.onMessageCallback(dataToDispatch);
            } catch (err) {
              console.error('[WebSocket] Receipt parsing error:', err);
            }
          };

          // 1. Subscribe to Single (Direct) Messages 
          this.client?.subscribe('/user/queue/chat', handleMessage);
          // 2. Subscribe to fallback
          this.client?.subscribe('/user/queue/messages', handleMessage);
          // 3. Subscribe to Unread Count
          this.client?.subscribe('/user/queue/unread-count', handleMessage);
          // 4. Subscribe to User Online/Offline Status
          this.client?.subscribe('/topic/user-status', handleMessage);
          // 5. Subscribe to Chat Receipts (Direct) - NEW
          this.client?.subscribe('/user/queue/chat-receipts', handleReceipt);

          if (this.pendingGroupSubscriptions.length > 0) {
            this.subscribeToGroups(this.pendingGroupSubscriptions);
            this.pendingGroupSubscriptions = []; 
          }

          if (this.onConnectCallback) this.onConnectCallback();
        },
        onStompError: (frame) => {
          console.error('[WebSocket] STOMP ERROR:', frame.headers['message']);
        },
        onWebSocketError: (error) => {
          console.error('[WebSocket] WS ERROR occurred:', error);
        },
        onWebSocketClose: () => {
          console.log('[WebSocket] Connection CLOSED.');
          if (this.onDisconnectCallback) this.onDisconnectCallback();
        }
      });

      this.client.activate();
    } catch (error) {
      console.error('[WebSocket] Connection Failed to initiate:', error);
    }
  }

  public subscribeToGroups(groupIds: number[]) {
    if (!this.client || !this.client.connected) {
      this.pendingGroupSubscriptions = [...new Set([...this.pendingGroupSubscriptions, ...groupIds])];
      console.log(`[WebSocket] Queued group subscriptions:`, groupIds);
      return;
    }

    groupIds.forEach((groupId) => {
      const groupKey = `group_${groupId}`;
      const receiptKey = `receipt_${groupId}`;

      if (!this.groupSubscriptions.has(groupKey)) {
        const subscription = this.client!.subscribe(`/topic/group/${groupId}`, (message) => {
          try {
            const parsedData = JSON.parse(message.body);
            console.log(`[WebSocket] Group ${groupId} Message Received:`, parsedData);
            if (this.onMessageCallback) this.onMessageCallback(parsedData);
          } catch (err) {
            console.error('[WebSocket] Group Message parsing error:', err);
          }
        });
        this.groupSubscriptions.set(groupKey, subscription);
        console.log(`[WebSocket] Subscribed successfully to Group: ${groupId}`);
      }

      // Subscribe to group read receipts
      if (!this.groupSubscriptions.has(receiptKey)) {
        const receiptSubscription = this.client!.subscribe(`/topic/group/${groupId}/receipts`, (message) => {
          try {
            const parsedData = JSON.parse(message.body);
            console.log(`[WebSocket] Group ${groupId} Receipt Received:`, parsedData);
            
            const dataToDispatch = Array.isArray(parsedData) ? parsedData : [parsedData];
            dataToDispatch.forEach((d: any) => d._isReceipt = true);
            
            if (this.onMessageCallback) this.onMessageCallback(dataToDispatch);
          } catch (err) {
            console.error('[WebSocket] Group Receipt parsing error:', err);
          }
        });
        this.groupSubscriptions.set(receiptKey, receiptSubscription);
      }
    });
  }

  public sendMessage(destination: string, payload: any) {
    if (this.client && this.client.connected) {
      console.log(`[WebSocket] Sending Message to ${destination}:`, payload);
      this.client.publish({
        destination: destination,
        body: JSON.stringify(payload)
      });
    } else {
      console.error('[WebSocket] Cannot send message. STOMP Client is not connected.');
    }
  }

  public disconnect() {
    console.log('[WebSocket] Manual disconnect requested.');
    if (this.client) {
      this.groupSubscriptions.forEach(sub => sub.unsubscribe());
      this.groupSubscriptions.clear();
      
      this.client.deactivate();
      this.client = null;
    }
    if (this.onDisconnectCallback) {
      this.onDisconnectCallback();
    }
  }
}

export const wsService = new WebSocketService('ws://192.168.0.115:8081/ws');