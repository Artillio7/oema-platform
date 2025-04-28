/*
import user from '../fixtures/user.json'

describe('Application form submission by an applicant', () => {
    it("submits a new application", () => {
        // List of available communities
        const communities = [
            'BigDataAIApp',
            'EngEnvApp',
            'NetworkOpsApp',
            'NofApp',
            'SecurityApp',
            'SoftwareApp',
            'SolutionsContSrvApp',
            'CommSrvApp'
        ]

        // Select a random community
        const randomCommunity = communities[Math.floor(Math.random() * communities.length)]

        cy.visit('/application')

        cy.get('.cs-placeholder').click()
        cy.get(`#${randomCommunity}`).click()
        cy.get('#get-started').click()
        cy.get('#start-form').click()
        //cy.reload()
        cy.get('#directory-url').clear().type(user.directoryUrl)
        cy.get('#firstname').clear().type(user.firstname).should('have.value', user.firstname)
        cy.get('#lastname').clear().type(user.lastname).should('have.value', user.lastname)
        cy.get('#gender').select(user.gender).should('have.value', user.gender)
        cy.get('#birthday').clear().type(user.birthday).should('have.value', user.birthday)
        cy.get('#cuid').clear().type(user.cuid).should('have.value', user.cuid)
        cy.get('#phone').clear().type(user.phone).should('have.value', user.phone)
        cy.get('#classification').select(user.classification).should('have.value', user.classification)
        cy.get('#entity').clear().type(user.entity).should('have.value', user.entity)
        cy.get('#country').select(user.country).should('have.value', user.country)
        cy.get('#location').clear().type(user.location).should('have.value', user.location)
        cy.get('#manager-firstname').clear().type(user.managerFirstname).should('have.value', user.managerFirstname)
        cy.get('#manager-lastname').clear().type(user.managerLastname).should('have.value', user.managerLastname)
        cy.get('#manager-email').clear().type(user.managerEmail).should('have.value', user.managerEmail)
        cy.get('#hr-firstname').clear().type(user.hrFirstname).should('have.value', user.hrFirstname)
        cy.get('#hr-lastname').clear().type(user.hrLastname).should('have.value', user.hrLastname)
        cy.get('#hr-email').clear().type(user.hrEmail).should('have.value', user.hrEmail)

        //cy.wait(700)
        //cy.clearCookies()
        cy.get('#next-form-step').click()

        const selectors = {
            'inputText': ['#it-expert-duration', '#it-expert-time'],
            'fileUpload': ['.file-upload-input'],
            'checkboxes': ['#c-emc', '#c-emf', '#c-ecodesign', '#c-recyclewaste', '#c-ict', '#c-climatic', '#c-energyenv',
                '#c-renewable', '#c-purchase', '#c-operation', '#c-netdatacenter', '#c-greenmetering',
                '#c-buildingprotect', '#c-greenmarketing', '#c-engineering-arch', '#c-legal', '#c-ai-core',
                '#c-data-valorization', '#c-e2e-app-sys', '#c-experience-design', '#c-others'],
            'selectDropdown': ['#sl-english-level', '#sl-market-orientation'],
            'radioButtons': ['#r-contribute-no', '#r-contribute-yes'],
            'dropzone': ['#multiple-uploads'],
            'buttons': ['#next-form-step', '#get-started', '#start-form'],
            'batteryCheckboxes': ['#battery-0-b-agile', '#battery-1-b-agile', '#battery-2-b-agile', '#battery-3-b-agile', '#battery-4-b-agile'],
            'fileDownloadButton': ['#uploads > .step-icon > .fa'],
        }

        let testedDataTypes = []

        function testDataType(dataType) {
            selectors[dataType].forEach(selector => {
                if (!testedDataTypes.includes(dataType)) {
                    cy.get('body').then($body => {
                        if ($body.find(selector).length > 0) {
                            cy.get(selector, { timeout: 1000 })
                                .then($element => {
                                    if ($element.is(':visible')) {
                                        performActionBasedOnType(dataType, cy.wrap($element))
                                        testedDataTypes.push(dataType)
                                    } else {
                                        cy.log(`${dataType} with selector ${selector} is found but not visible.`)
                                    }
                                })
                        } else {
                            cy.log(`${dataType} with selector ${selector} not found on the page.`)
                        }
                    })
                }
            })
        }

        function performActionBasedOnType(dataType, element) {
            switch (dataType) {
                case 'inputText':
                    element.type('Test input').should('have.value', 'Test input')
                    break
                case 'fileUpload':
                    element.invoke('val', '')
                    cy.wait(1000)
                    cy.fixture(user.pdfFileName, 'base64').then(fileContent => {
                        const blob = Cypress.Blob.base64StringToBlob(fileContent, 'application/pdf')
                        const testFile = new File([blob], user.pdfFileName, { type: 'application/pdf' })
                        element.then(input => {
                            const dataTransfer = new DataTransfer()
                            dataTransfer.items.add(testFile)
                            input[0].files = dataTransfer.files
                            input[0].dispatchEvent(new Event('change', { bubbles: true }))
                        })
                    })
                    element.should('have.value', `C:\\fakepath\\${user.pdfFileName}`)
                    break
                case 'checkboxes':
                    element.check({ force: true }).should('be.checked')
                    break
                case 'batteryCheckboxes':
                    element.check({ force: true }).should('be.checked')
                    break
                case 'radioButtons':
                    element.check({ force: true }).should('be.checked')
                    break
                case 'selectDropdown':
                    element.select({ "force": true }).should('be.selected')
                    break
                case 'dropzone':
                    cy.fixture(user.pdfFileName, 'base64').then(fileContent => {
                        const blob = Cypress.Blob.base64StringToBlob(fileContent, 'application/pdf')
                        const testFile = new File([blob], user.pdfFileName, { type: 'application/pdf' })
                        element.then(input => {
                            const dataTransfer = new DataTransfer()
                            dataTransfer.items.add(testFile)
                            input[0].files = dataTransfer.files
                            input[0].dispatchEvent(new Event('change', { bubbles: true }))
                        })
                    })
                    break
                case 'buttons':
                    element.click()
                    break
                default:
                    element.click({ force: true })
                    break
            }
        }

        function processFormPage() {
            Object.keys(selectors).forEach(dataType => {
                testDataType(dataType)
            })

            cy.get('body').then($body => {
                if ($body.find('#next-form-step').length) {
                    cy.get('#next-form-step').click()
                    cy.wait(1000)
                    processFormPage()
                } else {
                    cy.log('No more pages or next button not found. Trying to export PDF.')
                    cy.get('button.export-pdf').click()
                    cy.log('Export PDF button clicked.')
                }
            })
        }

        processFormPage()
    })

})*/
