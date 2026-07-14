import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, User, Send, Trash2, Edit2, Reply as ReplyIcon, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import * as commentsApi from "@/services/commentsApi";
import { getToken } from "@/services/backendApi";

const COMMENTS_PER_PAGE = 20;

interface CommentsSectionProps {
  episodeId?: string;
  contentType?: 'episode' | 'blog';
  contentId?: string;
}

export function CommentsSection({ episodeId, contentType = 'episode', contentId }: CommentsSectionProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const actualContentId = contentId || episodeId || "";

  const [comments, setComments] = useState<commentsApi.Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [replies, setReplies] = useState<Map<string, commentsApi.Comment[]>>(new Map());

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalComments, setTotalComments] = useState(0);

  // Ref for infinite scroll observer
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Load comments function
  const loadComments = useCallback(async (page: number, isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      }

      console.log('🔍 Fetching comments - Page:', page, 'ContentType:', contentType, 'ID:', actualContentId);
      const response = contentType === 'blog'
        ? await commentsApi.getCommentsByBlog(actualContentId, page, COMMENTS_PER_PAGE)
        : await commentsApi.getCommentsByEpisode(actualContentId, page, COMMENTS_PER_PAGE);
      console.log('📦 API Response:', response);

      if (response.success) {
        const fetchedComments = response.data.comments || [];
        console.log('✅ Comments fetched:', fetchedComments.length);

        if (isInitial) {
          setComments(fetchedComments);
        } else {
          setComments(prev => [...prev, ...fetchedComments]);
        }

        // Update pagination state with better fallback logic
        if (response.data.pagination) {
          console.log('📊 Pagination data:', response.data.pagination);
          const haMoreValue = response.data.pagination.hasMore ?? (fetchedComments.length === COMMENTS_PER_PAGE);
          setHasMore(haMoreValue);
          const totalVal = response.data.pagination.totalCount ?? response.data.pagination.totalComments ?? 0;
          setTotalComments(totalVal);
          console.log('🔄 HasMore set to:', haMoreValue);
        } else {
          // Fallback if pagination info not provided
          const hasMoreFallback = fetchedComments.length === COMMENTS_PER_PAGE;
          console.log('⚠️ No pagination data, using fallback. HasMore:', hasMoreFallback);
          setHasMore(hasMoreFallback);
        }
      }
    } catch (error: any) {
      console.error('❌ Failed to load comments:', error);
      toast({
        id: String(Date.now()),
        title: "Error",
        description: error.message || "Failed to load comments",
        variant: "default"
      });
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [contentType, actualContentId, toast]);

  const loadMoreComments = useCallback(() => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    loadComments(nextPage, false);
  }, [loadingMore, hasMore, currentPage, loadComments]);

  // Load initial comments
  useEffect(() => {
    if (actualContentId) {
      // Reset state when content changes
      setComments([]);
      setCurrentPage(1);
      setHasMore(true);
      setTotalComments(0);
      loadComments(1, true);
    }
  }, [actualContentId, loadComments]);

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    // Wait for scroll container to be available
    if (!scrollContainerRef.current) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loading && !loadingMore) {
          loadMoreComments();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, loadingMore, loadMoreComments]);

  // Load replies for a comment
  const loadReplies = async (commentId: string) => {
    try {
      const response = await commentsApi.getReplies(commentId);
      if (response.success) {
        setReplies(prev => {
          const newMap = new Map(prev);
          newMap.set(String(commentId), response.data.replies);
          return newMap;
        });
        setExpandedReplies(prev => {
          const newSet = new Set(prev);
          newSet.add(String(commentId));
          return newSet;
        });
      }
    } catch (error: any) {
      console.error('Failed to load replies:', error);
      toast({
        id: String(Date.now()),
        title: "Error",
        description: "Failed to load replies",
        variant: "default"
      });
    }
  };

  // Submit new comment
  const handleCommentSubmit = async () => {
    if (!currentUser) {
      setShowLoginPrompt(true);
      return;
    }

    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      const token = getToken('accessToken');

      if (!token) {
        toast({
          title: "Error",
          description: "Authentication token not found. Please login again.",
          variant: "default"
        });
        return;
      }

      const response = await commentsApi.createComment({
        content: newComment.trim(),
        parentId: null,
        contentType,
        contentId: actualContentId,
        episodeId: contentType === 'episode' ? actualContentId : undefined
      });

      if (response.success) {
        // Add new comment to the top of the list
        setComments(prev => [response.data, ...prev]);
        setTotalComments(prev => prev + 1);
        setNewComment("");
        toast({
          id: String(Date.now()),
          title: "Success",
          description: "Comment posted successfully!"
        });
      }
    } catch (error: any) {
      console.error('Failed to post comment:', error);
      const errorMessage = error.message || "Failed to post comment";

      if (errorMessage.includes('Too many')) {
        toast({
          id: String(Date.now()),
          title: "Slow Down!",
          description: "You're posting comments too fast. Please wait a moment.",
          variant: "default",
          duration: 5000
        });
      } else {
        toast({
          id: String(Date.now()),
          title: "Error",
          description: errorMessage,
          variant: "default"
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Submit reply
  const handleReplySubmit = async (parentId: string) => {
    if (!currentUser || !replyContent.trim()) return;

    try {
      setSubmitting(true);
      const token = getToken('accessToken');

      if (!token) {
        toast({
          title: "Error",
          description: "Authentication token not found. Please login again.",
          variant: "default"
        });
        return;
      }

      const response = await commentsApi.createComment({
        content: replyContent.trim(),
        parentId,
        contentType,
        contentId: actualContentId,
        episodeId: contentType === 'episode' ? actualContentId : undefined
      });

      if (response.success) {
        // Reload replies for this comment
        await loadReplies(parentId);
        setReplyContent("");
        setReplyingTo(null);
        toast({
          id: String(Date.now()),
          title: "Success",
          description: "Reply posted successfully!"
        });
      }
    } catch (error: any) {
      toast({
        id: String(Date.now()),
        title: "Error",
        description: error.message || "Failed to post reply",
        variant: "default"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Edit comment
  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      setSubmitting(true);
      const token = getToken('accessToken');

      if (!token) {
        toast({
          title: "Error",
          description: "Authentication token not found. Please login again.",
          variant: "default"
        });
        return;
      }

      const response = await commentsApi.updateComment(commentId, editContent.trim());

      if (response.success) {
        // Update in local state
        setComments(prev =>
          prev.map(c => String(c.id) === String(commentId) ? { ...c, content: editContent.trim(), updatedAt: new Date().toISOString() } : c)
        );
        // Also update in replies if it exists there
        setReplies(prev => {
          const newMap = new Map(prev);
          for (const [parentId, repliesList] of newMap.entries()) {
            newMap.set(parentId, repliesList.map(r => String(r.id) === String(commentId) ? { ...r, content: editContent.trim(), updatedAt: new Date().toISOString() } : r));
          }
          return newMap;
        });

        setEditingCommentId(null);
        setEditContent("");
        toast({
          id: String(Date.now()),
          title: "Success",
          description: "Comment updated successfully!"
        });
      }
    } catch (error: any) {
      toast({
        id: String(Date.now()),
        title: "Error",
        description: error.message || "Failed to update comment",
        variant: "default"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const token = getToken('accessToken');

      if (!token) {
        toast({
          title: "Error",
          description: "Authentication token not found. Please login again.",
          variant: "default"
        });
        return;
      }

      const response = await commentsApi.deleteComment(commentId);

      if (response.success) {
        setComments(prev => prev.filter(c => String(c.id) !== String(commentId)));
        setTotalComments(prev => Math.max(0, prev - 1));
        // Also remove from replies
        setReplies(prev => {
          const newMap = new Map(prev);
          for (const [parentId, repliesList] of newMap.entries()) {
            newMap.set(parentId, repliesList.filter(r => String(r.id) !== String(commentId)));
          }
          return newMap;
        });

        toast({
          id: String(Date.now()),
          title: "Success",
          description: "Comment deleted successfully!"
        });
      }
    } catch (error: any) {
      toast({
        id: String(Date.now()),
        title: "Error",
        description: error.message || "Failed to delete comment",
        variant: "default"
      });
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 2592000)}mo ago`;
  };

  // Render a single comment
  const renderComment = (comment: commentsApi.Comment, isReply = false) => {
    const commentIdStr = String(comment.id);
    const isEditing = editingCommentId === commentIdStr;
    const isOwnComment = currentUser?.id && comment.user?.id && String(currentUser.id) === String(comment.user.id);
    const commentReplies = replies.get(commentIdStr) || [];
    const isExpanded = expandedReplies.has(commentIdStr);
    const replyCount = comment.replyCount ?? comment._count?.replies ?? 0;

    return (
      <div key={commentIdStr} className={`group flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors ${isReply ? 'ml-12 border-l-2 border-border/50 pl-4' : ''}`}>
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0 overflow-hidden">
          {comment.user?.avatarUrl ? (
            <img src={comment.user.avatarUrl} alt={comment.user.displayName || 'User'} className="w-full h-full object-cover" />
          ) : (
            comment.user?.displayName?.charAt(0).toUpperCase() || 'U'
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm">{comment.user?.displayName || 'User'}</h4>
            <span className="text-xs text-muted-foreground">{formatTimeAgo(comment.createdAt)}</span>
            {comment.createdAt !== comment.updatedAt && (
              <span className="text-xs text-muted-foreground italic">(edited)</span>
            )}
          </div>

          {/* Comment Content */}
          {isEditing ? (
            <div className="flex gap-2 mt-2 flex-col sm:flex-row">
              <Input
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="flex-1"
                placeholder="Edit your comment..."
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleEditComment(commentIdStr)} disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setEditingCommentId(null); setEditContent(''); }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm mb-2 whitespace-pre-wrap break-words">{comment.content}</p>
          )}

          {/* Action Buttons */}
          {!isEditing && (
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {/* Reply Button */}
              {!isReply && currentUser && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
                  onClick={() => setReplyingTo(replyingTo === commentIdStr ? null : commentIdStr)}
                >
                  <ReplyIcon className="h-3 w-3" />
                  Reply
                </Button>
              )}

              {/* Show Replies Button */}
              {!isReply && replyCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                  onClick={() => isExpanded ? setExpandedReplies(prev => { const newSet = new Set(prev); newSet.delete(commentIdStr); return newSet; }) : loadReplies(commentIdStr)}
                >
                  <MessageSquare className="h-3 w-3" />
                  {isExpanded ? 'Hide' : `View ${replyCount}`} {replyCount === 1 ? 'reply' : 'replies'}
                </Button>
              )}

              {/* Edit & Delete (own comments only) */}
              {isOwnComment && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs gap-1 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-500/20"
                    onClick={() => { setEditingCommentId(commentIdStr); setEditContent(comment.content); }}
                  >
                    <Edit2 className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs gap-1 text-red-500 hover:text-red-600 hover:bg-red-500/10 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-500/20"
                    onClick={() => handleDeleteComment(commentIdStr)}
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Reply Input */}
          {replyingTo === commentIdStr && (
            <div className="flex gap-2 mt-3 flex-col sm:flex-row p-3 rounded-lg bg-white/10 dark:bg-white/5 border border-primary/30 shadow-md">
              <Input
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 bg-background text-foreground"
                onKeyPress={(e) => e.key === 'Enter' && handleReplySubmit(commentIdStr)}
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleReplySubmit(commentIdStr)} disabled={submitting || !replyContent.trim()}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setReplyingTo(null); setReplyContent(''); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Replies */}
          {isExpanded && commentReplies.length > 0 && (
            <div className="mt-3 space-y-2">
              {commentReplies.map(reply => renderComment(reply, true))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full mt-6 bg-card/90 shadow-xl border-border/50">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="text-primary h-5 w-5" />
          <h3 className="font-bold text-lg flex-1">
            Comments {totalComments > 0 ? `(${totalComments})` : comments.length > 0 ? `(${comments.length})` : ''}
          </h3>
          {currentUser && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-bold">
                {currentUser.displayName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="text-muted-foreground">Logged in as {currentUser.displayName}</span>
            </div>
          )}
        </div>

        {/* Comment Input */}
        {currentUser ? (
          <div className="mb-6 flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {currentUser.displayName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Share your thoughts about this episode..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit()}
                className="flex-1"
                disabled={submitting}
                maxLength={500}
              />
              <Button
                size="sm"
                onClick={handleCommentSubmit}
                disabled={submitting || !newComment.trim()}
                className="gap-2"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Post
              </Button>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 rounded-lg bg-muted/50 border border-border/50">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground flex-1">
                Please log in to join the conversation and share your thoughts with other anime fans.
              </p>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowLoginPrompt(true)}
                className="gap-2"
              >
                <User className="h-4 w-4" />
                Login to Comment
              </Button>
            </div>
          </div>
        )}

        {showLoginPrompt && !currentUser && (
          <div className="mb-4 text-sm bg-accent/20 border border-accent/30 px-4 py-3 rounded-md">
            <p className="text-accent-foreground">Login to join the conversation! Share your thoughts with other anime fans.</p>
          </div>
        )}

        {/* Comments List */}
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div ref={scrollContainerRef} className="space-y-4 max-h-[600px] overflow-auto pr-1">
            {comments.map(comment => renderComment(comment))}

            {/* Infinite scroll trigger */}
            <div ref={loadMoreRef} className="py-4">
              {loadingMore && (
                <div className="flex justify-center items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Loading more comments...</span>
                </div>
              )}
              {!hasMore && comments.length > 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  No more comments to load
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
