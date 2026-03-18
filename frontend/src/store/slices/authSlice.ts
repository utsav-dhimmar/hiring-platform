import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { UserRead } from "../../apis/types/auth";

interface AuthState {
	user: UserRead | null;
	token: string | null;
	refreshToken: string | null;
	isAuthenticated: boolean;
}

const initialState: AuthState = {
	user: null,
	token: localStorage.getItem("token"),
	refreshToken: localStorage.getItem("refreshToken"),
	isAuthenticated: !!localStorage.getItem("token"),
};

const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		setCredentials: (
			state,
			{
				payload: { user, access_token, refresh_token },
			}: PayloadAction<{
				user: UserRead;
				access_token: string;
				refresh_token: string;
			}>,
		) => {
			state.user = user;
			state.token = access_token;
			state.refreshToken = refresh_token;
			state.isAuthenticated = true;
			localStorage.setItem("token", access_token);
			localStorage.setItem("refreshToken", refresh_token);
		},
		logout: state => {
			state.user = null;
			state.token = null;
			state.refreshToken = null;
			state.isAuthenticated = false;
			localStorage.removeItem("token");
			localStorage.removeItem("refreshToken");
		},
		setUser: (state, action: PayloadAction<UserRead>) => {
			state.user = action.payload;
		},
	},
});

export const { setCredentials, logout, setUser } = authSlice.actions;

export default authSlice.reducer;

export const selectCurrentUser = (state: { auth: AuthState }) =>
	state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
	state.auth.isAuthenticated;
