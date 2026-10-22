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
    type: 'quiz',
    title: 'JavaScript: Giá trị và biến',
    slug: 'seed-quiz-javascript-values',
    order: 1,
    description:
      'Nhận biết kiểu dữ liệu, khai báo biến và phép so sánh trong JavaScript.',
    questions: [
      q(
        'typeof 42 trả về chuỗi nào?',
        '42 là một giá trị số; typeof trả về chuỗi number.',
        'number',
        'string',
        'boolean',
        'object',
      ),
      q(
        'Khai báo nào cho phép gán lại giá trị của biến score?',
        'let cho phép gán lại biến trong phạm vi khối.',
        'let score = 0;',
        'const score = 0;',
        'const score = "0";',
        'const score = false;',
      ),
      q(
        'Giá trị của 2 + "3" là gì?',
        'Khi một toán hạng là chuỗi, phép + nối chuỗi thành "23".',
        '"23"',
        '5',
        '6',
        'undefined',
      ),
      q(
        'Biểu thức nào kiểm tra cả giá trị và kiểu dữ liệu?',
        '=== là phép so sánh bằng nghiêm ngặt, không ép kiểu.',
        'a === b',
        'a = b',
        'a + b',
        'a == b',
      ),
      q(
        'Kiểu dữ liệu của true là gì?',
        'true và false là hai giá trị boolean.',
        'boolean',
        'number',
        'string',
        'function',
      ),
    ],
  },
  {
    type: 'quiz',
    title: 'JavaScript: Điều kiện và vòng lặp',
    slug: 'seed-quiz-control-flow',
    order: 2,
    description:
      'Luyện suy luận các nhánh điều kiện và số lần thực hiện vòng lặp.',
    questions: [
      q(
        'Nhánh if (3 > 2) có được thực hiện không?',
        '3 lớn hơn 2 nên điều kiện là true.',
        'Có',
        'Không',
        'Chỉ khi có else',
        'Luôn phát sinh lỗi',
      ),
      q(
        'Vòng lặp for (let i = 0; i < 3; i++) chạy thân vòng lặp bao nhiêu lần?',
        'Thân vòng lặp chạy với i bằng 0, 1 và 2.',
        '3',
        '2',
        '4',
        '0',
      ),
      q(
        'Lệnh nào thoát khỏi vòng lặp gần nhất ngay lập tức?',
        'break kết thúc vòng lặp chứa nó.',
        'break',
        'continue',
        'typeof',
        'const',
      ),
      q(
        'Lệnh continue trong vòng lặp làm gì?',
        'continue bỏ phần còn lại của lượt hiện tại rồi chuyển sang lượt tiếp theo.',
        'Chuyển sang lượt lặp tiếp theo',
        'Kết thúc toàn bộ chương trình',
        'Khai báo một biến',
        'Đảo ngược mảng',
      ),
      q(
        'Điều kiện nào đúng khi age ít nhất là 18?',
        'Ít nhất 18 bao gồm cả giá trị 18, nên dùng >=.',
        'age >= 18',
        'age > 18',
        'age < 18',
        'age === 17',
      ),
    ],
  },
  {
    type: 'quiz',
    title: 'Hàm và thuật toán cơ bản',
    slug: 'seed-quiz-functions-algorithms',
    order: 3,
    description:
      'Hiểu tham số, giá trị trả về, tìm kiếm tuyến tính và thuật toán.',
    questions: [
      q(
        'function double(x) { return x * 2; } trả về gì khi gọi double(4)?',
        'Tham số x nhận 4 nên x * 2 bằng 8.',
        '8',
        '4',
        '2',
        'undefined',
      ),
      q(
        'Từ khóa nào trả một giá trị từ hàm cho nơi gọi?',
        'return kết thúc lần gọi hàm và cung cấp giá trị trả về.',
        'return',
        'break',
        'let',
        'while',
      ),
      q(
        'Thuật toán là gì?',
        'Thuật toán mô tả một chuỗi bước rõ ràng nhằm giải quyết bài toán.',
        'Một chuỗi bước rõ ràng để giải bài toán',
        'Chỉ là một ngôn ngữ lập trình',
        'Một loại màn hình',
        'Một lỗi cú pháp',
      ),
      q(
        'Tìm tuyến tính giá trị 9 trong [4, 7, 9] từ trái sang phải cần kiểm tra bao nhiêu phần tử?',
        'Phải kiểm tra lần lượt 4, 7 rồi 9.',
        '3',
        '1',
        '2',
        '9',
      ),
      q(
        'Với mảng JavaScript [10, 20, 30], chỉ số của phần tử đầu tiên là gì?',
        'Mảng JavaScript dùng chỉ số bắt đầu từ 0.',
        '0',
        '1',
        '10',
        '-1',
      ),
    ],
  },
  {
    type: 'ordering',
    title: 'Thuật toán cộng hai số',
    slug: 'seed-ordering-add-two-numbers',
    order: 4,
    description:
      'Sắp xếp các bước nhập, xử lý và xuất kết quả của một thuật toán đơn giản.',
    instruction:
      'Đặt các bước theo trình tự từ bắt đầu đến kết thúc. Vị trí đầu tiên là 1.',
    items: [
      {
        content: 'Bắt đầu thuật toán.',
        explanation: 'Xác định điểm bắt đầu trước khi nhận dữ liệu.',
      },
      {
        content: 'Nhập số thứ nhất và lưu vào a.',
        explanation: 'Cần có a trước phép cộng.',
      },
      {
        content: 'Nhập số thứ hai và lưu vào b.',
        explanation: 'Thực hiện sau bước nhập số thứ nhất theo đề bài.',
      },
      {
        content: 'Tính sum = a + b.',
        explanation: 'Chỉ cộng khi đã có cả hai số.',
      },
      { content: 'Hiển thị sum.', explanation: 'Xuất kết quả đã tính.' },
      {
        content: 'Kết thúc thuật toán.',
        explanation: 'Không còn bước xử lý nào.',
      },
    ],
  },
  {
    type: 'ordering',
    title: 'Theo dõi vòng lặp tính tổng',
    slug: 'seed-ordering-loop-sum',
    order: 5,
    description: 'Theo dõi sum và i khi cộng các số từ 1 đến 3.',
    instruction:
      'Sắp xếp dấu vết thực thi của let sum = 0; for (let i = 1; i <= 3; i++) { sum += i; } rồi in sum.',
    items: [
      {
        content: 'Khởi tạo sum = 0.',
        explanation: 'Biến tích lũy phải có giá trị ban đầu.',
      },
      {
        content: 'Khởi tạo i = 1 và kiểm tra i <= 3: đúng.',
        explanation: 'Chuẩn bị lượt đầu tiên.',
      },
      {
        content: 'Cộng i = 1 vào sum: sum = 1.',
        explanation: 'Lượt thứ nhất.',
      },
      {
        content: 'Tăng i thành 2, điều kiện đúng, cộng vào sum: sum = 3.',
        explanation: 'Lượt thứ hai.',
      },
      {
        content: 'Tăng i thành 3, điều kiện đúng, cộng vào sum: sum = 6.',
        explanation: 'Lượt thứ ba.',
      },
      {
        content: 'Tăng i thành 4, điều kiện sai, thoát vòng lặp.',
        explanation: '4 không nhỏ hơn hoặc bằng 3.',
      },
      {
        content: 'In sum: 6.',
        explanation: 'Chỉ in sau khi vòng lặp kết thúc.',
      },
    ],
  },
  {
    type: 'ordering',
    title: 'Tạo và kiểm tra hàm double',
    slug: 'seed-ordering-create-function',
    order: 6,
    description: 'Thực hiện tuần tự một quy trình viết hàm JavaScript nhỏ.',
    instruction:
      'Sắp xếp quy trình: xác định yêu cầu, viết hàm, gọi hàm, rồi kiểm tra kết quả.',
    items: [
      {
        content: 'Xác định yêu cầu: nhận số x và trả về gấp đôi x.',
        explanation: 'Hiểu đầu vào và đầu ra trước khi viết mã.',
      },
      {
        content: 'Viết phần mở đầu: function double(x) {',
        explanation: 'Khai báo tên hàm và tham số.',
      },
      {
        content: 'Viết thân hàm: return x * 2;',
        explanation: 'Tính và trả về giá trị theo yêu cầu.',
      },
      {
        content: 'Đóng thân hàm bằng dấu }.',
        explanation: 'Hoàn tất khai báo trước khi gọi.',
      },
      {
        content: 'Gọi hàm và lưu kết quả: const result = double(4);',
        explanation: 'Thực hiện hàm với dữ liệu thử.',
      },
      {
        content: 'Kiểm tra result === 8.',
        explanation: 'Đối chiếu kết quả với mong đợi.',
      },
    ],
  },
  {
    type: 'fillBlank',
    title: 'Điền từ: Biến và kiểu dữ liệu',
    slug: 'seed-fillblank-variables',
    order: 7,
    description: 'Điền một từ vào mỗi dấu ___; không cần dấu chấm câu.',
    questions: [
      {
        sentence:
          'Từ khóa khai báo biến có phạm vi khối, cho phép gán lại: ___ count = 0;',
        correct_word: 'let',
      },
      {
        sentence:
          'Từ khóa khai báo biến có phạm vi khối, không cho phép gán lại: ___ max = 10;',
        correct_word: 'const',
      },
      {
        sentence: 'Toán tử trả về tên kiểu dữ liệu: ___ 42',
        correct_word: 'typeof',
      },
      {
        sentence: 'typeof "hello" trả về chuỗi "___".',
        correct_word: 'string',
      },
      { sentence: 'typeof false trả về chuỗi "___".', correct_word: 'boolean' },
      { sentence: 'typeof 3.14 trả về chuỗi "___".', correct_word: 'number' },
    ],
  },
  {
    type: 'fillBlank',
    title: 'Điền từ: Điều kiện và vòng lặp',
    slug: 'seed-fillblank-control-flow',
    order: 8,
    description:
      'Hoàn thành cú pháp điều khiển luồng JavaScript bằng một từ khóa.',
    questions: [
      {
        sentence: '___ (age >= 18) { console.log("Adult"); }',
        correct_word: 'if',
      },
      {
        sentence: 'if (ready) { start(); } ___ { wait(); }',
        correct_word: 'else',
      },
      {
        sentence: '___ (let i = 0; i < 3; i++) { console.log(i); }',
        correct_word: 'for',
      },
      {
        sentence:
          '___ (count < 3) { count++; } // kiểm tra điều kiện trước mỗi lượt',
        correct_word: 'while',
      },
      {
        sentence: 'Trong vòng lặp, dùng ___ để kết thúc vòng lặp ngay lập tức.',
        correct_word: 'break',
      },
      {
        sentence:
          'Trong vòng lặp, dùng ___ để bỏ qua phần còn lại của lượt hiện tại.',
        correct_word: 'continue',
      },
    ],
  },
  {
    type: 'fillBlank',
    title: 'Điền từ: Hàm và mảng',
    slug: 'seed-fillblank-functions-arrays',
    order: 9,
    description:
      'Ôn từ khóa hàm, giá trị trả về và các thuộc tính mảng cơ bản.',
    questions: [
      { sentence: '___ double(x) { return x * 2; }', correct_word: 'function' },
      { sentence: 'function add(a, b) { ___ a + b; }', correct_word: 'return' },
      {
        sentence:
          'const names = ["An", "Binh"]; names.___ trả về số phần tử là 2.',
        correct_word: 'length',
      },
      {
        sentence:
          'const numbers = [1, 2]; numbers.___(3); // thêm 3 vào cuối mảng',
        correct_word: 'push',
      },
      {
        sentence:
          'const numbers = [1, 2]; numbers.___(); // xóa và trả về phần tử cuối',
        correct_word: 'pop',
      },
      {
        sentence:
          'Một hàm không thực hiện return giá trị sẽ trả về giá trị ___.',
        correct_word: 'undefined',
      },
    ],
  },
  // No local puzzle assets or static upload serving were found. HTTPS URLs are
  // explicitly supported by getFullUrl. These three square PNGs were fetched
  // successfully (HTTP 200, image/png, 288x288) during implementation.
  {
    type: 'puzzle',
    title: 'Ghép hình: JavaScript',
    slug: 'seed-puzzle-javascript-logo',
    order: 10,
    description:
      'Nhận biết biểu tượng JavaScript, ngôn ngữ thường dùng để lập trình web.',
    instruction:
      'Ghép lại biểu tượng JavaScript thành ảnh hoàn chỉnh; dùng nền vàng và chữ JS để định hướng các mảnh.',
    image:
      'https://raw.githubusercontent.com/github/explore/c8d7bc516928a4f17845b767884a80cc53affd57/topics/javascript/javascript.png',
  },
  {
    type: 'puzzle',
    title: 'Ghép hình: Python',
    slug: 'seed-puzzle-python-logo',
    order: 11,
    description:
      'Nhận biết biểu tượng Python, một ngôn ngữ phổ biến khi học lập trình.',
    instruction:
      'Ghép lại biểu tượng Python hoàn chỉnh, chú ý hai phần màu xanh và vàng đan vào nhau.',
    image:
      'https://raw.githubusercontent.com/github/explore/c8d7bc516928a4f17845b767884a80cc53affd57/topics/python/python.png',
  },
  {
    type: 'puzzle',
    title: 'Ghép hình: Node.js',
    slug: 'seed-puzzle-nodejs-logo',
    order: 12,
    description:
      'Nhận biết Node.js, môi trường thực thi JavaScript bên ngoài trình duyệt.',
    instruction:
      'Ghép lại biểu tượng Node.js hoàn chỉnh; quan sát đường viền lục giác và chữ ở trung tâm.',
    image:
      'https://raw.githubusercontent.com/github/explore/c8d7bc516928a4f17845b767884a80cc53affd57/topics/nodejs/nodejs.png',
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
