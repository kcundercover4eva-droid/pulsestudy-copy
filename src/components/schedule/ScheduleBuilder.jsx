import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Plus, Moon, BookOpen, Coffee, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function ScheduleBuilder() {
  const [blocks, setBlocks] = useState([
    { day: 0, start: 9, end: 15, type: 'school' },
    { day: 1, start: 9, end: 15, type: 'school' },
    { day: 2, start: 9, end: 15, type: 'school' },
    { day: 3, start: 9, end: 15, type: 'school' },
    { day: 4, start: 9, end: 15, type: 'school' },
    { day: 0, start: 22, end: 24, type: 'sleep' }, // Simplification
  ]);

  const [newBlock, setNewBlock] = useState({ day: 0, start: 16, duration: 1, type: 'study' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const addBlock = () => {
    setBlocks([...blocks, { 
      day: parseInt(newBlock.day), 
      start: parseInt(newBlock.start), 
      end: parseInt(newBlock.start) + parseInt(newBlock.duration), 
      type: newBlock.type 
    }]);
    setIsDialogOpen(false);
  };

  const getBlockStyle = (type) => {
    switch (type) {
      case 'school': return 'bg-blue-500/20 border-blue-500/50 text-blue-300';
      case 'sleep': return 'bg-purple-900/40 border-purple-500/30 text-purple-300';
      case 'study': return 'bg-green-500/20 border-green-500/50 text-green-300';
      case 'extracurricular': return 'bg-orange-500/20 border-orange-500/50 text-orange-300';
      default: return 'bg-white/10';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Weekly Schedule</h2>
          <p className="text-white/40 text-sm">Define your school & sleep times to find focus slots.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold rounded-xl">
              <Plus className="w-4 h-4 mr-2" /> Add Block
            </Button>
          </DialogTrigger>
          <DialogContent className="glass bg-slate-900/90 text-white border-white/10">
            <DialogHeader>
              <DialogTitle>Add Schedule Block</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select onValueChange={(v) => setNewBlock({...newBlock, type: v})} defaultValue="study">
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="school">School</SelectItem>
                    <SelectItem value="sleep">Sleep</SelectItem>
                    <SelectItem value="study">Study Session</SelectItem>
                    <SelectItem value="extracurricular">Extracurricular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="grid gap-2">
                    <Label>Day</Label>
                    <Select onValueChange={(v) => setNewBlock({...newBlock, day: v})} defaultValue="0">
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS.map((d, i) => <SelectItem key={i} value={i.toString()}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                 </div>
                 <div className="grid gap-2">
                    <Label>Start Time</Label>
                    <Select onValueChange={(v) => setNewBlock({...newBlock, start: v})} defaultValue="16">
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HOURS.map((h) => <SelectItem key={h} value={h.toString()}>{h}:00</SelectItem>)}
                      </SelectContent>
                    </Select>
                 </div>
              </div>
              <div className="grid gap-2">
                <Label>Duration (hours)</Label>
                <Input 
                   type="number" 
                   value={newBlock.duration} 
                   onChange={(e) => setNewBlock({...newBlock, duration: e.target.value})}
                   className="bg-white/5 border-white/10"
                />
              </div>
            </div>
            <Button onClick={addBlock} className="w-full bg-cyan-500 text-black font-bold">Save Block</Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 glass-card rounded-3xl overflow-hidden flex flex-col relative">
        {/* Header Row */}
        <div className="flex border-b border-white/10 bg-black/20">
          <div className="w-12 border-r border-white/10" />
          {DAYS.map(day => (
            <div key={day} className="flex-1 py-3 text-center text-sm font-bold text-white/60">
              {day}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative">
          <div className="flex min-h-[1200px]"> {/* 50px per hour */}
            {/* Time Column */}
            <div className="w-12 flex-shrink-0 border-r border-white/10 bg-black/10">
              {HOURS.map(h => (
                <div key={h} className="h-[50px] text-[10px] text-white/30 text-center pt-1 border-b border-white/5">
                  {h}:00
                </div>
              ))}
            </div>

            {/* Days Columns */}
            {DAYS.map((_, dayIndex) => (
              <div key={dayIndex} className="flex-1 border-r border-white/5 relative">
                {/* Grid Lines */}
                {HOURS.map(h => (
                   <div key={h} className="h-[50px] border-b border-white/5" />
                ))}

                {/* Blocks */}
                {blocks.filter(b => b.day === dayIndex).map((block, i) => (
                  <div
                    key={i}
                    className={`absolute left-1 right-1 rounded-lg p-2 text-xs font-bold border backdrop-blur-md overflow-hidden ${getBlockStyle(block.type)}`}
                    style={{
                      top: `${block.start * 50}px`,
                      height: `${(block.end - block.start) * 50}px`
                    }}
                  >
                    {block.type}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}