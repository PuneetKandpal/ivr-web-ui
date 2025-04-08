import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import AgentDashboard from './components/AgentDashboard';

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/agent/:agentId" element={<AgentDashboard />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
