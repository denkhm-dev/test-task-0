import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { serviceLogsSlice } from './service-logs-slice';

const rootReducer = combineReducers({
  serviceLogs: serviceLogsSlice.reducer,
});

const persistConfig = {
  key: 'medidrive_v1',
  storage,
  whitelist: ['serviceLogs'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;