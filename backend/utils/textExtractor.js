const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const extractTextFromPDF = async (filePath) => {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text;
};

const extractTextFromDOCX = async (filePath) => {
  const buffer = fs.readFileSync(filePath);
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
};

const extractText = async (filePath, fileType) => {
  if (fileType === 'pdf') {
    return extractTextFromPDF(filePath);
  } else if (fileType === 'docx') {
    return extractTextFromDOCX(filePath);
  }
  throw new Error('Unsupported file type');
};

module.exports = { extractText, extractTextFromPDF, extractTextFromDOCX };
