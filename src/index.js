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

  this.debug = options && options.debug && typeof options.debug === 'boolean'
    ? options.debug
    : false
    
  return strategy(fn, {
    cache: cache,
    serializer: serializer,
    debug
  })
}

//
// Helper
//

async function handleFunction(fn) { // the async conditional check [fn.constructor.name === 'AsyncFunction'] in the strategy
// might not be enough as won't work with Babel/TypeScript output, because asyncFn is regular function in transpiled code, it is an instance of Function or GeneratorFunction, not AsyncFunction
// Because of the above we perform this additional check here once the fn has been already called before setting the value in the cache
// ref. https://stackoverflow.com/a/38510353/5546463
// Limitation: at the moment this works reliably only with keyv as the storageAdapter
  let promise = fn;
    if (promise && typeof promise.then === 'function' && promise[Symbol.toStringTag] === 'Promise') {
      // is compliant native promise implementation
       promise = await fn
       return promise
    }
    return fn
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
    if (this.debug) console.log('[MEMO][CACHE][KEY] ', cacheKey, ' [MISS]')
    computedValue = fn.call(this, arg)
    cache.set(cacheKey, computedValue)
  } else if (this.debug) console.log('[MEMO][CACHE][KEY] ', cacheKey, ' [HIT]')

  return computedValue
}
async function asyncMonadic (fn, cache, serializer, arg) {
  var cacheKey = isPrimitive(arg) ? arg : serializer(arg)
  
  var computedValue = await cache.get(cacheKey)
  if (typeof computedValue === 'undefined') {
    if (this.debug) console.log('[MEMO][CACHE][KEY] ', cacheKey, ' [MISS]')
    computedValue = await handleFunction(fn.call(this, arg))
    cache.set(cacheKey, computedValue)
  } else if (this.debug) console.log('[MEMO][CACHE][KEY] ', cacheKey, ' [HIT]')

  return computedValue
}

function variadic (fn, cache, serializer) {
  var args = Array.prototype.slice.call(arguments, 3)
  var cacheKey = serializer(args)

  var computedValue = cache.get(cacheKey)
  if (typeof computedValue === 'undefined') {
    if (this.debug) console.log('[MEMO][CACHE][KEY] ', cacheKey, ' [MISS]')
    computedValue = fn.apply(this, args)
    cache.set(cacheKey, computedValue)
  } else if (this.debug) console.log('[MEMO][CACHE][KEY] ', cacheKey, ' [HIT]')
  return computedValue
}

async function asyncVariadic (fn, cache, serializer) {
  var args = Array.prototype.slice.call(arguments, 3)
  var cacheKey = serializer(args)

  var computedValue = await cache.get(cacheKey)
  if (typeof computedValue === 'undefined') {
    if (this.debug) console.log('[MEMO][CACHE][KEY] ', cacheKey, ' [MISS]')
    computedValue = await handleFunction(fn.apply(this, args))
    cache.set(cacheKey, computedValue)
  } else if (this.debug) console.log('[MEMO][CACHE][KEY] ', cacheKey, ' [HIT]')
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
