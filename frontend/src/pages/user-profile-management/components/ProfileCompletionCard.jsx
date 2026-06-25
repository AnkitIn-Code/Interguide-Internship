import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { calcProfileCompletion } from '../../../utils/profileCompletion';

/**
 * ProfileCompletionCard
 *
 * Uses the SAME calcProfileCompletion formula as the Dashboard
 * so both pages always show the same score.
 *
 * The profile prop contains: { fullName, email, location, techSkills, softSkills, … }
 */
const ProfileCompletionCard = ({ profile, onSectionEdit }) => {
  // Map the profile-page shape into the shared utility's expected shape
  const mappedProfile = {
    location:    profile?.location,
    phone:       profile?.phone,
    dateOfBirth: profile?.dateOfBirth,
    linkedinUrl: profile?.linkedinUrl,
    githubUrl:   profile?.githubUrl,
    skills:      profile?.techSkills,
    techSkills:  profile?.techSkills,
    softSkills:  profile?.softSkills,
  };
  const mappedUser = {
    name:   profile?.fullName,
    email:  profile?.email,
    // Pass resume so the 10th completion field is properly evaluated
    resume: profile?.resume,
  };

  const completionPercentage = calcProfileCompletion(mappedProfile, mappedUser);
  const isComplete = completionPercentage === 100;

  const getCompletionColor = () => {
    if (completionPercentage >= 80) return 'text-success';
    if (completionPercentage >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getCompletionBgColor = () => {
    if (completionPercentage >= 80) return 'bg-success';
    if (completionPercentage >= 60) return 'bg-warning';
    return 'bg-destructive';
  };

  // What items are still missing?
  const missingItems = [];
  if (!profile?.fullName || !profile?.email)
    missingItems.push({ section: 'personal', label: 'Complete name & email',    icon: 'User' });
  if (!profile?.phone)
    missingItems.push({ section: 'personal', label: 'Add phone number',          icon: 'Phone' });
  if (!profile?.location)
    missingItems.push({ section: 'personal', label: 'Add your location',         icon: 'MapPin' });
  if (!profile?.dateOfBirth)
    missingItems.push({ section: 'personal', label: 'Add date of birth',         icon: 'Calendar' });
  if (!profile?.linkedinUrl)
    missingItems.push({ section: 'personal', label: 'Add LinkedIn URL',          icon: 'Linkedin' });
  if (!profile?.githubUrl)
    missingItems.push({ section: 'personal', label: 'Add GitHub URL',            icon: 'Github' });
  if (!profile?.techSkills || profile.techSkills.length === 0)
    missingItems.push({ section: 'skills',   label: 'Add technical skills',      icon: 'Code' });
  if (!profile?.softSkills || profile.softSkills.length === 0)
    missingItems.push({ section: 'skills',   label: 'Add soft skills',           icon: 'Heart' });

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isComplete ? 'bg-success/10' : 'bg-warning/10'}`}>
            <Icon name={isComplete ? 'CheckCircle' : 'AlertCircle'} size={20} className={isComplete ? 'text-success' : 'text-warning'} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Profile Completion</h3>
            <p className="text-sm text-muted-foreground">
              {isComplete ? 'Your profile is complete!' : 'Complete for better matches'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${getCompletionColor()}`}>{completionPercentage}%</div>
          <div className="text-xs text-muted-foreground">Complete</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-muted rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${getCompletionBgColor()}`}
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Status */}
      {isComplete ? (
        <div className="p-4 bg-success/5 border border-success/20 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Icon name="Trophy" size={20} className="text-success" />
            <h4 className="font-medium text-success">Profile Complete!</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            Your complete profile enables highly accurate AI matching with relevant internships.
          </p>
        </div>
      ) : (
        <div>
          <h4 className="font-medium text-foreground mb-3">Complete these to improve matches:</h4>
          <div className="space-y-2">
            {missingItems.slice(0, 4).map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-3">
                  <Icon name={item.icon} size={16} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">{item.label}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onSectionEdit(item.section)} iconName="ChevronRight" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Impact note */}
      <div className="mt-6 p-4 bg-primary/5 rounded-lg">
        <div className="flex items-start space-x-2">
          <Icon name="Zap" size={16} className="text-primary mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Recommendation Impact</p>
            <p>
              {completionPercentage >= 80
                ? 'Your complete profile enables highly accurate AI matching.'
                : completionPercentage >= 60
                ? 'Good progress! Complete remaining sections for more precise recommendations.'
                : 'Complete more sections to unlock better internship matching.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletionCard;