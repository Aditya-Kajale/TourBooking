describe('Tour Booking Flow', () => {
  beforeEach(() => {
    // We assume the backend is running and has some data
    cy.visit('/');
  });

  it('should navigate to tour details and show booking modal', () => {
    // 1. Wait for tours to load and click the first one
    cy.get('.group').first().click();

    // 2. Check if we are on the tour detail page
    cy.url().should('include', '/tour/');
    cy.get('h1').should('be.visible');

    // 3. Click "Check Availability" (Booking button)
    // Note: If the button is disabled (housefull), this might fail, 
    // but for testing we assume at least one tour is available.
    cy.contains('button', 'Check Availability').click();

    // 4. Verify booking modal is visible
    cy.contains('Make a Reservation').should('be.visible');
    cy.contains('Total Payable').should('be.visible');

    // 5. Test participant counter
    cy.get('span.font-black.w-4').then(($span) => {
      const initialValue = parseInt($span.text());
      cy.get('button').contains('+').click();
      cy.get('span.font-black.w-4').should('have.text', (initialValue + 1).toString());
    });
  });

  it('should redirect to login if trying to book without being authenticated', () => {
    cy.get('.group').first().click();
    cy.contains('button', 'Check Availability').click();
    cy.contains('Confirm & Pay').click();
    
    // Should be redirected to login
    cy.url().should('include', '/login');
  });
});
