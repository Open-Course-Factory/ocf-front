import { describe, it, expect } from 'vitest'
import {
  field,
  buildFieldList,
  fieldPresets,
  systemFields,
  FieldBuilder,
  type FieldConfig
} from '../../src/utils/fieldBuilder'

describe('fieldBuilder', () => {
  describe('field() factory', () => {
    it('creates a FieldBuilder with default config', () => {
      const [name, config] = field('name').build()
      expect(name).toBe('name')
      expect(config.type).toBe('input')
      expect(config.display).toBe(true)
      expect(config.toBeSet).toBe(false)
      expect(config.toBeEdited).toBe(false)
    })

    it('uses fieldName as default label when no label provided', () => {
      const [, config] = field('username').build()
      expect(config.label).toBe('username')
    })

    it('uses provided label when given', () => {
      const [, config] = field('email', 'Email Address').build()
      expect(config.label).toBe('Email Address')
    })
  })

  describe('type setters', () => {
    it('.input() sets type to input', () => {
      const [, config] = field('x').input().build()
      expect(config.type).toBe('input')
    })

    it('.textarea() sets type to textarea', () => {
      const [, config] = field('x').textarea().build()
      expect(config.type).toBe('textarea')
    })

    it('.select() sets type to select', () => {
      const [, config] = field('x').select().build()
      expect(config.type).toBe('select')
    })

    it('.searchableSelect() sets type to searchable-select', () => {
      const [, config] = field('x').searchableSelect().build()
      expect(config.type).toBe('searchable-select')
    })

    it('.checkbox() sets type to checkbox', () => {
      const [, config] = field('x').checkbox().build()
      expect(config.type).toBe('checkbox')
    })

    it('.number() sets type to number', () => {
      const [, config] = field('x').number().build()
      expect(config.type).toBe('number')
    })

    it('.date() sets type to date', () => {
      const [, config] = field('x').date().build()
      expect(config.type).toBe('date')
    })

    it('.email() sets type to email', () => {
      const [, config] = field('x').email().build()
      expect(config.type).toBe('email')
    })

    it('.type() sets an arbitrary type string', () => {
      const [, config] = field('x').type('custom-widget').build()
      expect(config.type).toBe('custom-widget')
    })
  })

  describe('edit permissions', () => {
    it('.editable() sets toBeSet=true AND toBeEdited=true', () => {
      const [, config] = field('x').editable().build()
      expect(config.toBeSet).toBe(true)
      expect(config.toBeEdited).toBe(true)
    })

    it('.creatable() sets toBeSet=true only', () => {
      const [, config] = field('x').creatable().build()
      expect(config.toBeSet).toBe(true)
      expect(config.toBeEdited).toBe(false)
    })

    it('.updatable() sets toBeEdited=true only', () => {
      const [, config] = field('x').updatable().build()
      expect(config.toBeSet).toBe(false)
      expect(config.toBeEdited).toBe(true)
    })

    it('.readonly() sets both toBeSet and toBeEdited to false', () => {
      const [, config] = field('x').editable().readonly().build()
      expect(config.toBeSet).toBe(false)
      expect(config.toBeEdited).toBe(false)
    })
  })

  describe('validation', () => {
    it('.required() sets required=true', () => {
      const [, config] = field('x').required().build()
      expect(config.required).toBe(true)
    })

    it('.required(false) sets required=false', () => {
      const [, config] = field('x').required(false).build()
      expect(config.required).toBe(false)
    })
  })

  describe('visibility', () => {
    it('.hidden() sets display=false', () => {
      const [, config] = field('x').hidden().build()
      expect(config.display).toBe(false)
    })

    it('.visible() sets display=true', () => {
      const [, config] = field('x').hidden().visible().build()
      expect(config.display).toBe(true)
    })

    it('.visible(false) sets display=false', () => {
      const [, config] = field('x').visible(false).build()
      expect(config.display).toBe(false)
    })
  })

  describe('number constraints', () => {
    it('.withMin(5) sets min', () => {
      const [, config] = field('x').withMin(5).build()
      expect(config.min).toBe(5)
    })

    it('.withMax(10) sets max', () => {
      const [, config] = field('x').withMax(10).build()
      expect(config.max).toBe(10)
    })

    it('.withMin(5).withMax(10) sets both', () => {
      const [, config] = field('x').withMin(5).withMax(10).build()
      expect(config.min).toBe(5)
      expect(config.max).toBe(10)
    })
  })

  describe('options', () => {
    it('.withOptions() sets static options', () => {
      const options = [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]
      const [, config] = field('x').withOptions(options).build()
      expect(config.options).toEqual(options)
    })

    it('.withOptionsLoader() sets async loader', () => {
      const loader = async () => [{ value: '1', label: 'One' }]
      const [, config] = field('x').withOptionsLoader(loader).build()
      expect(config.optionsLoader).toBe(loader)
    })

    it('.withSearchFunction() sets search function', () => {
      const searchFn = async (query: string) => [{ id: '1', name: query }]
      const [, config] = field('x').withSearchFunction(searchFn).build()
      expect(config.searchFunction).toBe(searchFn)
    })
  })

  describe('item mapping', () => {
    it('.withItemValue() sets itemValue property', () => {
      const [, config] = field('x').withItemValue('id').build()
      expect(config.itemValue).toBe('id')
    })

    it('.withItemText() sets itemText property', () => {
      const [, config] = field('x').withItemText('name').build()
      expect(config.itemText).toBe('name')
    })

    it('chaining withItemValue and withItemText works', () => {
      const [, config] = field('x').withItemValue('id').withItemText('name').build()
      expect(config.itemValue).toBe('id')
      expect(config.itemText).toBe('name')
    })
  })

  describe('metadata', () => {
    it('.placeholder() sets placeholder', () => {
      const [, config] = field('x').placeholder('Enter value...').build()
      expect(config.placeholder).toBe('Enter value...')
    })

    it('.hint() sets hint', () => {
      const [, config] = field('x').hint('Some helpful text').build()
      expect(config.hint).toBe('Some helpful text')
    })

    it('.custom() sets arbitrary property', () => {
      const [, config] = field('x').custom('myProp', 42).build()
      expect(config.myProp).toBe(42)
    })
  })

  describe('display formatter', () => {
    it('.withDisplayFormatter() sets displayValue function', () => {
      const formatter = (value: any) => `$${value}`
      const [, config] = field('x').withDisplayFormatter(formatter).build()
      expect(config.displayValue).toBe(formatter)
      expect(config.displayValue(100)).toBe('$100')
    })

    it('.withDateFormat() sets date display formatter', () => {
      const [, config] = field('x').withDateFormat('en-US').build()
      expect(typeof config.displayValue).toBe('function')
      // Returns dash for falsy values
      expect(config.displayValue(null)).toBe('-')
      expect(config.displayValue('')).toBe('-')
      // Formats a valid date
      const result = config.displayValue('2025-06-15T12:00:00Z')
      expect(typeof result).toBe('string')
      expect(result).not.toBe('-')
    })

    it('.withDateTimeFormat() sets datetime display formatter', () => {
      const [, config] = field('x').withDateTimeFormat('en-US').build()
      expect(typeof config.displayValue).toBe('function')
      expect(config.displayValue(null)).toBe('-')
      const result = config.displayValue('2025-06-15T12:00:00Z')
      expect(typeof result).toBe('string')
      expect(result).not.toBe('-')
    })
  })

  describe('method chaining', () => {
    it('supports full fluent chain', () => {
      const [name, config] = field('email', 'Email')
        .email()
        .editable()
        .required()
        .placeholder('user@example.com')
        .build()

      expect(name).toBe('email')
      expect(config.label).toBe('Email')
      expect(config.type).toBe('email')
      expect(config.toBeSet).toBe(true)
      expect(config.toBeEdited).toBe(true)
      expect(config.required).toBe(true)
      expect(config.placeholder).toBe('user@example.com')
    })

    it('later setters override earlier ones', () => {
      const [, config] = field('x')
        .editable()
        .readonly()
        .build()

      expect(config.toBeSet).toBe(false)
      expect(config.toBeEdited).toBe(false)
    })
  })

  describe('build()', () => {
    it('returns a [name, config] tuple', () => {
      const result = field('test_field', 'Test').build()
      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(2)
      expect(result[0]).toBe('test_field')
      expect(typeof result[1]).toBe('object')
    })
  })

  describe('buildFieldList()', () => {
    it('returns a Map from an array of FieldBuilder instances', () => {
      const result = buildFieldList([
        field('id').hidden(),
        field('name', 'Name').editable().required(),
        field('description', 'Description').textarea().editable(),
      ])

      expect(result).toBeInstanceOf(Map)
      expect(result.size).toBe(3)
      expect(result.has('id')).toBe(true)
      expect(result.has('name')).toBe(true)
      expect(result.has('description')).toBe(true)
    })

    it('preserves field configurations in the Map', () => {
      const result = buildFieldList([
        field('name', 'Name').editable().required(),
      ])

      const nameConfig = result.get('name')!
      expect(nameConfig.label).toBe('Name')
      expect(nameConfig.toBeSet).toBe(true)
      expect(nameConfig.toBeEdited).toBe(true)
      expect(nameConfig.required).toBe(true)
    })

    it('handles empty array', () => {
      const result = buildFieldList([])
      expect(result).toBeInstanceOf(Map)
      expect(result.size).toBe(0)
    })
  })

  describe('fieldPresets', () => {
    it('id() creates a hidden field named "id"', () => {
      const [name, config] = fieldPresets.id().build()
      expect(name).toBe('id')
      expect(config.label).toBe('ID')
      expect(config.display).toBe(false)
    })

    it('createdAt() creates a readonly field', () => {
      const [name, config] = fieldPresets.createdAt().build()
      expect(name).toBe('created_at')
      expect(config.label).toBe('Created At')
      expect(config.toBeSet).toBe(false)
      expect(config.toBeEdited).toBe(false)
    })

    it('createdAt() accepts custom label', () => {
      const [, config] = fieldPresets.createdAt('Date de creation').build()
      expect(config.label).toBe('Date de creation')
    })

    it('updatedAt() creates a readonly field', () => {
      const [name, config] = fieldPresets.updatedAt().build()
      expect(name).toBe('updated_at')
      expect(config.label).toBe('Updated At')
      expect(config.toBeSet).toBe(false)
      expect(config.toBeEdited).toBe(false)
    })

    it('updatedAt() accepts custom label', () => {
      const [, config] = fieldPresets.updatedAt('Derniere modification').build()
      expect(config.label).toBe('Derniere modification')
    })

    it('userId() creates a hidden field', () => {
      const [name, config] = fieldPresets.userId().build()
      expect(name).toBe('user_id')
      expect(config.display).toBe(false)
    })

    it('isActive() creates a readonly checkbox', () => {
      const [name, config] = fieldPresets.isActive().build()
      expect(name).toBe('is_active')
      expect(config.type).toBe('checkbox')
      expect(config.toBeSet).toBe(false)
      expect(config.toBeEdited).toBe(false)
    })

    it('stripeId() creates a hidden field with given name and label', () => {
      const [name, config] = fieldPresets.stripeId('stripe_customer_id', 'Stripe ID').build()
      expect(name).toBe('stripe_customer_id')
      expect(config.label).toBe('Stripe ID')
      expect(config.display).toBe(false)
    })
  })

  describe('systemFields()', () => {
    it('returns array of FieldBuilder instances for given field names', () => {
      const builders = systemFields(['id', 'created_at', 'updated_at'])
      expect(builders).toHaveLength(3)
      expect(builders[0]).toBeInstanceOf(FieldBuilder)
    })

    it('builds correct fields for id', () => {
      const builders = systemFields(['id'])
      const [name, config] = builders[0].build()
      expect(name).toBe('id')
      expect(config.display).toBe(false)
    })

    it('builds correct fields for created_at with custom label', () => {
      const builders = systemFields(['created_at'], { created_at: 'Custom Created' })
      const [name, config] = builders[0].build()
      expect(name).toBe('created_at')
      expect(config.label).toBe('Custom Created')
    })

    it('builds correct fields for updated_at with custom label', () => {
      const builders = systemFields(['updated_at'], { updated_at: 'Custom Updated' })
      const [, config] = builders[0].build()
      expect(config.label).toBe('Custom Updated')
    })

    it('builds user_id as hidden', () => {
      const builders = systemFields(['user_id'])
      const [name, config] = builders[0].build()
      expect(name).toBe('user_id')
      expect(config.display).toBe(false)
    })

    it('builds is_active as checkbox readonly', () => {
      const builders = systemFields(['is_active'])
      const [name, config] = builders[0].build()
      expect(name).toBe('is_active')
      expect(config.type).toBe('checkbox')
      expect(config.toBeSet).toBe(false)
    })

    it('integrates with buildFieldList via spread', () => {
      const result = buildFieldList([
        ...systemFields(['id', 'created_at']),
        field('name', 'Name').editable(),
      ])
      expect(result.size).toBe(3)
      expect(result.has('id')).toBe(true)
      expect(result.has('created_at')).toBe(true)
      expect(result.has('name')).toBe(true)
    })
  })
})
