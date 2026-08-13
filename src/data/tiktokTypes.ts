export type TikTokProduct = {
  id: string;
  name: string;
  brand: string;
  price: string;
  description: string;
  variants?: string[];
  creatorName?: string;
  image: string;
};

export type TikTokVideo = {
  id: string;
  title: string;
  creator: string;
  creatorHandle: string;
  /** Short creator descriptor shown under the handle, e.g. "Street-food storyteller" */
  creatorDescriptor?: string;
  duration: number;
  thumbnail: string;
  products?: TikTokProduct[];
};

export type TikTokSingleVideoCard = {
  variant: 'single-video';
  id: string;
  ambientLabel: string;
  title: string;
  subtitle: string;
  /** Specific reason why this is being surfaced, e.g. "2.4M people watched this in 24 hours" */
  reason: string;
  backgroundImage: string;
  ctaLabel: string;
  video: TikTokVideo;
};

export type TikTokCollectionCard = {
  variant: 'collection';
  id: string;
  ambientLabel: string;
  title: string;
  subtitle: string;
  /** Specific reason why this collection is being surfaced */
  reason: string;
  backgroundImage: string;
  ctaLabel: string;
  sessionDurationSeconds: number;
  videos: TikTokVideo[];
  /** For creator collections: the featured creator's display name */
  creatorDisplayName?: string;
  /** For creator collections: short creator descriptor */
  creatorDescriptor?: string;
  creator?: string;
};

export type TikTokCard = TikTokSingleVideoCard | TikTokCollectionCard;
