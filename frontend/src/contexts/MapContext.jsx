import React, { createContext, useContext, useState, useEffect } from 'react';

const MapContext = createContext(null);

export const useMap = () => {
    const context = useContext(MapContext);
    if (!context) {
        throw new Error('useMap must be used within MapProvider');
    }
    return context;
};

export const MapProvider = ({ children }) => {
    // Store active loan meeting data
    const [activeMeetingData, setActiveMeetingData] = useState(null);
    
    // Store all active loans (for when user has multiple active loans)
    const [activeLoans, setActiveLoans] = useState([]);

    // Listen for meeting point updates from LoanDetail
    useEffect(() => {
        const handleMeetingUpdate = (event) => {
        const { loanId, meetingPoint, lenderPoint, borrowerPoint, strategy } = event.detail;
        setActiveMeetingData({
            loanId,
            meetingPoint,
            lenderPoint,
            borrowerPoint,
            strategy,
            updatedAt: new Date().toISOString()
        });
        };

        window.addEventListener('meetingPointUpdated', handleMeetingUpdate);
        
        return () => {
        window.removeEventListener('meetingPointUpdated', handleMeetingUpdate);
        };
    }, []);

    const clearMeetingData = (loanId) => {
        if (activeMeetingData?.loanId === loanId) {
        setActiveMeetingData(null);
        }
    };

    return (
        <MapContext.Provider value={{
        activeMeetingData,
        activeLoans,
        setActiveLoans,
        clearMeetingData
        }}>
        {children}
        </MapContext.Provider>
    );
};