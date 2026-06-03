import { NavigationProp, ParamListBase } from '@react-navigation/native';

import { MAIN_STACK_ROUTES, TAB_ROUTES } from '@/constants/routes';

type TabRoute = (typeof TAB_ROUTES)[keyof typeof TAB_ROUTES];

type NavLike = NavigationProp<ParamListBase>;

/** Navigate to a bottom-tab screen from any nested navigator (stack, drawer, etc.). */
export function navigateToTab(navigation: NavLike, tabRoute: TabRoute, params?: object) {
  let current: NavLike | undefined = navigation;

  while (current) {
    const state = current.getState();
    if (state?.routeNames.includes(tabRoute)) {
      current.navigate(tabRoute as never, params as never);
      return;
    }
    current = current.getParent() ?? undefined;
  }

  // Fallback: target tab via MainTabs (MainStack child)
  let root: NavLike | undefined = navigation;
  while (root?.getParent()) {
    root = root.getParent() ?? undefined;
  }
  root?.navigate(
    MAIN_STACK_ROUTES.TABS as never,
    {
      screen: tabRoute,
      params,
    } as never,
  );
}

export function navigateToAlertsTab(navigation: NavLike) {
  navigateToTab(navigation, TAB_ROUTES.ALERTS);
}
