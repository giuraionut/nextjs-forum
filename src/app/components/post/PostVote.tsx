'use client';
import { cn } from '@/lib/utils';
import { ExtendedComment, ExtendedPost, Vote } from '@prisma/client';
import { ChevronUp, ChevronDown } from 'lucide-react';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { LoginDialog } from '../shared/LoginDialog';
import { deleteCommentVote, voteOnComment } from '@/actions/commentVoteActions';
import { deletePostVote, voteOnPost } from '@/actions/postVoteActions';

// Utility function to debounce rapid clicks
const debounce = (fn: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

const PostVote = ({
  post,
  vote,
  userId,
}: {
  post: ExtendedPost;
  vote: Vote | null;
  userId: string | null;
}) => {
  // Track both the optimistic UI state and the actual vote object
  const [optimisticVote, setOptimisticVote] = useState({
    count: post.totalUpvotes - post.totalDownvotes,
    voteType: vote ? vote.type : null,
    voteId: vote ? vote.id : null,
  });

  const [isVoting, setIsVoting] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Keep a reference to the current comment
  const commentRef = useRef(post);

  // Update local state when comment or vote changes
  useEffect(() => {
    commentRef.current = post;
    setOptimisticVote({
      count: post.totalUpvotes - post.totalDownvotes,
      voteType: vote ? vote.type : null,
      voteId: vote ? vote.id : null,
    });
  }, [post, vote]);

  const handleVote = async (type: 'UPVOTE' | 'DOWNVOTE') => {
    if (!userId) {
      setIsLoginModalOpen(true);
      return;
    }
    if (isVoting) return;

    const isSameVote = optimisticVote.voteType === type;
    const isSwitchingVote =
      optimisticVote.voteType && optimisticVote.voteType !== type;

    // Calculate vote count changes
    let upvoteDelta = 0;
    let downvoteDelta = 0;

    // Calculate the correct delta values for updating the comment
    if (isSameVote) {
      // Removing the same vote
      if (type === 'UPVOTE') upvoteDelta = -1;
      else downvoteDelta = -1;
    } else if (isSwitchingVote) {
      // Switching vote type
      if (type === 'UPVOTE') {
        upvoteDelta = 1;
        downvoteDelta = -1;
      } else {
        upvoteDelta = -1;
        downvoteDelta = 1;
      }
    } else {
      // New vote
      if (type === 'UPVOTE') upvoteDelta = 1;
      else downvoteDelta = 1;
    }

    // Calculate the correct change in display count
    let countChange = 0;
    if (isSameVote) {
      // Removing vote
      countChange = type === 'UPVOTE' ? -1 : 1;
    } else if (isSwitchingVote) {
      // Switching vote: +1 for new vote and -1 for removing old vote = +2 or -2
      countChange = type === 'UPVOTE' ? 2 : -2;
    } else {
      // New vote
      countChange = type === 'UPVOTE' ? 1 : -1;
    }

    // Update optimistic UI state with the correct count
    const newVoteState = {
      count: optimisticVote.count + countChange,
      voteType: isSameVote ? null : type,
      voteId: optimisticVote.voteId,
    };

    setOptimisticVote(newVoteState);
    setIsVoting(true);

    try {
      // Create a new vote object for the updated comment
      let newVoteObject: Vote | null = null;

      if (isSameVote && optimisticVote.voteId) {
        // Removing existing vote
        await deletePostVote(post.id, optimisticVote.voteId);
        // Vote is being removed, so it becomes null
        newVoteObject = null;
      } else {
        // If switching votes, remove previous vote first
        if (isSwitchingVote && optimisticVote.voteId) {
          await deletePostVote(post.id, optimisticVote.voteId);
        }

        // Cast new vote
        const newVote = await voteOnPost(post.id, type);
        if (newVote) {
          setOptimisticVote((prev) => ({ ...prev, voteId: newVote.id }));
          // Create vote object for the updated comment
          newVoteObject = {
            id: newVote.id,
            type: type,
            userId: userId || '',
            postId: post.id,
            commentId: null,
          };
        }
      }

      // Create the updated vote array for the comment
      const updatedVotes = post.votes
        ? post.votes.filter((v) => v.userId !== userId)
        : [];

      if (newVoteObject) {
        updatedVotes.push(newVoteObject);
      }
    } catch (error) {
      console.error('Vote failed:', error);
      // Rollback on failure
      setOptimisticVote({
        count: post.totalUpvotes - post.totalDownvotes,
        voteType: vote ? vote.type : null,
        voteId: vote ? vote.id : null,
      });
    } finally {
      setIsVoting(false);
    }
  };

  // Create stable reference for debounced function
  const debouncedVoteRef = useRef<(type: 'UPVOTE' | 'DOWNVOTE') => void>(
    () => {}
  );

  useEffect(() => {
    debouncedVoteRef.current = debounce(handleVote, 300);
    return () => {
      // Clean up any pending debounced calls
      if (
        debouncedVoteRef.current &&
        (debouncedVoteRef.current as any).cancel
      ) {
        (debouncedVoteRef.current as any).cancel();
      }
    };
  }, [handleVote]);

  // Safe wrapper for the debounced function
  const triggerVote = useCallback((type: 'UPVOTE' | 'DOWNVOTE') => {
    if (debouncedVoteRef.current) {
      debouncedVoteRef.current(type);
    }
  }, []);

  return (
    <div className={cn('flex items-center gap-2')}>
      {
        <button onClick={() => triggerVote('UPVOTE')} disabled={isVoting}>
          <ChevronUp
            className={cn('text-primary/50 cursor-pointer', {
              'text-blue-500': optimisticVote.voteType === 'UPVOTE',
              'animate-pulse': isVoting,
              'hover:text-primary ': !isVoting,
            })}
          />
        </button>
      }
      <span>{optimisticVote.count}</span>
      <button onClick={() => triggerVote('DOWNVOTE')} disabled={isVoting}>
        <ChevronDown
          className={cn('text-primary/50 cursor-pointer', {
            'text-red-500': optimisticVote.voteType === 'DOWNVOTE',
            'animate-pulse': isVoting,
            'hover:text-primary ': !isVoting,
          })}
        />
      </button>
      <LoginDialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen} />
    </div>
  );
};

export default PostVote;
