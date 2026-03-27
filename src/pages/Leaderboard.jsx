import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Trophy, Crown } from 'lucide-react';
import LeaderboardTable from '../components/leaderboard/LeaderboardTable';

export default function Leaderboard() {
  const [period, setPeriod] = useState('weekly');

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['leaderboard', period],
    queryFn: async () => {
      const allEntries = await base44.entities.LeaderboardEntry.filter(
        { period, season: 'current' },
        '-studyMinutes',
        50
      );
      return allEntries.map((entry, index) => ({ ...entry, rank: index + 1 }));
    },
  });

  const currentUserEntry = entries.find(e => e.userId === currentUser?.id);
  const currentUserRank = currentUserEntry?.rank || '-';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Trophy className="w-10 h-10 text-yellow-400" />
            <h1 className="text-4xl font-bold text-white">Study Leaderboard</h1>
          </div>
          <p className="text-white/60">See who's been the most productive</p>
        </div>

        {/* Your Rank Card */}
        {currentUserEntry && (
          <Card className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-purple-500 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white/60 mb-1">Your Current Rank</div>
                <div className="text-4xl font-bold text-white flex items-center gap-2">
                  {currentUserRank <= 3 && <Crown className="w-8 h-8 text-yellow-400" />}
                  #{currentUserRank}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-white/60 mb-1">Study Minutes</div>
                <div className="text-3xl font-bold text-yellow-400">
                  {(currentUserEntry.studyMinutes || 0).toLocaleString()} min
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={period} onValueChange={setPeriod} className="space-y-6">
          <TabsList className="grid grid-cols-2 w-full max-w-md bg-slate-800 border border-slate-700">
            <TabsTrigger value="weekly">This Week</TabsTrigger>
            <TabsTrigger value="alltime">All Time</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly">
            {isLoading ? (
              <Card className="bg-slate-800/50 border-slate-700 p-12 text-center">
                <div className="text-white/60">Loading leaderboard...</div>
              </Card>
            ) : entries.length > 0 ? (
              <LeaderboardTable entries={entries} currentUserId={currentUser?.id} />
            ) : (
              <Card className="bg-slate-800/50 border-slate-700 p-12 text-center">
                <Trophy className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Rankings Yet</h3>
                <p className="text-white/60">Start studying to appear on the leaderboard!</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="alltime">
            {isLoading ? (
              <Card className="bg-slate-800/50 border-slate-700 p-12 text-center">
                <div className="text-white/60">Loading leaderboard...</div>
              </Card>
            ) : entries.length > 0 ? (
              <LeaderboardTable entries={entries} currentUserId={currentUser?.id} />
            ) : (
              <Card className="bg-slate-800/50 border-slate-700 p-12 text-center">
                <Trophy className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Rankings Yet</h3>
                <p className="text-white/60">Start studying to appear on the leaderboard!</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}