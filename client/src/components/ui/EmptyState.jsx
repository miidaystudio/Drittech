import React from 'react';
import { Inbox } from 'lucide-react';
import './EmptyState.scss';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There is currently no data to display for this view.',
  action = null,
  className = '',
}) => {
  return (
    <div className={`cf-empty-state ${className}`}>
      <div className="cf-empty-state__icon-wrapper">
        <Icon size={32} />
      </div>
      <h4 className="cf-empty-state__title">{title}</h4>
      <p className="cf-empty-state__desc">{description}</p>
      {action && <div className="cf-empty-state__action">{action}</div>}
    </div>
  );
};
