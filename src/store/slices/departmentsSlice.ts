import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Department {
  id: string;
  name: string;
  extension: string;
  activeAgents: number;
  queueLength: number;
  averageWaitTime: string;
}

interface DepartmentsState {
  departments: Department[];
  loading: boolean;
  error: string | null;
}

const initialState: DepartmentsState = {
  departments: [
    {
      id: '1',
      name: 'Support',
      extension: '1001',
      activeAgents: 5,
      queueLength: 3,
      averageWaitTime: '00:03:45',
    },
    {
      id: '2',
      name: 'Sales',
      extension: '1002',
      activeAgents: 3,
      queueLength: 1,
      averageWaitTime: '00:02:15',
    },
    {
      id: '3',
      name: 'Billing',
      extension: '1003',
      activeAgents: 2,
      queueLength: 0,
      averageWaitTime: '00:01:30',
    },
  ],
  loading: false,
  error: null,
};

const departmentsSlice = createSlice({
  name: 'departments',
  initialState,
  reducers: {
    setDepartments: (state, action: PayloadAction<Department[]>) => {
      state.departments = action.payload;
    },
    updateDepartment: (state, action: PayloadAction<Department>) => {
      const index = state.departments.findIndex(d => d.id === action.payload.id);
      if (index !== -1) {
        state.departments[index] = action.payload;
      }
    },
    updateQueueLength: (state, action: PayloadAction<{ departmentId: string; queueLength: number }>) => {
      const { departmentId, queueLength } = action.payload;
      const department = state.departments.find(d => d.id === departmentId);
      if (department) {
        department.queueLength = queueLength;
      }
    },
    updateActiveAgents: (state, action: PayloadAction<{ departmentId: string; activeAgents: number }>) => {
      const { departmentId, activeAgents } = action.payload;
      const department = state.departments.find(d => d.id === departmentId);
      if (department) {
        department.activeAgents = activeAgents;
      }
    },
    updateAverageWaitTime: (state, action: PayloadAction<{ departmentId: string; averageWaitTime: string }>) => {
      const { departmentId, averageWaitTime } = action.payload;
      const department = state.departments.find(d => d.id === departmentId);
      if (department) {
        department.averageWaitTime = averageWaitTime;
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
  setDepartments,
  updateDepartment,
  updateQueueLength,
  updateActiveAgents,
  updateAverageWaitTime,
  setLoading,
  setError,
} = departmentsSlice.actions;

export default departmentsSlice.reducer; 