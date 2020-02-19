import { EventEmitter } from 'events';
import { MessagingPort, Event, PortDisconnectEvent, PortMessageEvent } from '../types';

let ID = 0;

export class EventEmitterBasedEvent<T extends Function> implements Event<T> {
  private ee: EventEmitter;
  private eventName: string;
  constructor(ee: EventEmitter, eventName: string) {
    this.ee = ee;
    this.eventName = eventName;
  }

  addListener(listener: T) {
    // @ts-ignore Function and (..args) => void
    this.ee.addListener(this.eventName, listener);
  }
  
  removeListener(listener: T) {
    // @ts-ignore Function and (..args) => void
    this.ee.removeListener(this.eventName, listener);
  }

}

export class MockPort extends EventEmitter implements MessagingPort {
  onMessage: PortMessageEvent;
  onDisconnect: PortDisconnectEvent;
  id: number;

  constructor() {
    super();
    this.onMessage = new EventEmitterBasedEvent(this, 'message');
    this.onDisconnect = new EventEmitterBasedEvent(this, 'disconnect');
    this.id = ID;
    ID +=1;
  }

  postMessage(message: Record<string, unknown>) {
    this.emit('post-message', message);
  }

  disconnect() {
    this.emit('disconnect');
  }
};

export function createMessagingPorts(): [MockPort, MockPort] {
  const port1 = new MockPort();
  const port2 = new MockPort();

  port1.on('post-message', (...args) => port2.emit('message', ...args));
  port2.on('post-message', (...args) => port1.emit('message', ...args));

  port1.on('disconnect', (...args) => port2.emit('disconnect', ...args));
  port2.on('disconnect', (...args) => port1.emit('disconnect', ...args));


  return [port1, port2];
};