import { commentsApi } from './backendApi';

// Comment interface matching backend response
export interface Comment {
    id: string;
    content: string;
    userId: string;
    episodeId: string;
    parentId: string | null;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        displayName: string;
        avatarUrl?: string | null;
    };
    replyCount?: number;
}

export interface CommentsResponse {
    success: boolean;
    data: {
        comments: Comment[];
        pagination?: {
            currentPage: number;
            totalPages: number;
            totalComments: number;
            hasMore: boolean;
        };
    };
    message?: string;
}

export interface RepliesResponse {
    success: boolean;
    data: {
        replies: Comment[];
    };
    message?: string;
}

export interface CreateCommentPayload {
    episodeId?: string;
    content: string;
    parentId?: string | null;
    contentType?: string;
    contentId?: string;
}

export interface CreateCommentResponse {
    success: boolean;
    message: string;
    data: Comment;
}

// Get comments for an episode
export const getCommentsByEpisode = async (
    episodeId: string,
    page = 1,
    limit = 20
): Promise<CommentsResponse> => {
    try {
        const response = await commentsApi.get(
            `/api/comments/episode/${episodeId}`,
            { params: { page, limit } }
        );
        return response.data;
    } catch (error: any) {
        console.error('Error fetching comments:', error);
        throw error.response?.data || error;
    }
};

// Get comments for a blog post
export const getCommentsByBlog = async (
    blogId: string,
    page = 1,
    limit = 20
): Promise<CommentsResponse> => {
    try {
        const response = await commentsApi.get(
            `/api/comments/blog/${blogId}`,
            { params: { page, limit } }
        );
        return response.data;
    } catch (error: any) {
        console.error('Error fetching blog comments:', error);
        throw error.response?.data || error;
    }
};

// Get replies for a comment
export const getReplies = async (commentId: string): Promise<RepliesResponse> => {
    try {
        const response = await commentsApi.get(`/api/comments/${commentId}/replies`);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching replies:', error);
        throw error.response?.data || error;
    }
};

// Create a new comment or reply
export const createComment = async (
    payload: CreateCommentPayload
): Promise<CreateCommentResponse> => {
    try {
        const response = await commentsApi.post(
            '/api/comments',
            payload
        );
        return response.data;
    } catch (error: any) {
        console.error('Error creating comment:', error);
        throw error.response?.data || error;
    }
};

// Update a comment
export const updateComment = async (
    commentId: string,
    content: string
): Promise<CreateCommentResponse> => {
    try {
        const response = await commentsApi.patch(
            `/api/comments/${commentId}`,
            { content }
        );
        return response.data;
    } catch (error: any) {
        console.error('Error updating comment:', error);
        throw error.response?.data || error;
    }
};

// Delete a comment
export const deleteComment = async (
    commentId: string
): Promise<{ success: boolean; message: string }> => {
    try {
        const response = await commentsApi.delete(
            `/api/comments/${commentId}`
        );
        return response.data;
    } catch (error: any) {
        console.error('Error deleting comment:', error);
        throw error.response?.data || error;
    }
};

