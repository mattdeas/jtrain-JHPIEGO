/**
 * jTrain - DHIS2 training management app.
 *
 * App root: sets up routing, the top navigation bar, and loads the app settings
 * (program / stage / data element UIDs) from the DHIS2 dataStore into sessionStorage.
 * Every view reads those settings via utilConfigConstantValueByName, so routes are
 * only rendered once the settings are available.
 */
import {  useDataEngine } from "@dhis2/app-runtime";
import { CircularLoader } from '@dhis2/ui';
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Link, Routes, useLocation , useParams, useNavigate} from 'react-router-dom';
import { TabBar, Tab } from '@dhis2-ui/tab';
import { Home,  CourseSearch, StaffSearch, Staffadd, TrainingCapture, Staffview, Settings,
    CourseDetailsStaffView,  CourseDateAttendeesStaffCustomFields, CourseDetailsCourseView, CourseAttendee, CourseDateAttendees} from './views';
import { NavigationBar } from './navigation';


import styles from './App.module.css';
import logo from './image/jtrainlogo.png';
import { ResizeObserver } from '@juggle/resize-observer';
import { Courseview } from './views/Courseview';
import MyComponent from "./views/TestTree";


// Forces the body to 50% width whenever it resizes (appears to be leftover layout experimentation)
const ro = new ResizeObserver((entries, observer) => {
// Changing the body size inside of the observer
// will cause a resize loop and the next observation will be skipped
document.body.style.width = '50%';
});

// Listen for errors - currently swallows all global errors silently
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

// No-op debounced resize handler (placeholder)
const handleResize = debounce(() => {
}, 200);

window.addEventListener('resize', handleResize);




//yarn start --proxy https://dhis2.sl.jhpiego.org --proxyPort 8082

/**
 * MainContent
 * Loads app settings (cached in sessionStorage, else fetched from dataStore jtrain-MW/appSettings),
 * keeps the highlighted nav tab in sync with the URL, and renders the routes.
 */
const MainContent = () => {
    const engine = useDataEngine();
    const [selectedTab, setSelectedTab] = useState('');
    const location = useLocation();
    const [config, setConfig] = useState(() => {
        const storedConfig = sessionStorage.getItem('config');
        return storedConfig ? JSON.parse(storedConfig) : null;
    });

    // useEffect(() => {
    //     const config = {
    //         "CourseEndDate": "ODO4HZT4XSg",
    //         "CourseStartDate": "N3rXacKJAjy",
    //         "DefaultStaffOrgUnit": "Esaneu7V7rq",
    //         "TEITypeCourse": "w47JOP0TBtT",
    //         "TEITypeStaff": "AsxfMid3pVW",
    //         "CourseAttendees": "r6m3Tekr5DO",
    //         "CourseAttendeesCount": "IA7YxfolpEM",
    //         "CourseEventId": "dTrDnb4e8Ee",
    //         "CoursePostTestScore": "zvXaKJnl14I",
    //         "CoursePreTestScore": "IAphSuyuH15",

    //         "CourseProgram": "Lw1g7haLUd9",
    //         "CourseProgramStageId": "h9zPG79AmgH",
    //         "CourseProgramAttributeCourseName": "Vnm7OVecUi1",
    //         "CourseDEPartner" : "hGGDYuGuVeX",
            
    //         "DefaultCourseOrgUnit": "Esaneu7V7rq",
    //         "Location": "Esaneu7V7rq",
    //         "LocationDE": "Pe5Lkrbvnos",
    //         "LocationTEA": "PYHaJIsQyxj",
    //         "StaffProgram": "vtSLYBYufMn",
    //         "StaffProgramCourse": "C6BqK9IAR7I",
    //         "ThematicAreaOptionset": "AvtckM3AMNR",
    //         "IndicatorTotalFemaleTrainee": "fWteSZrcYjO",
    //         "IndicatorTotalMaleTrainee": "zuqccgxi4dF",
    //         "IndicatorTotalUnknownTrainee": "Wyfg7HQa40s"
    //     };

    //     // Store the config object in sessionStorage and set it in state
    //     sessionStorage.setItem('config', JSON.stringify(config));
    //     setConfig(config);
    // }, []);


    useEffect(() => {
        // Only fetch if the settings aren't already cached in sessionStorage
        if (config) return;

        const fetchSettings = async () => {
            console.log('Fetching settings...');
            try {
                const { settings } = await engine.query({
                    settings: {
                        resource: 'dataStore/jtrain-MW/appSettings'
                    }
                });
                console.log('Fetched settings:', settings);
                // Store the config object in sessionStorage and set it in state
                sessionStorage.setItem('config', JSON.stringify(settings));
                setConfig(settings);
            } catch (error) {
                console.error('Error fetching settings:', error);
            }
        };

        fetchSettings();
    }, [config, engine]);

    // https://docs.dhis2.org/en/develop/using-the-api/dhis-core-version-240/data-store.html#webapi_data_store_create_values
    // THIS IS THE COMMAND CALL TO SET THE DATASTORE
    // curl "https://dhis2.sl.jhpiego.org/api/dataStore/jtrain/appSettings" -X POST -H "Content-Type: application/json" -d "{\"CourseEndDate\": \"ODO4HZT4XSg\", \"CourseStartDate\": \"N3rXacKJAjy\", \"DefaultStaffOrgUnit\": \"Esaneu7V7rq\", \"TEITypeCourse\": \"w47JOP0TBtT\", \"TEITypeStaff\": \"AsxfMid3pVW\", \"CourseAttendees\": \"r6m3Tekr5DO\", \"CourseAttendeesCount\": \"IA7YxfolpEM\", \"CourseEventId\": \"dTrDnb4e8Ee\", \"CoursePostTestScore\": \"zvXaKJnl14I\", \"CoursePreTestScore\": \"IAphSuyuH15\", \"CourseProgram\": \"Lw1g7haLUd9\", \"CourseProgramStageId\": \"h9zPG79AmgH\", \"CourseProgramAttributeCourseName\": \"Vnm7OVecUi1\", \"CourseDEPartner\": \"hGGDYuGuVeX\", \"DefaultCourseOrgUnit\": \"Esaneu7V7rq\", \"Location\": \"Esaneu7V7rq\", \"LocationDE\": \"Pe5Lkrbvnos\", \"LocationTEA\": \"PYHaJIsQyxj\", \"StaffProgram\": \"vtSLYBYufMn\", \"StaffProgramCourse\": \"C6BqK9IAR7I\", \"ThematicAreaOptionset\": \"AvtckM3AMNR\", \"IndicatorTotalFemaleTrainee\": \"fWteSZrcYjO\", \"IndicatorTotalMaleTrainee\": \"zuqccgxi4dF\", \"IndicatorTotalUnknownTrainee\": \"Wyfg7HQa40s\"}" -u trainingdemo:Jhpiego1!
    //curl "https://play.dhis2.org/demo/api/33/dataStore/foo/key_1" -X PUT -d "[1, 2, 3]"
    //-H "Content-Type: application/json" -u admin:district



    // Derive the active nav tab from the current URL
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
    }, [location, setSelectedTab]);

    // Views read config from sessionStorage during render, so wait until it's available
    if (!config) {
        return <CircularLoader />;
    }

    return (
        <div>
            <NavigationBar selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/coursesearch" element={<CourseSearch />} />
                <Route path="/staffsearch" element={<StaffSearch />} />
                <Route path="/staffview/:id" element={<Staffview />} /> 
                <Route path="/trainingcapture" element={<TrainingCapture />} />
                <Route path="/staffadd" element={<Staffadd />} />
                <Route path="/courseview/:id" element={<Courseview />} />
                {/* Development / test routes */}
                <Route path="/testcomponent/:id" element={<CourseDetailsStaffView />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/testtree" element={<MyComponent/>} />
            </Routes>
        </div>
    );
};


// Root component: logo + router wrapper around MainContent
const MyApp = () => {
    const [selectedTab, setSelectedTab] = useState('Home');


    // Unused - `navigate` isn't defined in this scope, so this would throw if called
    const handleNavigation = (path, tab) => {
        setSelectedTab(tab);
        navigate(path);
    };
    
    return (
        <Router>
             <div>
             <img src={logo} alt="jtrain logo" />
                    <div className={styles.container}>
                        <div className={styles.top}>
                            <MainContent selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
                        </div>
                        <div style={{ flexGrow: 1, overflowY: 'auto' }}>
                            <div style={{ paddingLeft: '25px' }}>
                            </div>
                        </div>
                    </div>
            </div>
        </Router>
        
    );
};
export default MyApp;