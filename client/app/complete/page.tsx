'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AUTH } from '@/lib/auth';
import { useGame } from '@/lib/game-context';
import dynamic from 'next/dynamic';

const CampusCanvas = dynamic(() => import('@/components/campus/CampusCanvas'), { ssr: false });

export default function CompletePage() {
  const router = useRouter();
  const { state } = useGame();

  useEffect(() => {
    if (!AUTH.isLoggedIn()) {
      router.replace('/login');
    }
  }, [router]);

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
      <div className="complete-card">
        <h1>🎉 School Complete!</h1>
        <p>Your team built the entire campus and mastered Python fundamentals.</p>

        <div style={{ margin: '1.5rem auto', width: 500, height: 350 }}>
          <CampusCanvas
            completedStages={5}
            style={{ width: '100%', height: '100%', borderRadius: 12, border: '2px solid var(--black)' }}
          />
        </div>

        <p id="final-score">Final Score: {state.score}/500</p>

        <button
          className="btn btn-primary"
          style={{ marginTop: '1rem' }}
          onClick={() => router.push('/lobby')}
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
