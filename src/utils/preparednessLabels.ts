const PREPAREDNESS_TITLE_BY_ID: Record<string, string> = {
  general_evacuation_information: 'General Evacuation Information',
  general_shelter_in_place_information: 'General Shelter in Place Information',
  active_shooter: 'Active Shooter',
  emergency_planning_for_house_pets: 'Emergency Planning for House Pets',
  emergency_planning_for_large_animal_pets: 'Emergency Planning for Large Animal Pets',
  personal_identity_theft: 'Personal Identity Theft',
};

const SLUG_PATTERN = /\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b/g;

function titleCaseWord(word: string): string {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function slugToTitle(slug: string): string {
  return slug.split('_').map(titleCaseWord).join(' ');
}

/** Turns API slugs like general_shelter_in_place_information into readable titles. */
export function formatPreparednessLabel(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  const known = PREPAREDNESS_TITLE_BY_ID[trimmed.toLowerCase()];
  if (known) return known;

  if (!trimmed.includes('_')) return trimmed;

  return slugToTitle(trimmed);
}

/** Formats titles and replaces embedded slug tokens in longer strings. */
export function formatPreparednessText(text: string): string {
  return text.replace(SLUG_PATTERN, (slug) => formatPreparednessLabel(slug));
}

const GENERIC_INTRO_PATTERN =
  /^Review local preparedness (?:tasks?|information) for .+ in your area\.?$/i;

/** Shortens generic API intros into a cleaner one-liner. */
export function formatPreparednessIntro(intro: string | undefined): string {
  if (!intro?.trim()) {
    return 'Essential steps to help you prepare for emergencies in your area.';
  }

  const formatted = formatPreparednessText(intro.trim());
  if (GENERIC_INTRO_PATTERN.test(formatted)) {
    return 'Essential steps to help you prepare for emergencies in your area.';
  }

  return formatted;
}

/** Preferred display title for a preparedness category. */
export function formatPreparednessTitle(title: string, categoryId?: string): string {
  if (categoryId) {
    const known = PREPAREDNESS_TITLE_BY_ID[categoryId.toLowerCase()];
    if (known) return known;
  }

  let formatted = formatPreparednessText(title);
  formatted = formatted.replace(/\s+Preparedness(\s+Guide)?$/i, '').trim();

  if (formatted) return formatted;

  return categoryId ? formatPreparednessLabel(categoryId) : title;
}
