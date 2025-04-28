import user from '../fixtures/user.json'

describe('User account', () => {
  it('creates a new user account', () => {
    cy.visit('/orange-experts/dashboard/users/create-account')
    cy.get('#email').type(user.email)
    cy.get('#password').type(user.password)
    cy.get('#repeat_password').type(user.password)
    cy.get('#create-account-btn').click()
  })

  it('should delete an existing user account', () => {
    cy.visit('/orange-experts/dashboard/users')
    cy.get('.form-control').type(user.email)
    cy.wait(1000)
    cy.get('.odd > .select-checkbox').click()
    cy.get('.dt-buttons > .btn-group > .btn').click()
    cy.get('.dt-button-collection > div > :nth-child(2) > span').click()
    cy.get('#confirm').type('delete the account(s)')
    cy.get('#delete-accounts').click()
    cy.wait(500)
  })
})