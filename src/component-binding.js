import tinybind from './tinybind';
import {parseType} from './parsers';
import {EXTENSIONS, OPTIONS} from './constants';
import {Binding} from './binding';

/**
 * Used also in parsers.parseType
 * TODO outsource
 */
const PRIMITIVE = 0;
const KEYPATH = 1;

// component view encapsulated as a binding within it's parent view.
export class ComponentBinding extends Binding {
  // Initializes a component binding for the specified view. The raw component
  // element is passed in along with the component type. Attributes and scope
  // inflections are determined based on the components defined attributes.
  constructor(view, el, type) {
    super(view, el, type, null, null, null, null);
    this.view = view;
    this.el = el;
    this.type = type;
    this.component = view.options.components[this.type];
    this.static = {};
    this.observers = {};
    this.upstreamObservers = {};
    
    let bindingPrefix = tinybind._fullPrefix;
    
    // parse component attributes
    for (let i = 0, len = el.attributes.length; i < len; i++) {
      let attribute = el.attributes[i];

      // if attribute starts not with binding prefix. E.g. rv-
      if (attribute.name.indexOf(bindingPrefix) !== 0) {
        let propertyName = this.camelCase(attribute.name);
        let token = parseType(attribute.value);
        let stat = this.component.static;
    
        if (stat && stat.indexOf(propertyName) > -1) {
          this.static[propertyName] = attribute.value;
        } else if(token.type === PRIMITIVE) {
          this.static[propertyName] = token.value;
        } else if(token.type === KEYPATH) {
          this.observers[propertyName] = attribute.value;
        } else {
          throw new Error('can\'t parse component attribute', attribute, token);
        }
      }
    }
  }
    
    
  // Intercepts `tinybind.Binding::sync` since component bindings are not bound to
  // a particular model to update it's value.
  sync() {}
    
  // Intercepts `tinybind.Binding::update` since component bindings are not bound
  // to a particular model to update it's value.
  update() {}
    
  // Intercepts `tinybind.Binding::publish` since component bindings are not bound
  // to a particular model to update it's value.
  publish() {}
    
  // Returns an object map using the component's scope inflections.
  locals() {
    let result = {};
    
    Object.keys(this.static).forEach(key => {
      result[key] = this.static[key];
    });
    
    Object.keys(this.observers).forEach(key => {
      result[key] = this.observers[key].value();
    });
    
    return result;
  }
    
  // Returns a camel-cased version of the string. Used when translating an
  // element's attribute name into a property name for the component's scope.
  camelCase(string) {
    return string.replace(/-([a-z])/g, grouped => {
      return grouped[1].toUpperCase();
    });
  }
    
  // Intercepts `tinybind.Binding::bind` to build `@componentView` with a localized
  // map of models from the root view. Bind `@componentView` on subsequent calls.
  bind() {
    var options = {};
    if (!this.bound) {
      Object.keys(this.observers).forEach(key => {
        let keypath = this.observers[key];
    
        this.observers[key] = this.observe(this.view.models, keypath, (key => {
          return () => {
            this.componentView.models[key] = this.observers[key].value();
          };
        }).call(this, key));
      });
    
      this.bound = true;
    }
    
    if (this.componentView) {
      this.componentView.bind();
    } else {
      this.el.innerHTML = this.component.template.call(this);
      let scope = this.component.initialize.call(this, this.el, this.locals());
      this.el._bound = true;
    
    
      EXTENSIONS.forEach(extensionType => {
        options[extensionType] = {};
    
        if (this.component[extensionType]) {
          Object.keys(this.component[extensionType]).forEach(key => {
            options[extensionType][key] = this.component[extensionType][key];
          });
        }
    
        Object.keys(this.view.options[extensionType]).forEach(key => {
          if (options[extensionType][key]) {
            options[extensionType][key] = this.view[extensionType][key];
          }
        });
      });
    
      OPTIONS.forEach(option => {
        if (this.component[option] != null) {
          options[option] = this.component[option];
        } else {
          options[option] = this.view[option];
        }
      });
    
      //there's a cyclic dependency that makes imported View a dummy object. Use tinybind.bind
      //this.componentView = new View(this.el, scope, options)
      //this.componentView.bind()
      this.componentView = tinybind.bind(Array.prototype.slice.call(this.el.childNodes), scope, options);
    
      Object.keys(this.observers).forEach(key => {
        let observer = this.observers[key];
        let models = this.componentView.models;
    
        let upstream = this.observe(models, key, ((key, observer) => {
          return () => {
            observer.setValue(this.componentView.models[key]);
          };
        }).call(this, key, observer));
    
        this.upstreamObservers[key] = upstream;
      });
    }
  }
    
  // Intercept `tinybind.Binding::unbind` to be called on `@componentView`.
  unbind() {
    Object.keys(this.upstreamObservers).forEach(key => {
      this.upstreamObservers[key].unobserve();
    });
    
    Object.keys(this.observers).forEach(key => {
      this.observers[key].unobserve();
    });
    
    if (this.componentView) {
      this.componentView.unbind.call(this);
    }
  }
}