/**
 * profileCompletion.js
 *
 * Single source of truth for profile completion score.
 * Used by Dashboard AND Profile Management page — always same %.
 *
 * Fields checked (10 points each = 100% total):
 *   1.  name / fullName             (10%)
 *   2.  email                       (10%)
 *   3.  phone                       (10%)
 *   4.  location                    (10%)
 *   5.  dateOfBirth                 (10%)
 *   6.  linkedinUrl                 (10%)
 *   7.  githubUrl                   (10%)
 *   8.  at least 1 tech skill       (10%)
 *   9.  at least 1 soft skill       (10%)
 *   10. resume uploaded             (10%)
 */

export const calcProfileCompletion = (profile = {}, user = {}) => {
  const fields = [
    // 1. name
    !!(user?.name || profile?.fullName || profile?.name),
    // 2. email
    !!(user?.email || profile?.email),
    // 3. phone
    !!(profile?.phone),
    // 4. location
    !!(profile?.location),
    // 5. dateOfBirth
    !!(profile?.dateOfBirth),
    // 6. linkedinUrl
    !!(profile?.linkedinUrl),
    // 7. githubUrl
    !!(profile?.githubUrl),
    // 8. at least one tech skill (check profile.skills, user.technicalSkills, or techSkills)
    !!(
      (Array.isArray(profile?.skills) && profile.skills.length > 0) ||
      (Array.isArray(profile?.techSkills) && profile.techSkills.length > 0) ||
      (Array.isArray(user?.technicalSkills) && user.technicalSkills.length > 0)
    ),
    // 9. at least one soft skill
    !!(
      (Array.isArray(profile?.softSkills) && profile.softSkills.length > 0) ||
      (Array.isArray(user?.softSkills) && user.softSkills.length > 0)
    ),
    // 10. resume uploaded
    !!(
      user?.resume?.text ||
      (Array.isArray(user?.resume?.skills) && user.resume.skills.length > 0)
    ),
  ];

  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
};

export default calcProfileCompletion;
