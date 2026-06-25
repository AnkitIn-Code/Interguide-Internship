import React from 'react';

function Image({
  src,
  alt = "Image Name",
  className = "",
  ...props
}) {

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = "https://placehold.co/400x300?text=Image+Not+Found";
      }}
      {...props}
    />
  );
}

export default Image;
