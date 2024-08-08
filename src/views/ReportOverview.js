import React, { useEffect, useState } from 'react';
import { useDataQuery } from '@dhis2/app-runtime';
import { utilConfigConstantValueByName } from '../utils/utils';

export const ReportOverview = () => {

    
    //const defStaffOrgUnitId = utilGetConstantValueByName('jtrain-DefaultStaffOrgUnit')
    // const defCourseOrgUnitId = utilGetConstantValueByName('jtrain-defaultcourseorgunit')
    // const defStaffType = utilGetConstantValueByName('jtrain-TEI-Type-Staff')
    // const defCourseType = utilGetConstantValueByName('jtrain-TEI-Type-Course')
    // const defStaffProgId = utilGetConstantValueByName('jtrain-staffprogram' )

    const defStaffOrgUnitId = utilConfigConstantValueByName('DefaultStaffOrgUnit')
    const defCourseOrgUnitId = utilConfigConstantValueByName('DefaultCourseOrgUnit')
    const defStaffType = utilConfigConstantValueByName('TEITypeStaff')
    const defCourseType = utilConfigConstantValueByName('TEITypeCourse')
    const defStaffProgId = utilConfigConstantValueByName('StaffProgram')


    const qryTEI = {
        // "page" variable below can be dinamically passed via refetch (see "handlePageChange" below)
        instances: {
            resource: 'trackedEntityInstances',
            params: ({ ou ,trackedEntityType }) => ({
                ou : ou,
                trackedEntityType : trackedEntityType,
                fields: ['trackedEntityInstance'],
                paging: 'false',
                pageSize: 10000,            }),
        },
    }

    const qryEvents = {
        events: {
            resource: 'events',
            params: ({ ou, program }) => ({
                ou: ou,
                program: program,
            }),
        },
    };
//    http://localhost:8082/api/39/events?ou=VgrqnQEtyOP&program=Ss21byybIqu

    const { loading: loading1, error: error1, data: dataStaff } = useDataQuery(qryTEI, {
        variables: {
            ou: defStaffOrgUnitId,
            trackedEntityType: defStaffType,
        },
    })
    
    const { loading: loading2, error: error2, data: dataCourses } = useDataQuery(qryTEI, {
        variables: {
            ou: defCourseOrgUnitId,
            trackedEntityType: defCourseType,
        },
    })

    const { loading: loading3, error: error3, data: dataEvents } = useDataQuery(qryEvents, {
        variables: {
            ou: defStaffOrgUnitId,
            program: defStaffProgId,
        },
    })

    if (loading1 || loading2  || loading3) return <span>Loading...</span>;
    if (error1 || error2 ) return <span>Error: {error1.message}</span>;

    return (
        <div>
            <p>Total number of trainees : {dataStaff.instances.trackedEntityInstances.length}</p>
            <p>Total number of courses : {dataCourses.instances.trackedEntityInstances.length}</p>
            <p>Total number of trainees attending training events: {dataEvents.events.events.length}</p>
        </div>
    );
};