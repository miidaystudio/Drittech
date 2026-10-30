import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import './Modal.scss';

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = '560px',
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="cf-modal-overlay" onClick={onClose}>
      <div
        className="cf-modal"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="cf-modal__header">
          <div>
            <h3 className="cf-modal__title">{title}</h3>
            {subtitle && <p className="cf-modal__subtitle">{subtitle}</p>}
          </div>
          <button className="cf-modal__close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="cf-modal__content">{children}</div>

        {footer && <div className="cf-modal__footer">{footer}</div>}
      </div>
    </div>
  );
};
