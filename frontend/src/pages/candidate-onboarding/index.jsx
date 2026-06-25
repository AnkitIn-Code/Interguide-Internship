import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Icon from '../../components/AppIcon';
import { userAPI, skillsAPI, currentUserAPI } from '../../services/api';

const CandidateOnboarding = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [location, setLocation] = useState('');
  const [education, setEducation] = useState('');
  const [sector, setSector] = useState('');
  const [techSkills, setTechSkills] = useState([]);
  const [softSkills, setSoftSkills] = useState([]);
  const [newTech, setNewTech] = useState('');
  const [newSoft, setNewSoft] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const me = await currentUserAPI.me();
        if (me?.user?.hasOnboarded) {
          navigate('/main-dashboard', { replace: true });
          return;
        }
        setLocation(me?.user?.profile?.location || '');
        setEducation(me?.user?.profile?.education || '');
        setSector(me?.user?.profile?.sector || '');
        const s = await skillsAPI.get();
        if (s?.skills) {
          setTechSkills(s.skills.techSkills || []);
          setSoftSkills(s.skills.softSkills || []);
        }
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate]);

  const addTech = () => {
    const v = (newTech || '').trim();
    if (!v) return;
    if (techSkills.includes(v)) { setNewTech(''); return; }
    setTechSkills([...techSkills, v]);
    setNewTech('');
  };
  const addSoft = () => {
    const v = (newSoft || '').trim();
    if (!v) return;
    if (softSkills.includes(v)) { setNewSoft(''); return; }
    setSoftSkills([...softSkills, v]);
    setNewSoft('');
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      // Single direct update to profile (primary persistence)
      const payload = { education, skills: techSkills, sector, location };
      const res = await userAPI.updateProfile(payload);
      if (!res || !res.user) throw new Error('Profile update failed');

      // Mark onboarding completed (do not block on failure)
      try { await currentUserAPI.markOnboarded(); } catch {}

      // Save separate skills document (non-blocking best-effort)
      try { await skillsAPI.save({ techSkills, softSkills }); } catch {}

      navigate('/main-dashboard', { replace: true });
    } catch (e) {
      alert('Failed to save onboarding. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-3xl mx-auto px-6 py-10">
          <div className="bg-card border border-border rounded-lg p-6 animate-pulse h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
              <Icon name="UserPlus" size={20} className="text-secondary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Welcome! Let’s set up your profile</h1>
              <p className="text-sm text-muted-foreground">This helps us personalize your experience and recommendations</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Location" value={location} onChange={(e)=>setLocation(e.target.value)} placeholder="City, Country" />
              <Input label="Education" value={education} onChange={(e)=>setEducation(e.target.value)} placeholder="e.g., B.Tech CSE" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Preferred Sector" value={sector} onChange={(e)=>setSector(e.target.value)} placeholder="e.g., Software, Data" />
            </div>

            <div>
              <h3 className="text-md font-medium text-foreground mb-2">Technical Skills</h3>
              <div className="flex items-center space-x-2 mb-3">
                <Input value={newTech} onChange={(e)=>setNewTech(e.target.value)} placeholder="Type a skill and click Add" onKeyDown={(e)=> e.key==='Enter' && addTech()} />
                <Button variant="outline" size="sm" iconName="Plus" onClick={addTech}>Add</Button>
              </div>
              <div className="mb-3 text-sm text-muted-foreground">
                <p className="mb-1">Popular: </p>
                <div className="flex flex-wrap gap-1">
                  {['JavaScript', 'Python', 'React', 'Node.js', 'Java', 'C++'].map(s => (
                    <button key={s} onClick={() => { if(!techSkills.includes(s)) setTechSkills([...techSkills, s]); }} className="text-xs bg-muted hover:bg-muted/80 px-2 py-1 rounded">+{s}</button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {techSkills.map((s, i)=> (
                  <span key={i} className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm">
                    <span>{s}</span>
                    <button className="hover:bg-primary/20 rounded-full p-0.5" onClick={()=> setTechSkills(techSkills.filter(x=>x!==s))}>
                      <Icon name="X" size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-md font-medium text-foreground mb-2">Soft Skills</h3>
              <div className="flex items-center space-x-2 mb-3">
                <Input value={newSoft} onChange={(e)=>setNewSoft(e.target.value)} placeholder="Type a skill and click Add" onKeyDown={(e)=> e.key==='Enter' && addSoft()} />
                <Button variant="outline" size="sm" iconName="Plus" onClick={addSoft}>Add</Button>
              </div>
              <div className="mb-3 text-sm text-muted-foreground">
                <p className="mb-1">Popular: </p>
                <div className="flex flex-wrap gap-1">
                  {['Communication', 'Leadership', 'Teamwork', 'Problem Solving', 'Time Management'].map(s => (
                    <button key={s} onClick={() => { if(!softSkills.includes(s)) setSoftSkills([...softSkills, s]); }} className="text-xs bg-muted hover:bg-muted/80 px-2 py-1 rounded">+{s}</button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {softSkills.map((s, i)=> (
                  <span key={i} className="inline-flex items-center space-x-2 bg-secondary/10 text-secondary px-3 py-1.5 rounded-full text-sm">
                    <span>{s}</span>
                    <button className="hover:bg-secondary/20 rounded-full p-0.5" onClick={()=> setSoftSkills(softSkills.filter(x=>x!==s))}>
                      <Icon name="X" size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <Button variant="ghost" onClick={()=> navigate('/main-dashboard')}>Skip for now</Button>
              <Button variant="default" iconName="Save" loading={saving} disabled={saving} onClick={saveAll}>Save and continue</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateOnboarding;
