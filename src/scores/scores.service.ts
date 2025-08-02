import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ScoresService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lấy điểm chi tiết của user (tổng + chia theo từng loại)
   */
  async getUserDetailedScore(userId: string) {
    // Tổng điểm từ lessons
    const lessonScoreSum = await this.prisma.userLessonScore.aggregate({
      where: { userId },
      _sum: { score: true },
    });

    // Điểm từ challenges theo từng loại
    const challengeScores = await this.prisma.challengeScore.findMany({
      where: { user_id: userId },
      include: {
        challenge: {
          select: { type: true }
        }
      }
    });

    // Tính tổng theo từng loại challenge
    const challengeScoresByType = {
      quiz: 0,
      puzzle: 0,
      ordering: 0,
      fillBlank: 0,
    };

    challengeScores.forEach(score => {
      challengeScoresByType[score.challenge.type] += score.score;
    });

    const totalLessonScore = lessonScoreSum._sum.score || 0;
    const totalChallengeScore = Object.values(challengeScoresByType).reduce((sum, score) => sum + score, 0);
    const totalScore = totalLessonScore + totalChallengeScore;

    return {
      userId,
      totalScore,
      lessonScore: totalLessonScore,
      challengeScore: {
        total: totalChallengeScore,
        quiz: challengeScoresByType.quiz,
        puzzle: challengeScoresByType.puzzle,
        ordering: challengeScoresByType.ordering,
        fillBlank: challengeScoresByType.fillBlank,
      },
    };
  }

  /**
   * Bảng xếp hạng tổng điểm
   */
  async getLeaderboard(limit: number = 10, grade?: string) {
    let query = `
      SELECT 
        u.id,
        u."fullName",
        u.avatar,
        u.grade,
        CAST(COALESCE(lesson_scores.total_lesson_score, 0) + COALESCE(challenge_scores.total_challenge_score, 0) AS INTEGER) as total_score,
        CAST(COALESCE(lesson_scores.total_lesson_score, 0) AS INTEGER) as lesson_score,
        CAST(COALESCE(challenge_scores.total_challenge_score, 0) AS INTEGER) as challenge_score,
        CAST(ROW_NUMBER() OVER (ORDER BY (COALESCE(lesson_scores.total_lesson_score, 0) + COALESCE(challenge_scores.total_challenge_score, 0)) DESC) AS INTEGER) as rank
      FROM users u
      LEFT JOIN (
        SELECT 
          "userId",
          SUM(score) as total_lesson_score
        FROM user_lesson_scores
        GROUP BY "userId"
      ) lesson_scores ON u.id = lesson_scores."userId"
      LEFT JOIN (
        SELECT 
          user_id,
          SUM(score) as total_challenge_score
        FROM challenge_scores
        GROUP BY user_id
      ) challenge_scores ON u.id = challenge_scores.user_id
    `;

    if (grade) {
      query += ` WHERE u.grade = '${grade}'`;
    }

    query += ` ORDER BY total_score DESC LIMIT ${limit}`;

    const leaderboard = await this.prisma.$queryRawUnsafe(query);
    return leaderboard;
  }

  /**
   * Lấy thứ hạng của user
   */
  async getUserRank(userId: string) {
    // Tổng điểm của user
    const userScore = await this.getUserDetailedScore(userId);

    // Đếm số user có điểm cao hơn
    const query = `
      SELECT CAST(COUNT(*) AS INTEGER) as count
      FROM (
        SELECT 
          u.id,
          COALESCE(lesson_scores.total_lesson_score, 0) + COALESCE(challenge_scores.total_challenge_score, 0) as total_score
        FROM users u
        LEFT JOIN (
          SELECT 
            "userId",
            SUM(score) as total_lesson_score
          FROM user_lesson_scores
          GROUP BY "userId"
        ) lesson_scores ON u.id = lesson_scores."userId"
        LEFT JOIN (
          SELECT 
            user_id,
            SUM(score) as total_challenge_score
          FROM challenge_scores
          GROUP BY user_id
        ) challenge_scores ON u.id = challenge_scores.user_id
        WHERE COALESCE(lesson_scores.total_lesson_score, 0) + COALESCE(challenge_scores.total_challenge_score, 0) > ${userScore.totalScore}
      ) higher_scores
    `;

    const higherScoreCount = await this.prisma.$queryRawUnsafe(query);
    const rank = Number((higherScoreCount as any)[0].count) + 1;

    return {
      userId,
      rank,
      totalScore: userScore.totalScore,
      lessonScore: userScore.lessonScore,
      challengeScore: userScore.challengeScore,
    };
  }
}
