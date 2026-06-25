// Simple matcher based on Jaccard similarity or overlap
const calculateMatchScore = (userSkills, jobSkills) => {
  if (!jobSkills || jobSkills.length === 0) return 0;
  if (!userSkills || userSkills.length === 0) return 0;

  const userSkillsLower = userSkills.map(s => s.toLowerCase());
  const jobSkillsLower = jobSkills.map(s => s.toLowerCase());

  let matchCount = 0;
  for (const js of jobSkillsLower) {
    // In a real advanced system, we'd use vector embeddings for fuzzy matching.
    // For this implementation, we'll do exact string matching and partial string matching.
    if (userSkillsLower.some(us => us.includes(js) || js.includes(us))) {
      matchCount++;
    }
  }

  const score = Math.round((matchCount / jobSkillsLower.length) * 100);
  return score > 100 ? 100 : score;
};

const generateExplanation = (userSkills, jobSkills, score) => {
  if (score === 0) return "This internship requires skills that are not currently on your profile. Consider adding them if you have experience!";
  if (score > 80) return "Excellent match! Your skills align perfectly with the core requirements for this role.";
  if (score > 50) return "Good match. You have several of the required skills, but there's room to grow.";
  return "Fair match. You have a few relevant skills, but might need to upskill in some areas for this specific role.";
};

module.exports = { calculateMatchScore, generateExplanation };
