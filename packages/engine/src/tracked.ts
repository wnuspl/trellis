export interface Tracked {
    _notifyModification: (() => void) | undefined;
    _modified: boolean;
    _reset: () => void;
}
export function markModification(tracked: Tracked) {
    tracked._modified = true;
    tracked._notifyModification?.();
}