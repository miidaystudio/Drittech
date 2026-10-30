import React from 'react';
import clsx from 'clsx';

export const Badge = ({ status = 'waiting', children, className = '' }) => {
  const displayStatus = children || status.replace('_', ' ');

  return (
    <span className={clsx('badge', `badge--${status}`, className)}>
      <span className="badge__dot" />
      {displayStatus}
    </span>
  );
};
