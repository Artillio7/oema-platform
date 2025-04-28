import admin from '../fixtures/admin.json'

beforeEach(() => {
    
    cy.session(
        admin.email,
        () => {
            cy.visit('/orange-experts')
            cy.get('#email').type(admin.email)
            cy.get('#password').type(Cypress.env('ADMIN_PASSWORD'))
            cy.get('#login').click()
            cy.url().should(url => {
                expect(url).to.match(/\/orange-experts\/(application|dashboard)$/)
            })
        },
        {
            validate: () => {
                cy.getCookie('oema').should('exist')
            },
            cacheAcrossSpecs: true,       
        }
    )
})