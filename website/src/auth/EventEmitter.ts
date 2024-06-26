type Listener = EventListenerOrEventListenerObject

interface ListenerIndex {
  [eventName: string]: Set<Listener>
}

export default class EventEmitter {
  private readonly target: EventTarget
  private listeners: ListenerIndex

  constructor () {
    this.target = new EventTarget()
    this.listeners = {}
  }

  private setOf (eventName: string): Set<Listener> {
    this.listeners[eventName] = this.listeners[eventName] ?? new Set()
    return this.listeners[eventName]
  }

  on (eventName: string, listener: Listener): void {
    // console.log('Event on:', { eventName, listener })
    const existing = this.setOf(eventName)
    existing.add(listener)
    return this.target.addEventListener(eventName, listener)
  }

  once (eventName: string, listener: Listener): void {
    return this.target.addEventListener(eventName, listener, { once: true })
  }

  off (eventName: string, listener: Listener): void {
    // console.log('Event off:', { eventName, listener })
    const existing = this.setOf(eventName)
    existing.delete(listener)
    return this.target.removeEventListener(eventName, listener)
  }

  emit (eventName: string, detail: any): boolean {
    return this.target.dispatchEvent(
      new CustomEvent(eventName, { detail, cancelable: true })
    )
  }

  listenerCount (eventName: string): number {
    const existing = this.setOf(eventName)
    return existing.size
  }
}
