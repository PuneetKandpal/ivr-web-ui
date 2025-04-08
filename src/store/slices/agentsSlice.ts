import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Agent {
  id: string;
  name: string;
  department: string;
  isAvailable: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface AgentsState {
  agents: Agent[];
  loading: boolean;
  error: string | null;
}

const initialState: AgentsState = {
  agents: [
    {
      id: '1',
      name: 'John Doe',
      department: 'Support',
      isAvailable: true,
      priority: 'high',
    },
    {
      id: '2',
      name: 'Jane Smith',
      department: 'Sales',
      isAvailable: false,
      priority: 'medium',
    },
  ],
  loading: false,
  error: null,
};

const agentsSlice = createSlice({
  name: 'agents',
  initialState,
  reducers: {
    setAgents: (state, action: PayloadAction<Agent[]>) => {
      state.agents = action.payload;
    },
    toggleAvailability: (state, action: PayloadAction<string>) => {
      const agent = state.agents.find(a => a.id === action.payload);
      if (agent) {
        agent.isAvailable = !agent.isAvailable;
      }
    },
    updateAgent: (state, action: PayloadAction<Agent>) => {
      const index = state.agents.findIndex(a => a.id === action.payload.id);
      if (index !== -1) {
        state.agents[index] = action.payload;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setAgents,
  toggleAvailability,
  updateAgent,
  setLoading,
  setError,
} = agentsSlice.actions;

export default agentsSlice.reducer; 