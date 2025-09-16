export function loadJSON(key, fallback = null) {
    if (typeof localStorage === 'undefined') {
        return fallback;
    }

    const stored = localStorage.getItem(key);
    if (stored === null) {
        return fallback;
    }

    try {
        const parsed = JSON.parse(stored);
        return parsed ?? fallback;
    } catch (error) {
        console.error(`Failed to parse JSON from localStorage for key "${key}"`, error);
        return fallback;
    }
}

export function saveJSON(key, value) {
    if (typeof localStorage === 'undefined') {
        return;
    }

    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Failed to save JSON to localStorage for key "${key}"`, error);
    }
}
