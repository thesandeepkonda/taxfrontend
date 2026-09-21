// src/components/common/CallHippoWidget.tsx
import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Phone, PhoneOff, Move } from 'lucide-react';

const CallHippoWidget: React.FC = () => {
  const { user } = useAuth();
  const [isDialerVisible, setIsDialerVisible] = useState(true);

  // Drag State for moving the button around
  const [pos, setPos] = useState({
    x: typeof window !== 'undefined' ? window.innerWidth - 220 : 0,
    y: typeof window !== 'undefined' ? window.innerHeight - 80 : 0
  });
  const [dragging, setDragging] = useState(false);
  const [rel, setRel] = useState({ x: 0, y: 0 });

  // Checking user team for Call Feature Visibility at component level
  const teamString = String(user?.departmentName || user?.teamName || user?.team || '').toUpperCase();
  const isCallEnabled = user?.role !== 'ADMIN' && (teamString.includes('DOC') || teamString.includes('ESTIM'));

  useEffect(() => {
    // If the user is not in Documentation or Estimation team, do not load the dialer script
    if (!isCallEnabled) {
      return;
    }

    let scriptElement: HTMLScriptElement | null = null;
    let widgetDiv: HTMLDivElement | null = null;

    const initCallHippo = async () => {
      try {
        // Fetch token and email from the backend
        const response = await api.get('/callhippo/embedded/config');
        const { token, email } = response.data;

        if (token && email) {
          // Set global variables required by CallHippo script
          (window as any).TOKEN = token;
          (window as any).EMAIL = email;

          // Create widget container div
          widgetDiv = document.createElement('div');
          widgetDiv.id = 'ch-dialer-container';
          document.body.appendChild(widgetDiv);

          // Inject CallHippo script
          scriptElement = document.createElement('script');
          scriptElement.type = 'text/javascript';
          scriptElement.async = true;
          scriptElement.src = 'https://d1x9dsge91xf6g.cloudfront.net/callhippo/files/ch-dialer.js';
          
          const firstScript = document.getElementsByTagName('script')[0];
          if (firstScript && firstScript.parentNode) {
            firstScript.parentNode.insertBefore(scriptElement, firstScript);
          } else {
            document.head.appendChild(scriptElement);
          }
        }
      } catch (error) {
        console.error('Failed to load CallHippo config:', error);
      }
    };

    initCallHippo();

    // Cleanup function when component unmounts
    return () => {
      if (scriptElement && scriptElement.parentNode) {
        scriptElement.parentNode.removeChild(scriptElement);
      }
      if (widgetDiv && widgetDiv.parentNode) {
        widgetDiv.parentNode.removeChild(widgetDiv);
      }
      delete (window as any).TOKEN;
      delete (window as any).EMAIL;
    };
  }, [isCallEnabled]);

  // Effect to handle showing/hiding the dialer container based on button toggle
  useEffect(() => {
    const container = document.getElementById('ch-dialer-container');
    if (container) {
      container.style.display = isDialerVisible ? 'block' : 'none';
    }
  }, [isDialerVisible]);

  // --- Drag Logic Handlers ---
  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only trigger on left click
    setDragging(true);
    setRel({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y
    });
    e.preventDefault();
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      // Constrain button within window bounds so it doesn't disappear off-screen
      const newX = Math.max(0, Math.min(e.clientX - rel.x, window.innerWidth - 180));
      const newY = Math.max(0, Math.min(e.clientY - rel.y, window.innerHeight - 60));
      setPos({ x: newX, y: newY });
    };

    const onMouseUp = () => {
      setDragging(false);
    };

    if (dragging) {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragging, rel]);

  // Handle window resize to keep button inside screen
  useEffect(() => {
    const handleResize = () => {
      setPos((prev) => ({
        x: Math.min(prev.x, window.innerWidth - 180),
        y: Math.min(prev.y, window.innerHeight - 60)
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Render nothing if user doesn't have permission
  if (!isCallEnabled) {
    return null; 
  }

  // Render a highly visible floating toggle button with a drag handle
  return (
    <div
      style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
      className={`fixed z-[999999] flex items-stretch bg-[#5f41b2] rounded-full shadow-2xl border border-[#4d3396] overflow-hidden transition-shadow ${dragging ? 'shadow-[0_10px_40px_rgba(0,0,0,0.4)]' : ''}`}
    >
      {/* Drag Handle Element */}
      <div
        onMouseDown={onMouseDown}
        className="px-3 flex items-center justify-center bg-[#4d3396] text-white cursor-move hover:bg-[#3c2776] transition-colors"
        title="Drag to move"
      >
        <Move className="w-4 h-4" />
      </div>

      {/* Hide/Show Toggle Button */}
      <button
        onClick={() => setIsDialerVisible(!isDialerVisible)}
        className="px-4 py-2.5 text-white text-sm font-bold flex items-center gap-2 hover:bg-[#4d3396] transition-all cursor-pointer"
        title="Toggle CallHippo Dialer"
      >
        {isDialerVisible ? <PhoneOff className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
        {isDialerVisible ? 'Hide Dialer' : 'Show Dialer'}
      </button>
    </div>
  );
};

export default CallHippoWidget;