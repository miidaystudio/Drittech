import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';
import './Button.scss';

export const Button = ({
  children,
  variant = 'primary', // primary | secondary | outline | danger | ghost
  size = 'md', // sm | md | lg
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  type = 'button',
  onClick,
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={clsx(
        'cf-button',
        `cf-button--${variant}`,
        `cf-button--${size}`,
        loading && 'cf-button--loading',
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="cf-button__spinner" size={size === 'sm' ? 14 : 18} />
      ) : Icon ? (
        <Icon className="cf-button__icon" size={size === 'sm' ? 14 : 18} />
      ) : null}
      <span className="cf-button__text">{children}</span>
    </button>
  );
};
