import React, { useEffect, useState } from 'react';
import { useDataEngine } from '@dhis2/app-runtime';
import { ReportOverview } from './ReportOverview';
import { utilConfigConstantValueByName } from '../utils/utils';

export const Home = () => {
    const engine = useDataEngine();
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
            "IndicatorTotalMaleTrainee": "mtKAszEGXQ2",
            "IndicatorTotalUnknownTrainee": "Wyfg7HQa40s"
        };

        // Store the config object in sessionStorage and set it in state
        sessionStorage.setItem('config', JSON.stringify(config));
        setConfig(config);
    }, []);

    // const testValue = config ? utilConfigConstantValueByName('CourseEndDate') : 'Loading...';

    return (
        <div>
            <h1>Home</h1>
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