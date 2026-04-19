import { useCallback, useEffect, useState } from 'react';
import { getDailyPuzzle, getHistoryPuzzles } from '../puzzles/database';
import type { DailyPuzzleData, HistoryPuzzleData } from '../puzzles/types';

export interface SavedCompletion {
  time: number;
}

export interface SavedPuzzleProgress {
  elapsedTime: number;
  snapshot: unknown;
}

interface DailyPuzzleSessionState {
  todayDaily: DailyPuzzleData | null;
  daily: DailyPuzzleData | null;
  history: HistoryPuzzleData[];
  started: boolean;
  startTime: number | null;
  elapsedTime: number;
  attemptCompleted: boolean;
  resultTime: number;
  resultOpen: boolean;
  savedCompletion: SavedCompletion | null;
  savedProgress: SavedPuzzleProgress | null;
}

function getStorageKey(dateStr: string) {
  return `puzzle-completion-${dateStr}`;
}

function getProgressStorageKey(dateStr: string) {
  return `puzzle-progress-${dateStr}`;
}

export function readSavedCompletion(dateStr: string): SavedCompletion | null {
  if (typeof window === 'undefined') return null;

  const saved = localStorage.getItem(getStorageKey(dateStr));
  if (!saved) return null;

  try {
    const data = JSON.parse(saved) as SavedCompletion;
    return typeof data.time === 'number' ? data : null;
  } catch {
    return null;
  }
}

export function readSavedProgress(dateStr: string): SavedPuzzleProgress | null {
  if (typeof window === 'undefined') return null;

  const saved = localStorage.getItem(getProgressStorageKey(dateStr));
  if (!saved) return null;

  try {
    const data = JSON.parse(saved) as SavedPuzzleProgress;
    if (typeof data.elapsedTime !== 'number' || data.snapshot === undefined) return null;
    return data;
  } catch {
    return null;
  }
}

function persistSavedProgress(dateStr: string, progress: SavedPuzzleProgress) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getProgressStorageKey(dateStr), JSON.stringify(progress));
}

function clearSavedProgress(dateStr: string) {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(getProgressStorageKey(dateStr));
}

function createInitialSessionState(): DailyPuzzleSessionState {
  const todayDaily = getDailyPuzzle();
  const daily = todayDaily;
  const history = todayDaily ? getHistoryPuzzles(todayDaily.daysSinceStart) : [];
  const savedCompletion = daily ? readSavedCompletion(daily.dateStr) : null;
  const savedProgress = !savedCompletion && daily ? readSavedProgress(daily.dateStr) : null;
  const initialElapsedTime = savedCompletion?.time ?? savedProgress?.elapsedTime ?? 0;
  const initialStartTime = savedCompletion
    ? Date.now()
    : savedProgress
      ? Date.now() - savedProgress.elapsedTime * 1000
      : null;

  return {
    todayDaily,
    daily,
    history,
    started: !!savedCompletion || !!savedProgress,
    startTime: initialStartTime,
    elapsedTime: initialElapsedTime,
    attemptCompleted: !!savedCompletion,
    resultTime: savedCompletion?.time ?? initialElapsedTime,
    resultOpen: false,
    savedCompletion,
    savedProgress,
  };
}

export function useDailyPuzzleSession() {
  const [initialState] = useState<DailyPuzzleSessionState>(() => createInitialSessionState());
  const [todayDaily] = useState<DailyPuzzleData | null>(initialState.todayDaily);
  const [daily, setDaily] = useState<DailyPuzzleData | null>(initialState.daily);
  const [history] = useState<HistoryPuzzleData[]>(initialState.history);
  const [boardInstance, setBoardInstance] = useState(0);
  const [started, setStarted] = useState(initialState.started);
  const [startTime, setStartTime] = useState<number | null>(initialState.startTime);
  const [elapsedTime, setElapsedTime] = useState(initialState.elapsedTime);
  const [attemptCompleted, setAttemptCompleted] = useState(initialState.attemptCompleted);
  const [resultTime, setResultTime] = useState(initialState.resultTime);
  const [resultOpen, setResultOpen] = useState(initialState.resultOpen);
  const [savedCompletion, setSavedCompletion] = useState<SavedCompletion | null>(initialState.savedCompletion);
  const [savedProgress, setSavedProgress] = useState<SavedPuzzleProgress | null>(initialState.savedProgress);
  const [boardSnapshot, setBoardSnapshot] = useState<unknown>(initialState.savedProgress?.snapshot ?? null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!started || !startTime || attemptCompleted) return;

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [attemptCompleted, started, startTime]);

  useEffect(() => {
    if (!daily || !started || attemptCompleted || !savedProgress?.snapshot) return;

    const nextProgress = {
      elapsedTime,
      snapshot: savedProgress.snapshot,
    };
    persistSavedProgress(daily.dateStr, nextProgress);
  }, [attemptCompleted, daily, elapsedTime, savedProgress, started]);

  const saveCompletion = useCallback((time: number) => {
    if (!daily || typeof window === 'undefined') return;

    const existingCompletion = readSavedCompletion(daily.dateStr);
    if (existingCompletion) {
      clearSavedProgress(daily.dateStr);
      setSavedProgress(null);
      setSavedCompletion(existingCompletion);
      return existingCompletion;
    }

    const nextCompletion = { time };
    localStorage.setItem(getStorageKey(daily.dateStr), JSON.stringify(nextCompletion));
    clearSavedProgress(daily.dateStr);
    setSavedProgress(null);
    setSavedCompletion(nextCompletion);
    return nextCompletion;
  }, [daily]);

  const handleBoardProgress = useCallback((snapshot: unknown) => {
    if (!daily || !started || attemptCompleted) return;

    const nextProgress = {
      elapsedTime,
      snapshot,
    };
    persistSavedProgress(daily.dateStr, nextProgress);
    setSavedProgress(nextProgress);
  }, [attemptCompleted, daily, elapsedTime, started]);

  const handleStart = useCallback(() => {
    if (daily) {
      clearSavedProgress(daily.dateStr);
    }
    setStarted(true);
    setStartTime(Date.now());
    setElapsedTime(0);
    setAttemptCompleted(false);
    setResultTime(savedCompletion?.time ?? 0);
    setResultOpen(false);
    setSavedProgress(null);
    setBoardSnapshot(null);
    setBoardInstance((value) => value + 1);
  }, [daily, savedCompletion]);

  const restartPuzzle = useCallback((nextElapsedTime: number) => {
    if (daily) {
      clearSavedProgress(daily.dateStr);
    }
    setStarted(true);
    setStartTime(Date.now() - nextElapsedTime * 1000);
    setElapsedTime(nextElapsedTime);
    setAttemptCompleted(false);
    setResultTime(savedCompletion?.time ?? nextElapsedTime);
    setResultOpen(false);
    setSavedProgress(null);
    setBoardSnapshot(null);
    setBoardInstance((value) => value + 1);
  }, [daily, savedCompletion]);

  const handleRestartPreserveTime = useCallback(() => {
    restartPuzzle(elapsedTime);
  }, [elapsedTime, restartPuzzle]);

  const handleRestartResetTime = useCallback(() => {
    restartPuzzle(0);
  }, [restartPuzzle]);

  const handleComplete = useCallback((finalTime: number) => {
    const persistedCompletion = saveCompletion(finalTime);
    setElapsedTime(finalTime);
    setAttemptCompleted(true);
    setResultTime(persistedCompletion?.time ?? finalTime);
    setResultOpen(true);
  }, [saveCompletion]);

  const handleViewResult = useCallback(() => {
    setResultTime(savedCompletion?.time ?? elapsedTime);
    setResultOpen(true);
  }, [elapsedTime, savedCompletion]);

  const closeCompletion = useCallback(() => {
    setResultOpen(false);
  }, []);

  const openHistory = useCallback(() => {
    setShowHistory(true);
  }, []);

  const closeHistory = useCallback(() => {
    setShowHistory(false);
  }, []);

  const loadHistoryPuzzle = useCallback((item: HistoryPuzzleData) => {
    const nextSavedCompletion = readSavedCompletion(item.dateStr);
    const nextSavedProgress = !nextSavedCompletion ? readSavedProgress(item.dateStr) : null;
    const nextElapsedTime = nextSavedCompletion?.time ?? nextSavedProgress?.elapsedTime ?? 0;
    const nextStartTime = nextSavedCompletion
      ? Date.now()
      : nextSavedProgress
        ? Date.now() - nextSavedProgress.elapsedTime * 1000
        : null;

    setDaily({
      puzzle: item.puzzle,
      template: item.template,
      difficulty: item.difficulty,
      index: item.index,
      daysSinceStart: item.daysSinceStart,
      dateStr: item.dateStr,
    });
    setStarted(!!nextSavedCompletion || !!nextSavedProgress);
    setStartTime(nextStartTime);
    setElapsedTime(nextElapsedTime);
    setAttemptCompleted(!!nextSavedCompletion);
    setResultTime(nextSavedCompletion?.time ?? nextElapsedTime);
    setResultOpen(false);
    setSavedCompletion(nextSavedCompletion);
    setSavedProgress(nextSavedProgress);
    setBoardSnapshot(nextSavedProgress?.snapshot ?? null);
    setBoardInstance((value) => value + 1);
    setShowHistory(false);
  }, []);

  return {
    todayDaily,
    daily,
    history,
    boardInstance,
    started,
    startTime,
    elapsedTime,
    attemptCompleted,
    resultTime,
    resultOpen,
    savedCompletion,
    savedProgress,
    showHistory,
    boardSnapshot,
    handleStart,
    handleRestartPreserveTime,
    handleRestartResetTime,
    handleComplete,
    handleViewResult,
    handleBoardProgress,
    closeCompletion,
    openHistory,
    closeHistory,
    loadHistoryPuzzle,
  };
}
