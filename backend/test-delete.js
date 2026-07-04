require('dotenv').config();
const { prisma } = require('./src/config/db');

async function run() {
  try {
    // Create mock user
    const u = await prisma.user.create({
      data: { email: 'testdelete@example.com', name: 'Test' }
    });
    
    // Create workspace
    const w = await prisma.workspace.create({
      data: { name: 'W1', ownerId: u.id, members: { connect: [{ id: u.id }] } }
    });
    
    // Create meeting
    const m = await prisma.meeting.create({
      data: { title: 'M1', workspaceId: w.id, hostId: u.id, scheduledStartTime: new Date() }
    });
    
    // Create task
    await prisma.task.create({
      data: { content: 'T1', workspaceId: w.id, meetingId: m.id, ownerId: u.id }
    });
    
    const userId = u.id;
    console.log("Mock data created for", userId);
    
    // Now try to delete via the transaction
    await prisma.$transaction(async (tx) => {
      const userWorkspaces = await tx.workspace.findMany({ where: { ownerId: userId }, select: { id: true } });
      const workspaceIds = userWorkspaces.map(w => w.id);

      const meetingsToDelete = await tx.meeting.findMany({
        where: {
          OR: [
            { hostId: userId },
            ...(workspaceIds.length > 0 ? [{ workspaceId: { in: workspaceIds } }] : [])
          ]
        },
        select: { id: true }
      });
      const meetingIds = meetingsToDelete.map(m => m.id);

      await tx.task.deleteMany({
        where: {
          OR: [
            { ownerId: userId },
            ...(workspaceIds.length > 0 ? [{ workspaceId: { in: workspaceIds } }] : []),
            ...(meetingIds.length > 0 ? [{ meetingId: { in: meetingIds } }] : [])
          ]
        }
      });

      if (meetingIds.length > 0) {
        await tx.meeting.deleteMany({ where: { id: { in: meetingIds } } });
      }

      if (workspaceIds.length > 0) {
        await tx.workspace.deleteMany({ where: { id: { in: workspaceIds } } });
      }

      await tx.user.delete({ where: { id: userId } });
    });
    
    console.log("Successfully deleted!");
  } catch(e) {
    console.error("Prisma Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
