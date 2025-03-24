import React from 'react';
import Image from 'next/image';
import JoinCommunityButton from './JoinCommunityButton';
import { ExtendedCommunity } from '@prisma/client';
import { getSessionUserId } from '@/actions/actionUtils';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type CommunityBannerProps = {
  community: ExtendedCommunity;
  userId: string | null;
  isMemberOfCommunity: boolean;
  className?: string;
};

const CommunityBanner = async ({
  community,
  isMemberOfCommunity,
  className,
}: CommunityBannerProps) => {
  console.log('community banner');
  const userId = await getSessionUserId();

  return (
    <div
      className={cn('border rounded-lg flex flex-col gap-4 h-fit', className)}
    >
      <div className='relative flex gap-4 rounded-t-lg p-4 w-full'>
        <div className='flex flex-col gap-4 items-center'>
          {community.image && <Image
            src={community.image}
            className='w-20 h-20 rounded-full object-contain'
            alt={community.name}
            width={200}
            height={200}
          />}
          <JoinCommunityButton
            communityId={community.id}
            isMemberOfCommunity={isMemberOfCommunity}
            userId={userId}
          />
        </div>
        <div className='w-full flex flex-col'>
          <div className='text-4xl font-bold'>{community.name}</div>
          <div className='flex items-center justify-between w-full'>
            <div>
              Created by{' '}
              <Link
                href={`/user/${community.author?.name}`}
                className='text-primary/50 hover:text-primary transition-colors'
              >
                {community.author?.name}
              </Link>{' '}
            </div>
          </div>
        </div>
        <div className='absolute inset-0 bg-accent -z-10 rounded-t-md'></div>
      </div>
      <div className='pb-4 px-4'>
        <div>{community.description}</div>
      </div>
    </div>
  );
};

export default CommunityBanner;
