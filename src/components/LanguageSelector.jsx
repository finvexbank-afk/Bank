import React, { useState } from 'react';
import { ChevronLeft, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageSelector = ({ position = 'bottom-left' }) => {
    const { currentLanguage, languages, changeLanguage } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);

    const positionStyles = {
        'bottom-left': {
            selector: { position: 'absolute', bottom: '32px', left: '32px' },
            dropdown: { bottom: '100%', left: '0', marginBottom: '8px' }
        },
        'top-right': {
            selector: { position: 'absolute', top: '32px', right: '32px' },
            dropdown: { top: '100%', right: '0', marginTop: '8px' }
        },
        'inline': {
            selector: { position: 'relative' },
            dropdown: { top: '100%', right: '0', marginTop: '8px' }
        }
    };

    const currentStyle = positionStyles[position] || positionStyles['inline'];

    return (
        <div style={{ position: 'relative', ...currentStyle.selector }}>
            {/* Language Selector Button */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: 'white',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    color: '#1E293B',
                    fontSize: '14px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s ease',
                    userSelect: 'none'
                }}
                onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                }}
            >
                <img 
                    src={currentLanguage.flag} 
                    alt={currentLanguage.code} 
                    width="20" 
                    style={{ borderRadius: '2px' }}
                />
                <span>{currentLanguage.code.toUpperCase()}</span>
                <ChevronLeft 
                    size={16} 
                    style={{ 
                        transform: isOpen ? 'rotate(90deg)' : 'rotate(-90deg)',
                        transition: 'transform 0.2s ease'
                    }} 
                />
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <>
                    {/* Overlay to close dropdown when clicking outside */}
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 999
                        }}
                        onClick={() => setIsOpen(false)}
                    />
                    
                    <div
                        style={{
                            position: 'absolute',
                            background: 'white',
                            borderRadius: '8px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                            padding: '8px',
                            minWidth: '180px',
                            zIndex: 1000,
                            ...currentStyle.dropdown
                        }}
                    >
                        <div style={{ 
                            padding: '8px 12px', 
                            fontSize: '12px', 
                            fontWeight: 600, 
                            color: '#64748B',
                            borderBottom: '1px solid #E2E8F0',
                            marginBottom: '4px'
                        }}>
                            <Globe size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                            Language
                        </div>
                        
                        {Object.values(languages).map((lang) => (
                            <div
                                key={lang.code}
                                onClick={() => {
                                    changeLanguage(lang.code);
                                    setIsOpen(false);
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '10px 12px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s ease',
                                    background: currentLanguage.code === lang.code ? '#F1F5F9' : 'transparent'
                                }}
                                onMouseEnter={(e) => {
                                    if (currentLanguage.code !== lang.code) {
                                        e.target.style.background = '#F8FAFC';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (currentLanguage.code !== lang.code) {
                                        e.target.style.background = 'transparent';
                                    }
                                }}
                            >
                                <img 
                                    src={lang.flag} 
                                    alt={lang.code} 
                                    width="20" 
                                    style={{ borderRadius: '2px' }}
                                />
                                <div style={{ flex: 1 }}>
                                    <div style={{ 
                                        fontSize: '14px', 
                                        fontWeight: 500,
                                        color: currentLanguage.code === lang.code ? '#0EA5E9' : '#1E293B'
                                    }}>
                                        {lang.name}
                                    </div>
                                    <div style={{ 
                                        fontSize: '11px', 
                                        color: '#64748B',
                                        marginTop: '1px'
                                    }}>
                                        {lang.code.toUpperCase()}
                                    </div>
                                </div>
                                {currentLanguage.code === lang.code && (
                                    <div style={{
                                        width: '6px',
                                        height: '6px',
                                        background: '#0EA5E9',
                                        borderRadius: '50%'
                                    }} />
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default LanguageSelector;
