import { storage } from '../utils/storage';
/**
    * The initial state of the application.
    */
const initialState = {
    categories: [],
    currentCategory: null,
    lastUpdated: null,
    scrollPositions: {},
    pages: {},
    items: [],
    isLoading: true, // Start in a loading state
    favorites: storage.get('favorites') || [],
    hiddenItems: storage.get('hiddenItems') || [],
    theme: storage.get('theme') || 'light',
    autoScroll: storage.get('autoScroll') || {
        enabled: false,
        interval: 5000,
    },
    youtubePlaylists: storage.get('youtubePlaylists') || {
        cooking: '',
        travel: '',
    },
    showTrending: storage.get('showTrending') ?? true,
};
/**
 * A simple state management class that holds the application state
 * and allows for updates and subscriptions to state changes.
 */
class StateManager {
    constructor(initialState) {
        this.listeners = new Set();
        this.state = initialState;
    }
    /**
     * Returns the current state.
     *
     * @returns {AppState} The current application state.
     */
    getState() {
        return this.state;
    }
    /**
     * Updates the state with a partial new state and notifies listeners.
     *
     * @param {Partial<AppState>} newState - The partial state to merge.
     */
    setState(newState) {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...newState };
        this.listeners.forEach(listener => listener(this.state, oldState));
        // Persist the relevant parts of the state to local storage
        storage.set('favorites', this.state.favorites);
        storage.set('hiddenItems', this.state.hiddenItems);
        storage.set('theme', this.state.theme);
        storage.set('autoScroll', this.state.autoScroll);
        storage.set('youtubePlaylists', this.state.youtubePlaylists);
        storage.set('showTrending', this.state.showTrending);
    }
    /**
     * Subscribes a listener function to state changes.
     *
     * @param {(state: AppState) => void} listener - The listener function.
     * @returns {() => void} An unsubscribe function.
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }
}
export const stateManager = new StateManager(initialState);
