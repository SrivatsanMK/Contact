import { useState } from 'react';
import config from '../config';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function ProfileHeader() {
  const [imgError, setImgError] = useState(false);

  return (
    <header className="profile-header">
      <div className="profile-photo-wrapper">
        <div className="profile-photo-halo" />
        <div className="profile-photo-ring" />
        {!imgError ? (
          <img
            className="profile-photo"
            src={config.profilePhoto}
            alt={`${config.name} profile`}
            onError={() => setImgError(true)}
            loading="eager"
            width={110}
            height={110}
          />
        ) : (
          <div className="profile-initials" aria-label={config.name}>
            {getInitials(config.name)}
          </div>
        )}
      </div>
      <h1 className="profile-name">{config.name}</h1>
      <p className="profile-tagline">{config.tagline}</p>
    </header>
  );
}
