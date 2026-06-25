import React, { useMemo, useState } from 'react';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

const emptyExperience = {
  role: '',
  company: '',
  duration: '',
  description: '',
};

const ResumeBuilder = () => {
  const [basics, setBasics] = useState({
    fullName: '',
    title: '',
    location: '',
    email: '',
    phone: '',
  });
  const [summary, setSummary] = useState('');
  const [skills, setSkills] = useState('');
  const [experiences, setExperiences] = useState([{ ...emptyExperience }]);
  const [copyStatus, setCopyStatus] = useState('');

  const handleBasicsChange = (key, value) => {
    setBasics((prev) => ({ ...prev, [key]: value }));
  };

  const handleExperienceChange = (index, key, value) => {
    setExperiences((prev) => prev.map((exp, i) => (i === index ? { ...exp, [key]: value } : exp)));
  };

  const addExperience = () => {
    setExperiences((prev) => [...prev, { ...emptyExperience }]);
  };

  const removeExperience = (index) => {
    setExperiences((prev) => prev.filter((_, i) => i !== index));
  };

  const formattedSkills = useMemo(() => {
    return skills
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean);
  }, [skills]);

  const previewText = useMemo(() => {
    const lines = [];
    if (basics.fullName) lines.push(basics.fullName);
    if (basics.title) lines.push(basics.title);
    if (basics.location || basics.email || basics.phone) {
      const contact = [basics.location, basics.email, basics.phone].filter(Boolean).join(' | ');
      lines.push(contact);
    }
    if (summary) {
      lines.push('', 'Summary', summary);
    }
    if (formattedSkills.length > 0) {
      lines.push('', 'Skills');
      formattedSkills.forEach((skill) => lines.push(`- ${skill}`));
    }
    if (experiences.some((exp) => exp.role || exp.company || exp.description)) {
      lines.push('', 'Experience');
      experiences.forEach((exp) => {
        if (!exp.role && !exp.company && !exp.description) return;
        const header = [exp.role, exp.company].filter(Boolean).join(' @ ');
        const duration = exp.duration ? ` (${exp.duration})` : '';
        lines.push(`- ${header}${duration}`.trim());
        if (exp.description) {
          lines.push(`  ${exp.description}`);
        }
      });
    }
    if (lines.length === 0) {
      lines.push('Start filling the builder to see a live preview.');
    }
    return lines.join('\n');
  }, [basics, formattedSkills, summary, experiences]);

  const downloadDraft = () => {
    const blob = new Blob([previewText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'resume-draft.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const copyDraft = async () => {
    if (!navigator.clipboard) {
      setCopyStatus('Clipboard is not available in this browser.');
      return;
    }
    try {
      await navigator.clipboard.writeText(previewText);
      setCopyStatus('Copied to clipboard');
      setTimeout(() => setCopyStatus(''), 2000);
    } catch (err) {
      setCopyStatus('Failed to copy.');
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Icon name="FileEdit" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Resume Builder</h2>
            <p className="text-sm text-muted-foreground">Draft a resume outline and export it for editing.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" iconName="Copy" onClick={copyDraft}>
            Copy draft
          </Button>
          <Button size="sm" iconName="Download" onClick={downloadDraft}>
            Download draft
          </Button>
        </div>
      </div>

      {copyStatus && (
        <div className="text-sm text-muted-foreground">{copyStatus}</div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Full name</label>
            <input
              value={basics.fullName}
              onChange={(e) => handleBasicsChange('fullName', e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Alex Johnson"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Headline / title</label>
            <input
              value={basics.title}
              onChange={(e) => handleBasicsChange('title', e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Frontend Developer"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Location</label>
              <input
                value={basics.location}
                onChange={(e) => handleBasicsChange('location', e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Bengaluru, IN"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Phone</label>
              <input
                value={basics.phone}
                onChange={(e) => handleBasicsChange('phone', e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email</label>
            <input
              type="email"
              value={basics.email}
              onChange={(e) => handleBasicsChange('email', e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="alex@example.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Summary</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Briefly describe your experience, strengths, and goals."
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Skills (comma separated)</label>
            <input
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="React, Node.js, SQL, UI/UX"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Experience</h3>
              <p className="text-xs text-muted-foreground">Add your recent roles with outcomes.</p>
            </div>
            <Button size="sm" variant="outline" iconName="Plus" onClick={addExperience}>
              Add role
            </Button>
          </div>
          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
            {experiences.map((exp, idx) => (
              <div key={idx} className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    value={exp.role}
                    onChange={(e) => handleExperienceChange(idx, 'role', e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Role (e.g., SDE Intern)"
                  />
                  <input
                    value={exp.company}
                    onChange={(e) => handleExperienceChange(idx, 'company', e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Company"
                  />
                  <input
                    value={exp.duration}
                    onChange={(e) => handleExperienceChange(idx, 'duration', e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Jan 2024 - Jun 2024"
                  />
                </div>
                <textarea
                  value={exp.description}
                  onChange={(e) => handleExperienceChange(idx, 'description', e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Impactful bullet points and achievements."
                />
                {experiences.length > 1 && (
                  <button
                    onClick={() => removeExperience(idx)}
                    className="text-sm text-destructive hover:text-destructive/80"
                  >
                    Remove role
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="Sparkles" size={16} />
          <p className="text-sm font-semibold text-foreground">Live preview</p>
        </div>
        <pre className="whitespace-pre-wrap text-sm text-foreground bg-background border border-border rounded-md p-4 max-h-96 overflow-y-auto">
{previewText}
        </pre>
      </div>
    </div>
  );
};

export default ResumeBuilder;
