// src/store/slices/chatSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import { wsService } from '../../services/websocketSocket';

// --- Types ---
export interface ChatMessage {
  id: number;
  senderId: number;
  senderName: string;
  recipientId: number | null;
  groupId: number | null;
  content: string;
  fileUrl?: string | null;
  fileName?: string | null;
  type: string;
  timestamp: string;
  isRead: boolean;
  isMine?: boolean;
  isDeleted?: boolean;
  replyToId?: number | null;
  isForwarded?: boolean;
  isEdited?: boolean;
  editedAt?: string;
  reactions?: Record<string, string>;
  isPinned?: boolean;
  replyToMessage?: {
    id: number;
    senderId: number;
    senderName: string;
    content: string;
    type: string;
  } | null;
}

export interface SidebarItem {
  id: number;
  name: string;
  type: string;
  updatedAt: string;
  unreadCount: number;
  isOnline: boolean;
}

export interface ContactItem {
  id: number;
  name: string;
  departmentName: string;
  roleName: string;
  isOnline: boolean;
}

export interface ActiveChat {
  id: number;
  name: string;
  type: 'USER' | 'GROUP';
}

export interface SendMessagePayload {
  recipientId?: number;
  groupId?: number;
  content: string;
  type: string;
  replyToId?: number;
  isForwarded?: boolean;
}

export interface SendFilePayload {
  file: File;
  recipientId?: number;
  groupId?: number;
  content?: string;
  replyToId?: number;
  isForwarded?: boolean;
}

export interface FetchHistoryParams {
  id: number;
  type: 'USER' | 'GROUP';
  page?: number;
  size?: number;
}

export interface EditPayload {
  id: number;
  content: string;
}

export interface ForwardPayload {
  messageId: number;
  recipientIds: number[];
  groupIds: number[];
}

export interface GroupMemberDto {
  userId: number;
  name: string;
  employeeCode: string;
}

export interface GroupMembersResponseDto {
  count: number;
  members: GroupMemberDto[];
}

// --- State Interface ---
interface ChatState {
  messages: ChatMessage[];
  searchResults: ChatMessage[];
  pinnedMessages: ChatMessage[];
  groupMembers: GroupMemberDto[];
  groupMemberCount: number;
  isLoadingGroupMembers: boolean;
  isSearchingApi: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  sidebarItems: SidebarItem[];
  contacts: ContactItem[];
  isLoadingSidebar: boolean;
  isLoadingContacts: boolean;
  activeChat: ActiveChat | null;
  isSending: boolean;
  isLoadingHistory: boolean;
  editingMessage: EditPayload | null;
  forwardingMessage: ChatMessage | null;
  replyingMessage: ChatMessage | null;
}

const initialState: ChatState = {
  messages: [],
  searchResults: [],
  pinnedMessages: [],
  groupMembers: [],
  groupMemberCount: 0,
  isLoadingGroupMembers: false,
  isSearchingApi: false,
  isConnected: false,
  isConnecting: false,
  error: null,
  sidebarItems: [],
  contacts: [],
  isLoadingSidebar: false,
  isLoadingContacts: false,
  activeChat: null,
  isSending: false,
  isLoadingHistory: false,
  editingMessage: null,
  forwardingMessage: null,
  replyingMessage: null,
};

// --- Async Thunks ---
export const fetchSidebar = createAsyncThunk(
  'chat/fetchSidebar',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/chat/sidebar');
      const sidebarData: SidebarItem[] = response.data;
      const groupIds = sidebarData
        .filter(item => item.type === 'GROUP')
        .map(item => item.id);
      
      if (groupIds.length > 0) {
        wsService.subscribeToGroups(groupIds);
      }
      return sidebarData;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch sidebar');
    }
  }
);

export const fetchContacts = createAsyncThunk(
  'chat/fetchContacts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/chat/contacts');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch contacts');
    }
  }
);

export const fetchChatHistory = createAsyncThunk(
  'chat/fetchHistory',
  async ({ id, type, page = 0, size = 10 }: FetchHistoryParams, { rejectWithValue }) => {
    try {
      const endpoint = type === 'GROUP' ? `/chat/messages/group/${id}` : `/chat/messages/direct/${id}`;
      const response = await api.get(endpoint, { params: { page, size } });
      return { data: response.data, page };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch chat history');
    }
  }
);

export const searchChatMessages = createAsyncThunk(
  'chat/searchMessages',
  async ({ keyword, id, type }: { keyword: string; id: number; type: 'USER' | 'GROUP' }, { rejectWithValue }) => {
    try {
      const params: any = { keyword };
      if (type === 'GROUP') {
        params.groupId = id;
      } else {
        params.partnerId = id;
      }
      const response = await api.get('/chat/messages/search', { params });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search messages');
    }
  }
);

export const clearChatThunk = createAsyncThunk(
  'chat/clearChatThunk',
  async ({ id, type }: { id: number; type: 'USER' | 'GROUP' }, { rejectWithValue }) => {
    try {
      if (type === 'GROUP') {
        await api.delete(`/chat/group/${id}/clear`);
      } else {
        await api.delete(`/chat/direct/${id}/clear`);
      }
      return { id, type };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to clear chat');
    }
  }
);

export const fetchPinnedMessages = createAsyncThunk(
  'chat/fetchPinnedMessages',
  async ({ id, type }: { id: number; type: 'USER' | 'GROUP' }, { rejectWithValue }) => {
    try {
      const params: any = {};
      if (type === 'GROUP') params.groupId = id;
      else params.partnerId = id;
      const response = await api.get('/chat/pinned', { params });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch pinned messages');
    }
  }
);

export const togglePinMessage = createAsyncThunk(
  'chat/togglePinMessage',
  async (messageId: number, { rejectWithValue }) => {
    try {
      const response = await api.put(`/chat/messages/${messageId}/pin`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle pin message');
    }
  }
);

export const fetchGroupMembers = createAsyncThunk(
  'chat/fetchGroupMembers',
  async (groupId: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/chat/group/${groupId}/members`);
      return response.data as GroupMembersResponseDto;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch group members');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (payload: SendMessagePayload, { rejectWithValue, getState }) => {
    try {
      wsService.sendMessage("/app/chat.sendMessage", payload);
      
      const state = getState() as any;
      const currentUser = state.auth.user;
      const currentUserId = Number(currentUser?.id || 0);
      
      const replyingMsg = state.chat.replyingMessage;
      
      return {
        id: Date.now(), 
        senderId: currentUserId,
        senderName: currentUser?.name || "Me",
        recipientId: payload.recipientId || null,
        groupId: payload.groupId || null,
        content: payload.content,
        type: payload.type,
        timestamp: new Date().toISOString(),
        isRead: false,
        isMine: true,
        replyToId: payload.replyToId || null,
        replyToMessage: replyingMsg ? {
          id: replyingMsg.id,
          senderId: replyingMsg.senderId,
          senderName: replyingMsg.senderName,
          content: replyingMsg.content || replyingMsg.fileName || 'Attachment',
          type: replyingMsg.type
        } : null
      } as ChatMessage;
    } catch (error: any) {
      return rejectWithValue('Failed to send message via WebSocket');
    }
  }
);

export const sendFileMessage = createAsyncThunk(
  'chat/sendFileMessage',
  async (payload: SendFilePayload, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', payload.file);
      if (payload.recipientId) formData.append('recipientId', payload.recipientId.toString());
      if (payload.groupId) formData.append('groupId', payload.groupId.toString());
      if (payload.replyToId) formData.append('replyToId', payload.replyToId.toString());
      if (payload.isForwarded !== undefined) formData.append('isForwarded', payload.isForwarded.toString());
      
      const messageContent = payload.content || payload.file.name;
      formData.append('content', messageContent);

      const response = await api.post('/chat/messages/file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send file');
    }
  }
);

export const deleteMessage = createAsyncThunk(
  'chat/deleteMessage',
  async (messageId: number, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/chat/messages/${messageId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete message');
    }
  }
);

export const editMessage = createAsyncThunk(
  'chat/editMessage',
  async ({ messageId, content }: { messageId: number; content: string }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/chat/messages/${messageId}`, { content });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to edit message');
    }
  }
);

export const reactToMessage = createAsyncThunk(
  'chat/reactToMessage',
  async ({ messageId, emoji }: { messageId: number; emoji: string }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/chat/messages/${messageId}/react`, { emoji });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to react to message');
    }
  }
);

export const removeReaction = createAsyncThunk(
  'chat/removeReaction',
  async (messageId: number, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/chat/messages/${messageId}/react`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove reaction');
    }
  }
);

export const forwardMessage = createAsyncThunk(
  'chat/forwardMessage',
  async ({ messageId, recipientIds, groupIds }: ForwardPayload, { rejectWithValue }) => {
    try {
      const response = await api.post(`/chat/messages/${messageId}/forward`, { recipientIds, groupIds });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to forward message');
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveChat: (state, action: PayloadAction<ActiveChat | null>) => {
      state.activeChat = action.payload;
      state.searchResults = [];
      state.pinnedMessages = [];
      state.groupMembers = [];
      state.groupMemberCount = 0;
      state.replyingMessage = null;
    },
    setConnecting: (state, action: PayloadAction<boolean>) => {
      state.isConnecting = action.payload;
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
      state.isConnecting = false;
      if (action.payload) state.error = null;
    },
    setConnectionError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isConnected = false;
      state.isConnecting = false;
    },
    setEditingMessage: (state, action: PayloadAction<EditPayload | null>) => {
      state.editingMessage = action.payload;
      if (action.payload) state.replyingMessage = null;
    },
    setForwardingMessage: (state, action: PayloadAction<ChatMessage | null>) => {
      state.forwardingMessage = action.payload;
    },
    setReplyingMessage: (state, action: PayloadAction<ChatMessage | null>) => {
      state.replyingMessage = action.payload;
      if (action.payload) state.editingMessage = null;
    },
    markChatAsReadLocal: (state, action: PayloadAction<{ id: number, type: string }>) => {
      const { id, type } = action.payload;
      const isGroup = type === 'GROUP';
      const sidebarIndex = state.sidebarItems.findIndex(s => 
         Number(s.id) === Number(id) && (isGroup ? s.type === 'GROUP' : s.type !== 'GROUP')
      );
      if (sidebarIndex !== -1) {
        state.sidebarItems[sidebarIndex].unreadCount = 0;
      }
    },
    receiveMessage: (state, action: PayloadAction<ChatMessage | any>) => {
      const incomingPayload = action.payload;

      // 1. Process Message Receipts First (Bypass normal logic)
      const handleSingleReceipt = (data: any) => {
        // DIRECT_READ logic - Force update ALL our sent messages to this reader as read
        if (data.type === 'DIRECT_READ' && data.readerId !== undefined) {
           state.messages.forEach(m => {
               if (m.isMine && (Number(m.recipientId) === Number(data.readerId) || Number(state.activeChat?.id) === Number(data.readerId))) {
                   m.isRead = true; // Instantly applies Blue Ticks to all
               }
           });
           return true; 
        }

        // GROUP_READ logic - Force update ALL our sent messages to this group as read
        if (data.type === 'GROUP_READ' && data.groupId !== undefined) {
           state.messages.forEach(m => {
               if (m.isMine && Number(m.groupId) === Number(data.groupId)) {
                   m.isRead = true; // Instantly applies Blue Ticks to all
               }
           });
           return true;
        }

        // Fallback explicit receipt mapping
        if (data._isReceipt || (data.isRead !== undefined && data.id !== undefined && data.content === undefined)) {
          const receiptId = data.id ?? data.messageId;
          if (receiptId !== undefined) {
             const existingIndex = state.messages.findIndex(m => Number(m.id) === Number(receiptId));
             if (existingIndex !== -1) {
                 state.messages[existingIndex].isRead = data.isRead !== undefined ? data.isRead : true;
             } else {
                 // Fallback if ID doesn't match: just mark all mine as read as a safety net
                 state.messages.forEach(m => { if (m.isMine) m.isRead = true; });
             }
          }
          return true;
        }
        return false;
      };

      if (Array.isArray(incomingPayload)) {
        let isAllReceipts = true;
        incomingPayload.forEach(item => {
           if (!handleSingleReceipt(item)) isAllReceipts = false;
        });
        if (isAllReceipts) return; // Completely stop if payload was pure receipts array
      } else {
        if (handleSingleReceipt(incomingPayload)) return;
      }

      // 2. Normal Message Processing
      const incoming = Array.isArray(incomingPayload) ? incomingPayload[0] : incomingPayload;
      if (!incoming) return;

      let isSystemEventProcessed = false;
      
      if (incoming.isOnline !== undefined && incoming.userId !== undefined) {
        const targetId = incoming.userId;
        const isOnlineStatus = incoming.isOnline === true || String(incoming.isOnline).toLowerCase() === 'true';
        
        const contactIndex = state.contacts.findIndex(c => Number(c.id) === Number(targetId));
        if (contactIndex !== -1) {
          state.contacts[contactIndex].isOnline = isOnlineStatus;
        }
        
        const sidebarIndex = state.sidebarItems.findIndex(s => Number(s.id) === Number(targetId) && s.type !== 'GROUP');
        if (sidebarIndex !== -1) {
          state.sidebarItems[sidebarIndex].isOnline = isOnlineStatus;
        }
        isSystemEventProcessed = true;
      }

      if (incoming.unreadCount !== undefined || incoming.count !== undefined) {
        const unreadVal = Number(incoming.unreadCount ?? incoming.count);
        const targetId = incoming.chatId ?? incoming.groupId ?? incoming.userId ?? incoming.senderId ?? incoming.id;
        
        if (targetId !== undefined && targetId !== incoming.id) { 
          const isGroup = incoming.type === 'GROUP' || incoming.groupId !== undefined;
          const sidebarIndex = state.sidebarItems.findIndex(s => 
             Number(s.id) === Number(targetId) && 
             (isGroup ? s.type === 'GROUP' : s.type !== 'GROUP')
          );
          if (sidebarIndex !== -1) {
            state.sidebarItems[sidebarIndex].unreadCount = unreadVal;
          }
        }
        isSystemEventProcessed = true;
      }
      
      if (incoming._isSystemEvent || isSystemEventProcessed) {
        if (incoming.content === 'SYSTEM_EVENT' || incoming.content === undefined) return;
      }

      const activeChatId = state.activeChat ? Number(state.activeChat.id) : null;
      const incomingGroupId = incoming.groupId ? Number(incoming.groupId) : null;
      const incomingSenderId = incoming.senderId ? Number(incoming.senderId) : null;
      const incomingRecipientId = incoming.recipientId ? Number(incoming.recipientId) : null;

      const isActiveChat = state.activeChat && (
        (state.activeChat.type === 'GROUP' && activeChatId === incomingGroupId) ||
        (state.activeChat.type !== 'GROUP' && (activeChatId === incomingSenderId || activeChatId === incomingRecipientId))
      );

      if (isActiveChat) {
        const existingIndex = state.messages.findIndex(m => Number(m.id) === Number(incoming.id));
        
        if (existingIndex !== -1) {
          state.messages[existingIndex] = { ...state.messages[existingIndex], ...incoming };
        } else {
          // If the message is ours, update the temporary Date.now() ID with the real backend ID
          const tempIndex = state.messages.findIndex(m => m.isMine && m.content === incoming.content && Number(m.id) > 1000000000000);
          if (tempIndex !== -1) {
            state.messages[tempIndex] = { ...incoming, isMine: true };
          } else {
            state.messages.push(incoming);
          }
        }
      }

      if (incoming.isPinned !== undefined) {
        if (incoming.isPinned) {
           const exists = state.pinnedMessages.find(p => Number(p.id) === Number(incoming.id));
           if (!exists) state.pinnedMessages.push(incoming);
           else {
              const pIdx = state.pinnedMessages.findIndex(p => Number(p.id) === Number(incoming.id));
              state.pinnedMessages[pIdx] = incoming;
           }
        } else {
           state.pinnedMessages = state.pinnedMessages.filter(p => Number(p.id) !== Number(incoming.id));
        }
      }

      const sidebarIndex = state.sidebarItems.findIndex(item =>
        (item.type === 'GROUP' && Number(item.id) === incomingGroupId) ||
        (item.type !== 'GROUP' && (Number(item.id) === incomingSenderId || Number(item.id) === incomingRecipientId))
      );
      
      if (sidebarIndex !== -1) {
        const itemToUpdate = state.sidebarItems.splice(sidebarIndex, 1)[0];
        itemToUpdate.updatedAt = incoming.timestamp || new Date().toISOString();
        if (!isActiveChat && !incoming.isMine) {
          itemToUpdate.unreadCount = (itemToUpdate.unreadCount || 0) + 1;
        }
        state.sidebarItems.unshift(itemToUpdate);
      } else if (!isActiveChat && !incomingGroupId && incomingSenderId !== null) {
          state.sidebarItems.unshift({
              id: incomingSenderId,
              name: incoming.senderName || 'Unknown',
              type: 'USER',
              updatedAt: incoming.timestamp || new Date().toISOString(),
              unreadCount: 1,
              isOnline: true
          });
      }
    },
    clearMessages: (state) => {
      state.messages = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSidebar.pending, (state) => {
        state.isLoadingSidebar = true;
        state.error = null;
      })
      .addCase(fetchSidebar.fulfilled, (state, action: PayloadAction<SidebarItem[]>) => {
        state.isLoadingSidebar = false;
        state.sidebarItems = action.payload;
      })
      .addCase(fetchSidebar.rejected, (state, action) => {
        state.isLoadingSidebar = false;
        state.error = action.payload as string;
      })
      .addCase(fetchContacts.pending, (state) => {
        state.isLoadingContacts = true;
        state.error = null;
      })
      .addCase(fetchContacts.fulfilled, (state, action: PayloadAction<ContactItem[]>) => {
        state.isLoadingContacts = false;
        state.contacts = action.payload;
      })
      .addCase(fetchContacts.rejected, (state, action) => {
        state.isLoadingContacts = false;
        state.error = action.payload as string;
      })
      .addCase(fetchChatHistory.pending, (state) => {
        state.isLoadingHistory = true;
        state.error = null;
      })
      .addCase(fetchChatHistory.fulfilled, (state, action) => {
        state.isLoadingHistory = false;
        const content = action.payload.data.content || [];
        const sortedMessages = content.sort((a: ChatMessage, b: ChatMessage) => 
             new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        if (action.payload.page === 0) {
          state.messages = sortedMessages;
        } else {
          state.messages = [...sortedMessages, ...state.messages];
        }
      })
      .addCase(fetchChatHistory.rejected, (state, action) => {
        state.isLoadingHistory = false;
        state.error = action.payload as string;
      })
      .addCase(fetchGroupMembers.pending, (state) => {
        state.isLoadingGroupMembers = true;
      })
      .addCase(fetchGroupMembers.fulfilled, (state, action: PayloadAction<GroupMembersResponseDto>) => {
        state.isLoadingGroupMembers = false;
        state.groupMembers = action.payload.members;
        state.groupMemberCount = action.payload.count;
      })
      .addCase(fetchGroupMembers.rejected, (state) => {
        state.isLoadingGroupMembers = false;
        state.groupMembers = [];
        state.groupMemberCount = 0;
      })
      .addCase(searchChatMessages.pending, (state) => {
        state.isSearchingApi = true;
      })
      .addCase(searchChatMessages.fulfilled, (state, action: PayloadAction<ChatMessage[]>) => {
        state.isSearchingApi = false;
        state.searchResults = action.payload.sort((a, b) => 
           new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      })
      .addCase(searchChatMessages.rejected, (state) => {
        state.isSearchingApi = false;
        state.searchResults = [];
      })
      .addCase(clearChatThunk.fulfilled, (state, action) => {
        const { id, type } = action.payload;
        state.messages = state.messages.filter(m => {
          if (type === 'GROUP') return Number(m.groupId) !== Number(id);
          return !(Number(m.senderId) === Number(id) || Number(m.recipientId) === Number(id));
        });
        state.pinnedMessages = [];
      })
      .addCase(fetchPinnedMessages.fulfilled, (state, action: PayloadAction<ChatMessage[]>) => {
        state.pinnedMessages = action.payload;
      })
      .addCase(togglePinMessage.fulfilled, (state, action: PayloadAction<ChatMessage>) => {
        const updatedMsg = action.payload;
        const index = state.messages.findIndex(m => Number(m.id) === Number(updatedMsg.id));
        if (index !== -1) {
          const wasMine = state.messages[index].isMine;
          state.messages[index] = { ...updatedMsg, isMine: wasMine };
        }
        
        if (updatedMsg.isPinned) {
          const pIndex = state.pinnedMessages.findIndex(m => Number(m.id) === Number(updatedMsg.id));
          if (pIndex === -1) state.pinnedMessages.push(updatedMsg);
        } else {
          state.pinnedMessages = state.pinnedMessages.filter(m => Number(m.id) !== Number(updatedMsg.id));
        }
      })
      .addCase(sendMessage.pending, (state) => {
        state.isSending = true;
      })
      .addCase(sendMessage.fulfilled, (state, action: PayloadAction<ChatMessage>) => {
        state.isSending = false;
        const newMsg = action.payload;
        const exists = state.messages.find(m => Number(m.id) === Number(newMsg.id));
        if (!exists) {
          state.messages.push({ ...newMsg, isMine: true });
        }
        const targetId = newMsg.groupId ? Number(newMsg.groupId) : Number(newMsg.recipientId);
        const isGroup = !!newMsg.groupId;
        
        if (targetId) {
          const sidebarIndex = state.sidebarItems.findIndex(s => 
             Number(s.id) === targetId && (isGroup ? s.type === 'GROUP' : s.type !== 'GROUP')
          );
          if (sidebarIndex === -1) {
            let targetName = 'Unknown';
            let isOnline = false;
            if (!isGroup) {
              const contact = state.contacts.find(c => Number(c.id) === targetId);
              if (contact) {
                targetName = contact.name;
                isOnline = contact.isOnline;
              }
            } else {
              targetName = `Group ${targetId}`;
            }
            state.sidebarItems.unshift({
              id: targetId,
              name: targetName,
              type: isGroup ? 'GROUP' : 'USER',
              updatedAt: newMsg.timestamp || new Date().toISOString(),
              unreadCount: 0,
              isOnline: isOnline
            });
          } else {
            const itemToUpdate = state.sidebarItems.splice(sidebarIndex, 1)[0];
            itemToUpdate.updatedAt = newMsg.timestamp || new Date().toISOString();
            state.sidebarItems.unshift(itemToUpdate);
          }
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isSending = false;
        state.error = action.payload as string;
      })
      .addCase(sendFileMessage.pending, (state) => {
        state.isSending = true;
      })
      .addCase(sendFileMessage.fulfilled, (state, action: PayloadAction<ChatMessage>) => {
        state.isSending = false;
        const newMsg = action.payload;
        const exists = state.messages.find(m => Number(m.id) === Number(newMsg.id));
        if (!exists) {
          state.messages.push({ ...newMsg, isMine: true });
        }
        const targetId = newMsg.groupId ? Number(newMsg.groupId) : Number(newMsg.recipientId);
        const isGroup = !!newMsg.groupId;
        
        if (targetId) {
          const sidebarIndex = state.sidebarItems.findIndex(s => 
             Number(s.id) === targetId && (isGroup ? s.type === 'GROUP' : s.type !== 'GROUP')
          );
          if (sidebarIndex === -1) {
            let targetName = 'Unknown';
            let isOnline = false;
            if (!isGroup) {
              const contact = state.contacts.find(c => Number(c.id) === targetId);
              if (contact) {
                targetName = contact.name;
                isOnline = contact.isOnline;
              }
            } else {
              targetName = `Group ${targetId}`;
            }
            state.sidebarItems.unshift({
              id: targetId,
              name: targetName,
              type: isGroup ? 'GROUP' : 'USER',
              updatedAt: newMsg.timestamp || new Date().toISOString(),
              unreadCount: 0,
              isOnline: isOnline
            });
          } else {
            const itemToUpdate = state.sidebarItems.splice(sidebarIndex, 1)[0];
            itemToUpdate.updatedAt = newMsg.timestamp || new Date().toISOString();
            state.sidebarItems.unshift(itemToUpdate);
          }
        }
      })
      .addCase(sendFileMessage.rejected, (state, action) => {
        state.isSending = false;
        state.error = action.payload as string;
      })
      .addCase(deleteMessage.fulfilled, (state, action: PayloadAction<ChatMessage>) => {
        const deletedMsg = action.payload;
        const index = state.messages.findIndex(m => Number(m.id) === Number(deletedMsg.id));
        if (index !== -1) {
          const wasMine = state.messages[index].isMine;
          state.messages[index] = { ...deletedMsg, isMine: wasMine };
        }
      })
      .addCase(editMessage.fulfilled, (state, action: PayloadAction<ChatMessage>) => {
        const editedMsg = action.payload;
        const index = state.messages.findIndex(m => Number(m.id) === Number(editedMsg.id));
        if (index !== -1) {
          const wasMine = state.messages[index].isMine;
          state.messages[index] = { ...editedMsg, isMine: wasMine };
        }
      })
      .addCase(reactToMessage.fulfilled, (state, action: PayloadAction<ChatMessage>) => {
        const reactedMsg = action.payload;
        const index = state.messages.findIndex(m => Number(m.id) === Number(reactedMsg.id));
        if (index !== -1) {
          const wasMine = state.messages[index].isMine;
          state.messages[index] = { ...reactedMsg, isMine: wasMine };
        }
      })
      .addCase(removeReaction.fulfilled, (state, action: PayloadAction<ChatMessage>) => {
        const reactedMsg = action.payload;
        const index = state.messages.findIndex(m => Number(m.id) === Number(reactedMsg.id));
        if (index !== -1) {
          const wasMine = state.messages[index].isMine;
          state.messages[index] = { ...reactedMsg, isMine: wasMine };
        }
      })
      .addCase(forwardMessage.fulfilled, (state, action: PayloadAction<ChatMessage[]>) => {
        const newMessages = action.payload;
        newMessages.forEach(newMsg => {
          if (state.activeChat) {
            const activeId = Number(state.activeChat.id);
            const activeType = state.activeChat.type;
            
            const matchesGroup = activeType === 'GROUP' && Number(newMsg.groupId) === activeId;
            const matchesUser = activeType !== 'GROUP' && (Number(newMsg.recipientId) === activeId || Number(newMsg.senderId) === activeId);
            
            if (matchesGroup || matchesUser) {
              const exists = state.messages.find(m => Number(m.id) === Number(newMsg.id));
              if (!exists) {
                state.messages.push({ ...newMsg, isMine: true });
              }
            }
          }
          
          const targetId = newMsg.groupId ? Number(newMsg.groupId) : Number(newMsg.recipientId);
          const isGroup = !!newMsg.groupId;
          
          if (targetId) {
            const sidebarIndex = state.sidebarItems.findIndex(s => 
               Number(s.id) === targetId && (isGroup ? s.type === 'GROUP' : s.type !== 'GROUP')
            );
            
            if (sidebarIndex === -1) {
              let targetName = 'Unknown';
              let isOnline = false;
              
              if (!isGroup) {
                const contact = state.contacts.find(c => Number(c.id) === targetId);
                if (contact) {
                  targetName = contact.name;
                  isOnline = contact.isOnline;
                }
              } else {
                 targetName = `Group ${targetId}`;
              }
              state.sidebarItems.unshift({
                id: targetId,
                name: targetName,
                type: isGroup ? 'GROUP' : 'USER',
                updatedAt: newMsg.timestamp || new Date().toISOString(),
                unreadCount: 0,
                isOnline: isOnline
              });
            } else {
              const itemToUpdate = state.sidebarItems.splice(sidebarIndex, 1)[0];
              itemToUpdate.updatedAt = newMsg.timestamp || new Date().toISOString();
              state.sidebarItems.unshift(itemToUpdate);
            }
          }
        });
      });
  },
});

export const {
  setActiveChat,
  setConnecting,
  setConnected,
  setConnectionError,
  receiveMessage,
  markChatAsReadLocal,
  clearMessages,
  setEditingMessage,
  setForwardingMessage,
  setReplyingMessage
} = chatSlice.actions;

export default chatSlice.reducer;