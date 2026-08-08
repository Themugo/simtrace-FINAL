import authReducer, { clearError, setUser } from '../store/slices/authSlice';

describe('authSlice', () => {
  const initialState = {
    isAuthenticated: false,
    user: null,
    token: null,
    loading: false,
    error: null,
    biometricEnabled: false,
  };

  it('should return the initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle clearError', () => {
    const stateWithError = { ...initialState, error: 'some error' };
    const actual = authReducer(stateWithError, clearError());
    expect(actual.error).toBeNull();
  });

  it('should handle setUser', () => {
    const user = { id: '1', email: 'test@test.com', name: 'Test', role: 'user' };
    const actual = authReducer(initialState, setUser(user));
    expect(actual.user).toEqual(user);
    expect(actual.isAuthenticated).toBe(false);
  });

  it('should set loading on login.pending', () => {
    const action = { type: 'auth/login/pending' };
    const actual = authReducer(initialState, action);
    expect(actual.loading).toBe(true);
    expect(actual.error).toBeNull();
  });

  it('should handle login.fulfilled with success', () => {
    const payload = { success: true, user: { id: '1', email: 'a@b.com', name: 'A', role: 'user' }, token: 'tok' };
    const action = { type: 'auth/login/fulfilled', payload };
    const actual = authReducer(initialState, action);
    expect(actual.loading).toBe(false);
    expect(actual.isAuthenticated).toBe(true);
    expect(actual.user).toEqual(payload.user);
    expect(actual.token).toBe('tok');
  });

  it('should handle login.rejected', () => {
    const action = { type: 'auth/login/rejected', error: { message: 'Invalid credentials' } };
    const actual = authReducer(initialState, action);
    expect(actual.loading).toBe(false);
    expect(actual.error).toBe('Invalid credentials');
  });

  it('should handle logout.fulfilled', () => {
    const loggedInState = { ...initialState, isAuthenticated: true, user: { id: '1', email: 'a@b.com', name: 'A', role: 'user' }, token: 'tok' };
    const action = { type: 'auth/logout/fulfilled' };
    const actual = authReducer(loggedInState, action);
    expect(actual.isAuthenticated).toBe(false);
    expect(actual.user).toBeNull();
    expect(actual.token).toBeNull();
    expect(actual.error).toBeNull();
  });

  it('should handle checkAuthStatus.fulfilled with token', () => {
    const action = { type: 'auth/checkStatus/fulfilled', payload: { token: 'tok', biometricEnabled: true } };
    const actual = authReducer(initialState, action);
    expect(actual.isAuthenticated).toBe(true);
    expect(actual.token).toBe('tok');
    expect(actual.biometricEnabled).toBe(true);
  });

  it('should handle enableBiometric.fulfilled', () => {
    const action = { type: 'auth/enableBiometric/fulfilled', payload: true };
    const actual = authReducer(initialState, action);
    expect(actual.biometricEnabled).toBe(true);
  });
});
