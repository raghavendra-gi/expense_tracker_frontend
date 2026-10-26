import { useEffect, useRef } from 'react';

export default function Modal({ isOpen, onClose, title, children, size = 'lg', headerRight }) {
  // 1. Store the latest onClose function in a ref so it doesn't trigger re-renders
  const onCloseRef = useRef(onClose);

  // 2. Keep the ref updated if the parent passes a new onClose
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // 3. The main effect only depends on isOpen now
  useEffect(() => {
    if (!isOpen) return;
    
    const handler = (e) => { 
      if (e.key === 'Escape') onCloseRef.current(); 
    };
    
    document.addEventListener('keydown', handler);
    document.body.classList.add('modal-open');
    
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]); // 👈 Only isOpen is here now

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