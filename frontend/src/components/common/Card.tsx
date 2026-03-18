import React from 'react';
import { Card as BSCard } from 'react-bootstrap';
import type { CardProps } from 'react-bootstrap';
import './Card.css';

interface CustomCardProps extends CardProps {
  hoverable?: boolean;
  clickable?: boolean;
  onCardClick?: () => void;
}

export function Card({
  children,
  hoverable = false,
  clickable = false,
  onCardClick,
  className = '',
  ...props
}: CustomCardProps) {
  return (
    <BSCard
      className={`custom-card ${hoverable ? 'custom-card--hoverable' : ''} ${clickable ? 'custom-card--clickable' : ''} ${className}`}
      onClick={clickable ? onCardClick : undefined}
      {...props}
    >
      {children}
    </BSCard>
  );
}

export function CardHeader({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <BSCard.Header className={`custom-card__header ${className}`} {...props}>
      {children}
    </BSCard.Header>
  );
}

export function CardBody({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <BSCard.Body className={`custom-card__body ${className}`} {...props}>
      {children}
    </BSCard.Body>
  );
}

export function CardFooter({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <BSCard.Footer className={`custom-card__footer ${className}`} {...props}>
      {children}
    </BSCard.Footer>
  );
}

export default Card;
