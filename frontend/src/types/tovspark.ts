export interface Challenge {
  id: string;
  title: string;
  company: Company;
  description: string;
  requirements: string[];
  evaluationCriteria: EvaluationCriterion[];
  reward: {
    amount: number;
    description: string;
    employmentPossibility: string;
  };
  deadline: string;
  status: 'active' | 'completed' | 'upcoming';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface Company {
  id: string;
  name: string;
  logo: string;
  industry: string;
  description: string;
}

export interface EvaluationCriterion {
  category: string;
  percentage: number;
  description: string;
}

export interface Submission {
  id: string;
  challengeId: string;
  userId: string;
  files: SubmissionFile[];
  description: string;
  technologies: string[];
  submittedAt: string;
  status: 'pending' | 'evaluating' | 'evaluated';
}

export interface SubmissionFile {
  id: string;
  name: string;
  size: number;
  url: string;
}

export interface Feedback {
  id: string;
  submissionId: string;
  status: 'waiting' | 'evaluating' | 'evaluated';
  score: number;
  evaluatedAt: string;
  evaluator: string;
  summary: string;
  details: FeedbackDetail[];
  improvements: string[];
}

export interface FeedbackDetail {
  category: string;
  score: number;
  maxScore: number;
  comment: string;
}

export interface OtherSubmission {
  id: string;
  user: {
    id: string;
    nickname: string;
    avatar: string;
  };
  preview: string;
  score: number;
  submittedAt: string;
  description: string;
  technologies: string[];
}

export interface Ranking {
  userId: string;
  username: string;
  score: number;
  rank: number;
  challengesCompleted: number;
} 