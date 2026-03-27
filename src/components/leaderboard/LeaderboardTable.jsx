import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';

const rankColors = {
  1: 'from-yellow-400 to-yellow-600',
  2: 'from-slate-300 to-slate-500',
  3: 'from-amber-600 to-amber-800',
};

const rankIcons = {
  1: '👑',
  2: '🥈',
  3: '🥉',
};

export default function LeaderboardTable({ entries, currentUserId }) {
  return (
    <div className="space-y-3">
      {entries.map((entry, index) => {
        const isCurrentUser = entry.userId === currentUserId;
        const rank = entry.rank || index + 1;
        const rankChange = entry.lastRank ? entry.lastRank - rank : 0;

        return (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={`p-4 ${isCurrentUser ? 'bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-purple-500' : 'bg-slate-800/50 border-slate-700'}`}>
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className={`flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center ${rank <= 3 ? `bg-gradient-to-br ${rankColors[rank]}` : 'bg-slate-700'}`}>
                  {rank <= 3 ? (
                    <div className="text-3xl">{rankIcons[rank]}</div>
                  ) : (
                    <div className="text-2xl font-bold text-white">#{rank}</div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-white">
                      {entry.username || 'Anonymous'}
                    </h3>
                    {isCurrentUser && (
                      <Badge className="bg-purple-500 text-white">You</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-cyan-400 text-sm">
                    <Clock className="w-4 h-4" />
                    <span className="font-bold">{(entry.studyMinutes || 0).toLocaleString()} min studied</span>
                  </div>
                </div>

                {/* Rank Change */}
                <div className="flex-shrink-0">
                  {rankChange > 0 ? (
                    <div className="flex items-center gap-1 text-green-400">
                      <TrendingUp className="w-5 h-5" />
                      <span className="font-bold">+{rankChange}</span>
                    </div>
                  ) : rankChange < 0 ? (
                    <div className="flex items-center gap-1 text-red-400">
                      <TrendingDown className="w-5 h-5" />
                      <span className="font-bold">{rankChange}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-slate-400">
                      <Minus className="w-5 h-5" />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}