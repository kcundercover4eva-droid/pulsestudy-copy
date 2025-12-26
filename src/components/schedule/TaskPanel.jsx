import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function TaskPanel() {
  const queryClient = useQueryClient();
  const [selectedDay, setSelectedDay] = useState(0);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Task.filter({ created_by: user.email }, '-created_date');
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (task) => base44.entities.Task.create(task),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      setNewTaskTitle('');
      toast.success('Task added!');
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      toast.success('Task deleted');
    },
  });

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    createTaskMutation.mutate({
      title: newTaskTitle,
      day: selectedDay,
      priority: newTaskPriority,
      isCompleted: false,
    });
  };

  const toggleTask = (task) => {
    updateTaskMutation.mutate({
      id: task.id,
      data: { ...task, isCompleted: !task.isCompleted }
    });
  };

  const dayTasks = tasks.filter(t => t.day === selectedDay);
  const completedCount = dayTasks.filter(t => t.isCompleted).length;

  const priorityColors = {
    high: 'border-red-500/50 bg-red-500/10',
    medium: 'border-yellow-500/50 bg-yellow-500/10',
    low: 'border-green-500/50 bg-green-500/10',
  };

  return (
    <div className="glass-card rounded-2xl p-6 h-full flex flex-col">
      <h3 className="text-xl font-bold text-white mb-4">Daily Tasks</h3>

      {/* Day Selector */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {DAYS.map((day, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedDay(idx)}
            className={`px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              selectedDay === idx
                ? 'bg-cyan-500 text-black shadow-lg'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Add Task Form */}
      <form onSubmit={handleAddTask} className="mb-4">
        <div className="flex gap-2">
          <Input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Add a task..."
            className="bg-white/5 border-white/10 text-white flex-1"
          />
          <select
            value={newTaskPriority}
            onChange={(e) => setNewTaskPriority(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-2 text-white/80 text-sm"
          >
            <option value="low">Low</option>
            <option value="medium">Med</option>
            <option value="high">High</option>
          </select>
          <Button
            type="submit"
            size="icon"
            className="bg-cyan-500 hover:bg-cyan-600 text-black"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </form>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        <AnimatePresence>
          {dayTasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-white/40 py-8"
            >
              No tasks for {DAYS[selectedDay]}
            </motion.div>
          ) : (
            dayTasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`p-3 rounded-lg border-2 ${priorityColors[task.priority]} transition-all group`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleTask(task)}
                    className="mt-0.5 flex-shrink-0"
                  >
                    {task.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-white/40" />
                    )}
                  </button>
                  <div className="flex-1">
                    <p
                      className={`text-white ${
                        task.isCompleted ? 'line-through opacity-60' : ''
                      }`}
                    >
                      {task.title}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteTaskMutation.mutate(task.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4 text-red-400 hover:text-red-300" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Progress */}
      {dayTasks.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex justify-between text-sm text-white/60 mb-2">
            <span>Progress</span>
            <span>
              {completedCount}/{dayTasks.length}
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${(completedCount / dayTasks.length) * 100}%`,
              }}
              className="h-full bg-gradient-to-r from-cyan-500 to-green-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}