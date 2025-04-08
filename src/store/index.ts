import { configureStore } from '@reduxjs/toolkit';
import agentsReducer from './slices/agentsSlice';
import callsReducer from './slices/callsSlice';
import departmentsReducer from './slices/departmentsSlice';

export const store = configureStore({
  reducer: {
    agents: agentsReducer,
    calls: callsReducer,
    departments: departmentsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 