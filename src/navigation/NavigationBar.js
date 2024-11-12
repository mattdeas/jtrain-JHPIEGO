import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../App.module.css'; // Adjust the import based on your actual CSS file location

export const NavigationBar = ({ selectedTab, setSelectedTab }) => {
    const navigate = useNavigate();

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
                Staff
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