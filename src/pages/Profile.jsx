import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { User, Trophy, Zap, Flame, Target, Edit, Share2 } from 'lucide-react';
import AchievementCard from '../components/social/AchievementCard';
import CommentSection from '../components/social/CommentSection';
import { toast } from 'sonner';

export default function Profile() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [editedProfile, setEditedProfile] = useState({});

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Fetch public profile
  const { data: publicProfile } = useQuery({
    queryKey: ['publicProfile'],
    queryFn: async () => {
      const profiles = await base44.entities.PublicProfile.filter({ userId: currentUser.id });
      return profiles[0];
    },
    enabled: !!currentUser,
  });

  // Fetch user stats
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ created_by: currentUser.email });
      return profiles[0];
    },
    enabled: !!currentUser,
  });

  // Fetch achievements
  const { data: achievements = [] } = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      return base44.entities.Achievement.filter({ created_by: currentUser.email }, '-created_date');
    },
    enabled: !!currentUser,
  });

  // Create/Update public profile
  const saveProfileMutation = useMutation({
    mutationFn: async (data) => {
      if (publicProfile) {
        return base44.entities.PublicProfile.update(publicProfile.id, data);
      } else {
        return base44.entities.PublicProfile.create({
          userId: currentUser.id,
          ...data,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['publicProfile']);
      setIsEditing(false);
      toast.success('Profile updated!');
    },
  });

  const handleSaveProfile = () => {
    saveProfileMutation.mutate(editedProfile);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/profile?user=${currentUser.id}`;
    if (navigator.share) {
      await navigator.share({
        title: `${publicProfile?.displayName || currentUser.full_name}'s Profile`,
        url: shareUrl,
      });
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Profile link copied!');
    }
  };

  const stats = [
    { icon: Zap, label: 'Total XP', value: userProfile?.totalPoints || 0, color: 'text-yellow-400' },
    { icon: Flame, label: 'Current Streak', value: userProfile?.currentStreak || 0, color: 'text-orange-400' },
    { icon: Trophy, label: 'Achievements', value: achievements.length, color: 'text-purple-400' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {publicProfile?.displayName || currentUser?.full_name || 'User'}
                </h1>
                {publicProfile?.bio && (
                  <p className="text-slate-300 max-w-md">{publicProfile.bio}</p>
                )}
                {publicProfile?.badges && publicProfile.badges.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {publicProfile.badges.map((badge, i) => (
                      <Badge key={i} className="bg-purple-600 text-white">{badge}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="border-slate-700"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="border-slate-700"
                onClick={() => {
                  setEditedProfile(publicProfile || { displayName: currentUser.full_name });
                  setIsEditing(true);
                }}
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="bg-slate-800/50 rounded-lg p-4 text-center">
                <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Achievements */}
        <Tabs defaultValue="achievements" className="space-y-6">
          <TabsList className="grid grid-cols-2 w-full bg-slate-800 border border-slate-700">
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="achievements" className="space-y-4">
            {achievements.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {achievements.map((achievement) => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    onComment={() => setSelectedAchievement(achievement)}
                  />
                ))}
              </div>
            ) : (
              <Card className="bg-slate-800/50 border-slate-700 p-12 text-center">
                <Trophy className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Achievements Yet</h3>
                <p className="text-white/60">Complete quests and challenges to earn achievements!</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="activity">
            <Card className="bg-slate-800/50 border-slate-700 p-8 text-center">
              <p className="text-white/60">Activity feed coming soon!</p>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Profile Dialog */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-300 mb-2 block">Display Name</label>
                <Input
                  value={editedProfile.displayName || ''}
                  onChange={(e) => setEditedProfile({ ...editedProfile, displayName: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-2 block">Bio</label>
                <Textarea
                  value={editedProfile.bio || ''}
                  onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button onClick={handleSaveProfile} className="bg-purple-600 hover:bg-purple-700">
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Comments Dialog */}
        <Dialog open={!!selectedAchievement} onOpenChange={() => setSelectedAchievement(null)}>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Comments</DialogTitle>
            </DialogHeader>
            {selectedAchievement && (
              <>
                <AchievementCard achievement={selectedAchievement} showActions={false} />
                <CommentSection targetType="achievement" targetId={selectedAchievement.id} />
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}