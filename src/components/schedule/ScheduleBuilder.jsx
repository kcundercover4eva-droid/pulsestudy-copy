import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Plus, GripHorizontal, Clock, RotateCcw, X } from 'lucide-react';
import { haptics } from '../utils/haptics';
import NotificationSettings from './NotificationSettings';
import NotificationChecker from './NotificationChecker';
import TaskPanel from './TaskPanel';
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
  const [isCreationMode, setIsCreationMode] = useState(false);
  const [isEraseMode, setIsEraseMode] = useState(false);
  const [is12Hour, setIs12Hour] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [blockToDelete, setBlockToDelete] = useState(null);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);

  // Seeding Default Blocks - School 8am-3pm Mon-Fri, Sleep 10pm-6am all days
  useEffect(() => {
    if (!isLoading && dbBlocks && dbBlocks.length === 0) {
      const seedBlocks = [];
      const DAYS_INDICES = [0, 1, 2, 3, 4, 5, 6]; // Mon-Sun

      // School: Mon(0) - Fri(4) from 8:00 to 15:00 (3pm)
      [0, 1, 2, 3, 4].forEach(day => {
        seedBlocks.push({ day, start: 8, end: 15, type: 'school', title: 'School', color: '#3b82f6' });
      });

      // Sleep: Every day 22:00-24:00 (10pm-midnight) AND 00:00-06:00 (midnight-6am)
      DAYS_INDICES.forEach(day => {
        seedBlocks.push({ day, start: 22, end: 24, type: 'sleep', title: 'Sleep', color: '#8b5cf6' });
        seedBlocks.push({ day, start: 0, end: 6, type: 'sleep', title: 'Sleep', color: '#8b5cf6' });
      });

      base44.entities.ScheduleBlock.bulkCreate(seedBlocks)
        .then(() => queryClient.invalidateQueries(['scheduleBlocks']));
    }
  }, [dbBlocks, isLoading, queryClient]);

  // Keep ref in sync
  useEffect(() => {
    localBlocksRef.current = localBlocks;
  }, [localBlocks]);

  useEffect(() => {
    if (dbBlocks && Array.isArray(dbBlocks)) {
      console.log('Loaded blocks:', dbBlocks);
      setLocalBlocks(dbBlocks.map(dbBlock => ({
        id: dbBlock.id,
        day: Number(dbBlock.day),
        start: Number(dbBlock.start),
        end: Number(dbBlock.end),
        type: dbBlock.type || 'study',
        title: dbBlock.title || '',
        color: dbBlock.color || '#10b981'
      })));
    }
  }, [dbBlocks]);

  const updateBlockMutation = useMutation({
    mutationFn: (block) => {
      console.log('Updating block:', block);
      const { id, ...data } = block;
      return base44.entities.ScheduleBlock.update(id, {
        day: Number(data.day),
        start: Number(data.start),
        end: Number(data.end),
        type: data.type,
        title: data.title,
        color: data.color
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['scheduleBlocks']);
    },
  });
  
  const createBlockMutation = useMutation({
    mutationFn: (block) => base44.entities.ScheduleBlock.create(block),
    onSuccess: () => queryClient.invalidateQueries(['scheduleBlocks']),
  });

  const deleteBlockMutation = useMutation({
    mutationFn: (blockId) => base44.entities.ScheduleBlock.delete(blockId),
    onSuccess: () => queryClient.invalidateQueries(['scheduleBlocks']),
  });

  // --- NEW BLOCK FORM ---
  const [newBlock, setNewBlock] = useState({ day: 0, start: 16, duration: 1, type: 'study', title: '', color: '#10b981' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddBlock = async () => {
    const start = parseFloat(newBlock.start);
    const end = start + parseFloat(newBlock.duration);
    
    if (checkOverlap(parseInt(newBlock.day), start, end)) {
      alert('This block overlaps with an existing block. Please choose a different time.');
      return;
    }
    
    await createBlockMutation.mutateAsync({
      day: parseInt(newBlock.day),
      start,
      end,
      type: newBlock.type,
      title: newBlock.title || 'New Block',
      color: newBlock.color
    });
    setIsDialogOpen(false);
    setIsCreationMode(false);
  };

  const handleDeleteBlock = async () => {
    if (blockToDelete) {
      await deleteBlockMutation.mutateAsync(blockToDelete.id);
      setBlockToDelete(null);
      setIsEraseMode(false);
    }
  };

  // --- DRAG & RESIZE STATE ---
  // action: 'move' | 'resize-top' | 'resize-bottom'
  const [dragState, setDragState] = useState(null);
  const [pressHoldTimer, setPressHoldTimer] = useState(null);
  const [activeHandle, setActiveHandle] = useState(null); // 'top' | 'bottom' | null 

  // --- HELPERS ---
  const formatTime = (decimalTime) => {
    const hours = Math.floor(decimalTime);
    const minutes = Math.round((decimalTime - hours) * 60);
    
    if (is12Hour) {
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const checkOverlap = (day, start, end, excludeId = null) => {
    return localBlocksRef.current.some(block => {
      if (block.id === excludeId) return false;
      if (block.day !== day) return false;
      // Check if ranges overlap
      return !(end <= block.start || start >= block.end);
    });
  };

  // --- EVENT HANDLERS ---

  // Handle creating new blocks by dragging on empty grid
  const handleGridPointerDown = (e, dayIndex) => {
    if (!isCreationMode) return; // Only allow creation when in creation mode
    if (e.target !== e.currentTarget) return;
    
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    // Calculate start time based on click position
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const rawStart = relativeY / PIXELS_PER_HOUR + (scrollRef.current?.scrollTop || 0) / PIXELS_PER_HOUR;
    const snappedStart = Math.floor(rawStart / SNAP_DECIMAL) * SNAP_DECIMAL;

    setDragState({
      action: 'create',
      day: dayIndex,
      startY: e.clientY,
      start: snappedStart,
      end: snappedStart + (1 * SNAP_DECIMAL), // Initial 15 min block
    });
  };

  const handlePointerDown = (e, block, action) => {
    if (isEraseMode && action === 'move') {
      // In erase mode, clicking the block triggers deletion
      e.preventDefault();
      e.stopPropagation();
      setBlockToDelete(block);
      return;
    }

    e.preventDefault();
    e.stopPropagation(); // Prevent triggering grid creation
    
    // Capture pointer immediately (before setTimeout)
    e.currentTarget.setPointerCapture(e.pointerId);
    
    // Press-and-hold for resize handles
    if (action === 'resize-top' || action === 'resize-bottom') {
      const startY = e.clientY;
      const timer = setTimeout(() => {
        haptics.medium();
        setActiveHandle(action === 'resize-top' ? 'top' : 'bottom');
        
        setDragState({
          blockId: block.id,
          action,
          startY,
          originalStart: block.start,
          originalEnd: block.end,
          day: block.day
        });
      }, 200); // 200ms press-and-hold
      
      setPressHoldTimer(timer);
    } else {
      // Immediate drag for move
      haptics.light();
      
      setDragState({
        blockId: block.id,
        action,
        startY: e.clientY,
        originalStart: block.start,
        originalEnd: block.end,
        day: block.day
      });
    }
  };

  const handlePointerUp = () => {
    if (pressHoldTimer) {
      clearTimeout(pressHoldTimer);
      setPressHoldTimer(null);
    }
    setActiveHandle(null);
  };

  useEffect(() => {
    if (!dragState) return;

    const handlePointerMove = (e) => {
      if (dragState.action === 'create') {
        const deltaY = e.clientY - dragState.startY;
        const deltaHours = deltaY / PIXELS_PER_HOUR;
        
        let newEnd = dragState.start + deltaHours;
        
        // Snap
        newEnd = Math.round(newEnd / SNAP_DECIMAL) * SNAP_DECIMAL;
        
        // Min duration 15 mins
        if (newEnd <= dragState.start + SNAP_DECIMAL) newEnd = dragState.start + SNAP_DECIMAL;
        if (newEnd > 24) newEnd = 24;

        setDragState(prev => ({ ...prev, end: newEnd }));
        return;
      }

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
      const oldStart = newStart;
      const oldEnd = newEnd;
      newStart = Math.round(newStart / SNAP_DECIMAL) * SNAP_DECIMAL;
      newEnd = Math.round(newEnd / SNAP_DECIMAL) * SNAP_DECIMAL;
      
      // Haptic feedback on snap
      if (oldStart !== newStart || oldEnd !== newEnd) {
        haptics.light();
      }

      // Get the block being dragged
      const currentBlock = localBlocksRef.current.find(b => b.id === dragState.blockId);
      let minDuration = SNAP_DECIMAL;
      let maxDuration = 24;

      // For sleep blocks, calculate cumulative sleep for the day
      if (currentBlock?.type === 'sleep') {
        const otherSleepBlocks = localBlocksRef.current.filter(
          b => b.day === currentBlock.day && b.type === 'sleep' && b.id !== dragState.blockId
        );
        const otherSleepTotal = otherSleepBlocks.reduce((sum, b) => sum + (b.end - b.start), 0);
        const proposedDuration = newEnd - newStart;
        const totalSleep = otherSleepTotal + proposedDuration;

        // If total sleep would be less than 5 hours, enforce minimum on this block
        if (totalSleep < 5) {
          minDuration = 5 - otherSleepTotal;
          if (minDuration < SNAP_DECIMAL) minDuration = SNAP_DECIMAL;
        }

        // If total sleep would exceed 10 hours, cap this block's duration
        if (totalSleep > 10) {
          maxDuration = 10 - otherSleepTotal;
          if (maxDuration < minDuration) maxDuration = minDuration;
        }
      }

      // Constraints
      if (dragState.action === 'resize-bottom') {
        if (newEnd <= newStart + minDuration) newEnd = newStart + minDuration;
        if (newEnd >= newStart + maxDuration) newEnd = newStart + maxDuration;
        if (newEnd > 24) newEnd = 24;
      } else if (dragState.action === 'resize-top') {
        if (newStart >= newEnd - minDuration) newStart = newEnd - minDuration;
        if (newStart <= newEnd - maxDuration) newStart = newEnd - maxDuration;
        if (newStart < 0) newStart = 0;
      } else if (dragState.action === 'move') {
        const duration = newEnd - newStart;
        if (newStart < 0) { newStart = 0; newEnd = duration; }
        if (newEnd > 24) { newEnd = 24; newStart = 24 - duration; }
      }

      // Check for overlap before updating
      if (checkOverlap(currentBlock.day, newStart, newEnd, dragState.blockId)) {
        return; // Don't update if it would cause overlap
      }

      // Optimistic Update (Local State)
      setLocalBlocks(prev => prev.map(b => 
        b.id === dragState.blockId 
          ? { ...b, start: newStart, end: newEnd } 
          : b
      ));
    };

    const handlePointerUp = () => {
      if (dragState.action === 'create') {
        // Open dialog with drafted times
        setNewBlock({
          day: dragState.day,
          start: dragState.start,
          duration: dragState.end - dragState.start,
          type: 'study',
          title: '',
          color: '#10b981'
        });
        setIsDialogOpen(true);
        setDragState(null);
        haptics.success();
        return;
      }

      // Persist changes using the ref to get the latest state
      const updatedBlock = localBlocksRef.current.find(b => b.id === dragState.blockId);
      if (updatedBlock) {
        // Ensure strictly typed numbers before sending
        const payload = {
            ...updatedBlock,
            day: Number(updatedBlock.day),
            start: Number(updatedBlock.start),
            end: Number(updatedBlock.end)
        };
        updateBlockMutation.mutate(payload);
        haptics.success();
      }
      setDragState(null);
      setActiveHandle(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState, updateBlockMutation]); // Removed localBlocks from dependency to prevent listener churn

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6">
      <NotificationChecker blocks={localBlocks} />
      
      {/* Main Schedule Section */}
      <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <div className="mb-6 px-1">
        <h2 className="text-2xl font-bold">Weekly Schedule</h2>
        <p className="text-white/40 text-sm mb-4">Drag to resize. Plan your perfect week.</p>
        
        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <Button 
                variant="outline" 
                onClick={() => {
                  setIsEraseMode(!isEraseMode);
                  setIsCreationMode(false);
                }}
                className={`border-white/10 hover:bg-white/5 ${isEraseMode ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-transparent text-white/60 hover:text-white'}`}
            >
                <X className="w-4 h-4 mr-2" /> {isEraseMode ? 'Cancel Erase' : 'Erase Mode'}
            </Button>
            <Button 
              onClick={() => {
                setIsCreationMode(!isCreationMode);
                setIsEraseMode(false);
              }}
              className={`font-bold rounded-xl ${isCreationMode ? 'bg-orange-500 hover:bg-orange-600' : 'bg-cyan-500 hover:bg-cyan-600'} text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]`}
            >
              <Plus className="w-4 h-4 mr-2" /> {isCreationMode ? 'Cancel' : 'Add Block'}
            </Button>
          </div>
          
          <label className="flex items-center gap-1.5 text-xs text-white/60 cursor-pointer">
            <input 
              type="checkbox" 
              checked={is12Hour} 
              onChange={(e) => setIs12Hour(e.target.checked)}
              className="rounded"
            />
            12-Hour
          </label>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="glass bg-slate-900/90 text-white border-white/10">
            <DialogHeader>
              <DialogTitle>Name Your Block</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="block-title">Block Name</Label>
                <Input 
                   id="block-title"
                   type="text" 
                   placeholder="e.g., Math Study, Workout, etc."
                   value={newBlock.title} 
                   onChange={(e) => setNewBlock({...newBlock, title: e.target.value})}
                   className="bg-white/5 border-white/10"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="block-color">Block Color</Label>
                <div className="flex gap-2">
                  {['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'].map(color => (
                    <button
                      key={color}
                      onClick={() => setNewBlock({...newBlock, color})}
                      className={`w-10 h-10 rounded-lg transition-all ${newBlock.color === color ? 'ring-2 ring-white scale-110' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="text-xs text-white/40">
                Time: {formatTime(newBlock.start)} - {formatTime(newBlock.start + newBlock.duration)} ({newBlock.duration}h)
              </div>
            </div>
            <Button onClick={handleAddBlock} className="w-full bg-cyan-500 text-black font-bold">Save Block</Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Scheduler Grid - Desktop: days horizontal, time vertical */}
      <div className="hidden md:flex flex-1 glass-card rounded-3xl overflow-hidden flex-col relative shadow-2xl">
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
              {HOURS.map(h => {
                let displayHour = h;
                if (is12Hour) {
                  displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
                }
                return (
                  <div 
                    key={h} 
                    className="absolute w-full text-right pr-2 text-xs text-white/40 font-mono"
                    style={{ top: h * PIXELS_PER_HOUR - 8 }}
                  >
                    {displayHour}:00
                  </div>
                );
              })}
            </div>

            {/* Grid Columns */}
            {DAYS.map((_, dayIndex) => (
              <div 
                key={dayIndex} 
                className={`flex-1 border-r border-white/5 relative group ${isCreationMode ? 'cursor-crosshair' : ''}`}
                onPointerDown={(e) => handleGridPointerDown(e, dayIndex)}
              >
                {/* Hourly Lines */}
                {HOURS.map(h => (
                   <div 
                    key={h} 
                    className={`absolute w-full pointer-events-none ${h === 12 && is12Hour ? 'border-b-2 border-dashed border-cyan-400/50' : 'border-b border-white/5'}`}
                    style={{ top: h * PIXELS_PER_HOUR }}
                   />
                ))}

                {/* AM/PM Label */}
                {is12Hour && (
                  <>
                    <div className="absolute left-2 text-[10px] text-white/30 font-bold" style={{ top: 2 }}>AM</div>
                    <div className="absolute left-2 text-[10px] text-white/30 font-bold" style={{ top: 12 * PIXELS_PER_HOUR + 2 }}>PM</div>
                  </>
                )}

                {/* Creation Ghost Block */}
                {dragState?.action === 'create' && dragState.day === dayIndex && (
                  <div
                    className="absolute left-1 right-1 rounded-xl border-2 border-cyan-400 border-dashed z-50 pointer-events-none flex items-center justify-center"
                    style={{
                      top: `${dragState.start * PIXELS_PER_HOUR}px`,
                      height: `${(dragState.end - dragState.start) * PIXELS_PER_HOUR}px`,
                      backgroundColor: newBlock.color + '80'
                    }}
                  >
                    <span className="text-xs font-bold text-white drop-shadow-md">
                      {formatTime(dragState.start)} - {formatTime(dragState.end)}
                    </span>
                  </div>
                )}

                {/* Blocks */}
                <AnimatePresence>
                  {localBlocks.filter(b => b.day === dayIndex).map((block) => (
                    <motion.div
                      layout
                      key={block.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ 
                        opacity: 1, 
                        scale: dragState?.blockId === block.id ? 1.02 : 1,
                        zIndex: dragState?.blockId === block.id ? 50 : 1
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30
                      }}
                      className={`absolute left-1 right-1 rounded-xl border-2 overflow-hidden select-none touch-none transition-all ${
                        dragState?.blockId === block.id 
                          ? 'shadow-[0_0_30px_rgba(6,182,212,0.6)] ring-2 ring-cyan-400/70 brightness-110' 
                          : 'shadow-md'
                      } ${isEraseMode ? 'cursor-pointer hover:ring-2 hover:ring-red-500 hover:opacity-80' : ''}`}
                      style={{
                        top: `${block.start * PIXELS_PER_HOUR}px`,
                        height: `${(block.end - block.start) * PIXELS_PER_HOUR}px`,
                        backgroundColor: block.color || '#10b981',
                        borderColor: block.color || '#10b981'
                      }}
                    >
                      {/* Top Handle */}
                      <div 
                        className={`absolute top-0 left-0 right-0 h-8 cursor-ns-resize flex items-center justify-center transition-all z-20 ${
                          activeHandle === 'top' && dragState?.blockId === block.id 
                            ? 'opacity-100 bg-cyan-500/40' 
                            : 'opacity-0 hover:opacity-100 bg-black/20'
                        }`}
                        onPointerDown={(e) => handlePointerDown(e, block, 'resize-top')}
                        onPointerUp={handlePointerUp}
                        role="button"
                        aria-label="Adjust start time"
                        tabIndex={0}
                      >
                         <div className={`w-12 h-1.5 rounded-full transition-all ${
                           activeHandle === 'top' && dragState?.blockId === block.id 
                             ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' 
                             : 'bg-white/70'
                         }`} />
                      </div>

                      {/* Content / Move Handle */}
                      <div 
                        className="w-full h-full p-2 flex flex-col cursor-move"
                        onPointerDown={(e) => handlePointerDown(e, block, 'move')}
                        onDoubleClick={() => {
                          setEditingBlockId(block.id);
                          setEditingTitle(block.title);
                        }}
                      >
                         {editingBlockId === block.id ? (
                           <input
                             autoFocus
                             value={editingTitle}
                             onChange={(e) => setEditingTitle(e.target.value)}
                             onBlur={() => {
                               updateBlockMutation.mutate({ ...block, title: editingTitle });
                               setEditingBlockId(null);
                             }}
                             onKeyDown={(e) => {
                               if (e.key === 'Enter') {
                                 updateBlockMutation.mutate({ ...block, title: editingTitle });
                                 setEditingBlockId(null);
                               }
                             }}
                             className="bg-white/20 text-white font-bold text-xs px-1 py-0.5 rounded border-none outline-none w-full"
                           />
                         ) : (
                           <div className="font-bold text-xs truncate text-white">{block.title}</div>
                         )}
                         <div className="text-[10px] opacity-70 font-mono text-white">
                           {formatTime(block.start)} - {formatTime(block.end)}
                         </div>
                      </div>

                      {/* Bottom Handle */}
                      <div 
                        className={`absolute bottom-0 left-0 right-0 h-8 cursor-ns-resize flex items-center justify-center transition-all z-20 ${
                          activeHandle === 'bottom' && dragState?.blockId === block.id 
                            ? 'opacity-100 bg-cyan-500/40' 
                            : 'opacity-0 hover:opacity-100 bg-black/20'
                        }`}
                        onPointerDown={(e) => handlePointerDown(e, block, 'resize-bottom')}
                        onPointerUp={handlePointerUp}
                        role="button"
                        aria-label="Adjust end time"
                        tabIndex={0}
                      >
                        <div className={`w-12 h-1.5 rounded-full transition-all ${
                          activeHandle === 'bottom' && dragState?.blockId === block.id 
                            ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' 
                            : 'bg-white/70'
                        }`} />
                      </div>

                      {/* Floating Tooltip during drag */}
                      {dragState?.blockId === block.id && (
                        <motion.div 
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/95 text-white text-sm px-4 py-3 rounded-xl shadow-2xl whitespace-nowrap z-50 pointer-events-none border-2 border-cyan-400/50 backdrop-blur-sm"
                        >
                          <Clock className="w-4 h-4 inline mr-1.5" />
                          <span className="font-bold">{formatTime(block.start)} - {formatTime(block.end)}</span>
                          <div className="text-xs text-cyan-400 text-center mt-1 font-mono">
                            {((block.end - block.start)).toFixed(2)}h duration
                          </div>
                        </motion.div>
                      )}

                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scheduler Grid - Mobile: single day view with navigation */}
      <div className="md:hidden flex-1 glass-card rounded-3xl overflow-hidden flex flex-col relative shadow-2xl">
        {/* Day Navigation Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-xl z-10 py-4 px-4">
          <button 
            onClick={() => setCurrentDayIndex(prev => (prev - 1 + DAYS.length) % DAYS.length)}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white"
          >
            ←
          </button>
          <h3 className="text-lg font-bold text-white uppercase tracking-wider">{DAYS[currentDayIndex]}</h3>
          <button 
            onClick={() => setCurrentDayIndex(prev => (prev + 1) % DAYS.length)}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white"
          >
            →
          </button>
        </div>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-auto relative bg-slate-900/50">
          <div className="flex relative" style={{ height: HOURS.length * PIXELS_PER_HOUR }}>
            
            {/* Time Column */}
            <div className="w-14 flex-shrink-0 border-r border-white/10 bg-black/20 sticky left-0 z-10">
              {HOURS.map(h => {
                let displayHour = h;
                if (is12Hour) {
                  displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
                }
                return (
                  <div 
                    key={h} 
                    className="absolute w-full text-right pr-2 text-xs text-white/40 font-mono"
                    style={{ top: h * PIXELS_PER_HOUR - 8 }}
                  >
                    {displayHour}:00
                  </div>
                );
              })}
            </div>

            {/* Day Column */}
            <div 
              className={`flex-1 border-r border-white/5 relative ${isCreationMode ? 'cursor-crosshair' : ''}`}
              onPointerDown={(e) => handleGridPointerDown(e, currentDayIndex)}
            >
              {/* Hourly Lines */}
              {HOURS.map(h => (
                <div 
                  key={h} 
                  className={`absolute w-full pointer-events-none ${h === 12 && is12Hour ? 'border-b-2 border-dashed border-cyan-400/50' : 'border-b border-white/5'}`}
                  style={{ top: h * PIXELS_PER_HOUR }}
                />
              ))}

              {/* AM/PM Label */}
              {is12Hour && (
                <>
                  <div className="absolute left-2 text-[10px] text-white/30 font-bold" style={{ top: 2 }}>AM</div>
                  <div className="absolute left-2 text-[10px] text-white/30 font-bold" style={{ top: 12 * PIXELS_PER_HOUR + 2 }}>PM</div>
                </>
              )}

              {/* Creation Ghost Block */}
              {dragState?.action === 'create' && dragState.day === currentDayIndex && (
                <div
                  className="absolute left-1 right-1 rounded-xl border-2 border-cyan-400 border-dashed z-50 pointer-events-none flex items-center justify-center"
                  style={{
                    top: `${dragState.start * PIXELS_PER_HOUR}px`,
                    height: `${(dragState.end - dragState.start) * PIXELS_PER_HOUR}px`,
                    backgroundColor: newBlock.color + '80'
                  }}
                >
                  <span className="text-xs font-bold text-white drop-shadow-md">
                    {formatTime(dragState.start)} - {formatTime(dragState.end)}
                  </span>
                </div>
              )}

              {/* Blocks */}
              <AnimatePresence>
                {localBlocks.filter(b => b.day === currentDayIndex).map((block) => (
                  <motion.div
                    layout
                    key={block.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ 
                      opacity: 1, 
                      scale: dragState?.blockId === block.id ? 1.02 : 1,
                      zIndex: dragState?.blockId === block.id ? 50 : 1
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30
                    }}
                    className={`absolute left-1 right-1 rounded-xl border-2 overflow-hidden select-none touch-none transition-all ${
                      dragState?.blockId === block.id 
                        ? 'shadow-[0_0_30px_rgba(6,182,212,0.6)] ring-2 ring-cyan-400/70 brightness-110' 
                        : 'shadow-md'
                    } ${isEraseMode ? 'cursor-pointer hover:ring-2 hover:ring-red-500 hover:opacity-80' : ''}`}
                    style={{
                      top: `${block.start * PIXELS_PER_HOUR}px`,
                      height: `${(block.end - block.start) * PIXELS_PER_HOUR}px`,
                      backgroundColor: block.color || '#10b981',
                      borderColor: block.color || '#10b981'
                    }}
                  >
                    {/* Top Handle */}
                    <div 
                      className={`absolute top-0 left-0 right-0 h-8 cursor-ns-resize flex items-center justify-center transition-all z-20 ${
                        activeHandle === 'top' && dragState?.blockId === block.id 
                          ? 'opacity-100 bg-cyan-500/40' 
                          : 'opacity-0 hover:opacity-100 bg-black/20'
                      }`}
                      onPointerDown={(e) => handlePointerDown(e, block, 'resize-top')}
                      onPointerUp={handlePointerUp}
                      role="button"
                      aria-label="Adjust start time"
                      tabIndex={0}
                    >
                      <div className={`w-12 h-1.5 rounded-full transition-all ${
                        activeHandle === 'top' && dragState?.blockId === block.id 
                          ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' 
                          : 'bg-white/70'
                      }`} />
                    </div>

                    {/* Content / Move Handle */}
                    <div 
                      className="w-full h-full p-2 flex flex-col cursor-move"
                      onPointerDown={(e) => handlePointerDown(e, block, 'move')}
                      onDoubleClick={() => {
                        setEditingBlockId(block.id);
                        setEditingTitle(block.title);
                      }}
                    >
                      {editingBlockId === block.id ? (
                        <input
                          autoFocus
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={() => {
                            updateBlockMutation.mutate({ ...block, title: editingTitle });
                            setEditingBlockId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateBlockMutation.mutate({ ...block, title: editingTitle });
                              setEditingBlockId(null);
                            }
                          }}
                          className="bg-white/20 text-white font-bold text-xs px-1 py-0.5 rounded border-none outline-none w-full"
                        />
                      ) : (
                        <div className="font-bold text-xs truncate text-white">{block.title}</div>
                      )}
                      <div className="text-[10px] opacity-70 font-mono text-white">
                        {formatTime(block.start)} - {formatTime(block.end)}
                      </div>
                    </div>

                    {/* Bottom Handle */}
                    <div 
                      className={`absolute bottom-0 left-0 right-0 h-8 cursor-ns-resize flex items-center justify-center transition-all z-20 ${
                        activeHandle === 'bottom' && dragState?.blockId === block.id 
                          ? 'opacity-100 bg-cyan-500/40' 
                          : 'opacity-0 hover:opacity-100 bg-black/20'
                      }`}
                      onPointerDown={(e) => handlePointerDown(e, block, 'resize-bottom')}
                      onPointerUp={handlePointerUp}
                      role="button"
                      aria-label="Adjust end time"
                      tabIndex={0}
                    >
                      <div className={`w-12 h-1.5 rounded-full transition-all ${
                        activeHandle === 'bottom' && dragState?.blockId === block.id 
                          ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' 
                          : 'bg-white/70'
                      }`} />
                    </div>

                    {/* Floating Tooltip during drag */}
                    {dragState?.blockId === block.id && (
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/95 text-white text-sm px-4 py-3 rounded-xl shadow-2xl whitespace-nowrap z-50 pointer-events-none border-2 border-cyan-400/50 backdrop-blur-sm"
                      >
                        <Clock className="w-4 h-4 inline mr-1.5" />
                        <span className="font-bold">{formatTime(block.start)} - {formatTime(block.end)}</span>
                        <div className="text-xs text-cyan-400 text-center mt-1 font-mono">
                          {((block.end - block.start)).toFixed(2)}h duration
                        </div>
                      </motion.div>
                    )}

                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!blockToDelete} onOpenChange={() => setBlockToDelete(null)}>
        <DialogContent className="glass bg-slate-900/90 text-white border-white/10">
          <DialogHeader>
            <DialogTitle>Delete Block?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-white/80">
              Are you sure you want to delete "<span className="font-bold">{blockToDelete?.title}</span>"?
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setBlockToDelete(null)}
              className="border-white/10 hover:bg-white/5"
            >
              No
            </Button>
            <Button 
              onClick={handleDeleteBlock}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Yes, Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
      
      {/* Task Panel */}
      <div className="w-full lg:w-80 flex-shrink-0">
        <TaskPanel />
      </div>
    </div>
  );
}