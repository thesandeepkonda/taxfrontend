// src/features/chat/ChatMessageItem.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Check,
  CheckCheck,
  Copy,
  Pin,
  Pencil,
  Reply,
  Forward,
  Trash2,
  SmilePlus,
  Ban,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  X
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { ChatMessage, deleteMessage, reactToMessage, removeReaction, setForwardingMessage, togglePinMessage, setReplyingMessage } from '../../store/slices/chatSlice';
import EmojiPicker from 'emoji-picker-react';
import api from '../../services/api';

interface ChatMessageItemProps {
  msg: ChatMessage;
  isMine: boolean;
  isGroup: boolean;
  onEdit?: () => void; 
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ msg, isMine, isGroup, onEdit }) => {
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [reactionPos, setReactionPos] = useState<{ x: number; y: number } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditable, setIsEditable] = useState(false); 
  
  const [imgUrl, setImgUrl] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false); 

  const menuRef = useRef<HTMLDivElement>(null);
  const reactionRef = useRef<HTMLDivElement>(null);

  const isDeleted = msg.isDeleted || msg.content === "This message was deleted";
  
  const checkIsImage = (name?: string | null) => {
    if (!name) return false;
    const ext = name.split('.').pop()?.toLowerCase();
    return ext === 'jpeg' || ext === 'jpg' || ext === 'gif' || ext === 'png' || ext === 'webp';
  };
  const isImageFile = checkIsImage(msg.fileName) || checkIsImage(msg.fileUrl);

  const getCleanEndpoint = (url: string) => {
    let cleanUrl = url;
    try {
      if (cleanUrl.startsWith('http')) {
        cleanUrl = new URL(cleanUrl).pathname;
      }
    } catch (e) {}
    if (cleanUrl.startsWith('/api')) {
      cleanUrl = cleanUrl.substring(4);
    }
    if (!cleanUrl.startsWith('/')) {
      cleanUrl = '/' + cleanUrl;
    }
    return cleanUrl; 
  };

  useEffect(() => {
    let isMounted = true;
    if (msg.fileUrl && isImageFile && !isDeleted) {
      const cleanUrl = getCleanEndpoint(msg.fileUrl);
      api.get(cleanUrl, { responseType: 'blob' })
        .then(res => {
          if (isMounted) {
            const objectUrl = window.URL.createObjectURL(new Blob([res.data], { type: res.headers['content-type'] }));
            setImgUrl(objectUrl);
          }
        })
        .catch(err => console.error("Failed to load image preview", err));
    }
    return () => {
      isMounted = false;
    };
  }, [msg.fileUrl, msg.fileName, isImageFile, isDeleted]);

  useEffect(() => {
    if (!isMine || isDeleted || msg.type === 'FILE') {
      setIsEditable(false);
      return;
    }
    const checkTime = () => {
      if (!msg.timestamp) {
        setIsEditable(true);
        return;
      }
      const safeTimestamp = msg.timestamp.includes('T') ? msg.timestamp : msg.timestamp.replace(' ', 'T');
      const msgTime = new Date(safeTimestamp).getTime();
      const now = Date.now();
      const diffMins = (now - msgTime) / 60000;
      setIsEditable(diffMins <= 15);
    };

    checkTime();
    const timer = setInterval(checkTime, 60000); 
    return () => clearInterval(timer);
  }, [isMine, isDeleted, msg.type, msg.timestamp]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
      if (reactionRef.current && !reactionRef.current.contains(event.target as Node)) {
        setReactionPos(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); 
    
    if (isDeleted) return;

    const menuWidth = 180;
    const menuHeight = 260;
    
    let x = e.clientX;
    let y = e.clientY;

    if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 20;
    if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 20;

    setContextMenu({ x, y });
    setReactionPos(null);
  };

  const handleAction = (action: string) => {
    setContextMenu(null);
    if (action === 'Copy') {
      navigator.clipboard.writeText(msg.content);
    } else if (action === 'Delete') {
      setShowDeleteModal(true);
    } else if (action === 'Edit') {
      if (onEdit) onEdit(); 
    } else if (action === 'Forward') {
      dispatch(setForwardingMessage(msg)); 
    } else if (action === 'Pin') {
      dispatch(togglePinMessage(msg.id));
    } else if (action === 'Reply') {
      dispatch(setReplyingMessage(msg));
    } else {
      console.log(`Action [${action}] triggered for message ID: ${msg.id}`);
    }
  };

  const handleFileAction = async (e: React.MouseEvent, action: 'preview' | 'download') => {
    e.preventDefault();
    e.stopPropagation();
    if (!msg.fileUrl) return;

    let newWindow: Window | null = null;
    if (action === 'preview') {
      newWindow = window.open('about:blank', '_blank');
    }
    
    try {
      setIsDownloading(true);
      const cleanUrl = getCleanEndpoint(msg.fileUrl);
      const reqUrl = action === 'download' ? `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}download=true` : cleanUrl;
      
      const response = await api.get(reqUrl, { responseType: 'blob' });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: response.headers['content-type'] }));
      
      if (action === 'download') {
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', msg.fileName || 'download');
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
      } else if (newWindow) {
        newWindow.location.href = blobUrl;
      }
    } catch (error) {
      console.error(`Failed to ${action} file`, error);
      if (newWindow) {
        newWindow.close();
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await dispatch(deleteMessage(msg.id)).unwrap();
    } catch (error) {
      console.error("Failed to delete message", error);
    } finally {
      setShowDeleteModal(false);
    }
  };

  const handleReactionClick = async (emojiObject: any) => {
    setReactionPos(null);
    try {
      const currentReaction = currentUser && msg.reactions ? msg.reactions[String(currentUser.id)] : null;
      if (currentReaction === emojiObject.emoji) {
        await dispatch(removeReaction(msg.id)).unwrap();
      } else {
        await dispatch(reactToMessage({ messageId: msg.id, emoji: emojiObject.emoji })).unwrap();
      }
    } catch (error) {
      console.error("Failed to react to message", error);
    }
  };

  const handleBadgeClick = async (emoji: string) => {
    try {
      const currentReaction = currentUser && msg.reactions ? msg.reactions[String(currentUser.id)] : null;
      if (currentReaction === emoji) {
        await dispatch(removeReaction(msg.id)).unwrap();
      } else {
        await dispatch(reactToMessage({ messageId: msg.id, emoji })).unwrap();
      }
    } catch (error) {
      console.error("Failed to react/remove reaction", error);
    }
  };

  const openReactionPicker = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const pickerWidth = 280;
    const pickerHeight = 350;

    let x = isMine ? rect.right - pickerWidth : rect.left;
    let y = rect.bottom + 10; 

    if (x + pickerWidth > window.innerWidth) x = window.innerWidth - pickerWidth - 20;
    if (x < 0) x = 20;
    if (y + pickerHeight > window.innerHeight) y = rect.top - pickerHeight - 10; 
    if (y < 0) y = 20;

    setReactionPos({ x, y });
    setContextMenu(null); 
  };

  const groupedReactions = msg.reactions 
    ? Object.values(msg.reactions).reduce((acc: any, emoji: any) => {
        acc[emoji] = (acc[emoji] || 0) + 1;
        return acc;
      }, {})
    : {};

  return (
    <div id={`msg-${msg.id}`} className={`flex flex-col relative group ${isMine ? 'items-end' : 'items-start'}`}>
      <div className="flex items-end gap-2 max-w-[75%] min-w-0 relative">
        
        {!isMine && (
          <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">
            {msg.senderName?.charAt(0) || 'U'}
          </div>
        )}
        
        <div className="relative" onContextMenu={handleContextMenu}>
          
          {!isDeleted && (
            <div className={`absolute -top-5 ${isMine ? 'right-0' : 'left-0'} hidden group-hover:flex items-center gap-1 bg-white border border-gray-200 shadow-md rounded-full px-2 py-1 z-20`}>
              <button onClick={() => handleReactionClick({ emoji: '👍' })} className="hover:scale-125 transition-transform text-base leading-none cursor-pointer">👍</button>
              <button onClick={() => handleReactionClick({ emoji: '❤️' })} className="hover:scale-125 transition-transform text-base leading-none cursor-pointer">❤️</button>
              <button onClick={() => handleReactionClick({ emoji: '😂' })} className="hover:scale-125 transition-transform text-base leading-none cursor-pointer">😂</button>
              <button onClick={() => handleReactionClick({ emoji: '😮' })} className="hover:scale-125 transition-transform text-base leading-none cursor-pointer">😮</button>
              <div className="w-px h-3 bg-gray-300 mx-1"></div>
              <button onClick={openReactionPicker} className="hover:text-[#5f41b2] transition-colors text-gray-500 cursor-pointer">
                <SmilePlus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className={`px-4 py-2.5 text-sm shadow-sm break-words whitespace-pre-wrap relative z-10 flex flex-col gap-1 ${
            isDeleted 
              ? 'bg-transparent border border-gray-200 text-gray-500 rounded-2xl'
              : isMine 
                ? 'bg-[#5f41b2] text-white rounded-2xl rounded-br-sm'
                : 'bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-bl-sm'
          }`}>
            {isDeleted ? (
              <div className="italic flex items-center gap-1.5 opacity-80">
                <Ban className="w-3.5 h-3.5" />
                This message was deleted
              </div>
            ) : (
              <>
                {msg.isPinned && (
                  <div className={`flex items-center gap-1 text-[10px] italic opacity-80 ${isMine ? 'text-blue-100' : 'text-gray-400'}`}>
                    <Pin className="w-3 h-3" /> Pinned
                  </div>
                )}
                
                {msg.isForwarded && (
                  <div className={`flex items-center gap-1 text-[10px] italic opacity-80 ${isMine ? 'text-blue-100' : 'text-gray-400'}`}>
                    <Forward className="w-3 h-3" /> Forwarded
                  </div>
                )}

                {/* Reply Message Visual */}
                {msg.replyToMessage && (
                  <div 
                    className={`mb-1 p-2 rounded text-[10px] border-l-4 flex flex-col overflow-hidden max-w-[200px] sm:max-w-[250px] ${
                      isMine ? 'bg-white/20 border-white text-white' : 'bg-black/5 border-[#5f41b2] text-gray-700'
                    }`}
                  >
                    <span className="font-bold truncate">{msg.replyToMessage.senderName}</span>
                    <span className="truncate opacity-90">{msg.replyToMessage.content || 'Attachment'}</span>
                  </div>
                )}

                {!isMine && isGroup && (
                  <div className="text-[10px] font-bold text-[#5f41b2] leading-none">{msg.senderName}</div>
                )}
                
                {msg.content}
                
                {/* File Preview Rendering */}
                {msg.fileUrl && (
                  <div className={`mt-1 flex flex-col gap-2 ${isMine ? 'items-end' : 'items-start'}`}>
                    {isImageFile ? (
                      <div 
                        className="relative rounded-lg overflow-hidden border border-gray-200/50 bg-black/5 p-1 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowImageModal(true);
                        }}
                        title="Click to view image"
                      >
                        {imgUrl ? (
                          <img src={imgUrl} alt={msg.fileName || 'Image'} className="max-w-[200px] sm:max-w-[250px] h-auto object-contain rounded hover:opacity-90 transition-opacity" />
                        ) : (
                          <div className="w-[200px] h-[150px] flex items-center justify-center text-gray-400 bg-white">
                              <Loader2 className="w-6 h-6 animate-spin" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={`flex items-center gap-3 p-2.5 rounded-lg border max-w-[250px] ${isMine ? 'bg-black/10 border-white/20' : 'bg-black/5 border-gray-200/50'}`}>
                        <div className={`w-8 h-8 rounded flex items-center justify-center shadow-sm shrink-0 ${isMine ? 'bg-white text-[#5f41b2]' : 'bg-[#5f41b2]/10 text-[#5f41b2]'}`}>
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold truncate ${isMine ? 'text-white' : 'text-gray-700'}`} title={msg.fileName || 'Document'}>
                            {msg.fileName || 'Document'}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {!isImageFile && (
                      <div className="flex items-center gap-2 mt-1">
                          <button onClick={(e) => handleFileAction(e, 'preview')} disabled={isDownloading} className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-md transition cursor-pointer ${isMine ? 'bg-white/20 text-white hover:bg-white/30 border border-white/30' : 'bg-white text-[#5f41b2] border border-[#5f41b2]/20 hover:bg-[#5f41b2]/5'} disabled:opacity-50`}>
                            <ExternalLink className="w-3 h-3" /> Preview
                          </button>
                          <button onClick={(e) => handleFileAction(e, 'download')} disabled={isDownloading} className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-md transition cursor-pointer shadow-sm ${isMine ? 'bg-white text-[#5f41b2] hover:bg-gray-50' : 'bg-[#5f41b2] text-white hover:bg-[#4d3396]'} disabled:opacity-50`}>
                            {isDownloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} Download
                          </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {!isDeleted && Object.keys(groupedReactions).length > 0 && (
            <div className={`flex flex-wrap gap-1 mt-0.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
              {Object.entries(groupedReactions).map(([emoji, count]) => (
                <span 
                  key={emoji} 
                  onClick={() => handleBadgeClick(emoji)}
                  className={`text-[11px] border rounded-full px-1.5 py-[1px] shadow-sm leading-none flex items-center gap-0.5 cursor-pointer transition-colors ${currentUser && msg.reactions?.[String(currentUser.id)] === emoji ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                >
                  <span>{emoji}</span>
                  {(count as number) > 1 && <span className="text-[9px] font-bold ml-0.5">{count as number}</span>}
                </span>
              ))}
            </div>
          )}
          
          {reactionPos && (
            <div ref={reactionRef} className="fixed z-[100] shadow-2xl rounded-lg bg-white" style={{ top: reactionPos.y, left: reactionPos.x }}>
              <EmojiPicker onEmojiClick={handleReactionClick} width={280} height={350} />
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-1 mt-1 px-1">
        <span className="text-[10px] text-gray-400 font-semibold">
          {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
        </span>
        {msg.isEdited && !isDeleted && (
          <span className="text-[10px] text-gray-400 font-medium italic ml-1">
            (edited)
          </span>
        )}
        {isMine && !isDeleted && (
          msg.isRead ? <CheckCheck className="w-3.5 h-3.5 text-blue-500 ml-0.5" /> : <Check className="w-3.5 h-3.5 text-gray-400 ml-0.5" />
        )}
      </div>

      {contextMenu && !isDeleted && (
        <div ref={menuRef} className="fixed bg-white border border-gray-200 shadow-xl rounded-xl py-1.5 w-44 z-[100]" style={{ top: contextMenu.y, left: contextMenu.x }}>
          <button onClick={(e) => { e.stopPropagation(); handleAction('Copy'); }} className="w-full px-4 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer">
            <Copy className="w-3.5 h-3.5 text-gray-400" /> Copy
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleAction('Reply'); }} className="w-full px-4 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer">
            <Reply className="w-3.5 h-3.5 text-gray-400" /> Reply
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleAction('Forward'); }} className="w-full px-4 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer">
            <Forward className="w-3.5 h-3.5 text-gray-400" /> Forward
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleAction('Pin'); }} className="w-full px-4 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer">
            <Pin className="w-3.5 h-3.5 text-gray-400" /> {msg.isPinned ? 'Unpin Message' : 'Pin Message'}
          </button>
          
          {isEditable && (
            <button onClick={(e) => { e.stopPropagation(); handleAction('Edit'); }} className="w-full px-4 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer">
              <Pencil className="w-3.5 h-3.5 text-gray-400" /> Edit
            </button>
          )}

          {isMine && (
            <>
              <div className="w-full h-px bg-gray-100 my-1"></div>
              <button onClick={(e) => { e.stopPropagation(); handleAction('Delete'); }} className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </>
          )}
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-[#1b2559] mb-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-600" /> Delete Message
            </h3>
            <p className="text-sm text-gray-500 mb-6 font-medium">
              This message will be deleted for everyone in this chat. Are you sure you want to proceed?
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer">
                Cancel
              </button>
              <button onClick={confirmDelete} className="px-4 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-sm cursor-pointer">
                Delete for everyone
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-page Full Image Modal */}
      {showImageModal && imgUrl && (
        <div 
          className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowImageModal(false)}
        >
          <button 
            className="absolute top-4 right-4 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer z-[310]"
            onClick={(e) => { e.stopPropagation(); setShowImageModal(false); }}
          >
            <X className="w-6 h-6" />
          </button>
          <button 
            className="absolute top-4 right-16 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer z-[310]"
            onClick={(e) => handleFileAction(e, 'download')}
            title="Download Image"
          >
            <Download className="w-6 h-6" />
          </button>
          <img 
            src={imgUrl} 
            alt={msg.fileName || 'Preview'} 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" 
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </div>
  );
}

export default ChatMessageItem;