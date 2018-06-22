/// <reference types="jquery" />

declare module 'tinybind' {
  // TODO: check if these are correct:
  export interface IOptions {
    // Attribute prefix in templates
    prefix?: string;

    //Preload templates with initial data on bind
    preloadData?: boolean;

    //Root sightglass interface for keypaths
    rootInterface?: string;

    // Template delimiters for text bindings
    templateDelimiters?: Array<string>

    // Augment the event handler of the on-* binder
    handler?: Function;
  }

  export interface Observer {
    unobserve: () => any
    value: () => any
  }

  export type TBlock = boolean;

  export interface View extends IOptions {
    models: Object
    options: () => IOptions
    build(): void
    bind(): void
    unbind(): void;
    sync(): void;
    publish(): void;
    update(models: any): void;
    buildBinding(node: HTMLElement, type: string, declaration: string, binder: Binder<any>, arg: any): IBinding;
    traverse(node: HTMLElement): TBlock;
  }

  export interface IBinding {
    view: View;
    el: HTMLElement;
    /**
     * Name of the binder without the prefix
     */
    type: string;
    binder: Binder<any>;
    formatters: string[];
    formatterObservers: any[];
    keypath: string;
    arg: string[];
    model?: any;
    /**
     * just to have a value where we could store custom data
     */
    data?: any;
    /**
     * Subscribes to the model for changes at the specified keypath. Bi-directional
     * routines will also listen for changes on the element to propagate them back
     * to the model.
     */
    bind: () => void;
    /**
     * Returns an event handler for the binding around the supplied function.
     */
    eventHandler: (handler: (event: Event) => void) => () => any;
    /**
     * Applies all the current formatters to the supplied value and returns the
     * formatted value.
     */
    formattedValue: (value: any) => void;
    /**
     * Returns elements value
     */
    getValue: (models: any) => any;

    parseFormatterArguments: (args: any, formatterIndex: number) => any;

    parseTarget: () => void;
    /**
     * Publishes the value currently set on the input element back to the model.
     */
    publish: () => any | void;
    /**
     * Sets the value for the binding. This Basically just runs the binding routine
     * with the supplied value formatted.
     */
    set: (value: any) => void;
    /**
     * Syncs up the view binding with the model.
     */
    sync: () => void;
    /**
     * Unsubscribes from the model and the element.
     */
    unbind: () => void;
    /**
     * Updates the binding's model from what is currently set on the view. Unbinds
     * the old model first and then re-binds with the new model.
     */
    update: (models: any) => void;
    /**
     * Observes the object keypath
     */
    observe: (obj: Object, keypath: string, callback: (newValue: any) => void) => Observer;
  }

  export interface IOneWayBinder<ValueType> {
    (this: IBinding, element: HTMLElement, value: ValueType): void;
  }

  export interface ITwoWayBinder<ValueType> {
    routine?: (this: IBinding, element: HTMLElement, value: ValueType) => void;
    bind?: (this: IBinding, element: HTMLElement) => void;
    unbind?: (this: IBinding, element: HTMLElement) => void;
    update?: (this: IBinding, model: ValueType) => void;
    getValue?: (this: IBinding, element: HTMLElement) => void;
    block?: boolean;
    function?: boolean;
    publishes?: boolean;
    priority?: number;
  }

  export type Binder<ValueType> = IOneWayBinder<ValueType> | ITwoWayBinder<ValueType>

  export type Scope = any;

  export interface IComponent {
    template: string | (() => string) | (() => HTMLElement);
    initialize: (el: HTMLElement, data: any) => Scope;
  }

  export interface IComponents {
    [name: string]: IComponent;
  }

  export interface IBinders {
    [name: string]: Binder<any>;
  }

  export interface IFormatter {
    (val: any, ...args: any[]): any;
  }

  export interface IFormatters {
    [name: string]: IFormatter;
  }

  export interface Tinybind extends IOptions {
    // Global binders.
    binders: IBinders;

    // Global components.
    components: IComponents;

    // Global formatters.
    formatters: IFormatters;

    // Global sightglass adapters.
    adapters: any;

    handler(context: any, ev: Event, biding: any): void;

    configure(options?: IOptions): void;

    bind(element: HTMLElement | Array<HTMLElement> | JQuery<HTMLElement>, models: any, options?: any): View;

    _: {
      sightglass: any;
    }
  }

  const tinybind: Tinybind;

  export default tinybind;
}