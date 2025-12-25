import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, Zap, Coins, Sparkles, Target } from 'lucide-react';
import { soundManager } from '../utils/soundManager';
import { haptics } from '../utils/haptics';

const categoryIcons = {
  study: '📚',
  streak: '🔥',
  achievement: '🏆',
  variety: '🎯',
};

const typeConfig = {
  daily: { label: 'Daily', color: 'bg-blue-500', border: 'border-blue-400' },
  weekly: { label: 'Weekly', color: 'bg-purple-500', border: 'border-purple-400' },
  special: { label: 'Special', color: 'bg-pink-500', border: 'border-pink-400' },
};

export default function QuestCard({ quest, onClaim }) {
  const config = typeConfig[quest.type] || typeConfig.daily;
  const progress = Math.min((quest.currentProgress / quest.targetValue) * 100, 100);
  const isComplete = quest.isCompleted || progress >= 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className={`bg-gradient-to-br from-slate-800 to-slate-900 border-2 ${isComplete ? 'border-green-500' : config.border} overflow-hidden relative`}>
        {/* Completion overlay */}
        {isComplete && !quest.isClaimed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-green-500/10 backdrop-blur-sm z-10 flex items-center justify-center"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <CheckCircle2 className="w-16 h-16 text-green-400" />
            </motion.div>
          </motion.div>
        )}

        {/* Header */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="text-2xl">{categoryIcons[quest.category]}</div>
              <div>
                <h3 className="text-lg font-bold text-white">{quest.title}</h3>
                <p className="text-sm text-slate-400">{quest.description}</p>
              </div>
            </div>
            <Badge className={`${config.color} text-white`}>
              {config.label}
            </Badge>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-slate-300 mb-2">
              <span>Progress</span>
              <span className="font-bold">{quest.currentProgress} / {quest.targetValue}</span>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className={`h-full ${isComplete ? 'bg-green-500' : 'bg-gradient-to-r from-cyan-500 to-purple-500'}`}
              />
            </div>
          </div>

          {/* Rewards */}
          <div className="flex items-center gap-4 flex-wrap mb-3">
            {quest.rewards.xp && (
              <div className="flex items-center gap-1 text-yellow-400">
                <Zap className="w-4 h-4" />
                <span className="text-sm font-bold">+{quest.rewards.xp} XP</span>
              </div>
            )}
            {quest.rewards.currency && (
              <div className="flex items-center gap-1 text-blue-400">
                <Coins className="w-4 h-4" />
                <span className="text-sm font-bold">+{quest.rewards.currency}</span>
              </div>
            )}
            {quest.rewards.evolutionPoints && (
              <div className="flex items-center gap-1 text-purple-400">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-bold">+{quest.rewards.evolutionPoints} Evo</span>
              </div>
            )}
          </div>

          {/* Expiry */}
          {quest.expiresAt && (
            <div className="flex items-center gap-1 text-xs text-slate-400 mb-3">
              <Clock className="w-3 h-3" />
              Expires: {new Date(quest.expiresAt).toLocaleDateString()}
            </div>
          )}

          {/* Action */}
          {isComplete && !quest.isClaimed && (
            <Button
              onClick={() => {
                soundManager.play('questComplete');
                haptics.success();
                onClaim(quest);
              }}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold"
            >
              🎁 Claim Rewards
            </Button>
          )}

          {quest.isClaimed && (
            <div className="text-center text-sm text-green-400 font-bold">
              ✓ Rewards Claimed
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}