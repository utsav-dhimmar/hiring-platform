/**
 * Mock data and constants for admin development/demo.
 * Use these during UI development before backend API integration.
 */

export interface CriteriaMock {
    /** Name and description */
    info: {
        name: string;
        description: string;
    };
    /** Whether criteria is active */
    isactive: boolean;
    /** Creation timestamp */
    created_at: string;
    /** Last updated timestamp */
    updated_at: string;
    /** Unique identifier */
    id: number;
}

export const CRITERIA_MOCK_DATA: CriteriaMock[] = [
    {
        info: {
            name: "Communication",
            description: "Evaluate the candidate's communication skills."
        },
        isactive: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        id: 1,
    },
    {
        info: {
            name: "Confidence",
            description: "Evaluate the candidate's confidence."
        },
        isactive: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        id: 2,
    },
    {
        info: {
            name: "Cultural Fit",
            description: "Evaluate cultural fit using job description and candidate behavior."
        },
        isactive: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        id: 3,
    },
    {
        info: {
            name: "Profile Understanding",
            description: "Evaluate how well the candidate understands their own experience."
        },
        isactive: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        id: 4,
    },
    {
        info: {
            name: "Tech Stack",
            description: "Evaluate technical skills relevant to the role."
        },
        isactive: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        id: 5,
    },
    {
        info: {
            name: "Salary Alignment",
            description: "Evaluate salary expectation alignment."
        },
        isactive: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        id: 6,
    },
];

const SCORE = {
    MAX: 5, MIN: 0
}

export const MOCK_EVALUATION_DATA = {
    communication: {
        reasoning: "The candidate demonstrated clear and concise communication during the technical explanation. They were able to articulate complex architectural concepts with ease and used appropriate technical vocabulary.",
        score: Math.floor(Math.random() * (SCORE.MAX - SCORE.MIN + 1)) + SCORE.MIN,
        confidence: 0.5
    },
    confidence: {
        reasoning: "Very confident in their responses, especially when discussing React best practices and state management. They didn't hesitate to admit when they didn't know something, which shows maturity.",
        score: Math.floor(Math.random() * (SCORE.MAX - SCORE.MIN + 1)) + SCORE.MIN,
        confidence: 0.5
    },
    cultural_fit: {
        reasoning: "Values collaborative problem solving and shows a strong alignment with our agile processes. Expressed interest in mentorship and contributing to open-source.",
        score: Math.floor(Math.random() * (SCORE.MAX - SCORE.MIN + 1)) + SCORE.MIN,
        confidence: 0.5
    },
    profile_understanding: {
        reasoning: "Understands the requirements of a Senior Frontend Role perfectly. Focused on scalability, performance, and maintainability in their answers.",
        score: Math.floor(Math.random() * (SCORE.MAX - SCORE.MIN + 1)) + SCORE.MIN,
        confidence: 0.5
    },
    tech_stack: {
        reasoning: "Deep knowledge of React, TypeScript, and modern CSS frameworks. Explained the tradeoffs between different state management libraries effectively.",
        score: Math.floor(Math.random() * (SCORE.MAX - SCORE.MIN + 1)) + SCORE.MIN,
        confidence: 0.5
    },
    salary_alignment: {
        reasoning: "Expectations are within our range for this role. Open to negotiation based on equity and benefits.",
        score: Math.floor(Math.random() * (SCORE.MAX - SCORE.MIN + 1)) + SCORE.MIN,
        confidence: 0.5
    }
};