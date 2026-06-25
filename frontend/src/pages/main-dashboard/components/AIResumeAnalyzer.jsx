import React, { useState, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { resumeAPI, userAPI } from '../../../services/api';

const AIResumeAnalyzer = ({ onProfileUpdate }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload a PDF or DOCX file');
      setFile(null);
      return;
    }

    // Validate file size (5MB max)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setError('');
    setSuccess('');
    setAnalysis(null);
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setAnalysis(null);

    try {
      const data = await resumeAPI.analyze(file);

      setSuccess('Resume analyzed successfully!');
      setAnalysis(data);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err.message || 'Failed to analyze resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError('');
    setSuccess('');
    setAnalysis(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddToProfile = async () => {
    if (!analysis?.resume?.skills || analysis.resume.skills.length === 0) {
      setError('No skills to add to profile');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const result = await userAPI.updateSkills(analysis.resume.skills);
      
      if (result?.message) {
        setSuccess('Skills added to your profile successfully!');
      } else {
        setSuccess('Skills added to your profile successfully!');
      }
      
      setAnalysis(null);
      
      // Refresh the dashboard profile data
      if (onProfileUpdate) {
        await onProfileUpdate();
      }
      
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Add to profile error:', err);
      setError(err.message || 'Failed to add skills to profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipAddToProfile = () => {
    setAnalysis(null);
    setSuccess('');
    setError('');
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-elevation-2 transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 border-indigo-200 flex items-center justify-center">
            <Icon name="FileText" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">AI Resume Analyzer</h3>
            <p className="text-sm text-muted-foreground">Upload and analyze your resume</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* File Upload Section */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            Upload Resume (PDF or DOCX)
          </label>
          <div className="flex items-center space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileChange}
              disabled={loading}
              className="hidden"
              id="resume-upload"
            />
            <label
              htmlFor="resume-upload"
              className={`flex-1 flex items-center justify-center px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                loading
                  ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                  : 'border-primary/30 hover:border-primary bg-background hover:bg-primary/5'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Icon name="Upload" size={20} className="text-primary" />
                <span className="text-sm text-muted-foreground">
                  {file ? file.name : 'Choose file...'}
                </span>
              </div>
            </label>
            {file && !loading && (
              <button
                onClick={handleRemoveFile}
                className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                title="Remove file"
              >
                <Icon name="X" size={20} />
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Maximum file size: 5MB
          </p>
        </div>

        {/* Analyze Button */}
        <Button
          onClick={handleAnalyze}
          disabled={!file || loading}
          className="w-full"
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <Icon name="Loader" size={16} className="animate-spin" />
              <span>Analyzing...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <Icon name="Sparkles" size={16} />
              <span>Analyze Resume</span>
            </div>
          )}
        </Button>

        {/* Error Message */}
        {error && (
          <div className="flex items-start space-x-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <Icon name="AlertCircle" size={18} className="text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="flex items-start space-x-2 p-3 rounded-lg bg-success/10 border border-success/20">
            <Icon name="CheckCircle2" size={18} className="text-success flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-success font-medium">{success}</p>
              <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                {analysis?.resume?.skills && (
                  <span>• {analysis.resume.skills.length} skills</span>
                )}
                {analysis?.resume?.experience && analysis.resume.experience.length > 0 && (
                  <span>• {analysis.resume.experience.length} experience entries</span>
                )}
                {analysis?.resume?.education && analysis.resume.education.length > 0 && (
                  <span>• {analysis.resume.education.length} education entries</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Analysis Results Preview */}
        {analysis && (
          <div className="mt-4 space-y-4">
            {/* Contact Info */}
            {analysis.resume?.contactInfo && (
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center space-x-2">
                  <Icon name="User" size={16} className="text-emerald-600" />
                  <span>Contact</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <Icon name="User" size={14} className="text-emerald-600" />
                    <span>{analysis.resume.contactInfo.fullName || '—'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Icon name="Phone" size={14} className="text-emerald-600" />
                    <span>{analysis.resume.contactInfo.phone || '—'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Icon name="Mail" size={14} className="text-emerald-600" />
                    <span className="truncate">{analysis.resume.contactInfo.email || '—'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Icon name="Linkedin" size={14} className="text-emerald-600" />
                    <a
                      href={analysis.resume.contactInfo.linkedin || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className={`truncate ${analysis.resume.contactInfo.linkedin ? 'text-emerald-700 hover:underline' : 'pointer-events-none text-muted-foreground'}`}
                    >
                      {analysis.resume.contactInfo.linkedin || '—'}
                    </a>
                  </div>
                </div>
              </div>
            )}
            {/* Profile Strength Score */}
            {typeof analysis.profileStrength === 'number' && (
              <div className="p-4 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-foreground flex items-center space-x-2">
                    <Icon name="TrendingUp" size={16} className="text-primary" />
                    <span>Profile Strength</span>
                  </h4>
                  <span className="text-lg font-bold text-primary">{analysis.profileStrength}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-primary to-primary/70 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, analysis.profileStrength)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {analysis.profileStrength >= 80 ? 'Excellent profile!' : 
                   analysis.profileStrength >= 60 ? 'Good progress, keep improving!' : 
                   'Complete missing sections to boost your score'}
                </p>
              </div>
            )}

            {/* Skills Section */}
            {analysis.resume?.skills && analysis.resume.skills.length > 0 && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center space-x-2">
                  <Icon name="Award" size={16} className="text-primary" />
                  <span>Extracted Skills ({analysis.resume.skills.length})</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.resume.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Experience Section */}
            {analysis.resume?.experience && analysis.resume.experience.length > 0 && (
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center space-x-2">
                  <Icon name="Briefcase" size={16} className="text-blue-600" />
                  <span>Experience Highlights</span>
                </h4>
                <ul className="space-y-2">
                  {analysis.resume.experience.map((exp, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <Icon name="ChevronRight" size={14} className="text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-muted-foreground">
                        <div className="font-medium text-foreground">{exp.role || exp.title || 'Role not specified'}</div>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {exp.company && <span>{exp.company}</span>}
                          {exp.duration && <span>• {exp.duration}</span>}
                          {(exp.startDate || exp.endDate) && <span>• {exp.startDate || ''} - {exp.endDate || ''}</span>}
                        </div>
                        {exp.description && <div className="text-xs mt-1 leading-snug">{exp.description}</div>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Education Section */}
            {analysis.resume?.education && analysis.resume.education.length > 0 && (
              <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center space-x-2">
                  <Icon name="GraduationCap" size={16} className="text-purple-600" />
                  <span>Education</span>
                </h4>
                <ul className="space-y-2">
                  {analysis.resume.education.map((edu, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <Icon name="ChevronRight" size={14} className="text-purple-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-muted-foreground">
                        <div className="font-medium text-foreground">{edu.degree || 'Degree not specified'}</div>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {edu.institution && <span>{edu.institution}</span>}
                          {edu.field && <span>• {edu.field}</span>}
                          {edu.year && <span>• {edu.year}</span>}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Missing Profile Suggestions */}
            {analysis.missingElements && analysis.missingElements.length > 0 && (
              <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center space-x-2">
                  <Icon name="Lightbulb" size={16} className="text-yellow-600" />
                  <span>Suggestions to Improve Profile</span>
                </h4>
                <ul className="space-y-2">
                  {analysis.missingElements.map((suggestion, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Icon name="AlertCircle" size={14} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button
                onClick={handleAddToProfile}
                disabled={loading || !analysis?.resume?.skills || analysis.resume.skills.length === 0}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                <div className="flex items-center justify-center space-x-2">
                  <Icon name="Plus" size={16} />
                  <span>Add to Profile</span>
                </div>
              </Button>
              <Button
                onClick={handleSkipAddToProfile}
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                <span>Skip</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIResumeAnalyzer;
