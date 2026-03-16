import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import CreateBot from './components/CreateBot';
import EditBot from './components/EditBot';
import BotDetails from './components/BotDetails';
import Chatbot from './components/Chatbot';
import { Activity, PlusCircle } from 'lucide-react';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col font-sans">
        <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-emerald-400">
              <Activity className="w-6 h-6" />
              RebalanceSim
            </Link>
            <nav className="flex items-center gap-6">
              <Link to="/" className="text-sm font-medium text-zinc-400 hover:text-zinc-50 transition-colors">Dashboard</Link>
              <Link to="/create" className="text-sm font-medium flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 px-3 py-1.5 rounded-full transition-colors">
                <PlusCircle className="w-4 h-4" />
                New Bot
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create" element={<CreateBot />} />
            <Route path="/edit/:id" element={<EditBot />} />
            <Route path="/bot/:id" element={<BotDetails />} />
          </Routes>
        </main>
        
        <Chatbot />
      </div>
    </BrowserRouter>
  );
}
