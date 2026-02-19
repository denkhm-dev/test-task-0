import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

// Тип сервісного запису
export interface ServiceLog {
  id: string;
  providerId: string;
  serviceOrder: string;
  carId: string;
  odometer: number;
  engineHours: number;
  startDate: string;
  endDate: string;
  type: 'planned' | 'unplanned' | 'emergency';
  serviceDescription: string;
}

// Тип чернетки
export interface Draft {
  id: string;
  data: Partial<ServiceLog>;
  createdAt: string;
  isSaved: boolean;
}

// Стан слайсу
interface ServiceState {
  logs: ServiceLog[];
  drafts: Draft[];
  activeDraftId: string | null;
  currentForm: Partial<ServiceLog>;
  isSaving: boolean;
}

const initialState: ServiceState = {
  logs: [],
  drafts: [],
  activeDraftId: null,
  currentForm: {},
  isSaving: false,
};

export const serviceLogsSlice = createSlice({
  name: 'serviceLogs',
  initialState,
  reducers: {
    // Створення нової чернетки
    createDraft: (state, action: PayloadAction<Partial<ServiceLog> | undefined>) => {
      if (!state.drafts) state.drafts = [];
      const newDraft: Draft = {
        id: uuidv4(),
        data: action.payload ?? {},
        createdAt: new Date().toISOString(),
        isSaved: false,
      };
      state.drafts.push(newDraft);
      state.activeDraftId = newDraft.id;
      state.currentForm = {};
    },

    // Встановлення активної чернетки
    setActiveDraft: (state, action: PayloadAction<string>) => {
      state.activeDraftId = action.payload;
    },

    // Оновлення даних активної чернетки (авто-збереження)
    updateDraft: (state, action: PayloadAction<Partial<ServiceLog>>) => {
      if (!state.drafts) state.drafts = [];
      const draft = state.drafts.find(d => d.id === state.activeDraftId);
      if (draft) {
        draft.data = { ...draft.data, ...action.payload };
        draft.isSaved = true;
      }
      state.isSaving = true;
    },

    // Зупинка індикатора збереження
    stopSaving: (state) => {
      state.isSaving = false;
    },

    // Видалення активної чернетки
    deleteDraft: (state) => {
      if (!state.drafts) state.drafts = [];
      state.drafts = state.drafts.filter(d => d.id !== state.activeDraftId);
      state.activeDraftId = state.drafts.length > 0 ? state.drafts[0].id : null;
    },

    // Очищення всіх чернеток
    clearAllDrafts: (state) => {
      state.drafts = [];
      state.activeDraftId = null;
    },

    // Додавання нового логу (з форми)
    addLog: (state, action: PayloadAction<Omit<ServiceLog, 'id'>>) => {
      if (!state.logs) state.logs = [];
      if (!state.drafts) state.drafts = [];
      state.logs.unshift({ ...action.payload, id: uuidv4() });
      // Видаляємо активну чернетку після створення логу
      if (state.activeDraftId) {
        state.drafts = state.drafts.filter(d => d.id !== state.activeDraftId);
        state.activeDraftId = state.drafts.length > 0 ? state.drafts[0].id : null;
      }
    },


    updateLog: (state, action: PayloadAction<ServiceLog>) => {
      if (!state.logs) state.logs = [];
      const index = state.logs.findIndex(log => log.id === action.payload.id);
      if (index !== -1) {
        state.logs[index] = action.payload;
      }
    },

    // Видалення логу
    deleteLog: (state, action: PayloadAction<string>) => {
      if (!state.logs) state.logs = [];
      state.logs = state.logs.filter(log => log.id !== action.payload);
    },

    // Оновлення поточної форми (коли немає чернетки)
    updateCurrentForm: (state, action: PayloadAction<Partial<ServiceLog>>) => {
      state.currentForm = action.payload;
      state.isSaving = true;
    },
  },
});

export const {
  createDraft,
  setActiveDraft,
  updateDraft,
  stopSaving,
  deleteDraft,
  clearAllDrafts,
  addLog,
  updateLog,
  deleteLog,
  updateCurrentForm,
} = serviceLogsSlice.actions;

export default serviceLogsSlice.reducer;