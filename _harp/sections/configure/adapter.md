Rivets.js is agnostic about the objects that it can subscribe to. This makes it very flexible as it can adapt to work with virtually any object, but it also means that you need to tell Rivets.js *how* to subscribe to them. This is where the adapter comes in.

It is required to define an adapter because Rivets.js relies solely on the adapter to observe and interact with your model objects. An adapter is just an object that responds to `subscribe`, `unsubscribe`, `read` and `publish`.

A simple adapter for using Rivets.js with Backbone.js / Stapes.js models.

    rivets.configure({
      adapter: {
        subscribe: function(obj, keypath, callback) {
          obj.on('change:' + keypath, callback)
        },
        unsubscribe: function(obj, keypath, callback) {
          obj.off('change:' + keypath, callback)
        },
        read: function(obj, keypath) {
          return obj.get(keypath)
        },
        publish: function(obj, keypath, value) {
          obj.set(keypath, value)
        }
      }
    })