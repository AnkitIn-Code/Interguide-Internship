import React, { useState } from 'react';
import Icon from '../AppIcon';
import Button from './Button';

const HelpDeskWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');

  const toggleWidget = () => {
    setIsOpen(!isOpen);
  };

  const faqItems = [
    {
      question: 'How do I apply for internships?',
      answer: 'Browse our recommendations, click on internships that interest you, and follow the application instructions provided by each company.'
    },
    {
      question: 'How does the AI matching work?',
      answer: 'Our AI analyzes your profile, skills, and preferences to recommend internships that best match your career goals and qualifications.'
    },
    {
      question: 'Can I track my application status?',
      answer: 'Yes! Use the Application Tracker to monitor all your applications, deadlines, and receive status updates.'
    },
    {
      question: 'How do I update my profile?',
      answer: 'Go to your Profile section to update your resume, skills, preferences, and other information to improve recommendations.'
    }
  ];

  return (
    <>
      {/* Help Desk Button */}
      <div className="fixed bottom-6 right-6 z-150">
        <Button
          onClick={toggleWidget}
          className="w-14 h-14 rounded-full shadow-elevation-2 hover:shadow-elevation-3 transition-all duration-200"
          variant="primary"
          size="icon"
        >
          <Icon name={isOpen ? 'X' : 'HelpCircle'} size={24} />
        </Button>
      </div>
      {/* Help Desk Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 bg-card border border-border rounded-lg shadow-elevation-3 z-150 animate-fade-in">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Help & Support</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleWidget}
                iconName="X"
              />
            </div>
            
            {/* Tab Navigation */}
            <div className="flex mt-3 bg-muted rounded-md p-1">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded transition-colors duration-200 ${
                  activeTab === 'chat' ?'bg-card text-foreground shadow-sm' :'text-muted-foreground hover:text-foreground'
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setActiveTab('faq')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded transition-colors duration-200 ${
                  activeTab === 'faq' ?'bg-card text-foreground shadow-sm' :'text-muted-foreground hover:text-foreground'
                }`}
              >
                FAQ
              </button>
            </div>
          </div>

          <div className="p-4 max-h-96 overflow-y-auto">
            {activeTab === 'chat' && (
              <div className="space-y-4">
                <div className="text-center text-muted-foreground text-sm">
                  <Icon name="MessageCircle" size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Chat support is currently offline.</p>
                  <p className="mt-1">We typically respond within 2-4 hours.</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Icon name="Mail" size={16} />
                    <span>support@internshiphub.com</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Icon name="Clock" size={16} />
                    <span>Mon-Fri, 9AM-6PM EST</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  fullWidth
                  iconName="Send"
                  iconPosition="left"
                  className="mt-4"
                >
                  Send us a message
                </Button>
              </div>
            )}

            {activeTab === 'faq' && (
              <div className="space-y-3">
                {faqItems?.map((item, index) => (
                  <details key={index} className="group">
                    <summary className="flex items-center justify-between cursor-pointer p-3 rounded-md hover:bg-muted transition-colors duration-200">
                      <span className="text-sm font-medium text-foreground">
                        {item?.question}
                      </span>
                      <Icon 
                        name="ChevronDown" 
                        size={16} 
                        className="text-muted-foreground group-open:rotate-180 transition-transform duration-200" 
                      />
                    </summary>
                    <div className="px-3 pb-3 text-sm text-muted-foreground">
                      {item?.answer}
                    </div>
                  </details>
                ))}
                
                <div className="pt-3 border-t border-border">
                  <Button
                    variant="ghost"
                    fullWidth
                    iconName="ExternalLink"
                    iconPosition="left"
                    className="text-sm"
                  >
                    View all help articles
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-subtle z-100"
          onClick={toggleWidget}
        />
      )}
    </>
  );
};

export default HelpDeskWidget;