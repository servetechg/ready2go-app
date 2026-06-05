export const PREPAREDNESS_LOCAL_EMPTY_MESSAGE =
  'No local preparedness guides available for your area yet.';

export const PREPAREDNESS_PROFILE_INCOMPLETE_MESSAGE =
  'Complete your emergency profile to see local preparedness guides for your area.';

export const PREPAREDNESS_SEARCH_EMPTY_MESSAGE = 'No guides match your search.';

export const PREPAREDNESS_CATEGORY_NOT_FOUND_MESSAGE =
  'Guide not found in your area.';

export function getPreparednessListEmptyMessage(
  profileComplete: boolean,
  hasSearch: boolean,
): string {
  if (hasSearch) return PREPAREDNESS_SEARCH_EMPTY_MESSAGE;
  if (!profileComplete) return PREPAREDNESS_PROFILE_INCOMPLETE_MESSAGE;
  return PREPAREDNESS_LOCAL_EMPTY_MESSAGE;
}
