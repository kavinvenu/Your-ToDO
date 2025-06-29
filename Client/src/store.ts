import { configureStore, createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from './services/api';

export interface AuthState {
  user: any | null;
  token: string | null;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
};

export const fetchUser = createAsyncThunk('auth/fetchUser', async (_, { getState, rejectWithValue }) => {
  try {
    // @ts-ignore
    const token = (getState() as any).auth.token;
    if (!token) return rejectWithValue('No token');
    const user = await api.getCurrentUser();
    console.log('fetchUser thunk: got user', user);
    return user;
  } catch (err) {
    console.log('fetchUser thunk: error', err);
    return rejectWithValue('Failed to fetch user');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<any>) {
      state.user = action.payload;
    },
    setToken(state, action: PayloadAction<string | null>) {
      state.token = action.payload;
    },
    logout(state) {
      state.user = null;
      state.token = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
        console.log('Redux user after fetchUser.fulfilled:', state.user);
      })
      .addCase(fetchUser.rejected, (state, action) => {
        if (action.payload === 'No token') {
          state.user = null;
        }
        state.loading = false;
        console.log('Redux user after fetchUser.rejected:', state.user);
      });
  },
});

export const { setUser, setToken, logout } = authSlice.actions;

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    // Add other reducers here
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// On app load, if token exists in localStorage, set Redux state and fetch user
export const initializeAuth = () => (dispatch: AppDispatch) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  if (token) {
    dispatch(setToken(token));
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        dispatch(setUser(user));
      } catch (e) {
        // ignore parse error
      }
    }
    dispatch(fetchUser());
  }
};