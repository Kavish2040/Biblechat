/* src/components/Captions.jsx */

import React, { useEffect, useState } from 'react';
import './Captions.css'; // Ensure this CSS file exists

const Captions = ({ caption }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (caption) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [caption]);

  return (
    <div
      className={`captions-container ${visible ? 'show' : ''}`}
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="caption-text">{caption}</span>
    </div>
  );
};

export default Captions;
