import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Plus, GripHorizontal, Clock } from 'lucide-react';
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
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 25 }, (_, i) => i); // 0 to 24
const PIXELS_PER_HOUR = 60;
const SNAP_MINUTES = 15;
const SNAP_DECIMAL = SNAP_MINUTES / 60; // 0.25

export default function ScheduleBuilder() {
  const queryClient = useQueryClient();
  const scrollRef = useRef(null);
  // Ref for accessing latest blocks in event handlers without triggering re-renders
  const localBlocksRef = useRef([]);

  // --- DATA ---
  const { data: dbBlocks, isLoading } = useQuery({
    queryKey: ['scheduleBlocks'],
    queryFn: () => base44.entities.ScheduleBlock.list(),
  });

  const [localBlocks, setLocalBlocks] = useState([]);

  // Keep ref in sync
  useEffect(() => {
    localBlocksRef.current = localBlocks;
  }, [localBlocks]);

  useEffect(() => {
    if (dbBlocks) {
      setLocalBlocks(dbBlocks.map(dbBlock => {
        const data = dbBlock.data || {};
        return { 
          id: dbBlock.id, 
          ...data,
          // Ensure numeric types to prevent visibility issues
          day: Number(data.day ?? 0),
          start: Number(data.start ?? 0),
          end: Number(data.end ?? 0)
        };
      }));
    }
  }, [dbBlocks]);

  const updateBlockMutation = useMutation({
    mutationFn: (block) => base44.entities.ScheduleBlock.update(block.id, block),
    onSuccess: () => queryClient.invalidateQueries(['scheduleBlocks']),
  });
  
  const createBlockMutation = useMutation({
    mutationFn: (block) => base44.entities.ScheduleBlock.create(block),
    onSuccess: () => queryClient.invalidateQueries(['scheduleBlocks']),
  });

  // --- NEW BLOCK FORM ---
  const [newBlock, setNewBlock] = useState({ day: 0, start: 16, duration: 1, type: 'study' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddBlock = () => {
    createBlockMutation.mutate({
      day: parseInt(newBlock.day),
      start: parseFloat(newBlock.start),
      end: parseFloat(newBlock.start) + parseFloat(newBlock.duration),
      type: newBlock.type,
      title: newBlock.title || newBlock.type.charAt(0).toUpperCase() + newBlock.type.slice(1)
    });
    setIsDialogOpen(false);
  };

  // --- DRAG & RESIZE STATE ---
  // action: 'move' | 'resize-top' | 'resize-bottom'
  const [dragState, setDragState] = useState(null); 

  // --- HELPERS ---
  const formatTime = (decimalTime) => {
    const hours = Math.floor(decimalTime);
    const minutes = Math.round((decimalTime - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const getBlockStyle = (type) => {
    switch (type) {
      case 'school': return 'bg-blue-500/20 border-blue-500/50 text-blue-300 hover:bg-blue-500/30';
      case 'sleep': return 'bg-purple-900/40 border-purple-500/30 text-purple-300 hover:bg-purple-900/50';
      case 'study': return 'bg-green-500/20 border-green-500/50 text-green-300 hover:bg-green-500/30';
      case 'extracurricular': return 'bg-orange-500/20 border-orange-500/50 text-orange-300 hover:bg-orange-500/30';
      default: return 'bg-white/10 hover:bg-white/20';
    }
  };

  // --- EVENT HANDLERS ---

  const handlePointerDown = (e, block, action) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    
    setDragState({
      blockId: block.id,
      action,
      startY: e.clientY,
      originalStart: block.start,
      originalEnd: block.end,
      day: block.day
    });
  };

  useEffect(() => {
    if (!dragState) return;

    const handlePointerMove = (e) => {
      const deltaY = e.clientY - dragState.startY;
      const deltaHours = deltaY / PIXELS_PER_HOUR;
      
      // Calculate raw new values
      let newStart = dragState.originalStart;
      let newEnd = dragState.originalEnd;

      if (dragState.action === 'resize-bottom') {
        newEnd = dragState.originalEnd + deltaHours;
      } else if (dragState.action === 'resize-top') {
        newStart = dragState.originalStart + deltaHours;
      } else if (dragState.action === 'move') {
        newStart = dragState.originalStart + deltaHours;
        newEnd = dragState.originalEnd + deltaHours;
      }

      // Snap to grid
      newStart = Math.round(newStart / SNAP_DECIMAL) * SNAP_DECIMAL;
      newEnd = Math.round(newEnd / SNAP_DECIMAL) * SNAP_DECIMAL;

      // Constraints
      if (dragState.action === 'resize-bottom') {
        if (newEnd <= newStart + SNAP_DECIMAL) newEnd = newStart + SNAP_DECIMAL; // Min duration
        if (newEnd > 24) newEnd = 24;
      } else if (dragState.action === 'resize-top') {
        if (newStart >= newEnd - SNAP_DECIMAL) newStart = newEnd - SNAP_DECIMAL;
        if (newStart < 0) newStart = 0;
      } else if (dragState.action === 'move') {
        const duration = newEnd - newStart;
        if (newStart < 0) { newStart = 0; newEnd = duration; }
        if (newEnd > 24) { newEnd = 24; newStart = 24 - duration; }
      }

      // Optimistic Update (Local State)
      setLocalBlocks(prev => prev.map(b => 
        b.id === dragState.blockId 
          ? { ...b, start: newStart, end: newEnd } 
          : b
      ));
    };

    const handlePointerUp = () => {
      // Persist changes using the ref to get the latest state
      const updatedBlock = localBlocksRef.current.find(b => b.id === dragState.blockId);
      if (updatedBlock) {
        updateBlockMutation.mutate(updatedBlock);
      }
      setDragState(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState, updateBlockMutation]); // Removed localBlocks from dependency to prevent listener churn

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 px-1">
        <div>
          <h2 className="text-2xl font-bold">Weekly Schedule</h2>
          <p className="text-white/40 text-sm">Drag to resize. Plan your perfect week.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              <Plus className="w-4 h-4 mr-2" /> Add Block
            </Button>
          </DialogTrigger>
          <DialogContent className="glass bg-slate-900/90 text-white border-white/10">
            <DialogHeader>
              <DialogTitle>Add Schedule Block</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="block-type">Type</Label>
                <Select onValueChange={(v) => setNewBlock({...newBlock, type: v})} defaultValue="study">
                  <SelectTrigger id="block-type" className="bg-white/5 border-white/10">
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
                    <Label htmlFor="block-day">Day</Label>
                    <Select onValueChange={(v) => setNewBlock({...newBlock, day: v})} defaultValue="0">
                      <SelectTrigger id="block-day" className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS.map((d, i) => <SelectItem key={i} value={i.toString()}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                 </div>
                 <div className="grid gap-2">
                    <Label htmlFor="block-start">Start Time</Label>
                    <Select onValueChange={(v) => setNewBlock({...newBlock, start: v})} defaultValue="16">
                      <SelectTrigger id="block-start" className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HOURS.slice(0,24).map((h) => <SelectItem key={h} value={h.toString()}>{h}:00</SelectItem>)}
                      </SelectContent>
                    </Select>
                 </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="block-duration">Duration (hours)</Label>
                <Input 
                   id="block-duration"
                   type="number" 
                   value={newBlock.duration} 
                   onChange={(e) => setNewBlock({...newBlock, duration: e.target.value})}
                   className="bg-white/5 border-white/10"
                />
              </div>
            </div>
            <Button onClick={handleAddBlock} className="w-full bg-cyan-500 text-black font-bold">Save Block</Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Scheduler Grid */}
      <div className="flex-1 glass-card rounded-3xl overflow-hidden flex flex-col relative shadow-2xl">
        {/* Days Header */}
        <div className="flex border-b border-white/10 bg-black/40 backdrop-blur-xl z-10">
          <div className="w-14 border-r border-white/10" />
          {DAYS.map(day => (
            <div key={day} className="flex-1 py-4 text-center text-sm font-bold text-white/80 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Scrollable Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-auto relative custom-scrollbar bg-slate-900/50" 
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="flex relative" style={{ height: HOURS.length * PIXELS_PER_HOUR }}>
            
            {/* Time Column */}
            <div className="w-14 flex-shrink-0 border-r border-white/10 bg-black/20 sticky left-0 z-10">
              {HOURS.map(h => (
                <div 
                  key={h} 
                  className="absolute w-full text-right pr-2 text-xs text-white/40 font-mono"
                  style={{ top: h * PIXELS_PER_HOUR - 8 }}
                >
                  {h}:00
                </div>
              ))}
            </div>

            {/* Grid Columns */}
            {DAYS.map((_, dayIndex) => (
              <div key={dayIndex} className="flex-1 border-r border-white/5 relative group">
                {/* Hourly Lines */}
                {HOURS.map(h => (
                   <div 
                    key={h} 
                    className="absolute w-full border-b border-white/5" 
                    style={{ top: h * PIXELS_PER_HOUR }}
                   />
                ))}

                {/* Blocks */}
                <AnimatePresence>
                  {localBlocks.filter(b => b.day === dayIndex).map((block) => (
                    <motion.div
                      layout
                      key={block.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1,
                        zIndex: dragState?.blockId === block.id ? 50 : 1
                      }}
                      className={`absolute left-1 right-1 rounded-xl border backdrop-blur-md overflow-hidden select-none touch-none ${getBlockStyle(block.type)} ${dragState?.blockId === block.id ? 'shadow-[0_0_20px_rgba(255,255,255,0.2)] ring-1 ring-white/50' : ''}`}
                      style={{
                        top: `${block.start * PIXELS_PER_HOUR}px`,
                        height: `${(block.end - block.start) * PIXELS_PER_HOUR}px`,
                      }}
                    >
                      {/* Top Handle */}
                      <div 
                        className="absolute top-0 left-0 right-0 h-4 cursor-ns-resize flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-white/10 z-20"
                        onPointerDown={(e) => handlePointerDown(e, block, 'resize-top')}
                      >
                         <div className="w-8 h-1 rounded-full bg-white/50" />
                      </div>

                      {/* Content / Move Handle */}
                      <div 
                        className="w-full h-full p-2 flex flex-col cursor-move"
                        onPointerDown={(e) => handlePointerDown(e, block, 'move')}
                      >
                         <div className="font-bold text-xs truncate">{block.type}</div>
                         <div className="text-[10px] opacity-70 font-mono">
                           {formatTime(block.start)} - {formatTime(block.end)}
                         </div>
                      </div>

                      {/* Bottom Handle */}
                      <div 
                        className="absolute bottom-0 left-0 right-0 h-4 cursor-ns-resize flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-white/10 z-20"
                        onPointerDown={(e) => handlePointerDown(e, block, 'resize-bottom')}
                      >
                        <div className="w-8 h-1 rounded-full bg-white/50" />
                      </div>

                      {/* Floating Tooltip during drag */}
                      {dragState?.blockId === block.id && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-50 pointer-events-none">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {formatTime(block.start)} - {formatTime(block.end)}
                          <div className="text-[10px] text-white/50 text-center">
                            {(block.end - block.start).toFixed(2)}h
                          </div>
                        </div>
                      )}

                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}