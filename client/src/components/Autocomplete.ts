import { storage } from '../utils/storage';

const MAX_SUGGESTIONS = 5;
const SEARCH_HISTORY_KEY = 'searchHistory';

export class Autocomplete {
    private input: HTMLInputElement;
    private container: HTMLElement;
    private suggestions: string[] = [];
    private onSelect: (value: string) => void;

    constructor(input: HTMLInputElement, onSelect: (value: string) => void) {
        this.input = input;
        this.onSelect = onSelect;
        this.container = this.createContainer();
        this.input.parentNode?.insertBefore(this.container, this.input.nextSibling);

        this.loadSuggestions();
        this.setupEventListeners();
    }

    private createContainer(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'autocomplete-container';
        return container;
    }

    private loadSuggestions() {
        this.suggestions = storage.get(SEARCH_HISTORY_KEY) || [];
    }

    private saveSuggestions() {
        storage.set(SEARCH_HISTORY_KEY, this.suggestions);
    }

    private setupEventListeners() {
        this.input.addEventListener('input', () => this.onInput());
        this.input.addEventListener('focus', () => this.onFocus());
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target as Node) && e.target !== this.input) {
                this.hide();
            }
        });
    }

    private onFocus() {
        if (this.input.value.length === 0) {
            this.render(this.suggestions);
        }
    }

    private onInput() {
        const value = this.input.value.toLowerCase();
        if (value.length === 0) {
            this.hide();
            return;
        }

        const filtered = this.suggestions.filter(s => s.toLowerCase().includes(value));
        this.render(filtered);
    }

    public addSearchTerm(term: string) {
        if (!term || term.trim().length === 0) return;

        // Remove any existing instance of the term to move it to the top
        const existingIndex = this.suggestions.indexOf(term);
        if (existingIndex > -1) {
            this.suggestions.splice(existingIndex, 1);
        }

        // Add to the beginning of the array
        this.suggestions.unshift(term);

        // Trim the array to the max size
        if (this.suggestions.length > MAX_SUGGESTIONS) {
            this.suggestions.length = MAX_SUGGESTIONS;
        }

        this.saveSuggestions();
    }

    private render(items: string[]) {
        if (items.length === 0) {
            this.hide();
            return;
        }

        this.container.innerHTML = '';
        const ul = document.createElement('ul');

        items.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            li.addEventListener('click', () => {
                this.input.value = item;
                this.onSelect(item);
                this.hide();
            });

            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-suggestion';
            deleteButton.innerHTML = '&times;';
            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent the li click event from firing
                this.removeSuggestion(item);
            });

            li.appendChild(deleteButton);
            ul.appendChild(li);
        });

        this.container.appendChild(ul);
        this.show();
    }

    private removeSuggestion(term: string) {
        this.suggestions = this.suggestions.filter(s => s !== term);
        this.saveSuggestions();
        this.onInput(); // Re-render the suggestions
    }



    private show() {
        this.container.style.display = 'block';
    }

    public hide() {
        this.container.style.display = 'none';
    }
}