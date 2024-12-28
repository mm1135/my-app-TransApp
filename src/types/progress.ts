export type LearningProgress = {
  date: string;
  wordsLearned: number;
  reviewedWords: number;
  correctAnswers: number;
  totalAnswers: number;
};

export type ReviewInterval = {
  initial: number; // 初回復習までの時間（時間単位）
  good: number; // 正解時の次回復習までの時間
  again: number; // 不正解時の次回復習までの時間
};

export type UserSettings = {
  reviewIntervals: ReviewInterval;
  dailyGoal: number;
  reminderEnabled: boolean;
  reminderTime: string;
}; 