import type { RouteId } from '../types/navigation';

export interface RouteState {
  route: RouteId;
  params: Record<string, string>;
}

type RouteListener = (state: RouteState) => void;

class ClientRouter {
  private listeners: Set<RouteListener> = new Set();
  private currentState: RouteState;

  constructor() {
    this.currentState = this.parseHash();
    if (typeof window !== 'undefined') {
      window.addEventListener('hashchange', this.handleHashChange);
      window.addEventListener('popstate', this.handleHashChange);
    }
  }

  private parseHash(): RouteState {
    if (typeof window === 'undefined') {
      return { route: 'home', params: {} };
    }

    const rawHash = window.location.hash.replace(/^#\/?/, '').trim();
    if (!rawHash) {
      return { route: 'home', params: {} };
    }

    const [routePart, queryPart] = rawHash.split('?');
    const route = (routePart || 'home') as RouteId;
    const params: Record<string, string> = {};

    if (queryPart) {
      const searchParams = new URLSearchParams(queryPart);
      searchParams.forEach((val, key) => {
        params[key] = val;
      });
    }

    return { route, params };
  }

  private handleHashChange = () => {
    const newState = this.parseHash();
    this.currentState = newState;
    this.notify();
  };

  private notify() {
    this.listeners.forEach((listener) => listener(this.currentState));
  }

  public getCurrentState(): RouteState {
    return this.currentState;
  }

  public navigate(route: RouteId, params?: Record<string, string>, replace = false) {
    let hash = `#/${route}`;
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams(params);
      hash += `?${searchParams.toString()}`;
    }

    if (typeof window !== 'undefined') {
      if (replace) {
        window.location.replace(hash);
      } else {
        window.location.hash = hash;
      }
    }

    this.currentState = { route, params: params || {} };
    this.notify();
  }

  public subscribe(listener: RouteListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const router = new ClientRouter();
