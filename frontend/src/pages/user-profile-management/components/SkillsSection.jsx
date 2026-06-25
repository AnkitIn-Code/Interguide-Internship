import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const SkillsSection = ({ profile, onUpdate, isEditing, onToggleEdit }) => {
  const [techSkills, setTechSkills] = useState(profile?.techSkills || []);
  const [softSkills, setSoftSkills] = useState(profile?.softSkills || []);
  const [newTechSkill, setNewTechSkill] = useState('');
  const [newSoftSkill, setNewSoftSkill] = useState('');

  // Suggested technical skills to quickly toggle like previous soft-skills grid
  const predefinedTechSkills = [
    'React', 'JavaScript', 'TypeScript', 'Node.js', 'Express', 'MongoDB', 'PostgreSQL',
    'Python', 'Django', 'Flask', 'FastAPI', 'Java', 'Spring', 'C++', 'C#', 'Go', 'Rust',
    'HTML', 'CSS', 'TailwindCSS', 'Sass', 'Redux', 'GraphQL', 'REST', 'Next.js', 'Vite',
    'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Linux', 'Git', 'CI/CD', 'Jest', 'Cypress',
    'ML', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'SQL'
  ];

  const addTechSkill = () => {
    if (newTechSkill?.trim() && !techSkills?.includes(newTechSkill?.trim())) {
      const updatedSkills = [...techSkills, newTechSkill?.trim()];
      setTechSkills(updatedSkills);
      setNewTechSkill('');
    }
  };

  const removeTechSkill = (skillToRemove) => {
    const updatedSkills = techSkills?.filter(skill => skill !== skillToRemove);
    setTechSkills(updatedSkills);
  };

  const toggleTechSkill = (skill) => {
    const s = skill?.trim();
    if (!s) return;
    if (techSkills?.includes(s)) {
      setTechSkills(techSkills?.filter(k => k !== s));
    } else {
      setTechSkills([...(techSkills || []), s]);
    }
  };

  const addSoftSkill = () => {
    if (newSoftSkill?.trim() && !softSkills?.includes(newSoftSkill?.trim())) {
      const updated = [...softSkills, newSoftSkill?.trim()];
      setSoftSkills(updated);
      setNewSoftSkill('');
    }
  };

  const removeSoftSkill = (skillToRemove) => {
    setSoftSkills(softSkills?.filter(s => s !== skillToRemove));
  };

  const predefinedSoftSkills = [
    'Communication', 'Teamwork', 'Leadership', 'Problem Solving', 'Critical Thinking',
    'Time Management', 'Adaptability', 'Creativity', 'Work Ethic', 'Attention to Detail',
    'Collaboration', 'Presentation', 'Conflict Resolution', 'Mentoring', 'Decision Making',
    'Emotional Intelligence', 'Negotiation', 'Project Management', 'Research', 'Organization',
    'Self-motivated', 'Multitasking', 'Customer Service', 'Analytical Thinking',
  ];

  const toggleSoftSkill = (skill) => {
    const s = skill?.trim();
    if (!s) return;
    if (softSkills?.includes(s)) {
      setSoftSkills(softSkills?.filter(k => k !== s));
    } else {
      setSoftSkills([...(softSkills || []), s]);
    }
  };

  const handleSave = () => {
    onUpdate('skills', {
      techSkills,
      softSkills
    });
    onToggleEdit();
  };

  const handleCancel = () => {
    setTechSkills(profile?.techSkills || []);
    setSoftSkills(profile?.softSkills || []);
    setNewTechSkill('');
    setNewSoftSkill('');
    onToggleEdit();
  };

  const handleKeyPress = (e) => {
    if (e?.key === 'Enter') {
      addTechSkill();
    }
  };

  const handleSoftKeyPress = (e) => {
    if (e?.key === 'Enter') {
      addSoftSkill();
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
            <Icon name="Code" size={20} className="text-secondary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Skills</h3>
            <p className="text-sm text-muted-foreground">Manage your technical and soft skills</p>
          </div>
        </div>
        
        {!isEditing ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleEdit}
            iconName="Edit"
            iconPosition="left"
          >
            Edit
          </Button>
        ) : (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              iconName="Save"
              iconPosition="left"
            >
              Save
            </Button>
          </div>
        )}
      </div>
      <div className="space-y-8">
        {/* Technical Skills */}
        <div>
          <h4 className="text-md font-medium text-foreground mb-4">Technical Skills</h4>
          
          {isEditing && (
            <div className="flex items-center space-x-2 mb-4">
              <Input
                type="text"
                value={newTechSkill}
                onChange={(e) => setNewTechSkill(e?.target?.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a technical skill (e.g., React, Python, SQL)"
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={addTechSkill}
                iconName="Plus"
                disabled={!newTechSkill?.trim()}
              >
                Add
              </Button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {techSkills?.length > 0 ? (
              techSkills?.map((skill, index) => (
                <div
                  key={index}
                  className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm"
                >
                  <span>{skill}</span>
                  {isEditing && (
                    <button
                      onClick={() => removeTechSkill(skill)}
                      className="hover:bg-primary/20 rounded-full p-0.5 transition-colors duration-200"
                    >
                      <Icon name="X" size={14} />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm italic">No technical skills added yet</p>
            )}
          </div>

          {isEditing && (
            <div className="mt-4">
              <h5 className="text-sm font-medium text-muted-foreground mb-2">Suggested</h5>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {predefinedTechSkills?.map((skill) => {
                  const active = techSkills?.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleTechSkill(skill)}
                      className={`text-left px-3 py-2 rounded-lg border text-sm transition-all duration-200 ${
                        active
                          ? 'bg-secondary/10 border-secondary text-secondary'
                          : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{skill}</span>
                        {active && <Icon name="Check" size={14} className="text-secondary" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Soft Skills */}
        <div>
          <h4 className="text-md font-medium text-foreground mb-4">Soft Skills</h4>

          {isEditing && (
            <div className="flex items-center space-x-2 mb-4">
              <Input
                type="text"
                value={newSoftSkill}
                onChange={(e) => setNewSoftSkill(e?.target?.value)}
                onKeyPress={handleSoftKeyPress}
                placeholder="Add a soft skill (e.g., Communication, Leadership)"
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={addSoftSkill}
                iconName="Plus"
                disabled={!newSoftSkill?.trim()}
              >
                Add
              </Button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {softSkills?.length > 0 ? (
              softSkills?.map((skill, index) => (
                <div
                  key={index}
                  className="inline-flex items-center space-x-2 bg-secondary/10 text-secondary px-3 py-1.5 rounded-full text-sm"
                >
                  <span>{skill}</span>
                  {isEditing && (
                    <button
                      onClick={() => removeSoftSkill(skill)}
                      className="hover:bg-secondary/20 rounded-full p-0.5 transition-colors duration-200"
                    >
                      <Icon name="X" size={14} />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm italic">No soft skills added yet</p>
            )}
          </div>

          {/* Predefined soft skills grid — click to toggle */}
          {isEditing && (
            <div className="mt-4">
              <h5 className="text-sm font-medium text-muted-foreground mb-2">Suggested — click to add</h5>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {predefinedSoftSkills?.map((skill) => {
                  const active = softSkills?.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSoftSkill(skill)}
                      className={`text-left px-3 py-2 rounded-lg border text-sm transition-all duration-200 ${
                        active
                          ? 'bg-secondary/10 border-secondary text-secondary'
                          : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{skill}</span>
                        {active && <Icon name="Check" size={14} className="text-secondary" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      {isEditing && (
        <div className="mt-6 p-4 bg-accent/10 rounded-lg">
          <div className="flex items-start space-x-2">
            <Icon name="Lightbulb" size={16} className="text-accent mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Skill Recommendations</p>
              <p>Adding relevant skills helps our AI match you with better internship opportunities. Include both technical skills you're proficient in and soft skills that make you a great team member.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillsSection;