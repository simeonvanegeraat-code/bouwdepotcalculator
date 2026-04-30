const STORAGE_KEY = 'bdc:shared-inputs:v1';
const TTL_MS = 90 * 24 * 60 * 60 * 1000;

const SHARED_FIELD_CONFIG = {
    mortgageRate: {
        selectors: ['#input-interest', '#range-interest', '#input-mortgage-rate', '#input-renteverlies-hypotheek', '#fiscal-interest', '#range-fiscal-interest'],
        type: 'number',
        minMeaningful: 0.01
    },
    mortgageType: {
        selectors: ['#input-type', '#fiscal-type'],
        type: 'select'
    },
    depotAmount: {
        selectors: ['#input-amount', '#range-amount', '#input-depot-amount', '#input-renteverlies-depot'],
        type: 'number',
        minMeaningful: 1
    },
    mortgageAmount: {
        selectors: ['#input-total-mortgage', '#fiscal-amount'],
        type: 'number',
        minMeaningful: 1
    },
    depotCompensationRate: {
        selectors: ['#input-depot-rate', '#input-renteverlies-vergoeding'],
        type: 'number',
        minMeaningful: 0.01
    },
    currentHousingCost: {
        selectors: ['#input-current-housing', '#input-dubbel-current', '#input-extra-housing'],
        type: 'number',
        minMeaningful: 1
    }
};

function createDebounced(fn, delay = 250) {
    let timeoutId = null;
    return () => {
        window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(fn, delay);
    };
}

function readNumberAttr(input, attrName) {
    if (!(input instanceof HTMLInputElement)) return null;
    const raw = input.getAttribute(attrName);
    if (raw === null || raw === '') return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
}

function isStorageAvailable() {
    try {
        const probeKey = '__bdc_memory_probe__';
        window.localStorage.setItem(probeKey, '1');
        window.localStorage.removeItem(probeKey);
        return true;
    } catch (error) {
        return false;
    }
}

function parseStoredState() {
    if (!isStorageAvailable()) return {};

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
        return {};
    }
}

function writeStoredState(nextState) {
    if (!isStorageAvailable()) return;

    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    } catch (error) {
        // doelbewust stil falen: calculators moeten blijven werken
    }
}

function pruneExpiredEntries(state) {
    const now = Date.now();
    const nextState = { ...state };
    let changed = false;

    Object.entries(state).forEach(([key, entry]) => {
        if (!entry || typeof entry !== 'object' || !entry.updatedAt) {
            delete nextState[key];
            changed = true;
            return;
        }

        const updatedAt = Date.parse(entry.updatedAt);
        if (!Number.isFinite(updatedAt) || now - updatedAt > TTL_MS) {
            delete nextState[key];
            changed = true;
        }
    });

    if (changed) writeStoredState(nextState);
    return nextState;
}

function normalizeValueForInput(input, key, rawValue) {
    const config = SHARED_FIELD_CONFIG[key];
    if (!config) return null;

    if (config.type === 'select') {
        if (!(input instanceof HTMLSelectElement) || typeof rawValue !== 'string' || !rawValue.trim()) {
            return null;
        }

        const hasOption = Array.from(input.options).some((option) => option.value === rawValue);
        return hasOption ? rawValue : null;
    }

    if (!(input instanceof HTMLInputElement)) return null;

    const numericValue = Number(rawValue);
    if (!Number.isFinite(numericValue)) return null;

    const min = readNumberAttr(input, 'min');
    const max = readNumberAttr(input, 'max');

    if (min !== null && numericValue < min) return null;
    if (max !== null && numericValue > max) return null;
    if (config.minMeaningful !== undefined && numericValue < config.minMeaningful) return null;

    return String(numericValue);
}

function hasExplicitLock(input) {
    return input.dataset.memoryLock === 'true';
}

function getSharedKeyByElement(input) {
    return Object.entries(SHARED_FIELD_CONFIG).find(([, config]) => {
        return config.selectors.some((selector) => input.matches(selector));
    })?.[0] || null;
}

function applyRememberedValues() {
    const initialState = pruneExpiredEntries(parseStoredState());
    const state = { ...initialState };
    let changed = false;

    Object.entries(SHARED_FIELD_CONFIG).forEach(([key, config]) => {
        const storedEntry = state[key];
        if (!storedEntry) return;

        config.selectors.forEach((selector) => {
            document.querySelectorAll(selector).forEach((input) => {
                if (!(input instanceof HTMLInputElement) && !(input instanceof HTMLSelectElement)) return;
                if (hasExplicitLock(input)) return;

                const normalized = normalizeValueForInput(input, key, storedEntry.value);
                if (normalized === null) {
                    delete state[key];
                    changed = true;
                    return;
                }

                input.value = normalized;
            });
        });
    });

    if (changed) writeStoredState(state);
}

function persistFieldValue(input) {
    const sharedKey = getSharedKeyByElement(input);
    if (!sharedKey) return;

    const normalized = normalizeValueForInput(input, sharedKey, input.value);
    if (normalized === null) return;

    const state = pruneExpiredEntries(parseStoredState());
    state[sharedKey] = {
        value: SHARED_FIELD_CONFIG[sharedKey].type === 'number' ? Number(normalized) : normalized,
        updatedAt: new Date().toISOString()
    };

    writeStoredState(state);
}

function bindPersistence() {
    Object.values(SHARED_FIELD_CONFIG).forEach((config) => {
        config.selectors.forEach((selector) => {
            document.querySelectorAll(selector).forEach((input) => {
                if (!(input instanceof HTMLInputElement) && !(input instanceof HTMLSelectElement)) return;

                const debouncedPersist = createDebounced(() => persistFieldValue(input));
                input.addEventListener('input', debouncedPersist);
                input.addEventListener('change', () => persistFieldValue(input));
            });
        });
    });
}

function clearSharedMemory() {
    if (!isStorageAvailable()) return;

    try {
        window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        // doelbewust stil falen
    }
}

function injectResetActions() {
    const calculatorCards = document.querySelectorAll('.calculator-card');
    if (!calculatorCards.length) return;

    calculatorCards.forEach((card) => {
        if (card.dataset.showMemoryNote === 'false') return;
        if (card.querySelector('.shared-memory-controls')) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'shared-memory-controls';
        wrapper.innerHTML = `
            <p class="shared-memory-note">Bedrag en rentepercentages worden lokaal op dit apparaat onthouden. <button type="button" class="shared-memory-reset">Wissen</button></p>
        `;

        const resetButton = wrapper.querySelector('.shared-memory-reset');
        resetButton?.addEventListener('click', () => {
            clearSharedMemory();
            wrapper.classList.add('shared-memory-cleared');
            window.setTimeout(() => wrapper.classList.remove('shared-memory-cleared'), 1800);
        });

        card.appendChild(wrapper);
    });
}

export function initSharedFormMemory() {
    applyRememberedValues();
    bindPersistence();
    injectResetActions();
}

export function setMemoryLockById(id, isLocked = true) {
    const element = document.getElementById(id);
    if (!element) return;
    element.dataset.memoryLock = isLocked ? 'true' : 'false';
}
