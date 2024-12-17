// events.ts
type Callback = (...args: any[]) => void;

const createEventEmitter = () => {
    const listeners: Record<string, Callback[]> = {};

    return {
        on: (event: string, callback: Callback) => {
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push(callback);
        },
        emit: (event: string, ...args: any[]) => {
            if (listeners[event]) listeners[event].forEach((cb) => cb(...args));
        },
    };
};

// Global event emitter instance
const EventBus = createEventEmitter();
export default EventBus;