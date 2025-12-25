import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function CommentSection({ targetType, targetId }) {
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');

  // Fetch comments
  const { data: comments = [] } = useQuery({
    queryKey: ['comments', targetType, targetId],
    queryFn: () => base44.entities.Comment.filter({ targetType, targetId }, '-created_date'),
  });

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Post comment
  const postCommentMutation = useMutation({
    mutationFn: async (content) => {
      return base44.entities.Comment.create({
        targetType,
        targetId,
        content,
        authorName: currentUser.full_name || 'Anonymous',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', targetType, targetId]);
      setNewComment('');
      toast.success('Comment posted!');
    },
  });

  const handlePost = () => {
    if (!newComment.trim()) return;
    postCommentMutation.mutate(newComment);
  };

  return (
    <div className="space-y-4">
      {/* New Comment */}
      <Card className="bg-slate-800 border-slate-700 p-4">
        <Textarea
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="bg-slate-900 border-slate-700 text-white mb-3 resize-none"
          rows={3}
        />
        <div className="flex justify-end">
          <Button
            onClick={handlePost}
            disabled={!newComment.trim() || postCommentMutation.isPending}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Send className="w-4 h-4 mr-2" />
            Post
          </Button>
        </div>
      </Card>

      {/* Comments List */}
      <AnimatePresence>
        {comments.map((comment) => (
          <motion.div
            key={comment.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="bg-slate-800 border-slate-700 p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-bold text-white">{comment.authorName}</div>
                  <div className="text-xs text-slate-400">
                    {new Date(comment.created_date).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <p className="text-white/80">{comment.content}</p>
              <div className="flex items-center gap-2 mt-3">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-pink-400">
                  <Heart className="w-4 h-4 mr-1" />
                  {comment.likeCount || 0}
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {comments.length === 0 && (
        <div className="text-center text-slate-400 py-8">
          No comments yet. Be the first to comment!
        </div>
      )}
    </div>
  );
}