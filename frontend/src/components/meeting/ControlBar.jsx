import {
  Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff,
  MessageSquare, Sparkles, PictureInPicture, Users, Radio, Captions, MonitorUp, Smile, UserCircle, Pen
} from 'lucide-react';
import { InlineSpinner } from '@/components/ui/LoadingStates';
import { useState, useEffect, useRef } from 'react';
import { useLocalParticipant } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { BackgroundBlur } from '@livekit/track-processors';

export function ControlBar({
  isMuted, toggleMute,
  isVideoOff, toggleVideo,
  isRecording, toggleRecording,
  isTranscribing, toggleTranscription,
  togglePiP,
  showPanel, setShowPanel,
  activeTab, setActiveTab,
  leaveMeeting,
  isHost, currentMeeting,
  handleEndAndSummarize, isProcessingAI,
  onReactionSent,
  isWhiteboardOpen, toggleWhiteboard,
}) {
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
  const [showReactions, setShowReactions] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isBlurEnabled, setIsBlurEnabled] = useState(false);
  const screenTrackRef = useRef(null);
  const pickerRef = useRef(null);
  const blurProcessorRef = useRef(null);

  const handleToggleMute = async () => {
    if (!localParticipant) return;
    await localParticipant.setMicrophoneEnabled(isMuted);
    toggleMute();
  };

  const handleToggleVideo = async () => {
    if (!localParticipant) return;
    await localParticipant.setCameraEnabled(isVideoOff);
    toggleVideo();
  };

  const toggleBackgroundBlur = async () => {
    if (!localParticipant) return;
    const cameraTrack = localParticipant.getTrackPublication(Track.Source.Camera)?.track;
    if (!cameraTrack) return; 

    try {
      if (isBlurEnabled) {
        
        await cameraTrack.stopProcessor();
        blurProcessorRef.current = null; 
        setIsBlurEnabled(false);
      } else {
        
        blurProcessorRef.current = BackgroundBlur(10, { delegate: 'GPU' });
        await cameraTrack.setProcessor(blurProcessorRef.current);
        setIsBlurEnabled(true);
      }
    } catch (err) {
      console.error("Failed to toggle background blur:", err);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowReactions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleScreenShare = async () => {
    if (!localParticipant) return;

    if (isScreenSharing) {
      
      if (screenTrackRef.current) {
        try {
          await localParticipant.unpublishTrack(screenTrackRef.current);
          screenTrackRef.current.stop();
        } catch (_) {}
        screenTrackRef.current = null;
      }
      setIsScreenSharing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' },
          audio: false,
        });
        const videoTrack = stream.getVideoTracks()[0];

        await localParticipant.publishTrack(videoTrack, {
          source: Track.Source.ScreenShare,
          name: 'screen',
        });

        screenTrackRef.current = videoTrack;
        setIsScreenSharing(true);

        videoTrack.onended = () => {
          localParticipant.unpublishTrack(videoTrack).catch(() => {});
          screenTrackRef.current = null;
          setIsScreenSharing(false);
        };
      } catch (err) {
        if (err.name !== 'NotAllowedError') {
          console.error('Screen share failed:', err);
        }
      }
    }
  };

  const sendReaction = (emoji) => {
    if (localParticipant) {
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify({ emoji, identity: localParticipant.identity }));
      localParticipant.publishData(data, { reliable: true, topic: 'reaction' });
      
      onReactionSent?.({ emoji, identity: localParticipant.identity });
    }
    setShowReactions(false); 
  };

  const EMOJIS = ['👍', '👏', '😂', '🎉', '💖', '😲', '🔥', '✨'];

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30">
      <div className="flex items-center gap-1.5 bg-[#1c1c20]/95 backdrop-blur-xl border border-white/10 px-3 py-2.5 rounded-2xl shadow-2xl">

        <ToolbarBtn
          onClick={handleToggleMute}
          active={isMuted}
          activeClass="bg-rose-500/20 text-rose-300 border-rose-500/25"
          label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </ToolbarBtn>

        <ToolbarBtn
          onClick={handleToggleVideo}
          active={isVideoOff}
          activeClass="bg-rose-500/20 text-rose-300 border-rose-500/25"
          label={isVideoOff ? 'Start Video' : 'Stop Video'}
        >
          {isVideoOff ? <VideoOff className="h-4 w-4" /> : <VideoIcon className="h-4 w-4" />}
        </ToolbarBtn>

        {!isVideoOff && (
          <ToolbarBtn
            onClick={toggleBackgroundBlur}
            active={isBlurEnabled}
            activeClass="bg-sky-500/20 text-sky-300 border-sky-500/25"
            label={isBlurEnabled ? 'Disable Blur' : 'Blur Background'}
          >
            <UserCircle className="h-4 w-4" />
          </ToolbarBtn>
        )}

        <div className="w-px h-6 bg-white/10 mx-1" />

        {}
        <ToolbarBtn
          onClick={toggleScreenShare}
          active={isScreenSharing}
          activeClass="bg-emerald-500/20 text-emerald-300 border-emerald-500/25"
          label={isScreenSharing ? 'Stop Share' : 'Share Screen'}
        >
          <MonitorUp className="h-4 w-4" />
        </ToolbarBtn>

        {}
        <div className="relative" ref={pickerRef}>
          <ToolbarBtn
            onClick={() => setShowReactions(prev => !prev)}
            active={showReactions}
            activeClass="bg-amber-500/20 text-amber-300 border-amber-500/25"
            label="React"
          >
            <Smile className="h-4 w-4" />
          </ToolbarBtn>

          {showReactions && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 p-2 bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl flex gap-1">
              {EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => sendReaction(emoji)}
                  className="text-xl hover:scale-125 active:scale-95 transition-transform duration-150 p-1.5 rounded-xl hover:bg-white/10"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {}
        <ToolbarBtn onClick={togglePiP} label="Picture-in-Picture">
          <PictureInPicture className="h-4 w-4" />
        </ToolbarBtn>

        {/* Recording — host only */}
        {isHost && (
          <ToolbarBtn
            onClick={toggleRecording}
            active={isRecording}
            activeClass="bg-rose-500/20 text-rose-300 border-rose-500/25"
            label={isRecording ? 'Stop Rec' : 'Record'}
          >
            <Radio className={`h-4 w-4 ${isRecording ? 'animate-pulse' : ''}`} />
          </ToolbarBtn>
        )}

        {/* Live captions — host only */}
        {isHost && (
          <ToolbarBtn
            onClick={toggleTranscription}
            active={isTranscribing}
            activeClass="bg-sky-500/20 text-sky-300 border-sky-500/25"
            label={isTranscribing ? 'Stop Captions' : 'Captions'}
          >
            <Captions className="h-4 w-4" />
          </ToolbarBtn>
        )}

        <div className="w-px h-6 bg-white/10 mx-1" />

        {}
        <ToolbarBtn
          onClick={() => { setShowPanel(!showPanel); setActiveTab('chat'); }}
          active={showPanel && activeTab === 'chat'}
          activeClass="bg-violet-500/20 text-violet-300 border-violet-500/25"
          label="Chat"
        >
          <MessageSquare className="h-4 w-4" />
        </ToolbarBtn>

        {}
        <ToolbarBtn
          onClick={() => { setShowPanel(!showPanel); setActiveTab('participants'); }}
          active={showPanel && activeTab === 'participants'}
          activeClass="bg-violet-500/20 text-violet-300 border-violet-500/25"
          label="People"
        >
          <Users className="h-4 w-4" />
        </ToolbarBtn>

        {/* Whiteboard — host only */}
        {isHost && (
          <ToolbarBtn
            onClick={toggleWhiteboard}
            active={isWhiteboardOpen}
            activeClass="bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/25"
            label="Whiteboard"
          >
            <Pen className="h-4 w-4" />
          </ToolbarBtn>
        )}

        <div className="w-px h-6 bg-white/10 mx-1" />

        {}
        <button
          onClick={leaveMeeting}
          className="flex items-center gap-2 h-9 px-4 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white font-semibold text-xs transition-all shadow-lg shadow-rose-900/30 border border-rose-500/20"
        >
          <PhoneOff className="h-4 w-4" />
          Leave
        </button>

        {}
        {isHost && currentMeeting?.status !== 'COMPLETED' && (
          <button
            onClick={handleEndAndSummarize}
            disabled={isProcessingAI}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs transition-all ml-1 shadow-lg disabled:opacity-60"
          >
            {isProcessingAI ? <InlineSpinner size="xs" /> : <Sparkles className="h-4 w-4" />}
            {isProcessingAI ? 'Analyzing...' : 'End & Analyze'}
          </button>
        )}
      </div>
    </div>
  );
}

function ToolbarBtn({ children, onClick, active, activeClass, label }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`relative group flex items-center justify-center rounded-xl h-9 w-9 transition-all duration-150 border ${
        active
          ? activeClass
          : 'bg-white/[0.06] hover:bg-white/[0.12] text-white/60 hover:text-white border-white/[0.08]'
      }`}
    >
      {children}
      <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-black/80 text-[10px] text-white font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
        {label}
      </span>
    </button>
  );
}
