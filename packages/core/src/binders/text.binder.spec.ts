import {
    Riba,
} from '../index';

import {
    textBinder,
} from './text.binder';

describe('riba.binders', () => {
    let el: HTMLUnknownElement;

    const riba = new Riba();
    riba.module.binderService.regist(textBinder);

    beforeEach(() => {
        riba.configure({
            adapter: {
                subscribe: () => {/**/},
                unsubscribe: () => {/**/},
                read: () => {/**/},
                publish: () => {/**/},
            },
        });

        el = document.createElement('div');
        document.body.appendChild(el);
    });

    afterEach(() => {
        if (!el.parentNode) {
            throw new Error('el.parentNode is not defined!');
        }
        el.parentNode.removeChild(el);
    });

    describe('text', () => {
        it('sets the element\'s text content', () => {
            (riba.binders.text as any).routine(el, '<em>hello</em>');
            expect(el.textContent).toEqual('<em>hello</em>');
            expect(el.innerHTML).toEqual('&lt;em&gt;hello&lt;/em&gt;');
        });

        it('sets the element\'s text content to zero when a numeric zero is passed', () => {
            (riba.binders.text as any).routine(el, 0);
            expect(el.textContent).toEqual('0');
            expect(el.innerHTML).toEqual('0');
        });
    });
});