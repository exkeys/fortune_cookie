import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants';
import type { NavigationState } from '../types';

export const useNavigation = () => {
  const navigate = useNavigate();

  const goTo = {
    home: () => navigate(ROUTES.home),
    main: () => navigate(ROUTES.main),
    role: () => navigate(ROUTES.role),
    concern: () => navigate(ROUTES.concern),
    fortune: (state?: NavigationState) => navigate(ROUTES.fortune, { state }),
    login: () => navigate(ROUTES.login),
    signup: () => navigate(ROUTES.signup),
    history: () => navigate(ROUTES.history),
  };

  const goBack = () => navigate(-1);

  return { goTo, goBack, navigate };
};


