import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import HelpDeskWidget from '../../components/ui/HelpDeskWidget';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import PersonalDetailsSection from './components/PersonalDetailsSection';
import SkillsSection from './components/SkillsSection';
import PrivacySettingsSection from './components/PrivacySettingsSection';
import ProfileCompletionCard from './components/ProfileCompletionCard';
import { userAPI, skillsAPI } from '../../services/api';

const UserProfileManagement = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({});
  const [editingSections, setEditingSections] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/user-login');
      return;
    }
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const res = await userAPI.getProfile();
        if (res?.user) {
          const u = res.user;
          // Fetch separate skills doc
          let separateSkills = { techSkills: [], softSkills: [] };
          try {
            const sk = await skillsAPI.get();
            // Backend returns { skills: [...merged], technicalSkills: [...], softSkills: [...] }
            if (sk?.technicalSkills || sk?.softSkills) {
              separateSkills = {
                techSkills: Array.isArray(sk.technicalSkills) ? sk.technicalSkills : [],
                softSkills: Array.isArray(sk.softSkills)      ? sk.softSkills      : [],
              };
            }
          } catch {}
          setProfile({
            fullName:    u?.name,
            email:       u?.email,
            location:    u?.profile?.location    || '',
            phone:       u?.profile?.phone       || '',
            dateOfBirth: u?.profile?.dateOfBirth || '',
            linkedinUrl: u?.profile?.linkedinUrl || '',
            githubUrl:   u?.profile?.githubUrl   || '',
            techSkills:  Array.isArray(separateSkills.techSkills) && separateSkills.techSkills.length > 0
              ? separateSkills.techSkills
              : (Array.isArray(u?.profile?.skills) ? u.profile.skills : []),
            softSkills:  Array.isArray(separateSkills.softSkills) ? separateSkills.softSkills : [],
            // Pass resume so ProfileCompletionCard can count it toward the 10th field
            resume:      u?.resume || null,
            privacy: {}
          });
          setLastUpdated(new Date()?.toISOString());
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const handleSectionUpdate = async (section, data) => {
    try {
      let update = {};
      if (section === 'personalDetails') {
        // Send all personal detail fields so they persist to DB
        update.name        = data?.fullName  || '';
        update.location    = data?.location  || '';
        update.phone       = data?.phone     || '';
        update.dateOfBirth = data?.dateOfBirth || '';
        update.linkedinUrl = data?.linkedinUrl || '';
        update.githubUrl   = data?.githubUrl   || '';
      }
      if (section === 'skills') {
        const tech = Array.isArray(data?.techSkills) ? data.techSkills : [];
        const soft = Array.isArray(data?.softSkills) ? data.softSkills : [];
        // Skills go through the dedicated /api/skills endpoint (not /api/auth/profile)
        // which properly handles both technicalSkills and softSkills
        try { await skillsAPI.save({ techSkills: tech, softSkills: soft }); } catch (e) {
          console.error('Failed to save skills', e);
        }
        // Update local state directly (res.user won't have the new skills from auth/profile)
        setProfile(prev => ({ ...prev, techSkills: tech, softSkills: soft }));
        setLastUpdated(new Date()?.toISOString());
        return; // skills are saved — skip the generic updateProfile path
      }
      const res = await userAPI.updateProfile(update);
      if (res?.user) {
        setProfile(prev => ({
          ...prev,
          ...(section === 'personalDetails' ? {
            fullName:    update.name,
            location:    update.location,
            phone:       update.phone,
            dateOfBirth: update.dateOfBirth,
            linkedinUrl: update.linkedinUrl,
            githubUrl:   update.githubUrl,
          } : {}),
        }));
        setLastUpdated(new Date()?.toISOString());
      }
    } catch (e) {
      console.error('Failed to update profile section', section, e);
    }
  };

  const toggleSectionEdit = (section) => {
    setEditingSections(prev => ({
      ...prev,
      [section]: !prev?.[section]
    }));
  };

  const handleSectionEdit = (section) => {
    const sectionMap = {
      personal: 'personalDetails',
      skills: 'skills',
      privacy: 'privacy'
    };
    
    const mappedSection = sectionMap?.[section] || section;
    toggleSectionEdit(mappedSection);
    
    const element = document.getElementById(`section-${mappedSection}`);
    if (element) {
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="space-y-6">
            {[1, 2, 3]?.map((i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-6">
                <div className="animate-pulse space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-muted rounded-lg"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-32"></div>
                      <div className="h-3 bg-muted rounded w-48"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-12 bg-muted rounded"></div>
                    <div className="h-12 bg-muted rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Profile Management</h1>
              <p className="text-muted-foreground">
                Keep your profile updated for better recommendations
              </p>
              {lastUpdated && (
                <p className="text-sm text-muted-foreground mt-1">
                  Last updated: {new Date(lastUpdated)?.toLocaleString()}
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => navigate('/job-search')}
                iconName="Search"
                iconPosition="left"
              >
                Discover Jobs
              </Button>
              <Button
                variant="default"
                onClick={() => navigate('/main-dashboard')}
                iconName="LayoutDashboard"
                iconPosition="left"
              >
                Dashboard
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Personal Details Section */}
            <div id="section-personalDetails">
              <PersonalDetailsSection
                profile={profile}
                onUpdate={handleSectionUpdate}
                isEditing={editingSections?.personalDetails}
                onToggleEdit={() => toggleSectionEdit('personalDetails')}
              />
            </div>

            {/* Skills Section */}
            <div id="section-skills">
              <SkillsSection
                profile={profile}
                onUpdate={handleSectionUpdate}
                isEditing={editingSections?.skills}
                onToggleEdit={() => toggleSectionEdit('skills')}
              />
            </div>

            {/* Privacy Settings */}
            <div id="section-privacy">
              <PrivacySettingsSection
                profile={profile}
                onUpdate={handleSectionUpdate}
                isEditing={editingSections?.privacy}
                onToggleEdit={() => toggleSectionEdit('privacy')}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Profile Completion Card */}
              <ProfileCompletionCard
                profile={profile}
                onSectionEdit={handleSectionEdit}
              />

              {/* Quick Actions */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => navigate('/application-tracker')}
                    iconName="ClipboardList"
                    iconPosition="left"
                  >
                    Track Applications
                  </Button>
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => navigate('/job-search')}
                    iconName="Search"
                    iconPosition="left"
                  >
                    Discover Jobs
                  </Button>
                  <Button
                    variant="ghost"
                    fullWidth
                    onClick={() => window.print()}
                    iconName="Download"
                    iconPosition="left"
                  >
                    Export Profile
                  </Button>
                </div>
              </div>

              {/* Profile Tips */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Icon name="Lightbulb" size={20} className="text-accent" />
                  <h3 className="text-lg font-semibold text-foreground">Profile Tips</h3>
                </div>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start space-x-2">
                    <Icon name="Check" size={14} className="text-success mt-0.5" />
                    <p>Keep your skills updated to match current industry trends</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Icon name="Check" size={14} className="text-success mt-0.5" />
                    <p>Add both technical and soft skills for better matching</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Icon name="Check" size={14} className="text-success mt-0.5" />
                    <p>Set your location to get local job recommendations</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Icon name="Check" size={14} className="text-success mt-0.5" />
                    <p>Review privacy settings to control data sharing</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <HelpDeskWidget />
    </div>
  );
};

export default UserProfileManagement;