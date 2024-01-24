import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Link, Routes, useLocation , useParams} from 'react-router-dom';
import { TabBar, Tab } from '@dhis2-ui/tab';
import { Home, Course,  CourseSearch, StaffSearch, Staffadd, TrainingCapture, Staffview, } from './views';

import styles from './App.module.css';
import logo from './image/jtrainlogo.png';
//yarn start --proxy https://dhis2.af.jhpiego.org --proxyPort 8082
const MainContent = () => {
    const [selectedTab, setSelectedTab] = useState('');
    const location = useLocation();

    useEffect(() => {
        const currentPath = location.pathname;
        if (currentPath.includes('staffsearch')) {
            setSelectedTab('StaffSearch');
        } else if (currentPath.includes('course')) {
            setSelectedTab('Course');
        } else if (currentPath.includes('trainingcapture')) {
            setSelectedTab('TrainingCapture');
        } else {
            setSelectedTab('Home');
        }
    }, [location]);

    return (
        <div>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/course" element={<Course />} />
                <Route path="/coursesearch" element={<CourseSearch />} />
                {/* <Route path="/courseview/:id" element={<Staffview />} /> */}
                <Route path="/staffsearch" element={<StaffSearch />} />
                <Route path="/staffview/:id" element={<Staffview />} /> 
                <Route path="/trainingcapture" element={<TrainingCapture />} />
                <Route path="/staffadd" element={<Staffadd />} />
            </Routes>
        </div>
    );
};

const MyApp = () => {
    const [selectedTab, setSelectedTab] = useState('Home');

    return (
        <Router>
            <div>
                <div className={styles.heading}>
                    <img src={logo} alt="jtrain logo" /> 
                    <div className={styles.container}>
                    <div className={styles.top}>
                        <div style={{ height: '50px' }}>
                            <TabBar className={styles.TabBar}>
                            <Tab onClick={() => setSelectedTab('Home')}>
                                <Link to="/">Home</Link>
                            </Tab>
                            <Tab onClick={() => setSelectedTab('Course')}>
                                <Link to="/coursesearch">Course</Link>
                            </Tab>
                            <Tab onClick={() => setSelectedTab('StaffSearch')}>
                                <Link to="/staffsearch">Staff</Link>
                            </Tab>
                            <Tab onClick={() => setSelectedTab('TrainingCapture')}>
                                <Link to="/trainingcapture">Training Capture</Link>
                            </Tab>
                        </TabBar>
                        </div>
                    </div>
                        <hr />
                        <MainContent selectedTab={selectedTab} />
                    </div>
                </div>
            </div>
        </Router>
        
    );
};
export default MyApp;