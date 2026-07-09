import React from 'react';

const SectorTag = ({ sector }) => {
  if (!sector) return null;

  return (
    <div
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        color: 'var(--text-secondary)',
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: '500',
        border: '1px solid var(--border-color)',
        marginLeft: '8px'
      }}
    >
      {sector}
    </div>
  );
};

export default SectorTag;
