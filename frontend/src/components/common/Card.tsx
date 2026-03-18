/**
 * Custom Card component with hover and click states.
 * Wraps React Bootstrap Card with additional styling options.
 */

import React from 'react';
import { Card as BSCard } from 'react-bootstrap';
import type { CardProps } from 'react-bootstrap';
import './Card.css';

/**
 * Props for the Card component.
 */
interface CustomCardProps extends CardProps {
  /** Adds hover effect styling */
  hoverable?: boolean;
  /** Makes the card clickable with cursor pointer */
  clickable?: boolean;
  /** Callback fired when card is clicked */
  onCardClick?: () => void;
}

/**
 * Card container component with optional hover and click states.
 * @example
 * ```tsx
 * <Card hoverable onCardClick={handleClick}>
 *   <CardHeader>Title</CardHeader>
 *   <CardBody>Content here</CardBody>
 * </Card>
 * ```
 */
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

/**
 * Card header component with custom styling.
 */
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

/**
 * Card body component with custom styling.
 */
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

/**
 * Card footer component with custom styling.
 */
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
