// src/contexts/ChatContext.tsx
import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { wsService } from '../services/websocketSocket';
import { AppDispatch, RootState } from '../store';
import { 
  setConnected, 
  setConnecting, 
  setConnectionError, 
  receiveMessage 
} from '../store/slices/chatSlice';

interface ChatContextType {
  sendMessage: (content: string) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  
  const user = useSelector((state: RootState) => state.auth.user);
  const reduxToken = useSelector((state: RootState) => state.auth.accessToken);
  const accessToken = reduxToken || localStorage.getItem('accessToken');
  
  useEffect(() => {
    // Connect only if user is authenticated and we have a token
    if (user && accessToken) {
      dispatch(setConnecting(true));

      wsService.connect(
        accessToken,
        (incomingMessage) => {
          console.log('[ChatProvider] Dispatching incoming message to Redux store', incomingMessage);
          
          // FIX: Bypass reshaping for Receipts and System Events
          if (
            incomingMessage.type === 'DIRECT_READ' || 
            incomingMessage.type === 'GROUP_READ' || 
            incomingMessage._isReceipt ||
            incomingMessage.isOnline !== undefined ||
            incomingMessage.unreadCount !== undefined
          ) {
            dispatch(receiveMessage(incomingMessage));
            return;
          }

          // Normal Chat Message Processing
          dispatch(receiveMessage({
            ...incomingMessage,
            id: incomingMessage.id || Date.now(),
            senderId: incomingMessage.senderId,
            senderName: incomingMessage.senderName,
            recipientId: incomingMessage.recipientId, 
            groupId: incomingMessage.groupId,         
            content: incomingMessage.content,
            fileUrl: incomingMessage.fileUrl,         
            fileName: incomingMessage.fileName,       
            type: incomingMessage.type || 'TEXT',     
            timestamp: incomingMessage.timestamp || new Date().toISOString(),
            isRead: incomingMessage.isRead ?? false,
            isMine: String(incomingMessage.senderId) === String(user.id)
          }));
        },
        () => {
          dispatch(setConnected(true));
        },
        () => {
          dispatch(setConnected(false));
          dispatch(setConnectionError('Disconnected from chat server'));
        }
      );
    }

    return () => {
      wsService.disconnect();
    };
  }, [user, accessToken, dispatch]);

  const sendMessage = useCallback((content: string) => {
     // Intentionally empty or fallback, actual sending is done via Thunk from ChatWindow
  }, []);

  return (
    <ChatContext.Provider value={{ sendMessage }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};