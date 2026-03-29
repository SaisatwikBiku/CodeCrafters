'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AUTH } from '@/lib/auth';
import { useGame } from '@/lib/game-context';

function WaitingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, updateState } = useGame();

  const sessionId = searchParams.get('sessionId') || state.sessionId || '------';
  const role = searchParams.get('role') || state.role || 'Architect';

  useEffect(() => {
    if (!AUTH.isLoggedIn()) {
      router.replace('/login');
      return;
    }
    if (!sessionId || sessionId === '------') {
      router.replace('/lobby');
      return;
    }

    // Dynamically import socket.io-client only on client
    let socket: any;
    const connectSocket = async () => {
      const { io } = await import('socket.io-client');
      socket = io({ auth: { token: AUTH.getToken() } });

      socket.on('connect', () => {
        socket.emit('join_room', {
          sessionId,
          playerName: AUTH.getUsername(),
          role,
        });
      });

      socket.on('player_joined', ({ playerName, role: joinedRole, state: gameState }: any) => {
        if (gameState?.players?.Architect && gameState?.players?.Builder) {
          updateState({
            socket,
            sessionId: gameState.sessionId || sessionId,
            playerName: AUTH.getUsername(),
            role: role as any,
            currentStage: gameState.stage,
            score: gameState.score,
            completedStages: gameState.stage - 1,
          });
          router.push('/game');
        }
      });

      socket.on('error', ({ message }: any) => {
        alert('Server error: ' + message);
      });
    };

    connectSocket();

    return () => {
      // Don't disconnect — game page needs the socket.
      // Socket is passed via context.
    };
  }, [sessionId, role, router, updateState]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
      }}
    >
      <div className="waiting-card">
        <h2>Session Created!</h2>
        <p>Share this ID with your partner:</p>
        <div className="session-id-display">{sessionId}</div>
        <p className="hint">
          You are the <strong>{role}</strong>. Waiting for your partner to join...
        </p>
        <div className="spinner" />
      </div>
    </div>
  );
}

export default function WaitingPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)' }} />}>
      <WaitingContent />
    </Suspense>
  );
}
