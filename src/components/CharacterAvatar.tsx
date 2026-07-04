import type { CSSProperties, ReactNode } from 'react';

type CharacterAvatarProps = {
  className: string;
  name: string;
  fallback: ReactNode;
  profileImageDataUrl?: string;
  style?: CSSProperties;
};

export function CharacterAvatar({
  className,
  name,
  fallback,
  profileImageDataUrl,
  style,
}: CharacterAvatarProps) {
  return (
    <span className={`${className}${profileImageDataUrl ? ' has-profile-image' : ''}`} style={style}>
      {profileImageDataUrl ? (
        <img src={profileImageDataUrl} alt={name ? `${name} profile` : 'Character profile'} />
      ) : (
        fallback
      )}
    </span>
  );
}
