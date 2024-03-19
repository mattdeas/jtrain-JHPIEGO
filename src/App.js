import { useDataQuery, useDataEngine } from "@dhis2/app-runtime";
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Link, Routes, useLocation , useParams} from 'react-router-dom';
import { TabBar, Tab } from '@dhis2-ui/tab';
import { Home,  CourseSearch, StaffSearch, Staffadd, TrainingCapture, Staffview, Settings,
    CourseDetailsStaffView, CourseDateAttendeesStaffCustomFields, CourseDetailsCourseView, CourseAttendee, CourseDateAttendees} from './views';


import styles from './App.module.css';
import logo from './image/jtrainlogo.png';
import { ResizeObserver } from '@juggle/resize-observer';
import { Courseview } from './views/Courseview';
import MyComponent from "./views/TestTree";

const ro = new ResizeObserver((entries, observer) => {
// Changing the body size inside of the observer
// will cause a resize loop and the next observation will be skipped
document.body.style.width = '50%';
});

// Listen for errors
//window.addEventListener('error', e => console.log(e.message));
window.addEventListener('error', e => {});


// Observe the body
ro.observe(document.body);



function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const handleResize = debounce(() => {
}, 200);

window.addEventListener('resize', handleResize);




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
                <Route path="/coursesearch" element={<CourseSearch />} />
                <Route path="/staffsearch" element={<StaffSearch />} />
                <Route path="/staffview/:id" element={<Staffview />} /> 
                <Route path="/trainingcapture" element={<TrainingCapture />} />
                <Route path="/staffadd" element={<Staffadd />} />
                <Route path="/courseview/:id" element={<Courseview />} />
                <Route path="/testcomponent/:id" element={<CourseDateAttendeesStaffCustomFields />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/testtree" element={<MyComponent/>} />
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
                            <Tab onClick={() => setSelectedTab('Settomgs')}>
                                <Link to="/settings">Settings</Link>
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