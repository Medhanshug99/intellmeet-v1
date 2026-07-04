import { useState, useEffect } from 'react';
import { useTracks, VideoTrack, useLocalParticipant, useParticipants, useRoomContext } from '@livekit/components-react';
import { Track, RoomEvent } from 'livekit-client';
import { MicOff, MonitorUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function VideoGrid({ isVideoOff, localReaction }) {
  const participants = useParticipants();
  const screenShareTracks = useTracks(
    [{ source: Track.Source.ScreenShare, withPlaceholder: false }],
    { onlySubscribed: false }
  );

  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const [activeReactions, setActiveReactions] = useState({});

  useEffect(() => {
    if (!room) return;
    const handleDataReceived = (payload, participant, kind, topic) => {
      if (topic === 'reaction') {
        try {
          const textDecoder = new TextDecoder();
          const { emoji, identity } = JSON.parse(textDecoder.decode(payload));
          if (identity) {
            setActiveReactions(prev => ({ ...prev, [identity]: emoji }));
            setTimeout(() => {
              setActiveReactions(prev => {
                if (prev[identity] === emoji) {
                  const next = { ...prev };
                  delete next[identity];
                  return next;
                }
                return prev;
              });
            }, 4000); 
          }
        } catch (e) {
          console.error('Failed to parse reaction:', e);
        }
      }
    };
    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room]);

  useEffect(() => {
    if (localReaction && localReaction.identity) {
      setActiveReactions(prev => ({ ...prev, [localReaction.identity]: localReaction.emoji }));
      setTimeout(() => {
        setActiveReactions(prev => {
          if (prev[localReaction.identity] === localReaction.emoji) {
            const next = { ...prev };
            delete next[localReaction.identity];
            return next;
          }
          return prev;
        });
      }, 4000); 
    }
  }, [localReaction]);

  const totalParticipants = participants.length + screenShareTracks.length;

  let layoutClasses;
  if (totalParticipants <= 1) layoutClasses = 'grid-cols-1 grid-rows-1';
  else if (totalParticipants === 2) layoutClasses = 'grid-cols-1 grid-rows-2 md:grid-cols-2 md:grid-rows-1';
  else if (totalParticipants <= 4) layoutClasses = 'grid-cols-2 grid-rows-2';
  else if (totalParticipants <= 6) layoutClasses = 'grid-cols-3 grid-rows-2';
  else if (totalParticipants <= 9) layoutClasses = 'grid-cols-3 grid-rows-3';
  else if (totalParticipants <= 12) layoutClasses = 'grid-cols-4 grid-rows-3';
  else if (totalParticipants <= 16) layoutClasses = 'grid-cols-4 grid-rows-4';
  else if (totalParticipants <= 25) layoutClasses = 'grid-cols-5 auto-rows-fr';
  else layoutClasses = 'grid-cols-6 auto-rows-fr';

  return (
    <motion.div layout className={`w-full h-full grid gap-3 ${layoutClasses} max-h-[calc(100vh-9rem)] overflow-y-auto custom-scrollbar`}>
      <AnimatePresence>
        {participants.map((participant) => (
          <ParticipantTile 
            key={participant.identity} 
            participant={participant} 
            localIdentity={localParticipant?.identity} 
            isVideoOff={isVideoOff}
            reaction={activeReactions[participant.identity]}
          />
        ))}
        {screenShareTracks.map((trackRef) => (
          <ScreenShareTile key={trackRef.participant.identity + '_screen'} trackRef={trackRef} localIdentity={localParticipant?.identity} />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

function ParticipantTile({ participant, localIdentity, isVideoOff, reaction }) {
  const isLocal = localIdentity ? participant.identity === localIdentity : false;
  const isMuted = !participant.isMicrophoneEnabled;
  const name = participant.name || 'User';

  const cameraPublication = participant.getTrackPublication(Track.Source.Camera);
  const hasVideo = isLocal ? !isVideoOff : participant.isCameraEnabled;
  
  const trackRef = {
    participant,
    source: Track.Source.Camera,
    publication: cameraPublication,
    track: cameraPublication?.videoTrack
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
      className={`relative rounded-xl overflow-hidden bg-[#1a1a1f] border shadow-xl group w-full h-full min-h-[180px] ${
        participant.isSpeaking ? 'border-primary ring-2 ring-primary/50' : 'border-white/10'
      }`}
    >
      {!hasVideo || !trackRef.publication?.track ? (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1c1c20] to-[#0f0f11] relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 blur-[100px] rounded-full transform scale-150" />
          <div className={`relative flex items-center justify-center h-20 w-20 md:h-32 md:w-32 rounded-full bg-gradient-to-br from-primary to-primary/50 text-3xl md:text-5xl font-bold text-primary-foreground shadow-2xl border border-white/10 transition-all duration-300 ${
            participant.isSpeaking ? 'scale-110 ring-4 ring-primary/40 shadow-[0_0_40px_rgba(var(--primary),0.4)]' : ''
          }`}>
            {name.charAt(0).toUpperCase()}
          </div>
        </div>
      ) : (
        <VideoTrack trackRef={trackRef} className="w-full h-full object-cover" />
      )}

      <AnimatePresence>
        {reaction && (
          <motion.div 
            initial={{ scale: 0.5, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: -10 }}
            className="absolute top-4 left-4 bg-black/50 backdrop-blur-md rounded-full px-3 py-2 text-2xl shadow-xl z-20 border border-white/10"
          >
            {reaction}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white">{name}</span>
          {isLocal && <span className="text-[10px] text-white/50 bg-white/10 px-1.5 py-0.5 rounded-full">You</span>}
          {isMuted && <MicOff className="h-3 w-3 text-red-400 ml-auto" />}
        </div>
      </div>

      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg opacity-100 group-hover:opacity-0 transition-opacity">
        <span className="text-[11px] font-medium text-white">{name}</span>
        {isMuted && <MicOff className="h-3 w-3 text-red-400" />}
      </div>
    </motion.div>
  );
}

function ScreenShareTile({ trackRef, localIdentity }) {
  const name = trackRef.participant.name || 'User';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
      className={`relative rounded-xl overflow-hidden bg-[#1a1a1f] border border-primary ring-2 ring-primary/50 shadow-xl group w-full h-full min-h-[180px]`}
    >
      <VideoTrack trackRef={trackRef} className="w-full h-full object-contain bg-black" />

      <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-primary/90 text-primary-foreground text-[10px] font-semibold px-2 py-1 rounded-full">
        <MonitorUp className="h-3 w-3" /> Sharing
      </div>

      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg">
        <span className="text-[11px] font-medium text-white">{name}'s Screen</span>
      </div>
    </motion.div>
  );
}
