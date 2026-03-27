import { base44 } from '@/api/base44Client';

// Call this whenever a user reviews a card, note, or quiz item.
// Pass in the current userProfile so we can compute the new count.
export async function incrementDailyReview(userProfile) {
  if (!userProfile) return;
  const today = new Date().toISOString().split('T')[0];
  const lastDate = userProfile.lastReviewDate;
  const currentCount = lastDate === today ? (userProfile.dailyReviewCount || 0) : 0;
  const profiles = await base44.entities.UserProfile.list();
  if (!profiles[0]) return;
  await base44.entities.UserProfile.update(profiles[0].id, {
    dailyReviewCount: currentCount + 1,
    lastReviewDate: today,
  });
}