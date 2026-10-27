import React, { useState, useEffect, useCallback } from 'react';
import { GameMode, PlayerProgress, RoundResult, motion } from '../types/gameTypes';
import { loadProgress, saveProgress, recordLevelCompletion } from '../services/storage';
import { sound } from '../services/audio';
import { haptics } from '../services/haptics';
import { music } from '../services/music';
import { useAppLifecycle } from '../hooks/useAppLifecycle';
import { SplashScreen } from '../components/SplashScreen';
import { adService } from '../services/adService';
import { SplashScreen as CapSplashScreen } from '@capacitor/splash-screen';

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

type AppScreen = 'home' | 'game';

const COOLDOWN_STORAGE_KEY = 'tap_untangle_cooldown_until';
const COOLDOWN_DURATION_MS = 120 * 1000; // 2 minutes wait when out of lives

// TEMP stub: replace with your real rewarded-ad SDK call.
// Must resolve true ONLY when the player earned the reward.

export const App: React.FC = () => {
  // 1. ALL HOOKS DECLARED FIRST AT THE TOP (NO CONDITIONAL RETURNS ABOVE THIS)
  const [showSplash, setShowSplash] = useState(false);
  const [progress, setProgress] = useState<PlayerProgress>(() => {
    const p = loadProgress();
    return {
      ...p,
      untangleLevel: p.untangleLevel ?? 1,
      untangleStats: p.untangleStats ?? {},
    };
  });

  const [screen, setScreen] = useState<AppScreen>('home');
  const [gameMode, setGameMode] = useState<GameMode>('untangle');
  const [activeLevel, setActiveLevel] = useState<number>(progress.untangleLevel ?? 1);

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

  // Persistent anti-cheat cooldown timestamp (ms)
  const [cooldownUntil, setCooldownUntil] = useState<number>(() => {
    const raw = localStorage.getItem(COOLDOWN_STORAGE_KEY);
    const parsed = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) && parsed > Date.now() ? parsed : 0;
  });
  const [cooldownSecondsLeft, setCooldownSecondsLeft] = useState<number>(() =>
    Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000))
  );

  const setGlobalCooldown = useCallback((untilMs: number) => {
    if (untilMs > Date.now()) {
      localStorage.setItem(COOLDOWN_STORAGE_KEY, String(untilMs));
      setCooldownUntil(untilMs);
      setCooldownSecondsLeft(Math.max(0, Math.ceil((untilMs - Date.now()) / 1000)));
    } else {
      localStorage.removeItem(COOLDOWN_STORAGE_KEY);
      setCooldownUntil(0);
      setCooldownSecondsLeft(0);
    }
  }, []);

  useEffect(() => {
    // Hide native Capacitor splash screen once React is ready
    CapSplashScreen.hide().catch(() => { });
    // Initialize AdMob and pre-load the first rewarded ad in the background
    adService.initialize();
  }, []);

  // Tick global cooldown every second
  useEffect(() => {
    if (cooldownUntil <= Date.now()) {
      setCooldownSecondsLeft(0);
      return;
    }
    const tick = () => {
      const rem = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setCooldownSecondsLeft(rem);
      if (rem <= 0) {
        localStorage.removeItem(COOLDOWN_STORAGE_KEY);
        setCooldownUntil(0);
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [cooldownUntil]);

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

  // 2. EVENT HANDLERS
  const handleStartGame = (mode: GameMode, level: number) => {
    if (cooldownSecondsLeft > 0) return;

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

      if (!result.cleared) {
        setGlobalCooldown(Date.now() + COOLDOWN_DURATION_MS);
        return;
      }

      setGlobalCooldown(0);

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
                bestTime: old?.bestTime
                  ? Math.min(old.bestTime, result.timeSpent)
                  : result.timeSpent,
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
    [gameMode, setGlobalCooldown]
  );

  const handleNextLevel = () => {
    setActiveLevel((l) => l + 1);
    setRoundResult(null);
    setRevivesUsed(0);
    setReviveToken(0);
  };

  const handleReplay = () => {
    if (cooldownSecondsLeft > 0) return;
    setRoundResult(null);
    setRevivesUsed(0);
    setReviveToken(0);
    setGameSessionKey((k) => k + 1);
  };

  const handleHome = () => {
    setRoundResult(null);
    setRevivesUsed(0);
    setReviveToken(0);
    setScreen('home');
  };

  // Update your handlers to use the service:
  const handleWatchAdRevive = async (): Promise<boolean> => {
    const rewarded = await adService.showRewardedAd();
    if (!rewarded) return false;

    setGlobalCooldown(0);
    setRevivesUsed((n) => n + 1);
    setRoundResult(null);
    setReviveToken((t) => t + 1);
    return true;
  };

  const handleUnlockCooldownWithAd = async (): Promise<boolean> => {
    const rewarded = await adService.showRewardedAd();
    if (!rewarded) return false;
    setGlobalCooldown(0);
    return true;
  };

  const handleUpdateProgress = (updater: (p: PlayerProgress) => PlayerProgress) => {
    setProgress((prev) => {
      const updated = updater(prev);
      saveProgress(updated);
      return updated;
    });
  };

  // 3. CONDITIONAL SPLASH SCREEN (NOW RENDERED AFTER ALL HOOKS)
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // 4. MAIN APP RENDER
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Main View Router */}
      {screen === 'game' ? (
        gameMode === 'untangle' ? (
          <UntangleScreen
            key={`untangle-${activeLevel}-${gameSessionKey}`}
            level={activeLevel}
            reviveSignal={reviveToken}
            bestScore={progress.untangleStats?.[activeLevel]?.highScore}
            onFinished={handleRoundFinished}
            onOpenPause={() => setIsPauseOpen(true)}
            onRequestHint={adService.showRewardedAd}
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
            onRestart={() => {
              if (cooldownSecondsLeft > 0) return;
              setRevivesUsed(0);
              setReviveToken(0);
            }}
          />
        )
      ) : subView === 'achievements' ? (
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
              cooldownSecondsLeft={cooldownSecondsLeft}
              onWatchAdRefill={handleUnlockCooldownWithAd}
            />
          )}
          {currentTab === 'daily' && (
            <DailyTab
              progress={progress}
              onBack={() => setCurrentTab('main')}
              onStartLevel={(mode, lvl) => handleStartGame(mode, lvl)}
              cooldownSecondsLeft={cooldownSecondsLeft}
              onWatchAdRefill={handleUnlockCooldownWithAd}
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
      )}

      {/* Global Overlays & Modals */}
      <PauseModal
        isOpen={isPauseOpen}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onResume={() => setIsPauseOpen(false)}
        onRestart={() => {
          if (cooldownSecondsLeft > 0) return;
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
        onCooldownComplete={() => setGlobalCooldown(0)}
        canRevive={revivesUsed < 1}
        cooldownSeconds={cooldownSecondsLeft}
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