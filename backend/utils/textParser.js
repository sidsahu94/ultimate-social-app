/**
 * Safe Post Text Parser Subsystem
 * Resolves SEC-APP-002 ReDoS loops via non-backtracking evaluation strategies.
 */

exports.parsePostContent = (textInput) => {
  if (!textInput || typeof textInput !== 'string') {
    return { hashtags: [], mentions: [] };
  }

  // Defend loop tasks by truncating excessive payloads early
  const safeTextBody = textInput.substring(0, 4000);

  // Assert basic bounded quantifiers to match values explicitly
  const hashtagScanningRegex = /#([a-zA-Z0-9_]{1,30})/g;
  const mentionScanningRegex = /@([a-zA-Z0-9_]{1,30})/g;

  const parsedHashtagCollection = [];
  const parsedUserMentionCollection = [];
  let evaluationIterator;

  while ((evaluationIterator = hashtagScanningRegex.exec(safeTextBody)) !== null) {
    parsedHashtagCollection.push(evaluationIterator[1].toLowerCase());
  }

  while ((evaluationIterator = mentionScanningRegex.exec(safeTextBody)) !== null) {
    parsedUserMentionCollection.push(evaluationIterator[1]);
  }

  return {
    hashtags: Array.from(new Set(parsedHashtagCollection)),
    mentions: Array.from(new Set(parsedUserMentionCollection))
  };
};