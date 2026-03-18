import { useMemo } from 'react';
import { useSelector, useDispatch, type TypedUseSelectorHook } from 'react-redux';
import { selectCurrentUser, selectIsAuthenticated } from './slices/authSlice';
import type { RootState, AppDispatch } from './index';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const useAuth = () => {
  const user = useAppSelector(selectCurrentUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  return useMemo(() => ({ user, isAuthenticated }), [user, isAuthenticated]);
};
