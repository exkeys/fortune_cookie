import type { RouteObject } from 'react-router-dom';

import IntroPage from '../pages/intro/page';
import RoleSelectPage from '../pages/role-select/page';
import ConcernInputPage from '../pages/concern-input/page';
import FortuneCookiePage from '../pages/fortune-cookie/page';
import PastConcernsPage from '../pages/past-concerns/page';
import FeedbackPage from '../pages/feedback/page';
import SchoolSelectPage from '../pages/school-select/page';
import AdminPage from '../pages/admin/page';
import SettingsPage from '../pages/settings/page';
import NotFoundPage from '../pages/not-found/page';
import OAuthCallbackPage from '../pages/oauth-callback/page';
import AuthCallbackPage from '../pages/auth-callback/page';
import AccountBannedPage from '../pages/account-banned/page';
import AccountCooldownPage from '../pages/account-cooldown/page';

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
    path: '*',
    element: <NotFoundPage />,
  },
];

export default routes;
