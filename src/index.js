//
// Main
//

function memoize (fn, options) {
  var cache = options && options.cache
    ? options.cache
    : cacheDefault

  var serializer = options && options.serializer
    ? options.serializer
    : serializerDefault

  var strategy = options && options.strategy
    ? options.strategy
    : strategyDefault

  return strategy(fn, {
    cache: cache,
    serializer: serializer
  })
}

//
// Strategy
//

function isPrimitive (value) {
  return value == null || typeof value === 'number' || typeof value === 'boolean' // || typeof value === "string" 'unsafe' primitive for our needs
}

function monadic (fn, cache, serializer, arg) {
  var cacheKey = isPrimitive(arg) ? arg : serializer(arg)

  var computedValue = cache.get(cacheKey)
  if (typeof computedValue === 'undefined') {
    computedValue = fn.call(this, arg)
    cache.set(cacheKey, computedValue)
  }

  return computedValue
}
async function asyncMonadic (fn, cache, serializer, arg) {
  var cacheKey = isPrimitive(arg) ? arg : serializer(arg)

  var computedValue = await cache.get(cacheKey)
  if (typeof computedValue === 'undefined') {
    computedValue = fn.constructor.name === 'AsyncFunction' ? await fn.call(this, arg) : fn.call(this, arg)
    cache.set(cacheKey, computedValue)
  }

  return computedValue
}

function variadic (fn, cache, serializer) {
  var args = Array.prototype.slice.call(arguments, 3)
  var cacheKey = serializer(args)

  var computedValue = cache.get(cacheKey)
  if (typeof computedValue === 'undefined') {
    computedValue = fn.apply(this, args)
    cache.set(cacheKey, computedValue)
  }
  return computedValue
}

async function asyncVariadic (fn, cache, serializer) {
  var args = Array.prototype.slice.call(arguments, 3)
  var cacheKey = serializer(args)

  var computedValue = await cache.get(cacheKey)
  if (typeof computedValue === 'undefined') {
    computedValue = fn.constructor.name === 'AsyncFunction' ? await fn.apply(this, args) : fn.apply(this, args)
    cache.set(cacheKey, computedValue)
  }

  return computedValue
}

function assemble (fn, context, strategy, cache, serialize) {
  return strategy.bind(
    context,
    fn,
    cache,
    serialize
  )
}

function strategyDefault (fn, options) {
var createdCache = options.cache.create()
var isStorageAdapter = createdCache.opts && createdCache.opts.namespace // it's keyv | https://github.com/lukechilds/keyv
var functions = {
  monadic,
  variadic,
}
if (isStorageAdapter || fn.constructor.name === 'AsyncFunction') functions = {
  monadic: asyncMonadic,
  variadic: asyncVariadic
}
var strategy = fn.length === 1 ? functions.monadic : functions.variadic
  return assemble(
    fn,
    this,
    strategy,
    createdCache,
    options.serializer
  )
}

function strategyVariadic (fn, options) {
  var createdCache = options.cache.create()
  var isStorageAdapter = createdCache.opts && createdCache.opts.namespace
  var strategy = (isStorageAdapter || fn.constructor.name === 'AsyncFunction') ? asyncVariadic : variadic

  return assemble(
    fn,
    this,
    strategy,
    createdCache,
    options.serializer
  )
}

function strategyMonadic (fn, options) {
var createdCache = options.cache.create()
var isStorageAdapter = createdCache.opts && createdCache.opts.namespace
  var strategy = (isStorageAdapter || fn.constructor.name === 'AsyncFunction') ? asyncMonadic : monadic

  return assemble(
    fn,
    this,
    strategy,
    createdCache,
    options.serializer
  )
}

//
// Serializer
//

function serializerDefault () {
  return JSON.stringify(arguments)
}

//
// Cache
//

function ObjectWithoutPrototypeCache () {
  this.cache = Object.create(null)
}

ObjectWithoutPrototypeCache.prototype.has = function (key) {
  return (key in this.cache)
}

ObjectWithoutPrototypeCache.prototype.get = function (key) {
  return this.cache[key]
}

ObjectWithoutPrototypeCache.prototype.set = function (key, value) {
  this.cache[key] = value
}

var cacheDefault = {
  create: function create () {
    return new ObjectWithoutPrototypeCache()
  }
}

//
// API
//

module.exports = memoize
module.exports.strategies = {
  variadic: strategyVariadic,
  monadic: strategyMonadic
}
