import { MessageSquare, Users, FileText, Sparkles, Send, MicOff, Mic, VideoOff, Video as VideoIcon, Check, X } from 'lucide-react';
import { useParticipants, useLocalParticipant } from '@livekit/components-react';

export function SidePanel({
  showPanel, activeTab, setActiveTab,
  chatMessages, messageInput, setMessageInput, sendMessage,
  currentMeeting, navigate, userName, user,
  isHost, handleMuteAll, handlePublishSummary,
  copyLink, linkCopied,
  waitingParticipants, approveParticipant, rejectParticipant
}) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const totalParticipants = participants.length;

  return (
    <div className={`h-full w-full md:w-[360px] shrink-0 bg-[#111114] border-l border-white/[0.06] flex flex-col shadow-2xl transition-all duration-300 ease-in-out z-40 ${
      showPanel ? 'absolute md:relative right-0 translate-x-0 md:mr-0' : 'absolute md:relative right-0 translate-x-full md:translate-x-0 md:-mr-[360px]'
    }`}>
      <div className="flex p-2 border-b border-white/[0.06] gap-1 shrink-0">
        {[
          { key: 'chat', icon: <MessageSquare className="h-3.5 w-3.5" />, label: 'Chat' },
          { key: 'participants', icon: <Users className="h-3.5 w-3.5" />, label: `People (${totalParticipants})` },
          { key: 'summary', icon: <FileText className="h-3.5 w-3.5" />, label: 'AI Summary' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-colors ${activeTab === tab.key ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'participants' && (
        <div className="flex-1 flex flex-col min-h-0">
          {isHost && waitingParticipants && waitingParticipants.length > 0 && (
            <div className="p-3 border-b border-white/[0.06] shrink-0">
               <span className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-2">Waiting Room ({waitingParticipants.length})</span>
               <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                 {waitingParticipants.map(p => (
                   <div key={p.socketId} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10">
                     <span className="text-sm font-medium text-white truncate mr-2">{p.name || 'Guest'}</span>
                     <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => approveParticipant(p.socketId)} className="p-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors" title="Approve">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => rejectParticipant(p.socketId)} className="p-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors" title="Reject">
                          <X className="h-3.5 w-3.5" />
                        </button>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          )}
          <div className="p-3 pb-1 flex items-center justify-between shrink-0">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">In Meeting</span>
            <div className="flex items-center gap-2">
              <button onClick={copyLink} className="text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 px-2 py-1 rounded transition-colors flex items-center gap-1">
                {linkCopied ? 'Copied!' : 'Invite Others'}
              </button>
              {isHost && participants.length > 1 && (
                <button onClick={handleMuteAll} className="text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2 py-1 rounded transition-colors">
                  Mute All
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 pt-1 custom-scrollbar space-y-2">
            {participants.map((p) => {
            const isMe = p.identity === localParticipant.identity;
            const isMuted = !p.isMicrophoneEnabled;
            const isVideoOff = !p.isCameraEnabled;
            
            return (
              <div key={p.identity} className={`flex items-center gap-3 p-3 rounded-xl border ${isMe ? 'bg-white/5 border-white/[0.06]' : 'bg-white/[0.03] border-white/[0.04]'}`}>
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                  {(p.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{p.name || 'User'}</p>
                  <p className="text-[11px] text-white/40">{isMe ? 'You' : 'Participant'}</p>
                </div>
                <div className="flex items-center gap-1">
                  {isMuted ? <MicOff className="h-3.5 w-3.5 text-red-400" /> : <Mic className="h-3.5 w-3.5 text-emerald-400" />}
                  {isVideoOff ? <VideoOff className="h-3.5 w-3.5 text-red-400" /> : <VideoIcon className="h-3.5 w-3.5 text-emerald-400" />}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {activeTab === 'summary' && (
        currentMeeting?.aiSummaryStatus === 'Processing' ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 opacity-50">
            <Sparkles className="h-10 w-10 text-white/20 mb-4 animate-pulse" />
            <p className="text-sm font-semibold text-white/50 mb-1">AI is Processing</p>
            <p className="text-xs text-white/30">Generating the summary and action items...</p>
          </div>
        ) : currentMeeting?.aiSummaryStatus === 'Draft' && !isHost ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 opacity-50">
            <Sparkles className="h-10 w-10 text-white/20 mb-4" />
            <p className="text-sm font-semibold text-white/50 mb-1">Draft Under Review</p>
            <p className="text-xs text-white/30">The host is currently reviewing the AI summary. It will appear here once published.</p>
          </div>
        ) : (currentMeeting?.overview || currentMeeting?.summary) ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 overflow-y-auto flex-1 text-white/70 text-sm whitespace-pre-wrap custom-scrollbar leading-relaxed">
              {currentMeeting.overview && (
                <div className="mb-4">
                  <h4 className="text-white font-semibold mb-1">Overview</h4>
                  <p>{currentMeeting.overview}</p>
                </div>
              )}
              {currentMeeting.keyDecisions && currentMeeting.keyDecisions.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-white font-semibold mb-1">Key Decisions</h4>
                  <ul className="list-disc pl-4">
                    {currentMeeting.keyDecisions.map((desc, i) => <li key={i}>{desc}</li>)}
                  </ul>
                </div>
              )}
              {currentMeeting.blockers && currentMeeting.blockers.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-white font-semibold mb-1">Blockers</h4>
                  <ul className="list-disc pl-4 text-red-400">
                    {currentMeeting.blockers.map((desc, i) => <li key={i}>{desc}</li>)}
                  </ul>
                </div>
              )}
              {!currentMeeting.overview && currentMeeting.summary && (
                <div className="mb-4">
                  <p>{currentMeeting.summary}</p>
                </div>
              )}
              
              <div className="mt-8 pt-5 border-t border-white/[0.06] space-y-3">
                {isHost && currentMeeting.aiSummaryStatus === 'Draft' && (
                  <button className="w-full py-2 bg-white text-black font-semibold rounded-lg hover:bg-white/90 transition-colors" onClick={handlePublishSummary}>
                    Publish Summary
                  </button>
                )}
                {(!currentMeeting.aiSummaryStatus || currentMeeting.aiSummaryStatus === 'Published' || isHost) && (
                  <button className="premium-button w-full" onClick={() => navigate('/board')}>
                    View Action Items
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 opacity-50">
            <Sparkles className="h-10 w-10 text-white/20 mb-4" />
            <p className="text-sm font-semibold text-white/50 mb-1">Analysis Pending</p>
            <p className="text-xs text-white/30">AI summary will appear once the meeting ends.</p>
          </div>
        )
      )}

      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar flex flex-col">
            {chatMessages.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-white/20 gap-3">
                <MessageSquare className="h-8 w-8" />
                <p className="text-xs font-medium">No messages yet</p>
              </div>
            )}
            {chatMessages.map((msg, idx) => {
              const isMe = msg.senderName === user?.name || msg.senderName === user?.email?.split('@')[0] || msg.senderName === 'You';
              return (
                <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[11px] font-medium text-white/40">{isMe ? 'You' : msg.senderName}</span>
                    <span className="text-[10px] text-white/20">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className={`px-3 py-2 rounded-xl max-w-[85%] text-sm leading-relaxed ${isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-white/[0.07] text-white/80 rounded-tl-sm border border-white/[0.06]'}`}>
                    {msg.message}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 border-t border-white/[0.06]">
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                placeholder="Message everyone..."
                className="flex-1 h-9 px-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-colors"
              />
              <button
                type="submit"
                disabled={!messageInput.trim()}
                className="h-9 w-9 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 transition-colors flex items-center justify-center disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
