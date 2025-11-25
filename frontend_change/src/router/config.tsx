import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

// 코드 스플리팅: 라우트별 lazy loading
const IntroPage = lazy(() => import('../pages/intro/page'));
const RoleSelectPage = lazy(() => import('../pages/role-select/page'));
const ConcernInputPage = lazy(() => import('../pages/concern-input/page'));
const FortuneCookiePage = lazy(() => import('../pages/fortune-cookie/page'));
const PastConcernsPage = lazy(() => import('../pages/past-concerns/page'));
const FeedbackPage = lazy(() => import('../pages/feedback/page'));
const SchoolSelectPage = lazy(() => import('../pages/school-select/page'));
const AdminPage = lazy(() => import('../pages/admin/page'));
const SettingsPage = lazy(() => import('../pages/settings/page'));
const NotFoundPage = lazy(() => import('../pages/not-found/page'));
// OAuthCallbackPage는 즉시 로드 (Suspense fallback 방지)
import OAuthCallbackPage from '../pages/oauth-callback/page';
const AuthCallbackPage = lazy(() => import('../pages/auth-callback/page'));
const AccountBannedPage = lazy(() => import('../pages/account-banned/page'));
const AccountCooldownPage = lazy(() => import('../pages/account-cooldown/page'));
const AccountDeletedPage = lazy(() => import('../pages/account-deleted/page'));

const routes: RouteObject[] = [
  {
    path: '/',
    element: <IntroPage />, 
  },
  {
    path: '/intro',
    element: <IntroPage />,
  },
  {
    path: '/oauth-callback',
    element: <OAuthCallbackPage />,
  },
  {
    path: '/auth/callback',
    element: <AuthCallbackPage />,
  },
  {
    path: '/school-select',
    element: <SchoolSelectPage />,
  },
  {
    path: '/role-select',
    element: <RoleSelectPage />, 
  },
  {
    path: '/concern-input',
    element: <ConcernInputPage />,
  },
  {
    path: '/fortune-cookie',
    element: <FortuneCookiePage />,
  },
  {
    path: '/past-concerns',
    element: <PastConcernsPage />,
  },
  {
    path: '/feedback',
    element: <FeedbackPage />,
  },
  {
    path: '/settings',
    element: <SettingsPage />,
  },
  {
    path: '/admin',
    element: <AdminPage />,
  },
  {
    path: '/account-banned',
    element: <AccountBannedPage />,
  },
  {
    path: '/account-cooldown',
    element: <AccountCooldownPage />,
  },
  {
    path: '/account-deleted',
    element: <AccountDeletedPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
];

export default routes;
