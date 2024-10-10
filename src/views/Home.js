import React, { useEffect, useState } from 'react';
import { useDataEngine } from '@dhis2/app-runtime';
import { ReportOverview } from './ReportOverview';
import { utilConfigConstantValueByName } from '../utils/utils';
import { utilConfigConstantValueByName2 } from '../utils/utils';

export const Home = () => {
    const engine = useDataEngine();
    const [config, setConfig] = useState(null);


    useEffect(() => {
        // Retrieve the config object from sessionStorage
        const storedConfig = sessionStorage.getItem('config');
        if (storedConfig) {
            setConfig(JSON.parse(storedConfig));
        }
    }, []);

    useEffect(() => {
        if (!config) {
            // Fetch the settings from the API if not already in sessionStorage
            const fetchSettings = async () => {
                console.log('Fetching settings...');
                try {
                    const { settings } = await engine.query({
                        settings: {
                            resource: 'dataStore/jtrain/appSettings'
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
        }
    }, [config, engine]);
    
    // useEffect(() => {
    //     const config = {
    //         "CourseEndDate": "ODO4HZT4XSg",
    //         "CourseStartDate": "N3rXacKJAjy",
    //         "DefaultStaffOrgUnit": "Esaneu7V7rq",
    //         "TEITypeCourse": "EcbFeAtWDmP",
    //         "TEITypeStaff": "AsxfMid3pVW",
    //         "CourseAttendees": "r6m3Tekr5DO",
    //         "CourseAttendeesCount": "IA7YxfolpEM",
    //         "CourseEventId": "dTrDnb4e8Ee",
    //         "CoursePostTestScore": "zvXaKJnl14I",
    //         "CoursePreTestScore": "IAphSuyuH15",
    //         "CourseProgram": "Lw1g7haLUd9",
    //         "CourseProgramStageId": "h9zPG79AmgH",
    //         "DefaultCourseOrgUnit": "Esaneu7V7rq",
    //         "Location": "Esaneu7V7rq",
    //         "LocationDE": "Pe5Lkrbvnos",
    //         "LocationTEA": "PYHaJIsQyxj",
    //         "StaffProgram": "vtSLYBYufMn",
    //         "StaffProgramCourse": "C6BqK9IAR7I",
    //         "ThematicAreaOptionset": "AvtckM3AMNR",
    //         "IndicatorTotalFemaleTrainee": "fWteSZrcYjO",
    //         "IndicatorTotalMaleTrainee": "mtKAszEGXQ2",
    //         "IndicatorTotalUnknownTrainee": "Wyfg7HQa40s"
    //     };

    //     // Store the config object in sessionStorage and set it in state
    //     sessionStorage.setItem('config', JSON.stringify(config));
    //     setConfig(config);
    // }, []);

    // console.log('REACT_APP_DEFAULT_STAFF_ORG_UNIT:', process.env.REACT_APP_DEFAULT_STAFF_ORG_UNIT);
    // console.log('DHIS2_TEST:', process.env.DHIS2_TEST);
    // console.log('REACT_APP_DHIS2_TEST:', process.env.REACT_APP_DHIS2_TEST);
    // const testValue = config ? utilConfigConstantValueByName('CourseEndDate') : 'Loading...';
    // DHIS2_TEST=IWONDER
    // REACT_APP_DHIS2_TEST=WHYWHYWHY
    return (
        <div>
            <h1>Home</h1>
            {/* <p>{process.env.DHIS2_TEST}</p> */}
            {/* <p>{process.env.REACT_APP_DHIS2_TEST}</p> */}
            {/* <p>IT SHOULD BE ABOVE</p> */}
            {config ? (
                <>
                    <ReportOverview />
                </>
            ) : (
                <p>Loading configuration...</p>
            )}
        </div>
    );
};