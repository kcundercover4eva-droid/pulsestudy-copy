import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Store, Coins, Sparkles, Search, TrendingUp } from 'lucide-react';
import ShopItemCard from '../components/shop/ShopItemCard';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { soundManager } from '../utils/soundManager';

export default function Shop() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch user profile
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
      return profiles[0];
    },
  });

  // Fetch avatar data for level
  const { data: avatarData } = useQuery({
    queryKey: ['avatarData'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const avatars = await base44.entities.AvatarData.filter({ created_by: user.email });
      return avatars[0];
    },
  });

  // Fetch shop items
  const { data: shopItems = [] } = useQuery({
    queryKey: ['shopItems'],
    queryFn: () => base44.entities.CosmeticItem.filter({ isActive: true }, '-created_date'),
  });

  // Fetch user inventory
  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.UserInventory.filter({ created_by: user.email });
    },
  });

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: async (item) => {
      if (!userProfile) throw new Error('Profile not found');
      
      // Check if user can afford
      if (userProfile.currency < item.price) {
        throw new Error('Not enough currency');
      }

      // Deduct currency
      await base44.entities.UserProfile.update(userProfile.id, {
        currency: userProfile.currency - item.price,
      });

      // Add to inventory
      await base44.entities.UserInventory.create({
        itemId: item.id,
        itemName: item.name,
        itemCategory: item.category,
        itemRarity: item.rarity,
        purchaseDate: new Date().toISOString(),
      });

      // Update stock if limited
      if (item.stock !== undefined && item.stock > 0) {
        await base44.entities.CosmeticItem.update(item.id, {
          stock: item.stock - 1,
        });
      }

      return item;
    },
    onSuccess: (item) => {
      queryClient.invalidateQueries(['userProfile']);
      queryClient.invalidateQueries(['inventory']);
      queryClient.invalidateQueries(['shopItems']);
      
      soundManager.play('purchase');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#fbbf24', '#f59e0b', '#8b5cf6'],
      });
      
      toast.success(`${item.name} purchased! 🎉`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const categories = [
    { value: 'all', label: 'All Items', icon: Store },
    { value: 'skin', label: 'Skins', icon: Sparkles },
    { value: 'accessory', label: 'Accessories', icon: Sparkles },
    { value: 'aura', label: 'Auras', icon: Sparkles },
    { value: 'background', label: 'Backgrounds', icon: Sparkles },
  ];

  const filteredItems = shopItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const limitedItems = filteredItems.filter(item => item.isLimited);
  const featuredItems = filteredItems.filter(item => item.rarity === 'legendary' || item.rarity === 'mythic');
  const ownedItemIds = new Set(inventory.map(i => i.itemId));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Store className="w-10 h-10 text-purple-400" />
            Cosmetic Shop
          </h1>
          <p className="text-white/60">Customize your avatar with exclusive items</p>
        </div>

        {/* Currency Display */}
        <Card className="bg-gradient-to-r from-yellow-600 to-orange-600 border-yellow-500 p-6 mb-8 text-center">
          <div className="flex items-center justify-center gap-3">
            <Coins className="w-8 h-8 text-white" />
            <div>
              <div className="text-sm text-white/80">Your Balance</div>
              <div className="text-4xl font-bold text-white">{userProfile?.currency || 0}</div>
            </div>
          </div>
        </Card>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full bg-slate-800 border border-slate-700">
            {categories.map(cat => (
              <TabsTrigger key={cat.value} value={cat.value}>
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Limited Time Items */}
          {limitedItems.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-red-400" />
                <h2 className="text-2xl font-bold text-white">Limited Time Only!</h2>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {limitedItems.map(item => (
                  <ShopItemCard
                    key={item.id}
                    item={item}
                    userCurrency={userProfile?.currency || 0}
                    userLevel={avatarData?.stage || 1}
                    isOwned={ownedItemIds.has(item.id)}
                    onPurchase={(item) => purchaseMutation.mutate(item)}
                    isPurchasing={purchaseMutation.isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Items */}
          <TabsContent value={selectedCategory} className="space-y-6">
            {filteredItems.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredItems.map(item => (
                  <ShopItemCard
                    key={item.id}
                    item={item}
                    userCurrency={userProfile?.currency || 0}
                    userLevel={avatarData?.stage || 1}
                    isOwned={ownedItemIds.has(item.id)}
                    onPurchase={(item) => purchaseMutation.mutate(item)}
                    isPurchasing={purchaseMutation.isPending}
                  />
                ))}
              </div>
            ) : (
              <Card className="bg-slate-800/50 border-slate-700 p-12 text-center">
                <Store className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Items Found</h3>
                <p className="text-white/60">Try a different category or search term</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}