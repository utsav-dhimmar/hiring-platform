export const INFO = {
  companyName: "August Infotech",
  companyLogo: "src/assets/logo.svg",
  companyDescription: "Hiring Platform is a platform for hiring and managing candidates.",
  copyright: `Copyright © ${new Date().getFullYear()} August Infotech Canada and India. All Rights Reserved`,
} as const;

export const RESUME_SCREENING_RESULT = {
  PASS: "pass",
  FAIL: "fail",
} as const;

export const CROSS_JOB_MATCH = {
  name: "Cross Job Match"
} as const;


export const CHART_TEXTS = {
  hrDecision: {
    label: "HR Decision",
    description: "Shows distribution of HR decisions",
  },
  screeningResults: {
    label: "Screening Results",
    description: "Shows pass vs fail outcomes of candidates",
  },
  recruitmentStages: {
    label: "Recruitment Stages",
    description: "Shows candidate distribution across different recruitment stages",
  },
  locations: {
    label: "Locations",
    description: "Shows candidate distribution by location",
  },
} as const;

