import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/AppIcon';
import Button from '../components/ui/Button';
import { resumeAPI } from '../services/api';
import { apiUrl } from '../utils/apiBaseUrl';

const UserProfile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [resumeSkills, setResumeSkills] = useState([]);
  const [resumeText, setResumeText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const navigate = useNavigate();

  // Fetch user data from backend
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(apiUrl('/user/profile'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      setUserData(data);
      if (Array.isArray(data?.resume?.skills)) {
        setResumeSkills(data.resume.skills);
      }
      if (typeof data?.resume?.text === 'string') {
        setResumeText(data.resume.text);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (updatedData) => {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(apiUrl('/user/profile'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      setUserData(data);
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
      console.error('Error updating profile:', err);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target?.files?.[0];
    setUploadStatus(null);

    if (!file) {
      setResumeFile(null);
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      setUploadStatus({ type: 'error', message: 'Only PDF or DOCX files are allowed.' });
      setResumeFile(null);
      return;
    }

    setResumeFile(file);
  };

  const handleResumeUpload = async () => {
    if (!resumeFile) {
      setUploadStatus({ type: 'error', message: 'Please choose a PDF or DOCX file first.' });
      return;
    }

    try {
      setUploading(true);
      setUploadStatus(null);

      const data = await resumeAPI.upload(resumeFile);

      setUploadStatus({ type: 'success', message: data?.message || 'Resume uploaded successfully.' });
      if (Array.isArray(data?.data?.skills)) {
        setResumeSkills(data.data.skills);
      }
      if (typeof data?.data?.text === 'string') {
        setResumeText(data.data.text);
      }
      setResumeFile(null);
    } catch (err) {
      setUploadStatus({ type: 'error', message: err.message || 'Something went wrong.' });
      console.error('Error uploading resume:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyzeResume = async () => {
    if (!resumeText) {
      setAnalysisResult({ type: 'error', message: 'Upload a resume first to analyze.' });
      return;
    }

    try {
      setAnalyzing(true);
      setAnalysisResult(null);

      const data = await resumeAPI.improve(resumeText, 'Internship candidate');

      setAnalysisResult({ 
        type: 'success', 
        message: data?.message || 'Resume improved successfully', 
        keywords: data?.keywords, 
        bullets: data?.improvedBullets, 
        text: data?.improvedText 
      });
    } catch (err) {
      setAnalysisResult({ type: 'error', message: err.message || 'Analysis failed.' });
      console.error('Error analyzing resume:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="text-muted-foreground">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Icon name="AlertCircle" size={48} className="text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Error Loading Profile</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchUserData} iconName="RefreshCw" iconPosition="left">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="bg-card rounded-lg border border-border p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <Icon name="User" size={32} className="text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {userData?.firstName} {userData?.lastName}
                </h1>
                <p className="text-muted-foreground">{userData?.email}</p>
                <p className="text-sm text-muted-foreground">{userData?.university}</p>
              </div>
            </div>
            
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? "outline" : "default"}
              iconName={isEditing ? "X" : "Edit"}
              iconPosition="left"
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </Button>
          </div>

          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Phone</h3>
              <p className="text-foreground">{userData?.phone || 'Not provided'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Location</h3>
              <p className="text-foreground">{userData?.location || 'Not provided'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Year of Study</h3>
              <p className="text-foreground">{userData?.yearOfStudy || 'Not provided'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Major</h3>
              <p className="text-foreground">{userData?.major || 'Not provided'}</p>
            </div>
          </div>
        </div>

        {/* Resume Upload Section */}
        <div className="bg-card rounded-lg border border-border p-8 mb-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Resume</h2>
              <p className="text-sm text-muted-foreground">Upload a PDF or DOCX to keep recommendations relevant.</p>
            </div>
            {uploadStatus?.type === 'success' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                <Icon name="CheckCircle2" size={16} className="mr-1" />
                Updated
              </span>
            )}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-[1.5fr_auto] md:items-center">
            <label className="flex flex-col gap-2 rounded-lg border border-dashed border-border bg-muted/40 p-4 cursor-pointer hover:border-primary/60 transition-colors">
              <span className="text-sm font-medium text-foreground">Choose a file</span>
              <p className="text-sm text-muted-foreground">PDF or DOCX, max 10MB.</p>
              <div className="mt-3 inline-flex items-center gap-2 text-sm text-foreground">
                <Icon name={resumeFile ? 'FileCheck2' : 'File'} size={16} className="text-primary" />
                <span className="truncate">{resumeFile ? resumeFile.name : 'No file selected'}</span>
              </div>
              <input
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            <div className="flex md:justify-end">
              <Button
                onClick={handleResumeUpload}
                loading={uploading}
                disabled={uploading}
                iconName="UploadCloud"
              >
                {uploading ? 'Uploading...' : 'Upload Resume'}
              </Button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={handleAnalyzeResume}
              loading={analyzing}
              disabled={analyzing}
              iconName="Sparkles"
            >
              {analyzing ? 'Analyzing...' : 'Analyze Resume'}
            </Button>
          </div>

          {uploadStatus && (
            <div className={`mt-4 rounded-md border px-4 py-3 text-sm ${uploadStatus.type === 'success' ? 'border-success/50 bg-success/10 text-success' : 'border-destructive/50 bg-destructive/10 text-destructive'}`}>
              <div className="flex items-start gap-2">
                <Icon
                  name={uploadStatus.type === 'success' ? 'CheckCircle2' : 'AlertTriangle'}
                  size={16}
                  className="mt-[2px]"
                />
                <p className="leading-relaxed">{uploadStatus.message}</p>
              </div>
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Extracted skills</h3>
            {resumeSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {resumeSkills.map((skill, idx) => (
                  <span
                    key={`${skill}-${idx}`}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Upload a resume to see extracted skills.</p>
            )}
          </div>

          {analysisResult && (
            <div className={`mt-4 rounded-md border px-4 py-3 text-sm ${analysisResult.type === 'success' ? 'border-primary/40 bg-primary/5 text-foreground' : 'border-destructive/50 bg-destructive/10 text-destructive'}`}>
              <div className="flex items-start gap-2">
                <Icon
                  name={analysisResult.type === 'success' ? 'Sparkles' : 'AlertTriangle'}
                  size={16}
                  className="mt-[2px]"
                />
                <div className="space-y-2">
                  <p className="leading-relaxed">{analysisResult.message || (analysisResult.type === 'success' ? 'Resume analyzed successfully.' : 'Analysis failed.')}</p>
                  {analysisResult.type === 'success' && (
                    <div className="space-y-3">
                      {Array.isArray(analysisResult.keywords) && analysisResult.keywords.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Keywords</h4>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {analysisResult.keywords.map((kw, idx) => (
                              <span key={`${kw}-${idx}`} className="px-2 py-1 bg-secondary/60 text-foreground rounded-full text-xs font-medium">
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {Array.isArray(analysisResult.bullets) && analysisResult.bullets.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Suggested bullets</h4>
                          <ul className="mt-1 space-y-1 list-disc list-inside text-muted-foreground">
                            {analysisResult.bullets.map((b, idx) => (
                              <li key={`${idx}-${b}`} className="leading-relaxed">{b}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {analysisResult.text && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Improved summary</h4>
                          <p className="mt-1 text-muted-foreground leading-relaxed whitespace-pre-line">{analysisResult.text}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Skills Section */}
        <div className="bg-card rounded-lg border border-border p-8 mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-6">Skills</h2>
          
          {userData?.skills && userData.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {userData.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No skills added yet</p>
          )}
        </div>

        {/* Experience Section */}
        <div className="bg-card rounded-lg border border-border p-8 mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-6">Experience</h2>
          
          {userData?.experience && userData.experience.length > 0 ? (
            <div className="space-y-6">
              {userData.experience.map((exp, index) => (
                <div key={index} className="border-l-2 border-primary pl-4">
                  <h3 className="font-semibold text-foreground">{exp.title}</h3>
                  <p className="text-primary font-medium">{exp.company}</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    {exp.startDate} - {exp.endDate || 'Present'}
                  </p>
                  {exp.description && (
                    <p className="text-muted-foreground">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No experience added yet</p>
          )}
        </div>

        {/* Education Section */}
        <div className="bg-card rounded-lg border border-border p-8 mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-6">Education</h2>
          
          {userData?.education && userData.education.length > 0 ? (
            <div className="space-y-4">
              {userData.education.map((edu, index) => (
                <div key={index}>
                  <h3 className="font-semibold text-foreground">{edu.degree}</h3>
                  <p className="text-primary font-medium">{edu.institution}</p>
                  <p className="text-sm text-muted-foreground">
                    {edu.startYear} - {edu.endYear || 'Present'}
                    {edu.gpa && ` • GPA: ${edu.gpa}`}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <h3 className="font-semibold text-foreground">{userData?.university}</h3>
              <p className="text-primary font-medium">{userData?.major}</p>
              <p className="text-sm text-muted-foreground">{userData?.yearOfStudy}</p>
            </div>
          )}
        </div>

        {/* Bio Section */}
        <div className="bg-card rounded-lg border border-border p-8">
          <h2 className="text-xl font-semibold text-foreground mb-6">About Me</h2>
          
          {userData?.bio ? (
            <p className="text-muted-foreground leading-relaxed">{userData.bio}</p>
          ) : (
            <p className="text-muted-foreground">No bio added yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
