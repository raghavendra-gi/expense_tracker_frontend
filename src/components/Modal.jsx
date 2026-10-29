import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

let openModalsCount = 0;

export default function Modal({ isOpen, onClose, title, children, size = 'lg', headerRight, className = '' }) {
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
    openModalsCount++;
    document.body.classList.add('modal-open');
    
    return () => {
      document.removeEventListener('keydown', handler);
      openModalsCount--; 
      if (openModalsCount === 0) {
        document.body.classList.remove('modal-open');
      } // 👈 Added missing closing brace here
    };  // 👈 This closes the return function
  }, [isOpen]);

  if (!isOpen) return null;

  // 👈 Added space after "return" and comma after "</div>"
  return createPortal(
    <div
      className={`modal active ${size === 'lg' ? 'modal-lg' : size === 'sm' ? 'modal-sm' : ''}`}
      onClick={(e) => {
        // Stop clicks from bubbling up to the parent modal
        e.stopPropagation(); 
        if (e.target.classList.contains('modal')) onClose();
      }}
    >
      <div className={`modal-content ${className}`} role="dialog" aria-modal="true">
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
    </div>,
    document.body 
  );
}