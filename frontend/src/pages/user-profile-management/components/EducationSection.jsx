import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const EducationSection = ({ profile, onUpdate, isEditing, onToggleEdit }) => {
  const [formData, setFormData] = useState({
    institution: profile?.education?.institution || '',
    degree: profile?.education?.degree || '',
    major: profile?.education?.major || '',
    graduationYear: profile?.education?.graduationYear || '',
    cgpa: profile?.education?.cgpa || '',
    maxCgpa: profile?.education?.maxCgpa || '10',
    coursework: profile?.education?.coursework || []
  });

  const [newCoursework, setNewCoursework] = useState('');
  const [errors, setErrors] = useState({});

  const degreeOptions = [
    { value: 'bachelor', label: 'Bachelor\'s Degree' },
    { value: 'master', label: 'Master\'s Degree' },
    { value: 'phd', label: 'PhD' },
    { value: 'diploma', label: 'Diploma' },
    { value: 'certificate', label: 'Certificate' }
  ];

  const cgpaScaleOptions = [
    { value: '4', label: '4.0 Scale' },
    { value: '10', label: '10.0 Scale' },
    { value: '100', label: '100% Scale' }
  ];

  const currentYear = new Date()?.getFullYear();
  const yearOptions = [];
  for (let year = currentYear + 4; year >= currentYear - 10; year--) {
    yearOptions?.push({ value: year?.toString(), label: year?.toString() });
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors?.[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const addCoursework = () => {
    if (newCoursework?.trim() && !formData?.coursework?.includes(newCoursework?.trim())) {
      setFormData(prev => ({
        ...prev,
        coursework: [...prev?.coursework, newCoursework?.trim()]
      }));
      setNewCoursework('');
    }
  };

  const removeCoursework = (courseToRemove) => {
    setFormData(prev => ({
      ...prev,
      coursework: prev?.coursework?.filter(course => course !== courseToRemove)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData?.institution?.trim()) {
      newErrors.institution = 'Institution name is required';
    }
    
    if (!formData?.degree) {
      newErrors.degree = 'Degree type is required';
    }
    
    if (!formData?.major?.trim()) {
      newErrors.major = 'Major/Field of study is required';
    }
    
    if (!formData?.graduationYear) {
      newErrors.graduationYear = 'Graduation year is required';
    }

    if (formData?.cgpa) {
      const cgpaValue = parseFloat(formData?.cgpa);
      const maxCgpaValue = parseFloat(formData?.maxCgpa);
      
      if (isNaN(cgpaValue) || cgpaValue < 0) {
        newErrors.cgpa = 'Please enter a valid CGPA';
      } else if (cgpaValue > maxCgpaValue) {
        newErrors.cgpa = `CGPA cannot exceed ${maxCgpaValue}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onUpdate('education', formData);
      onToggleEdit();
    }
  };

  const handleCancel = () => {
    setFormData({
      institution: profile?.education?.institution || '',
      degree: profile?.education?.degree || '',
      major: profile?.education?.major || '',
      graduationYear: profile?.education?.graduationYear || '',
      cgpa: profile?.education?.cgpa || '',
      maxCgpa: profile?.education?.maxCgpa || '10',
      coursework: profile?.education?.coursework || []
    });
    setNewCoursework('');
    setErrors({});
    onToggleEdit();
  };

  const handleKeyPress = (e) => {
    if (e?.key === 'Enter') {
      addCoursework();
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
            <Icon name="GraduationCap" size={20} className="text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Education</h3>
            <p className="text-sm text-muted-foreground">Update your educational background</p>
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
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Institution Name"
            type="text"
            value={formData?.institution}
            onChange={(e) => handleInputChange('institution', e?.target?.value)}
            error={errors?.institution}
            disabled={!isEditing}
            required
            placeholder="University or College name"
          />

          <Select
            label="Degree Type"
            options={degreeOptions}
            value={formData?.degree}
            onChange={(value) => handleInputChange('degree', value)}
            error={errors?.degree}
            disabled={!isEditing}
            required
            placeholder="Select your degree type"
          />

          <Input
            label="Major/Field of Study"
            type="text"
            value={formData?.major}
            onChange={(e) => handleInputChange('major', e?.target?.value)}
            error={errors?.major}
            disabled={!isEditing}
            required
            placeholder="Computer Science, Engineering, etc."
          />

          <Select
            label="Graduation Year"
            options={yearOptions}
            value={formData?.graduationYear}
            onChange={(value) => handleInputChange('graduationYear', value)}
            error={errors?.graduationYear}
            disabled={!isEditing}
            required
            placeholder="Select graduation year"
          />

          <div className="flex space-x-3">
            <div className="flex-1">
              <Input
                label="CGPA/GPA"
                type="number"
                value={formData?.cgpa}
                onChange={(e) => handleInputChange('cgpa', e?.target?.value)}
                error={errors?.cgpa}
                disabled={!isEditing}
                placeholder="8.5"
                step="0.01"
              />
            </div>
            <div className="w-32">
              <Select
                label="Scale"
                options={cgpaScaleOptions}
                value={formData?.maxCgpa}
                onChange={(value) => handleInputChange('maxCgpa', value)}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>

        {/* Relevant Coursework */}
        <div>
          <h4 className="text-md font-medium text-foreground mb-4">Relevant Coursework</h4>
          
          {isEditing && (
            <div className="flex items-center space-x-2 mb-4">
              <Input
                type="text"
                value={newCoursework}
                onChange={(e) => setNewCoursework(e?.target?.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add relevant coursework (e.g., Data Structures, Web Development)"
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={addCoursework}
                iconName="Plus"
                disabled={!newCoursework?.trim()}
              >
                Add
              </Button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {formData?.coursework?.length > 0 ? (
              formData?.coursework?.map((course, index) => (
                <div
                  key={index}
                  className="inline-flex items-center space-x-2 bg-accent/10 text-accent px-3 py-1.5 rounded-full text-sm"
                >
                  <span>{course}</span>
                  {isEditing && (
                    <button
                      onClick={() => removeCoursework(course)}
                      className="hover:bg-accent/20 rounded-full p-0.5 transition-colors duration-200"
                    >
                      <Icon name="X" size={14} />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm italic">No coursework added yet</p>
            )}
          </div>
        </div>
      </div>
      {isEditing && (
        <div className="mt-6 p-4 bg-primary/5 rounded-lg">
          <div className="flex items-start space-x-2">
            <Icon name="Info" size={16} className="text-primary mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Education Impact</p>
              <p>Your educational background helps employers understand your academic foundation. Including relevant coursework can highlight specific skills and knowledge areas.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EducationSection;