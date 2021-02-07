
// ASYNC
const memoize = require('../src')
const Keyv = require('keyv')
const Cache = require('map-expire/MapExpire')

// We'll create a custom cache adapter
const storageAdapter = new Keyv({
  ttl: 1000, // expires the entry after 1s
  store: new Cache([], {
    capacity: 1000,
    // duration: 1000, // in millisecond, default expiration time. Not need to set it if ttl is already set
  }),
})

// wrap the storage in a type of cache fast-memoize expects
const cache = {
  create: function create() {
    return storageAdapter
  },
}
// /////////////////////

test('speed with async cache', async () => {
  // Vanilla Fibonacci

  function vanillaFibonacci (n) {
    return n < 2 ? n : vanillaFibonacci(n - 1) + vanillaFibonacci(n - 2)
  }

  const vanillaExecTimeStart = Date.now()
  vanillaFibonacci(35)
  const vanillaExecTime = Date.now() - vanillaExecTimeStart

  // Memoized

  let fibonacci = n => n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2)

  fibonacci = memoize(fibonacci, { cache })
  const memoizedFibonacci = fibonacci

  const memoizedExecTimeStart = Date.now()
  await memoizedFibonacci(35)
  const memoizedExecTime = Date.now() - memoizedExecTimeStart

  // Assertion

  expect(memoizedExecTime < vanillaExecTime).toBe(true)
})


// ///////////////////

test('memoize async functions with single primitive argument', async () => {
  let numberOfCalls = 0
  async function waitPlus(number) {
    numberOfCalls += 1
    return new Promise(resolve => {
      setTimeout(resolve(number + 1), 100);
    });
  }

  const memoizedPlusPlus = memoize(waitPlus)

  // Assertions

  expect(await memoizedPlusPlus(2)).toBe(3)
  expect(numberOfCalls).toBe(1)
  expect(await memoizedPlusPlus(2)).toBe(3)
  expect(numberOfCalls).toBe(1)
})

test('memoize functions with async cache with single primitive argument', async () => {
  let numberOfCalls = 0
  function plusPlus (number) {
    numberOfCalls += 1
    return number + 1
  }

  const memoizedPlusPlus = memoize(plusPlus, { cache })

  // Assertions

  expect(await memoizedPlusPlus(3)).toBe(4)
  expect(numberOfCalls).toBe(1)
  expect(await memoizedPlusPlus(3)).toBe(4)
  expect(numberOfCalls).toBe(1)
})

test('memoize async functions with async cache with single primitive argument', async () => {
  let numberOfCalls = 0
  async function waitPlus(number) {
    numberOfCalls += 1
    return new Promise(resolve => {
      setTimeout(resolve(number + 1), 100);
    });
  }

  const memoizedPlusPlus = memoize(waitPlus, { cache })

  // Assertions

  expect(await memoizedPlusPlus(4)).toBe(5)
  expect(numberOfCalls).toBe(1)
  expect(await memoizedPlusPlus(4)).toBe(5)
  expect(numberOfCalls).toBe(1)
})


// ///////////////////////

test('memoize functions with async cache with single non-primitive argument', async () => {
  let numberOfCalls = 0
  function plusPlus (obj) {
    numberOfCalls += 1
    return obj.number + 1
  }

  const memoizedPlusPlus = memoize(plusPlus, { cache })

  // Assertions
  expect(await memoizedPlusPlus({number: 5})).toBe(6)
  expect(numberOfCalls).toBe(1)
  expect(await memoizedPlusPlus({number: 5})).toBe(6)
  expect(numberOfCalls).toBe(1)
})

test('memoize async function with single non-primitive argument', async () => {
  let numberOfCalls = 0
  async function waitPlus (obj) {
    numberOfCalls += 1
    return new Promise(resolve => {
      setTimeout(resolve(obj.number + 1), 100);
    });
  }

  const memoizedPlusPlus = memoize(waitPlus)

  // Assertions
  expect(await memoizedPlusPlus({number: 1})).toBe(2)
  expect(numberOfCalls).toBe(1)
  expect(await memoizedPlusPlus({number: 1})).toBe(2)
  expect(numberOfCalls).toBe(1)
})

test('memoize async functions with async cache with single non-primitive argument', async () => {
  let numberOfCalls = 0
  async function waitPlus (obj) {
    numberOfCalls += 1
    return new Promise(resolve => {
      setTimeout(resolve(obj.number + 1), 100);
    });
  }

  const memoizedPlusPlus = memoize(waitPlus, { cache })

  // Assertions
  expect(await memoizedPlusPlus({number: 2})).toBe(3)
  expect(numberOfCalls).toBe(1)
  expect(await memoizedPlusPlus({number: 2})).toBe(3)
  expect(numberOfCalls).toBe(1)
})

// ///////////////////////

test('memoize async functions with N arguments', async () => {
  let numberOfCalls = 0
  async function nToThePower (n, power) {
    numberOfCalls += 1
    return new Promise(resolve => {
      setTimeout(resolve(Math.pow(n, power)), 100);
    });
  }

  const memoizedNToThePower = memoize(nToThePower)

  // Assertions

  expect(await memoizedNToThePower(2, 3)).toBe(8)
  expect(numberOfCalls).toBe(1)
  expect(await memoizedNToThePower(2, 3)).toBe(8)
  expect(numberOfCalls).toBe(1)
})

test('memoize aync functions with async cache with N arguments', async () => {
  let numberOfCalls = 0
  async function nToThePower (n, power) {
    numberOfCalls += 1
    return new Promise(resolve => {
      setTimeout(resolve(Math.pow(n, power)), 100);
    });
  }

  const memoizedNToThePower = memoize(nToThePower, { cache })

  // Assertions

  expect(await memoizedNToThePower(2, 4)).toBe(16)
  expect(numberOfCalls).toBe(1)
  expect(await memoizedNToThePower(2, 4)).toBe(16)
  expect(numberOfCalls).toBe(1)
})

test('memoize functions with async cache with N arguments', async () => {
  let numberOfCalls = 0
  async function nToThePower (n, power) {
    numberOfCalls += 1
    return Math.pow(n, power);
  }

  const memoizedNToThePower = memoize(nToThePower, { cache })

  // Assertions

  expect(await memoizedNToThePower(2, 5)).toBe(32)
  expect(numberOfCalls).toBe(1)
  expect(await memoizedNToThePower(2, 5)).toBe(32)
  expect(numberOfCalls).toBe(1)
})

// ////////////////////////
test('memoize functions with async cache with spread arguments', async () => {
  function multiply (multiplier, ...theArgs) {
    return theArgs.map(function (element) {
      return multiplier * element
    })
  }

  const memoizedMultiply = memoize(multiply, {
    strategy: memoize.strategies.variadic,
    cache
  })

  // Assertions

  expect(await memoizedMultiply(2, 2, 3, 4)).toEqual([4, 6, 8])
  expect(await memoizedMultiply(2, 5, 6, 7)).toEqual([10, 12, 14])
})

test('memoize async functions with async cache with spread arguments', async () => {
  let numberOfCalls = 0
  async function multiply (multiplier, ...theArgs) {
    numberOfCalls += 1
    return new Promise(resolve => {
      setTimeout(resolve(theArgs.map(function (element) {
        return multiplier * element
      })), 100);
    });
  }

  const memoizedMultiply = memoize(multiply, {
    strategy: memoize.strategies.variadic,
    cache
  })

  // Assertions

  expect(await memoizedMultiply(3, 2, 3, 4)).toEqual([6, 9, 12])
  expect(numberOfCalls).toBe(1)
  expect(await memoizedMultiply(3, 2, 3, 4)).toEqual([6, 9, 12])
  expect(numberOfCalls).toBe(1)
  expect(await memoizedMultiply(4, 2, 3, 4)).toEqual([8, 12, 16])
  expect(numberOfCalls).toBe(2)
})

// /////////////////
test('explicitly use exposed variadic strategy with async cache', async () => {
  let numberOfCalls = 0
  function plusPlus (number) {
    numberOfCalls += 1
    return number + 1
  }
  const spy = jest.spyOn(memoize.strategies, 'variadic')
  const memoizedPlusPlus = memoize(plusPlus, { cache, strategy: memoize.strategies.variadic })

  // Assertions
  expect(await memoizedPlusPlus(11)).toBe(12)
  expect(numberOfCalls).toBe(1)
  expect(await memoizedPlusPlus(11)).toBe(12)
  expect(numberOfCalls).toBe(1)
  expect(spy).toHaveBeenCalled()

  // Teardown
  spy.mockRestore()
})

test('explicitly use exposed variadic strategy of async functions with async cache', async () => {
  let numberOfCalls = 0
  async function plusPlus (number) {
    numberOfCalls += 1
    return new Promise(resolve => {
      setTimeout(resolve(number + 1), 100);
    });
  }
  const spy = jest.spyOn(memoize.strategies, 'variadic')
  const memoizedPlusPlus = memoize(plusPlus, { cache, strategy: memoize.strategies.variadic })

  // Assertions
  expect(await memoizedPlusPlus(13)).toBe(14)
  expect(numberOfCalls).toBe(1)
  expect(await memoizedPlusPlus(13)).toBe(14)
  expect(numberOfCalls).toBe(1)
  expect(spy).toHaveBeenCalled()

  // Teardown
  spy.mockRestore()
})
const wait = ms => {
    const start = new Date().getTime()
    let end = start
    while (end < start + ms) {
      end = new Date().getTime()
    }
  }
// /////////////////