
// Check if a value is an object than can be observed.
function isObject(obj) {
  return typeof obj === 'object' && obj !== null;
}

// Error thrower.
function error(message) {
  throw new Error('[Observer] ' + message);
}

var adapters;
var interfaces;
var rootInterface;

// Constructs a new keypath observer and kicks things off.
function Observer(obj, keypath, callback) {
  this.keypath = keypath;
  this.callback = callback;
  this.objectPath = [];
  this.parse();
  this.obj = this.getRootObject(obj);

  if (isObject(this.target = this.realize())) {
    this.set(true, this.key, this.target, this.callback);
  }
}

Observer.updateOptions = function(options) {
  adapters = options.adapters;
  interfaces = Object.keys(adapters);
  rootInterface = options.rootInterface;
};

// Tokenizes the provided keypath string into interface + path tokens for the
// observer to work with.
Observer.tokenize = function(keypath, root) {
  var tokens = [];
  var current = {i: root, path: ''};
  var index, chr;

  for (index = 0; index < keypath.length; index++) {
    chr = keypath.charAt(index);

    if (!!~interfaces.indexOf(chr)) {
      tokens.push(current);
      current = {i: chr, path: ''};
    } else {
      current.path += chr;
    }
  }

  tokens.push(current);
  return tokens;
};

// Parses the keypath using the interfaces defined on the view. Sets variables
// for the tokenized keypath as well as the end key.
Observer.prototype.parse = function() {
  var path, root;

  if (!interfaces.length) {
    error('Must define at least one adapter interface.');
  }

  if (!!~interfaces.indexOf(this.keypath[0])) {
    root = this.keypath[0];
    path = this.keypath.substr(1);
  } else {
    root = rootInterface;
    path = this.keypath;
  }

  this.tokens = Observer.tokenize(path, root);
  this.key = this.tokens.pop();
};

// Realizes the full keypath, attaching observers for every key and correcting
// old observers to any changed objects in the keypath.
Observer.prototype.realize = function() {
  var current = this.obj;
  var unreached = -1;
  var prev;
  var token;

  for (let index = 0; index < this.tokens.length; index++) {
    token = this.tokens[index];
    if (isObject(current)) {
      if (typeof this.objectPath[index] !== 'undefined') {
        if (current !== (prev = this.objectPath[index])) {
          this.set(false, token, prev, this);
          this.set(true, token, current, this);
          this.objectPath[index] = current;
        }
      } else {
        this.set(true, token, current, this);
        this.objectPath[index] = current;
      }

      current = this.get(token, current);
    } else {
      if (unreached === -1) {
        unreached = index;
      }

      prev = this.objectPath[index];
      if (prev) {
        this.set(false, token, prev, this);
      }
    }
  }

  if (unreached !== -1) {
    this.objectPath.splice(unreached);
  }

  return current;
};

// Updates the keypath. This is called when any intermediary key is changed.
Observer.prototype.sync = function() {
  var next, oldValue, newValue;

  if ((next = this.realize()) !== this.target) {
    if (isObject(this.target)) {
      this.set(false, this.key, this.target, this.callback);
    }

    if (isObject(next)) {
      this.set(true, this.key, next, this.callback);
    }

    oldValue = this.value();
    this.target = next;
    newValue = this.value();
    if (newValue !== oldValue || newValue instanceof Function) this.callback.sync();
  } else if (next instanceof Array) {
    this.callback.sync();
  }
};

// Reads the current end value of the observed keypath. Returns undefined if
// the full keypath is unreachable.
Observer.prototype.value = function() {
  if (isObject(this.target)) {
    return this.get(this.key, this.target);
  }
};

// Sets the current end value of the observed keypath. Calling setValue when
// the full keypath is unreachable is a no-op.
Observer.prototype.setValue = function(value) {
  if (isObject(this.target)) {
    adapters[this.key.i].set(this.target, this.key.path, value);
  }
};

// Gets the provided key on an object.
Observer.prototype.get = function(key, obj) {
  return adapters[key.i].get(obj, key.path);
};

// Observes or unobserves a callback on the object using the provided key.
Observer.prototype.set = function(active, key, obj, callback) {
  var action = active ? 'observe' : 'unobserve';
  adapters[key.i][action](obj, key.path, callback);
};


// Unobserves the entire keypath.
Observer.prototype.unobserve = function() {
  var obj;
  var token;

  for (let index = 0; index < this.tokens.length; index++) {
    token = this.tokens[index];
    obj = this.objectPath[index];
    if (obj) {
      this.set(false, token, obj, this);
    }
  }

  if (isObject(this.target)) {
    this.set(false, this.key, this.target, this.callback);
  }
};
// traverse the scope chain to find the scope which has the root property
// if the property is not found in chain, returns the root scope
Observer.prototype.getRootObject = function (obj) {
  var rootProp, current;
  if (!obj.$parent) {
    return obj;
  }

  if (this.tokens.length) {
    rootProp = this.tokens[0].path;
  } else {
    rootProp = this.key.path;
  }

  current = obj;
  while (current.$parent && (current[rootProp] === undefined)) {
    current = current.$parent;
  }

  return current;
};

export default Observer;
