// src/store/index.ts
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';

import authReducer from './slices/authSlice';
import usersReducer from './slices/usersSlice';
import teamsReducer from './slices/teamsSlice';
import rolesReducer from './slices/rolesSlice';
import departmentsReducer from './slices/departmentsSlice';
import docClientsReducer from './slices/docClientsSlice';
import attendanceReducer from './slices/attendanceSlice';
import leaveReducer from './slices/leaveSlice';
import documentReducer from './slices/documentSlice';
import adminCRMReducer from './slices/adminCRMSlice';
import employeeClientReducer from './slices/employeeClientSlice';
import docEmployeeReducer from './slices/docEmployeeSlice';
import permissionReducer from './slices/permissionSlice';
import bulkEmployeeReducer from './slices/bulkEmployeeSlice';

const storage = {
  getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
  setItem: (key: string, value: string) => Promise.resolve(localStorage.setItem(key, value)),
  removeItem: (key: string) => Promise.resolve(localStorage.removeItem(key)),
};

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'], 
};

const rootReducer = combineReducers({
  auth: authReducer,
  users: usersReducer,
  teams: teamsReducer,
  roles: rolesReducer,
  departments: departmentsReducer,
  docClients: docClientsReducer,
  attendance: attendanceReducer,
  leave: leaveReducer,
  document: documentReducer,
  adminCRM: adminCRMReducer,
  employeeClient: employeeClientReducer,
  docEmployee: docEmployeeReducer,
  permissions: permissionReducer,
  bulkEmployee: bulkEmployeeReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;