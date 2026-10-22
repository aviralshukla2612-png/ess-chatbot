// Global SSE (Server-Sent Events) in-memory pub-sub broker
// Allows any API action (new message, lead captured, bot edited) to instantly push updates to browser tabs without refresh

class SSEBroker {
  constructor() {
    this.clients = new Set();
  }

  /**
   * Subscribe a client controller to the broker.
   * @param {ReadableStreamDefaultController} controller
   * @param {Object} [metadata={}]
   * @param {string|null} [metadata.organizationId=null]
   * @param {boolean} [metadata.isSuperAdmin=false]
   * @returns {Function} unsubscribe function
   */
  subscribe(controller, metadata = {}) {
    const subscriber = {
      controller,
      organizationId: metadata.organizationId || null,
      isSuperAdmin: Boolean(metadata.isSuperAdmin),
      subscribedAt: new Date(),
    };
    this.clients.add(subscriber);
    return () => {
      this.clients.delete(subscriber);
    };
  }

  /**
   * Broadcast an event to subscribers authorized for the event's organization.
   *
   * Tenant isolation rules:
   * 1. Super-admin subscribers receive all events.
   * 2. Tenant subscribers receive events only if their organizationId matches the event organizationId.
   * 3. Events without any reliable organization association are never delivered to tenant users.
   */
  broadcast(eventType, payload = {}) {
    // Resolve organizationId from top-level or nested entities
    const eventOrgId =
      payload.organizationId ||
      payload.conversation?.organizationId ||
      payload.lead?.organizationId ||
      payload.bot?.organizationId ||
      null;

    const data = JSON.stringify({
      type: eventType,
      data: payload,
      timestamp: new Date().toISOString(),
    });
    const message = `event: message\ndata: ${data}\n\n`;
    const encoded = new TextEncoder().encode(message);

    const deadSubscribers = [];
    for (const sub of this.clients) {
      // Pre-delivery authorization check
      const isAuthorized =
        sub.isSuperAdmin ||
        (Boolean(eventOrgId) && sub.organizationId === eventOrgId);

      if (!isAuthorized) {
        continue;
      }

      try {
        sub.controller.enqueue(encoded);
      } catch (err) {
        deadSubscribers.push(sub);
      }
    }

    for (const dead of deadSubscribers) {
      this.clients.delete(dead);
    }
  }

  getActiveClientsCount(organizationId = null) {
    if (!organizationId) {
      return this.clients.size;
    }
    let count = 0;
    for (const sub of this.clients) {
      if (sub.organizationId === organizationId || sub.isSuperAdmin) {
        count++;
      }
    }
    return count;
  }

  _reset() {
    this.clients.clear();
  }
}

// Preserve broker across Next.js dev server hot-reloads
if (!global.__nexusSSEBroker) {
  global.__nexusSSEBroker = new SSEBroker();
}

export const sseBroker = global.__nexusSSEBroker;
export { SSEBroker };
