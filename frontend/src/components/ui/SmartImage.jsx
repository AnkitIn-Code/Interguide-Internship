import React, { useState } from 'react';

/**
 * SmartImage - renders an <img> with a fallback if the image fails to load.
 * Props:
 *   src              - image URL
 *   alt              - alt text
 *   className        - classes for the img element
 *   containerClassName - classes for the wrapper div
 *   fallbackIcon     - render prop: () => <ReactElement> shown when image fails / no src
 */
const SmartImage = ({ src, alt = '', className = '', containerClassName = '', fallbackIcon }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={containerClassName}>
        {fallbackIcon ? fallbackIcon() : (
          <span className="font-bold text-slate-400 text-lg">?</span>
        )}
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      <img
        src={src}
        alt={alt}
        className={className}
        onError={() => setFailed(true)}
      />
    </div>
  );
};

export default SmartImage;
