import analyse from '../analyser'
import usage from '../constants'
import knownLicenses from '../known-licenses.js'

describe('analyser', () => {
  describe('when licence is not defined in knownLicenses', () => {
    it('should return usage is not cleared', () => {
      let module = {
        'licenses': 'Unknown Licence'
      }

      let result = analyse(module)

      expect(result.usage).toBe(usage.unclear)
    })
  })
  describe('when license is known', () => {
    describe('when license can be used', () => {
      const allowedLicense = 'Allowed License'
      const allowedLicenseAction = 'Redistirubute the licenses text and name the author.'
      const forbiddenLicense = 'Forbidden License'
      beforeAll(() => {
        knownLicenses.getLicenses = jest.fn(() => {
            return {
              'Allowed License': {
                usage: usage.allowed,
                conditions: allowedLicenseAction
              },
              'Forbidden License': {
                usage: usage.forbidden
              }
            }
          }
        )
      })

      it('should return usage is allowed for allowed license', () => {
        let module = {
          'licenses': allowedLicense
        }

        let result = analyse(module)

        expect(result.usage).toBe(usage.allowed)
      })

      it('should return usage is forbidden for forbidden license', () => {
        let module = {
          'licenses': forbiddenLicense
        }

        let result = analyse(module)

        expect(result.usage).toBe(usage.forbidden)
      })

      it('should return required action for license', () => {
        let module = {
          'licenses': allowedLicense
        }

        let result = analyse(module)

        expect(result.conditions).toBe(allowedLicenseAction)
      })
    })
  })
  describe('when license is deduced from another file than package.json', () => {
    const allowedLicense = 'Allowed License*'
    beforeAll(() => {
      knownLicenses.getLicenses = jest.fn(() => {
          return {
            'Allowed License': {
              usage: usage.allowed,
            }
          }
        }
      )
    })
    it('should remove the asterisk at the end of the license name', () => {
      let module = {
        'licenses': allowedLicense
      }

      let result = analyse(module)

      expect(result.usage).toBe(usage.allowed)
    })
  })
})
