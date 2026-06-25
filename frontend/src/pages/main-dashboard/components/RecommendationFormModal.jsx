import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const RecommendationFormModal = ({ isOpen, initialValues, onClose, onSubmit, loading }) => {
  const [sector, setSector] = useState('');
  const [location, setLocation] = useState('');
  const [skills, setSkills] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSector(initialValues?.sector || '');
      setLocation(initialValues?.location || '');
      const skillsStr = Array.isArray(initialValues?.skills)
        ? initialValues.skills.join(', ')
        : (initialValues?.skills || '');
      setSkills(skillsStr);
    }
  }, [isOpen, initialValues]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      sector: sector?.trim(),
      location: location?.trim(),
      skills: skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };
    onSubmit?.(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-lg shadow-xl w-full max-w-lg p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Get Recommendations</h3>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Preferred Sector</label>
            <Input
              placeholder="e.g., Technology, Marketing"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Preferred Location</label>
            <Input
              placeholder="e.g., Mumbai, Delhi"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Skills (comma-separated)</label>
            <Input
              placeholder="e.g., React, JavaScript, Python"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} iconName={loading ? 'Loader2' : 'Sparkles'}>
              {loading ? 'Getting...' : 'Get Recommendations'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecommendationFormModal;
