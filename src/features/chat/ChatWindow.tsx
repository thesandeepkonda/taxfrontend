// src/features/chat/ChatWindow.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { 
  sendMessage, 
  fetchChatHistory, 
  clearMessages, 
  markChatAsReadLocal, 
  editMessage, 
  setEditingMessage,
  setForwardingMessage,
  forwardMessage,
  sendFileMessage,
  ChatMessage
} from '../../store/slices/chatSlice';
import api from '../../services/api';
import { 
  Send, User, Users, Loader2, Smile, Paperclip, X, 
  FileText, MoreVertical, ChevronDown, Search, Pencil, Check,
  Forward, Square, CheckSquare
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import ChatMessageItem from './ChatMessageItem';

const ChatWindow: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    messages, activeChat, isSending, isLoadingHistory, 
    sidebarItems, contacts, editingMessage, forwardingMessage 
  } = useSelector((state: RootState) => state.chat);
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  // Forward Modal States
  const [fwdSearchQuery, setFwdSearchQuery] = useState('');
  const [selectedFwdUsers, setSelectedFwdUsers] = useState<number[]>([]);
  const [selectedFwdGroups, setSelectedFwdGroups] = useState<number[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const isFetchingOlderRef = useRef(false);
  const previousScrollHeight = useRef<number>(0);

  useEffect(() => {
    if (forwardingMessage) {
      setFwdSearchQuery('');
      setSelectedFwdUsers([]);
      setSelectedFwdGroups([]);
    }
  }, [forwardingMessage]);

  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.content);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.setSelectionRange(editingMessage.content.length, editingMessage.content.length);
        }
      }, 50);
    } else {
      setText('');
    }
  }, [editingMessage]);

  useEffect(() => {
    if (activeChat) {
      setPage(0);
      setHasMore(true);
      setShowSearchBox(false);
      setSearchKeyword('');
      setShowMenu(false);
      isFetchingOlderRef.current = false;
      
      dispatch(setEditingMessage(null)); 
      setText('');

      if (activeChat.type === 'GROUP') {
        api.put(`/chat/group/${activeChat.id}/read`).catch(console.error);
      } else {
        api.put(`/chat/direct/${activeChat.id}/read`).catch(console.error);
      }
      
      dispatch(markChatAsReadLocal({ id: activeChat.id, type: activeChat.type }));
      dispatch(fetchChatHistory({ id: activeChat.id, type: activeChat.type, page: 0, size: 10 }))
        .unwrap()
        .then((res) => {
          if (res?.data?.content && res.data.content.length < 10) setHasMore(false);
        })
        .catch(console.error);
    }
  }, [activeChat, dispatch]);

  useEffect(() => {
    if (activeChat && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && !lastMsg.isMine) {
        if (activeChat.type === 'GROUP') {
          api.put(`/chat/group/${activeChat.id}/read`).catch(() => {});
        } else {
          api.put(`/chat/direct/${activeChat.id}/read`).catch(() => {});
        }
        dispatch(markChatAsReadLocal({ id: activeChat.id, type: activeChat.type }));
      }
    }
  }, [messages, activeChat, dispatch]);

  useEffect(() => {
    if (!isLoadingHistory) {
      if (isFetchingOlderRef.current && scrollContainerRef.current) {
        const newScrollHeight = scrollContainerRef.current.scrollHeight;
        scrollContainerRef.current.scrollTop = newScrollHeight - previousScrollHeight.current;
        isFetchingOlderRef.current = false;
      } else if (!isFetchingOlderRef.current) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages, isLoadingHistory]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!activeChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 h-full">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
           <Users className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-700">No Conversation Selected</h3>
        <p className="text-sm text-gray-500 font-medium mt-1">Select a user or group from the left to start chatting</p>
      </div>
    );
  }

  const isActiveUserOnline = activeChat.type !== 'GROUP' && (
    sidebarItems.find(s => Number(s.id) === Number(activeChat.id))?.isOnline ||
    contacts.find(c => Number(c.id) === Number(activeChat.id))?.isOnline
  );

  const currentUserId = Number(currentUser?.id || 0);

  const chatMessages = messages.filter((m) => {
    const mSender = Number(m.senderId);
    const mRecipient = Number(m.recipientId);
    const mGroup = Number(m.groupId);
    const cActive = Number(activeChat.id);
    const cUser = currentUserId;

    if (activeChat.type === 'GROUP') {
      return mGroup === cActive;
    } else {
      return ((mSender === cActive && mRecipient === cUser) || (mSender === cUser && mRecipient === cActive));
    }
  }).filter((m) => {
    if (!searchKeyword.trim()) return true;
    return m.content?.toLowerCase().includes(searchKeyword.toLowerCase());
  });

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isUpFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight > 200;
    setShowScrollBottomBtn(isUpFromBottom);

    if (target.scrollTop === 0 && !isLoadingHistory && hasMore) {
      if (chatMessages.length < 10) {
        setHasMore(false);
        return;
      }
      const nextPage = page + 1;
      setPage(nextPage);
      isFetchingOlderRef.current = true;
      previousScrollHeight.current = target.scrollHeight;
      
      dispatch(fetchChatHistory({ id: activeChat.id, type: activeChat.type, page: nextPage, size: 10 }))
        .unwrap()
        .then((res) => {
          if (res?.data?.content && res.data.content.length < 10) setHasMore(false);
        })
        .catch(() => setHasMore(false));
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleEmojiClick = (emojiObject: any) => {
    setText((prevMsg) => prevMsg + emojiObject.emoji);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearChat = () => {
    dispatch(clearMessages());
    setShowMenu(false);
  };

  const handleEditMessage = (msg: ChatMessage) => {
    dispatch(setEditingMessage({ id: msg.id, content: msg.content }));
    setText(msg.content); 
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(msg.content.length, msg.content.length);
      }
    }, 50);
  };

  const handleCancelEdit = () => {
    dispatch(setEditingMessage(null));
    setText('');
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && !selectedFile) || isSending) return;

    if (editingMessage) {
      if (text.trim() === editingMessage.content) {
        handleCancelEdit();
        return;
      }
      try {
        await dispatch(editMessage({ messageId: editingMessage.id, content: text.trim() })).unwrap();
        handleCancelEdit();
      } catch (error) {
        console.error("Failed to edit message", error);
      }
      return;
    }

    try {
      if (selectedFile) {
        const filePayload = {
          file: selectedFile,
          content: text.trim() || selectedFile.name, // Use file name as content
          ...(activeChat.type === 'GROUP' ? { groupId: activeChat.id } : { recipientId: activeChat.id })
        };
        await dispatch(sendFileMessage(filePayload)).unwrap();
      } else {
        const textPayload = {
          content: text.trim(),
          type: "TEXT",
          ...(activeChat.type === 'GROUP' ? { groupId: activeChat.id } : { recipientId: activeChat.id })
        };
        await dispatch(sendMessage(textPayload)).unwrap();
      }
      
      setText('');
      clearSelectedFile();
      setShowEmojiPicker(false);
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  // ----------------------------------------
  // Forward Modal Logic & Filtering
  // ----------------------------------------
  
  const fwdGroups = sidebarItems.filter(s => s.type === 'GROUP' && s.name.toLowerCase().includes(fwdSearchQuery.toLowerCase()));
  
  const uniqueUsersMap = new Map();
  contacts.forEach(c => uniqueUsersMap.set(c.id, { id: c.id, name: c.name, isOnline: c.isOnline }));
  sidebarItems.forEach(s => {
    if (s.type !== 'GROUP' && !uniqueUsersMap.has(s.id)) {
      uniqueUsersMap.set(s.id, { id: s.id, name: s.name, isOnline: s.isOnline });
    }
  });

  const fwdContacts = Array.from(uniqueUsersMap.values()).filter((c: any) => 
    c.name.toLowerCase().includes(fwdSearchQuery.toLowerCase())
  );

  const toggleFwdUser = (id: number) => {
    if (selectedFwdUsers.includes(id)) {
      setSelectedFwdUsers(selectedFwdUsers.filter(uId => uId !== id));
    } else {
      setSelectedFwdUsers([...selectedFwdUsers, id]);
    }
  };

  const toggleFwdGroup = (id: number) => {
    if (selectedFwdGroups.includes(id)) {
      setSelectedFwdGroups(selectedFwdGroups.filter(gId => gId !== id));
    } else {
      setSelectedFwdGroups([...selectedFwdGroups, id]);
    }
  };

  const confirmForward = async () => {
    if (!forwardingMessage || (selectedFwdUsers.length === 0 && selectedFwdGroups.length === 0)) return;
    
    try {
      await dispatch(forwardMessage({ 
        messageId: forwardingMessage.id, 
        recipientIds: selectedFwdUsers, 
        groupIds: selectedFwdGroups 
      })).unwrap();
      dispatch(setForwardingMessage(null));
    } catch (error) {
      console.error("Failed to forward message", error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f9fc] relative">
      {/* Header */}
      <div className="h-16 px-6 border-b border-gray-200 bg-white flex items-center justify-between gap-3 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#5f41b2] border border-blue-100">
            {activeChat.type === 'GROUP' ? <Users className="w-5 h-5" /> : <User className="w-5 h-5" />}
            {activeChat.type !== 'GROUP' && (
              <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full transition-colors ${isActiveUserOnline ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
            )}
          </div>
          <div>
            <h3 className="font-bold text-[#1b2559] leading-tight">{activeChat.name}</h3>
            <p className="text-xs text-gray-500 font-medium">
              {activeChat.type === 'GROUP' ? 'Group Discussion' : (isActiveUserOnline ? 'Online' : 'Offline')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative" ref={menuRef}>
          <button type="button" onClick={() => setShowMenu(!showMenu)} className="p-2 text-gray-500 hover:text-[#5f41b2] hover:bg-gray-100 rounded-full transition cursor-pointer">
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-12 w-40 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 z-30">
              <button type="button" onClick={() => { setShowSearchBox(!showSearchBox); setShowMenu(false); }} className="w-full px-4 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer">
                <Search className="w-3.5 h-3.5 text-gray-400" /> Search Messages
              </button>
              <button type="button" onClick={handleClearChat} className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer">
                <X className="w-3.5 h-3.5" /> Clear Chat
              </button>
            </div>
          )}
        </div>
      </div>

      {showSearchBox && (
        <div className="px-6 py-2.5 bg-white border-b border-gray-200 flex items-center gap-2 shrink-0 animate-in fade-in">
          <Search className="w-4 h-4 text-gray-400" />
          <input type="text" value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} placeholder="Search in conversation..." className="flex-1 text-xs font-medium focus:outline-none bg-transparent" />
          <button type="button" onClick={() => { setSearchKeyword(''); setShowSearchBox(false); }} className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 relative" ref={scrollContainerRef} onScroll={handleScroll}>
        {isLoadingHistory && page === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-[#5f41b2]" />
          </div>
        ) : chatMessages.length === 0 ? (
          <div className="text-center text-gray-400 mt-10 text-sm font-medium">
            No messages found. Start the conversation!
          </div>
        ) : (
          <>
            {isLoadingHistory && page > 0 && (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#5f41b2]" />
              </div>
            )}
            
            {chatMessages.map((msg, idx) => {
              const isMine = Number(msg.senderId) === currentUserId || msg.isMine || false;
              return (
                <ChatMessageItem 
                  key={msg.id || idx} 
                  msg={msg} 
                  isMine={isMine} 
                  isGroup={activeChat.type === 'GROUP'} 
                  onEdit={() => handleEditMessage(msg)} 
                />
              );
            })}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {showScrollBottomBtn && (
        <button type="button" onClick={scrollToBottom} className="absolute bottom-20 right-6 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200 text-[#5f41b2] flex items-center justify-center hover:bg-gray-50 transition z-20 cursor-pointer">
          <ChevronDown className="w-5 h-5" />
        </button>
      )}

      {/* Input Area */}
      <div className="relative">
        {editingMessage && (
          <div className="absolute bottom-[100%] left-0 right-0 bg-blue-50 border-t border-b border-blue-200 px-6 py-2.5 flex items-center justify-between shadow-sm z-50">
            <div className="flex items-center gap-3 overflow-hidden">
              <Pencil className="w-4 h-4 text-blue-600 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-blue-700">Edit Message</span>
                <span className="text-[10px] text-gray-500 truncate">{editingMessage.content}</span>
              </div>
            </div>
            <button type="button" onClick={handleCancelEdit} className="p-1 hover:bg-blue-100 rounded-full text-blue-500 transition shrink-0 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="p-4 bg-white border-t border-gray-200 shrink-0 relative z-40">
          {selectedFile && !editingMessage && (
            <div className="absolute bottom-[100%] left-4 mb-2 bg-white border border-gray-200 rounded-lg p-2 flex items-center gap-2 shadow-sm z-10 max-w-sm">
              <div className="w-8 h-8 bg-blue-50 rounded-md flex items-center justify-center text-[#5f41b2]">
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-700 truncate">{selectedFile.name}</p>
                <p className="text-[10px] text-gray-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <button type="button" onClick={clearSelectedFile} className="p-1 hover:bg-gray-100 rounded-full text-gray-500 transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {showEmojiPicker && (
            <div ref={emojiPickerRef} className="absolute bottom-[100%] left-4 mb-2 z-20 shadow-xl rounded-lg">
              <EmojiPicker onEmojiClick={handleEmojiClick} width={300} height={400} />
            </div>
          )}

          <form onSubmit={handleSend} className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2.5 text-gray-400 hover:text-[#5f41b2] hover:bg-gray-50 rounded-full transition-colors cursor-pointer">
                <Smile className="w-5 h-5" />
              </button>
              
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={!!editingMessage} className={`p-2.5 rounded-full transition-colors ${editingMessage ? 'text-gray-300' : 'text-gray-400 hover:text-[#5f41b2] hover:bg-gray-50 cursor-pointer'}`}>
                <Paperclip className="w-5 h-5" />
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" disabled={!!editingMessage} />
            </div>

            <input 
              type="text" 
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={editingMessage ? "Edit your message..." : `Message ${activeChat.name}...`} 
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#5f41b2] transition"
              disabled={isSending}
            />
            <button type="submit" disabled={(!text.trim() && !selectedFile) || isSending} className={`w-12 h-12 rounded-xl text-white flex items-center justify-center shadow-md transition disabled:opacity-50 disabled:shadow-none shrink-0 ${editingMessage ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer' : 'bg-[#5f41b2] hover:bg-[#4d3396] cursor-pointer'}`}>
              {editingMessage ? <Check className="w-5 h-5" /> : <Send className="w-5 h-5 ml-0.5" />}
            </button>
          </form>
        </div>
      </div>

      {/* Forward Modal Overlay */}
      {forwardingMessage && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl flex flex-col h-[500px] max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#1b2559] flex items-center gap-2">
                <Forward className="w-5 h-5 text-[#5f41b2]" /> Forward Message
              </h3>
              <button onClick={() => dispatch(setForwardingMessage(null))} className="p-1 hover:bg-gray-100 rounded-full transition cursor-pointer">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-3 border-b border-gray-100 bg-gray-50/50">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  value={fwdSearchQuery}
                  onChange={(e) => setFwdSearchQuery(e.target.value)}
                  placeholder="Search contacts & groups..." 
                  className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#5f41b2] transition"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {/* Groups Section */}
              {fwdGroups.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">Groups</h4>
                  {fwdGroups.map((group) => (
                    <div 
                      key={`fwd-grp-${group.id}`} 
                      onClick={() => toggleFwdGroup(group.id)}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer transition"
                    >
                      {selectedFwdGroups.includes(group.id) ? (
                        <CheckSquare className="w-5 h-5 text-[#5f41b2] shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-300 shrink-0" />
                      )}
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-semibold text-gray-700 truncate">{group.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Contacts Section */}
              {fwdContacts.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">Contacts</h4>
                  {fwdContacts.map((contact: any) => (
                    <div 
                      key={`fwd-usr-${contact.id}`} 
                      onClick={() => toggleFwdUser(contact.id)}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer transition"
                    >
                      {selectedFwdUsers.includes(contact.id) ? (
                        <CheckSquare className="w-5 h-5 text-[#5f41b2] shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-300 shrink-0" />
                      )}
                      <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="text-sm font-semibold text-gray-700 truncate">{contact.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {fwdGroups.length === 0 && fwdContacts.length === 0 && (
                <div className="text-center p-4 text-sm text-gray-400">
                  No contacts or groups found.
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-white rounded-b-2xl">
              <span className="text-xs font-bold text-gray-500">
                Selected: {selectedFwdUsers.length + selectedFwdGroups.length}
              </span>
              <button 
                onClick={confirmForward}
                disabled={selectedFwdUsers.length === 0 && selectedFwdGroups.length === 0}
                className="px-5 py-2.5 text-sm font-bold text-white bg-[#5f41b2] hover:bg-[#4d3396] rounded-xl transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Forward className="w-4 h-4" /> Forward
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ChatWindow;