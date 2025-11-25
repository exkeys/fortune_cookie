import { supabase } from '../supabaseClient';

/**
 * Supabase SDK를 사용한 토큰 관리
 * 모든 토큰 관리를 Supabase가 자동으로 처리
 */

/**
 * 현재 access token 가져오기
 */
export const getAccessToken = async (): Promise<string | null> => {
	const { data: { session }, error } = await supabase.auth.getSession();
	if (error || !session?.access_token) {
		return null;
	}
	return session.access_token;
};

/**
 * Access token 확보 (없으면 자동 refresh 시도)
 */
export const ensureAccessToken = async (): Promise<string | null> => {
	const { data: { session }, error } = await supabase.auth.getSession();
	
	if (error || !session?.access_token) {
		// 세션이 없거나 에러면 refresh 시도
		const { data: { session: refreshed }, error: refreshError } = await supabase.auth.refreshSession();
		
		if (refreshError || !refreshed?.access_token) {
			return null;
		}
		
		return refreshed.access_token;
	}
	
	return session.access_token;
};

/**
 * Access token 정리 (B 구조에서는 Supabase signOut으로 처리)
 */
export const clearAccessToken = () => {
};
