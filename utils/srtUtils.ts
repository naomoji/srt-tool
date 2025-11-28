import { SubtitleItem } from '../types';

/**
 * 配置特殊处理词汇 (参考 sentence_case.js)
 */
const specialCases = {
  // 始终全大写
  preserveCase: ["BBQ", "NASA", "FBI"],
  // 首字母始终大写
  capitalizeAlways: ["I", "I'm", "I've", "I'd", "I'll", "Node.js"],
  // 专有名词 （单词 + 多词短语）
  properNouns: [
      // 星期、月份
      "Monday", "Tuesday", "Wednesday", "Thursday", "Friday",
      "Saturday", "Sunday",
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
      // 人名
      "John", "Mary", "Grace", "Ambrosius", "Emily",
      "Kevin", "Toby", "Cory", "Josh", "Chrissy",
      "Jack", "Steven", "Danya", "Van", "Vanessa", "Amber",
      "Kev", "Adam",
      "Ambrosius Vallin", "Kevin Archer", 
      // 地名
      "New York", "Dante's Cove", "Dante's", "Hotel Dante",
      // 缩写
      "Dr", "Mr", "Mrs", "Ms", "Prof", "Ave", "St", "Rd",
      "a.m.", "p.m.", "etc.", "e.g.",
      // 其他
      "Voodoo Cults"
  ]
};

// 预处理替换映射表
const replacements = new Map<string, string>();
[...specialCases.preserveCase, ...specialCases.capitalizeAlways, ...specialCases.properNouns.filter(p => !p.includes(' '))]
  .forEach(word => {
      replacements.set(word.toLowerCase(), word);
  });

// 预处理多词短语正则
const multiWordRegexMap = new Map<string, RegExp>();
specialCases.properNouns
  .filter(phrase => phrase.includes(' '))
  .forEach(phrase => {
      const escapedPhrase = phrase.toLowerCase()
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          .replace(/\s+/g, '\\s+');
      multiWordRegexMap.set(phrase, new RegExp(`\\b${escapedPhrase}\\b`, 'gi'));
  });

// 单词匹配正则
const escapedKeys = [...replacements.keys()].map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
const wordRegex = new RegExp(`\\b(${escapedKeys.join('|')})\\b`, 'gi');

// 句子首字母大写正则
const sentenceCapitalizeRegex = /(^\s*\w|[.!?;:\]\}]\s*\w|\n\s*\w|\r\n\s*\w)/g;

/**
 * 核心格式化逻辑 (参考 sentence_case.js)
 */
const applySentenceCase = (text: string): string => {
  // 1. 转为全小写，并将句子首字母大写
  let result = text.toLowerCase().replace(sentenceCapitalizeRegex, c => c.toUpperCase());

  // 2. 替换特殊单词
  result = result.replace(wordRegex, match => replacements.get(match.toLowerCase()) || match);

  // 3. 替换多词短语
  multiWordRegexMap.forEach((regex, phrase) => {
      result = result.replace(regex, phrase);
  });

  return result;
};

/**
 * 解析 SRT 文件内容
 */
export const parseSRT = (content: string): SubtitleItem[] => {
  const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalizedContent.split('\n\n');
  const subtitles: SubtitleItem[] = [];

  blocks.forEach((block) => {
    const lines = block.trim().split('\n');
    if (lines.length >= 3) {
      const id = parseInt(lines[0], 10);
      const timeLine = lines[1];
      const timeMatch = timeLine.match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);
      
      if (timeMatch) {
        const textLines = lines.slice(2);
        const originalText = textLines.join('\n');
        
        if (!isNaN(id)) {
          subtitles.push({
            id,
            startTime: timeMatch[1],
            endTime: timeMatch[2],
            originalText,
            formattedText: null
          });
        }
      }
    }
  });

  return subtitles;
};

/**
 * 综合格式化函数
 * 1. 去除 [] {} <>
 * 2. 合并断句（如果行尾无标点）
 * 3. 应用 Sentence Case 及特殊词汇库
 */
export const formatText = (text: string): string => {
  if (!text) return '';

  // 1. 去除括号内容 [] {} <>
  let cleaned = text.replace(/\[.*?\]|\{.*?\}|<.*?>/g, '').trim();
  if (!cleaned) return '';

  // 2. 合并断行逻辑
  const lines = cleaned.split('\n');
  let mergedText = '';

  if (lines.length > 0) {
    mergedText = lines[0].trim();
    for (let i = 1; i < lines.length; i++) {
      const prevLine = lines[i - 1].trim();
      const currentLine = lines[i].trim();
      
      // 检查上一行结尾是否为结束标点
      const isEndPunctuation = /[.?!。？！]$/.test(prevLine);
      
      if (!isEndPunctuation) {
        mergedText += ' ' + currentLine;
      } else {
        mergedText += '\n' + currentLine;
      }
    }
  }

  // 3. 应用高级 Sentence Case 格式化
  return applySentenceCase(mergedText);
};

export const processSubtitles = (subs: SubtitleItem[]): SubtitleItem[] => {
  return subs.map(sub => ({
    ...sub,
    formattedText: formatText(sub.originalText)
  }));
};