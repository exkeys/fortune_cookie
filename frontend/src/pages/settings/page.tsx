import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useResponsive } from '../../hooks/useResponsive';
import { apiFetch } from '../../utils/apiClient';
import { logger } from '../../utils/logger';
import { supabase } from '../../supabaseClient';
import Header from '../../components/feature/Header';
import { 
  MessageSquare,
  LogOut, 
  Trash2,
  FileText,
  ChevronRight,
  AlertTriangle,
  Building2,
  Calendar
} from 'lucide-react';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout, deleteAccount } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { isMobile } = useResponsive();
  const [cachedData, setCachedData] = useState<{
    email: string | null;
    school: string | null;
    created_at: string | null;
  }>({
    email: null,
    school: null,
    created_at: null
  });
  const [isLoadingSchool, setIsLoadingSchool] = useState(false); // 초기값 false로 설정 (첫 렌더링에서 스켈레톤 방지)

  // Realtime 구독 참조
  const subscriptionRef = useRef<any>(null);

  // 이메일, 생성일은 캐시 사용, 학교는 Realtime으로 실시간 업데이트
  useEffect(() => {
    if (!user?.id || !user?.email) {
      return;
    }
    
    // localStorage에서 데이터 확인
    const cachedEmail = localStorage.getItem('user_email');
    const cachedSchool = localStorage.getItem('user_school');
    const cachedCreatedAt = localStorage.getItem('user_created_at');
    
    // 유효한 값인지 확인하는 헬퍼 함수
    const isValidValue = (value: string | null): boolean => {
      return value !== null && value !== 'N/A' && value !== 'null' && value.trim() !== '';
    };
    
    // 🔒 보안: 캐시된 이메일과 현재 사용자 이메일이 일치하는지 확인
    const isCacheValid = cachedEmail && cachedEmail === user.email;
    
    // 이메일과 생성일은 캐시에서 로드 (변화 없음)
    const initialEmail = (isCacheValid && isValidValue(cachedEmail)) ? cachedEmail : null;
    
    // 생성일 우선순위: user 객체 > 캐시 > null
    const userCreatedAt = (user as any)?.created_at;
    const initialCreatedAt = (userCreatedAt && isValidValue(userCreatedAt))
      ? userCreatedAt
      : ((isCacheValid && isValidValue(cachedCreatedAt)) ? cachedCreatedAt : null);
    
    // 학교 정보 우선순위: user 객체 > 캐시 > null
    const userSchool = (user as any)?.school;
    const initialSchool = (userSchool && isValidValue(userSchool)) 
      ? userSchool 
      : ((isCacheValid && isValidValue(cachedSchool)) ? cachedSchool : null);
    
    // 초기 상태 설정 (학교와 생성일은 user 객체 또는 캐시에서 먼저 로드)
      setCachedData({
      email: initialEmail,
      school: initialSchool, // user 객체 또는 캐시된 학교 정보 먼저 사용
      created_at: initialCreatedAt // user 객체 또는 캐시된 생성일 먼저 사용
    });
    
    // 초기 학교 정보가 있으면 로딩 상태를 즉시 false로 설정 (첫 렌더링에서 스켈레톤 방지)
    if (initialSchool) {
      setIsLoadingSchool(false);
    }
    
      // 캐시가 다른 사용자 것이면 먼저 정리
      if (cachedEmail && cachedEmail !== user.email) {
        localStorage.removeItem('user_email');
        localStorage.removeItem('user_school');
        localStorage.removeItem('user_created_at');
      }
      
    // 초기 학교 데이터 가져오기 (마운트 시 1회)
    const fetchInitialSchoolData = async () => {
      // user 객체나 캐시에 학교 정보가 있으면 로딩 상태를 false로 설정 (깜빡임 방지)
      const hasInitialSchool = (userSchool && isValidValue(userSchool)) || (isCacheValid && isValidValue(cachedSchool));
      
      // 초기 학교 정보가 없을 때만 로딩 상태를 true로 설정
      if (!hasInitialSchool) {
        setIsLoadingSchool(true);
      }
      
      try {
          const response = await apiFetch(`/api/auth/profile`);
          
          if (!response.ok) {
          // API 실패 시 initialSchool이 있으면 유지, 없으면 캐시 사용
          if (!initialSchool && isCacheValid && isValidValue(cachedSchool)) {
            setCachedData(prev => ({
              ...prev,
              school: cachedSchool
            }));
          }
          setIsLoadingSchool(false);
            return;
          }
          
          const result = await response.json();
          
          if (result?.user) {
            const dbUser = result.user;
            const dbEmail = dbUser.email;
            const dbSchool = dbUser.school && dbUser.school !== 'unknown' ? dbUser.school : null;
            const dbCreatedAt = dbUser.created_at;
            
          // 최종 값 계산 (한 번만 계산)
          const finalEmail = initialEmail || (dbEmail && isValidValue(dbEmail) ? dbEmail : null);
          const finalCreatedAt = initialCreatedAt || (dbCreatedAt && isValidValue(dbCreatedAt) ? dbCreatedAt : null);
          const finalSchool = (dbSchool && isValidValue(dbSchool)) ? dbSchool : initialSchool;
          
          // localStorage 업데이트 (필요한 경우만)
          if (!initialEmail && finalEmail) {
            localStorage.setItem('user_email', finalEmail);
            }
          if (!initialCreatedAt && finalCreatedAt) {
            localStorage.setItem('user_created_at', finalCreatedAt);
            }
          if (finalSchool && finalSchool !== initialSchool) {
            localStorage.setItem('user_school', finalSchool);
          } else if (finalSchool === initialSchool && initialSchool) {
            // 학교가 같아도 localStorage는 최신 값으로 동기화 (혹시 모를 동기화 문제 방지)
            localStorage.setItem('user_school', finalSchool);
          }
          
          // 한 번의 setCachedData 호출로 모든 업데이트 처리 (불필요한 리렌더링 방지)
          setCachedData(prev => {
            // 변경사항이 없으면 스킵
            if (
              prev.email === finalEmail &&
              prev.school === finalSchool &&
              prev.created_at === finalCreatedAt
            ) {
              return prev;
            }
            
            return {
              email: finalEmail,
              school: finalSchool,
              created_at: finalCreatedAt
            };
            });
          } else {
          // 백엔드에서 데이터를 못 가져왔으면 initialSchool 유지, 없으면 캐시 사용
          const fallbackEmail = initialEmail || user.email || null;
          const fallbackSchool = initialSchool || (isCacheValid && isValidValue(cachedSchool) ? cachedSchool : null);
          
          setCachedData(prev => {
            // 변경사항이 없으면 스킵
            if (
              prev.email === fallbackEmail &&
              prev.school === fallbackSchool &&
              prev.created_at === initialCreatedAt
            ) {
              return prev;
            }
            
            return {
              email: fallbackEmail,
              school: fallbackSchool,
              created_at: initialCreatedAt
            };
            });
          }
      } catch (error) {
        logger.error('[SettingsPage] API 호출 에러', error);
        // 에러 발생 시 초기 값 유지 (이미 설정되어 있으므로 별도 업데이트 불필요)
        // initialSchool, initialEmail, initialCreatedAt이 이미 초기 상태에 설정됨
      } finally {
        setIsLoadingSchool(false);
      }
    };
    
    fetchInitialSchoolData();
    
    // 🔄 Supabase Realtime 구독: 학교 정보 변경 감지 (최적화된 성능)
    const channel = supabase
      .channel(`user-school-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          // 학교 필드가 실제로 변경되었는지 확인
          const oldSchool = payload.old?.school;
          const newSchool = payload.new?.school;
          
          // 학교 필드가 변경되지 않았으면 스킵 (다른 필드 업데이트 시 불필요한 처리 방지)
          if (oldSchool === newSchool) {
            return;
          }
          
          // 학교 필드가 변경되었을 때만 업데이트
          if (payload.new && 'school' in payload.new) {
            const isValidSchool = newSchool && newSchool !== 'unknown' && newSchool.trim() !== '';
            
            if (isValidSchool) {
              setCachedData(prev => {
                // 이전 값과 같으면 업데이트 스킵 (불필요한 리렌더링 방지)
                if (prev.school === newSchool) {
                  return prev;
                }
                // localStorage 업데이트는 한 번만 수행 (setState 내부에서)
                localStorage.setItem('user_school', newSchool);
                return {
                  ...prev,
                  school: newSchool
                };
              });
            } else {
              // 학교가 null이거나 'unknown'이면 제거
              setCachedData(prev => {
                // 이미 null이면 업데이트 스킵
                if (prev.school === null) {
                  return prev;
                }
                localStorage.removeItem('user_school');
                return {
                  ...prev,
                  school: null
                };
          });
        }
          }
        }
      )
      .subscribe();
    
    subscriptionRef.current = channel;
    
    // 클린업: 컴포넌트 언마운트 시 구독 해제
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [user?.id, user?.email]);

  const handleLogout = () => {
    // logout 함수가 이미 모든 처리를 하므로 await 불필요
    // 즉시 /intro로 리다이렉트되므로 에러 처리도 불필요
    logout().catch(() => {
      // 에러는 무시 (logout 함수 내부에서 이미 리다이렉트 처리)
    });
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      // ⚡ 실제 삭제 먼저 진행 (병렬 처리로 빠름!)
      await deleteAccount();
      // 회원탈퇴 성공 시 account-deleted 페이지로 이동
      sessionStorage.setItem('account-deletion', 'true');
      window.location.href = '/account-deleted';
    } catch (error) {
      logger.error('회원탈퇴 실패:', error);
      alert('회원탈퇴에 실패했습니다. 다시 시도해주세요.');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // 이메일에서 첫 글자 추출
  const getInitial = () => {
    const email = cachedData.email || user?.email;
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
      `}</style>
    <div style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
      background: "#fffbeb",
      minHeight: "100vh"
    }}>
      <Header />
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? "10px" : "20px",
        paddingTop: isMobile ? "20px" : "30px",
        margin: 0,
        boxSizing: "border-box"
      }}>
        <div style={{
          maxWidth: "500px",
          width: "100%",
          background: "white",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 10px 40px rgba(20, 40, 160, 0.15)"
        }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #1428A0 0%, #2948C7 100%)",
          padding: isMobile ? "24px 20px 20px" : "32px 28px 28px",
          textAlign: "center",
          color: "white",
          position: "relative"
        }}>
          <div style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "5px",
            background: "linear-gradient(90deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%)"
          }}></div>
          
          <div style={{
            position: "relative",
            display: "inline-block",
            marginBottom: "20px"
          }}>
            <div style={{
              width: isMobile ? "80px" : "90px",
              height: isMobile ? "80px" : "90px",
              background: "rgba(255,255,255,0.15)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: isMobile ? "34px" : "38px",
              fontWeight: 700,
              border: "4px solid rgba(255,255,255,0.3)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.2)"
            }}>
              {getInitial()}
            </div>
            <div style={{
              position: "absolute",
              bottom: "2px",
              right: "2px",
              width: "26px",
              height: "26px",
              background: "#03C75A",
              borderRadius: "50%",
              border: "3px solid #1428A0"
            }}></div>
          </div>
          
          <div style={{
            marginBottom: "12px"
          }}>
            {(cachedData.email || user?.email) && (
              <div style={{
                fontSize: isMobile ? "16px" : "18px",
                fontWeight: 700,
                marginBottom: "6px",
                letterSpacing: "-0.3px"
              }}>
                {cachedData.email || user?.email}
              </div>
            )}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              fontSize: isMobile ? "13px" : "14px",
              opacity: 0.9,
              flexWrap: "wrap"
            }}>
              {(() => {
                const schoolValue = cachedData.school || (user as any)?.school;
                const isValidSchool = schoolValue && schoolValue !== 'unknown' && schoolValue.trim() !== '';
                
                if (isLoadingSchool) {
                  // 로딩 중일 때 스켈레톤 UI
                  return (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      opacity: 0.5
                    }}>
                      <Building2 size={14} />
                      <div style={{
                        width: "60px",
                        height: "14px",
                        background: "rgba(255,255,255,0.3)",
                        borderRadius: "4px",
                        animation: "pulse 1.5s ease-in-out infinite"
                      }}></div>
                    </div>
                  );
                }
                return isValidSchool ? (
                  <>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}>
                      <Building2 size={14} />
                      <span>{schoolValue}</span>
                    </div>
                    {cachedData.created_at && (
                      <div style={{
                        width: "1px",
                        height: "12px",
                        background: "rgba(255,255,255,0.5)"
                      }}></div>
                    )}
                  </>
                ) : null;
              })()}
              {cachedData.created_at && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}>
                  <Calendar size={14} />
                  <span>
                    {new Date(cachedData.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric' }).replace(/\./g, '.')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Menu Section - 나의 활동 */}
        <div style={{ padding: "12px 0" }}>
          <div style={{
            padding: "20px 24px 12px",
            fontSize: "13px",
            fontWeight: 700,
            color: "#1428A0",
            textTransform: "uppercase",
            letterSpacing: "0.8px"
          }}>
            나의 활동
          </div>
          
          <div 
            onClick={() => {
              sessionStorage.setItem('pastConcernsFrom', 'settings');
              navigate('/past-concerns');
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "18px 24px",
              cursor: "pointer",
              transition: "all 0.3s",
              borderBottom: "1px solid #F3F4F6",
              position: "relative"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#F0F4FF";
              e.currentTarget.style.transform = "translateX(2px)";
              const chevron = e.currentTarget.querySelector('.chevron') as HTMLElement;
              if (chevron) {
                chevron.style.color = "#1428A0";
                chevron.style.transform = "translateX(4px)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.transform = "translateX(0)";
              const chevron = e.currentTarget.querySelector('.chevron') as HTMLElement;
              if (chevron) {
                chevron.style.color = "#D1D5DB";
                chevron.style.transform = "translateX(0)";
              }
            }}
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "14px"
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                background: "#F0F4FF",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s"
              }}>
                <FileText size={20} color="#1428A0" />
              </div>
              <span style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "#111827"
              }}>과거 고민 관리</span>
            </div>
            <ChevronRight className="chevron" size={20} color="#D1D5DB" />
          </div>

          <div 
            onClick={() => navigate('/feedback')}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "18px 24px",
              cursor: "pointer",
              transition: "all 0.3s",
              borderBottom: "1px solid #F3F4F6",
              position: "relative"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#F0F4FF";
              e.currentTarget.style.transform = "translateX(2px)";
              const chevron = e.currentTarget.querySelector('.chevron') as HTMLElement;
              if (chevron) {
                chevron.style.color = "#1428A0";
                chevron.style.transform = "translateX(4px)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.transform = "translateX(0)";
              const chevron = e.currentTarget.querySelector('.chevron') as HTMLElement;
              if (chevron) {
                chevron.style.color = "#D1D5DB";
                chevron.style.transform = "translateX(0)";
              }
            }}
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "14px"
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                background: "#F0F4FF",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s"
              }}>
                <MessageSquare size={20} color="#1428A0" />
              </div>
              <span style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "#111827"
              }}>피드백 보내기</span>
            </div>
            <ChevronRight className="chevron" size={20} color="#D1D5DB" />
          </div>
        </div>

        {/* Menu Section - 계정 설정 */}
        <div style={{ padding: "12px 0" }}>
          <div style={{
            padding: "20px 24px 12px",
            fontSize: "13px",
            fontWeight: 700,
            color: "#1428A0",
            textTransform: "uppercase",
            letterSpacing: "0.8px"
          }}>
            계정 설정
          </div>
          
          <div 
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "18px 24px",
              cursor: "pointer",
              transition: "all 0.3s",
              borderBottom: "1px solid #F3F4F6",
              position: "relative"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#F0F4FF";
              e.currentTarget.style.transform = "translateX(2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.transform = "translateX(0)";
            }}
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "14px"
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                background: "#F0F4FF",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s"
              }}>
                <LogOut size={20} color="#1428A0" />
              </div>
              <span style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "#111827"
              }}>로그아웃</span>
            </div>
          </div>

          <div 
            onClick={handleDeleteClick}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "18px 24px",
              cursor: "pointer",
              transition: "all 0.3s",
              borderBottom: "1px solid #F3F4F6",
              position: "relative"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#FEE2E2";
              e.currentTarget.style.transform = "translateX(2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.transform = "translateX(0)";
            }}
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "14px"
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                background: "#FEE2E2",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s"
              }}>
                <Trash2 size={20} color="#DC2626" />
              </div>
              <span style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "#DC2626"
              }}>계정 삭제</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "24px",
          textAlign: "center",
          color: "#9CA3AF",
          fontSize: "13px",
          borderTop: "1px solid #F3F4F6",
          background: "#FAFBFC"
        }}>
          <span style={{
            fontWeight: 600,
            color: "#1428A0"
          }}>포춘쿠키</span> v1.0
        </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteConfirm && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-[998]"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-5 pointer-events-auto" style={{ maxWidth: '480px' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">계정 삭제</h3>
                  <p className="text-sm text-gray-500">정말로 탈퇴하시겠습니까?</p>
                </div>
              </div>

              <div className="bg-red-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-red-800 leading-relaxed">
                  회원탈퇴 시 모든 데이터가 <strong>영구적으로 삭제</strong>되며 복구할 수 없습니다.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 transition-colors font-medium text-xs"
                >
                  {isDeleting ? '처리 중...' : '탈퇴하기'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 px-3 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg disabled:opacity-50 transition-colors font-medium text-xs"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
    </>
  );
}