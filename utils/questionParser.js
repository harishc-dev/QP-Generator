
const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

const chapterNames = {
  '1': 'Units and Measurements',
  '2': 'Motion in a Straight Line',
  '3': 'Motion in a Plane',
  '4': 'Laws of Motion',
  '5': 'Work, Energy and Power',
  '6': 'System of Particles and Rotational Motion',
  '7': 'Gravitation',
  '8': 'Mechanical Properties of Solids',
  '9': 'Mechanical Properties of Fluids',
  '10': 'Thermal Properties of Matter',
  '11': 'Thermodynamics',
  '12': 'Kinetic Theory',
  '13': 'Oscillations',
  '14': 'Waves',
};

const romanTypeMap = {
  I: 'mcq', Ⅰ: 'mcq',
  II: 'assertion', Ⅱ: 'assertion',
  III: 'short', Ⅲ: 'short',
  IV: 'qa', Ⅳ: 'qa',
  V: 'long', Ⅴ: 'long',
  VI: 'case', Ⅵ: 'case',
};


async function parseQuestions(folderPath) {
  const lessons = {};
  const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.docx'));

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const buffer = fs.readFileSync(filePath);
    const { value } = await mammoth.extractRawText({ buffer });

    let text = value
      .replace(/\r\n?/g, '\n')
      .replace(/\u00A0/g, ' ')
      .replace(/–/g, '-')
      .replace(/[ \t]+$/gm, '')
      .replace(/^[ \t]+/gm, '')
      .trim();

    const chapters = text.split(/(?=Chapter\s*[:\-]\s*\d+)/i);
    for (const chapterBlock of chapters) {
      const chapMatch = chapterBlock.match(/Chapter\s*[:\-]\s*(\d+)/i);
      if (!chapMatch) continue;
      const chapterNum = chapMatch[1].trim();
      const lessonName = chapterNames[chapterNum] || `Lesson ${chapterNum}`;

      if (!lessons[lessonName])
        lessons[lessonName] = { mcq: [], assertion: [], short: [], qa: [], long: [], case: [] };

      const sections = chapterBlock.split(/(?=^\s*(I{1,3}|IV|V|VI|Ⅰ|Ⅱ|Ⅲ|Ⅳ|Ⅴ|Ⅵ)\s*$)/gmi);
      for (const section of sections) {
        const romanMatch = section.match(/^\s*(I{1,3}|IV|V|VI|Ⅰ|Ⅱ|Ⅲ|Ⅳ|Ⅴ|Ⅵ)\s*$/m);
        if (!romanMatch) continue;

        const roman = romanMatch[1];
        const type = romanTypeMap[roman];
        if (!type) continue;

  const lines = section.split('\n');
  const qStart = /^\s*(\d+)[\.\):]\s*(.*)$/; 
  const ansStart = /^\s*Ans\s*[:\.]\s*(.*)$/i; 
 
  const trueMark = /^\s*(?:\[\s*)?True(?:\s*\])?\s*$/i; 

  let currentQ = [];
  let currentA = [];
  let sawAns = false;
  let boosted = false;
  let weight = 1;

        const flush = () => {
          if (currentQ.length === 0) return;
          const questionText = currentQ.join(' ').trim();
          const answerText = currentA.join(' ').trim();

          lessons[lessonName][type].push({
            question: questionText,
            answer: answerText,
            boosted, 
            weight,  
          });

          currentQ = [];
          currentA = [];
          sawAns = false;
          boosted = false;
          weight = 1;
        };

        for (const ln of lines) {
          const line = ln.trim();
          if (!line) continue;

          if (trueMark.test(line)) {
            boosted = true;
            weight = 3;
            continue;
          }

          const qMatch = line.match(qStart);
          if (qMatch) {
            flush();
            currentQ.push(qMatch[2].trim());
            continue;
          }

          const aMatch = line.match(ansStart);
          if (aMatch) {
            sawAns = true;
            currentA.push(aMatch[1].trim());
            continue;
          }

          if (sawAns) currentA.push(line);
          else if (currentQ.length > 0) currentQ.push(line);
        }

        flush();
      }
    }
  }

  return lessons;
}

module.exports = { parseQuestions };
