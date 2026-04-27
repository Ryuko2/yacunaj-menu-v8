const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const schemas = require('../src/schemas/menu')

describe('menu schemas', () => {
  it('priceBody exige motivo de al menos 5 caracteres', () => {
    assert.equal(schemas.priceBody.safeParse({ price: 10, reason: 'abc' }).success, false)
    assert.equal(schemas.priceBody.safeParse({ price: 10, reason: 'abcde' }).success, true)
  })

  it('categoryCreate valida slug', () => {
    assert.equal(schemas.categoryCreate.safeParse({ nombre: 'X', slug: 'Bad Slug' }).success, false)
    assert.equal(schemas.categoryCreate.safeParse({ nombre: 'X', slug: 'ok-slug' }).success, true)
  })
})
