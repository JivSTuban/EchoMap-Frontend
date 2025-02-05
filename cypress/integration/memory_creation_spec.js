describe('Memory Creation', () => {
  it('should create a memory successfully', () => {
    cy.visit('/create-memory');

    cy.get('input[type="file"]').attachFile('audio.mp3');
    cy.get('input[type="text"]').type('{"lat": 123, "lng": 456}');
    cy.get('button').contains('Create Memory').click();

    cy.contains('Memory created successfully!').should('be.visible');
  });
});
