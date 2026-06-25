import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';

const ResumeTools = () => {
  const navigate = useNavigate();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => navigate('/resume-tools')}
      className="flex items-center gap-2"
    >
      <Icon name="FileText" size={16} />
      <span className="hidden sm:inline">Resume Tools</span>
    </Button>
  );
};

export default ResumeTools;
