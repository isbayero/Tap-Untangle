import React, { useState, useEffect, useCallback } from 'react';
import { GameMode, PlayerProgress, RoundResult } from '../types/gameTypes';
import { loadProgress, saveProgress, recordLevelCompletion } from '../services/storage';
import { sound } from '../services/audio';
import { haptics } from '../services/haptics';
import { music } from '../services/music';
import { motion } from '../types/gameTypes';
import { useAppLifecycle } from '../hooks/useAppLifecycle';

// Game & Modals
import { GameScreen } from '../features/game/GameScreen';
import { PauseModal } from '../features/pause/PauseModal';
import { ResultsModal } from '../features/results/ResultsModal';
import { SettingsModal } from '../features/settings/SettingsModal';
import { UntangleScreen } from '../features/untangle/UntangleScreen';
// Navigation & Tabs
import { BottomNav, TabType } from '../components/BottomNav';
import { MainTab } from '../features/home/MainTab';
import { DailyTab } from '../features/daily/DailyTab';
import { MeTab } from '../features/profile/MeTab';
import { AchievementsTab } from '../features/awards/AchievementsTab';
import { AwardsTab } from '../features/awards/AwardsTab';

type AppScreen = 'home' | 'game' | 'untangle';

// TEMP stub: replace with your real rewarded-ad SDK call.
// Must resolve true ONLY when the player earned the reward.
const showRewardedAd = async (): Promise<boolean> => {
  await new Promise((r) => setTimeout(r, 1500));
  return true;
};

export const App: React.FC = () => {
  const [progress, setProgress] = useState<PlayerProgress>(() => {
    const p = loadProgress();
    return { ...p, untangleLevel: p.untangleLevel ?? 1, untangleStats: p.untangleStats ?? {} };
  });
  const [screen, setScreen] = useState<AppScreen>('home');
  const [gameMode, setGameMode] = useState<GameMode>('campaign');
  const [activeLevel, setActiveLevel] = useState<number>(progress.currentLevel);

  // Tab & Subview Routing
  const [currentTab, setCurrentTab] = useState<TabType>('main');
  const [subView, setSubView] = useState<'none' | 'achievements' | 'awards'>('none');

  // Game Session State
  const [isPauseOpen, setIsPauseOpen] = useState<boolean>(false);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [revivesUsed, setRevivesUsed] = useState(0);
  const [reviveToken, setReviveToken] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [gameSessionKey, setGameSessionKey] = useState<number>(0);

  useEffect(() => {
    sound.setEnabled(progress.soundEnabled);
    haptics.setEnabled(progress.hapticsEnabled);
  }, [progress.soundEnabled, progress.hapticsEnabled]);

  useEffect(() => {
    music.setEnabled(progress.musicEnabled ?? false);
  }, [progress.musicEnabled]);

  useEffect(() => {
    const reduced = progress.reduceMotion ?? false;
    motion.reduced = reduced;
    document.documentElement.dataset.reduceMotion = String(reduced);
  }, [progress.reduceMotion]);

  useAppLifecycle(
    useCallback(() => {
      if (screen === 'game' && !roundResult) {
        setIsPauseOpen(true);
      }
    }, [screen, roundResult])
  );

  const handleStartGame = (mode: GameMode, level: number) => {
    setGameMode(mode);
    setActiveLevel(level);
    setRoundResult(null);
    setRevivesUsed(0);
    setReviveToken(0);
    setIsPauseOpen(false);
    setScreen('game');
  };

  const handleRoundFinished = useCallback(
    (result: RoundResult) => {
      setRoundResult(result);
      if (!result.cleared) return;

      if (gameMode === 'untangle') {
        setProgress((prev) => {
          const old = prev.untangleStats?.[result.levelNumber];
          const updated: PlayerProgress = {
            ...prev,
            untangleLevel: Math.max(prev.untangleLevel ?? 1, result.levelNumber + 1),
            totalStars: prev.totalStars + Math.max(0, result.stars - (old?.stars ?? 0)),
            untangleStats: {
              ...(prev.untangleStats ?? {}),
              [result.levelNumber]: {
                stars: Math.max(old?.stars ?? 0, result.stars),
                highScore: Math.max(old?.highScore ?? 0, result.score),
                bestTime: old?.bestTime ? Math.min(old.bestTime, result.timeSpent) : result.timeSpent,
                cleared: true,
              },
            },
          };
          saveProgress(updated);
          return updated;
        });
        return;
      }

      setProgress((prev) =>
        recordLevelCompletion(
          prev,
          result.levelNumber,
          result.stars,
          result.score,
          result.timeSpent,
          10,
          result.maxCombo
        )
      );
    },
    [gameMode]
  );

  const handleNextLevel = () => {
    setActiveLevel((l) => l + 1);
    setRoundResult(null);
    setRevivesUsed(0);
    setReviveToken(0);
  };

  const handleReplay = () => {
    setRoundResult(null);
    setRevivesUsed(0);
    setReviveToken(0);
    setGameSessionKey((k) => k + 1); // remounts GameScreen -> fresh board
  };

  const handleHome = () => {
    setRoundResult(null);
    setRevivesUsed(0);
    setReviveToken(0);
    setScreen('home');
  };

  const handleWatchAdRevive = async (): Promise<boolean> => {
    const rewarded = await showRewardedAd();
    if (!rewarded) return false;

    setRevivesUsed((n) => n + 1);
    setRoundResult(null);            // closes the modal
    setReviveToken((t) => t + 1);    // tells GameScreen to give a life back
    return true;
  };

  const handleUpdateProgress = (updater: (p: PlayerProgress) => PlayerProgress) => {
    setProgress((prev) => {
      const updated = updater(prev);
      saveProgress(updated);
      return updated;
    });
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>

      {/* 1. Main View Router */}
      {screen === 'game' ? (
        gameMode === 'untangle' ? (
          <UntangleScreen
            key={`untangle-${activeLevel}-${gameSessionKey}`}
            level={activeLevel}
            bestScore={progress.untangleStats?.[activeLevel]?.highScore}
            onFinished={handleRoundFinished}
            onOpenPause={() => setIsPauseOpen(true)}
            onRequestHint={showRewardedAd}
          />
        ) : (
          <GameScreen
            key={`${activeLevel}-${gameSessionKey}`}
            level={activeLevel}
            mode={gameMode}
            reviveToken={reviveToken}
            onExit={() => setScreen('home')}
            onFinished={handleRoundFinished}
            onOpenPause={() => setIsPauseOpen(true)}
            onRestart={() => { setRevivesUsed(0); setReviveToken(0); }}
          />
        )
      ) : (
        /* Home Hub Routing */
        subView === 'achievements' ? (
          <AchievementsTab progress={progress} onBack={() => setSubView('none')} />
        ) : subView === 'awards' ? (
          <AwardsTab progress={progress} onBack={() => setSubView('none')} />
        ) : (
          <>
            {currentTab === 'main' && (
              <MainTab
                progress={progress}
                onStartGame={handleStartGame}
                onGoToDaily={() => setCurrentTab('daily')}
              />
            )}
            {currentTab === 'daily' && (
              <DailyTab
                progress={progress}
                onBack={() => setCurrentTab('main')}
                onStartDaily={(seed) => handleStartGame('daily', seed % 50 + 1)}
              />
            )}
            {currentTab === 'me' && (
              <MeTab
                onOpenSettings={() => setIsSettingsOpen(true)}
                onOpenAchievements={() => setSubView('achievements')}
                onOpenAwards={() => setSubView('awards')}
              />
            )}

            <BottomNav
              currentTab={currentTab}
              onTabChange={(tab) => {
                setCurrentTab(tab);
                setSubView('none');
              }}
            />
          </>
        )
      )}

      {/* 2. Global Overlays & Modals */}
      <PauseModal
        isOpen={isPauseOpen}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onResume={() => setIsPauseOpen(false)}
        onRestart={() => {
          setIsPauseOpen(false);
          setRevivesUsed(0);
          setReviveToken(0);
          setGameSessionKey((k) => k + 1);
        }}
        onQuit={() => {
          setIsPauseOpen(false);
          setScreen('home');
        }}
      />

      <ResultsModal
        result={roundResult}
        onNextLevel={handleNextLevel}
        onReplay={handleReplay}
        onHome={handleHome}
        onWatchAdRevive={handleWatchAdRevive}
        canRevive={revivesUsed < 1}
        isUntangle={gameMode === 'untangle'}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        progress={progress}
        onUpdate={handleUpdateProgress}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};