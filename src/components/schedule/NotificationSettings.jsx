import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, Mail, Smartphone, Plus, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function NotificationSettings() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const { data: preferences } = useQuery({
    queryKey: ['notificationPreferences'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const prefs = await base44.entities.NotificationPreference.filter({ created_by: user.email });
      return prefs[0] || null;
    },
  });

  const createPrefMutation = useMutation({
    mutationFn: (data) => base44.entities.NotificationPreference.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['notificationPreferences']);
      toast.success('Notification settings saved');
    },
  });

  const updatePrefMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.NotificationPreference.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['notificationPreferences']);
      toast.success('Notification settings updated');
    },
  });

  const [localPrefs, setLocalPrefs] = useState({
    enabled: true,
    emailNotifications: false,
    inAppNotifications: true,
    reminderMinutes: [15],
    notifyForTypes: ['school', 'study', 'extracurricular']
  });

  React.useEffect(() => {
    if (preferences) {
      setLocalPrefs(preferences);
    }
  }, [preferences]);

  const handleSave = () => {
    if (preferences?.id) {
      updatePrefMutation.mutate({ id: preferences.id, data: localPrefs });
    } else {
      createPrefMutation.mutate(localPrefs);
    }
    setIsOpen(false);
  };

  const addReminderTime = () => {
    const newTime = prompt('Enter minutes before event (e.g., 30 for 30 minutes before):');
    if (newTime && !isNaN(newTime)) {
      const minutes = parseInt(newTime);
      if (minutes > 0 && !localPrefs.reminderMinutes.includes(minutes)) {
        setLocalPrefs({ ...localPrefs, reminderMinutes: [...localPrefs.reminderMinutes, minutes].sort((a, b) => a - b) });
      }
    }
  };

  const removeReminderTime = (time) => {
    setLocalPrefs({ ...localPrefs, reminderMinutes: localPrefs.reminderMinutes.filter(t => t !== time) });
  };

  const toggleBlockType = (type) => {
    const types = localPrefs.notifyForTypes.includes(type)
      ? localPrefs.notifyForTypes.filter(t => t !== type)
      : [...localPrefs.notifyForTypes, type];
    setLocalPrefs({ ...localPrefs, notifyForTypes: types });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-transparent border-white/10 hover:bg-white/5 text-white/60 hover:text-white">
          <Bell className="w-4 h-4 mr-2" />
          Notifications
        </Button>
      </DialogTrigger>
      <DialogContent className="glass bg-slate-900/90 text-white border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle>Notification Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Master Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-400" />
              <Label className="text-white">Enable Notifications</Label>
            </div>
            <Switch
              checked={localPrefs.enabled}
              onCheckedChange={(checked) => setLocalPrefs({ ...localPrefs, enabled: checked })}
            />
          </div>

          {localPrefs.enabled && (
            <>
              {/* Notification Types */}
              <div className="space-y-3">
                <Label className="text-white/80 text-sm">Notification Methods</Label>
                
                <div className="flex items-center justify-between pl-2">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-green-400" />
                    <span className="text-sm">In-App Notifications</span>
                  </div>
                  <Switch
                    checked={localPrefs.inAppNotifications}
                    onCheckedChange={(checked) => setLocalPrefs({ ...localPrefs, inAppNotifications: checked })}
                  />
                </div>

                <div className="flex items-center justify-between pl-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-purple-400" />
                    <span className="text-sm">Email Notifications</span>
                  </div>
                  <Switch
                    checked={localPrefs.emailNotifications}
                    onCheckedChange={(checked) => setLocalPrefs({ ...localPrefs, emailNotifications: checked })}
                  />
                </div>
              </div>

              {/* Reminder Times */}
              <div className="space-y-3">
                <Label className="text-white/80 text-sm">Reminder Times</Label>
                <div className="flex flex-wrap gap-2">
                  {localPrefs.reminderMinutes.map(time => (
                    <div key={time} className="flex items-center gap-1 bg-cyan-500/20 border border-cyan-500/30 rounded-lg px-3 py-1">
                      <span className="text-sm text-cyan-400">{time} min before</span>
                      <button
                        onClick={() => removeReminderTime(time)}
                        className="hover:text-red-400 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addReminderTime}
                    className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1 hover:bg-white/10 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span className="text-sm">Add</span>
                  </button>
                </div>
              </div>

              {/* Block Types */}
              <div className="space-y-3">
                <Label className="text-white/80 text-sm">Notify For</Label>
                <div className="flex flex-wrap gap-2">
                  {['school', 'study', 'extracurricular', 'other'].map(type => (
                    <button
                      key={type}
                      onClick={() => toggleBlockType(type)}
                      className={`px-3 py-1 rounded-lg text-sm transition-all ${
                        localPrefs.notifyForTypes.includes(type)
                          ? 'bg-cyan-500/30 border-2 border-cyan-500 text-cyan-400'
                          : 'bg-white/5 border border-white/10 text-white/60'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <Button
            onClick={handleSave}
            disabled={createPrefMutation.isPending || updatePrefMutation.isPending}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold"
          >
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}