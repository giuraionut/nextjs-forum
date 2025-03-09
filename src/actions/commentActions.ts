'use server'
import db from "@/lib/db";
import { getSessionUserId, handleServerError } from "./actionUtils";
import { Comment, ExtendedComment } from "@prisma/client"
import { getTotalCommentDownvotes, getTotalCommentUpvotes } from "./voteUtils";
import { updatePostTotalComments } from "./postActions";
import { revalidatePath, revalidateTag } from "next/cache";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";

export const createComment = async (comment: Comment): Promise<ExtendedComment | null> => {
    try {
        const userId = await getSessionUserId();
        comment.authorId = userId;
        delete (comment as { id?: string }).id;
        const newComment = await db.comment.create({
            data: comment,
            include: {
                author: true,
                replies: true,
                votes: true
            },
        });

        await updatePostTotalComments(comment.postId);
        revalidateTag(`comments-${comment.postId}`)

        return newComment;
    }
    catch (error) {
        handleServerError(error, 'creating new comment.');
        return null;
    }
}

export const addReply = async (reply: Comment, parent: Comment): Promise<ExtendedComment | null> => {
    try {
        const newReply = await createComment(reply);
        revalidateTag(`replies-${parent.id}`)

        return newReply;
    }
    catch (error) {
        handleServerError(error, 'adding reply.');
        return null;
    }
}

export const updateComment = async (comment: Comment): Promise<ExtendedComment | null> => {
    try {
        const updatedComment: ExtendedComment = await db.comment.update({
            where: { id: comment.id }, data: comment, include: {
                author: true,
                replies: true,
                votes: true,
            },
        });
        updatedComment.replies = await fetchRepliesRecursively(updatedComment.id);
        revalidateTag(`comments-${comment.postId}`)
        revalidateTag(`replies-${comment.id}`);

        return updatedComment;
    }
    catch (error) {
        handleServerError(error, 'updating comment.');
        return null;
    }
}

export const readComment = async (commentId: string): Promise<ExtendedComment | null> => {
    'use cache'
    try {
        const parentComment = await db.comment.findFirst({
            where: { id: commentId },
            include: {
                author: true,
                votes: true,
                replies: true
            },
        });

        if (!parentComment) return null;

        // Fetch all replies recursively
        parentComment.replies = await fetchRepliesRecursively(parentComment.id);

        return parentComment;
    } catch (error) {
        handleServerError(error, 'reading comment');
        return null;
    }
};


export const readCommentsByPost = async (
    postId: string
): Promise<ExtendedComment[] | null> => {
    'use cache'
    cacheTag(`comments-${postId}`);
    try {
        // Fetch the top-level comments for the post
        const topLevelComments = await db.comment.findMany({
            where: { postId, parentId: null },
            include: {
                author: true,
                votes: true,
            },
        });

        // Recursively fetch replies for each top-level comment
        const commentsWithReplies = await Promise.all(
            topLevelComments.map(async (comment: ExtendedComment) => {
                comment.replies = await fetchRepliesRecursively(comment.id);
                return comment;
            })
        );

        return commentsWithReplies;
    } catch (error) {
        handleServerError(error, 'reading comments by post');
        return null;
    }
};

export const fetchRepliesRecursively = async (parentId: string): Promise<ExtendedComment[]> => {
    'use cache'
    cacheTag(`replies-${parentId}`);
    try {

        const replies = await db.comment.findMany({
            where: { parentId },
            include: {
                author: true,
                votes: true,
                replies: true, // Immediate replies
            },
        });

        // Recursively fetch replies for each reply
        return Promise.all(
            replies.map(async (reply) => {
                reply.replies = await fetchRepliesRecursively(reply.id); // Recursively fetch nested replies
                return reply;
            })
        );
    }
    catch (error) {
        handleServerError(error, 'fetching replies recursively.');
        return [];
    }
};


export const deleteComment = async (comment: ExtendedComment): Promise<ExtendedComment | null> => {
    try {
        const deleted = await db.comment.update({
            where: { id: comment.id },
            data: { isDeleted: true },
            include: {
                author: true,
                replies: true,
                votes: true
            },
        });
        revalidateTag(`comments-${deleted.postId}`)
        revalidateTag(`replies-${deleted.id}`);

        return deleted;
    }
    catch (error) {
        handleServerError(error, 'deleting comment');
        return null;
    }
}

export const updateCommentVotes = async (commentId: string): Promise<ExtendedComment | null> => {
    try {

        const totalUpvotes = await getTotalCommentUpvotes(commentId);
        const totalDownVotes = await getTotalCommentDownvotes(commentId);

        return await db.comment.update({
            where: { id: commentId },
            data: { totalDownvotes: totalDownVotes, totalUpvotes: totalUpvotes }
            , include: {
                author: true,
                replies: true,
                votes: true
            },
        });
    }
    catch (error) {
        handleServerError(error, 'updating post vote.');
        return null;
    }
}