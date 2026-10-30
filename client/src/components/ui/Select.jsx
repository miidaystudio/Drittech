import React from 'react';
import clsx from 'clsx';
import './Input.scss';

export const Select = React.forwardRef(
  ({ label, error, options = [], className = '', id, children, ...props }, ref) => {
    const selectId = id || props.name || Math.random().toString(36).substring(7);

    return (
      <div className={clsx('cf-input-group', error && 'cf-input-group--error', className)}>
        {label && (
          <label htmlFor={selectId} className="cf-input-label">
            {label}
          </label>
        )}
        <select id={selectId} ref={ref} className="cf-input" {...props}>
          {options.length > 0
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error && <span className="cf-input-error">{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
