const _ = require('lodash');

module.exports = function({chain, or, and}) {
    function getIn(obj, path) {
        return _.reduce(path, (acc, val) => {
            return acc.ternary(acc.get(val), acc)
        }, obj);
    }

    function assignIn(obj, args) {
        return chain([
            obj,
            ...args
        ]).assign();
    }

    function reduce(collection, predicate, initialValue) {
        return collection.size().eq(0).ternary(
            initialValue,
            collection.recursiveMap((loop, value, index) => 
                predicate(index.eq(0).ternary(
                    initialValue, index.minus(1).recur(loop)), value, index))
                .get(collection.size().minus(1)))
    }

    function concat(a, b) {
        return a.size().plus(b.size()).range().map(v => v.lt(a.size()).ternary(a.get(v), b.get(v.minus(a.size()))))
    }

    function find(collection, predicate, ctx) {
      return collection.values().filter((val, key) => predicate(val, key, ctx)).get(0)
    }

    function join(arr, separator) {
      return reduce(arr, (acc, value, index) => index.eq(0).ternary(acc.plus(value), acc.plus(separator).plus(value)), '')
    }

    function sum(arr) {
        return reduce(arr, (acc, value) => acc.plus(value), 0)
    }

    function append(arr, value) {
      return arr.size().plus(1).range().map(v => v.lt(arr.size()).ternary(arr.get(v), value))
    }

    function simpleSet(base, part, value) {
      return chain([base, {[part]: value}]).assign()
    }

    function setIn(obj, path, value) {
      if (!Array.isArray(path) || path.length === 0) {
          throw new Error('only set with array paths');
      }
      path.forEach(val => {
          if (typeof val !== 'string') {
              throw new Error('all path parts in set should be strings');
          }
      })


      const currentValues = path.map((part, index) => 
        or(getIn(obj, path.slice(0, index)), chain({}))
      )

      return path.reduceRight((acc, part, index) => {
          return simpleSet(currentValues[index], part, acc)
      }, value)
    }

    function includesValue(collection, val) {
      return collection.anyValues((item, key, ctx) => item.eq(ctx), val)
    }

    function includes(collection, val) {
      return collection.any((item, key, ctx) => item.eq(ctx), val)
    }

    function pickBy(obj, func, context = null) {
      return obj.filterBy(func, context)
    }

    function pick(obj, arr) {
      const projection = Object.assign({},...arr.map(key => ({[key]: obj.get(key)})));
      return chain(projection).filterBy(item => item);
    }

    return { getIn, includes, assignIn, reduce, concat, find, join, sum, append, setIn, pick, pickBy, includes, includesValue};
};

