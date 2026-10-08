import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../App.module.css'; // Adjust the import based on your actual CSS file location

/**
 * NavigationBar
 * Top tab bar for the app (Home | Course | Trainees | Training Capture).
 * The selected tab is owned by App's MainContent, which also re-derives it from the URL,
 * so deep links and back/forward keep the highlight in sync.
 */
export const NavigationBar = ({ selectedTab, setSelectedTab }) => {
    const navigate = useNavigate();

    // Highlight the tab immediately, then route to its page
    const handleNavigation = (path, tab) => {
        setSelectedTab(tab);
        navigate(path);
    };

    return (
        <div className={styles.tabBar}>
            <div
                onClick={() => handleNavigation('/', 'Home')}
                className={`${styles.tabButton} ${selectedTab === 'Home' ? styles.selectedTabButton : ''}`}
            >
                Home
            </div>
            <span className={styles.separator}>|</span>
            <div 
                onClick={() => handleNavigation('/coursesearch', 'Course')}
                className={`${styles.tabButton} ${selectedTab === 'Course' ? styles.selectedTabButton : ''}`}
            >
                Course
            </div>
            <span className={styles.separator}>|</span>
            <div
                onClick={() => handleNavigation('/staffsearch', 'StaffSearch')}
                className={`${styles.tabButton} ${selectedTab === 'StaffSearch' ? styles.selectedTabButton : ''}`}
            >
                Trainees
            </div>
            <span className={styles.separator}>|</span>
            <div
                onClick={() => handleNavigation('/trainingcapture', 'TrainingCapture')}
                className={`${styles.tabButton} ${selectedTab === 'TrainingCapture' ? styles.selectedTabButton : ''}`}
            >
                Training Capture
            </div>
        </div>
    );
};