import { useEffect, useState } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';

export function FloatingReactions() {
  const room = useRoomContext();
  const [reactions, setReactions] = useState([]);

  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload, participant, kind, topic) => {
      if (topic === 'reaction') {
        try {
          const textDecoder = new TextDecoder();
          const { emoji } = JSON.parse(textDecoder.decode(payload));
          
          const id = Math.random().toString(36).substring(2, 11);
          const newReaction = { id, emoji, x: Math.random() * 60 - 30 }; 
          
          setReactions(prev => [...prev, newReaction]);
        } catch (e) {
          console.error('Failed to parse reaction payload:', e);
        }
        
        
        setTimeout(() => {
          setReactions(prev => prev.filter(r => r.id !== id));
        }, 3000);
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room]);

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 pointer-events-none h-64 w-64 overflow-visible">
      {reactions.map((r) => (
        <div
          key={r.id}
          className="absolute bottom-0 text-4xl"
          style={{
            left: `calc(50% + ${r.x}px)`,
            animation: `floatUpReaction 3s ease-out forwards`
          }}
        >
          {r.emoji}
        </div>
      ))}
      <style>{`
        @keyframes floatUpReaction {
          0% { transform: translateY(0) scale(0.5); opacity: 0; }
          10% { transform: translateY(-20px) scale(1.2); opacity: 1; }
          100% { transform: translateY(-250px) scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
