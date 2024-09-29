// @ts-check

/**
 * @typedef {Object} Observer
 * @prop {(value: any) => void} next 
 * @prop {() => void} complete
 * @prop {(error: any) => void} error
 */


/**
 * @typedef {Object} Disposable
 * @prop {() => void} unsubscribe
 */

/**
 * @typedef {Object} IObservable
 * @prop {(subscriber: Observer) => Disposable} subscribe
 */


/**
 * @extends IObservable
 */
class Observable {

    /**
     * A function that defines what to do with the source data
     * returning a function that will cleanup and cancel the subscription if necessary
     * @param {(subscriber: Observer) => () => void} subscriberFn
     */
    constructor(subscriberFn) {
        this.subscriberFn = subscriberFn;
    }


    /**
     * 
     * @param {Observer} subscriber
     * @returns {Disposable}
     */
    subscribe(subscriber) {
        const cancel = this.subscriberFn(subscriber);
        return { unsubscribe: cancel };
    }
}


/**
 * @extends IObservable
 */
class SharedObservable {
    #subscribers = new Set();
    #started = false;
    #inner;
    #cancel;

    constructor(observable) {
        this.#inner = observable;
    }

    subscribe(subscriber) {
        this.#subscribers.add(subscriber);

        if (!this.#started) {
            this.#cancel = this.#inner.subscribe({
                next: (item) => {
                    for (var sub of this.#subscribers) {
                        sub.next(item);
                    }
                },
                complete: () => {
                    for (var sub of this.#subscribers) {
                        sub.complete();
                    }
                },
                error: (e) => {
                    for (var sub of this.#subscribers) {
                        sub.error(e);
                    }
                }
            });

            this.#started = true;
        }

        return {
            unsubscribe: () => { 
                this.#subscribers.delete(subscriber);

                if (this.#subscribers.size === 0) {
                    this.#cancel.unsubscribe();
                }
            }
        };
    }
}


const onetwothree =
    new Observable((subscriber) => {
        subscriber.next(1);
        subscriber.next(2);
        subscriber.next(3);
        subscriber.complete();

        return () => undefined;
    });


const keepgoing =
    new Observable((subscriber) => {

        const intervalId = setInterval(() => {
            subscriber.next(Math.random() * 10);
        }, 200);

        return () => {
            clearInterval(intervalId);
        };
    });

// const stop = onetwothree.subscribe({ next: (it) => console.log(it), complete: () => undefined });

// const stopper = onetwothree.subscribe({ next: (it) => console.log(it + 2), complete: () => undefined });

// function fromMouseMove() {
//     return new Observable((s) => {
//         window.addEventListener("mousemove", (ev) => {
//             s.next({ x: ev.clientX, y: ev.clientY });
//         });
//     });
// }


// const mm = fromMouseMove();

// mm.subscribe({ next: (it) => console.log(it), complete: () => undefined });
// mm.subscribe({ next: (it) => console.log(`x plus y: ${it.x + it.y}`), complete: () => undefined });

const keepgoing2 = new SharedObservable(keepgoing);

const first = keepgoing2.subscribe({ 
    next: (it) => console.log(`first ${it}`), 
    complete: () => undefined 
});

const second = keepgoing2.subscribe({ 
    next: (it) => console.log(`second ${it}`), 
    complete: () => undefined 
});

const third = keepgoing2.subscribe({
    next: (it) => console.log(`third ${it}`), 
    complete: () => undefined 
});

setTimeout(first.unsubscribe, 2000);
setTimeout(second.unsubscribe, 3000);
setTimeout(third.unsubscribe, 5000);