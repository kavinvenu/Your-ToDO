import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch, setUser, setToken, logout, fetchUser } from '../store';
import { api } from '../services/api';

export const useAuth = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);
  const loading = useSelector((state: RootState) => state.auth.loading);
  const dispatch = useDispatch<AppDispatch>();

  const login = async (email: string, password: string) => {
    const { user, token } = await api.login(email, password);
    dispatch(setUser(user));
    dispatch(setToken(token));
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    dispatch(fetchUser());
  };

  const signup = async (name: string, email: string, password: string) => {
    const { user, token } = await api.register(name, email, password);
    dispatch(setUser(user));
    dispatch(setToken(token));
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    dispatch(fetchUser());
  };

  const logoutUser = () => {
    dispatch(logout());
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const setUserState = (user: any) => {
    dispatch(setUser(user));
    localStorage.setItem('user', JSON.stringify(user));
  };

  const setTokenState = (token: string) => {
    dispatch(setToken(token));
    localStorage.setItem('token', token);
  };

  const refreshUser = () => {
    dispatch(fetchUser());
  };

  return {
    user,
    token,
    loading,
    login,
    signup,
    logout: logoutUser,
    setUser: setUserState,
    setToken: setTokenState,
    refreshUser,
  };
}; 