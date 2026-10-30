import React from 'react';
import './Skeleton.scss';

export const Skeleton = ({ width, height, radius = '8px', className = '' }) => {
  return (
    <div
      className={`cf-skeleton ${className}`}
      style={{
        width: width || '100%',
        height: height || '20px',
        borderRadius: radius,
      }}
    />
  );
};
