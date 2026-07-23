import { useMeetingStore } from './store/useMeetingStore';
import { LandingPage } from './pages/LandingPage';
import { MeetingRoom } from './pages/MeetingRoom';
import { PostMeetingSummary } from './pages/PostMeetingSummary';

function App() {
  const { status } = useMeetingStore();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30">
      {status === 'landing' && <LandingPage />}
      {status === 'active' && <MeetingRoom />}
      {status === 'ended' && <PostMeetingSummary />}
    </div>
  );
}

export default App;
