import { ensureAccessToken, getAccessToken } from './authSession';
import { supabase } from '../supabaseClient';
import { logger } from './logger';

type ApiFetchOptions = RequestInit & {
	skipAuth?: boolean;
	retryOnAuthError?: boolean;
};

/**
 * B 구조: Supabase JWT만 사용 (CSRF 제거)
 */
export const apiFetch = async (input: RequestInfo | URL, init: ApiFetchOptions = {}) => {
	const {
		skipAuth = false,
		retryOnAuthError = true,
		headers,
		...rest
	} = init;

	const finalInit: RequestInit = {
		...rest,
		headers: {
			...headers,
		},
	};

	// ✅ Supabase JWT만 사용 (CSRF 제거)
	if (!skipAuth) {
		const token = await ensureAccessToken();
		if (token) {
			(finalInit.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
		}
	}

	let response = await fetch(input, finalInit);

	// ✅ 401 에러 시 Supabase 자동 refresh (재시도 포함)
	if (response.status === 401 && !skipAuth && retryOnAuthError) {
		try {
			// 재시도 로직 (최대 3번)
			let refreshedToken: string | null = null;
			for (let i = 0; i < 3; i++) {
				const { data: { session }, error } = await supabase.auth.refreshSession();
				
				if (!error && session?.access_token) {
					refreshedToken = session.access_token;
					break;
				}
				
				// refresh token 만료 등 영구적 실패는 재시도하지 않음
				if (error?.message?.includes('refresh_token_not_found') || 
				    error?.message?.includes('invalid_grant')) {
					logger.warn('Refresh token 만료:', error.message);
					break;
				}
				
				// 네트워크 오류 등은 재시도
				if (i < 2) {
					await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
				}
			}
			
			if (refreshedToken) {
				(finalInit.headers as Record<string, string>)['Authorization'] = `Bearer ${refreshedToken}`;
				response = await fetch(input, finalInit);
			}
			// refresh 실패해도 signOut하지 않음 (세션 유지)
		} catch (error) {
			// 네트워크 오류 등 - signOut하지 않음
			logger.warn('토큰 갱신 실패 (재시도 완료):', error);
		}
	}

	return response;
};

export const attachAuthIfAvailable = async (init: RequestInit = {}) => {
	const token = await ensureAccessToken();
	if (!token) return init;

	const merged: RequestInit = {
		...init,
		headers: {
			...(init.headers || {}),
			Authorization: `Bearer ${token}`,
		},
	};
	return merged;
};

export const currentAccessToken = async () => await getAccessToken();
