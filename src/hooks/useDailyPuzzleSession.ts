import { useCallback, useEffect, useState } from 'react';
import { getBeijingDateStr, getDailyPuzzle, getHistoryPuzzles } from '../puzzles/database';
import type { DailyPuzzleData, HistoryPuzzleData } from '../puzzles/types';

interface SavedCompletion {
  time: number;
}

interface DailyPuzzleSessionState {
  daily: DailyPuzzleData | null;
  history: HistoryPuzzleData[];
  started: boolean;
  startTime: number | null;
  elapsedTime: number;
  completed: boolean;
  savedCompletion: SavedCompletion | null;
}

function getStorageKey(dateStr: string) {
  return `puzzle-completion-${dateStr}`;
}

function readSavedCompletion(dateStr: string): SavedCompletion | null {
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

function createInitialSessionState(): DailyPuzzleSessionState {
  const daily = getDailyPuzzle();
  const history = daily ? getHistoryPuzzles(daily.daysSinceStart) : [];
  const todayStr = getBeijingDateStr();
  const savedCompletion = daily ? readSavedCompletion(todayStr) : null;

  return {
    daily,
    history,
    started: !!savedCompletion,
    startTime: savedCompletion ? Date.now() : null,
    elapsedTime: savedCompletion?.time ?? 0,
    completed: !!savedCompletion,
    savedCompletion,
  };
}

export function useDailyPuzzleSession() {
  const [initialState] = useState<DailyPuzzleSessionState>(() => createInitialSessionState());
  const [daily, setDaily] = useState<DailyPuzzleData | null>(initialState.daily);
  const [history] = useState<HistoryPuzzleData[]>(initialState.history);
  const [started, setStarted] = useState(initialState.started);
  const [startTime, setStartTime] = useState<number | null>(initialState.startTime);
  const [elapsedTime, setElapsedTime] = useState(initialState.elapsedTime);
  const [completed, setCompleted] = useState(initialState.completed);
  const [savedCompletion, setSavedCompletion] = useState<SavedCompletion | null>(initialState.savedCompletion);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!started || !startTime || completed) return;

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [completed, started, startTime]);

  const saveCompletion = useCallback((time: number) => {
    if (!daily || typeof window === 'undefined') return;

    const todayStr = getBeijingDateStr();
    localStorage.setItem(getStorageKey(todayStr), JSON.stringify({ time }));
    setSavedCompletion({ time });
  }, [daily]);

  const handleStart = useCallback(() => {
    setStarted(true);
    setStartTime(Date.now());
    setElapsedTime(0);
    setCompleted(false);
    setSavedCompletion(null);
  }, []);

  const handleComplete = useCallback((finalTime: number) => {
    setElapsedTime(finalTime);
    setCompleted(true);
    saveCompletion(finalTime);
  }, [saveCompletion]);

  const handleViewResult = useCallback(() => {
    setCompleted(true);
  }, []);

  const closeCompletion = useCallback(() => {
    setCompleted(false);
  }, []);

  const openHistory = useCallback(() => {
    setShowHistory(true);
  }, []);

  const closeHistory = useCallback(() => {
    setShowHistory(false);
  }, []);

  const loadHistoryPuzzle = useCallback((item: HistoryPuzzleData) => {
    setDaily({
      puzzle: item.puzzle,
      template: item.template,
      index: item.index,
      daysSinceStart: 0,
    });
    setStarted(false);
    setCompleted(false);
    setStartTime(null);
    setElapsedTime(0);
    setSavedCompletion(null);
    setShowHistory(false);
  }, []);

  return {
    daily,
    history,
    started,
    startTime,
    elapsedTime,
    completed,
    savedCompletion,
    showHistory,
    handleStart,
    handleComplete,
    handleViewResult,
    closeCompletion,
    openHistory,
    closeHistory,
    loadHistoryPuzzle,
  };
}
