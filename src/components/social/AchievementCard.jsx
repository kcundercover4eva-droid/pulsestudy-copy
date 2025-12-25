import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share2, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const rarityConfig = {
  common: { bg: 'from-slate-600 to-slate-800', text: 'Common', glow: 'shadow-slate-500/50' },
  rare: { bg: 'from-blue-600 to-blue-800', text: 'Rare', glow: 'shadow-blue-500/50' },
  epic: { bg: 'from-purple-600 to-purple-800', text: 'Epic', glow: 'shadow-purple-500/50' },
  legendary: { bg: 'from-yellow-500 to-orange-600', text: 'Legendary', glow: 'shadow-yellow-500/50' },
};

const reactionEmojis = {
  like: '❤️',
  fire: '🔥',
  clap: '👏',
  star: '⭐',
  rocket: '🚀',
};

export default function AchievementCard({ achievement, onComment, showActions = true }) {
  const queryClient = useQueryClient();
  const [showReactions, setShowReactions] = useState(false);

  const config = rarityConfig[achievement.rarity] || rarityConfig.common;

  // Check if user has reacted
  const { data: userReaction } = useQuery({
    queryKey: ['userReaction', achievement.id],
    queryFn: async () => {
      const user = await base44.auth.me();
      const reactions = await base44.entities.Reaction.filter({
        targetType: 'achievement',
        targetId: achievement.id,
        created_by: user.email,
      });
      return reactions[0];
    },
    enabled: showActions,
  });

  // Add reaction
  const reactMutation = useMutation({
    mutationFn: async (reactionType) => {
      if (userReaction) {
        await base44.entities.Reaction.delete(userReaction.id);
        if (userReaction.reactionType === reactionType) return null;
      }
      return base44.entities.Reaction.create({
        targetType: 'achievement',
        targetId: achievement.id,
        reactionType,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userReaction', achievement.id]);
      queryClient.invalidateQueries(['achievements']);
    },
  });

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/profile?achievement=${achievement.id}`;
    if (navigator.share) {
      await navigator.share({
        title: achievement.title,
        text: achievement.description,
        url: shareUrl,
      });
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className={`bg-gradient-to-br ${config.bg} border-2 border-white/20 ${config.glow} shadow-xl overflow-hidden`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-5xl">{achievement.emoji}</div>
              <div>
                <h3 className="text-xl font-bold text-white">{achievement.title}</h3>
                <Badge className="bg-white/20 text-white mt-1">
                  <Sparkles className="w-3 h-3 mr-1" />
                  {config.text}
                </Badge>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-white/80 mb-4">{achievement.description}</p>

          {/* Metadata */}
          {achievement.metadata && Object.keys(achievement.metadata).length > 0 && (
            <div className="bg-white/10 rounded-lg p-3 mb-4 text-sm text-white/70">
              {achievement.metadata.value && <div>Value: {achievement.metadata.value}</div>}
              {achievement.metadata.date && <div>Earned: {new Date(achievement.metadata.date).toLocaleDateString()}</div>}
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <div className="flex items-center gap-4 pt-4 border-t border-white/20">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10"
                  onClick={() => setShowReactions(!showReactions)}
                >
                  {userReaction ? reactionEmojis[userReaction.reactionType] : <Heart className="w-5 h-5" />}
                  <span className="ml-2">{achievement.likeCount || 0}</span>
                </Button>
                
                {showReactions && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-full left-0 mb-2 bg-slate-800 rounded-lg p-2 flex gap-2 shadow-xl border border-slate-700"
                  >
                    {Object.entries(reactionEmojis).map(([type, emoji]) => (
                      <button
                        key={type}
                        onClick={() => {
                          reactMutation.mutate(type);
                          setShowReactions(false);
                        }}
                        className="text-2xl hover:scale-125 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
                onClick={onComment}
              >
                <MessageCircle className="w-5 h-5" />
                <span className="ml-2">{achievement.commentCount || 0}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10 ml-auto"
                onClick={handleShare}
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}