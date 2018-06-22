// The default `.` adapter that comes with tinybind.js. Allows subscribing to
// properties on plain objects, implemented in ES5 natives using
// `Object.defineProperty`.

const ARRAY_METHODS = [
  'push',
  'pop',
  'shift',
  'unshift',
  'sort',
  'reverse',
  'splice'
];

const adapter = {
  counter: 0,
  weakmap: {},

  weakReference: function(obj) {
    if (!obj.hasOwnProperty('__rv')) {
      let id = this.counter++;

      Object.defineProperty(obj, '__rv', {
        value: id
      });
    }

    if (!this.weakmap[obj.__rv]) {
      this.weakmap[obj.__rv] = {
        callbacks: {}
      };
    }

    return this.weakmap[obj.__rv];
  },

  cleanupWeakReference: function(ref, id) {
    if (!Object.keys(ref.callbacks).length) {
      if (!(ref.pointers && Object.keys(ref.pointers).length)) {
        delete this.weakmap[id];
      }
    }
  },

  stubFunction: function(obj, fn) {
    let original = obj[fn];
    let map = this.weakReference(obj);
    let weakmap = this.weakmap;

    obj[fn] = (...args) => {
      let response = original.apply(obj, args);

      Object.keys(map.pointers).forEach(r => {
        let k = map.pointers[r];

        if (weakmap[r]) {
          if (weakmap[r].callbacks[k] instanceof Array) {
            weakmap[r].callbacks[k].forEach(callback => {
              callback.sync();
            });
          }
        }
      });

      return response;
    };
  },

  observeMutations: function(obj, ref, keypath) {
    if (obj instanceof Array) {
      let map = this.weakReference(obj);

      if (!map.pointers) {
        map.pointers = {};

        ARRAY_METHODS.forEach(fn => {
          this.stubFunction(obj, fn);
        });
      }

      if (!map.pointers[ref]) {
        map.pointers[ref] = [];
      }

      if (map.pointers[ref].indexOf(keypath) === -1) {
        map.pointers[ref].push(keypath);
      }
    }
  },

  unobserveMutations: function(obj, ref, keypath) {
    if ((obj instanceof Array) && (obj.__rv != null)) {
      let map = this.weakmap[obj.__rv];

      if (map) {
        let pointers = map.pointers[ref];

        if (pointers) {
          let idx = pointers.indexOf(keypath);

          if (idx > -1) {
            pointers.splice(idx, 1);
          }

          if (!pointers.length) {
            delete map.pointers[ref];
          }

          this.cleanupWeakReference(map, obj.__rv);
        }
      }
    }
  },

  observe: function(obj, keypath, callback) {
    var value;
    let callbacks = this.weakReference(obj).callbacks;

    if (!callbacks[keypath]) {
      callbacks[keypath] = [];
      let desc = Object.getOwnPropertyDescriptor(obj, keypath);

      if (!desc || !(desc.get || desc.set || !desc.configurable)) {
        value = obj[keypath];

        Object.defineProperty(obj, keypath, {
          enumerable: true,

          get: () => {
            return value;
          },

          set: newValue => {
            if (newValue !== value) {
              this.unobserveMutations(value, obj.__rv, keypath);
              value = newValue;
              let map = this.weakmap[obj.__rv];

              if (map) {
                let callbacks = map.callbacks[keypath];

                if (callbacks) {
                  callbacks.forEach(cb => {
                      cb.sync();
                  });
                }

                this.observeMutations(newValue, obj.__rv, keypath);
              }
            }
          }
        });
      }
    }

    if (callbacks[keypath].indexOf(callback) === -1) {
      callbacks[keypath].push(callback);
    }

    this.observeMutations(obj[keypath], obj.__rv, keypath);
  },

  unobserve: function(obj, keypath, callback) {
    let map = this.weakmap[obj.__rv];

    if (map) {
      let callbacks = map.callbacks[keypath];

      if (callbacks) {
        let idx = callbacks.indexOf(callback);

        if (idx > -1) {
          callbacks.splice(idx, 1);

          if (!callbacks.length) {
            delete map.callbacks[keypath];
            this.unobserveMutations(obj[keypath], obj.__rv, keypath);
          }
        }

        this.cleanupWeakReference(map, obj.__rv);
      }
    }
  },

  get: function(obj, keypath) {
    return obj[keypath];
  },

  set: (obj, keypath, value) => {
    obj[keypath] = value;
  }
};

export default adapter;
