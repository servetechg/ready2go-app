import type { PreparednessTask } from '@/types/dashboard';

/** Static preparedness guide tasks — replace with API when connected. */
export const PREPAREDNESS_TASKS: PreparednessTask[] = [
  {
    id: 'as-1',
    categoryId: 'active-shooter',
    title: 'Run, Hide, Fight — know the order',
    body: 'If there is an accessible escape path, attempt to evacuate. If evacuation is not possible, find a place to hide where the shooter is less likely to find you. As a last resort, and only when your life is in imminent danger, attempt to disrupt or incapacitate the shooter.',
  },
  {
    id: 'as-2',
    categoryId: 'active-shooter',
    title: 'Silence your phone and stay quiet',
    body: 'Turn off ringers and vibration. Do not post your location on social media while the event is active. Call 911 only when it is safe to speak.',
  },
  {
    id: 'as-3',
    categoryId: 'active-shooter',
    title: 'Lock and barricade doors',
    body: 'Lock the door if possible. Block the door with heavy furniture. Stay away from windows and remain out of the shooter’s line of sight.',
  },
  {
    id: 'as-4',
    categoryId: 'active-shooter',
    title: 'Plan reunification with household',
    body: 'Identify a meeting point outside the danger area. Confirm your Ready2Go emergency contacts know you are safe once law enforcement clears the scene.',
  },
  {
    id: 'ch-1',
    categoryId: 'choking',
    title: 'Recognize severe choking',
    body: 'Signs include inability to speak, cough, or breathe; clutching the throat; and bluish skin color. Ask “Are you choking?” and if they cannot cough forcefully, begin aid immediately.',
  },
  {
    id: 'ch-2',
    categoryId: 'choking',
    title: 'Give 5 back blows',
    body: 'Stand behind the person, slightly to one side. Support their chest with one hand. Lean them forward and give up to 5 sharp blows between the shoulder blades with the heel of your hand.',
  },
  {
    id: 'ch-3',
    categoryId: 'choking',
    title: 'Give 5 abdominal thrusts (Heimlich)',
    body: 'Stand behind the person, wrap arms around the waist, make a fist above the navel, and pull inward and upward up to 5 times. Alternate with back blows until the object is expelled.',
  },
  {
    id: 'ch-4',
    categoryId: 'choking',
    title: 'If person becomes unresponsive',
    body: 'Lower them carefully to the ground, call 911, and begin CPR starting with chest compressions. Check the mouth for visible objects before rescue breaths.',
  },
  {
    id: 'ev-1',
    categoryId: 'evacuation',
    title: 'Know your zone and routes',
    body: 'Review local evacuation zones in Ready2Go and your county emergency map. Identify at least two routes out of your neighborhood and a backup meeting location.',
  },
  {
    id: 'ev-2',
    categoryId: 'evacuation',
    title: 'Prepare a go-bag',
    body: 'Pack medications, IDs, phone chargers, water, snacks, pet supplies, and copies of insurance documents. Keep the bag near your exit door during watch/warning periods.',
  },
  {
    id: 'ev-3',
    categoryId: 'evacuation',
    title: 'Fuel and charge before you leave',
    body: 'Fill your vehicle tank when a disruption is forecast. Charge phones and backup batteries. Share your departure route with a contact if roads may be congested.',
  },
  {
    id: 'ev-4',
    categoryId: 'evacuation',
    title: 'Follow official instructions',
    body: 'Leave immediately when authorities order evacuation. Do not drive through flooded roads. Register your status in Ready2Go when you reach a safe location.',
  },
  {
    id: 'sh-1',
    categoryId: 'shelter',
    title: 'Choose the safest room',
    body: 'Select an interior room with few windows, such as a bathroom or closet on the lowest floor. Bring supplies into the room if time allows.',
  },
  {
    id: 'sh-2',
    categoryId: 'shelter',
    title: 'Seal gaps for hazardous air',
    body: 'For chemical or smoke events, close windows and doors. Use plastic sheeting and duct tape to seal gaps around doors and vents if advised by officials.',
  },
  {
    id: 'sh-3',
    categoryId: 'shelter',
    title: 'Monitor alerts continuously',
    body: 'Keep Ready2Go notifications enabled. Use a battery-powered or hand-crank radio if power is out. Do not leave shelter until an all-clear is issued.',
  },
  {
    id: 'sh-4',
    categoryId: 'shelter',
    title: 'Stock essentials for 72 hours',
    body: 'Store water (1 gallon per person per day), non-perishable food, flashlight, first-aid kit, and hygiene items. Include ADA equipment and pet needs listed in your profile.',
  },
];

export function getPreparednessTasksForCategory(categoryId: string): PreparednessTask[] {
  return PREPAREDNESS_TASKS.filter((t) => t.categoryId === categoryId);
}

export function getPreparednessTaskCount(categoryId: string): number {
  return getPreparednessTasksForCategory(categoryId).length;
}
