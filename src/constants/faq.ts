export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: '1',
    question: 'How will I receive emergency funding quickly?',
    answer:
      'First step is to update your profile accurately to include whether you have pets, livestock, ADA requirements, etc. If you are in a designated disaster area, Ready2Go will send out a survey within 1 hour of a major disruption. Based on your responses, Ready2Go will automatically book a hotel or provide emergency relief funding digitally.',
  },
  {
    id: '2',
    question: 'Is everyone eligible for hotels/relief funding?',
    answer:
      'No. Ready2Go only sends a survey to Ready2Go users who are in areas with reported major damage.',
  },
  {
    id: '3',
    question: "How is this process different than FEMA's emergency relief process?",
    answer:
      'Ready2Go is "the bridge" to allow FEMA and nonprofits to mobilize to the area. Ready2Go aims to provide emergency lodging and funds for citizens to have essentials when you need it most (within the first 72 hrs).',
  },
  {
    id: '4',
    question: 'If I respond to the survey needing a hotel, how do I check in?',
    answer:
      'Ready2Go will book the closest hotel with your specified criteria and send you a digital receipt. Additionally, Ready2Go will provide directions based on the current situation (road disruptions, downed trees, etc.).',
  },
  {
    id: '5',
    question: 'Can I book other hotels or receive funding for other people?',
    answer:
      'No. Ready2Go uses your onboarding information to book hotels and provide relief funding.',
  },
  {
    id: '6',
    question: 'Do I just say I need relief funding and then I get it?',
    answer:
      'No. Ready2Go mirrors FEMA\'s process, but quicker. You will need to provide evidence of needing assistance. Ready2Go is "the bridge" to FEMA\'s emergency relief requirements. Ready2Go provides immediate housing and funds for essentials for the first 3 days, which allows time for FEMA and nonprofits (Red Cross, World Central Kitchen, donations) to arrive in the area to continue the relief process.',
  },
  {
    id: '7',
    question: 'What about fraud?',
    answer:
      'After every major event, a complete audit review will occur and if fraud is identified, appropriate action will be taken based on local/state laws.',
  },
];

export const EMERGENCY_PROFILE_MESSAGE =
  'This information is required for Ready2Go to provide emergency services (hotels, funds, services, etc.) immediately following a disruption.';
