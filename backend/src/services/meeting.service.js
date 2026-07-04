const Meeting = require('../models/Meeting');
const Workspace = require('../models/Workspace');
const User = require('../models/User');
const AiSummary = require('../models/AiSummary');
const Task = require('../models/Task');
const { AppError } = require('../middlewares/error.middleware');
const aiService = require('./ai.service');

const isWorkspaceMember = (workspace, userId) => {
  const id = userId.toString();
  return workspace.memberIds.some((m) => m.userId.toString() === id);
};

const isHost = (meeting, userId) => meeting.hostId.toString() === userId.toString();

const isAdmin = async (userId) => {
  const user = await User.findById(userId).select('role');
  return user && user.role === 'ADMIN';
};

const createMeeting = async (meetingData, userId) => {
  const workspace = await Workspace.findById(meetingData.workspace);

  if (!workspace || !isWorkspaceMember(workspace, userId)) {
    throw new AppError('Invalid workspace or unauthorized', 403);
  }

  const meeting = await Meeting.create({
    title: meetingData.title,
    description: meetingData.description,
    workspaceId: meetingData.workspace,
    hostId: userId,
    participantIds: [userId],
    scheduledAt: meetingData.scheduledStartTime ? new Date(meetingData.scheduledStartTime) : undefined,
    status: 'SCHEDULED',
  });

  return meeting;
};

const getMeetingsByWorkspace = async (workspaceId, userId) => {
  const workspace = await Workspace.findById(workspaceId);

  if (!workspace || !isWorkspaceMember(workspace, userId)) {
    throw new AppError('Invalid workspace or unauthorized', 403);
  }

  const meetings = await Meeting.find({ workspaceId })
    .populate('hostId', 'id displayName')
    .sort({ createdAt: -1 });
  return meetings;
};

const getMeetingById = async (meetingId, userId) => {
  const meeting = await Meeting.findById(meetingId)
    .populate('hostId', 'id displayName')
    .populate('participantIds', 'id displayName avatarUrl');

  if (!meeting) {
    throw new AppError('Meeting not found', 404);
  }

  const workspace = await Workspace.findById(meeting.workspaceId);

  if (!workspace || !isWorkspaceMember(workspace, userId)) {
    throw new AppError('Not authorized to access this meeting', 403);
  }

  return meeting;
};

const updateMeeting = async (meetingId, updateData, userId) => {
  const meeting = await Meeting.findById(meetingId);
  if (!meeting) {
    throw new AppError('Meeting not found', 404);
  }

  if (!isHost(meeting, userId) && !(await isAdmin(userId))) {
    throw new AppError('Only the host or an admin can update the meeting', 403);
  }

  const allowed = ['title', 'description', 'status', 'scheduledAt', 'startedAt', 'endedAt', 'recordingUrl'];
  const mongoData = {};
  for (const key of allowed) {
    if (updateData[key] !== undefined) {
      mongoData[key] = ['scheduledAt', 'startedAt', 'endedAt'].includes(key)
        ? new Date(updateData[key])
        : updateData[key];
    }
  }
  // Legacy field mapping
  if (updateData.scheduledStartTime !== undefined) mongoData.scheduledAt = new Date(updateData.scheduledStartTime);
  if (updateData.actualStartTime !== undefined) mongoData.startedAt = new Date(updateData.actualStartTime);
  if (updateData.actualEndTime !== undefined) mongoData.endedAt = new Date(updateData.actualEndTime);

  const updatedMeeting = await Meeting.findByIdAndUpdate(meetingId, mongoData, { new: true });
  return updatedMeeting;
};

const deleteMeeting = async (meetingId, userId) => {
  const meeting = await Meeting.findById(meetingId);
  if (!meeting) {
    throw new AppError('Meeting not found', 404);
  }

  if (!isHost(meeting, userId) && !(await isAdmin(userId))) {
    throw new AppError('Only the host or an admin can delete the meeting', 403);
  }

  await Meeting.findByIdAndDelete(meetingId);
  return null;
};

const joinMeeting = async (meetingId, userId) => {
  const meeting = await Meeting.findById(meetingId);

  if (!meeting) {
    throw new AppError('Meeting not found', 404);
  }

  if (meeting.status === 'COMPLETED' || meeting.status === 'CANCELLED') {
    throw new AppError(`Cannot join a meeting that is ${meeting.status.toLowerCase()}`, 400);
  }

  const workspace = await Workspace.findById(meeting.workspaceId);

  if (!workspace || !isWorkspaceMember(workspace, userId)) {
    throw new AppError('Not authorized to join this meeting', 403);
  }

  const alreadyJoined = meeting.participantIds.some(p => p.toString() === userId.toString());

  if (!alreadyJoined && meeting.participantIds.length >= 50) {
    throw new AppError('Meeting is at full capacity', 403);
  }

  if (!alreadyJoined) {
    meeting.participantIds.push(userId);
  }

  if (isHost(meeting, userId) && meeting.status === 'SCHEDULED') {
    meeting.status = 'LIVE';
    meeting.startedAt = new Date();
  }

  await meeting.save();
  return meeting;
};

const leaveMeeting = async (meetingId, userId) => {
  const meeting = await Meeting.findById(meetingId);
  if (!meeting) {
    throw new AppError('Meeting not found', 404);
  }

  if (isHost(meeting, userId)) {
    throw new AppError('Host cannot leave their own meeting. End or delete it instead.', 400);
  }

  meeting.participantIds = meeting.participantIds.filter(p => p.toString() !== userId.toString());
  await meeting.save();
  return null;
};

// Lazy Redis/Queue setup — only used when REDIS_URL is configured
let summaryQueue = null;
if (process.env.REDIS_URL) {
  const { Queue } = require('bullmq');
  const Redis = require('ioredis');
  const connection = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
  connection.on('error', (err) => console.error('[Queue] Redis error:', err.message));
  summaryQueue = new Queue('summaryQueue', { connection });
}

const processMeetingAI = async (meetingId, transcript, userId) => {
  const meeting = await Meeting.findById(meetingId);
  if (!meeting) {
    throw new AppError('Meeting not found', 404);
  }

  if (!isHost(meeting, userId) && !(await isAdmin(userId))) {
    throw new AppError('Only the host or an admin can trigger AI processing', 403);
  }

  const updatedMeeting = await Meeting.findByIdAndUpdate(meetingId, {
    status: 'COMPLETED',
    endedAt: new Date(),
  }, { new: true });

  if (summaryQueue) {
    // Enqueue to background worker when Redis is available
    await summaryQueue.add('summarizeMeeting', { meetingId, transcript, userId });
    return { meeting: updatedMeeting, message: 'AI summary is processing in the background' };
  } else {
    // Fallback: process synchronously in-process when Redis is not available
    console.log('[processMeetingAI] Redis not available — running AI synchronously');
    try {
      const aiResult = await aiService.processMeetingTranscript(transcript);
      await AiSummary.findOneAndUpdate(
        { meetingId },
        { meetingId, status: 'DRAFT', overview: aiResult.overview, keyDecisions: aiResult.keyDecisions, blockers: aiResult.blockers },
        { upsert: true, new: true }
      );
      for (const taskData of (aiResult.tasks || [])) {
        await Task.create({
          title: taskData.content || taskData.title,
          meetingId: meeting._id,
          workspaceId: meeting.workspaceId,
          status: 'TODO',
          source: 'AI',
        });
      }
    } catch (err) {
      console.error('[processMeetingAI] Synchronous AI processing failed:', err.message);
      await AiSummary.findOneAndUpdate({ meetingId }, { status: 'FAILED' }, { upsert: true });
    }
    return { meeting: updatedMeeting, message: 'AI summary processed synchronously' };
  }
};


const updateMeetingSummary = async (meetingId, summaryData, userId) => {
  const meeting = await Meeting.findById(meetingId);
  if (!meeting) {
    throw new AppError('Meeting not found', 404);
  }

  if (!isHost(meeting, userId) && !(await isAdmin(userId))) {
    throw new AppError('Only the host or an admin can update the summary', 403);
  }

  const allowed = ['recordingUrl'];
  const updateFields = {};
  for (const key of allowed) {
    if (summaryData[key] !== undefined) updateFields[key] = summaryData[key];
  }

  const updatedMeeting = await Meeting.findByIdAndUpdate(meetingId, updateFields, { new: true });
  return updatedMeeting;
};

module.exports = {
  createMeeting,
  getMeetingsByWorkspace,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
  joinMeeting,
  leaveMeeting,
  processMeetingAI,
  updateMeetingSummary
};


