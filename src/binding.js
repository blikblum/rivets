import {parseType} from './parsers';
import Observer from './observer';

function getInputValue(el) {
  let results = [];
  if (el.type === 'checkbox') {
    return el.checked;
  } else if (el.type === 'select-multiple') {

    el.options.forEach(option => {
      if (option.selected) {
        results.push(option.value);
      }
    });

    return results;
  } else {
    return el.value;
  }
}

const FORMATTER_ARGS =  /[^\s']+|'([^']|'[^\s])*'|"([^"]|"[^\s])*"/g;
const FORMATTER_SPLIT = /\s+/;

/**
 * Used also in parsers.parseType
 * TODO outsource
 */
const PRIMITIVE = 0;
const KEYPATH = 1;

// A single binding between a model attribute and a DOM element.
export class Binding {
  // All information about the binding is passed into the constructor; the
  // containing view, the DOM node, the type of binding, the model object and the
  // keypath at which to listen for changes.
  constructor(view, el, type, keypath, binder, arg, formatters) {
    this.view = view;
    this.el = el;
    this.type = type;
    this.keypath = keypath;
    this.binder = binder;
    this.arg = arg;
    this.formatters = formatters;
    this.formatterObservers = {};
    this.model = undefined;
  }

  // Observes the object keypath
  observe(obj, keypath) {
    return new Observer(obj, keypath, this);
  }

  parseTarget() {
    if (this.keypath) {
      let token = parseType(this.keypath);
      if (token.type === PRIMITIVE) {
        this.value = token.value;
      } else if(token.type === KEYPATH){
        this.observer = this.observe(this.view.models, this.keypath);
        this.model = this.observer.target;
      } else {
        throw new Error('Unknown type in token', token);
      }
    } else {
      this.value = undefined;
    }
  }

  parseFormatterArguments(args, formatterIndex) {
    return args
      .map(parseType)
      .map(({type, value}, ai) => {
        if (type === PRIMITIVE) {
          return value;
        } else if (type === KEYPATH) {
          if (!this.formatterObservers[formatterIndex]) {
            this.formatterObservers[formatterIndex] = {};
          }

          let observer = this.formatterObservers[formatterIndex][ai];

          if (!observer) {
            observer = this.observe(this.view.models, value);
            this.formatterObservers[formatterIndex][ai] = observer;
          }

          return observer.value();
        } else {
          throw new Error('Unknown type', type, value);
        }
      });
  }

  // Applies all the current formatters to the supplied value and returns the
  // formatted value.
  formattedValue(value) {
    return this.formatters.reduce((result, declaration, index) => {
      let args = declaration.match(FORMATTER_ARGS);
      let id = args.shift();
      let formatter = this.view.options.formatters[id];

      const processedArgs = this.parseFormatterArguments(args, index);

      if (formatter && (formatter.read instanceof Function)) {
        result = formatter.read(result, ...processedArgs);
      } else if (formatter instanceof Function) {
        result = formatter(result, ...processedArgs);
      }
      return result;
    }, value);
  }

  // Returns an event handler for the binding around the supplied function.
  eventHandler(fn) {
    let binding = this;
    let handler = binding.view.options.handler;

    return function(ev) {
      handler.call(fn, this, ev, binding);
    };
  }

  // Sets the value for the binding. This Basically just runs the binding routine
  // with the supplied value formatted.
  set(value) {
    if ((value instanceof Function) && !this.binder.function) {
      value = this.formattedValue(value.call(this.model));
    } else {
      value = this.formattedValue(value);
    }

    let routineFn = this.binder.routine || this.binder;

    if (routineFn instanceof Function) {
      routineFn.call(this, this.el, value);
    }
  }

  // Syncs up the view binding with the model.
  sync() {
    if (this.observer) {
      this.model = this.observer.target;
      this.set(this.observer.value());
    } else {
      this.set(this.value);
    }
  }

  // Publishes the value currently set on the input element back to the model.
  publish() {
    if (this.observer) {
      var value = this.formatters.reduceRight((result, declaration, index) => {
        const args = declaration.split(FORMATTER_SPLIT);
        const id = args.shift();
        const formatter = this.view.options.formatters[id];
        const processedArgs = this.parseFormatterArguments(args, index);

        if (formatter && formatter.publish) {
          result = formatter.publish(result, ...processedArgs);
        }
        return result;
      }, this.getValue(this.el));

      this.observer.setValue(value);
    }
  }

  // Subscribes to the model for changes at the specified keypath. Bi-directional
  // routines will also listen for changes on the element to propagate them back
  // to the model.
  bind() {
    this.parseTarget();

    if (this.binder.hasOwnProperty('bind')) {
      this.binder.bind.call(this, this.el);
    }

    if (this.view.options.preloadData) {
      this.sync();
    }
  }

  // Unsubscribes from the model and the element.
  unbind() {
    if (this.binder.unbind) {
      this.binder.unbind.call(this, this.el);
    }

    if (this.observer) {
      this.observer.unobserve();
    }

    Object.keys(this.formatterObservers).forEach(fi => {
      let args = this.formatterObservers[fi];

      Object.keys(args).forEach(ai => {
        args[ai].unobserve();
      });
    });

    this.formatterObservers = {};
  }

  // Updates the binding's model from what is currently set on the view. Unbinds
  // the old model first and then re-binds with the new model.
  update(models = {}) {
    if (this.observer) {
      this.model = this.observer.target;
    }

    if (this.binder.update) {
      this.binder.update.call(this, models);
    }
  }

  // Returns elements value
  getValue(el) {
    if (this.binder && this.binder.getValue) {
      return this.binder.getValue.call(this, el);
    } else {
      return getInputValue(el);
    }
  }
}
