import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all users
    const users = await base44.asServiceRole.entities.User.list();

    // Get start of current week (Monday 00:00:00 UTC, adjusted for EST/EDT)
    const now = new Date();
    // Get Monday of current week in America/New_York
    const dayOfWeek = now.getUTCDay(); // 0=Sun, 1=Mon...
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() - daysToMonday);
    monday.setUTCHours(5, 0, 0, 0); // 5am UTC = midnight EST (adjust for EDT: 4am UTC)
    const weekStartISO = monday.toISOString();

    for (const user of users) {
      // Fetch all focus sessions for this user
      const allSessions = await base44.asServiceRole.entities.FocusSession.filter({ created_by: user.email });

      // All-time study minutes
      const allTimeMinutes = allSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

      // Weekly study minutes
      const weeklySessions = allSessions.filter(s => s.created_date >= weekStartISO);
      const weeklyMinutes = weeklySessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

      const username = user.full_name || user.email || 'Anonymous';

      // Update or create weekly entry
      const existingWeekly = await base44.asServiceRole.entities.LeaderboardEntry.filter({
        userId: user.id,
        period: 'weekly',
        season: 'current'
      });
      if (existingWeekly.length > 0) {
        await base44.asServiceRole.entities.LeaderboardEntry.update(existingWeekly[0].id, {
          studyMinutes: weeklyMinutes,
          username,
        });
      } else {
        await base44.asServiceRole.entities.LeaderboardEntry.create({
          userId: user.id,
          username,
          period: 'weekly',
          season: 'current',
          studyMinutes: weeklyMinutes,
        });
      }

      // Update or create all-time entry
      const existingAllTime = await base44.asServiceRole.entities.LeaderboardEntry.filter({
        userId: user.id,
        period: 'alltime',
        season: 'current'
      });
      if (existingAllTime.length > 0) {
        await base44.asServiceRole.entities.LeaderboardEntry.update(existingAllTime[0].id, {
          studyMinutes: allTimeMinutes,
          username,
        });
      } else {
        await base44.asServiceRole.entities.LeaderboardEntry.create({
          userId: user.id,
          username,
          period: 'alltime',
          season: 'current',
          studyMinutes: allTimeMinutes,
        });
      }
    }

    return Response.json({ success: true, usersProcessed: users.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});