// src/features/chat/ChatList.tsx
import React, { useEffect, useState } from 'react';
import { Users, Circle, Search } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchSidebar, fetchContacts, setActiveChat } from '../../store/slices/chatSlice';

const ChatList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    isConnected, 
    sidebarItems, 
    contacts, 
    isLoadingSidebar, 
    isLoadingContacts,
    activeChat
  } = useSelector((state: RootState) => state.chat);

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(fetchSidebar());
    dispatch(fetchContacts());
  }, [dispatch]);

  // FIX: Force sort sidebar items by updatedAt descending (newest first)
  const sortedSidebarItems = [...sidebarItems].sort((a, b) => {
    const dateA = new Date(a.updatedAt).getTime();
    const dateB = new Date(b.updatedAt).getTime();
    return dateB - dateA;
  });

  const filteredSidebarItems = sortedSidebarItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-full bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <h2 className="text-lg font-bold text-[#1b2559] flex items-center gap-2">
          <Users className="w-5 h-5 text-[#5f41b2]" />
          Discussions
        </h2>
        <div className="flex items-center gap-1">
          <Circle className={`w-2.5 h-2.5 fill-current ${isConnected ? 'text-emerald-500' : 'text-rose-500'}`} />
          <span className="text-[10px] font-bold text-gray-500 uppercase">
            {isConnected ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="p-3 border-b border-gray-100">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search contacts..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#5f41b2] transition"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        
        <div className="mt-2">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Conversations</h3>
          {isLoadingSidebar ? (
            <div className="text-center p-4 text-xs text-gray-400">Loading chats...</div>
          ) : filteredSidebarItems.length > 0 ? (
            filteredSidebarItems.map((item) => (
              <div 
                key={`sidebar-${item.id}`} 
                onClick={() => dispatch(setActiveChat({ id: item.id, name: item.name, type: item.type as 'USER' | 'GROUP' }))}
                className={`px-3 py-2 rounded-md cursor-pointer flex items-center gap-3 transition ${activeChat?.id === item.id && activeChat?.type === item.type ? 'bg-blue-50 border border-blue-100' : 'hover:bg-gray-100'}`}
              >
                {item.type === 'GROUP' ? (
                  <Users className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                ) : (
                  <Circle className={`w-2.5 h-2.5 shrink-0 ${item.isOnline ? 'fill-emerald-500 text-emerald-500' : 'fill-gray-300 text-gray-300'}`} />
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-[#1b2559] truncate block">
                    {item.name}
                  </span>
                </div>
                {item.unreadCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                    {item.unreadCount}
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="text-center p-4 text-xs text-gray-400">
              {sidebarItems.length > 0 ? 'No matching chats found' : 'No recent chats'}
            </div>
          )}
        </div>

        <div className="mt-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">All Contacts</h3>
          {isLoadingContacts ? (
            <div className="text-center p-4 text-xs text-gray-400">Loading contacts...</div>
          ) : filteredContacts.length > 0 ? (
            filteredContacts.map((contact) => (
              <div 
                key={`contact-${contact.id}`} 
                onClick={() => dispatch(setActiveChat({ id: contact.id, name: contact.name, type: 'USER' }))}
                className={`px-3 py-2 rounded-md cursor-pointer flex items-center gap-3 transition ${activeChat?.id === contact.id && activeChat?.type === 'USER' ? 'bg-blue-50 border border-blue-100' : 'hover:bg-gray-100'}`}
              >
                <Circle className={`w-2.5 h-2.5 shrink-0 ${contact.isOnline ? 'fill-emerald-500 text-emerald-500' : 'fill-gray-300 text-gray-300'}`} />
                <span className="text-sm font-medium text-gray-700 truncate">
                  {contact.name}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center p-4 text-xs text-gray-400">
              {contacts.length > 0 ? 'No matching contacts found' : 'No contacts available'}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ChatList;