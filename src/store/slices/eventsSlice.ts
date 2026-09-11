// src/store/slices/eventsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

// ============================================================
// TYPES (Matches Backend DTOs)
// ============================================================
export interface CalendarEvent {
  id: number;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  targetType: 'INDIVIDUAL' | 'TEAM' | 'DEPARTMENT' | 'ALL';
  targetId: number | null;
  meetingLink: string | null;
  createdByName: string;
}

export interface CreateEventRequest {
  title: string;
  description?: string | null;
  startTime: string; // ISO
  endTime: string;   // ISO
  targetType: 'INDIVIDUAL' | 'TEAM' | 'DEPARTMENT' | 'ALL';
  targetId?: number | null;
  meetingLink?: string | null;
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {
  id: number;
}

// ============================================================
// STATE
// ============================================================
interface EventsState {
  myEvents: CalendarEvent[];      // For EMPLOYEE / TEAM_LEAD
  allEvents: CalendarEvent[];     // For ADMIN (full list)
  loading: boolean;
  error: string | null;
}

const initialState: EventsState = {
  myEvents: [],
  allEvents: [],
  loading: false,
  error: null,
};

// ============================================================
// ASYNC THUNKS
// ============================================================

// 1. Fetch My Events (User-specific)
export const fetchMyEvents = createAsyncThunk(
  'events/fetchMyEvents',
  async ({ fromDate, toDate }: { fromDate: string; toDate: string }, { rejectWithValue }) => {
    try {
      const response = await api.get('/events/calendar', { params: { fromDate, toDate } });
      return response.data; // List<CalendarEvent>
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch your events');
    }
  }
);

// 2. Fetch All Events (Admin only)
export const fetchAllEvents = createAsyncThunk(
  'events/fetchAllEvents',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/events/all');
      return response.data; // List<CalendarEvent>
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch all events');
    }
  }
);

// 3. Create Event (Admin only)
export const createEvent = createAsyncThunk(
  'events/createEvent',
  async (eventData: CreateEventRequest, { rejectWithValue }) => {
    try {
      const response = await api.post('/events', eventData);
      return response.data; // CalendarEvent
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create event');
    }
  }
);

// 4. Update Event (Admin only) - Backend API missing, but ready for future
export const updateEvent = createAsyncThunk(
  'events/updateEvent',
  async ({ id, ...data }: UpdateEventRequest, { rejectWithValue }) => {
    try {
      // ⚠️ Backend doesn't have this endpoint yet. Add it later.
      const response = await api.put(`/events/${id}`, data);
      return response.data; // CalendarEvent
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update event');
    }
  }
);

// 5. Delete Event (Admin only) - Backend API missing, but ready for future
export const deleteEvent = createAsyncThunk(
  'events/deleteEvent',
  async (id: number, { rejectWithValue }) => {
    try {
      // ⚠️ Backend doesn't have this endpoint yet. Add it later.
      await api.delete(`/events/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete event');
    }
  }
);

// ============================================================
// SLICE
// ============================================================
const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    clearEvents: (state) => {
      state.myEvents = [];
      state.allEvents = [];
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ---------- fetchMyEvents ----------
      .addCase(fetchMyEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyEvents.fulfilled, (state, action: PayloadAction<CalendarEvent[]>) => {
        state.loading = false;
        state.myEvents = action.payload;
      })
      .addCase(fetchMyEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ---------- fetchAllEvents ----------
      .addCase(fetchAllEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllEvents.fulfilled, (state, action: PayloadAction<CalendarEvent[]>) => {
        state.loading = false;
        state.allEvents = action.payload;
      })
      .addCase(fetchAllEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ---------- createEvent ----------
      .addCase(createEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createEvent.fulfilled, (state, action: PayloadAction<CalendarEvent>) => {
        state.loading = false;
        // Add to both lists (since admin sees all)
        state.allEvents.unshift(action.payload);
        state.myEvents.unshift(action.payload);
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ---------- updateEvent ----------
      .addCase(updateEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateEvent.fulfilled, (state, action: PayloadAction<CalendarEvent>) => {
        state.loading = false;
        const updated = action.payload;
        const updateList = (list: CalendarEvent[]) => {
          const idx = list.findIndex(e => e.id === updated.id);
          if (idx !== -1) list[idx] = updated;
        };
        updateList(state.allEvents);
        updateList(state.myEvents);
      })
      .addCase(updateEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ---------- deleteEvent ----------
      .addCase(deleteEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteEvent.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.allEvents = state.allEvents.filter(e => e.id !== action.payload);
        state.myEvents = state.myEvents.filter(e => e.id !== action.payload);
      })
      .addCase(deleteEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearEvents, clearError } = eventsSlice.actions;
export default eventsSlice.reducer;