import { useEffect } from 'react';
import { useMeetingStore } from './store/useMeetingStore';
import { LandingPage } from './pages/LandingPage';
import { MeetingRoom } from './pages/MeetingRoom';
import { PostMeetingSummary } from './pages/PostMeetingSummary';

function App() {
  const { status } = useMeetingStore();

  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    if (pathParts[1] === 'room' && pathParts[2]) {
      // Set the roomId in the Zustand store from the URL path
      useMeetingStore.setState({ roomId: pathParts[2] });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-tr from-purple-100 via-indigo-50 to-purple-200 text-slate-800 selection:bg-blue-500/30">
      {status === 'landing' && <LandingPage />}
      {status === 'active' && <MeetingRoom />}
      {status === 'ended' && <PostMeetingSummary />}
    </div>
  );
}

export default App;
