/**
 * Vietnamese history curriculum. Run from the repository root:
 *   node -r ts-node/register ./seed-learning.ts --check
 *   node -r ts-node/register ./seed-learning.ts
 * Only the second command connects to DATABASE_URL. No HTTP server or migrations.
 * Existing content is immutable: identical records are skipped; any drift fails
 * the entire transaction. No deletes, updates, enrollment, progress or score writes.
 * Text is plain Vietnamese in Lesson.description, as returned by ProductsService.
 * No frontend is present; long-form display and API order are not guaranteed.
 * Historical references could not be fetched (proxy 403); no online fact-check is
 * claimed. Dates below follow standard school-level chronology, not oral legends.
 */
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { ConfigModule } from '@nestjs/config';
import {
  CategoryStatus,
  ProductStatus,
  ProductLabel,
  ModuleStatus,
  LessonStatus,
  LessonType,
  Prisma,
  PrismaClient,
} from './generated/prisma';

class LearningSeedError extends Error {}

type QuestionSpec = {
  question: string;
  explanation: string;
  correct: string;
  wrong: [string, string, string];
};
type Reading = {
  title: string;
  objective: string;
  body: string;
  takeaway: string;
  reflection: string;
};
type Unit = {
  focus: string;
  readings: [Reading, Reading];
  quiz: QuestionSpec[];
};
type Course = {
  key: string;
  title: string;
  category: number;
  period: [number, number];
  context: string;
  outcomes: string;
  timeline: { year: number; event: string }[];
  units: [Unit, Unit, Unit];
};
function R(
  title: string,
  objective: string,
  body: string,
  takeaway: string,
  reflection: string,
): Reading {
  return { title, objective, body: body.trim(), takeaway, reflection };
}
function Q(
  question: string,
  explanation: string,
  correct: string,
  ...wrong: [string, string, string]
): QuestionSpec {
  return { question, explanation, correct, wrong };
}
export function learningId(key: string): string {
  const h = createHash('sha256')
    .update(`nestjs-lms:learning-history:v1:${key}`)
    .digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

// Verified HTTP 200, image/png, 72x72 during implementation. A neutral illustration,
// not a portrait, ancient flag, artifact or reconstruction. Twemoji CC BY 4.0.
export const THUMBNAIL =
  'https://raw.githubusercontent.com/twitter/twemoji/v14.0.2/assets/72x72/1f4dc.png';
const CREDIT =
  'Ảnh bìa: biểu tượng cuộn tư liệu Twemoji (Twitter và cộng tác viên), CC BY 4.0; không phải hiện vật hay chân dung lịch sử. Nguồn: https://github.com/twitter/twemoji/tree/v14.0.2 ; giấy phép: https://creativecommons.org/licenses/by/4.0/';

export const categories = [
  {
    key: 'gianh-doc-lap',
    title: 'Anh hùng thời Bắc thuộc và đấu tranh giành độc lập',
    short_description:
      'Từ khởi nghĩa Hai Bà Trưng đến bước ngoặt giành quyền tự chủ thế kỷ X; không coi năm 938 vẫn là thời Bắc thuộc liên tục.',
  },
  {
    key: 'bao-ve-dai-viet',
    title: 'Anh hùng thời kỳ xây dựng và bảo vệ quốc gia độc lập',
    short_description:
      'Bảo vệ Đại Việt dưới các triều Lý và Trần, qua hoạt động của Lý Thường Kiệt và Trần Quốc Tuấn.',
  },
  {
    key: 'khoi-nghia-va-bao-ve',
    title: 'Anh hùng trong các cuộc khởi nghĩa và chiến tranh bảo vệ đất nước',
    short_description:
      'Khởi nghĩa Lam Sơn thế kỷ XV và chiến thắng của Quang Trung năm 1789; tách riêng các giai đoạn, không đồng nhất hoàn cảnh.',
  },
];

export const courses: Course[] = [
  {
    key: 'hai-ba-trung',
    title: 'Hai Bà Trưng — Khởi nghĩa và tinh thần độc lập',
    category: 0,
    period: [40, 43],
    context:
      'Đầu thế kỷ I, vùng đất của người Việt nằm dưới sự cai trị của nhà Đông Hán. Chính sách thống trị và sự can thiệp vào đời sống cộng đồng gây nhiều bất bình. Năm 40, Trưng Trắc và Trưng Nhị lãnh đạo một cuộc khởi nghĩa lớn. Khi tìm hiểu, cần phân biệt sử kiện về cuộc khởi nghĩa với những câu chuyện tưởng niệm được lưu truyền về sau.',
    outcomes:
      'Xác định các mốc 40 và 43; trình bày vai trò của Hai Bà Trưng; giải thích ý nghĩa giành quyền tự chủ; phân biệt sử kiện với truyền thuyết.',
    timeline: [
      {
        year: 40,
        event:
          'Khởi nghĩa do Hai Bà Trưng lãnh đạo bùng nổ; chính quyền tự chủ được thiết lập, Trưng Trắc xưng vương.',
      },
      {
        year: 43,
        event:
          'Cuộc kháng chiến chống quân Đông Hán do Mã Viện chỉ huy thất bại.',
      },
    ],
    units: [
      {
        focus: 'Đời sống dưới ách Đông Hán và vai trò của hai người lãnh đạo.',
        readings: [
          R(
            'Giao Chỉ đầu thế kỷ I: Vì sao nổ ra khởi nghĩa?',
            'Nhận biết hoàn cảnh bị đô hộ và phân biệt nguyên nhân lâu dài với sự kiện trực tiếp.',
            `
Nhà Đông Hán tổ chức cai trị các vùng đất phía nam thông qua hệ thống quan lại. Người dân phải chịu những nghĩa vụ về tô thuế và lao dịch. Sự can thiệp của chính quyền đô hộ vào tổ chức cộng đồng làm tăng mâu thuẫn. Vì vậy, không nên giải thích cuộc khởi nghĩa chỉ bằng một chuyện riêng của gia đình người lãnh đạo.

Theo sử sách, thái thú Tô Định có hành vi cai trị hà khắc. Cái chết của Thi Sách, chồng Trưng Trắc, thường được nhắc đến như một sự kiện thúc đẩy cuộc nổi dậy. Tuy nhiên, nền tảng sâu xa vẫn là mong muốn thoát khỏi ách thống trị và khôi phục quyền làm chủ. Cần đặt động cơ cá nhân trong hoàn cảnh xã hội rộng hơn.

Khi đọc một đoạn lịch sử, em có thể lập hai cột: nguyên nhân lâu dài và sự kiện thúc đẩy. Thuế khóa, sự áp bức và nhu cầu tự chủ thuộc cột thứ nhất. Những hành động cụ thể của quan lại có thể thuộc cột thứ hai. Cách phân tích này giúp tránh kể lịch sử thành chuỗi hành động của một vài cá nhân mà bỏ quên cộng đồng.`,
            'Khởi nghĩa có cơ sở xã hội rộng; hoàn cảnh đô hộ là yếu tố giải thích quan trọng.',
            'Vì sao một sự kiện riêng khó giải thích đầy đủ sự hưởng ứng của nhiều cộng đồng?',
          ),
          R(
            'Trưng Trắc, Trưng Nhị và sự hưởng ứng của cộng đồng',
            'Nêu vai trò lãnh đạo của Hai Bà Trưng, đồng thời nhận ra đóng góp của những người tham gia.',
            `
Trưng Trắc và Trưng Nhị gắn với vùng Mê Linh. Hai Bà đứng ra tập hợp lực lượng chống chính quyền Đông Hán. Trong một xã hội có nhiều cộng đồng địa phương, khả năng liên kết và tạo lòng tin có ý nghĩa quan trọng. Một người lãnh đạo cần biến những bất bình rời rạc thành hành động có mục tiêu chung.

Sử sách ghi nhận cuộc khởi nghĩa được hưởng ứng trên phạm vi rộng. Điều này cho thấy khát vọng tự chủ không chỉ thuộc về gia đình Hai Bà. Khi tìm hiểu vai trò cá nhân, cần thấy cả những người đã tham gia, cung cấp lương thực, truyền tin và bảo vệ địa bàn. Không nên mô tả thắng lợi như kết quả của sức mạnh riêng lẻ hay yếu tố kỳ diệu.

Hai người phụ nữ giữ vị trí lãnh đạo là nét nổi bật của cuộc khởi nghĩa. Từ đó có thể bàn về khả năng tham gia đời sống chung của phụ nữ trong lịch sử. Dù vậy, không nên tự suy ra rằng mọi quan hệ xã hội thời đó giống hiện nay. Tranh tượng và lễ hội về Hai Bà là sản phẩm của những thời kỳ khác nhau; chúng giúp tìm hiểu sự tưởng nhớ, không phải ảnh chụp trực tiếp của thế kỷ I.`,
            'Vai trò lãnh đạo và sức mạnh hưởng ứng của cộng đồng cần được giải thích cùng nhau.',
            'Một bức tượng Hai Bà được dựng ngày nay cho biết điều gì, và không tự chứng minh được điều gì?',
          ),
        ],
        quiz: [
          Q(
            'Cuộc khởi nghĩa Hai Bà Trưng bùng nổ năm nào?',
            'Mốc mở đầu thường được xác định là năm 40.',
            'Năm 40',
            'Năm 43',
            'Năm 938',
            'Năm 1077',
          ),
          Q(
            'Chính quyền nào cai trị vùng Giao Chỉ trước cuộc khởi nghĩa năm 40?',
            'Bối cảnh trực tiếp là sự thống trị của nhà Đông Hán.',
            'Nhà Đông Hán',
            'Nhà Đường',
            'Nhà Tống',
            'Nhà Thanh',
          ),
          Q(
            'Cách giải thích nào đầy đủ hơn về nguyên nhân khởi nghĩa?',
            'Cần đặt sự kiện trực tiếp trong mâu thuẫn xã hội và khát vọng tự chủ.',
            'Kết hợp ách đô hộ, bất bình xã hội và sự kiện thúc đẩy',
            'Chỉ do một câu chuyện gia đình',
            'Chỉ do thời tiết thay đổi',
            'Do triều Trần phát động',
          ),
          Q(
            'Vùng đất nào gắn với Hai Bà Trưng và trung tâm chính quyền sau khởi nghĩa?',
            'Mê Linh gắn với quê hương và việc dựng chính quyền của Hai Bà.',
            'Mê Linh',
            'Phú Xuân',
            'Tây Đô',
            'Thăng Long thời Lý',
          ),
          Q(
            'Nên hiểu tượng Hai Bà dựng ở thời hiện đại như thế nào?',
            'Tượng phản ánh sự tưởng niệm; không phải tư liệu trực quan được tạo ngay trong thế kỷ I.',
            'Dấu tích của sự tưởng nhớ ở thời dựng tượng',
            'Ảnh chụp thật từ năm 40',
            'Bằng chứng mọi chi tiết truyền thuyết đều đúng',
            'Vật chứng về chiến thắng năm 1288',
          ),
        ],
      },
      {
        focus: 'Từ thắng lợi năm 40 đến cuộc kháng chiến năm 43.',
        readings: [
          R(
            'Khởi nghĩa năm 40 và việc thiết lập chính quyền',
            'Sắp xếp diễn biến chính từ nổi dậy đến giành quyền tự chủ.',
            `
Năm 40, cuộc nổi dậy do Hai Bà Trưng lãnh đạo lan rộng và giành được nhiều địa bàn. Chính quyền của Tô Định bị đánh đổ ở nơi nghĩa quân kiểm soát. Sự hưởng ứng cho thấy khả năng tập hợp lực lượng quanh mục tiêu thoát khỏi ách đô hộ. Khi học diễn biến, nên theo dõi cả hành động của người lãnh đạo lẫn mức độ tham gia của các địa phương.

Sau thắng lợi, Trưng Trắc xưng vương, đóng đô ở Mê Linh. Việc thiết lập chính quyền là bước tiến khác với chỉ đánh thắng một trận. Nó thể hiện yêu cầu tự tổ chức đời sống và quyết định công việc chung. Tuy nhiên, thời gian tồn tại ngắn và sức ép từ nhà Đông Hán đặt ra nhiều khó khăn cho chính quyền mới.

Một sơ đồ ba bước có thể giúp ghi nhớ: tập hợp lực lượng, giành thắng lợi, xây dựng quyền tự chủ. Không nên thêm vào sơ đồ những ngày tháng hoặc con số địa bàn khi chưa đối chiếu nguồn. Điều quan trọng là hiểu quan hệ giữa các bước. Nếu chỉ ghi nhớ tên một trận đánh mà không biết chính quyền mới được dựng lên, em sẽ bỏ sót ý nghĩa chính trị của cuộc khởi nghĩa.`,
            'Thắng lợi năm 40 gắn với sự ra đời của chính quyền tự chủ, không chỉ với hoạt động quân sự.',
            'Vì sao việc Trưng Trắc xưng vương thể hiện một bước phát triển sau khởi nghĩa?',
          ),
          R(
            'Cuộc kháng chiến chống quân Mã Viện',
            'Giải thích tình thế khó khăn và trình bày kết cục mà không biến truyền thuyết thành sử kiện.',
            `
Nhà Đông Hán không từ bỏ ý định khôi phục sự cai trị. Mã Viện được giao chỉ huy quân tiến đánh. Chính quyền của Hai Bà phải đối phó với một lực lượng có tổ chức và nguồn lực lớn. Tình thế đó cho thấy giành được quyền tự chủ và giữ được quyền tự chủ là hai nhiệm vụ liên quan nhưng không giống nhau.

Hai Bà cùng lực lượng khởi nghĩa tiếp tục kháng chiến. Đến năm 43, cuộc kháng chiến thất bại và nhà Đông Hán tái lập sự thống trị. Thất bại không có nghĩa là mục tiêu tự chủ không chính đáng. Khi phân tích, cần xem xét tương quan lực lượng, thời gian chuẩn bị và điều kiện tổ chức, tránh quy kết đơn giản bằng phẩm chất của một cá nhân.

Có nhiều câu chuyện dân gian về những ngày cuối cùng của Hai Bà. Các cách kể có thể khác nhau giữa địa phương và thời kỳ. Trong bài học này, kết cục được nêu ở mức sử kiện chung: cuộc kháng chiến thất bại năm 43. Một câu chuyện tưởng niệm chỉ nên được giới thiệu với tên gọi truyền thuyết nếu chưa có chứng cứ đủ chắc. Thái độ thận trọng không làm giảm lòng kính trọng mà giúp việc học lịch sử có căn cứ.`,
            'Phân biệt kết cục lịch sử của cuộc kháng chiến với các cách kể dân gian về người lãnh đạo.',
            'Tại sao tôn trọng nhân vật lịch sử vẫn cần thận trọng trước các chi tiết chưa được xác minh?',
          ),
        ],
        quiz: [
          Q(
            'Sự kiện nào diễn ra sau thắng lợi của cuộc khởi nghĩa năm 40?',
            'Trưng Trắc xưng vương và tổ chức chính quyền tự chủ.',
            'Trưng Trắc xưng vương',
            'Lê Lợi lên ngôi',
            'Nhà Nguyên được thành lập',
            'Quang Trung tiến ra Bắc',
          ),
          Q(
            'Ai chỉ huy quân Đông Hán tiến đánh chính quyền Hai Bà?',
            'Mã Viện chỉ huy cuộc tiến công của Đông Hán.',
            'Mã Viện',
            'Hoằng Tháo',
            'Thoát Hoan',
            'Tôn Sĩ Nghị',
          ),
          Q(
            'Mốc nào gắn với sự thất bại của cuộc kháng chiến của Hai Bà?',
            'Đến năm 43, cuộc kháng chiến thất bại.',
            'Năm 43',
            'Năm 40',
            'Năm 939',
            'Năm 1428',
          ),
          Q(
            'Vì sao cần phân biệt giành và giữ quyền tự chủ?',
            'Dựng chính quyền mới không tự loại bỏ nguy cơ bị tấn công trở lại.',
            'Chính quyền mới còn phải đối phó nguy cơ tái xâm lược',
            'Hai nhiệm vụ hoàn toàn không liên quan',
            'Giành thắng lợi nghĩa là không còn khó khăn',
            'Giữ quyền tự chủ chỉ cần thay tên địa phương',
          ),
          Q(
            'Cách ghi chép nào phù hợp khi gặp các chuyện khác nhau về kết cục của Hai Bà?',
            'Cần ghi rõ tính chất truyền thuyết thay vì coi một cách kể là sự thật đã chứng minh.',
            'Phân biệt sử kiện chung và truyền thuyết',
            'Gộp tất cả chi tiết thành sự thật chắc chắn',
            'Tự thêm ngày tháng để câu chuyện hấp dẫn',
            'Bỏ qua mọi sử liệu và chỉ chọn chuyện hay nhất',
          ),
        ],
      },
      {
        focus: 'Ý nghĩa cuộc khởi nghĩa và cách học từ ký ức lịch sử.',
        readings: [
          R(
            'Ý nghĩa của một chính quyền tồn tại ngắn',
            'Giải thích vì sao một phong trào thất bại về quân sự vẫn có ý nghĩa lịch sử.',
            `
Chính quyền do Hai Bà Trưng xây dựng chỉ tồn tại trong thời gian ngắn. Tuy vậy, việc đánh đổ sự cai trị của quan lại Đông Hán và tự dựng chính quyền là một dấu mốc quan trọng. Nó cho thấy cư dân tại chỗ có khả năng tập hợp lực lượng và thể hiện mong muốn tự quyết định vận mệnh của mình.

Trong tiến trình đấu tranh thời Bắc thuộc, cuộc khởi nghĩa là một biểu hiện sớm và nổi bật của ý chí tự chủ. Không nên hiểu rằng sau năm 43 các phong trào đều giống nhau hoặc do Hai Bà trực tiếp tổ chức. Mỗi cuộc đấu tranh về sau có hoàn cảnh và người lãnh đạo riêng. Điều có thể so sánh là nhu cầu chống áp bức và xây dựng quyền làm chủ.

Khi đánh giá một sự kiện, em nên phân biệt kết quả trước mắt với ý nghĩa lâu dài. Trước mắt, cuộc kháng chiến thất bại và ách đô hộ được tái lập. Lâu dài, hình ảnh Hai Bà trở thành một nguồn tưởng nhớ về tinh thần độc lập và vai trò của phụ nữ. Hai nhận định này không mâu thuẫn: một nhận định nói về kết cục chính trị, nhận định kia nói về vị trí của sự kiện trong lịch sử và ký ức cộng đồng.`,
            'Kết quả trước mắt và ý nghĩa lâu dài là hai tiêu chí khác nhau khi đánh giá một sự kiện.',
            'Hãy viết hai câu riêng: một câu về kết cục năm 43, một câu về ý nghĩa của cuộc khởi nghĩa.',
          ),
          R(
            'Đọc sử liệu, di tích và truyền thuyết về Hai Bà',
            'Thực hành nhận diện loại tư liệu và xây dựng lời giới thiệu có căn cứ.',
            `
Một chủ đề lịch sử có thể được tìm hiểu qua sách sử, công trình nghiên cứu, di tích và truyện kể. Các nguồn này không trả lời cùng một loại câu hỏi. Sách sử giúp xác định diễn biến được ghi chép; di tích cho thấy hoạt động thờ phụng và bảo tồn; truyện kể phản ánh cách cộng đồng hình dung, giải thích và ghi nhớ quá khứ.

Khi đọc thông tin về một ngôi đền thờ Hai Bà, cần hỏi ngôi đền được dựng hoặc tu sửa khi nào. Không thể tự coi toàn bộ kiến trúc hiện nay là công trình có từ năm 40. Tương tự, một câu chuyện kể lại nhiều đời có giá trị văn hóa nhưng cần đối chiếu thêm nếu dùng để xác nhận chi tiết quân sự hay lời nói của nhân vật.

Em có thể thực hiện bài tập nhỏ: lập bảng gồm thông tin, loại nguồn và điều còn chưa chắc chắn. Với mốc khởi nghĩa năm 40, ghi đây là mốc lịch sử phổ biến trong sách học. Với một chi tiết kỳ lạ trong truyện dân gian, ghi rõ đó là truyền thuyết. Kết thúc bảng bằng một đoạn giới thiệu ngắn, vừa thể hiện sự trân trọng vừa tránh những lời khẳng định vượt quá chứng cứ.`,
            'Trân trọng di sản đi cùng việc nhận diện nguồn và giới hạn của chứng cứ.',
            'Nếu hai nguồn kể khác nhau, em sẽ ghi chú thế nào trước khi dùng thông tin trong bài thuyết trình?',
          ),
        ],
        quiz: [
          Q(
            'Nhận định nào phân biệt đúng kết quả và ý nghĩa của cuộc khởi nghĩa?',
            'Thất bại năm 43 không phủ nhận ý nghĩa biểu hiện khát vọng tự chủ.',
            'Thất bại về quân sự nhưng vẫn có ý nghĩa về tinh thần tự chủ',
            'Thất bại nên không còn giá trị tìm hiểu',
            'Thắng lợi và kết cục đều diễn ra năm 1789',
            'Thành lập ngay một quốc gia hiện đại với biên giới ngày nay',
          ),
          Q(
            'Điểm nổi bật nào về người lãnh đạo cuộc khởi nghĩa?',
            'Hai người phụ nữ lãnh đạo phong trào là đặc điểm nổi bật.',
            'Hai phụ nữ giữ vai trò lãnh đạo',
            'Một hoàng đế nhà Thanh lãnh đạo',
            'Một tướng nhà Nguyên lãnh đạo',
            'Một quan nhà Minh lãnh đạo',
          ),
          Q(
            'Một ngôi đền thờ Hai Bà được tu sửa hiện nay tự nó chứng minh điều gì rõ nhất?',
            'Công trình thể hiện sự tưởng niệm, còn niên đại từng bộ phận phải khảo sát riêng.',
            'Sự tưởng niệm và bảo tồn ở những thời kỳ liên quan',
            'Mọi kiến trúc đều được xây năm 40',
            'Tất cả lời thoại trong truyện đều xác thực',
            'Chính quyền Hai Bà còn tồn tại liên tục đến hiện nay',
          ),
          Q(
            'Thứ tự nào đúng?',
            'Khởi nghĩa năm 40, dựng chính quyền rồi kháng chiến thất bại năm 43.',
            'Khởi nghĩa → chính quyền tự chủ → thất bại năm 43',
            'Thất bại năm 43 → khởi nghĩa năm 40',
            'Nhà Lý thành lập → khởi nghĩa Hai Bà',
            'Bạch Đằng 938 → khởi nghĩa năm 40',
          ),
          Q(
            'Bài giới thiệu lịch sử đáng tin cậy nên làm gì?',
            'Cần nói rõ nguồn và phân biệt mức độ chắc chắn của thông tin.',
            'Phân biệt thông tin đã ghi nhận và chi tiết truyền thuyết',
            'Thêm lời nói chưa có nguồn của nhân vật',
            'Luôn chọn câu chuyện kịch tính nhất',
            'Không cần nêu niên đại hay bối cảnh',
          ),
        ],
      },
    ],
  },
  {
    key: 'ngo-quyen',
    title: 'Ngô Quyền — Chiến thắng Bạch Đằng năm 938',
    category: 0,
    period: [938, 939],
    context:
      'Đầu thế kỷ X, người Việt từng bước khôi phục quyền tự chủ qua hoạt động của họ Khúc và Dương Đình Nghệ. Năm 937, Kiều Công Tiễn giết Dương Đình Nghệ rồi cầu cứu Nam Hán. Ngô Quyền xử lý mối nguy bên trong và chuẩn bị chống quân xâm lược. Chiến thắng năm 938 và việc xưng vương năm 939 cần được hiểu như hai mốc liên hệ chặt chẽ.',
    outcomes:
      'Đặt Bạch Đằng 938 trong tiến trình tự chủ; giải thích sự phối hợp địa hình, thủy triều và lực lượng; phân biệt chiến thắng 938 với việc xưng vương 939.',
    timeline: [
      {
        year: 938,
        event: 'Ngô Quyền đánh bại quân Nam Hán trên sông Bạch Đằng.',
      },
      {
        year: 939,
        event: 'Ngô Quyền xưng vương, chọn Cổ Loa làm nơi đóng đô.',
      },
    ],
    units: [
      {
        focus: 'Tiến trình tự chủ đầu thế kỷ X và nguy cơ Nam Hán.',
        readings: [
          R(
            'Từ họ Khúc đến nguy cơ xâm lược năm 938',
            'Nhận ra sự chuẩn bị của các thế hệ trước chiến thắng Bạch Đằng.',
            `
Không nên kể lịch sử giành độc lập như một sự kiện đột ngột xuất hiện năm 938. Đầu thế kỷ X, họ Khúc đã giành và củng cố quyền tự chủ trong hoàn cảnh chính quyền phương bắc suy yếu. Dương Đình Nghệ tiếp tục bảo vệ thành quả đó. Những hoạt động này tạo nền tảng chính trị và lực lượng cho bước phát triển tiếp theo.

Năm 937, Kiều Công Tiễn giết Dương Đình Nghệ để chiếm quyền. Khi bị Ngô Quyền tiến đánh, Kiều Công Tiễn cầu cứu Nam Hán. Hành động này mở đường cho nguy cơ can thiệp từ bên ngoài. Cần phân biệt mâu thuẫn nội bộ với cuộc xâm lược, đồng thời hiểu rằng hai việc có thể tác động và làm tình thế nguy hiểm hơn.

Để học tốt giai đoạn này, em có thể vẽ một chuỗi liên hệ: xây dựng quyền tự chủ, xuất hiện biến động nội bộ, đối phó nguy cơ Nam Hán. Mỗi mắt xích giúp giải thích mắt xích sau, nhưng không phải kết quả đã được định sẵn. Quyết định của người lãnh đạo và sự tham gia của dân chúng vẫn có vai trò. Cách nhìn theo tiến trình giúp ghi nhận đóng góp của nhiều thế hệ.`,
            'Bạch Đằng 938 là bước ngoặt trên nền tiến trình khôi phục quyền tự chủ đã diễn ra trước đó.',
            'Nếu bỏ qua họ Khúc và Dương Đình Nghệ, cách giải thích chiến thắng năm 938 sẽ thiếu điều gì?',
          ),
          R(
            'Ngô Quyền và nhiệm vụ tổ chức kháng chiến',
            'Giải thích sự kết hợp giữa giải quyết nguy cơ trong nước và chuẩn bị chống ngoại xâm.',
            `
Ngô Quyền là một người có vai trò quan trọng trong lực lượng gắn với Dương Đình Nghệ. Trước hành động của Kiều Công Tiễn, ông tiến quân giải quyết mối nguy bên trong. Tuy nhiên, nhiệm vụ không dừng ở đó. Quân Nam Hán đã có kế hoạch tiến sang, nên việc chuẩn bị chống xâm lược phải được tiến hành khẩn trương.

Một người chỉ huy cần nhận biết hướng tiến quân có thể xảy ra và khả năng của lực lượng mình. Ngô Quyền lựa chọn khu vực sông Bạch Đằng để bố trí trận địa. Đây là môi trường sông nước có thủy triều, nơi hiểu biết địa phương có thể giúp bù đắp bất lợi về phương tiện hoặc quân số. Địa hình chỉ trở thành lợi thế khi được con người khảo sát và tổ chức sử dụng phù hợp.

Hình ảnh người anh hùng không nên tách khỏi công sức của cộng đồng. Chuẩn bị trận địa cần người cung cấp vật liệu, vận chuyển, giữ bí mật và nắm quy luật con nước. Sử liệu không ghi đầy đủ tên từng người, nhưng điều đó không có nghĩa họ không góp phần. Khi kể lại chiến thắng, hãy giải thích cả quyết định của Ngô Quyền và những điều kiện giúp quyết định ấy thực hiện được.`,
            'Vai trò của Ngô Quyền thể hiện qua đánh giá tình thế và tổ chức sức mạnh chung.',
            'Vì sao biết địa hình chưa đủ, mà còn phải tổ chức lực lượng và chọn thời điểm?',
          ),
        ],
        quiz: [
          Q(
            'Ai tiếp tục bảo vệ quyền tự chủ trước biến động năm 937?',
            'Dương Đình Nghệ là nhân vật quan trọng trong giai đoạn trước Ngô Quyền.',
            'Dương Đình Nghệ',
            'Tôn Sĩ Nghị',
            'Mã Viện',
            'Vương Thông',
          ),
          Q(
            'Ai cầu cứu Nam Hán sau khi chiếm quyền?',
            'Kiều Công Tiễn cầu cứu Nam Hán khi bị Ngô Quyền tiến đánh.',
            'Kiều Công Tiễn',
            'Trưng Nhị',
            'Lý Thường Kiệt',
            'Nguyễn Trãi',
          ),
          Q(
            'Vì sao cần học hoạt động của họ Khúc trước Bạch Đằng 938?',
            'Các hoạt động tự chủ trước đó là nền tảng để hiểu bước ngoặt năm 938.',
            'Để thấy tiến trình chuẩn bị và khôi phục quyền tự chủ',
            'Vì họ Khúc lãnh đạo trận Đống Đa',
            'Vì năm 938 là lần đầu cư dân biết đến tự chủ',
            'Để bỏ qua vai trò của Ngô Quyền',
          ),
          Q(
            'Đối phương của Ngô Quyền trong trận Bạch Đằng 938 là quân nào?',
            'Cuộc kháng chiến năm 938 chống quân Nam Hán.',
            'Nam Hán',
            'Đông Hán',
            'Nguyên',
            'Thanh',
          ),
          Q(
            'Nhận định nào đúng về việc sử dụng địa hình?',
            'Cần tổ chức lực lượng và chọn thời điểm để biến điều kiện tự nhiên thành lợi thế.',
            'Địa hình cần được khai thác bằng kế hoạch và tổ chức',
            'Chỉ có con sông là tự tạo ra chiến thắng',
            'Hiểu con nước không có giá trị',
            'Không cần chuẩn bị trận địa',
          ),
        ],
      },
      {
        focus: 'Trận địa cọc và sự phối hợp với thủy triều năm 938.',
        readings: [
          R(
            'Trận Bạch Đằng năm 938 diễn ra như thế nào?',
            'Mô tả trình tự khái quát của trận đánh và vai trò của con nước.',
            `
Ngô Quyền cho chuẩn bị trận địa cọc trên sông và bố trí lực lượng. Khi nước lên, những bãi cọc khó nhận biết hơn. Nghĩa quân dùng lực lượng cơ động để dẫn đối phương vào khu vực đã chuẩn bị. Điều quan trọng không phải chỉ là có cọc, mà là kết hợp vật cản với thời điểm và hướng vận động của thuyền.

Khi thủy triều rút, quân Nam Hán gặp khó khăn trong việc di chuyển và rút lui. Lực lượng của Ngô Quyền phản công, khiến quân xâm lược thất bại. Hoằng Tháo, người chỉ huy cánh quân tiến vào sông, bị giết. Vua Nam Hán phải từ bỏ cuộc tiến công. Trong bài học, chỉ nêu trình tự khái quát thay vì tự thêm giờ nước lên hoặc số lượng cọc chưa được kiểm chứng.

Em hãy thử vẽ sơ đồ với ba nhãn: chuẩn bị, dẫn vào trận địa, phản công đúng lúc. Dùng mũi tên chỉ mối quan hệ giữa các bước. Nếu đảo bước phản công trước khi đối phương vào khu vực đã bố trí, kế hoạch sẽ mất tính hợp lý. Cách dựng sơ đồ giúp hiểu chiến thuật như một sự phối hợp, thay vì ghi nhớ bãi cọc như một vật có sức mạnh riêng.`,
            'Thắng lợi gắn với sự phối hợp trận địa, lực lượng và quy luật thủy triều.',
            'Nếu không giữ đúng thời điểm phản công, hiệu quả của trận địa cọc có thể thay đổi ra sao?',
          ),
          R(
            'Từ chiến thuật sông nước đến bài học về tổ chức',
            'Phân tích nguyên nhân thắng lợi mà không đơn giản hóa thành một mẹo quân sự.',
            `
Một trận địa tốt vẫn cần được giữ bí mật và sử dụng đúng kế hoạch. Người chuẩn bị phải hiểu lòng sông, luồng đi của thuyền và sự thay đổi của mực nước. Người tham chiến phải phối hợp để dẫn đối phương và phản công. Những công việc này cho thấy tri thức địa phương và kỷ luật tổ chức có ý nghĩa rất lớn.

Quân Nam Hán sử dụng đường thủy để tiến vào. Ngô Quyền không đối phó theo cách hoàn toàn do đối phương lựa chọn mà chủ động tạo điều kiện thuận lợi cho mình. Đây là biểu hiện của tư duy chiến lược: xác định mục tiêu bảo vệ quyền tự chủ, lựa chọn không gian có lợi rồi tổ chức hành động. Không nên biến bài học lịch sử thành lời khuyên áp dụng máy móc trong mọi hoàn cảnh.

Bạch Đằng cũng gắn với một chiến thắng lớn năm 1288, nhưng đó là một cuộc kháng chiến khác do nhà Trần tổ chức. Hai trận có thể được so sánh về khai thác địa hình sông nước, song không được trộn người chỉ huy, đối phương hay niên đại. Khi lập bảng so sánh, hãy dành cột riêng cho năm, lực lượng và bối cảnh trước khi bàn về nét tương đồng chiến thuật.`,
            'Cùng một địa danh có thể gắn với nhiều sự kiện; so sánh không có nghĩa là đồng nhất.',
            'Lập ba điểm giúp phân biệt Bạch Đằng 938 với Bạch Đằng 1288.',
          ),
        ],
        quiz: [
          Q(
            'Mốc nào gắn với chiến thắng của Ngô Quyền trên sông Bạch Đằng?',
            'Trận đánh chống Nam Hán diễn ra năm 938.',
            '938',
            '939',
            '1288',
            '1789',
          ),
          Q(
            'Thủy triều có vai trò gì trong kế hoạch?',
            'Mực nước thay đổi ảnh hưởng việc che giấu cọc và khả năng cơ động của thuyền.',
            'Tạo điều kiện để phối hợp vật cản và phản công',
            'Không liên quan đến trận đánh',
            'Thay thế hoàn toàn lực lượng chiến đấu',
            'Làm mọi con thuyền luôn di chuyển như nhau',
          ),
          Q(
            'Ai chỉ huy cánh quân Nam Hán bị đánh bại năm 938?',
            'Hoằng Tháo chỉ huy cánh quân tiến vào Bạch Đằng.',
            'Hoằng Tháo',
            'Mã Viện',
            'Ô Mã Nhi',
            'Liễu Thăng',
          ),
          Q(
            'Trình tự khái quát nào phù hợp?',
            'Chuẩn bị trận địa rồi dẫn đối phương vào và phản công khi có điều kiện.',
            'Chuẩn bị → dẫn đối phương vào → phản công',
            'Phản công → mới lựa chọn con sông → mới chuẩn bị',
            'Xưng vương năm 939 → đánh trận năm 938',
            'Đánh quân Thanh → đóng cọc chống Nam Hán',
          ),
          Q(
            'Vì sao không được gộp Bạch Đằng 938 và 1288 thành một trận?',
            'Hai trận có bối cảnh, người chỉ huy và đối phương khác nhau.',
            'Đó là hai sự kiện khác thời kỳ',
            'Hai niên đại chỉ là hai cách viết cùng một năm',
            'Cả hai đều do Quang Trung chỉ huy',
            'Cả hai đều chống quân Đông Hán',
          ),
        ],
      },
      {
        focus: 'Bước ngoặt năm 938 và việc xây dựng chính quyền năm 939.',
        readings: [
          R(
            'Từ chiến thắng quân sự đến nền độc lập',
            'Phân biệt kết quả trận đánh và ý nghĩa mở ra một giai đoạn lịch sử mới.',
            `
Chiến thắng Bạch Đằng đánh bại cuộc xâm lược của Nam Hán và bảo vệ thành quả tự chủ. Trong tiến trình lịch sử Việt Nam, đây là bước ngoặt lớn, đánh dấu việc chấm dứt về cơ bản thời kỳ Bắc thuộc và mở ra thời kỳ độc lập lâu dài. Cách diễn đạt này nói về xu hướng phát triển, không có nghĩa đất nước từ đó không gặp thêm thử thách.

Năm 939, Ngô Quyền xưng vương và chọn Cổ Loa làm nơi đóng đô. Việc tổ chức chính quyền thể hiện nỗ lực chuyển thắng lợi quân sự thành trật tự chính trị mới. Do đó, cần ghi nhớ riêng hai mốc: 938 gắn với trận đánh, 939 gắn với việc xưng vương. Nhầm lẫn hai mốc sẽ làm mất quan hệ giữa bảo vệ và xây dựng quyền tự chủ.

Một bài giải thích ngắn nên có đủ ba phần: nguy cơ xâm lược, cách đối phó, bước phát triển sau chiến thắng. Sau khi viết, em kiểm tra xem phần ý nghĩa có được chứng minh bằng sự kiện hay chỉ là lời khen. Học lịch sử có căn cứ không đòi hỏi dùng từ ngữ thật lớn; quan trọng hơn là chỉ ra vì sao một thắng lợi tạo điều kiện cho sự thay đổi về chính trị.`,
            '938 và 939 là hai mốc khác nhau trong quá trình bảo vệ và xây dựng nền độc lập.',
            'Vì sao xưng vương và tổ chức chính quyền là bước tiếp theo quan trọng sau một chiến thắng?',
          ),
          R(
            'Ôn tập bằng bản đồ và trục thời gian',
            'Tổng hợp kiến thức, phát hiện nhầm lẫn về địa danh và niên đại.',
            `
Trục thời gian giúp thấy thứ tự, còn bản đồ giúp hình dung không gian. Với Ngô Quyền, trục thời gian nên có biến động năm 937, chiến thắng năm 938 và việc xưng vương năm 939. Bản đồ có thể đánh dấu vùng Bạch Đằng và Cổ Loa. Không cần tự vẽ ranh giới chính trị chính xác nếu chưa có nguồn phù hợp.

Khi tìm hiểu địa điểm di tích ngày nay, em cần phân biệt địa danh hiện tại với không gian lịch sử. Dòng chảy và cảnh quan có thể biến đổi theo thời gian. Một bãi cọc được phát hiện phải được nghiên cứu niên đại trước khi gắn chắc chắn với một trận đánh. Bài học này không gán mọi bãi cọc ở vùng Bạch Đằng cho riêng năm 938.

Để tự kiểm tra, hãy giải thích cho bạn nghe mà không nhìn sách trong một phút. Nếu em nói Ngô Quyền đánh quân Nguyên hay xưng vương năm 938, hãy quay lại bảng đối chiếu để sửa. Sửa nhầm lẫn là một phần của học tập. Điều cần giữ lại không chỉ là mốc số, mà còn là khả năng nối hoàn cảnh, tổ chức kháng chiến và bước chuyển sang thời kỳ độc lập.`,
            'Kết hợp thời gian, không gian và đối chiếu nguồn giúp tránh học thuộc sai.',
            'Một hiện vật tìm thấy ở Bạch Đằng cần thêm thông tin gì trước khi gắn với năm 938?',
          ),
        ],
        quiz: [
          Q(
            'Ngô Quyền xưng vương vào năm nào?',
            'Việc xưng vương diễn ra năm 939, sau chiến thắng năm 938.',
            '939',
            '938',
            '40',
            '1428',
          ),
          Q(
            'Ngô Quyền chọn nơi nào làm nơi đóng đô?',
            'Cổ Loa là nơi Ngô Quyền chọn sau khi xưng vương.',
            'Cổ Loa',
            'Mê Linh thời Hai Bà',
            'Phú Xuân thời Tây Sơn',
            'Lam Sơn',
          ),
          Q(
            'Ý nghĩa khái quát nào phù hợp với Bạch Đằng 938?',
            'Chiến thắng là bước ngoặt chấm dứt về cơ bản thời kỳ Bắc thuộc.',
            'Mở ra thời kỳ độc lập lâu dài',
            'Mở đầu sự cai trị của nhà Thanh',
            'Thành lập triều Lê sơ',
            'Kết thúc cuộc kháng chiến chống Tống thời Lý',
          ),
          Q(
            'Bảng phân biệt sự kiện nào đúng?',
            'Cần tách trận đánh năm 938 và việc xưng vương năm 939.',
            '938: chiến thắng; 939: xưng vương',
            '938: xưng vương; 939: chiến thắng Bạch Đằng',
            '938: khởi nghĩa Lam Sơn; 939: Đông Quan',
            '938: Đống Đa; 939: Ngọc Hồi',
          ),
          Q(
            'Có thể gắn mọi bãi cọc ở vùng Bạch Đằng với năm 938 không?',
            'Hiện vật phải được nghiên cứu niên đại và bối cảnh trước khi gắn với một sự kiện.',
            'Không, cần xác định niên đại và bối cảnh',
            'Có, chỉ cần cùng tên con sông',
            'Có, không cần khảo cổ học',
            'Không cần xem hiện vật vì địa danh đã đủ',
          ),
        ],
      },
    ],
  },
  {
    key: 'ly-thuong-kiet',
    title: 'Lý Thường Kiệt — Bảo vệ Đại Việt thời Lý',
    category: 1,
    period: [1075, 1077],
    context:
      'Thế kỷ XI, Đại Việt dưới triều Lý là một quốc gia độc lập. Quan hệ với nhà Tống có cả giao thiệp lẫn căng thẳng. Khi nguy cơ chiến tranh gia tăng, triều Lý tổ chức chuẩn bị và bảo vệ đất nước. Lý Thường Kiệt là người chỉ huy quan trọng trong cuộc kháng chiến giai đoạn 1075–1077; hoạt động của ông cần được đặt trong nỗ lực chung của triều đình và nhân dân.',
    outcomes:
      'Nhận biết Đại Việt thời Lý; sắp xếp các mốc 1075–1077; giải thích sự chủ động và phòng thủ Như Nguyệt; thận trọng với việc gán tác giả Nam quốc sơn hà.',
    timeline: [
      {
        year: 1075,
        event:
          'Quân Đại Việt tiến công các căn cứ chuẩn bị chiến tranh của Tống.',
      },
      {
        year: 1076,
        event:
          'Quân Đại Việt rút về; quân Tống tiến sang, cuộc kháng chiến chuyển sang bảo vệ lãnh thổ.',
      },
      {
        year: 1077,
        event:
          'Kháng chiến trên phòng tuyến Như Nguyệt; chiến tranh được kết thúc bằng thương lượng.',
      },
    ],
    units: [
      {
        focus: 'Đại Việt thời Lý và nhiệm vụ bảo vệ quốc gia độc lập.',
        readings: [
          R(
            'Đại Việt và quan hệ với nhà Tống',
            'Đặt cuộc kháng chiến trong quan hệ giữa hai quốc gia, không xem chiến tranh là trạng thái thường xuyên.',
            `
Dưới triều Lý, Đại Việt xây dựng bộ máy cai trị và củng cố đời sống kinh tế. Một quốc gia độc lập phải vừa tổ chức công việc bên trong vừa xử lý quan hệ với các nước xung quanh. Quan hệ Đại Việt với Tống không chỉ gồm chiến tranh. Giao thiệp, trao đổi và thương lượng cũng là những mặt quan trọng cần được ghi nhận.

Trong thập niên 1070, nguy cơ chiến tranh tăng lên khi nhà Tống chuẩn bị lực lượng ở khu vực biên giới. Triều Lý phải đánh giá tình hình và lựa chọn cách đối phó. Bối cảnh này giúp giải thích vì sao có những hành động quân sự chủ động trước khi đối phương tiến sâu vào lãnh thổ. Không nên tách một cuộc tiến công khỏi quá trình chuẩn bị và mục tiêu chính trị của các bên.

Khi học về quan hệ giữa các quốc gia, em cần tránh lấy một cuộc chiến thời trung đại để đánh giá toàn bộ người dân của một nước ở mọi thời kỳ. Đối tượng phân tích ở đây là các chính quyền và quyết định lịch sử cụ thể. Bài học hướng đến hiểu nguyên nhân, cách tổ chức bảo vệ đất nước và con đường kết thúc xung đột, không khuyến khích thái độ đối địch với con người ngày nay.`,
            'Bảo vệ độc lập gắn với cả chuẩn bị quân sự và xử lý quan hệ đối ngoại.',
            'Vì sao cần phân biệt quyết định của một triều đình trong quá khứ với người dân của quốc gia đó hiện nay?',
          ),
          R(
            'Lý Thường Kiệt trong công cuộc giữ nước',
            'Nêu vai trò của người chỉ huy trong hệ thống tổ chức của triều Lý.',
            `
Lý Thường Kiệt là danh tướng có vai trò quan trọng trong tổ chức cuộc kháng chiến chống Tống. Khi tìm hiểu nhân vật, cần chú ý đến những quyết định có thể giải thích bằng hoàn cảnh và mục tiêu. Sự chủ động, khả năng phối hợp lực lượng và việc lựa chọn phòng tuyến là những điểm thích hợp để phân tích.

Một cuộc kháng chiến không chỉ có hoạt động của một vị tướng. Triều đình phải huy động nguồn lực, các địa phương chuẩn bị lương thực và lực lượng tham chiến giữ kỷ luật. Những người dân ở vùng sông nước góp phần tạo điều kiện phòng thủ. Vì thế, nói về vai trò của Lý Thường Kiệt không đồng nghĩa với bỏ qua đóng góp của vua Lý, các tướng khác và cộng đồng.

Học sinh có thể lập bảng gồm quyết định, điều kiện và mục tiêu. Ví dụ, việc xây dựng phòng tuyến cần lựa chọn địa điểm có lợi và chuẩn bị lực lượng để ngăn địch tiến sâu. Bảng này giúp chuyển từ lời khen chung sang giải thích cụ thể. Những nhận xét như tài giỏi hay yêu nước cần được minh họa bằng hành động có căn cứ, thay vì bằng lời thoại hay câu chuyện được thêm vào cho sinh động.`,
            'Đánh giá người lãnh đạo cần gắn quyết định cụ thể với điều kiện tổ chức và mục tiêu giữ nước.',
            'Chọn một quyết định của Lý Thường Kiệt và nêu điều kiện cần để thực hiện quyết định đó.',
          ),
        ],
        quiz: [
          Q(
            'Lý Thường Kiệt hoạt động nổi bật dưới triều đại nào?',
            'Ông là danh tướng thời Lý.',
            'Triều Lý',
            'Triều Trần',
            'Triều Lê sơ',
            'Triều Tây Sơn',
          ),
          Q(
            'Cuộc kháng chiến giai đoạn 1075–1077 đối phó chính quyền nào?',
            'Đối phương là nhà Tống.',
            'Nhà Tống',
            'Nhà Đông Hán',
            'Nhà Nguyên',
            'Nhà Thanh',
          ),
          Q(
            'Quan hệ Đại Việt và Tống nên được nhìn nhận thế nào?',
            'Bên cạnh xung đột còn có giao thiệp và thương lượng.',
            'Có cả giao thiệp và căng thẳng, không chỉ chiến tranh',
            'Chỉ có chiến tranh liên tục trong mọi năm',
            'Không có bất kỳ tiếp xúc nào',
            'Là quan hệ giữa hai thành phố của một nước',
          ),
          Q(
            'Cách đánh giá nào có căn cứ hơn về vai trò Lý Thường Kiệt?',
            'Phải giải thích hành động trong bối cảnh và điều kiện cụ thể.',
            'Dựa vào quyết định tổ chức kháng chiến và điều kiện thực hiện',
            'Dựa vào lời thoại tự sáng tác',
            'Chỉ lặp lại từ ngữ khen ngợi',
            'Bỏ qua mọi đóng góp của cộng đồng',
          ),
          Q(
            'Vì sao không nên quy một cuộc kháng chiến cho riêng một người?',
            'Huy động lực lượng và nguồn lực là công việc của nhiều chủ thể.',
            'Có đóng góp của triều đình, quân đội và nhân dân',
            'Vì người chỉ huy hoàn toàn không có vai trò',
            'Vì mọi người chỉ chiến đấu một mình',
            'Vì hậu cần không liên quan đến chiến tranh',
          ),
        ],
      },
      {
        focus: 'Chủ động tiến công và phòng tuyến Như Nguyệt.',
        readings: [
          R(
            'Sự chủ động trong giai đoạn 1075–1076',
            'Giải thích mục tiêu của cuộc tiến công trước khi chuyển sang phòng thủ.',
            `
Năm 1075, quân Đại Việt chủ động tiến công một số căn cứ mà nhà Tống dùng để chuẩn bị chiến tranh. Hoạt động này thường được giải thích bằng tư tưởng tiến công để tự vệ: phá sự chuẩn bị của đối phương, giảm áp lực của cuộc xâm lược có thể xảy ra. Mục tiêu ấy khác với việc chiếm đóng lâu dài lãnh thổ của nước khác.

Sau khi đạt những mục tiêu quân sự, quân Đại Việt rút về trong năm 1076 để chuẩn bị phòng thủ. Hai bước tiến công và rút quân cần được học trong cùng một kế hoạch. Nếu chỉ kể một chiều rằng có tiến quân rồi dừng lại, em sẽ khó hiểu vì sao việc chuẩn bị phòng tuyến trong nước lại cần thiết ngay sau đó.

Khi trình bày, có thể dùng sơ đồ nguy cơ, chủ động phá chuẩn bị, rút về phòng thủ. Đây là cách giải thích quan hệ mục tiêu và hành động trong một hoàn cảnh lịch sử cụ thể. Không nên coi khái niệm tiến công để tự vệ là lý do có thể áp dụng tùy tiện cho mọi cuộc chiến. Muốn đánh giá một sự kiện khác, vẫn phải xem chứng cứ về bối cảnh, giới hạn hành động và mục tiêu thực tế của sự kiện ấy.`,
            'Hoạt động 1075–1076 cần được hiểu trong kế hoạch chủ động bảo vệ Đại Việt.',
            'Việc rút quân về chuẩn bị phòng thủ giúp em hiểu gì về mục tiêu của chiến dịch?',
          ),
          R(
            'Phòng tuyến Như Nguyệt và kết thúc chiến tranh',
            'Nhận biết vai trò của phòng tuyến và sự kết hợp đấu tranh quân sự với thương lượng.',
            `
Khi quân Tống tiến sang, triều Lý tổ chức phòng thủ trên tuyến sông Như Nguyệt, thuộc hệ thống sông Cầu ngày nay. Phòng tuyến giúp ngăn đường tiến quân và tạo điều kiện cho lực lượng Đại Việt giữ thế chủ động. Một con sông tự nó không thể bảo vệ đất nước; hiệu quả đến từ sự chuẩn bị, bố trí quân và phối hợp chiến đấu.

Năm 1077, cuộc kháng chiến diễn ra quyết liệt ở khu vực này. Quân Đại Việt chống trả và phản công, trong khi đối phương gặp khó khăn kéo dài. Sau đó, chiến tranh được kết thúc bằng thương lượng và quân Tống rút về. Kết thúc xung đột không nhất thiết chỉ có một trận đánh cuối cùng; giải pháp ngoại giao có thể góp phần bảo vệ thành quả và hạn chế tổn thất.

Bài Nam quốc sơn hà thường được gắn với truyền thống kể về cuộc kháng chiến. Tuy nhiên, việc xác định chính xác tác giả và hoàn cảnh xuất hiện có những vấn đề cần nghiên cứu. Trong bài học này, không coi Lý Thường Kiệt là tác giả đã được xác nhận chắc chắn. Em có thể tìm hiểu ý thức về chủ quyền trong tác phẩm, đồng thời nói rõ giới hạn của thông tin về tác giả.`,
            'Phòng thủ, phản công và thương lượng cùng góp phần vào kết quả giữ nước.',
            'Vì sao việc kết thúc chiến tranh bằng thương lượng không tự có nghĩa là từ bỏ mục tiêu bảo vệ độc lập?',
          ),
        ],
        quiz: [
          Q(
            'Cuộc tiến công chủ động của Đại Việt bắt đầu năm nào?',
            'Mốc bắt đầu là năm 1075.',
            '1075',
            '1077',
            '1285',
            '1427',
          ),
          Q(
            'Vì sao quân Đại Việt rút về sau giai đoạn tiến công?',
            'Rút về để tổ chức bảo vệ lãnh thổ là bước trong kế hoạch kháng chiến.',
            'Để chuẩn bị phòng thủ trong nước',
            'Để đóng đô lâu dài ở đất Tống',
            'Để kết thúc triều Lý ngay lập tức',
            'Để tham gia khởi nghĩa Lam Sơn',
          ),
          Q(
            'Phòng tuyến nào gắn với cuộc kháng chiến năm 1077?',
            'Như Nguyệt là phòng tuyến sông quan trọng.',
            'Như Nguyệt',
            'Chi Lăng',
            'Ngọc Hồi',
            'Mê Linh',
          ),
          Q(
            'Chiến tranh được kết thúc bằng cách kết hợp nào?',
            'Đại Việt vừa đấu tranh quân sự vừa thương lượng để quân Tống rút.',
            'Kháng chiến quân sự và thương lượng',
            'Chỉ thay đổi tên quốc gia',
            'Bỏ toàn bộ phòng tuyến mà không kháng cự',
            'Nhờ một trận đánh của nhà Trần năm 1288',
          ),
          Q(
            'Cách nêu tác giả Nam quốc sơn hà nào thận trọng hơn?',
            'Tác giả và hoàn cảnh xuất hiện không được bài học xem là đã xác nhận tuyệt đối.',
            'Không khẳng định chắc chắn tác giả khi còn vấn đề nghiên cứu',
            'Khẳng định tác giả chỉ dựa vào truyền miệng',
            'Tự đặt một tác giả không có nguồn',
            'Khẳng định đó là văn bản do Lê Lợi viết năm 1789',
          ),
        ],
      },
      {
        focus: 'Ý nghĩa giữ nước và cách dùng khái niệm chủ quyền.',
        readings: [
          R(
            'Bảo vệ độc lập và giảm tổn thất chiến tranh',
            'Phân tích ý nghĩa của cuộc kháng chiến từ kết quả và cách kết thúc.',
            `
Cuộc kháng chiến chống Tống thời Lý góp phần bảo vệ nền độc lập của Đại Việt. Kết quả này tạo điều kiện để đất nước tiếp tục xây dựng đời sống chính trị và kinh tế. Khi nói về ý nghĩa, cần xuất phát từ điều đã được bảo vệ và nguy cơ đã được ngăn chặn, thay vì chỉ liệt kê những từ ngữ biểu dương.

Việc kết hợp quân sự với thương lượng còn cho thấy mục tiêu giữ nước có thể đi cùng mong muốn khôi phục hòa bình. Chiến tranh kéo dài gây tổn thất cho người dân và làm hao hụt nguồn lực. Một giải pháp kết thúc phù hợp giúp hạn chế hậu quả trong khi vẫn bảo vệ lợi ích cốt lõi. Đây là điểm cần phân biệt với cách hiểu chiến thắng chỉ là tiếp tục chiến đấu không giới hạn.

Em có thể làm bảng hai cột: kết quả trực tiếp và điều kiện phát triển sau chiến tranh. Cột đầu ghi việc ngăn cuộc xâm lược, giữ nền độc lập; cột sau ghi khả năng ổn định đời sống. Không nên suy ra rằng sau một cuộc kháng chiến mọi vấn đề xã hội đều được giải quyết. Lịch sử luôn có cả thành quả và khó khăn, và nhận xét có giới hạn thường chính xác hơn một lời khẳng định bao trùm.`,
            'Ý nghĩa giữ nước gồm bảo vệ độc lập và tạo điều kiện khôi phục đời sống hòa bình.',
            'Một kết quả quân sự có thể tạo điều kiện cho phát triển nhưng vì sao không tự giải quyết mọi khó khăn?',
          ),
          R(
            'Đọc thơ, truyền thống và sự kiện lịch sử',
            'Phân biệt giá trị tư tưởng của tác phẩm với bằng chứng về tác giả và trận đánh.',
            `
Một tác phẩm được truyền lại có thể giúp người học nhận ra tư tưởng và cảm xúc của các thế hệ. Nam quốc sơn hà thường được đọc trong mạch tìm hiểu ý thức độc lập và chủ quyền. Giá trị này không đòi hỏi phải khẳng định chắc chắn mọi chi tiết về lần xuất hiện đầu tiên hoặc người sáng tác khi chứng cứ còn cần xem xét.

Tư liệu văn học và tư liệu lịch sử có thể hỗ trợ nhau nhưng không thay thế hoàn toàn cho nhau. Một câu thơ không tự cung cấp đầy đủ số quân, hướng tiến công hay ngày diễn ra trận đánh. Khi viết bài, em nên tách phần trình bày diễn biến 1075–1077 khỏi phần tìm hiểu tư tưởng được thể hiện trong tác phẩm. Cách làm này tránh dùng cảm xúc thay cho chứng minh sự kiện.

Bài tập tổng hợp là viết một đoạn giới thiệu phòng tuyến Như Nguyệt. Đoạn viết cần có hoàn cảnh, vai trò địa hình, tổ chức chiến đấu và việc kết thúc chiến tranh. Nếu nhắc tác phẩm, dùng cách nói thường được gắn với truyền thống về cuộc kháng chiến. Hãy đọc lại để kiểm tra mọi lời khẳng định: đó là mốc lịch sử, nhận xét của em hay thông tin còn cần đối chiếu?`,
            'Có thể trân trọng giá trị tư tưởng của một tác phẩm mà vẫn thận trọng về nguồn gốc.',
            'Hãy sửa câu khẳng định tuyệt đối về tác giả Nam quốc sơn hà thành một câu có giới hạn phù hợp.',
          ),
        ],
        quiz: [
          Q(
            'Ý nghĩa chính của cuộc kháng chiến chống Tống thời Lý là gì?',
            'Cuộc kháng chiến bảo vệ nền độc lập của Đại Việt.',
            'Bảo vệ độc lập Đại Việt',
            'Mở đầu thời Bắc thuộc',
            'Thành lập chính quyền Hai Bà',
            'Kết thúc triều Tây Sơn',
          ),
          Q(
            'Thương lượng kết thúc chiến tranh có thể mang lại lợi ích nào?',
            'Kết thúc phù hợp giúp giảm tổn thất và khôi phục hòa bình.',
            'Hạn chế tổn thất và ổn định đời sống',
            'Tự động xóa mọi khó khăn xã hội',
            'Làm việc phòng thủ trở nên không cần thiết từ đầu',
            'Thay thế mọi chứng cứ lịch sử',
          ),
          Q(
            'Trình tự nào đúng trong cuộc kháng chiến?',
            'Tiến công chủ động rồi rút về, sau đó phòng thủ Như Nguyệt.',
            '1075 tiến công → 1076 rút về → 1077 Như Nguyệt',
            '1077 Như Nguyệt → 1075 tiến công',
            '1288 Bạch Đằng → 1075 tiến công',
            '1789 Đống Đa → 1077 Như Nguyệt',
          ),
          Q(
            'Một bài thơ tự nó không đủ chứng minh điều nào?',
            'Các chi tiết quân sự cụ thể cần nguồn lịch sử phù hợp.',
            'Toàn bộ số quân và diễn biến chính xác của trận đánh',
            'Tác phẩm có thể biểu đạt tư tưởng',
            'Người đọc có thể suy nghĩ về chủ quyền',
            'Văn học có vai trò trong ký ức cộng đồng',
          ),
          Q(
            'Cách trình bày nào phù hợp với học lịch sử có căn cứ?',
            'Cần phân biệt sự kiện, cách đánh giá và vấn đề còn chưa chắc chắn.',
            'Tách sử kiện, nhận xét và thông tin cần đối chiếu',
            'Xem mọi truyền thống là biên bản tại trận',
            'Bỏ qua bối cảnh để chỉ ghi lời khen',
            'Khẳng định càng tuyệt đối càng chính xác',
          ),
        ],
      },
    ],
  },
  {
    key: 'tran-hung-dao',
    title: 'Trần Hưng Đạo và ba lần kháng chiến Mông–Nguyên',
    category: 1,
    period: [1258, 1288],
    context:
      'Thế kỷ XIII, Đại Việt dưới triều Trần phải chống các cuộc xâm lược từ đế quốc Mông Cổ rồi nhà Nguyên. Ba cuộc kháng chiến diễn ra vào các năm 1258, 1285 và 1287–1288. Trần Quốc Tuấn, tức Trần Hưng Đạo, giữ vai trò chỉ huy nổi bật trong hai cuộc sau. Không gán toàn bộ sự chỉ huy của cả ba lần cho riêng ông; thắng lợi là thành quả chung của triều đình, quân đội và nhân dân.',
    outcomes:
      'Phân biệt ba cuộc kháng chiến; xác định vai trò Trần Quốc Tuấn; giải thích bảo toàn lực lượng, hậu cần và Bạch Đằng 1288; nhận ra sức mạnh đoàn kết.',
    timeline: [
      {
        year: 1258,
        event: 'Đại Việt đánh bại cuộc xâm lược của quân Mông Cổ.',
      },
      {
        year: 1285,
        event:
          'Đánh bại cuộc xâm lược của quân Nguyên; Trần Quốc Tuấn có vai trò chỉ huy quan trọng.',
      },
      { year: 1287, event: 'Quân Nguyên mở cuộc xâm lược tiếp theo.' },
      {
        year: 1288,
        event:
          'Chiến thắng Bạch Đằng góp phần quyết định đánh bại cuộc xâm lược.',
      },
    ],
    units: [
      {
        focus: 'Thế lực Mông–Nguyên và tổ chức kháng chiến của nhà Trần.',
        readings: [
          R(
            'Ba cuộc kháng chiến trong bối cảnh thế kỷ XIII',
            'Đặt các lần xâm lược trên trục thời gian và gọi đúng đối phương theo thời kỳ.',
            `
Đế quốc Mông Cổ mở rộng mạnh trong thế kỷ XIII, tạo sức ép lên nhiều khu vực châu Á. Đại Việt cũng đứng trước nguy cơ xâm lược. Năm 1258, quân Mông Cổ tiến vào nhưng bị nhà Trần đánh bại. Cuộc kháng chiến này diễn ra trước khi nhà Nguyên được thành lập, vì vậy gọi cả ba lần là chống nhà Nguyên mà không giải thích sẽ thiếu chính xác.

Năm 1285 và trong giai đoạn 1287–1288, nhà Nguyên tiếp tục tiến đánh Đại Việt. Những cuộc tiến công có quy mô và cách tổ chức khác với lần đầu. Người học cần tách mỗi cuộc thành một hàng trong bảng, ghi đối phương, thời gian và kết quả. Không nên ghép các trận nổi tiếng thành một chiến dịch kéo dài liên tục suốt ba mươi năm.

Khả năng giữ nước của nhà Trần dựa trên sự chuẩn bị lâu dài và huy động nhiều lực lượng. Triều đình, tướng lĩnh, quân sĩ và người dân đều có phần việc. Trong quá trình học, hãy hỏi mỗi quyết định đáp lại khó khăn nào. Cách đặt câu hỏi này giúp hiểu vì sao một quốc gia có thể chống lại lực lượng xâm lược mạnh mà không cần tưởng tượng rằng đối phương yếu trong mọi phương diện.`,
            'Ba lần kháng chiến là ba giai đoạn riêng trong một bối cảnh đế quốc mở rộng.',
            'Vì sao tên gọi Mông–Nguyên thích hợp hơn khi nói chung về cả ba cuộc kháng chiến?',
          ),
          R(
            'Trần Quốc Tuấn và sự phối hợp trong triều Trần',
            'Nhận biết vai trò chỉ huy của Trần Hưng Đạo mà không bỏ qua các chủ thể khác.',
            `
Trần Quốc Tuấn được biết đến với tước hiệu Hưng Đạo Đại Vương. Trong các cuộc kháng chiến chống Nguyên, ông có vai trò quan trọng trong tổ chức và điều hành lực lượng. Năng lực của người chỉ huy thể hiện ở việc đánh giá tình hình, lựa chọn cách đối phó và gắn hoạt động các cánh quân với mục tiêu chung.

Không nên vì học một khóa mang tên Trần Hưng Đạo mà coi ông là người duy nhất quyết định mọi sự kiện. Vua Trần, nhiều tướng lĩnh và cộng đồng địa phương có vai trò khác nhau. Chẳng hạn, cuộc kháng chiến năm 1258 gắn với sự lãnh đạo của Trần Thái Tông cùng các tướng đương thời. Hai lần sau là giai đoạn nổi bật hơn khi phân tích vai trò chỉ huy của Trần Quốc Tuấn.

Hịch tướng sĩ gắn với việc khích lệ tinh thần và ý thức trách nhiệm của tướng sĩ. Khi đọc, em có thể tìm xem văn bản yêu cầu người nghe thay đổi thái độ hay hành động nào. Tuy nhiên, không lấy một lời kêu gọi làm bằng chứng duy nhất về toàn bộ diễn biến quân sự. Hiểu nhân vật qua cả tư tưởng, quyết định và tổ chức sẽ đầy đủ hơn việc chỉ ghi nhớ danh hiệu.`,
            'Vai trò nổi bật của Trần Hưng Đạo cần được đặt trong sự lãnh đạo và đóng góp tập thể.',
            'Nếu làm bảng đóng góp, em sẽ dành các dòng riêng cho người chỉ huy, quân sĩ và người dân như thế nào?',
          ),
        ],
        quiz: [
          Q(
            'Ba mốc kháng chiến nào thuộc thời Trần?',
            'Các cuộc diễn ra năm 1258, 1285 và 1287–1288.',
            '1258; 1285; 1287–1288',
            '40; 43; 938',
            '1075; 1076; 1077',
            '1418; 1427; 1789',
          ),
          Q(
            'Vì sao năm 1258 nên gọi là chống quân Mông Cổ?',
            'Nhà Nguyên chưa được thành lập vào thời điểm cuộc xâm lược đầu tiên.',
            'Cuộc kháng chiến diễn ra trước khi nhà Nguyên thành lập',
            'Vì đối phương là quân Đông Hán',
            'Vì nhà Trần chưa tồn tại',
            'Vì không có cuộc chiến nào năm 1258',
          ),
          Q(
            'Tên thật của Trần Hưng Đạo là gì?',
            'Trần Hưng Đạo là cách gọi Trần Quốc Tuấn.',
            'Trần Quốc Tuấn',
            'Trần Quốc Toản',
            'Trần Thủ Độ',
            'Trần Quang Khải',
          ),
          Q(
            'Nhận định nào đúng về vai trò Trần Hưng Đạo?',
            'Ông nổi bật trong hai cuộc kháng chiến sau, không phải chỉ huy duy nhất của cả ba lần.',
            'Giữ vai trò chỉ huy quan trọng trong hai cuộc kháng chiến sau',
            'Một mình lãnh đạo mọi hoạt động của cả ba lần',
            'Chỉ huy trận Bạch Đằng năm 938',
            'Lãnh đạo khởi nghĩa Lam Sơn',
          ),
          Q(
            'Hịch tướng sĩ được tìm hiểu phù hợp nhất ở khía cạnh nào?',
            'Văn bản cho thấy tư tưởng khích lệ trách nhiệm của tướng sĩ.',
            'Khích lệ tinh thần và trách nhiệm của tướng sĩ',
            'Bản đồ chính xác mọi trận đánh',
            'Bảng số liệu toàn bộ thuyền của đối phương',
            'Ảnh chụp hội nghị quân sự',
          ),
        ],
      },
      {
        focus: 'Bảo toàn lực lượng, hậu cần và chiến thắng Bạch Đằng 1288.',
        readings: [
          R(
            'Rút lui có tổ chức và phản công năm 1285',
            'Phân biệt rút lui chiến lược với thất bại toàn bộ cuộc kháng chiến.',
            `
Khi quân Nguyên tiến mạnh trong năm 1285, lực lượng Đại Việt phải đối mặt với sức ép lớn. Nhà Trần có lúc rút khỏi những vị trí quan trọng để tránh thế tiến công và bảo toàn lực lượng. Rút lui trong tình huống cụ thể không đồng nghĩa với từ bỏ cuộc kháng chiến. Cần xem lực lượng có giữ được tổ chức và chuẩn bị bước tiếp theo hay không.

Việc làm cho đối phương khó kiếm lương thực tại chỗ, kéo dài đường tiếp tế và tránh trận đánh bất lợi có thể làm thay đổi tương quan. Khi có điều kiện, quân Đại Việt phản công, giành thắng lợi ở những địa điểm như Hàm Tử và Chương Dương. Vai trò của nhiều tướng lĩnh trong các trận cho thấy cuộc kháng chiến là sự phối hợp rộng, không phải chuỗi hành động riêng của một người.

Để hiểu diễn biến, em hãy vẽ một đường chuyển từ phòng tránh sang phản công. Bên dưới mỗi đoạn ghi mục tiêu: giữ lực lượng, làm địch khó khăn, giành lại thế chủ động. Không nên áp dụng công thức rằng rút lui lúc nào cũng đúng. Điều có ý nghĩa là quyết định phù hợp với hoàn cảnh và tạo được điều kiện cho mục tiêu cuối cùng: đánh bại cuộc xâm lược.`,
            'Rút lui có tổ chức có thể là một bước trong kế hoạch kháng chiến, không phải kết cục của cả cuộc chiến.',
            'Cần biết thêm điều gì trước khi đánh giá một lần rút quân là thành công hay thất bại?',
          ),
          R(
            'Hậu cần và trận Bạch Đằng năm 1288',
            'Liên hệ việc cắt tiếp tế với thời cơ đánh quân rút lui.',
            `
Trong cuộc xâm lược 1287–1288, quân Nguyên đưa theo lực lượng vận chuyển lương thực. Hoạt động của Trần Khánh Dư ở Vân Đồn gây tổn thất cho đoàn thuyền lương, làm đối phương khó khăn về tiếp tế. Chi tiết này cho thấy hậu cần không phải việc phụ: một đạo quân muốn duy trì hoạt động phải có lương thực và đường vận chuyển.

Khi quân Nguyên rút lui, nhà Trần tổ chức đánh chặn. Năm 1288, lực lượng do Trần Quốc Tuấn chỉ huy giành chiến thắng lớn trên sông Bạch Đằng, đánh bại cánh thủy quân rút lui của đối phương. Trận địa sông nước và quy luật thủy triều được kết hợp với sự bố trí lực lượng. Thắng lợi góp phần quyết định làm thất bại cuộc xâm lược.

Nếu chỉ nhìn vào bãi cọc, người học có thể bỏ qua quá trình tạo thời cơ trước trận đánh. Em nên nối ba ý: tiếp tế gặp khó, đối phương rút lui, quân Đại Việt chủ động chặn đánh. Đồng thời, phân biệt chiến thắng này với Bạch Đằng 938 của Ngô Quyền. Việc cùng khai thác một không gian sông nước không biến hai sự kiện thành một, và không cho phép trao đổi tên người chỉ huy giữa chúng.`,
            'Chiến thắng 1288 cần được hiểu trong quan hệ giữa hậu cần, thời cơ và tổ chức trận đánh.',
            'Vì sao đánh vào đoàn thuyền lương có thể ảnh hưởng đến khả năng tác chiến của một đạo quân?',
          ),
        ],
        quiz: [
          Q(
            'Mục tiêu nào có thể giải thích việc rút lui của nhà Trần năm 1285?',
            'Bảo toàn lực lượng để tránh thế mạnh ban đầu rồi tìm thời cơ phản công.',
            'Bảo toàn lực lượng và chờ điều kiện phản công',
            'Chấm dứt mọi kháng cự vĩnh viễn',
            'Chuyển sang giúp quân Nguyên',
            'Xóa bỏ toàn bộ hệ thống chỉ huy',
          ),
          Q(
            'Những địa danh nào gắn với phản công năm 1285?',
            'Hàm Tử và Chương Dương là các thắng lợi nổi bật năm 1285.',
            'Hàm Tử và Chương Dương',
            'Ngọc Hồi và Đống Đa',
            'Mê Linh và Hát Môn',
            'Chi Lăng và Xương Giang năm 1427',
          ),
          Q(
            'Trần Khánh Dư gắn với hoạt động nào trong cuộc kháng chiến 1287–1288?',
            'Ông đánh đoàn thuyền lương của quân Nguyên ở Vân Đồn.',
            'Đánh đoàn thuyền lương ở Vân Đồn',
            'Xưng vương tại Cổ Loa năm 939',
            'Lãnh đạo khởi nghĩa năm 40',
            'Đọc Bình Ngô đại cáo năm 1077',
          ),
          Q(
            'Bạch Đằng năm 1288 diễn ra trong tình thế nào?',
            'Quân Đại Việt chặn đánh cánh thủy quân đối phương đang rút lui.',
            'Đánh chặn thủy quân Nguyên rút lui',
            'Đánh cánh quân Nam Hán mới tới năm 938',
            'Đối phó quân Đông Hán năm 43',
            'Mở đầu khởi nghĩa Lam Sơn',
          ),
          Q(
            'Vì sao hậu cần có ý nghĩa quân sự?',
            'Thiếu lương thực và vận chuyển có thể làm đạo quân mất khả năng duy trì chiến dịch.',
            'Quân đội cần nguồn tiếp tế để duy trì hoạt động',
            'Quân đội không cần lương thực',
            'Tiếp tế chỉ liên quan đến thời bình',
            'Thuyền lương thay thế hoàn toàn người chỉ huy',
          ),
        ],
      },
      {
        focus: 'Ý nghĩa kháng chiến và phương pháp tổng hợp ba giai đoạn.',
        readings: [
          R(
            'Đoàn kết và sức mạnh bảo vệ Đại Việt',
            'Giải thích đoàn kết bằng những hoạt động cụ thể, thay vì chỉ dùng khẩu hiệu.',
            `
Ba cuộc kháng chiến thành công giúp Đại Việt giữ nền độc lập trước những cuộc xâm lược mạnh. Thắng lợi không có nghĩa là không có tổn thất. Người dân phải di chuyển, sản xuất bị ảnh hưởng và việc khôi phục đời sống cần nhiều công sức. Nhìn cả hai mặt giúp hiểu rõ giá trị của hòa bình sau chiến tranh.

Đoàn kết trong hoàn cảnh này có thể được nhận ra qua sự phối hợp chỉ huy, huy động hậu cần và hỗ trợ của các địa phương. Đây là những hoạt động cụ thể chứ không chỉ là một từ để ca ngợi. Tuy nhiên, không nên lý tưởng hóa rằng mọi người luôn suy nghĩ giống nhau. Điều cần phân tích là khả năng đặt mục tiêu giữ nước lên trên những bất đồng để cùng hành động.

Khi viết nguyên nhân thắng lợi, hãy chọn một nhận định rồi đưa ví dụ. Nếu nói có tổ chức, hãy nhắc việc bảo toàn lực lượng và phản công. Nếu nói biết tạo thời cơ, hãy liên hệ khó khăn tiếp tế của đối phương và Bạch Đằng 1288. Cách giải thích có dẫn chứng làm bài viết thuyết phục hơn một danh sách phẩm chất. Đây cũng là kỹ năng có thể dùng khi học các cuộc kháng chiến khác.`,
            'Nhận định về đoàn kết và tổ chức cần được minh họa bằng việc làm có căn cứ.',
            'Hãy dùng một ví dụ hậu cần hoặc chỉ huy để giải thích sức mạnh phối hợp của nhà Trần.',
          ),
          R(
            'Lập bảng so sánh ba lần kháng chiến',
            'Tổng hợp đúng niên đại, đối phương và vai trò nhân vật mà không trộn sự kiện.',
            `
Bảng so sánh nên có ba hàng tương ứng với 1258, 1285 và 1287–1288. Các cột có thể gồm đối phương, cách tổ chức kháng chiến và kết quả. Khi chưa biết chắc một chi tiết, em để ghi chú cần đối chiếu thay vì tự điền. Bảng tốt không cần nhiều thông tin nhất, mà cần thông tin chính xác và giúp nhìn thấy điểm chung cùng khác biệt.

Một lỗi dễ gặp là viết Trần Hưng Đạo chỉ huy cả ba cuộc kháng chiến giống hệt nhau. Lỗi khác là đưa Ngô Quyền hoặc Hoằng Tháo vào trận Bạch Đằng năm 1288. Hãy kiểm tra tên người và niên đại theo cặp. Việc nói rõ người chỉ huy và bối cảnh không làm giảm đóng góp của các chủ thể còn lại, mà giúp phân công vai trò trong cách kể.

Cuối cùng, thử giải thích điều gì được lặp lại ở mức nguyên tắc: bảo vệ độc lập, dựa vào tổ chức, tận dụng điều kiện có lợi. Những nguyên tắc đó không có nghĩa mọi chiến thuật đều giống nhau. Từ việc so sánh, em có thể hiểu tư duy linh hoạt của các thế hệ thay vì học một công thức chiến thắng bất biến. Lịch sử cần được giải thích qua hoàn cảnh cụ thể.`,
            'So sánh đúng đòi hỏi giữ riêng sự kiện rồi mới rút ra nhận xét chung.',
            'Em sẽ kiểm tra những cặp tên người và niên đại nào trước khi nộp bài tổng hợp?',
          ),
        ],
        quiz: [
          Q(
            'Ý nghĩa chung của ba cuộc kháng chiến thời Trần là gì?',
            'Các cuộc kháng chiến bảo vệ độc lập Đại Việt.',
            'Giữ vững nền độc lập Đại Việt',
            'Đặt Đại Việt dưới quyền Nam Hán',
            'Mở đầu cuộc khởi nghĩa Hai Bà',
            'Thành lập nhà Thanh',
          ),
          Q(
            'Ví dụ nào thể hiện đoàn kết và phối hợp cụ thể?',
            'Huy động lương thực và phối hợp lực lượng là những hoạt động có thể phân tích.',
            'Địa phương hỗ trợ hậu cần và các cánh quân phối hợp',
            'Mỗi lực lượng hành động hoàn toàn tách rời',
            'Không cần nguồn lực của người dân',
            'Chỉ dùng một khẩu hiệu mà không tổ chức',
          ),
          Q(
            'Cặp nhân vật và niên đại nào đúng?',
            'Ngô Quyền gắn với 938; Trần Quốc Tuấn gắn với 1288.',
            'Ngô Quyền: 938; Trần Quốc Tuấn: 1288',
            'Ngô Quyền: 1288; Trần Quốc Tuấn: 938',
            'Lê Lợi: 938; Hai Bà Trưng: 1288',
            'Quang Trung: 1258; Lý Thường Kiệt: 1288',
          ),
          Q(
            'Tại sao không nên chỉ liệt kê nguyên nhân thắng lợi bằng từ ngữ khen ngợi?',
            'Một giải thích lịch sử cần dẫn chứng và quan hệ giữa hành động với kết quả.',
            'Cần dẫn chứng cụ thể cho từng nhận định',
            'Vì không được bàn về tổ chức',
            'Vì mọi chiến thắng không có nguyên nhân',
            'Vì chỉ số năm mới có giá trị',
          ),
          Q(
            'Cách so sánh ba cuộc kháng chiến nào phù hợp?',
            'Giữ riêng các sự kiện rồi mới tìm điểm chung và khác biệt.',
            'Tách từng giai đoạn trước khi rút ra nhận xét chung',
            'Gộp mọi trận thành một ngày duy nhất',
            'Coi chiến thuật không bao giờ thay đổi',
            'Trao đổi tên đối phương tùy ý',
          ),
        ],
      },
    ],
  },
  {
    key: 'le-loi',
    title: 'Lê Lợi — Khởi nghĩa Lam Sơn',
    category: 2,
    period: [1418, 1428],
    context:
      'Đầu thế kỷ XV, nhà Minh đặt ách đô hộ sau khi đánh bại nhà Hồ. Trong hoàn cảnh ấy, Lê Lợi cùng những người đồng chí hướng dựng cờ khởi nghĩa ở Lam Sơn, Thanh Hóa, năm 1418. Phong trào trải qua khó khăn, mở rộng lực lượng rồi đánh bại quân Minh. Cần phân biệt kết thúc chiến tranh năm 1427 với việc Lê Lợi lên ngôi, mở đầu triều Lê sơ năm 1428.',
    outcomes:
      'Sắp xếp các giai đoạn 1418–1428; giải thích chuyển hướng vào Nghệ An, hậu cần và lòng dân; phân biệt vai trò Lê Lợi và Nguyễn Trãi; nhận diện truyện trả gươm là truyền thuyết.',
    timeline: [
      { year: 1418, event: 'Lê Lợi dựng cờ khởi nghĩa tại Lam Sơn.' },
      { year: 1424, event: 'Nghĩa quân chuyển hướng vào Nghệ An.' },
      {
        year: 1426,
        event: 'Nghĩa quân tiến ra Bắc; chiến thắng Tốt Động–Chúc Động.',
      },
      {
        year: 1427,
        event: 'Chiến thắng Chi Lăng–Xương Giang; quân Minh chấp nhận rút về.',
      },
      { year: 1428, event: 'Lê Lợi lên ngôi; Bình Ngô đại cáo được công bố.' },
    ],
    units: [
      {
        focus: 'Ách đô hộ nhà Minh và những năm đầu ở Lam Sơn.',
        readings: [
          R(
            'Vì sao khởi nghĩa bùng lên ở Lam Sơn?',
            'Nhận biết hoàn cảnh đô hộ và yêu cầu khôi phục quyền làm chủ.',
            `
Sau khi nhà Hồ thất bại trước cuộc tiến công của Minh, đất nước rơi vào tình trạng bị đô hộ. Chính quyền Minh áp đặt bộ máy cai trị và các nghĩa vụ lên dân chúng. Mâu thuẫn phát triển trong nhiều địa phương, tạo cơ sở cho những hoạt động chống đối. Không nên kể Lam Sơn như một cuộc nổi dậy không có liên hệ với đời sống xã hội.

Năm 1418, Lê Lợi dựng cờ khởi nghĩa ở Lam Sơn, thuộc Thanh Hóa. Địa bàn này gắn với điều kiện tập hợp lực lượng và sự hỗ trợ tại chỗ. Buổi đầu, nghĩa quân còn ít và gặp nhiều khó khăn về tiếp tế. Một phong trào có mục tiêu chính đáng vẫn phải giải quyết vấn đề tổ chức nếu muốn duy trì và phát triển.

Em có thể lập bảng hoàn cảnh, mục tiêu và nguồn lực. Hoàn cảnh là ách đô hộ; mục tiêu là đánh đuổi lực lượng cai trị và khôi phục độc lập; nguồn lực gồm con người, lương thực và sự ủng hộ. Ba cột cho thấy vì sao khởi nghĩa không chỉ là một quyết định tuyên bố. Việc duy trì được phong trào trong những năm đầu khó khăn là điều kiện cần cho các bước tiến về sau.`,
            'Mục tiêu giành độc lập phải đi cùng việc xây dựng lực lượng và cơ sở trong dân.',
            'Nếu thiếu lương thực hoặc sự hỗ trợ địa phương, mục tiêu của nghĩa quân sẽ gặp trở ngại gì?',
          ),
          R(
            'Lê Lợi, Nguyễn Trãi và công việc tập hợp lực lượng',
            'Phân biệt vai trò lãnh đạo với công việc tham mưu, vận động và hỗ trợ.',
            `
Lê Lợi là người đứng đầu cuộc khởi nghĩa Lam Sơn. Vai trò ấy thể hiện ở tập hợp lực lượng, lựa chọn hướng hoạt động và giữ mục tiêu kháng chiến. Nguyễn Trãi là một người tham gia quan trọng trong công việc tham mưu và đấu tranh bằng văn thư. Những đóng góp khác nhau có thể bổ trợ nhau, không cần gộp mọi việc vào một nhân vật.

Nghĩa quân cần thu hút người tham gia và tạo niềm tin rằng phong trào có khả năng bảo vệ cộng đồng. Việc vận động, đối xử với dân và duy trì tổ chức liên hệ trực tiếp với nguồn tiếp tế. Trong học tập, những khái niệm như lòng dân nên được giải thích bằng quan hệ giữa người dân và hoạt động thực tế, không chỉ bằng một câu nói tượng trưng.

Tên tuổi của nhiều tướng lĩnh và người dân gắn với cuộc khởi nghĩa. Mỗi người có điều kiện và vai trò riêng. Nếu dùng truyện kể về một hành động dũng cảm, em cần kiểm tra nguồn và không tự thêm lời thoại. Một bức tranh toàn diện nên thể hiện người lãnh đạo, người tham mưu, người chiến đấu và người hỗ trợ hậu cần. Đây là cách tôn trọng đóng góp tập thể mà vẫn nhận rõ vai trò cá nhân.`,
            'Khởi nghĩa phát triển nhờ sự phối hợp lãnh đạo, tham mưu, chiến đấu và hỗ trợ của dân chúng.',
            'Vì sao không nên nói Nguyễn Trãi và Lê Lợi làm cùng một công việc trong mọi sự kiện?',
          ),
        ],
        quiz: [
          Q(
            'Khởi nghĩa Lam Sơn bắt đầu năm nào?',
            'Mốc mở đầu là năm 1418.',
            '1418',
            '1424',
            '1428',
            '1789',
          ),
          Q(
            'Lam Sơn gắn với địa bàn nào?',
            'Căn cứ khởi đầu ở Thanh Hóa.',
            'Thanh Hóa',
            'Phú Xuân',
            'Mê Linh',
            'Vân Đồn',
          ),
          Q(
            'Cuộc khởi nghĩa Lam Sơn chống chính quyền đô hộ nào?',
            'Nghĩa quân chống sự đô hộ của nhà Minh.',
            'Nhà Minh',
            'Nhà Đông Hán',
            'Nhà Tống',
            'Nhà Thanh',
          ),
          Q(
            'Nhận định nào phân biệt vai trò Lê Lợi và Nguyễn Trãi?',
            'Lê Lợi đứng đầu phong trào; Nguyễn Trãi có vai trò tham mưu và văn thư.',
            'Lê Lợi lãnh đạo; Nguyễn Trãi tham gia tham mưu và văn thư',
            'Nguyễn Trãi xưng vương ở Cổ Loa năm 939',
            'Lê Lợi chỉ huy Như Nguyệt năm 1077',
            'Hai người đều chỉ huy đoàn thuyền Nam Hán',
          ),
          Q(
            'Nguồn lực nào thiết yếu để nghĩa quân duy trì hoạt động?',
            'Con người, lương thực và sự hỗ trợ trong dân đều quan trọng.',
            'Lực lượng, tiếp tế và sự ủng hộ của người dân',
            'Chỉ một lời tuyên bố mà không cần tổ chức',
            'Không cần nơi tập hợp',
            'Không cần lương thực',
          ),
        ],
      },
      {
        focus: 'Chuyển hướng chiến lược và những thắng lợi quyết định.',
        readings: [
          R(
            'Chuyển hướng vào Nghệ An năm 1424',
            'Giải thích vì sao thay đổi địa bàn có thể mở ra cơ hội phát triển.',
            `
Những năm đầu, nghĩa quân hoạt động trong điều kiện bị bao vây và thiếu thốn. Muốn tiếp tục, phong trào cần một địa bàn có khả năng mở rộng lực lượng và nguồn tiếp tế. Năm 1424, nghĩa quân chuyển hướng vào Nghệ An theo kế hoạch gắn với đề xuất của Nguyễn Chích. Đây là một thay đổi quan trọng trong tiến trình khởi nghĩa.

Việc mở rộng địa bàn ở Nghệ An rồi các vùng phía nam giúp tăng nguồn lực và thế chủ động. Tuy nhiên, không nên hiểu rằng chỉ cần đổi nơi hoạt động thì mọi khó khăn tự biến mất. Nghĩa quân vẫn phải chiến đấu, tổ chức quản lý và giữ mối liên hệ với người dân. Một lựa chọn chiến lược chỉ phát huy tác dụng khi được thực hiện bằng nhiều công việc liên tiếp.

Bài tập phù hợp là vẽ sơ đồ nguyên nhân, quyết định, điều kiện mới. Nguyên nhân gồm khó khăn của địa bàn cũ; quyết định là chuyển hướng; điều kiện mới gồm không gian hoạt động và khả năng huy động lực lượng. Hãy ghi rõ đây là sự giải thích quá trình, không phải khẳng định rằng mọi kết quả đều có thể dự đoán từ đầu. Lịch sử có lựa chọn, rủi ro và công sức tổ chức trong từng giai đoạn.`,
            'Chuyển hướng năm 1424 tạo điều kiện mở rộng phong trào nhưng cần tổ chức để biến cơ hội thành kết quả.',
            'Tại sao thay đổi địa bàn là quyết định chiến lược chứ không chỉ là một lần di chuyển?',
          ),
          R(
            'Từ Tốt Động–Chúc Động đến Chi Lăng–Xương Giang',
            'Sắp xếp các thắng lợi cuối cuộc khởi nghĩa và hiểu vai trò việc đánh viện binh.',
            `
Khi lực lượng đã lớn mạnh, nghĩa quân tiến ra Bắc trong năm 1426. Chiến thắng Tốt Động–Chúc Động làm quân Minh thiệt hại nặng và thay đổi thế trận. Từ đó, nghĩa quân có điều kiện gia tăng sức ép lên các cứ điểm còn lại. Cần tách thắng lợi này khỏi những hoạt động đánh viện binh trong năm tiếp theo.

Năm 1427, quân Minh đưa viện binh sang. Nghĩa quân tổ chức đánh chặn, giành thắng lợi trong chiến dịch Chi Lăng–Xương Giang. Viện binh bị đánh bại làm khả năng tiếp tục chiến tranh của đối phương suy giảm mạnh. Cùng với sức ép quân sự, việc thương lượng dẫn đến quân Minh rút về, kết thúc chiến tranh. Không cần thêm số quân hoặc ngày trận đánh nếu chưa có nguồn đối chiếu.

Để hiểu quan hệ nhân quả, hãy phân biệt quân đang giữ cứ điểm với lực lượng sang cứu viện. Đánh viện binh làm giảm hy vọng được tiếp sức của lực lượng trong thành. Vì thế, thắng lợi không chỉ có ý nghĩa ở địa điểm giao chiến mà còn ảnh hưởng đến quyết định của đối phương ở nơi khác. Sơ đồ liên hệ giữa chiến trường, tiếp viện và thương lượng sẽ giúp em hiểu kết quả toàn cuộc khởi nghĩa.`,
            '1426 và 1427 là hai giai đoạn liên tiếp; đánh bại viện binh góp phần tạo điều kiện kết thúc chiến tranh.',
            'Vì sao thất bại của viện binh có thể tác động đến một lực lượng đang ở trong thành?',
          ),
        ],
        quiz: [
          Q(
            'Nghĩa quân Lam Sơn chuyển hướng vào Nghệ An năm nào?',
            'Sự chuyển hướng chiến lược diễn ra năm 1424.',
            '1424',
            '1418',
            '1428',
            '1075',
          ),
          Q(
            'Đề xuất chuyển hướng vào Nghệ An gắn với ai?',
            'Nguyễn Chích gắn với đề xuất quan trọng này.',
            'Nguyễn Chích',
            'Hoằng Tháo',
            'Mã Viện',
            'Tôn Sĩ Nghị',
          ),
          Q(
            'Chiến thắng Tốt Động–Chúc Động gắn với năm nào?',
            'Thắng lợi diễn ra trong năm 1426.',
            '1426',
            '1427',
            '1288',
            '1789',
          ),
          Q(
            'Chi Lăng–Xương Giang năm 1427 chủ yếu gắn với nhiệm vụ nào?',
            'Nghĩa quân đánh bại lực lượng viện binh của Minh.',
            'Đánh bại viện binh Minh',
            'Chống thủy quân Nam Hán',
            'Dựng phòng tuyến Như Nguyệt',
            'Lập chính quyền của Hai Bà',
          ),
          Q(
            'Vì sao đánh bại viện binh góp phần kết thúc chiến tranh?',
            'Lực lượng Minh ở các cứ điểm giảm khả năng được cứu viện và tiếp tục chiến đấu.',
            'Làm giảm khả năng tiếp tục chiến tranh của đối phương',
            'Vì viện binh không liên hệ với lực lượng trong thành',
            'Vì tự động đổi tên mọi cứ điểm',
            'Vì chiến tranh không cần nguồn lực',
          ),
        ],
      },
      {
        focus: 'Khôi phục độc lập, Bình Ngô đại cáo và truyền thuyết trả gươm.',
        readings: [
          R(
            'Năm 1428 và việc xác lập một triều đại mới',
            'Phân biệt kết thúc chiến tranh với tổ chức nhà nước sau thắng lợi.',
            `
Sau khi quân Minh chấp nhận rút về, cuộc chiến tranh giải phóng kết thúc thắng lợi. Năm 1428, Lê Lợi lên ngôi, mở đầu triều Lê sơ. Hai mốc 1427 và 1428 giúp nhận biết bước chuyển từ đánh đuổi lực lượng đô hộ sang xây dựng chính quyền và khôi phục đời sống. Thắng lợi tạo điều kiện, nhưng công việc sau chiến tranh vẫn rất lớn.

Bình Ngô đại cáo do Nguyễn Trãi soạn theo lệnh Lê Lợi được công bố năm 1428. Văn bản nêu tư tưởng nhân nghĩa, khẳng định nền độc lập và tổng kết cuộc kháng chiến. Khi tìm hiểu, cần phân biệt người ra lệnh công bố với người soạn văn bản. Không tự thêm lời trích dẫn nếu không có văn bản để kiểm tra chính xác.

Một quốc gia sau chiến tranh phải tổ chức lại sản xuất, bộ máy cai trị và đời sống dân chúng. Bởi vậy, nói về thành quả không chỉ là kể lễ lên ngôi. Em có thể nối mục tiêu ban đầu chống đô hộ với nhiệm vụ mới bảo vệ và xây dựng đất nước. Nhận thức được sự chuyển tiếp này sẽ giúp hiểu vì sao lịch sử không dừng lại ở một trận thắng hay một bản tuyên bố.`,
            'Thắng lợi khôi phục độc lập và mở ra nhiệm vụ xây dựng nhà nước, ổn định đời sống.',
            'Hãy phân biệt vai trò Lê Lợi và Nguyễn Trãi trong việc công bố Bình Ngô đại cáo.',
          ),
          R(
            'Di sản Lam Sơn và câu chuyện Hồ Gươm',
            'Phân biệt truyền thuyết văn hóa với bằng chứng về chiến thắng.',
            `
Truyền thuyết Lê Lợi trả gươm gắn với Hồ Hoàn Kiếm là một câu chuyện quen thuộc trong đời sống văn hóa. Câu chuyện biểu đạt cách cộng đồng tưởng nhớ người lãnh đạo và khát vọng hòa bình sau chiến thắng. Trong bài học lịch sử, cần gọi đúng đó là truyền thuyết, không coi chi tiết thần kỳ là một sự kiện đã được kiểm chứng.

Những kết quả của khởi nghĩa Lam Sơn cần được giải thích bằng sự phát triển lực lượng, lựa chọn chiến lược, sự hỗ trợ của người dân và các hoạt động quân sự, thương lượng. Không dùng thanh gươm thần để thay thế những nguyên nhân lịch sử. Tuy vậy, việc phân biệt hai loại thông tin không có nghĩa phủ nhận giá trị văn hóa của câu chuyện hay hoạt động bảo tồn di tích.

Em có thể viết hai đoạn ngắn cho một tờ giới thiệu. Đoạn thứ nhất trình bày các mốc 1418, 1424, 1426, 1427 và 1428. Đoạn thứ hai giới thiệu truyền thuyết trả gươm và ý nghĩa tưởng niệm. Đặt nhãn rõ ràng cho mỗi đoạn giúp người đọc không nhầm giữa sử kiện và cách cộng đồng kể về quá khứ. Đây là kỹ năng cần thiết khi tham quan bảo tàng hoặc đọc thông tin trên mạng.`,
            'Truyền thuyết có giá trị văn hóa nhưng không thay thế chứng cứ giải thích diễn biến lịch sử.',
            'Em sẽ trình bày truyền thuyết Hồ Gươm như thế nào để vừa hấp dẫn vừa không gây nhầm lẫn?',
          ),
        ],
        quiz: [
          Q(
            'Lê Lợi lên ngôi mở đầu triều Lê sơ năm nào?',
            'Mốc lên ngôi là 1428, sau khi chiến tranh kết thúc năm 1427.',
            '1428',
            '1418',
            '1424',
            '1789',
          ),
          Q(
            'Ai soạn Bình Ngô đại cáo theo lệnh Lê Lợi?',
            'Nguyễn Trãi là người soạn văn bản.',
            'Nguyễn Trãi',
            'Nguyễn Chích',
            'Ngô Quyền',
            'Trần Quốc Tuấn',
          ),
          Q(
            'Bình Ngô đại cáo gắn với nội dung nào?',
            'Văn bản khẳng định độc lập, tư tưởng nhân nghĩa và tổng kết kháng chiến.',
            'Khẳng định độc lập và tổng kết cuộc kháng chiến',
            'Kế hoạch tiến công của Nam Hán',
            'Mô tả trận Như Nguyệt năm 1077',
            'Quyết định của quân Thanh năm 1789',
          ),
          Q(
            'Nên xếp câu chuyện Lê Lợi trả gươm vào loại nào?',
            'Đó là truyền thuyết văn hóa, không phải chứng cứ xác nhận chi tiết thần kỳ.',
            'Truyền thuyết',
            'Biên bản quân sự tại trận',
            'Ảnh chụp lịch sử',
            'Bảng thống kê khảo cổ đã xác nhận gươm thần',
          ),
          Q(
            'Thứ tự nào phù hợp với diễn biến Lam Sơn?',
            'Khởi nghĩa, chuyển hướng, thắng viện binh, rồi lên ngôi.',
            '1418 khởi nghĩa → 1424 Nghệ An → 1427 thắng lợi → 1428 lên ngôi',
            '1428 lên ngôi → 1418 khởi nghĩa',
            '1427 Chi Lăng → 1424 Nghệ An → 1418 khởi nghĩa',
            '1789 Ngọc Hồi → 1418 Lam Sơn',
          ),
        ],
      },
    ],
  },
  {
    key: 'quang-trung',
    title: 'Quang Trung — Đại phá quân Thanh năm 1789',
    category: 2,
    period: [1788, 1789],
    context:
      'Cuối thế kỷ XVIII, phong trào Tây Sơn phát triển trong hoàn cảnh đất nước có nhiều biến động. Cuối năm 1788, quân Thanh tiến vào, gắn với việc Lê Chiêu Thống cầu viện. Nguyễn Huệ lên ngôi hoàng đế, lấy niên hiệu Quang Trung, rồi chỉ huy quân tiến ra Bắc. Đầu xuân Kỷ Dậu 1789, quân Tây Sơn giành thắng lợi lớn, bảo vệ đất nước trước cuộc xâm lược.',
    outcomes:
      'Phân biệt Nguyễn Huệ với niên hiệu Quang Trung; sắp xếp các mốc 1788–1789; giải thích tổ chức hành quân và phối hợp tiến công; nhận biết vai trò khôi phục hòa bình.',
    timeline: [
      {
        year: 1788,
        event:
          'Quân Thanh vào nước ta; Nguyễn Huệ lên ngôi hoàng đế, lấy niên hiệu Quang Trung và tiến quân ra Bắc.',
      },
      {
        year: 1789,
        event:
          'Đầu xuân Kỷ Dậu, quân Tây Sơn thắng lớn ở Ngọc Hồi–Đống Đa và tiến vào Thăng Long.',
      },
    ],
    units: [
      {
        focus: 'Biến động cuối thế kỷ XVIII và quyết định tiến quân ra Bắc.',
        readings: [
          R(
            'Từ phong trào Tây Sơn đến nguy cơ quân Thanh',
            'Đặt cuộc kháng chiến năm 1789 trong bối cảnh chính trị cuối thế kỷ XVIII.',
            `
Cuối thế kỷ XVIII, đời sống chính trị ở Đại Việt có nhiều biến động. Phong trào Tây Sơn nổi lên và từng bước mở rộng ảnh hưởng. Nguyễn Huệ là một trong những người lãnh đạo quan trọng của phong trào. Để hiểu năm 1789, cần biết đây không phải một cuộc chiến tách khỏi mọi xung đột và thay đổi trước đó.

Cuối năm 1788, quân Thanh do Tôn Sĩ Nghị chỉ huy tiến vào trong bối cảnh Lê Chiêu Thống cầu viện. Một mâu thuẫn chính trị trong nước đã gắn với nguy cơ can thiệp quân sự từ bên ngoài. Khi học, hãy phân biệt việc tranh chấp quyền lực nội bộ với nhiệm vụ chống cuộc xâm lược. Hai vấn đề có quan hệ nhưng không phải cùng một khái niệm.

Bối cảnh này cho thấy quyết định của một nhân vật có thể ảnh hưởng đến nhiều cộng đồng. Tuy nhiên, không nên dùng câu chuyện thời trung đại để đánh giá con người ngày nay theo nguồn gốc quốc gia. Bài học tập trung vào hành động của những chính quyền, lực lượng và người lãnh đạo trong một thời điểm xác định. Mục tiêu là giải thích nguy cơ, sự lựa chọn đối phó và hậu quả của chiến tranh đối với đất nước.`,
            'Cuộc kháng chiến cần được giải thích trong bối cảnh biến động chính trị và can thiệp quân sự cụ thể.',
            'Mâu thuẫn trong nước đã tạo điều kiện cho nguy cơ bên ngoài trong trường hợp này như thế nào?',
          ),
          R(
            'Nguyễn Huệ lên ngôi và tổ chức cuộc hành quân',
            'Phân biệt tên nhân vật, niên hiệu và nhiệm vụ tổ chức lực lượng.',
            `
Cuối năm 1788, Nguyễn Huệ lên ngôi hoàng đế tại Phú Xuân, lấy niên hiệu Quang Trung. Nguyễn Huệ và Quang Trung không phải hai người chỉ huy khác nhau. Việc lên ngôi gắn với xác lập vị thế lãnh đạo trong hoàn cảnh cần tổ chức cuộc kháng chiến. Sau đó, ông chỉ huy lực lượng tiến ra Bắc đối phó quân Thanh.

Cuộc hành quân đòi hỏi chuẩn bị và phối hợp: huy động quân, bảo đảm tiếp tế, giữ kỷ luật và truyền đạt nhiệm vụ. Tốc độ có ý nghĩa nhưng không nên giải thích bằng điều kỳ diệu. Cũng không tự thêm số ngày, quãng đường hay lời tuyên bố khi chưa có nguồn đối chiếu. Những yếu tố tổ chức có thể giải thích sự chuyển quân nhanh và khả năng duy trì hành động thống nhất.

Khi kể về một người lãnh đạo, em nên phân biệt danh xưng với công việc cụ thể. Danh xưng Quang Trung giúp xác định nhân vật trong thời kỳ làm hoàng đế; những quyết định tổ chức lực lượng giúp giải thích vai trò lịch sử. Hai thông tin hỗ trợ nhau. Một bài học tốt không chỉ hỏi nhân vật tên gì mà còn hỏi quyết định nào giúp giải quyết tình thế đang đặt ra.`,
            'Quang Trung là niên hiệu của Nguyễn Huệ; tổ chức và phối hợp là điều kiện quan trọng của cuộc hành quân.',
            'Nếu chỉ nói cuộc hành quân nhanh mà không nhắc hậu cần và kỷ luật, lời giải thích còn thiếu gì?',
          ),
        ],
        quiz: [
          Q(
            'Nguyễn Huệ và Quang Trung có quan hệ như thế nào?',
            'Quang Trung là niên hiệu của Nguyễn Huệ khi lên ngôi hoàng đế.',
            'Quang Trung là niên hiệu của Nguyễn Huệ',
            'Là hai tướng ở hai thế kỷ khác nhau',
            'Quang Trung là tên của một tướng Nam Hán',
            'Nguyễn Huệ là tướng của nhà Minh năm 1427',
          ),
          Q(
            'Quân Thanh tiến vào cuối năm nào?',
            'Nguy cơ trực tiếp xuất hiện cuối năm 1788.',
            '1788',
            '1789 sau chiến thắng',
            '1427',
            '1285',
          ),
          Q(
            'Ai cầu viện nhà Thanh trong bối cảnh này?',
            'Lê Chiêu Thống cầu viện nhà Thanh.',
            'Lê Chiêu Thống',
            'Ngô Quyền',
            'Trưng Trắc',
            'Trần Khánh Dư',
          ),
          Q(
            'Nguyễn Huệ lên ngôi hoàng đế ở đâu?',
            'Sự kiện lên ngôi diễn ra tại Phú Xuân.',
            'Phú Xuân',
            'Cổ Loa năm 939',
            'Mê Linh năm 40',
            'Vân Đồn năm 1288',
          ),
          Q(
            'Yếu tố nào giúp giải thích cuộc hành quân ra Bắc?',
            'Tổ chức, hậu cần và kỷ luật giúp lực lượng chuyển quân và phối hợp.',
            'Tổ chức lực lượng, tiếp tế và kỷ luật',
            'Không cần chuẩn bị vì có phép thuật',
            'Mỗi đơn vị tự quyết định mọi nhiệm vụ',
            'Không cần truyền đạt kế hoạch',
          ),
        ],
      },
      {
        focus: 'Tiến công đầu xuân Kỷ Dậu và chiến thắng Ngọc Hồi–Đống Đa.',
        readings: [
          R(
            'Thời cơ và sự phối hợp trong tiến công',
            'Nhận ra ý nghĩa của kế hoạch chung thay vì quy chiến thắng chỉ cho yếu tố bất ngờ.',
            `
Đầu xuân Kỷ Dậu 1789, quân Tây Sơn tổ chức tiến công quân Thanh trên nhiều hướng. Yếu tố bất ngờ góp phần làm đối phương khó đối phó, nhưng không thể tự tạo ra kết quả nếu các lực lượng không có mục tiêu và nhiệm vụ rõ ràng. Cần nhìn sự bất ngờ trong quan hệ với chuẩn bị, tốc độ và phối hợp.

Các vị trí phòng ngự của đối phương không hoàn toàn giống nhau. Người chỉ huy cần lựa chọn cách tiến công phù hợp để phá thế phòng thủ và hạn chế khả năng hỗ trợ giữa các vị trí. Quân sĩ phải thực hiện nhiệm vụ trong thời gian gắn với kế hoạch chung. Không nên hình dung cả cuộc kháng chiến chỉ gồm một cuộc xung phong ở một địa điểm.

Để học, em có thể vẽ sơ đồ nhiều mũi tên cùng hướng đến mục tiêu chung. Mỗi mũi tên tượng trưng một lực lượng, không phải bản đồ quân sự chính xác. Bên cạnh sơ đồ, ghi điều kiện cần: thông tin, hậu cần và kỷ luật. Việc dùng mô hình giúp hiểu nguyên tắc phối hợp; muốn xác định chính xác đường đi hay thời điểm của từng cánh quân vẫn cần đối chiếu tài liệu chuyên môn.`,
            'Bất ngờ có hiệu quả khi đi cùng chuẩn bị và phối hợp chặt chẽ.',
            'Vì sao một cuộc tiến công nhiều hướng vẫn cần kế hoạch thống nhất?',
          ),
          R(
            'Ngọc Hồi–Đống Đa và việc giải phóng Thăng Long',
            'Mô tả thắng lợi năm 1789 ở mức khái quát, không trộn với các cuộc kháng chiến khác.',
            `
Chiến thắng Ngọc Hồi–Đống Đa là tên gọi khái quát cho những thắng lợi lớn trong đợt tiến công đầu xuân năm 1789. Quân Tây Sơn đánh vỡ hệ thống phòng thủ của đối phương ở những vị trí quan trọng, tiến vào Thăng Long. Quân Thanh thất bại và rút chạy. Tôn Sĩ Nghị không giữ được lực lượng trong tình thế bị tiến công mạnh.

Ngọc Hồi và khu vực thường gắn với tên Đống Đa không nên bị coi là một trận duy nhất tại đúng một điểm. Chúng thuộc một kế hoạch tiến công rộng hơn. Khi làm trục thời gian, em có thể ghi đầu xuân Kỷ Dậu 1789 mà không cần tự chuyển đổi ngày âm sang ngày dương nếu chưa có căn cứ kiểm tra.

Đây là thắng lợi chống quân Thanh, khác với Bạch Đằng chống Nam Hán hoặc Nguyên, và khác với Lam Sơn chống Minh. Một bảng bốn cột gồm người lãnh đạo, đối phương, địa điểm và thời gian giúp phân biệt. Sau khi ghi đúng dữ kiện, em mới giải thích nguyên nhân và ý nghĩa. Cách làm từng bước tránh tình trạng nhớ một tên anh hùng nhưng ghép nhầm vào sự kiện của thời kỳ khác.`,
            'Ngọc Hồi–Đống Đa gắn với đợt tiến công chống Thanh đầu xuân 1789 và thắng lợi tại Thăng Long.',
            'Vì sao tên gọi chung một chiến thắng không có nghĩa mọi trận đều diễn ra ở cùng một địa điểm?',
          ),
        ],
        quiz: [
          Q(
            'Chiến thắng Ngọc Hồi–Đống Đa diễn ra vào dịp nào?',
            'Đợt tiến công quyết định diễn ra đầu xuân Kỷ Dậu 1789.',
            'Đầu xuân Kỷ Dậu 1789',
            'Mùa xuân năm 40',
            'Năm 938',
            'Năm 1288',
          ),
          Q(
            'Quang Trung chống lực lượng nào trong chiến dịch này?',
            'Đối phương trực tiếp là quân Thanh.',
            'Quân Thanh',
            'Quân Đông Hán',
            'Quân Nam Hán',
            'Quân Minh thời Lam Sơn',
          ),
          Q(
            'Ai chỉ huy quân Thanh trong cuộc tiến công cuối 1788?',
            'Tôn Sĩ Nghị là người chỉ huy quân Thanh.',
            'Tôn Sĩ Nghị',
            'Hoằng Tháo',
            'Mã Viện',
            'Vương Thông',
          ),
          Q(
            'Vì sao yếu tố bất ngờ chưa đủ để giải thích thắng lợi?',
            'Phải có chuẩn bị và phối hợp để tận dụng sự bất ngờ.',
            'Còn cần tổ chức, phối hợp và hậu cần',
            'Vì bất ngờ luôn gây thất bại',
            'Vì quân sĩ không tham gia',
            'Vì mọi đơn vị không cần kế hoạch',
          ),
          Q(
            'Kết quả trực tiếp nào gắn với chiến thắng năm 1789?',
            'Quân Thanh thất bại; quân Tây Sơn tiến vào Thăng Long.',
            'Quân Thanh thất bại và rút chạy',
            'Nhà Đông Hán thiết lập cai trị',
            'Ngô Quyền xưng vương',
            'Nhà Lê sơ được thành lập năm 1789',
          ),
        ],
      },
      {
        focus:
          'Bảo vệ đất nước, ổn định quan hệ và tổng hợp toàn chương trình.',
        readings: [
          R(
            'Ý nghĩa chiến thắng và yêu cầu khôi phục hòa bình',
            'Phân biệt thành quả chống xâm lược với những nhiệm vụ tiếp tục sau chiến tranh.',
            `
Chiến thắng năm 1789 đánh bại cuộc xâm lược của quân Thanh và bảo vệ đất nước trong hoàn cảnh nguy cấp. Thắng lợi cũng thể hiện năng lực tổ chức và chỉ huy của Quang Trung cùng tinh thần chiến đấu của lực lượng Tây Sơn. Đánh giá vai trò người lãnh đạo cần đi cùng sự ghi nhận quân sĩ và những người góp sức bảo đảm cuộc kháng chiến.

Sau chiến tranh, một nhiệm vụ quan trọng là khôi phục đời sống và ổn định quan hệ đối ngoại. Nhà Tây Sơn tiến hành giao thiệp với nhà Thanh để giảm nguy cơ xung đột tiếp diễn. Hoạt động ngoại giao không làm mất ý nghĩa của chiến thắng quân sự; nó đáp ứng yêu cầu tạo điều kiện hòa bình. Người dân cần an toàn để sản xuất và xây dựng lại sinh hoạt thường ngày.

Không nên mô tả năm 1789 như thời điểm mọi vấn đề trong nước đã được giải quyết hoàn toàn. Những khó khăn và xung đột khác vẫn tồn tại. Một nhận định chính xác có thể vừa khẳng định ý nghĩa giữ nước vừa thừa nhận giới hạn của một sự kiện. Khi viết kết luận, em hãy nêu thành quả cụ thể trước rồi mới bàn về điều kiện phát triển được mở ra sau đó.`,
            'Bảo vệ đất nước và ổn định hòa bình là những nhiệm vụ nối tiếp, không loại trừ nhau.',
            'Vì sao sau thắng lợi vẫn cần quan tâm quan hệ đối ngoại và đời sống dân chúng?',
          ),
          R(
            'Từ Hai Bà Trưng đến Quang Trung: So sánh có giới hạn',
            'Tổng hợp sáu nhân vật mà vẫn giữ riêng bối cảnh, niên đại và loại tư liệu.',
            `
Sáu khóa học trải từ thế kỷ I đến cuối thế kỷ XVIII. Điểm chung là vai trò của những người lãnh đạo trong đấu tranh giành hoặc bảo vệ quyền tự chủ. Tuy nhiên, Hai Bà Trưng chống ách đô hộ không ở cùng hoàn cảnh với một quốc gia độc lập thời Lý hoặc Trần. So sánh chỉ có ý nghĩa khi giữ được những khác biệt ấy.

Em hãy lập một bảng gồm nhân vật, thời kỳ, đối phương, kết quả và một câu hỏi về tư liệu. Với Ngô Quyền, ghi riêng 938 và 939. Với Trần Hưng Đạo, chú ý hai cuộc kháng chiến sau. Với Lê Lợi, phân biệt kết thúc chiến tranh và lên ngôi. Với Quang Trung, ghép Nguyễn Huệ và niên hiệu vào cùng một nhân vật, không tạo thêm người chỉ huy.

Một bảng tổng hợp tốt cũng cần chỗ cho điều chưa chắc chắn. Truyền thuyết trả gươm, truyện kể về Hai Bà hay vấn đề tác giả Nam quốc sơn hà không nên được ghi như những bằng chứng đã xác định tuyệt đối. Kết thúc chương trình, em thử trình bày một sự kiện trong ba phút: nêu bối cảnh, hành động, kết quả rồi chỉ ra nguồn thông tin cần kiểm tra thêm. Đó là cách học chủ động và có trách nhiệm với quá khứ.`,
            'Tìm điểm chung phải đi cùng việc giữ đúng hoàn cảnh và mức độ chắc chắn của từng thông tin.',
            'Chọn hai nhân vật trong hai thời kỳ và nêu một điểm chung cùng hai khác biệt có căn cứ.',
          ),
        ],
        quiz: [
          Q(
            'Ý nghĩa chủ yếu của chiến thắng năm 1789 là gì?',
            'Chiến thắng đánh bại cuộc xâm lược của Thanh và bảo vệ đất nước.',
            'Bảo vệ đất nước trước cuộc xâm lược của Thanh',
            'Mở đầu thời Bắc thuộc',
            'Giúp quân Thanh đóng giữ Thăng Long lâu dài',
            'Thành lập triều Lý',
          ),
          Q(
            'Ngoại giao sau chiến tranh phục vụ yêu cầu nào?',
            'Ổn định quan hệ giúp giảm nguy cơ tái diễn chiến tranh và tạo điều kiện hòa bình.',
            'Giảm nguy cơ xung đột và ổn định đời sống',
            'Phủ nhận mọi thành quả kháng chiến',
            'Chứng minh không có chiến tranh năm 1789',
            'Thay thế việc phục hồi sản xuất bằng lời tuyên bố',
          ),
          Q(
            'Thứ tự thời gian nào đúng?',
            'Bốn mốc tăng dần là 40, 938, 1427, 1789.',
            'Hai Bà năm 40 → Bạch Đằng 938 → Lam Sơn thắng lợi 1427 → Quang Trung 1789',
            'Quang Trung 1789 → Hai Bà năm 40 → Lam Sơn 1427',
            'Lam Sơn 1427 → Bạch Đằng 938 → Hai Bà năm 40',
            'Bạch Đằng 938 → Hai Bà năm 40 → Quang Trung 1789',
          ),
          Q(
            'Cặp nhân vật và đối phương nào đúng?',
            'Lê Lợi chống Minh; Quang Trung chống Thanh trong chiến dịch 1789.',
            'Lê Lợi: Minh; Quang Trung: Thanh',
            'Lê Lợi: Thanh; Quang Trung: Đông Hán',
            'Ngô Quyền: Nguyên; Hai Bà: Nam Hán',
            'Lý Thường Kiệt: Minh; Trần Hưng Đạo: Thanh',
          ),
          Q(
            'Bảng tổng hợp lịch sử nên xử lý điều chưa chắc chắn như thế nào?',
            'Nêu giới hạn của chứng cứ giúp người đọc không nhầm truyền thuyết với sử kiện.',
            'Ghi rõ phần cần đối chiếu và phân biệt truyền thuyết',
            'Điền thêm chi tiết tùy ý cho đủ cột',
            'Đổi ngày tháng cho câu chuyện trôi chảy',
            'Xem mọi tác phẩm tưởng niệm là ảnh chụp sự kiện',
          ),
        ],
      },
    ],
  },
];

type Owned<T> = T & { id: string };
export type LearningPlan = {
  categories: Owned<Prisma.CategoryCreateManyInput>[];
  products: Owned<Prisma.ProductCreateManyInput>[];
  modules: Owned<Prisma.ModuleCreateManyInput>[];
  lessons: Owned<Prisma.LessonCreateManyInput>[];
  questions: Owned<Prisma.QuizQuestionCreateManyInput>[];
  answers: Owned<Prisma.QuizAnswerCreateManyInput>[];
};
const MODULE_TITLES = [
  'Bối cảnh lịch sử và nhân vật',
  'Diễn biến và đóng góp',
  'Kết quả, ý nghĩa và ôn tập',
];
export function readingText(course: Course, reading: Reading): string {
  return [
    `1. Mục tiêu học tập\n${reading.objective}`,
    `2. Bối cảnh lịch sử\n${course.context}`,
    `3. Nội dung bài học\n${reading.body}`,
    `4. Mốc cần nhớ\n${course.timeline.map((m) => `${m.year}: ${m.event}`).join('\n')}`,
    `5. Ý nghĩa lịch sử\n${reading.takeaway}`,
    '6. Ghi nhớ và cách tự kiểm tra\nPhân biệt hoàn cảnh, hành động và kết quả. Khi kể lại, dùng mốc thời gian để kiểm tra thứ tự; không thêm lời thoại hoặc chi tiết chưa có căn cứ.',
    `7. Suy ngẫm\n${reading.reflection}`,
    'Tự học: đối chiếu sách giáo khoa Lịch sử và Địa lí THCS.',
  ].join('\n\n');
}
export function buildLearningPlan(): LearningPlan {
  const plan: LearningPlan = {
    categories: [],
    products: [],
    modules: [],
    lessons: [],
    questions: [],
    answers: [],
  };
  for (const category of categories) {
    plan.categories.push({
      id: learningId(`category/${category.key}`),
      title: category.title,
      slug: `seed-history-category-${category.key}`,
      short_description: category.short_description,
      status: CategoryStatus.published,
      deleted_at: null,
    });
  }
  for (const [courseIndex, course] of courses.entries()) {
    const key = `course/${course.key}`;
    const courseId = learningId(key);
    plan.products.push({
      id: courseId,
      title: course.title,
      slug: `seed-history-course-${course.key}`,
      category_id: plan.categories[course.category].id,
      short_description: course.context,
      description: `${course.title}\n\n${course.context}\n\nLộ trình: ba module; mỗi module có hai bài đọc và một bài kiểm tra năm câu.\n\n${CREDIT}`,
      thumbnail: THUMBNAIL,
      label: ProductLabel.new,
      status: ProductStatus.published,
      requirements:
        'Dành cho học sinh lớp 6–9. Biết đọc trục thời gian, phân biệt trước và sau Công nguyên; có thể dùng bản đồ Việt Nam và ghi chép câu hỏi cần đối chiếu. Không yêu cầu học trước toàn bộ lịch sử các triều đại.',
      learning_outcomes: course.outcomes,
      preview_video: null,
      deleted_at: null,
    });
    for (const [moduleIndex, unit] of course.units.entries()) {
      const moduleKey = `${key}/module/${moduleIndex + 1}`;
      const moduleId = learningId(moduleKey);
      plan.modules.push({
        id: moduleId,
        course_id: courseId,
        title: `Module ${moduleIndex + 1} — ${MODULE_TITLES[moduleIndex]}`,
        short_description: unit.focus,
        order: moduleIndex + 1,
        status: ModuleStatus.published,
        deleted_at: null,
      });
      for (const [lessonIndex, reading] of unit.readings.entries()) {
        plan.lessons.push({
          id: learningId(`${moduleKey}/lesson/${lessonIndex + 1}`),
          module_id: moduleId,
          title: reading.title,
          description: readingText(course, reading),
          type: LessonType.content,
          order: lessonIndex + 1,
          is_previewable: moduleIndex === 0 && lessonIndex === 0,
          status: LessonStatus.published,
          attachment: null,
          deleted_at: null,
        });
      }
      const quizKey = `${moduleKey}/lesson/3`;
      const quizId = learningId(quizKey);
      plan.lessons.push({
        id: quizId,
        module_id: moduleId,
        title: `Ôn tập ${moduleIndex + 1}: ${course.title.split(' — ')[0]}`,
        description: `Đọc lại hai bài trong module: ${unit.focus} Chọn đúng một đáp án cho mỗi câu. Có năm câu; mỗi câu đúng được một điểm theo cơ chế chấm hiện có. Sau khi trả lời, hãy đối chiếu phần giải thích và ghi lại điều cần ôn.`,
        type: LessonType.quiz,
        order: 3,
        is_previewable: false,
        status: LessonStatus.published,
        attachment: null,
        deleted_at: null,
      });
      for (const [questionIndex, question] of unit.quiz.entries()) {
        const questionKey = `${quizKey}/question/${questionIndex + 1}`;
        const questionId = learningId(questionKey);
        plan.questions.push({
          id: questionId,
          lesson_id: quizId,
          question: question.question,
          explanation: question.explanation,
          deleted_at: null,
        });
        const offset = (courseIndex + moduleIndex + questionIndex) % 4;
        const options = [question.correct, ...question.wrong];
        const rotated = [...options.slice(offset), ...options.slice(0, offset)];
        rotated.forEach((answer, i) =>
          plan.answers.push({
            id: learningId(`${questionKey}/answer/${i + 1}`),
            quiz_question_id: questionId,
            answer,
            is_correct: answer === question.correct,
            deleted_at: null,
          }),
        );
      }
    }
  }
  return plan;
}

export function validateLearningPlan(plan: LearningPlan): {
  minWords: number;
  maxWords: number;
} {
  const expect = (ok: boolean, message: string): void => {
    if (!ok) throw new LearningSeedError(message);
  };
  const counts = {
    categories: 3,
    products: 6,
    modules: 18,
    lessons: 54,
    questions: 90,
    answers: 360,
  };
  const allIds = new Set<string>();
  for (const name of Object.keys(counts) as (keyof LearningPlan)[]) {
    expect(plan[name].length === counts[name], `Unexpected count: ${name}`);
    for (const row of plan[name]) {
      expect(
        /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/.test(
          row.id,
        ),
        `Invalid deterministic ID: ${name}`,
      );
      expect(!allIds.has(row.id), `Duplicate ID: ${name}`);
      allIds.add(row.id);
      for (const [field, value] of Object.entries(row)) {
        if (typeof value === 'string')
          expect(value.trim().length > 0, `Empty ${name}.${field}`);
      }
      if ('status' in row)
        expect(row.status === 'published', `Unpublished ${name}`);
      if ('deleted_at' in row)
        expect(row.deleted_at === null, `Deleted ${name}`);
    }
  }
  const uniqueSlugs = new Set<string>();
  for (const row of [...plan.categories, ...plan.products]) {
    expect(
      /^seed-history-(category|course)-[a-z0-9-]+$/.test(row.slug),
      'Invalid slug namespace',
    );
    expect(!uniqueSlugs.has(row.slug), 'Duplicate slug');
    uniqueSlugs.add(row.slug);
    expect(
      row.title.length <= ('category_id' in row ? 255 : 150),
      'Title too long',
    );
    expect(
      row.slug.length <= ('category_id' in row ? 255 : 150),
      'Slug too long',
    );
  }
  const categoryIds = new Set(plan.categories.map((c) => c.id));
  const productIds = new Set(plan.products.map((p) => p.id));
  const moduleIds = new Set(plan.modules.map((m) => m.id));
  const lessonIds = new Set(plan.lessons.map((l) => l.id));
  const questionIds = new Set(plan.questions.map((q) => q.id));
  for (const p of plan.products) {
    expect(categoryIds.has(p.category_id), 'Product category missing');
    expect(
      p.label === ProductLabel.new &&
        p.thumbnail === THUMBNAIL &&
        p.thumbnail.length <= 255,
      'Invalid course label/thumbnail',
    );
    expect(
      new URL(p.thumbnail).protocol === 'https:' && p.preview_video === null,
      'Unexpected video/asset',
    );
  }
  for (const m of plan.modules)
    expect(productIds.has(m.course_id), 'Module parent missing');
  for (const l of plan.lessons) {
    expect(moduleIds.has(l.module_id), 'Lesson parent missing');
    expect(
      l.type === LessonType.content || l.type === LessonType.quiz,
      'Invalid lesson type',
    );
    expect(l.attachment === null, 'Unexpected attachment');
  }
  for (const q of plan.questions) {
    expect(lessonIds.has(q.lesson_id), 'Quiz parent missing');
    expect(
      plan.lessons.find((l) => l.id === q.lesson_id)?.type === LessonType.quiz,
      'Question attached to non-quiz lesson',
    );
    expect(Boolean(q.explanation?.trim()), 'Missing explanation');
  }
  for (const a of plan.answers)
    expect(questionIds.has(a.quiz_question_id), 'Answer parent missing');
  for (const category of plan.categories)
    expect(
      plan.products.filter((p) => p.category_id === category.id).length === 2,
      'Expected 2 courses per category',
    );
  const checkOrders = (rows: { order?: number }[], label: string) => {
    expect(
      isDeepStrictEqual(rows.map((r) => r.order).sort(), [1, 2, 3]),
      `Invalid order/count: ${label}`,
    );
  };
  for (const p of plan.products)
    checkOrders(
      plan.modules.filter((m) => m.course_id === p.id),
      p.slug,
    );
  for (const m of plan.modules) {
    const lessons = plan.lessons.filter((l) => l.module_id === m.id);
    checkOrders(lessons, m.title);
    expect(
      lessons.filter((l) => l.type === LessonType.content).length === 2 &&
        lessons.find((l) => l.order === 3)?.type === LessonType.quiz,
      'Expected two readings then a quiz',
    );
  }
  const readings = plan.lessons.filter((l) => l.type === LessonType.content);
  const quizzes = plan.lessons.filter((l) => l.type === LessonType.quiz);
  expect(
    readings.length === 36 && quizzes.length === 18,
    'Invalid lesson composition',
  );
  const questionTexts = new Set<string>();
  for (const l of quizzes)
    expect(
      plan.questions.filter((q) => q.lesson_id === l.id).length === 5,
      'Expected 5 questions per quiz',
    );
  for (const q of plan.questions) {
    const answers = plan.answers.filter((a) => a.quiz_question_id === q.id);
    expect(
      answers.length === 4 && answers.filter((a) => a.is_correct).length === 1,
      'Invalid quiz answer count',
    );
    expect(
      new Set(answers.map((a) => a.answer.trim().toLocaleLowerCase('vi')))
        .size === 4,
      'Duplicate answer choice',
    );
    expect(!questionTexts.has(q.question), 'Duplicate quiz question');
    questionTexts.add(q.question);
  }
  const wordCounts = readings.map(
    (l) => l.description.trim().split(/\s+/u).length,
  );
  expect(
    wordCounts.every((n) => n >= 300 && n <= 500),
    'Reading length outside 300–500 whitespace-separated Vietnamese units',
  );
  expect(
    plan.lessons.filter((l) => l.is_previewable).length === 6 &&
      quizzes.every((l) => !l.is_previewable),
    'Invalid preview policy',
  );
  for (const p of plan.products) {
    const firstModule = plan.modules.find(
      (m) => m.course_id === p.id && m.order === 1,
    );
    const preview = plan.lessons.filter(
      (l) => l.is_previewable && l.module_id === firstModule?.id,
    );
    expect(
      preview.length === 1 && preview[0].order === 1,
      'Only the first reading of each course may be previewable',
    );
  }
  // Internal chronology invariants, not a substitute for external historical review.
  const anchors: Record<string, number[]> = {
    'hai-ba-trung': [40, 43],
    'ngo-quyen': [938, 939],
    'ly-thuong-kiet': [1075, 1076, 1077],
    'tran-hung-dao': [1258, 1285, 1287, 1288],
    'le-loi': [1418, 1424, 1426, 1427, 1428],
    'quang-trung': [1788, 1789],
  };
  expect(courses.length === 6, 'Expected 6 authored courses');
  for (const course of courses) {
    const years = course.timeline.map((t) => t.year);
    expect(
      isDeepStrictEqual(years, anchors[course.key]),
      `Chronology mismatch: ${course.key}`,
    );
    expect(
      years[0] === course.period[0] && years.at(-1) === course.period[1],
      'Course period mismatch',
    );
    expect(
      course.units.every((u) => u.readings.length === 2 && u.quiz.length === 5),
      'Incomplete authored unit',
    );
  }
  // Comparing a fresh plan also checks ID derivation, FK mapping and every required
  // field against the authored curriculum; --check accepts no externally supplied data.
  expect(
    isDeepStrictEqual(plan, buildLearningPlan()),
    'Plan differs from deterministic authored curriculum',
  );
  return {
    minWords: Math.min(...wordCounts),
    maxWords: Math.max(...wordCounts),
  };
}

type Row = { id: string };
function missingRows<T extends Row>(
  expected: T[],
  existing: readonly Row[],
  label: string,
): T[] {
  const expectedById = new Map(expected.map((row) => [row.id, row]));
  const present = new Set<string>();
  for (const row of existing) {
    const wanted = expectedById.get(row.id);
    if (!wanted)
      throw new LearningSeedError(
        `Ownership conflict in ${label}: unexpected/manual record. No changes committed.`,
      );
    const actual = Object.fromEntries(
      Object.keys(wanted).map((key) => [
        key,
        (row as unknown as Record<string, unknown>)[key],
      ]),
    );
    if (!isDeepStrictEqual(actual, wanted)) {
      throw new LearningSeedError(
        `Content/ownership conflict in ${label} (${row.id}). Existing content, enrollment, progress and scores are preserved; no changes committed.`,
      );
    }
    present.add(row.id);
  }
  return expected.filter((row) => !present.has(row.id));
}

export async function seedLearning(
  prisma: PrismaClient,
  plan = buildLearningPlan(),
): Promise<Record<keyof LearningPlan, number>> {
  validateLearningPlan(plan);
  // Six batched createMany calls (<600 records) reduce SQL overhead. No skipDuplicates:
  // a concurrent insert or unique conflict must roll back, never silently adopt data.
  return prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(214077, 1205)`;
      const categoryIds = plan.categories.map((c) => c.id);
      const productIds = plan.products.map((p) => p.id);
      const moduleIds = plan.modules.map((m) => m.id);
      const lessonIds = plan.lessons.map((l) => l.id);
      const questionIds = plan.questions.map((q) => q.id);
      const existing = {
        categories: await tx.category.findMany({
          where: {
            OR: [
              { id: { in: categoryIds } },
              { slug: { in: plan.categories.map((c) => c.slug) } },
            ],
          },
        }),
        products: await tx.product.findMany({
          where: {
            OR: [
              { id: { in: productIds } },
              { slug: { in: plan.products.map((p) => p.slug) } },
            ],
          },
        }),
        modules: await tx.module.findMany({
          where: {
            OR: [{ id: { in: moduleIds } }, { course_id: { in: productIds } }],
          },
        }),
        lessons: await tx.lesson.findMany({
          where: {
            OR: [{ id: { in: lessonIds } }, { module_id: { in: moduleIds } }],
          },
        }),
        questions: await tx.quizQuestion.findMany({
          where: {
            OR: [{ id: { in: questionIds } }, { lesson_id: { in: lessonIds } }],
          },
        }),
        answers: await tx.quizAnswer.findMany({
          where: {
            OR: [
              { id: { in: plan.answers.map((a) => a.id) } },
              { quiz_question_id: { in: questionIds } },
            ],
          },
        }),
      };
      const missing = {
        categories: missingRows(
          plan.categories,
          existing.categories,
          'categories',
        ),
        products: missingRows(plan.products, existing.products, 'products'),
        modules: missingRows(plan.modules, existing.modules, 'modules'),
        lessons: missingRows(plan.lessons, existing.lessons, 'lessons'),
        questions: missingRows(plan.questions, existing.questions, 'questions'),
        answers: missingRows(plan.answers, existing.answers, 'answers'),
      };
      const oldCourses = new Set(existing.products.map((p) => p.id));
      const moduleCourse = new Map(
        plan.modules.map((m) => [m.id, m.course_id]),
      );
      const lessonCourse = new Map(
        plan.lessons.map((l) => [l.id, moduleCourse.get(l.module_id)]),
      );
      const questionCourse = new Map(
        plan.questions.map((q) => [q.id, lessonCourse.get(q.lesson_id)]),
      );
      const incomplete =
        missing.modules.some((m) => oldCourses.has(m.course_id)) ||
        missing.lessons.some((l) =>
          oldCourses.has(moduleCourse.get(l.module_id)!),
        ) ||
        missing.questions.some((q) =>
          oldCourses.has(lessonCourse.get(q.lesson_id)!),
        ) ||
        missing.answers.some((a) =>
          oldCourses.has(questionCourse.get(a.quiz_question_id)!),
        );
      if (incomplete)
        throw new LearningSeedError(
          'An existing seed course has missing instructional/assessment content. Refusing to alter course length or assessments; learner data preserved. No changes committed.',
        );
      // A new category/course may be added alongside identical existing ones; never
      // repair a partially edited existing course, resurrect soft-deleted rows, or
      // change a denominator used for completion. This policy applies even if no
      // learner has enrolled, so it does not depend on racing progress counts.
      if (missing.categories.length)
        await tx.category.createMany({ data: missing.categories });
      if (missing.products.length)
        await tx.product.createMany({ data: missing.products });
      if (missing.modules.length)
        await tx.module.createMany({ data: missing.modules });
      if (missing.lessons.length)
        await tx.lesson.createMany({ data: missing.lessons });
      if (missing.questions.length)
        await tx.quizQuestion.createMany({ data: missing.questions });
      if (missing.answers.length)
        await tx.quizAnswer.createMany({ data: missing.answers });
      return Object.fromEntries(
        Object.entries(missing).map(([name, rows]) => [name, rows.length]),
      ) as Record<keyof LearningPlan, number>;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 10000,
      timeout: 120000,
    },
  );
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length && !(args.length === 1 && args[0] === '--check'))
    throw new LearningSeedError(
      'Usage: node -r ts-node/register ./seed-learning.ts [--check]',
    );
  const plan = buildLearningPlan();
  const lengths = validateLearningPlan(plan);
  console.log(
    'Curriculum validated: 3 categories; 6 courses; 18 modules; 54 lessons (36 content, 18 quiz); 90 questions; 360 answers.',
  );
  console.log(
    `Readings: ${lengths.minWords}–${lengths.maxWords} whitespace-separated Vietnamese units; plain text in description.`,
  );
  for (const category of categories) {
    console.log(`Category: ${category.title}`);
    for (const course of courses.filter(
      (c) => categories[c.category].key === category.key,
    )) {
      console.log(
        `  ${course.title} (seed-history-course-${course.key}): 3 modules, 9 lessons`,
      );
      course.units.forEach((unit, i) =>
        console.log(`    ${i + 1}. ${MODULE_TITLES[i]}: ${unit.focus}`),
      );
    }
  }
  console.log(
    'Limitations: no frontend in checkout; learner API does not explicitly sort by order. Historical source websites were blocked; chronology checks are internal consistency only.',
  );
  if (args[0] === '--check') {
    console.log(
      'CHECK ONLY: no environment loading, PrismaClient, network request or database connection.',
    );
    return;
  }
  if (resolve(process.cwd()) !== resolve(__dirname))
    throw new LearningSeedError(
      'Run from /workspace/nestjs-lms (the repository root).',
    );
  await ConfigModule.forRoot({
    envFilePath: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env',
  });
  if (!process.env.DATABASE_URL?.trim())
    throw new LearningSeedError(
      'DATABASE_URL is required; no database writes attempted.',
    );
  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  });
  try {
    const counts = await seedLearning(prisma, plan);
    console.log(
      `Learning seed committed. Created: ${JSON.stringify(counts)}. Existing identical records unchanged.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}
if (require.main === module) {
  main().catch((error: unknown) => {
    const message =
      error instanceof LearningSeedError
        ? error.message
        : error instanceof Prisma.PrismaClientKnownRequestError
          ? `Prisma ${error.code}; no transaction changes committed. Check schema, uniqueness and concurrent writes.`
          : error instanceof Prisma.PrismaClientInitializationError
            ? 'Prisma initialization failed. Check DATABASE_URL and a generated engine matching this operating system.'
            : 'Unexpected learning seed failure. Check client generation and database access; no credentials are printed.';
    console.error(`Learning seed failed: ${message}`);
    process.exitCode = 1;
  });
}
