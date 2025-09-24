
import type { RouteObject } from 'react-router-dom';
import HomePage from '../pages/home/page';
import IntroPage from '../pages/intro/page';
import RoleSelectPage from '../pages/role-select/page';
import ConcernInputPage from '../pages/concern-input/page';
import FortuneCookiePage from '../pages/fortune-cookie/page';
import PastConcernsPage from '../pages/past-concerns/page';
import FeedbackPage from '../pages/feedback/page';
import NotFoundPage from '../pages/not-found/page';

const routes: RouteObject[] = [
  {
    path: '/',
    element: <IntroPage />,
  },
  {
    path: '/home',
    element: <HomePage />,
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
    path: '*',
    element: <NotFoundPage />,
  },
];

export default routes;
