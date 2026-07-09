import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useMeetingStore } from '../store/meetingStore';
import { LayoutDashboard, Users, Copy, CheckCheck, Mic, MicOff, Video as VideoIcon, VideoOff, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { InlineSpinner } from '@/components/ui/LoadingStates';
import { ThemeToggle } from '@/components/ThemeToggle';
import io from 'socket.io-client';
import { api } from '../store/authStore';
import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';

import { VideoGrid } from '../components/meeting/VideoGrid';
import { ControlBar } from '../components/meeting/ControlBar';
import { SidePanel } from '../components/meeting/SidePanel';
import { FloatingReactions } from '../components/meeting/FloatingReactions';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5005/api/v1')
  .replace(/\/api\/v\d+\/?$/, '');

// Lightweight room-level toast
function RoomToast({ message, type = 'info', onDismiss }) {
  if (!message) return null;
  return (
    <div className={`fixed bottom-28 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium backdrop-blur-md max-w-sm ${
      type === 'error' ? 'bg-red-900/80 border-red-500/30 text-red-200' : 'bg-zinc-900/90 border-white/10 text-white'
    }`}>
      {type === 'error' ? <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" /> : <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />}
      <span>{message}</span>
      <button onClick={onDismiss} className="ml-2 opacity-60 hover:opacity-100"><X className="h-3.5 w-3.5" /></button>
    </div>
  );
}

export default function MeetingRoom() {
  const { id: meetingId } = useParams();
  const { user } = useAuthStore();
  const { currentMeeting, fetchMeetingById, processMeetingAI, isLoading: isProcessingAI } = useMeetingStore();
  const navigate = useNavigate();

  const [hasJoined, setHasJoined] = useState(false);
  const [userName, setUserName] = useState(user?.name || user?.email?.split('@')[0] || '');

  const currentUserId = user?.id || user?._id;
  const hostIdObj = currentMeeting?.hostId || currentMeeting?.host;
  const meetingHostId = typeof hostIdObj === 'object' ? (hostIdObj?.id || hostIdObj?._id) : hostIdObj;

  const isHost = Boolean(
    currentUserId && 
    meetingHostId && 
    String(currentUserId) === String(meetingHostId)
  );
  
  useEffect(() => {
    if (currentMeeting) {
      console.log('MeetingRoom debug - isHost:', isHost, 'currentUserId:', currentUserId, 'meetingHostId:', meetingHostId);
    }
  }, [currentMeeting, isHost, currentUserId, meetingHostId]);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  const [showPanel, setShowPanel] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  
  const [localReaction, setLocalReaction] = useState(null);
  const [roomToast, setRoomToast] = useState(null);

  const showRoomToast = useCallback((message, type = 'info', ms = 4000) => {
    setRoomToast({ message, type });
    if (ms > 0) setTimeout(() => setRoomToast(null), ms);
  }, []);

  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const [isTranscribing, setIsTranscribing] = useState(false);
  const recognitionRef = useRef(null);
  const [liveCaptions, setLiveCaptions] = useState('');
  const [meetingTranscript, setMeetingTranscript] = useState([]);
  const [linkCopied, setLinkCopied] = useState(false);

  const socketRef = useRef(null);
  const [livekitToken, setLivekitToken] = useState('');
  const [isWaitingForApproval, setIsWaitingForApproval] = useState(false);
  const [waitingParticipants, setWaitingParticipants] = useState([]);

  useEffect(() => {
    fetchMeetingById(meetingId);
  }, [meetingId, fetchMeetingById]);

  useEffect(() => {
    if (!hasJoined) return;

    socketRef.current = io(SOCKET_URL);

    const initConnection = async () => {
      try {
        const res = await api.get(`/meetings/${meetingId}/token`);
        setLivekitToken(res.data.data.token);
        socketRef.current.emit('join-meeting', { meetingId, userId: user?.id, name: userName || 'Guest' });
      } catch (err) {
        console.error("Failed to get LiveKit token", err);
        showRoomToast("Failed to join meeting", "error");
      }
    };

    if (isHost) {
      initConnection();
      socketRef.current.emit('host-joined', { meetingId });
    } else {
      setIsWaitingForApproval(true);
      socketRef.current.emit('request-join', { meetingId, userId: user?.id, name: userName || 'Guest' });
    }

    socketRef.current.on('join-approved', () => {
      setIsWaitingForApproval(false);
      showRoomToast('Host approved your request to join!', 'success');
      initConnection();
    });

    socketRef.current.on('join-rejected', () => {
      showRoomToast('Host declined your request to join.', 'error', 5000);
      setTimeout(() => navigate('/dashboard'), 3000);
    });

    socketRef.current.on('waiting-list-update', (list) => {
      setWaitingParticipants(list);
    });

    socketRef.current.on('receive-message', data => setChatMessages(prev => [...prev, data]));

    socketRef.current.on('mute-all', () => {
      setIsMuted(true);
      showRoomToast('The host has muted everyone.', 'info');
    });

    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.onresult = event => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const finalPhrase = event.results[i][0].transcript;

            setMeetingTranscript(prev => [...prev, `${userName || 'You'}: ${finalPhrase}`]);
            
            socketRef.current.emit('send-message', {
              meetingId,
              message: `[Caption] ${finalPhrase}`,
              senderName: userName || 'You'
            });
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setLiveCaptions(interimTranscript);
      };
    }

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [hasJoined, meetingId, userName, user?.id]);

  const sendMessage = e => {
    e.preventDefault();
    const msg = messageInput.trim();
    if (msg) {
      socketRef.current.emit('send-message', {
        meetingId,
        message: msg,
        senderName: user?.name || user?.email?.split('@')[0] || 'You'
      });
      
      if (msg.toLowerCase().startsWith('@intellbot')) {
        const chatLog = chatMessages.map(m => `${m.senderName}: ${m.message}`).join('\n');
        const spokenLog = meetingTranscript.join('\n');
        const context = `--- CHAT ---\n${chatLog}\n\n--- SPEECH ---\n${spokenLog}`;
        
        socketRef.current.emit('ask-bot', {
          meetingId,
          question: msg.substring(10).trim() || 'What is currently being discussed?',
          context: context
        });
      }

      setMessageInput('');
    }
  };

  const handleEndAndSummarize = async () => {
    if (isRecording) toggleRecording();
    if (isTranscribing) toggleTranscription();
    
    const chatLog = chatMessages.map(m => `${m.senderName}: ${m.message}`).join('\n');
    const spokenLog = meetingTranscript.join('\n');
    const combinedData = `--- CHAT LOGS ---\n${chatLog}\n\n--- SPOKEN TRANSCRIPT ---\n${spokenLog}`.trim();
    
    const result = await processMeetingAI(meetingId, combinedData || 'Meeting concluded with no recorded data.');
    if (result) {
      showRoomToast('Meeting analyzed successfully. Redirecting...', 'info', 3000);
      setTimeout(() => navigate('/dashboard'), 3000);
    } else {
    }
  };

  const handlePublishSummary = async () => {
    try {
      await api.patch(`/meetings/${meetingId}/summary`, { aiSummaryStatus: 'Published' });
      await fetchMeetingById(meetingId);
      showRoomToast('Summary published successfully', 'info');
    } catch (err) {
      showRoomToast('Failed to publish summary', 'error');
    }
  };

  const toggleTranscription = () => {
    if (!recognitionRef.current) return showRoomToast('Speech recognition is not supported in this browser.', 'error');
    if (isTranscribing) {
      recognitionRef.current.stop();
      setIsTranscribing(false);
      setLiveCaptions('');
    } else {
      try {
        recognitionRef.current.start();
        setIsTranscribing(true);
      } catch (e) {
        console.error('Transcription error:', e);
      }
    }
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        
        mediaRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };

        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          document.body.appendChild(a);
          a.style = 'display: none';
          a.href = url;
          
          a.download = `IntellMeet_Recording_${new Date().toISOString().slice(0, 10)}.webm`;
          a.click();
          window.URL.revokeObjectURL(url);
          recordedChunksRef.current = [];
          setIsRecording(false);
          
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);

        stream.getVideoTracks()[0].onended = () => {
          if (mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
        };

      } catch (err) {
        console.error("Error starting screen recording:", err);
        if (err.name !== 'NotAllowedError') {
          showRoomToast('Failed to start recording. Please allow screen sharing permissions.', 'error');
        }
      }
    } else {
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleMuteAll = () => {
    if (socketRef.current) {
      socketRef.current.emit('mute-all', { meetingId });
      setRoomToast({ message: 'You muted everyone.', type: 'success' });
    }
  };

  const approveParticipant = (socketId) => {
    if (socketRef.current) socketRef.current.emit('approve-participant', { meetingId, socketId });
  };

  const rejectParticipant = (socketId) => {
    if (socketRef.current) socketRef.current.emit('reject-participant', { meetingId, socketId });
  };

  const [previewStream, setPreviewStream] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    let activeStream = null;

    if (!hasJoined) {
      if (!isVideoOff || !isMuted) {
        navigator.mediaDevices.getUserMedia({ 
          video: !isVideoOff, 
          audio: !isMuted 
        })
        .then(stream => {
          activeStream = stream;
          setPreviewStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.error("Media permission denied", err);
        });
      } else {
        setPreviewStream(null);
      }
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [hasJoined, isVideoOff, isMuted]);

  useEffect(() => {
    if (videoRef.current && previewStream) {
      videoRef.current.srcObject = previewStream;
    }
  }, [previewStream]);

  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-primary/15 rounded-full blur-[140px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-accent/20 rounded-full blur-[140px]" />
        </div>

        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 z-10">
          {/* Camera preview */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-full aspect-video bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex items-center justify-center bg-black">
              {!isVideoOff && previewStream ? (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-muted/40 to-muted/10">
                  <div className="h-28 w-28 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-4xl font-bold text-primary-foreground shadow-xl mb-4 ring-4 ring-primary/20">
                    {userName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium px-4 text-center">
                    {isVideoOff ? 'Camera is off' : 'Requesting camera access...'}
                  </p>
                </div>
              )}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
                <button onClick={() => setIsMuted(!isMuted)} className={`flex items-center justify-center rounded-full h-11 w-11 transition-all shadow-lg backdrop-blur-sm border ${isMuted ? 'bg-destructive text-destructive-foreground border-destructive/50' : 'bg-background/80 hover:bg-background text-foreground border-border'}`}>
                  {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
                <button onClick={() => setIsVideoOff(!isVideoOff)} className={`flex items-center justify-center rounded-full h-11 w-11 transition-all shadow-lg backdrop-blur-sm border ${isVideoOff ? 'bg-destructive text-destructive-foreground border-destructive/50' : 'bg-background/80 hover:bg-background text-foreground border-border'}`}>
                  {isVideoOff ? <VideoOff className="h-4 w-4" /> : <VideoIcon className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {/* Role badge */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              isHost
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-white/5 border-white/10 text-muted-foreground'
            }`}>
              <div className={`h-1.5 w-1.5 rounded-full ${isHost ? 'bg-primary animate-pulse' : 'bg-white/30'}`} />
              {isHost ? 'You are the Host' : 'Joining as Participant'}
            </div>
          </div>

          {/* Right panel — role-specific */}
          <div className="flex flex-col justify-center gap-6">
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">
                {isHost ? '🎙 Host Dashboard' : 'Meeting Room'}
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-foreground mb-1">
                {isHost ? 'Start your meeting' : 'Ready to join?'}
              </h1>
              <p className="text-muted-foreground text-sm">
                {currentMeeting?.title ? currentMeeting.title : 'Loading meeting details...'}
              </p>
              {!isHost && (
                <p className="text-xs text-muted-foreground/60 mt-2">
                  The host will admit you once they open the room.
                </p>
              )}
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Your Display Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={e => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="premium-input w-full h-12 text-base"
              />
            </div>

            {/* Host: show meeting status info */}
            {isHost && currentMeeting && (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30 text-sm text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <span>
                  Meeting is <span className="font-semibold text-foreground">{currentMeeting.status?.toLowerCase()}</span>. Admitting guests will start it.
                </span>
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <button onClick={() => navigate('/dashboard')} className="flex-1 h-12 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-medium text-sm">
                Cancel
              </button>
              <button
                onClick={() => setHasJoined(true)}
                disabled={!userName.trim()}
                className={`flex-2 h-12 px-8 rounded-xl font-semibold transition-all disabled:opacity-50 text-sm flex items-center gap-2 shadow-lg ${
                  isHost
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/25'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                }`}
              >
                <VideoIcon className="h-4 w-4" />
                {isHost ? 'Start Meeting' : 'Request to Join'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isWaitingForApproval) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10 text-center max-w-md w-full">
          {/* Animated ring */}
          <div className="relative mx-auto mb-8 w-24 h-24">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
            <div className="absolute inset-2 rounded-full border-2 border-primary/40 animate-pulse" />
            <div className="absolute inset-4 rounded-full bg-primary/10 flex items-center justify-center">
              <InlineSpinner size="md" className="text-primary" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Waiting for Host</h2>
          <p className="text-white/40 text-sm mb-1">Your request to join has been sent.</p>
          <p className="text-white/30 text-xs mb-8">The host will admit you shortly.</p>

          {/* User info card */}
          <div className="inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 mb-8">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-sm font-bold text-white">
              {userName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">{userName}</p>
              <p className="text-xs text-white/40">Participant</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full h-11 rounded-xl border border-white/10 text-white/50 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium"
          >
            Cancel &amp; Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!livekitToken) {
    return <div className="h-screen flex items-center justify-center bg-[#0f0f11] text-white"><InlineSpinner size="lg" className="mr-3"/> Connecting to LiveKit...</div>;
  }

  return (
    <div className="w-full h-screen bg-[#0f0f11] flex overflow-hidden">
      {}
      <RoomToast
        message={roomToast?.message}
        type={roomToast?.type}
        onDismiss={() => setRoomToast(null)}
      />
      <LiveKitRoom
        video={!isVideoOff}
        audio={!isMuted}
        token={livekitToken}
        serverUrl={import.meta.env.VITE_LIVEKIT_URL}
        style={{ flex: 1, display: 'flex', width: '100%', height: '100%' }}
        className="text-foreground font-sans relative"
      >
      <div className="flex-1 flex flex-col relative transition-all duration-300 ease-in-out overflow-hidden">
        
        <header className="absolute top-0 left-0 w-full h-14 bg-black/40 backdrop-blur-xl border-b border-white/5 z-20 flex items-center justify-between px-4">

          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="h-8 w-8 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-white/70 hover:text-white transition-colors border border-white/10">
              <LayoutDashboard className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-white truncate max-w-[200px]">{currentMeeting?.title || 'Live Room'}</h2>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30">
                <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wider">Live</span>
              </div>
              {/* Role badge */}
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                isHost
                  ? 'bg-primary/20 border-primary/30 text-primary'
                  : 'bg-white/5 border-white/10 text-white/40'
              }`}>
                {isHost ? '🎙 Host' : '👤 Guest'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <Users className="h-3.5 w-3.5 text-white/50" />
            </div>
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-2 px-3 h-8 rounded-lg bg-white/5 border border-white/10">
              <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Code</span>
              <span className="text-xs font-mono text-white/80 select-all">{meetingId}</span>
            </div>
            <button onClick={copyLink} className="h-8 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5 border border-white/10">
              {linkCopied ? <CheckCheck className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {linkCopied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
        </header>

        <div className="flex-1 p-4 pt-20 pb-24 relative w-full h-full">
          {isWhiteboardOpen ? (
            <div className="absolute inset-4 mt-16 mb-20 z-10 bg-white rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <Tldraw />
            </div>
          ) : (
            <VideoGrid isVideoOff={isVideoOff} localReaction={localReaction} />
          )}
        </div>

        <FloatingReactions />

        {isTranscribing && liveCaptions && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 max-w-2xl w-full px-4 pointer-events-none">
            <div className="bg-black/80 backdrop-blur-md text-white px-6 py-3 rounded-2xl text-center text-base font-medium shadow-2xl border border-white/10">
              {liveCaptions}
            </div>
          </div>
        )}

        <ControlBar 
          isMuted={isMuted} toggleMute={() => setIsMuted(!isMuted)}
          isVideoOff={isVideoOff} toggleVideo={() => setIsVideoOff(!isVideoOff)}
          isRecording={isRecording} toggleRecording={toggleRecording}
          isTranscribing={isTranscribing} toggleTranscription={toggleTranscription}
          togglePiP={() => {}} 
          showPanel={showPanel} setShowPanel={setShowPanel}
          activeTab={activeTab} setActiveTab={setActiveTab}
          leaveMeeting={() => navigate('/dashboard')}
          isHost={isHost} currentMeeting={currentMeeting}
          handleEndAndSummarize={handleEndAndSummarize} isProcessingAI={isProcessingAI}
          onReactionSent={setLocalReaction}
          isWhiteboardOpen={isWhiteboardOpen} toggleWhiteboard={() => setIsWhiteboardOpen(!isWhiteboardOpen)}
        />
      </div>

      <SidePanel 
        showPanel={showPanel} activeTab={activeTab} setActiveTab={setActiveTab}
        chatMessages={chatMessages} messageInput={messageInput} setMessageInput={setMessageInput} sendMessage={sendMessage}
        currentMeeting={currentMeeting} navigate={navigate} userName={userName} user={user}
        isHost={isHost} handleMuteAll={handleMuteAll} handlePublishSummary={handlePublishSummary}
        copyLink={copyLink} linkCopied={linkCopied}
        waitingParticipants={waitingParticipants}
        approveParticipant={approveParticipant}
        rejectParticipant={rejectParticipant}
      />
      </LiveKitRoom>
    </div>
  );
}
