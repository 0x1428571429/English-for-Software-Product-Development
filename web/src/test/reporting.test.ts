import { describe, expect, it } from 'vitest'
import {
  REPORTING_FRAMEWORKS,
  REPORTING_SCENARIOS,
  reportingFramework,
  reportingScenarioById,
} from '../data/reporting'

describe('reporting lab', () => {
  it('ships four complete reporting scenarios', () => {
    expect(REPORTING_SCENARIOS).toHaveLength(4)
    for (const scenario of REPORTING_SCENARIOS) {
      expect(scenario.sections.map((section) => section.key)).toEqual([
        'conclusion',
        'evidence',
        'risk',
        'ask',
      ])
      expect(scenario.phrases.length).toBeGreaterThanOrEqual(3)
      for (const section of scenario.sections) {
        expect(section.placeholderZh.length, `${scenario.id}/${section.key}`).toBeGreaterThan(0)
        expect(section.exampleEn.length, `${scenario.id}/${section.key}`).toBeGreaterThan(0)
      }
      for (const phrase of scenario.phrases) {
        expect(phrase.en.length, scenario.id).toBeGreaterThan(0)
        expect(phrase.zh.length, scenario.id).toBeGreaterThan(0)
      }
    }
  })

  it('maps every scenario to an existing framework', () => {
    const mapping: Record<string, string> = {
      'weekly-update': 'bluf',
      'incident-review': 'incident',
      'promotion-case': 'star',
      'budget-ask': 'scqa',
    }
    for (const scenario of REPORTING_SCENARIOS) {
      expect(reportingFramework(mapping[scenario.id]), scenario.id).toBeTruthy()
    }
    expect(REPORTING_FRAMEWORKS).toHaveLength(4)
    expect(REPORTING_FRAMEWORKS.every((item) => item.formulaZh.length > 0)).toBe(true)
  })

  it('looks up scenarios by id and rejects unknown ids', () => {
    expect(reportingScenarioById('incident-review')?.titleZh).toBe('线上事故复盘')
    expect(reportingScenarioById('nope')).toBeUndefined()
    expect(reportingScenarioById(undefined)).toBeUndefined()
    expect(reportingFramework('nope')).toBeUndefined()
  })
})
