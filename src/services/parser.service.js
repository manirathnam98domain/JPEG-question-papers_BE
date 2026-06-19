// src/services/parser.service.js

export function structureRawTextToJSON(rawText) {
  try {
    if (!rawText || rawText.trim().length === 0) {
      throw new Error('Parser received empty string or unreadable document layers.');
    }

    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    const structuredResult = {
      processedAt: new Date().toISOString(),
      questions: []
    };

    let activeQuestion = null;

    lines.forEach((line) => {
      // 1. Identify Question Headers (e.g., "Q1:", "Question: 1", "Question 1")
      const questionRegex = /^(Q\d+[:.]?|Question\s*:\s*\d+|Question\s+\d+|\d+[\).:-])/i;
      const isNewQuestion = questionRegex.test(line);

      if (isNewQuestion) {
        if (activeQuestion) {
          finalizeQuestion(activeQuestion, structuredResult.questions);
        }
        
        activeQuestion = {
          id: structuredResult.questions.length + 1,
          header: line,
          questionText: '',
          options: [],
          correctAnswer: null
        };
      } else if (activeQuestion) {
        // 2. Identify "Correct Answer:" lines
        const correctAnswerRegex = /^(Correct\s+Answer\s*:\s*)(.*)/i;
        
        if (correctAnswerRegex.test(line)) {
          const match = line.match(correctAnswerRegex);
          activeQuestion.correctAnswer = match[2].trim();
          return;
        }

        // 3. Identify Multi-Line Options (e.g., "A. Text", "B) Text", "4. Text")
        const multiLineOptionRegex = /^([A-E]|[41hiR])[\).:-]\s+/i;
        
        if (multiLineOptionRegex.test(line)) {
          let cleanedOption = line;
          if (/^4[\).:-]/i.test(line)) {
            cleanedOption = line.replace(/^4([\).:-])/i, 'A$1');
          }
          activeQuestion.options.push(cleanedOption);
          return;
        }

        // 4. Fallback: If it's a normal body line, check if it contains *inline* options
        // (Matches "Option 1:", "Option 2:", etc. within the same string block)
        if (/Option\s+\d+[:.-]/i.test(line)) {
          // Parse single-line combined options using regex splitting
          const inlineTokens = line.split(/(?=Option\s+\d+[:.-])/i);
          
          inlineTokens.forEach(token => {
            const trimmedToken = token.trim();
            if (/^Option\s+\d+[:.-]/i.test(trimmedToken)) {
              activeQuestion.options.push(trimmedToken);
            } else if (trimmedToken.length > 0) {
              // Append any prefix text to the question text
              activeQuestion.questionText += ` ${trimmedToken}`;
            }
          });
        } else {
          // Standard text append
          if (activeQuestion.questionText === '') {
            activeQuestion.questionText = line;
          } else {
            activeQuestion.questionText += ` ${line}`;
          }
        }
      }
    });

    // Handle final item
    if (activeQuestion) {
      finalizeQuestion(activeQuestion, structuredResult.questions);
    }

    return structuredResult;
  } catch (error) {
    throw new Error(`Data Structuring Fault: ${error.message}`);
  }
}

/**
 * Normalizes question texts and ensures arrays are built safely before pushing
 */
function finalizeQuestion(question, targetArray) {
  question.questionText = question.questionText.trim();
  
  // If the header itself contains the entire question text (like in your image), 
  // clean up the structure so it reads beautifully.
  if (question.questionText === '' && question.header.includes('?')) {
    const parts = question.header.split(/(?<=\?)/); // Splits right after the question mark
    question.header = parts[0].trim();
    if (parts[1]) {
      question.questionText = parts[1].trim();
    }
  }
  
  targetArray.push(question);
}