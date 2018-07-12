import Debug from 'debug';
import { BinderWrapper, ITwoWayBinder } from '../../binder.service';
import { eventHandlerFunction } from '../../binding';

/**
 * Binds an event handler on the element.
 */
export const onStarBinderWrapper: BinderWrapper = (jQuery: JQueryStatic) => {

  const name = 'on-*';
  const debug = Debug('binders:' + name);

  const binder: ITwoWayBinder<eventHandlerFunction> = {
    function: true,
    priority: 1000,

    bind(el) {
      if (!this.customData) {
        this.customData = {
          handler: null,
        };
      }
    },

    unbind(el: HTMLElement) {
      if (this.customData.handler) {
        if (this.args === null) {
          throw new Error('args is null');
        }
        jQuery(el).off(this.args[0], this.customData);
      }
    },

    routine(el: HTMLElement, value: eventHandlerFunction) {

      if (this.args === null) {
        throw new Error('args is null');
      }
      const eventName = this.args[0];

      if (this.customData.handler) {
        jQuery(el).off(eventName, this.customData);
      }

      this.customData.handler = this.eventHandler(value, el);
      jQuery(el).on(eventName, (event: JQuery.Event) => {
        this.customData.handler(event);
      });
    },
  };
  return { binder, name };
};