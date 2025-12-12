
const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} = require('docx');

const SECTION_MAP = [
  { key: 'mcq', name: 'SECTION - A', roman: 'I', marks: 1 },
  { key: 'assertion', name: 'SECTION - B', roman: 'II', marks: 1 },
  { key: 'short', name: 'SECTION - C', roman: 'III', marks: 2 },
  { key: 'qa', name: 'SECTION - D', roman: 'IV', marks: 3 },
  { key: 'long', name: 'SECTION - E', roman: 'V', marks: 5 },
  { key: 'case', name: 'SECTION - F', roman: 'VI', marks: 4 },
];

function isBoosted(item) {
  return !!(item && (item.boosted === true || (typeof item.weight === 'number' && item.weight > 1)));
}

function getSection(type) {
  if (!type) return null;
  const t = type.toLowerCase();
  return SECTION_MAP.find((s) => t.includes(s.key));
}

async function generateDocx(data, outDir) {
  const {
    title = 'Question_Paper',
    includeAnswers = false,
    items = [],
    schoolInfo = {},
  } = data;

  const defaultSchoolInfo = {
    name: 'VIVEKANANDHA ACADEMY',
    subTitle: 'Senior Secondary School',
    academicYear: 'ACADEMIC YEAR 2025-26',
    examTitle: 'MONTHLY TEST - 2',
    subject: 'PHYSICS',
    grade: 'Grade : XI - B',
    maxMarks: 'Max. Marks : 70',
    time: 'Time : 180 min',
  };
  const s = { ...defaultSchoolInfo, ...schoolInfo };

  const children = [];

  children.push(
    new Paragraph({
      children: [new TextRun({ text: s.name, bold: true, size: 44 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
    }),
    new Paragraph({
      children: [new TextRun({ text: s.subTitle, bold: true, size: 28 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 90 },
    }),
    new Paragraph({
      children: [new TextRun({ text: s.academicYear, bold: true, size: 26 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 90 },
    }),
    new Paragraph({
      children: [new TextRun({ text: s.examTitle, bold: true, size: 26 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 90 },
    }),
    new Paragraph({
      children: [new TextRun({ text: s.subject, bold: true, size: 26 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: s.grade, size: 24 }),
        new TextRun({ text: '          ' + s.maxMarks, size: 24 }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Date: __________', size: 24 }),
        new TextRun({ text: '          ' + s.time, size: 24 }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 120 },
    })
  );

  const sectionQuestions = {};
  for (const q of items) {
    const sec = getSection(q.type);
    if (!sec) continue;
    if (!sectionQuestions[sec.roman]) sectionQuestions[sec.roman] = { ...sec, questions: [] };
    sectionQuestions[sec.roman].questions.push(q);
  }

  const romanOrder = ['I', 'II', 'III', 'IV', 'V', 'VI'];

  for (const roman of romanOrder) {
    const sec = sectionQuestions[roman];
    if (!sec || sec.questions.length === 0) continue;

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${sec.name} (${roman})`,
            bold: true,
            underline: {},
            size: 28,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 300, after: 150 },
      })
    );

    const questions = sec.questions.slice().sort((a, b) => Number(isBoosted(b)) - Number(isBoosted(a)));

    const rows = questions.map((q, idx) => {
      const qParts = [
        new TextRun({ text: `${idx + 1}. `, bold: true, size: 24 }),
        new TextRun({ text: q.question || '', size: 24 }),
      ];

      const cellParas = [
        new Paragraph({
          children: qParts,
          spacing: { after: 40 },
          alignment: AlignmentType.LEFT,
        }),
      ];

      if (includeAnswers && q.answer) {
        cellParas.push(
          new Paragraph({
            children: [new TextRun({ text: `Ans: ${q.answer}`, italics: true, size: 22 })],
            spacing: { after: 20 },
          })
        );
      }


      return new TableRow({
        children: [
          new TableCell({
            width: { size: 90, type: WidthType.PERCENTAGE },
            children: cellParas,
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
              left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
              right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
            },
            margins: { top: 100, bottom: 100, left: 100, right: 100 },
          }),
          new TableCell({
            width: { size: 10, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [new TextRun({ text: `${sec.marks}`, bold: true, size: 24 })],
                alignment: AlignmentType.CENTER,
              }),
            ],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
              left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
              right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
            },
          }),
        ],
      });
    });

    if (rows.length > 0) {
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows,
        })
      );
      children.push(new Paragraph({ children: [], spacing: { after: 120 } }));
    }
  }

  const doc = new Document({
    creator: 'QPGen Electron',
    title: title || 'Question Paper',
    description: 'Auto-generated question paper',
    styles: {
      default: {
        document: {
          run: { font: 'Times New Roman', size: 24 },
          paragraph: { spacing: { line: 276 } },
        },
      },
    },
    sections: [
      {
        properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const safeTitle = (title || 'QP').toString().replace(/[^\w\-]/g, '_');
  const fileName = `${safeTitle}_${Date.now()}.docx`;
  const outPath = path.join(outDir || '.', fileName);
  fs.writeFileSync(outPath, buffer);
  return outPath;
}

module.exports = { generateDocx };
