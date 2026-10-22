/**
 * Run from the repository root: node -r ts-node/register ./seed.ts
 * Preview without connecting to PostgreSQL: add --check.
 * Uses DATABASE_URL, with .env.<NODE_ENV> (or .env) as a fallback, like ConfigAppModule.
 * No Nest application, migrations, resets, deletes, uploads, or score writes.
 * Requires a generated Prisma engine matching the host OS.
 */
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { ConfigModule } from '@nestjs/config';
import {
  ChallengeStatus,
  ChallengeType,
  Prisma,
  PrismaClient,
} from './generated/prisma';

class SeedError extends Error {}

type Question = {
  question: string;
  explanation: string;
  answers: { answer: string; is_correct: boolean }[];
};
type BaseSeed = {
  title: string;
  slug: string;
  description: string;
  order: number;
};
type Seed = BaseSeed &
  (
    | { type: 'quiz'; questions: Question[] }
    | {
        type: 'ordering';
        instruction: string;
        items: { content: string; explanation: string }[];
      }
    | {
        type: 'fillBlank';
        questions: { sentence: string; correct_word: string }[];
      }
    | { type: 'puzzle'; instruction: string; image: string }
  );

// IDs are also an ownership check: a manually created record with the same slug
// has a different ID and must never be adopted. Keep this namespace stable.
function id(key: string): string {
  const hex = createHash('sha256')
    .update(`nestjs-lms:challenge-seed:v1:${key}`)
    .digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function q(
  question: string,
  explanation: string,
  correct: string,
  ...wrong: string[]
): Question {
  // Rotate the answer position; do not always put the correct option first.
  const answers = [correct, ...wrong].map((answer, i) => ({
    answer,
    is_correct: i === 0,
  }));
  const offset = question.length % 4;
  return {
    question,
    explanation,
    answers: [...answers.slice(offset), ...answers.slice(0, offset)],
  };
}

// No placeholder convention exists in the backend; it stores the sentence verbatim.
// Use the explicit ___ marker. Frontend rendering cannot be checked in this checkout.
export const seeds: Seed[] = [
  {
    type: "quiz",
    title: "Hai Bà Trưng và cuộc khởi nghĩa năm 40",
    slug: "seed-quiz-hai-ba-trung",
    order: 1,
    description: "Tìm hiểu Trưng Trắc, Trưng Nhị và ý nghĩa cuộc khởi nghĩa chống ách đô hộ Đông Hán.",
    questions: [
      q("Hai Bà Trưng là hai nhân vật lịch sử nào?", "Hai Bà Trưng gồm Trưng Trắc và Trưng Nhị.", "Trưng Trắc và Trưng Nhị", "Bà Triệu và Trưng Trắc", "Ỷ Lan và Trưng Nhị", "Nguyễn Thị Minh Khai và Võ Thị Sáu"),
      q("Khởi nghĩa Hai Bà Trưng bùng nổ vào năm nào?", "Cuộc khởi nghĩa chống chính quyền đô hộ Đông Hán nổ ra năm 40.", "Năm 40", "Năm 248", "Năm 938", "Năm 1010"),
      q("Hai Bà Trưng phất cờ khởi nghĩa tại địa danh nào?", "Theo cách trình bày phổ biến trong sách lịch sử, cuộc khởi nghĩa được phát động tại Hát Môn.", "Hát Môn", "Bạch Đằng", "Chi Lăng", "Đống Đa"),
      q("Đối tượng mà cuộc khởi nghĩa Hai Bà Trưng chống lại là chính quyền nào?", "Khởi nghĩa diễn ra chống lại ách đô hộ của nhà Đông Hán.", "Nhà Đông Hán", "Nhà Minh", "Nhà Thanh", "Thực dân Pháp"),
      q("Ý nghĩa nổi bật của cuộc khởi nghĩa Hai Bà Trưng là gì?", "Cuộc khởi nghĩa thể hiện ý chí giành độc lập, tự chủ của người Việt trong thời Bắc thuộc.", "Khẳng định ý chí giành độc lập, tự chủ", "Mở đầu triều Nguyễn", "Thống nhất đất nước vào năm 1975", "Dời đô về Thăng Long"),
    ],
  },
  {
    type: "quiz",
    title: "Ngô Quyền và chiến thắng Bạch Đằng",
    slug: "seed-quiz-ngo-quyen",
    order: 2,
    description: "Khám phá tài thao lược của Ngô Quyền và chiến thắng lịch sử năm 938.",
    questions: [
      q("Ai chỉ huy quân dân ta giành thắng lợi trên sông Bạch Đằng năm 938?", "Ngô Quyền lãnh đạo trận Bạch Đằng đánh bại quân Nam Hán.", "Ngô Quyền", "Lê Lợi", "Trần Quốc Tuấn", "Quang Trung"),
      q("Trận Bạch Đằng do Ngô Quyền chỉ huy diễn ra vào năm nào?", "Trận chiến trên sông Bạch Đằng diễn ra năm 938.", "Năm 938", "Năm 40", "Năm 1288", "Năm 1789"),
      q("Đối thủ của quân ta trong trận Bạch Đằng năm 938 là lực lượng nào?", "Quân Nam Hán tiến vào theo đường thủy và bị đánh bại.", "Quân Nam Hán", "Quân Nguyên", "Quân Thanh", "Quân Minh"),
      q("Ngô Quyền đã tận dụng yếu tố tự nhiên nào trong trận Bạch Đằng?", "Quân ta lợi dụng thủy triều lên xuống kết hợp trận địa cọc trên sông.", "Thủy triều lên xuống", "Bão tuyết", "Núi lửa", "Hạn hán"),
      q("Chiến thắng Bạch Đằng năm 938 có ý nghĩa nổi bật nào?", "Chiến thắng mở ra thời kỳ độc lập tự chủ lâu dài, chấm dứt thời kỳ Bắc thuộc kéo dài.", "Mở ra thời kỳ độc lập tự chủ lâu dài", "Đánh dấu ngày thành lập nước Việt Nam Dân chủ Cộng hòa", "Khởi đầu cuộc kháng chiến chống Pháp năm 1946", "Thống nhất đất nước năm 1975"),
    ],
  },
  {
    type: "quiz",
    title: "Trần Hưng Đạo, Lê Lợi và Quang Trung",
    slug: "seed-quiz-heroes-dai-viet",
    order: 3,
    description: "Nhận diện các vị anh hùng dân tộc qua những chiến công tiêu biểu.",
    questions: [
      q("Trần Hưng Đạo còn được biết đến với tên gọi nào?", "Trần Hưng Đạo là tước hiệu của Trần Quốc Tuấn.", "Trần Quốc Tuấn", "Nguyễn Huệ", "Lê Lợi", "Ngô Quyền"),
      q("Chiến thắng Bạch Đằng năm 1288 gắn với vị tướng nào?", "Trần Quốc Tuấn giữ vai trò tổng chỉ huy quân đội nhà Trần trong cuộc kháng chiến chống Nguyên năm 1288.", "Trần Hưng Đạo", "Hai Bà Trưng", "Quang Trung", "Đinh Bộ Lĩnh"),
      q("Ai là lãnh tụ cuộc khởi nghĩa Lam Sơn chống quân Minh?", "Lê Lợi lãnh đạo cuộc khởi nghĩa Lam Sơn bắt đầu năm 1418.", "Lê Lợi", "Ngô Quyền", "Trần Nhân Tông", "Lý Thường Kiệt"),
      q("Hoàng đế Quang Trung có tên gọi khi chưa lên ngôi là gì?", "Quang Trung là niên hiệu của Nguyễn Huệ khi lên ngôi hoàng đế.", "Nguyễn Huệ", "Nguyễn Ánh", "Nguyễn Trãi", "Nguyễn Bỉnh Khiêm"),
      q("Chiến thắng Ngọc Hồi – Đống Đa mùa xuân 1789 gắn với ai?", "Quang Trung chỉ huy quân Tây Sơn đánh bại quân Thanh vào mùa xuân Kỷ Dậu 1789.", "Quang Trung", "Trần Hưng Đạo", "Lê Hoàn", "Ngô Quyền"),
    ],
  },
  {
    type: "ordering",
    title: "Diễn biến chiến thắng Bạch Đằng năm 938",
    slug: "seed-ordering-bach-dang-938",
    order: 4,
    description: "Sắp xếp các mốc chính trong kế hoạch đánh quân Nam Hán của Ngô Quyền.",
    instruction: "Sắp xếp diễn biến khái quát của trận Bạch Đằng năm 938, từ chuẩn bị đến thắng lợi.",
    items: [
      { content: "Ngô Quyền chuẩn bị lực lượng và lựa chọn sông Bạch Đằng làm trận địa.", explanation: "Chủ động lựa chọn địa hình phù hợp để chống quân thủy." },
      { content: "Quân ta bố trí bãi cọc ngầm ở lòng sông.", explanation: "Trận địa cọc phát huy tác dụng khi nước triều rút." },
      { content: "Quân ta dùng thuyền nhẹ ra khiêu chiến, nhử quân Nam Hán tiến sâu.", explanation: "Kéo đối phương vào khu vực đã chuẩn bị." },
      { content: "Khi thủy triều rút, quân Nam Hán gặp bất lợi tại bãi cọc.", explanation: "Thuyền địch mắc vào trận địa cọc khi nước xuống." },
      { content: "Quân ta phản công quyết liệt, đánh bại quân Nam Hán.", explanation: "Chớp thời cơ phản công để giành chiến thắng." },
      { content: "Chiến thắng Bạch Đằng mở ra thời kỳ độc lập tự chủ lâu dài.", explanation: "Kết quả có ý nghĩa bước ngoặt đối với lịch sử dân tộc." },
    ],
  },
  {
    type: "ordering",
    title: "Các mốc khởi nghĩa Lam Sơn",
    slug: "seed-ordering-lam-son",
    order: 5,
    description: "Ôn những mốc chính từ khởi nghĩa Lam Sơn đến sự ra đời triều Lê sơ.",
    instruction: "Sắp xếp các sự kiện theo trình tự thời gian, từ năm 1418 đến năm 1428.",
    items: [
      { content: "Năm 1418: Lê Lợi dựng cờ khởi nghĩa ở Lam Sơn.", explanation: "Khởi đầu phong trào chống quân Minh." },
      { content: "Giai đoạn đầu: nghĩa quân chiến đấu, gây dựng lực lượng ở vùng Thanh Hóa.", explanation: "Nghĩa quân trải qua nhiều khó khăn trước khi mở rộng địa bàn." },
      { content: "Năm 1424: nghĩa quân tiến vào Nghệ An, mở rộng vùng kiểm soát.", explanation: "Bước chuyển quan trọng của cuộc khởi nghĩa." },
      { content: "Năm 1426: nghĩa quân thắng lớn tại Tốt Động – Chúc Động.", explanation: "Thắng lợi quan trọng tại vùng đồng bằng Bắc Bộ." },
      { content: "Năm 1427: nghĩa quân thắng trận Chi Lăng – Xương Giang.", explanation: "Đánh bại đạo viện binh chủ lực của nhà Minh." },
      { content: "Năm 1428: Lê Lợi lên ngôi vua, mở đầu triều Lê sơ.", explanation: "Khép lại cuộc khởi nghĩa thắng lợi." },
    ],
  },
  {
    type: "ordering",
    title: "Hành quân thần tốc mùa xuân 1789",
    slug: "seed-ordering-quang-trung-1789",
    order: 6,
    description: "Sắp xếp những mốc chính trong cuộc tiến quân của Quang Trung đánh quân Thanh.",
    instruction: "Đặt các sự kiện theo trình tự lịch sử trong chiến dịch mùa xuân Kỷ Dậu 1789.",
    items: [
      { content: "Quân Thanh tiến vào Thăng Long cuối năm 1788.", explanation: "Bối cảnh dẫn đến chiến dịch phản công." },
      { content: "Nguyễn Huệ lên ngôi hoàng đế, lấy niên hiệu Quang Trung.", explanation: "Ông lên ngôi trước khi trực tiếp tiến quân ra Bắc." },
      { content: "Quang Trung chỉ huy đại quân hành quân gấp ra Bắc.", explanation: "Tổ chức lực lượng và tiến quân nhanh chóng." },
      { content: "Quân Tây Sơn tập kết tại Tam Điệp và chuẩn bị tiến công.", explanation: "Sắp xếp lực lượng trước trận quyết chiến." },
      { content: "Quân Tây Sơn lần lượt tiến đánh các vị trí phòng thủ của quân Thanh.", explanation: "Đẩy mạnh thế tiến công trong dịp Tết Kỷ Dậu." },
      { content: "Quân Tây Sơn thắng lớn tại Ngọc Hồi – Đống Đa, giải phóng Thăng Long.", explanation: "Đỉnh cao của chiến dịch mùa xuân 1789." },
      { content: "Chiến thắng củng cố nền độc lập và được ghi nhớ trong lịch sử dân tộc.", explanation: "Khái quát ý nghĩa cuộc chiến thắng." },
    ],
  },
  {
    type: "fillBlank",
    title: "Điền tên các vị anh hùng dân tộc",
    slug: "seed-fillblank-hero-names",
    order: 7,
    description: "Hoàn thành tên riêng của các nhân vật lịch sử Việt Nam.",
    questions: [
      { sentence: "Hai Bà Trưng gồm Trưng Trắc và Trưng ___.", correct_word: "Nhị" },
      { sentence: "Người chỉ huy chiến thắng Bạch Đằng năm 938 là Ngô ___.", correct_word: "Quyền" },
      { sentence: "Trần Hưng Đạo có tên thật là Trần Quốc ___.", correct_word: "Tuấn" },
      { sentence: "Lãnh tụ khởi nghĩa Lam Sơn là Lê ___.", correct_word: "Lợi" },
      { sentence: "Hoàng đế Quang Trung còn được gọi là Nguyễn ___.", correct_word: "Huệ" },
      { sentence: "Nữ anh hùng khởi nghĩa chống Đông Ngô năm 248 là Bà ___.", correct_word: "Triệu" },
    ],
  },
  {
    type: "fillBlank",
    title: "Điền sự kiện và địa danh lịch sử",
    slug: "seed-fillblank-historic-events",
    order: 8,
    description: "Ôn địa danh và những chiến công gắn với anh hùng dân tộc.",
    questions: [
      { sentence: "Chiến thắng năm 938 của Ngô Quyền diễn ra trên sông ___.", correct_word: "Bạch Đằng" },
      { sentence: "Lê Lợi là lãnh tụ cuộc khởi nghĩa ___.", correct_word: "Lam Sơn" },
      { sentence: "Trận chiến nổi tiếng năm 1789 có tên Ngọc Hồi – ___.", correct_word: "Đống Đa" },
      { sentence: "Cuộc khởi nghĩa Hai Bà Trưng bùng nổ ở Hát ___.", correct_word: "Môn" },
      { sentence: "Chiến thắng Bạch Đằng năm 1288 diễn ra dưới triều ___.", correct_word: "Trần" },
      { sentence: "Năm 1427, nghĩa quân Lam Sơn giành thắng lợi lớn tại Chi Lăng – ___.", correct_word: "Xương Giang" },
    ],
  },
  {
    type: "fillBlank",
    title: "Điền niên đại lịch sử Việt Nam",
    slug: "seed-fillblank-hero-timeline",
    order: 9,
    description: "Ghi nhớ niên đại của các cuộc khởi nghĩa và chiến thắng tiêu biểu.",
    questions: [
      { sentence: "Khởi nghĩa Hai Bà Trưng bùng nổ năm ___.", correct_word: "40" },
      { sentence: "Khởi nghĩa Bà Triệu diễn ra vào năm ___.", correct_word: "248" },
      { sentence: "Ngô Quyền chiến thắng trên sông Bạch Đằng năm ___.", correct_word: "938" },
      { sentence: "Chiến thắng Bạch Đằng thời Trần diễn ra năm ___.", correct_word: "1288" },
      { sentence: "Khởi nghĩa Lam Sơn bắt đầu năm ___.", correct_word: "1418" },
      { sentence: "Quang Trung đại phá quân Thanh vào mùa xuân năm ___.", correct_word: "1789" },
    ],
  },
  {
    type: "puzzle",
    title: "Ghép hình: Hai Bà Trưng",
    slug: "seed-puzzle-hai-ba-trung",
    order: 10,
    description: "Ghép hình tượng Hai Bà Trưng và nhận diện hai nữ anh hùng khởi nghĩa năm 40.",
    instruction: "Ghép lại bức ảnh tượng Hai Bà Trưng tại khu du lịch Suối Tiên; chú ý hai nhân vật cưỡi voi.",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/T%C6%B0%E1%BB%A3ng_Hai_B%C3%A0_Tr%C6%B0ng_%E1%BB%9F_Su%E1%BB%91i_Ti%C3%AAn.JPG",
  },
  {
    type: "puzzle",
    title: "Ghép hình: Ngô Quyền",
    slug: "seed-puzzle-ngo-quyen",
    order: 11,
    description: "Ghép hình tượng Ngô Quyền, vị anh hùng gắn với chiến thắng Bạch Đằng năm 938.",
    instruction: "Ghép lại ảnh tượng Ngô Quyền tại Đường Lâm; quan sát đường nét trang phục và dáng tượng.",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/T%C6%B0%E1%BB%A3ng_Ng%C3%B4_Quy%E1%BB%81n.jpg",
  },
  {
    type: "puzzle",
    title: "Ghép hình: Trần Hưng Đạo",
    slug: "seed-puzzle-tran-hung-dao",
    order: 12,
    description: "Ghép hình tượng Trần Hưng Đạo, danh tướng gắn với chiến thắng Bạch Đằng năm 1288.",
    instruction: "Ghép lại bức ảnh tượng Trần Hưng Đạo ở Nam Định; quan sát dáng đứng và hình khối tượng.",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Tran_Hung_Dao_statue.JPG",
  },
];

export function validateSeeds(): void {
  const slugs = new Set<string>();
  const titles = new Set<string>();
  for (const seed of seeds) {
    if (
      !/^seed-(quiz|ordering|fillblank|puzzle)-[a-z0-9-]+$/.test(seed.slug) ||
      slugs.has(seed.slug)
    ) {
      throw new SeedError(`Invalid/duplicate seed slug: ${seed.slug}`);
    }
    slugs.add(seed.slug);
    if (
      !seed.title.trim() ||
      titles.has(seed.title) ||
      !seed.description.trim()
    )
      throw new SeedError(`Invalid title/description: ${seed.slug}`);
    titles.add(seed.title);
    if (seed.type === 'quiz') {
      if (seed.questions.length !== 5)
        throw new SeedError(`Expected 5 quiz questions: ${seed.slug}`);
      for (const question of seed.questions) {
        if (
          !question.question.trim() ||
          !question.explanation.trim() ||
          question.answers.length !== 4 ||
          question.answers.filter((a) => a.is_correct).length !== 1 ||
          question.answers.some((a) => !a.answer.trim()) ||
          new Set(question.answers.map((a) => a.answer)).size !== 4
        ) {
          throw new SeedError(`Invalid quiz question: ${seed.slug}`);
        }
      }
    } else if (seed.type === 'ordering') {
      if (
        !seed.instruction.trim() ||
        seed.items.length < 5 ||
        seed.items.length > 7 ||
        seed.items.some((i) => !i.content.trim() || !i.explanation.trim())
      ) {
        throw new SeedError(`Invalid ordering data: ${seed.slug}`);
      }
    } else if (seed.type === 'fillBlank') {
      if (
        seed.questions.length < 5 ||
        seed.questions.length > 8 ||
        seed.questions.some(
          (q) => q.sentence.split('___').length !== 2 || !q.correct_word.trim(),
        )
      ) {
        throw new SeedError(`Invalid fillBlank data: ${seed.slug}`);
      }
    } else if (
      !seed.instruction.trim() ||
      new URL(seed.image).protocol !== 'https:'
    ) {
      throw new SeedError(`Invalid puzzle image/instruction: ${seed.slug}`);
    }
  }
  if (
    seeds.length !== 12 ||
    Object.values(ChallengeType).some(
      (type) => seeds.filter((s) => s.type === type).length !== 3,
    )
  ) {
    throw new SeedError('Expected exactly 3 seeds per ChallengeType.');
  }
}

export function createData(seed: Seed): Prisma.ChallengeCreateInput {
  const base = {
    id: id(seed.slug),
    title: seed.title,
    slug: seed.slug,
    description: seed.description,
    type: ChallengeType[seed.type],
    order: seed.order,
    status: ChallengeStatus.published,
  };
  switch (seed.type) {
    case 'quiz':
      return {
        ...base,
        questions: {
          create: seed.questions.map((q, i) => ({
            id: id(`${seed.slug}/question/${i}`),
            question: q.question,
            explanation: q.explanation,
            answers: {
              create: q.answers.map((a, j) => ({
                id: id(`${seed.slug}/question/${i}/answer/${j}`),
                ...a,
              })),
            },
          })),
        },
      };
    case 'ordering':
      return {
        ...base,
        orderingChallenge: {
          create: {
            id: id(`${seed.slug}/ordering`),
            instruction: seed.instruction,
            items: {
              create: seed.items.map((item, i) => ({
                id: id(`${seed.slug}/item/${i}`),
                ...item,
                correct_order: i + 1,
              })),
            },
          },
        },
      };
    case 'fillBlank':
      return {
        ...base,
        fillBlankChallenge: {
          create: {
            id: id(`${seed.slug}/fillBlank`),
            questions: {
              create: seed.questions.map((q, i) => ({
                id: id(`${seed.slug}/blank/${i}`),
                ...q,
              })),
            },
          },
        },
      };
    case 'puzzle':
      return {
        ...base,
        puzzleChallenge: {
          create: {
            id: id(`${seed.slug}/puzzle`),
            instruction: seed.instruction,
            image: seed.image,
          },
        },
      };
  }
}

const include = {
  questions: { include: { answers: true } },
  orderingChallenge: { include: { items: true } },
  fillBlankChallenge: { include: { questions: true } },
  puzzleChallenge: true,
  _count: { select: { challengeScore: true } },
} satisfies Prisma.ChallengeInclude;
type Existing = Prisma.ChallengeGetPayload<{ include: typeof include }>;

// Match only fields controlled by this script; timestamps and scores stay intact.
function currentData(row: Existing): Prisma.ChallengeCreateInput {
  const data: Prisma.ChallengeCreateInput = {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    type: row.type,
    order: row.order,
    status: row.status,
  };
  if (row.questions.length)
    data.questions = {
      create: row.questions.map((q) => ({
        id: q.id,
        question: q.question,
        explanation: q.explanation,
        answers: {
          create: q.answers.map((a) => ({
            id: a.id,
            answer: a.answer,
            is_correct: a.is_correct,
          })),
        },
      })),
    };
  if (row.orderingChallenge)
    data.orderingChallenge = {
      create: {
        id: row.orderingChallenge.id,
        instruction: row.orderingChallenge.instruction,
        items: {
          create: row.orderingChallenge.items.map((i) => ({
            id: i.id,
            content: i.content,
            explanation: i.explanation,
            correct_order: i.correct_order,
          })),
        },
      },
    };
  if (row.fillBlankChallenge)
    data.fillBlankChallenge = {
      create: {
        id: row.fillBlankChallenge.id,
        questions: {
          create: row.fillBlankChallenge.questions.map((q) => ({
            id: q.id,
            sentence: q.sentence,
            correct_word: q.correct_word,
          })),
        },
      },
    };
  if (row.puzzleChallenge)
    data.puzzleChallenge = {
      create: {
        id: row.puzzleChallenge.id,
        instruction: row.puzzleChallenge.instruction,
        image: row.puzzleChallenge.image,
      },
    };
  return data;
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value))
    return value
      .map(canonical)
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, canonical(v)]),
    );
  }
  return value;
}

// Check the ownership of every existing child and its parent. Unexpected records
// are never deleted or overwritten, even if the top-level slug matches.
function assertOwned(row: Existing, seed: Seed): void {
  if (row.id !== id(seed.slug) || row.type !== seed.type)
    throw new SeedError(`Ownership/type conflict: ${seed.slug}`);
  const fail = () => {
    throw new SeedError(
      `Unexpected/manual child content: ${seed.slug}; no changes applied.`,
    );
  };
  if (seed.type !== 'quiz' && row.questions.length) fail();
  if (seed.type !== 'ordering' && row.orderingChallenge) fail();
  if (seed.type !== 'fillBlank' && row.fillBlankChallenge) fail();
  if (seed.type !== 'puzzle' && row.puzzleChallenge) fail();
  if (seed.type === 'quiz') {
    for (const question of row.questions) {
      const i = seed.questions.findIndex(
        (_, i) => question.id === id(`${seed.slug}/question/${i}`),
      );
      if (i < 0 || question.challenge_id !== row.id) fail();
      for (const answer of question.answers) {
        if (
          answer.challenge_question_id !== question.id ||
          !seed.questions[i].answers.some(
            (_, j) =>
              answer.id === id(`${seed.slug}/question/${i}/answer/${j}`),
          )
        )
          fail();
      }
    }
  }
  if (row.orderingChallenge) {
    const parent = row.orderingChallenge;
    if (
      seed.type !== 'ordering' ||
      parent.id !== id(`${seed.slug}/ordering`) ||
      parent.challenge_id !== row.id
    )
      fail();
    if (
      seed.type === 'ordering' &&
      parent.items.some(
        (item) =>
          item.ordering_id !== parent.id ||
          !seed.items.some((_, i) => item.id === id(`${seed.slug}/item/${i}`)),
      )
    )
      fail();
  }
  if (row.fillBlankChallenge) {
    const parent = row.fillBlankChallenge;
    if (
      seed.type !== 'fillBlank' ||
      parent.id !== id(`${seed.slug}/fillBlank`) ||
      parent.challenge_id !== row.id
    )
      fail();
    if (
      seed.type === 'fillBlank' &&
      parent.questions.some(
        (q) =>
          q.challenge_id !== parent.id ||
          !seed.questions.some(
            (_, i) => q.id === id(`${seed.slug}/blank/${i}`),
          ),
      )
    )
      fail();
  }
  if (
    row.puzzleChallenge &&
    (row.puzzleChallenge.id !== id(`${seed.slug}/puzzle`) ||
      row.puzzleChallenge.challenge_id !== row.id)
  )
    fail();
}

async function synchronize(
  tx: Prisma.TransactionClient,
  seed: Seed,
): Promise<void> {
  const challengeId = id(seed.slug);
  await tx.challenge.update({
    where: { id: challengeId },
    data: {
      title: seed.title,
      description: seed.description,
      order: seed.order,
      status: ChallengeStatus.published,
    },
  });
  if (seed.type === 'quiz') {
    for (const [i, question] of seed.questions.entries()) {
      const questionId = id(`${seed.slug}/question/${i}`);
      const fields = {
        question: question.question,
        explanation: question.explanation,
      };
      await tx.challengeQuestion.upsert({
        where: { id: questionId, challenge_id: challengeId },
        create: { id: questionId, challenge_id: challengeId, ...fields },
        update: fields,
      });
      for (const [j, answer] of question.answers.entries()) {
        const answerId = id(`${seed.slug}/question/${i}/answer/${j}`);
        await tx.challengeAnswer.upsert({
          where: { id: answerId, challenge_question_id: questionId },
          create: {
            id: answerId,
            challenge_question_id: questionId,
            ...answer,
          },
          update: answer,
        });
      }
    }
  } else if (seed.type === 'ordering') {
    const parentId = id(`${seed.slug}/ordering`);
    await tx.orderingChallenge.upsert({
      where: { challenge_id: challengeId, id: parentId },
      create: {
        id: parentId,
        challenge_id: challengeId,
        instruction: seed.instruction,
      },
      update: { instruction: seed.instruction },
    });
    for (const [i, item] of seed.items.entries()) {
      const itemId = id(`${seed.slug}/item/${i}`);
      const fields = { ...item, correct_order: i + 1 };
      await tx.orderingItem.upsert({
        where: { id: itemId, ordering_id: parentId },
        create: { id: itemId, ordering_id: parentId, ...fields },
        update: fields,
      });
    }
  } else if (seed.type === 'fillBlank') {
    const parentId = id(`${seed.slug}/fillBlank`);
    await tx.fillBlankChallenge.upsert({
      where: { challenge_id: challengeId, id: parentId },
      create: { id: parentId, challenge_id: challengeId },
      update: {},
    });
    for (const [i, question] of seed.questions.entries()) {
      const questionId = id(`${seed.slug}/blank/${i}`);
      await tx.fillBlankQuestion.upsert({
        where: { id: questionId, challenge_id: parentId },
        create: { id: questionId, challenge_id: parentId, ...question },
        update: question,
      });
    }
  } else {
    const fields = { instruction: seed.instruction, image: seed.image };
    await tx.puzzleChallenge.upsert({
      where: { challenge_id: challengeId, id: id(`${seed.slug}/puzzle`) },
      create: {
        id: id(`${seed.slug}/puzzle`),
        challenge_id: challengeId,
        ...fields,
      },
      update: fields,
    });
  }
}

export async function seedChallenges(prisma: PrismaClient): Promise<string[]> {
  validateSeeds();
  // One serializable transaction for all 12: conflicts roll back the entire run.
  // The advisory lock also serializes concurrent instances of this seed script.
  return prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(214077, 1204)`;
      const messages: string[] = [];
      for (const seed of seeds) {
        const data = createData(seed);
        const existing = await tx.challenge.findUnique({
          where: { slug: seed.slug },
          include,
        });
        if (!existing) {
          await tx.challenge.create({ data });
          messages.push(`created ${seed.slug}`);
          continue;
        }
        assertOwned(existing, seed);
        if (
          isDeepStrictEqual(canonical(currentData(existing)), canonical(data))
        ) {
          messages.push(`unchanged ${seed.slug}`);
          continue;
        }
        if (existing._count.challengeScore > 0) {
          throw new SeedError(
            `Score conflict: ${seed.slug} has user scores and changed content; no changes applied.`,
          );
        }
        await synchronize(tx, seed);
        messages.push(`synchronized ${seed.slug}`);
      }
      return messages;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 10000,
      timeout: 60000,
    },
  );
}

async function main(): Promise<void> {
  // --check deliberately never loads dotenv or constructs a database client.
  validateSeeds();
  if (process.argv.includes('--check')) {
    console.log(
      'Seed validation passed: 12 published challenges; 15 quiz questions, 60 answers; 19 ordering items; 18 fillBlank questions; 3 puzzles. No database connection.',
    );
    for (const seed of seeds)
      console.log(`${seed.type}: ${seed.title} (${seed.slug})`);
    return;
  }
  const unknown = process.argv.slice(2);
  if (unknown.length)
    throw new SeedError('Usage: node -r ts-node/register ./seed.ts [--check]');
  // envFilePath matches ConfigAppModule; exported variables retain precedence.
  await ConfigModule.forRoot({
    envFilePath: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env',
  });
  if (!process.env.DATABASE_URL?.trim())
    throw new SeedError(
      'DATABASE_URL is required; no database writes attempted.',
    );
  if (resolve(process.cwd()) !== resolve(__dirname))
    throw new SeedError('Run seed.ts from the repository root.');
  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  });
  try {
    const messages = await seedChallenges(prisma);
    messages.forEach((message) => console.log(message));
    console.log(
      'Challenge seed committed: 12 published challenges (3 per type).',
    );
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error: unknown) => {
    // Do not print Prisma query/connection error text, which can contain secrets.
    const message =
      error instanceof Prisma.PrismaClientKnownRequestError
        ? `Prisma ${error.code}; transaction rolled back. Check database access/schema and concurrent writes.`
        : error instanceof Prisma.PrismaClientInitializationError
          ? 'Prisma initialization failed. Check DATABASE_URL and the generated engine for this operating system.'
          : error instanceof SeedError
            ? error.message
            : 'Unexpected seed failure; check client generation and database configuration.';
    console.error(`Challenge seed failed: ${message}`);
    process.exitCode = 1;
  });
}
