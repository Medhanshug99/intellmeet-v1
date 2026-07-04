const Meeting = require('../models/Meeting');
const Task = require('../models/Task');
const AiSummary = require('../models/AiSummary');
const Workspace = require('../models/Workspace');
const User = require('../models/User');
const aiService = require('../services/ai.service');

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.log('[SummaryWorker] REDIS_URL not set — background AI worker disabled. AI summaries will not be processed automatically.');
  module.exports = null;
} else {
  const { Worker } = require('bullmq');
  const Redis = require('ioredis');

  const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });

  connection.on('error', (err) => {
    console.error('[SummaryWorker] Redis connection error:', err.message);
  });

  const summaryWorker = new Worker('summaryQueue', async job => {
    const { meetingId, transcript, userId } = job.data;
    console.log(`[SummaryWorker] Processing meeting ${meetingId}`);

    try {
      const meeting = await Meeting.findById(meetingId);
      if (!meeting) {
        console.error(`[SummaryWorker] Meeting ${meetingId} not found.`);
        return;
      }

      const aiResult = await aiService.processMeetingTranscript(transcript);

      await Meeting.findByIdAndUpdate(meetingId, {
        status: 'COMPLETED',
        endedAt: meeting.endedAt || new Date(),
      });

      await AiSummary.findOneAndUpdate(
        { meetingId },
        {
          meetingId,
          status: 'DRAFT',
          overview: aiResult.overview,
          keyDecisions: aiResult.keyDecisions,
          blockers: aiResult.blockers,
        },
        { upsert: true, new: true }
      );

      const workspace = await Workspace.findById(meeting.workspaceId);
      const memberIds = workspace ? workspace.memberIds.map(m => m.userId) : [];
      const workspaceUsers = memberIds.length > 0
        ? await User.find({ _id: { $in: memberIds } }).select('_id name displayName')
        : [];

      for (const taskData of (aiResult.tasks || [])) {
        let assigneeId = null;
        if (taskData.ownerName && taskData.ownerName !== 'Unassigned') {
          const regex = new RegExp(taskData.ownerName, 'i');
          const matchedUser = workspaceUsers.find(u => regex.test(u.displayName || u.name));
          if (matchedUser) {
            assigneeId = matchedUser._id;
          }
        }

        await Task.create({
          title: taskData.content || taskData.title,
          meetingId: meeting._id,
          workspaceId: meeting.workspaceId,
          status: 'TODO',
          source: 'AI',
          ...(assigneeId && { assigneeId }),
        });
      }

      console.log(`[SummaryWorker] Successfully processed meeting ${meetingId}`);
      return { success: true, meetingId };

    } catch (error) {
      console.error(`[SummaryWorker] Failed to process meeting ${meetingId}:`, error);
      await AiSummary.findOneAndUpdate(
        { meetingId },
        { status: 'FAILED' },
        { upsert: true }
      );
      throw error;
    }
  }, { connection });

  summaryWorker.on('failed', (job, err) => {
    console.error(`[SummaryWorker] Job ${job.id} failed with error ${err.message}`);
  });

  module.exports = summaryWorker;
}

