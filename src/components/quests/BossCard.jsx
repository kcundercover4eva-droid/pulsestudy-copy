import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Swords, Trophy, Clock, Target } from 'lucide-react';

const difficultyConfig = {
  normal: { label: 'Normal', color: 'bg-green-500', glow: 'from-green-400 to-emerald-500' },
  hard: { label: 'Hard', color: 'bg-orange-500', glow: 'from-orange-400 to-red-500' },
  nightmare: { label: 'Nightmare', color: 'bg-red-500', glow: 'from-red-500 to-pink-600' },
  impossible: { label: 'Impossible', color: 'bg-purple-500', glow: 'from-purple-500 to-pink-600' },
};

export default function BossCard({ boss, onChallenge }) {
  const config = difficultyConfig[boss.difficulty] || difficultyConfig.normal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-red-500 overflow-hidden relative">
        {/* Glow effect */}
        <motion.div
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`absolute inset-0 bg-gradient-to-br ${config.glow} blur-2xl`}
        />

        {/* Content */}
        <div className="relative z-10 p-6">
          {/* Boss Visual */}
          <div className="text-center mb-4">
            <motion.div
              animate={{ 
                y: [0, -10, 0],
                rotate: [-2, 2, -2],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-8xl mb-2"
            >
              {boss.emoji}
            </motion.div>
            <h2 className="text-3xl font-black text-white mb-1">{boss.name}</h2>
            <Badge className={`${config.color} text-white`}>
              {config.label}
            </Badge>
          </div>

          {/* Description */}
          <p className="text-slate-300 text-center text-sm mb-4">
            {boss.description}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <Target className="w-5 h-5 text-red-400 mx-auto mb-1" />
              <div className="text-2xl font-bold text-white">{boss.challenges?.length || 0}</div>
              <div className="text-xs text-slate-400">Challenges</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <Swords className="w-5 h-5 text-orange-400 mx-auto mb-1" />
              <div className="text-2xl font-bold text-white">{boss.attempts || 0}</div>
              <div className="text-xs text-slate-400">Attempts</div>
            </div>
          </div>

          {/* Rewards Preview */}
          <div className="bg-slate-800/50 rounded-lg p-3 mb-4">
            <div className="text-xs text-slate-400 mb-2 text-center">Victory Rewards</div>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {boss.rewards?.xp && (
                <div className="text-yellow-400 font-bold">+{boss.rewards.xp} XP</div>
              )}
              {boss.rewards?.currency && (
                <div className="text-blue-400 font-bold">+{boss.rewards.currency} 💎</div>
              )}
              {boss.rewards?.title && (
                <div className="text-purple-400 font-bold text-xs">"{boss.rewards.title}"</div>
              )}
            </div>
          </div>

          {/* Status */}
          {boss.isDefeated ? (
            <div className="text-center">
              <div className="text-green-400 font-bold mb-2 flex items-center justify-center gap-2">
                <Trophy className="w-5 h-5" />
                DEFEATED
              </div>
              {boss.bestTime && (
                <div className="text-xs text-slate-400">
                  Best Time: {Math.floor(boss.bestTime / 60)}:{(boss.bestTime % 60).toString().padStart(2, '0')}
                </div>
              )}
            </div>
          ) : (
            <Button
              onClick={() => onChallenge(boss)}
              className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold text-lg py-6"
            >
              <Swords className="w-5 h-5 mr-2" />
              Challenge Boss
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}