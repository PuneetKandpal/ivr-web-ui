import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Call {
  id: string;
  callerId: string;
  name: string;
  department: string;
  duration: string;
  status: 'waiting' | 'active' | 'on-hold' | 'transferring' | 'completed';
  queuePosition?: number;
  priority: 'high' | 'medium' | 'low';
}

interface CallsState {
  activeCalls: Call[];
  waitingCalls: Call[];
  loading: boolean;
  error: string | null;
}

const initialState: CallsState = {
  activeCalls: [
    {
      id: '1',
      callerId: '+1234567890',
      name: 'John Smith',
      department: 'Support',
      duration: '00:05:23',
      status: 'active',
      priority: 'high',
    },
  ],
  waitingCalls: [
    {
      id: '2',
      callerId: '+0987654321',
      name: 'Jane Doe',
      department: 'Sales',
      duration: '00:02:15',
      status: 'waiting',
      queuePosition: 1,
      priority: 'medium',
    },
  ],
  loading: false,
  error: null,
};

const callsSlice = createSlice({
  name: 'calls',
  initialState,
  reducers: {
    addCall: (state, action: PayloadAction<Call>) => {
      if (action.payload.status === 'active') {
        state.activeCalls.push(action.payload);
      } else {
        state.waitingCalls.push(action.payload);
      }
    },
    updateCall: (state, action: PayloadAction<Call>) => {
      const { id, status } = action.payload;
      
      // Remove from current list
      state.activeCalls = state.activeCalls.filter(call => call.id !== id);
      state.waitingCalls = state.waitingCalls.filter(call => call.id !== id);
      
      // Add to appropriate list
      if (status === 'active') {
        state.activeCalls.push(action.payload);
      } else if (status === 'waiting') {
        state.waitingCalls.push(action.payload);
      }
    },
    removeCall: (state, action: PayloadAction<string>) => {
      state.activeCalls = state.activeCalls.filter(call => call.id !== action.payload);
      state.waitingCalls = state.waitingCalls.filter(call => call.id !== action.payload);
    },
    updateCallStatus: (state, action: PayloadAction<{ id: string; status: Call['status'] }>) => {
      const { id, status } = action.payload;
      
      // Find the call in either active or waiting calls
      const call = [...state.activeCalls, ...state.waitingCalls].find(c => c.id === id);
      if (call) {
        // Remove from current list
        state.activeCalls = state.activeCalls.filter(c => c.id !== id);
        state.waitingCalls = state.waitingCalls.filter(c => c.id !== id);
        
        // Add to appropriate list
        if (status === 'active') {
          state.activeCalls.push({ ...call, status });
        } else if (status === 'waiting') {
          state.waitingCalls.push({ ...call, status });
        }
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
  addCall,
  updateCall,
  removeCall,
  updateCallStatus,
  setLoading,
  setError,
} = callsSlice.actions;

export default callsSlice.reducer; 