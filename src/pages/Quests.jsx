import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Swords, Trophy, Plus } from 'lucide-react';
import QuestCard from '../components/quests/QuestCard';
import BossCard from '../components/quests/BossCard';
import { useRewards } from '../components/rewards/RewardsProvider';
import { toast } from 'sonner';

export default function Quests() {
  const queryClient = useQueryClient();
  const { userProfile, awardEvolutionPoints, triggerBossMilestone } = useRewards();

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UserProfile.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['userProfile']),
  });

  // Fetch quests
  const { data: quests = [] } = useQuery({
    queryKey: ['quests'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Quest.filter({ created_by: user.email }, '-created_date');
    },
  });

  // Fetch bosses
  const { data: bosses = [] } = useQuery({
    queryKey: ['bosses'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.BossChallenge.filter({ created_by: user.email });
    },
  });

  // Update quest mutation
  const updateQuestMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Quest.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['quests']),
  });

  // Update boss mutation
  const updateBossMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BossChallenge.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['bosses']),
  });

  // Claim quest rewards
  const handleClaimQuest = async (quest) => {
    if (!userProfile) return;

    // Award rewards
    const updates = {
      totalPoints: (userProfile.totalPoints || 0) + (quest.rewards.xp || 0),
      currency: (userProfile.currency || 0) + (quest.rewards.currency || 0),
    };

    await updateProfileMutation.mutateAsync({
      id: userProfile.id,
      data: updates,
    });

    // Award evolution points
    if (quest.rewards.evolutionPoints) {
      await awardEvolutionPoints(quest.rewards.evolutionPoints);
    }

    // Mark as claimed
    await updateQuestMutation.mutateAsync({
      id: quest.id,
      data: { isClaimed: true },
    });

    toast.success('Quest rewards claimed! 🎁');
  };

  // Challenge boss
  const handleChallengeBoss = async (boss) => {
    // Simulate boss battle
    const success = Math.random() > 0.4; // 60% win rate
    const timeSpent = Math.floor(Math.random() * 120) + 60;

    await updateBossMutation.mutateAsync({
      id: boss.id,
      data: {
        attempts: (boss.attempts || 0) + 1,
        isDefeated: success,
        bestTime: success ? timeSpent : boss.bestTime,
      },
    });

    if (success) {
      // Trigger milestone reward
      await triggerBossMilestone({
        name: boss.name,
        attempts: (boss.attempts || 0) + 1,
        timeSpent,
      });

      toast.success(`${boss.name} defeated! 🏆`);
    } else {
      toast.error(`Defeated by ${boss.name}. Try again! ⚔️`);
    }
  };

  const dailyQuests = quests.filter(q => q.type === 'daily');
  const weeklyQuests = quests.filter(q => q.type === 'weekly');
  const activeQuests = quests.filter(q => !q.isClaimed);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Quests & Challenges</h1>
          <p className="text-white/60">Complete missions and defeat bosses for epic rewards</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="bg-white/10 border-white/20 p-4 text-center">
            <Target className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{activeQuests.length}</div>
            <div className="text-xs text-white/60">Active Quests</div>
          </Card>
          <Card className="bg-white/10 border-white/20 p-4 text-center">
            <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{quests.filter(q => q.isClaimed).length}</div>
            <div className="text-xs text-white/60">Completed</div>
          </Card>
          <Card className="bg-white/10 border-white/20 p-4 text-center">
            <Swords className="w-6 h-6 text-red-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{bosses.filter(b => b.isDefeated).length}</div>
            <div className="text-xs text-white/60">Bosses Defeated</div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="daily" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full bg-slate-800 border border-slate-700">
            <TabsTrigger value="daily">Daily Quests</TabsTrigger>
            <TabsTrigger value="weekly">Weekly Missions</TabsTrigger>
            <TabsTrigger value="bosses">Boss Battles</TabsTrigger>
          </TabsList>

          {/* Daily Quests */}
          <TabsContent value="daily" className="space-y-4">
            {dailyQuests.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {dailyQuests.map(quest => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    onClaim={handleClaimQuest}
                  />
                ))}
              </div>
            ) : (
              <Card className="bg-white/10 border-white/20 p-12 text-center">
                <Target className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Daily Quests</h3>
                <p className="text-white/60">Check back tomorrow for new challenges!</p>
              </Card>
            )}
          </TabsContent>

          {/* Weekly Missions */}
          <TabsContent value="weekly" className="space-y-4">
            {weeklyQuests.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {weeklyQuests.map(quest => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    onClaim={handleClaimQuest}
                  />
                ))}
              </div>
            ) : (
              <Card className="bg-white/10 border-white/20 p-12 text-center">
                <Trophy className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Weekly Missions</h3>
                <p className="text-white/60">New missions coming soon!</p>
              </Card>
            )}
          </TabsContent>

          {/* Boss Battles */}
          <TabsContent value="bosses" className="space-y-4">
            {bosses.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {bosses.map(boss => (
                  <BossCard
                    key={boss.id}
                    boss={boss}
                    onChallenge={handleChallengeBoss}
                  />
                ))}
              </div>
            ) : (
              <Card className="bg-white/10 border-white/20 p-12 text-center">
                <Swords className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Boss Challenges</h3>
                <p className="text-white/60">Epic battles coming soon!</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}