describe('tinybind.Binding', function() {
  var model, el, view, binding, originalPrefix, adapter, routineFn;

  beforeEach(function() {
    originalPrefix = tinybind.prefix;
    tinybind.prefix = 'data';
    adapter = tinybind.adapters['.'];

    el = document.createElement('div');
    el.setAttribute('data-text', 'obj.name');

    view = tinybind.bind(el, {obj: {name: 'test'}});
    binding = view.bindings[0];
    model = binding.model;
  });

  afterEach(function() {
    tinybind.prefix = originalPrefix;
  });

  it('gets assigned the proper binder routine matching the identifier', function() {
    routineFn = binding.binder.routine || binding.binder;
    routineFn.should.equal(tinybind.binders.text);
  });

  describe('when bind to non configurable properties', function() {
    beforeEach(function () {
      data = {
        name: 'x',
        items: []
      };
      Object.defineProperty(data, 'name', {
        enumerable: true,
        configurable: false,
        writable: true,
        value: 'y'
      });
      el.setAttribute('data-show', 'obj.items.length');
    });

    it('does not throw', function() {
      (function(){
        tinybind.bind(el, { obj: data});
      }).should.not.throw();
    });

  });

  describe('with formatters', function() {
    var valueInput;
    it('register all formatters', function() {

      valueInput = document.createElement('input');
      valueInput.setAttribute('type','text');
      valueInput.setAttribute('data-value', "obj.name | awesome | radical | totally");

      view = tinybind.bind(valueInput, {obj: { name: 'nothing' }});
      binding = view.bindings[0];

      binding.formatters.should.be.eql(['awesome', 'radical', 'totally']);
    });

    it('allows arguments with pipes', function () {

      valueInput = document.createElement('input');
      valueInput.setAttribute('type', 'text');
      valueInput.setAttribute('data-value', "obj.name | awesome | totally 'arg | with || pipes' 'and more args' | and 'others formatters' with 'pi||pes'");

      view = tinybind.bind(valueInput, { obj: { name: 'nothing' } });
      binding = view.bindings[0];

      binding.formatters.should.be.eql(['awesome', "totally 'arg | with || pipes' 'and more args'", "and 'others formatters' with 'pi||pes'"]);
    });
  });

  describe('bind()', function() {
    it('subscribes to the model for changes via the adapter', function() {
      sinon.spy(adapter, 'observe');
      binding.bind();
      adapter.observe.calledWith(model, 'name', binding).should.be.true();
    });

    it("calls the binder's bind method if one exists", function() {
      (function(){
        binding.bind();
      }).should.not.throw();

      binding.binder.bind = function(){};
      sinon.spy(binding.binder, 'bind');
      binding.bind();
      binding.binder.bind.called.should.be.true();
    });

    describe('with preloadData set to true', function() {
      beforeEach(function() {
        tinybind.preloadData = true;
      });

      it('sets the initial value', function() {
        sinon.spy(binding, 'set');
        binding.bind();
        binding.set.calledWith('test').should.be.true();
      });
    });

    describe.skip('with dependencies', function() {
      //the computed schema is awkward. Removed for now
      beforeEach(function() {
        binding.options.dependencies = ['.fname', '.lname'];
      });

      it('sets up observers on the dependant attributes', function() {
        binding.bind();
        adapter.observe.calledWith(model, 'fname', binding).should.be.true();
        adapter.observe.calledWith(model, 'lname', binding).should.be.true();
      });
    });
  });

  describe('unbind()', function() {
    describe('without a binder.unbind defined', function() {
      it('should not throw an error', function() {
        (function(){
          binding.unbind();
        }).should.not.throw();
      });
    });

    describe('with a binder.unbind defined', function() {
      beforeEach(function() {
        binding.binder.unbind = function(){};
      });

      it('should not throw an error', function() {
        (function(){
          binding.unbind();
        }).should.not.throw();
      });

      it("calls the binder's unbind method", function() {
        sinon.spy(binding.binder, 'unbind');
        binding.unbind();
        binding.binder.unbind.called.should.be.true();
      });
    });
  });

  describe('set()', function() {
    it('performs the binding routine with the supplied value', function() {
      if (binding.binder.routine) {
        routineFn = sinon.spy(binding.binder, 'routine');
      } else {
        routineFn = sinon.spy(binding, 'binder');
      }
      binding.set('sweater');
      routineFn.calledWith(el, 'sweater').should.be.true();
    });

    it('applies any formatters to the value before performing the routine', function() {
      if (binding.binder.routine) {
        routineFn = sinon.spy(binding.binder, 'routine');
      } else {
        routineFn = sinon.spy(binding, 'binder');
      }

      view.options.formatters.awesome = function(value) { return 'awesome ' + value; };

      binding.formatters.push('awesome');
      binding.set('sweater');
      routineFn.calledWith(el, 'awesome sweater').should.be.true();
    });

    it('calls methods with the object as context', function() {
      if (binding.binder.routine) {
        routineFn = sinon.spy(binding.binder, 'routine');
      } else {
        routineFn = sinon.spy(binding, 'binder');
      }

      binding.model = {foo: 'bar'};
      binding.set(function() { return this.foo; });
      routineFn.calledWith(el, binding.model.foo).should.be.true();
    });
  });
  
  describe('prototype functions', function() {
    it('does call routine if observed value is a function', function() {
      var Employee = function(name) {
        this.name = name;
      };
      Employee.prototype.getName = function() {
        return this.name;
      };
      var model = {employee: new Employee("John")};

      el = document.createElement('div');
      el.setAttribute('data-text', 'employee.getName');

      view = tinybind.bind(el, model);
      binding = view.bindings[0];
      if (binding.binder.routine) {
        routineFn = sinon.spy(binding.binder, 'routine');
      } else {
        routineFn = sinon.spy(binding, 'binder');
      }


      model.employee = new Employee("Peter");
      routineFn.calledWith(el, "Peter").should.be.true();
    });
  });
  
  describe('publish()', function() {
    var numberInput;
    it("should publish the value of a number input", function() {
      numberInput = document.createElement('input');
      numberInput.setAttribute('type', 'number');
      numberInput.setAttribute('data-value', 'obj.num');

      view = tinybind.bind(numberInput, {obj: {num: 42}});
      binding = view.bindings[0];
      model = binding.model;

      numberInput.value = 42;

      sinon.spy(adapter, 'set');
      binding.publish({target: numberInput});
      adapter.set.calledWith(model, 'num', '42').should.be.true();
    });
  });

  describe('publishTwoWay()', function() {
    var numberInput, valueInput;
    it('applies a two-way read formatter to function same as a single-way', function() {
      view.options.formatters.awesome = {
        read: function(value) { return 'awesome ' + value; }
      };

      if (binding.binder.routine) {
        routineFn = sinon.spy(binding.binder, 'routine');
      } else {
        routineFn = sinon.spy(binding, 'binder');
      }

      binding.formatters.push('awesome');
      binding.set('sweater');
      routineFn.calledWith(el, 'awesome sweater').should.be.true();
    });

    it("should publish the value of a number input", function() {
      tinybind.formatters.awesome = {
        publish: function(value) { return 'awesome ' + value; }
      };

      numberInput = document.createElement('input');
      numberInput.setAttribute('type', 'number');
      numberInput.setAttribute('data-value', 'obj.num | awesome');

      view = tinybind.bind(numberInput, {obj: {num: 42}});
      binding = view.bindings[0];
      model = binding.model;

      numberInput.value = 42;

      binding.publish({target: numberInput});
      adapter.set.calledWith(model, 'num', 'awesome 42').should.be.true();
    });

    it("should format a value in both directions", function() {
      tinybind.formatters.awesome = {
        publish: function(value) { return 'awesome ' + value; },
        read: function(value) { return value + ' is awesome'; }
      };

      valueInput = document.createElement('input');
      valueInput.setAttribute('type','text');
      valueInput.setAttribute('data-value', 'obj.name | awesome');

      view = tinybind.bind(valueInput, {obj: { name: 'nothing' }});
      binding = view.bindings[0];
      model = binding.model;

      valueInput.value = 'charles';
      binding.publish({target: valueInput});
      adapter.set.calledWith(model, 'name', 'awesome charles').should.be.true();

      sinon.spy(binding.binder, 'routine');
      binding.set('fred');
      binding.binder.routine.calledWith(valueInput, 'fred is awesome').should.be.true();
    });

    it("should resolve formatter arguments to their values", function() {
      tinybind.formatters.withArguments = {
        publish: function(value, arg1, arg2) {
          return value + ':' + arg1 + ':' + arg2;
        },
        read: function(value, arg1, arg2) {
          return value.replace(':' + arg1 + ':' + arg2, '');
        }
      };

      valueInput = document.createElement('input');
      valueInput.setAttribute('type', 'text');
      valueInput.setAttribute('data-value', "obj.name | withArguments config.age 'male'");

      view = tinybind.bind(valueInput, {
        obj: {
          name: 'nothing'
        },
        config: {
          age: 50
        }
      });

      binding = view.bindings[0];
      model = binding.model;

      valueInput.value = 'bobby';
      binding.publish({target: valueInput});
      adapter.set.calledWith(model, 'name', 'bobby:50:male').should.be.true();

      valueInput.value.should.equal('bobby');

      binding.set('andy:50:male');
      binding.binder.routine.calledWith(valueInput, 'andy').should.be.true();
    });

    it("should resolve formatter arguments correctly with multiple formatters", function() {
      tinybind.formatters.wrap = {
        publish: function(value, arg1, arg2) {
          return arg1 + value + arg2;
        },
        read: function(value, arg1, arg2) {
          return value.replace(arg1, '').replace(arg2, '');
        }
      };

      tinybind.formatters.saveAsCase = {
        publish: function(value, typeCase) {
          return value['to' + typeCase + 'Case']();
        },
        read: function(value, typeCase) {
          return value[typeCase === 'Upper' ? 'toLowerCase' : 'toUpperCase']();
        }
      };

      valueInput = document.createElement('input');
      valueInput.setAttribute('type', 'text');
      valueInput.setAttribute(
        'data-value',
        "obj.name | saveAsCase config.typeCase | wrap config.curly '}' | wrap config.square ']' | wrap config.paren ')'"
      );

      view = tinybind.bind(valueInput, {
        obj: {
          name: 'nothing'
        },
        config: {
          paren: '(',
          square: '[',
          curly: '{',
          typeCase: 'Upper'
        }
      });

      binding = view.bindings[0];
      model = binding.model;

      valueInput.value = 'bobby';
      binding.publish({target: valueInput});
      adapter.set.calledWith(model, 'name', '{[(BOBBY)]}').should.be.true();

      valueInput.value.should.equal('bobby');

      binding.set('{[(ANDY)]}');
      binding.binder.routine.calledWith(valueInput, 'andy').should.be.true();
    });


    it("should not fail or format if the specified binding function doesn't exist", function() {
      tinybind.formatters.awesome = { };
      valueInput = document.createElement('input');
      valueInput.setAttribute('type','text');
      valueInput.setAttribute('data-value', 'obj.name | awesome');

      view = tinybind.bind(valueInput, {obj: { name: 'nothing' }});
      binding = view.bindings[0];
      model = binding.model;

      valueInput.value = 'charles';
      binding.publish({target: valueInput});
      adapter.set.calledWith(model, 'name', 'charles').should.be.true();

      binding.set('fred');
      binding.binder.routine.calledWith(valueInput, 'fred').should.be.true();
    });

    it("should apply read binders left to right, and write binders right to left", function() {
      tinybind.formatters.totally = {
        publish: function(value) { return value + ' totally'; },
        read: function(value) { return value + ' totally'; }
      };

      tinybind.formatters.awesome = {
        publish: function(value) { return value + ' is awesome'; },
        read: function(value) { return value + ' is awesome'; }
      };

      valueInput = document.createElement('input');
      valueInput.setAttribute('type','text');
      valueInput.setAttribute('data-value', 'obj.name | awesome | totally');

      view = tinybind.bind(valueInput, {obj: { name: 'nothing' }});
      binding = view.bindings[0];
      model = binding.model;

      binding.set('fred');
      binding.binder.routine.calledWith(valueInput, 'fred is awesome totally').should.be.true();

      valueInput.value = 'fred';
      binding.publish({target: valueInput});
      adapter.set.calledWith(model, 'name', 'fred totally is awesome').should.be.true();
    });

    it("binders in a chain should be skipped if they're not there", function() {
      tinybind.formatters.totally = {
        publish: function(value) { return value + ' totally'; },
        read: function(value) { return value + ' totally'; }
      };

      tinybind.formatters.radical = {
        publish: function(value) { return value + ' is radical'; }
      };

      tinybind.formatters.awesome = function(value) { return value + ' is awesome'; };

      valueInput = document.createElement('input');
      valueInput.setAttribute('type','text');
      valueInput.setAttribute('data-value', 'obj.name | awesome | radical | totally');

      view = tinybind.bind(valueInput, {obj: { name: 'nothing' }});
      binding = view.bindings[0];
      model = binding.model;

      binding.set('fred');
      binding.binder.routine.calledWith(valueInput, 'fred is awesome totally').should.be.true();

      valueInput.value = 'fred';
      binding.publish({target: valueInput});
      adapter.set.calledWith(model, 'name', 'fred totally is radical').should.be.true();
    });
  });

  describe('formattedValue()', function() {
    it('applies the current formatters on the supplied value', function() {
      view.options.formatters.awesome = function(value) { return 'awesome ' + value; };
      binding.formatters.push('awesome');
      binding.formattedValue('hat').should.equal('awesome hat');
    });

    describe('with a multi-argument formatter string', function() {
      beforeEach(function() {
        view.options.formatters.awesome = function(value, prefix) {
          return prefix + ' awesome ' + value;
        };

        binding.formatters.push("awesome 'super'");
      });

      it('applies the formatter with arguments', function() {
        binding.formattedValue('jacket').should.equal('super awesome jacket');
      });
    });

    describe('with a formatter string with pipes in argument', function() {
      beforeEach(function () {

        view.options.formatters.totally = function (value, prefix) {
          return prefix + ' totally ' + value;
        };

        binding.formatters.push("totally 'arg | with || pipes'");
      });

      it('applies the formatter with arguments with pipes', function () {
        binding.formattedValue('jacket').should.equal('arg | with || pipes totally jacket');
      });
    });
  });

  describe('getValue()', function() {
    it('should use binder.getValue() if present', function() {
      binding.binder.getValue = function() {
        return 'foo';
      };

      binding.getValue(el).should.equal('foo');
    });

    it('binder.getValue() should have access to passed element', function() {
      binding.binder.getValue = function(el) {
        return el.dataset.foo;
      };

      el.dataset.foo = 'bar';
      binding.getValue(el).should.equal('bar');
    });

    it('binder.getValue() should have access to binding', function() {
      binding.binder.getValue = function() {
        return this.foo;
      };

      binding.foo = 'bar';
      binding.getValue(el).should.equal('bar');
    });
  });
});
