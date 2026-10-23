import { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children, size = 'lg', headerRight }) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.classList.add('modal-open');
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.classList.remove('modal-open');
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`modal active ${size === 'lg' ? 'modal-lg' : size === 'sm' ? 'modal-sm' : ''}`}
      onClick={(e) => {
        // Stop clicks from bubbling up to the parent modal
        e.stopPropagation(); 
        if (e.target.classList.contains('modal')) onClose();
      }}
    >
      <div className="modal-content" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>{title}</h2>
          <div className="btn-row">
            {headerRight}
            <button className="close-btn" onClick={onClose} aria-label="Close">
              <svg className="icon"><use href="#i-close" /></svg>
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}