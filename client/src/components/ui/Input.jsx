import React from 'react';
import clsx from 'clsx';
import './Input.scss';

export const Input = React.forwardRef(
  (
    {
      label,
      error,
      helperText,
      icon: Icon,
      type = 'text',
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name || Math.random().toString(36).substring(7);

    return (
      <div className={clsx('cf-input-group', error && 'cf-input-group--error', className)}>
        {label && (
          <label htmlFor={inputId} className="cf-input-label">
            {label}
          </label>
        )}
        <div className="cf-input-wrapper">
          {Icon && <Icon className="cf-input-icon" size={18} />}
          <input
            id={inputId}
            ref={ref}
            type={type}
            className={clsx('cf-input', Icon && 'cf-input--with-icon')}
            {...props}
          />
        </div>
        {error ? (
          <span className="cf-input-error">{error}</span>
        ) : helperText ? (
          <span className="cf-input-helper">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
