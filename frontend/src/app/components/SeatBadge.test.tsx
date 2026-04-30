import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SeatBadge } from './SeatBadge';

describe('SeatBadge Component', () => {
  it('renders housefull state correctly', () => {
    render(<SeatBadge is_housefull={true} max_people={10} bookings_count={10} />);
    
    // Should display "Housefull"
    const textNode = screen.getByText(/Housefull/i);
    expect(textNode).toBeInTheDocument();
    
    // Should have red styling (represented by the bg-destructive/10 class)
    expect(textNode.closest('span')).toHaveClass('bg-destructive/10');
  });

  it('renders available seats correctly', () => {
    render(<SeatBadge max_people={10} bookings_count={5} />);
    
    // Should display "5" and "/ 10 left"
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('/ 10 left')).toBeInTheDocument();
  });
});
