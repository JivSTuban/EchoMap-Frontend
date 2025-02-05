describe('Geolocation', () => {
  it('should mock geolocation', () => {
    cy.visit('/map');

    cy.window().then((win) => {
      cy.stub(win.navigator.geolocation, 'getCurrentPosition').callsFake((cb) => {
        return cb({ coords: { latitude: 123, longitude: 456 } });
      });
    });

    cy.contains('Map').should('be.visible');
  });
});
