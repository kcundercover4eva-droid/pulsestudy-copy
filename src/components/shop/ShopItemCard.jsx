import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, Lock, Clock, Sparkles, Check } from 'lucide-react';
import { soundManager } from '../../utils/soundManager';
import { haptics } from '../../utils/haptics';

const rarityConfig = {
  common: { bg: 'from-slate-600 to-slate-800', border: 'border-slate-500', glow: 'shadow-slate-500/30' },
  rare: { bg: 'from-blue-600 to-blue-800', border: 'border-blue-500', glow: 'shadow-blue-500/50' },
  epic: { bg: 'from-purple-600 to-purple-800', border: 'border-purple-500', glow: 'shadow-purple-500/50' },
  legendary: { bg: 'from-yellow-500 to-orange-600', border: 'border-yellow-500', glow: 'shadow-yellow-500/70' },
  mythic: { bg: 'from-pink-500 to-red-600', border: 'border-pink-500', glow: 'shadow-pink-500/80' },
};

export default function ShopItemCard({ item, userCurrency, userLevel, isOwned, onPurchase, isPurchasing }) {
  const config = rarityConfig[item.rarity] || rarityConfig.common;
  const canAfford = userCurrency >= item.price;
  const meetsLevel = userLevel >= (item.requiredLevel || 1);
  const canPurchase = canAfford && meetsLevel && !isOwned && item.isActive;
  
  const isExpiringSoon = item.isLimited && item.availableUntil && 
    new Date(item.availableUntil).getTime() - Date.now() < 24 * 60 * 60 * 1000;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: canPurchase ? 1.05 : 1 }}
    >
      <Card className={`bg-gradient-to-br ${config.bg} border-2 ${config.border} ${config.glow} shadow-xl overflow-hidden relative`}>
        {/* Limited Badge */}
        {item.isLimited && (
          <div className="absolute top-2 right-2 z-10">
            <Badge className="bg-red-500 text-white animate-pulse">
              <Clock className="w-3 h-3 mr-1" />
              Limited
            </Badge>
          </div>
        )}

        {/* Owned Badge */}
        {isOwned && (
          <div className="absolute top-2 left-2 z-10">
            <Badge className="bg-green-500 text-white">
              <Check className="w-3 h-3 mr-1" />
              Owned
            </Badge>
          </div>
        )}

        <div className="p-6">
          {/* Item Visual */}
          <div className="text-center mb-4">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl mb-3"
            >
              {item.emoji}
            </motion.div>
            <h3 className="text-xl font-bold text-white mb-1">{item.name}</h3>
            <Badge className="bg-white/20 text-white">
              <Sparkles className="w-3 h-3 mr-1" />
              {item.rarity.toUpperCase()}
            </Badge>
          </div>

          {/* Description */}
          <p className="text-white/80 text-sm text-center mb-4 min-h-[40px]">
            {item.description}
          </p>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-center mb-4">
              {item.tags.map((tag, i) => (
                <Badge key={i} variant="outline" className="text-xs border-white/30 text-white/70">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Price & Requirements */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-center gap-2 text-yellow-400">
              <Coins className="w-5 h-5" />
              <span className="text-2xl font-bold">{item.price}</span>
            </div>
            
            {item.requiredLevel > 1 && (
              <div className="text-center text-xs text-white/60">
                Level {item.requiredLevel} required
              </div>
            )}

            {item.isLimited && item.availableUntil && (
              <div className={`text-center text-xs ${isExpiringSoon ? 'text-red-400' : 'text-white/60'}`}>
                <Clock className="w-3 h-3 inline mr-1" />
                Until {new Date(item.availableUntil).toLocaleDateString()}
              </div>
            )}

            {item.stock !== undefined && (
              <div className="text-center text-xs text-white/60">
                {item.stock > 0 ? `${item.stock} left` : 'Sold out'}
              </div>
            )}
          </div>

          {/* Purchase Button */}
          {isOwned ? (
            <Button disabled className="w-full bg-green-600">
              <Check className="w-4 h-4 mr-2" />
              Owned
            </Button>
          ) : !meetsLevel ? (
            <Button disabled className="w-full">
              <Lock className="w-4 h-4 mr-2" />
              Level {item.requiredLevel} Required
            </Button>
          ) : !canAfford ? (
            <Button disabled className="w-full">
              <Coins className="w-4 h-4 mr-2" />
              Not Enough Currency
            </Button>
          ) : item.stock === 0 ? (
            <Button disabled className="w-full">
              Sold Out
            </Button>
          ) : (
            <Button
              onClick={() => {
                soundManager.play('purchase');
                haptics.medium();
                onPurchase(item);
              }}
              disabled={isPurchasing}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold"
            >
              <Coins className="w-4 h-4 mr-2" />
              Purchase
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}