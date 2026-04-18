import { useCallback, useEffect, useReducer } from 'react';

function cloneSnapshot<T>(snapshot: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(snapshot);
  }

  return JSON.parse(JSON.stringify(snapshot)) as T;
}

function areSnapshotsEqual<T>(a: T, b: T): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

type TrialInfo<T> = {
  baseline: T;
  pastLength: number;
  checkpoints: T[];
} | null;

type BatchInfo<T> = {
  baseline: T;
  committed: boolean;
} | null;

type HistoryState<T> = {
  present: T;
  past: T[];
  future: T[];
  trialInfo: TrialInfo<T>;
  batchInfo: BatchInfo<T>;
};

type HistoryAction<T> =
  | { type: 'change'; updater: (snapshot: T) => T; coalesce?: boolean }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'reset'; snapshot: T }
  | { type: 'add-trial-checkpoint' }
  | { type: 'undo-trial-checkpoint' }
  | { type: 'start-trial' }
  | { type: 'discard-trial' }
  | { type: 'commit-trial'; normalizer?: (snapshot: T) => T }
  | { type: 'start-batch' }
  | { type: 'finish-batch' };

function createInitialHistoryState<T>(snapshot: T): HistoryState<T> {
  return {
    present: cloneSnapshot(snapshot),
    past: [],
    future: [],
    trialInfo: null,
    batchInfo: null,
  };
}

function normalizeSnapshot<T>(snapshot: T, normalizer?: (snapshot: T) => T) {
  if (!normalizer) return cloneSnapshot(snapshot);
  return cloneSnapshot(normalizer(cloneSnapshot(snapshot)));
}

function historyReducer<T>(state: HistoryState<T>, action: HistoryAction<T>): HistoryState<T> {
  switch (action.type) {
    case 'change': {
      const nextSnapshot = action.updater(cloneSnapshot(state.present));
      if (areSnapshotsEqual(state.present, nextSnapshot)) return state;

      if (action.coalesce && state.batchInfo) {
        return {
          ...state,
          present: cloneSnapshot(nextSnapshot),
          past: state.batchInfo.committed
            ? state.past
            : [...state.past, cloneSnapshot(state.batchInfo.baseline)],
          future: [],
          batchInfo: {
            ...state.batchInfo,
            committed: true,
          },
        };
      }

      return {
        ...state,
        present: cloneSnapshot(nextSnapshot),
        past: [...state.past, cloneSnapshot(state.present)],
        future: [],
        batchInfo: null,
      };
    }

    case 'undo': {
      if (state.past.length === 0) return state;

      const previous = state.past[state.past.length - 1];
      return {
        ...state,
        present: cloneSnapshot(previous),
        past: state.past.slice(0, -1),
        future: [cloneSnapshot(state.present), ...state.future],
        batchInfo: null,
      };
    }

    case 'redo': {
      if (state.future.length === 0) return state;

      const [next, ...restFuture] = state.future;
      return {
        ...state,
        present: cloneSnapshot(next),
        past: [...state.past, cloneSnapshot(state.present)],
        future: restFuture,
        batchInfo: null,
      };
    }

    case 'reset':
      return createInitialHistoryState(action.snapshot);

    case 'add-trial-checkpoint': {
      if (!state.trialInfo) return state;

      const previousCheckpoint =
        state.trialInfo.checkpoints[state.trialInfo.checkpoints.length - 1] ?? state.trialInfo.baseline;

      if (areSnapshotsEqual(state.present, previousCheckpoint)) return state;

      return {
        ...state,
        trialInfo: {
          ...state.trialInfo,
          checkpoints: [...state.trialInfo.checkpoints, cloneSnapshot(state.present)],
        },
        batchInfo: null,
      };
    }

    case 'undo-trial-checkpoint': {
      if (!state.trialInfo) return state;

      const checkpoints = [...state.trialInfo.checkpoints];
      const lastCheckpoint = checkpoints[checkpoints.length - 1] ?? null;
      const currentIsLastCheckpoint =
        lastCheckpoint !== null && areSnapshotsEqual(state.present, lastCheckpoint);

      if (!lastCheckpoint) {
        if (areSnapshotsEqual(state.present, state.trialInfo.baseline)) return state;

        return {
          ...state,
          present: cloneSnapshot(state.trialInfo.baseline),
          past: [...state.past, cloneSnapshot(state.present)],
          future: [],
          batchInfo: null,
        };
      }

      if (currentIsLastCheckpoint) {
        checkpoints.pop();
      }

      const targetSnapshot = checkpoints[checkpoints.length - 1] ?? state.trialInfo.baseline;
      if (areSnapshotsEqual(state.present, targetSnapshot) && !currentIsLastCheckpoint) return state;

      return {
        ...state,
        present: cloneSnapshot(targetSnapshot),
        past: [...state.past, cloneSnapshot(state.present)],
        future: [],
        trialInfo: {
          ...state.trialInfo,
          checkpoints,
        },
        batchInfo: null,
      };
    }

    case 'start-trial': {
      if (state.trialInfo) return state;

      return {
        ...state,
        trialInfo: {
          baseline: cloneSnapshot(state.present),
          pastLength: state.past.length,
          checkpoints: [],
        },
        batchInfo: null,
      };
    }

    case 'discard-trial': {
      if (!state.trialInfo) return state;

      return {
        ...state,
        present: cloneSnapshot(state.trialInfo.baseline),
        past: state.past.slice(0, state.trialInfo.pastLength),
        future: [],
        trialInfo: null,
        batchInfo: null,
      };
    }

    case 'commit-trial':
      if (!state.trialInfo) return state;
      return {
        ...state,
        present: normalizeSnapshot(state.present, action.normalizer),
        past: state.past.map((snapshot) => normalizeSnapshot(snapshot, action.normalizer)),
        future: state.future.map((snapshot) => normalizeSnapshot(snapshot, action.normalizer)),
        trialInfo: null,
        batchInfo: null,
      };

    case 'start-batch':
      if (state.batchInfo) return state;
      return {
        ...state,
        batchInfo: {
          baseline: cloneSnapshot(state.present),
          committed: false,
        },
      };

    case 'finish-batch':
      if (!state.batchInfo) return state;
      return {
        ...state,
        batchInfo: null,
      };

    default:
      return state;
  }
}

interface UsePuzzleHistoryOptions<T> {
  normalizeTrialSnapshot?: (snapshot: T) => T;
  onSnapshotChange?: (snapshot: T) => void;
}

export function usePuzzleHistory<T>(initialSnapshot: T, options?: UsePuzzleHistoryOptions<T>) {
  const [state, dispatch] = useReducer(historyReducer<T>, initialSnapshot, createInitialHistoryState);
  const normalizeTrialSnapshot = options?.normalizeTrialSnapshot;
  const onSnapshotChange = options?.onSnapshotChange;

  const applyChange = useCallback((updater: (current: T) => T, settings?: { coalesce?: boolean }) => {
    dispatch({
      type: 'change',
      updater,
      coalesce: settings?.coalesce,
    });
  }, []);

  const reset = useCallback((snapshot: T) => {
    dispatch({ type: 'reset', snapshot });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: 'undo' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'redo' });
  }, []);

  const addTrialCheckpoint = useCallback(() => {
    dispatch({ type: 'add-trial-checkpoint' });
  }, []);

  const undoTrialCheckpoint = useCallback(() => {
    dispatch({ type: 'undo-trial-checkpoint' });
  }, []);

  const startTrial = useCallback(() => {
    dispatch({ type: 'start-trial' });
  }, []);

  const discardTrial = useCallback(() => {
    dispatch({ type: 'discard-trial' });
  }, []);

  const commitTrial = useCallback(() => {
    dispatch({ type: 'commit-trial', normalizer: normalizeTrialSnapshot });
  }, [normalizeTrialSnapshot]);

  const startBatch = useCallback(() => {
    dispatch({ type: 'start-batch' });
  }, []);

  const finishBatch = useCallback(() => {
    dispatch({ type: 'finish-batch' });
  }, []);

  useEffect(() => {
    onSnapshotChange?.(state.present);
  }, [onSnapshotChange, state.present]);

  return {
    snapshot: state.present,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    trialActive: state.trialInfo !== null,
    trialCheckpointCount: state.trialInfo?.checkpoints.length ?? 0,
    currentTrialLevel: state.trialInfo ? state.trialInfo.checkpoints.length + 1 : 0,
    canUndoTrialCheckpoint:
      state.trialInfo !== null &&
      (state.trialInfo.checkpoints.length > 0 ||
        !areSnapshotsEqual(state.present, state.trialInfo.baseline)),
    applyChange,
    startBatch,
    finishBatch,
    reset,
    undo,
    redo,
    addTrialCheckpoint,
    undoTrialCheckpoint,
    startTrial,
    discardTrial,
    commitTrial,
  };
}
