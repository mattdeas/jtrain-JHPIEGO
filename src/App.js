import { useDataQuery, useDataEngine } from "@dhis2/app-runtime";
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Link, Routes, useLocation , useParams} from 'react-router-dom';
import { TabBar, Tab } from '@dhis2-ui/tab';
import { Home,  CourseSearch, StaffSearch, Staffadd, TrainingCapture, Staffview, Settings,
    CourseDetailsStaffView,  CourseDateAttendeesStaffCustomFields, CourseDetailsCourseView, CourseAttendee, CourseDateAttendees} from './views';


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
    const [config, setConfig] = useState(null);

    useEffect(() => {
        const config = {
            "CourseEndDate": "ODO4HZT4XSg",
            "CourseStartDate": "N3rXacKJAjy",
            "DefaultStaffOrgUnit": "Esaneu7V7rq",
            "TEITypeCourse": "EcbFeAtWDmP",
            "TEITypeStaff": "AsxfMid3pVW",
            "CourseAttendees": "r6m3Tekr5DO",
            "CourseAttendeesCount": "IA7YxfolpEM",
            "CourseEventId": "dTrDnb4e8Ee",
            "CoursePostTestScore": "zvXaKJnl14I",
            "CoursePretestSscore": "IAphSuyuH15",
            "CourseProgram": "Lw1g7haLUd9",
            "CourseProgramStageId": "h9zPG79AmgH",
            "DefaultCourseOrgUnit": "Esaneu7V7rq",
            "Location": "Esaneu7V7rq",
            "LocationDE": "Pe5Lkrbvnos",
            "LocationTEA": "PYHaJIsQyxj",
            "StaffProgram": "vtSLYBYufMn",
            "StaffProgramCourse": "C6BqK9IAR7I",
            "ThematicAreaOptionset": "AvtckM3AMNR",
            "IndicatorTotalFemaleTrainee": "fWteSZrcYjO",
            "IndicatorTotalMaleTrainee": "zuqccgxi4dF",
            "IndicatorTotalUnknownTrainee": "Wyfg7HQa40s"
        };

        // Store the config object in sessionStorage and set it in state
        sessionStorage.setItem('config', JSON.stringify(config));
        setConfig(config);
    }, []);



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
                <Route path="/testcomponent/:id" element={<CourseDetailsStaffView />} />
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
             <div>
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
                        
                        <div style={{ flexGrow: 1, overflowY: 'auto'}}>
                            <div style={{ paddingLeft: '25px' }}>
                            <MainContent selectedTab={selectedTab} />
                            </div>
                        </div>
                        
                    </div>
                </div>
            </div>
        </Router>
        
    );
};
export default MyApp;