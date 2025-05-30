import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

export default function CommunityHeader({
  name,
  image,
  textSize,
}: {
  name: string;
  image?: string;
  textSize?: string;
}) {
  return (
    <Link
      href={`/community/${name}`}
      className={
        'flex gap-2 items-center hover:text-primary text-primary/50 transition-colors'
      }
    >
      <Image
        src={image || '/defaultCommunityImage.png'}
        alt={name}
        width={32}
        height={32}
        className='w-8 h-8 rounded-full object-cover ring-2 ring-accent-foreground flex-shrink-0'
      />
      <span className={cn('text-xs font-bold', textSize)}>{name}</span>
    </Link>
  );
}
