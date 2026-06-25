import React from 'react';

const Skeleton = ({ className = '' }) => (
  <div
    className={`animate-pulse bg-slate-200 rounded ${className}`}
  />
);

export default Skeleton;
