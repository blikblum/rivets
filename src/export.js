import tinybind from './tinybind';
import View from './view';
import {OPTIONS, EXTENSIONS} from './constants';
import adapter from './adapter';
import binders from './binders';
import Observer from './observer';

// Returns the public interface.

tinybind.binders = binders;
tinybind.adapters['.'] = adapter;

// Binds some data to a template / element. Returns a tinybind.View instance.
tinybind.bind = (el, models, options) => {
  let viewOptions = {};
  models = models || {};
  options = options || {};

  EXTENSIONS.forEach(extensionType => {
    viewOptions[extensionType] = Object.create(null);

    if (options[extensionType]) {
      Object.keys(options[extensionType]).forEach(key => {
        viewOptions[extensionType][key] = options[extensionType][key];
      });
    }

    Object.keys(tinybind[extensionType]).forEach(key => {
      if (!viewOptions[extensionType][key]) {
        viewOptions[extensionType][key] = tinybind[extensionType][key];
      }
    });
  });

  OPTIONS.forEach(option => {
    let value = options[option];
    viewOptions[option] = value != null ? value : tinybind[option];
  });

  viewOptions.starBinders = Object.keys(viewOptions.binders).filter(function (key) {
    return key.indexOf('*') > 0;
  });

  Observer.updateOptions(viewOptions);

  let view = new View(el, models, viewOptions);
  view.bind();
  return view;
};

// Initializes a new instance of a component on the specified element and
// returns a tinybind.View instance.		
tinybind.init = (component, el, data = {}) => {
  if (!el) {
    el = document.createElement('div');
  }

  component = tinybind.components[component];
  el.innerHTML = component.template.call(tinybind, el);
  let scope = component.initialize.call(tinybind, el, data);

  let view = tinybind.bind(el, scope);
  view.bind();
  return view;
};

tinybind.formatters.negate = tinybind.formatters.not = function (value) {
  return !value;
};

export default tinybind;
