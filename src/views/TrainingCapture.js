import { useDataQuery } from '@dhis2/app-runtime'
import {
    Table,
    TableBody,
    TableCell,
    TableCellHead,
    TableHead,
    TableRow,
    TableRowHead,
} from '@dhis2/ui'
import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CourseDetails } from './CourseDetails';
import { useFetchAndStoreConstants, utilConfigConstantValueByName } from '../utils/utils';
import { IconAddCircle24, IconSubtractCircle24, IconView16, IconView24 } from '@dhis2/ui';

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

const query = {
    instances: {
        resource: 'trackedEntityInstances',
        params: ({ ou, program }) => {
            const filters = [];
            
            return {
                ou: ou,
                program: program,
                fields: [
                    'trackedEntityInstance',
                    'orgUnit',
                    'attributes[attribute,code,displayName,value]',
                    'enrollments[enrollment,program,orgUnit,enrollmentDate,incidentDate,status,attributes[attribute,code,displayName,value]]',
                    'created',
                    'lastUpdated',
                    'orgUnits[id,displayName]',
                    '*',
                ],
                page: 1,
                pageSize: 1000,
                order: 'Vnm7OVecUi1:asc', // Course Name
                filter: filters,
            };
        },
    },
};

export const TrainingCapture = () => {
    const constants = useFetchAndStoreConstants();

    
    const [isSearchTableExpanded, setSearchTableExpanded] = useState(true);
    const [courseSelectionLabel, setCourseSelectionLabel] = useState('');

    const defCourseProgramId = utilConfigConstantValueByName('CourseProgram');
    const defCourseOrgUnitId = utilConfigConstantValueByName('DefaultCourseOrgUnit');
    const defCourseStartDate = utilConfigConstantValueByName('CourseStartDate');
    const defCourseEndDate = utilConfigConstantValueByName('CourseEndDate');
    
    const { loading, error, data } = useDataQuery(query, {
        variables: {
            ou: defCourseOrgUnitId,
            program: defCourseProgramId,
        },
    })

    const [selectedCourse, setSelectedCourse] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearchTermChange = (event) => {
        setSearchTerm(event.target.value);
    }

    const [refreshKey, setRefreshKey] = useState(0);

    const updateHeadings = (xString) => {
        // Concatenate xString to courseSelectionLabel
        setCourseSelectionLabel(prevLabel => `${prevLabel} ${xString} `);
        setSearchTableExpanded(false);
    };
    const updateHeadingsParent = () => {
        setCourseSelectionLabel(' : '); 
    }

    // Caused by DHIS2 API version structure - caters for 2.40.3 and lower
    const getAttributes = (instance) => {
        // Check if attributes are at the root level
        if (instance.attributes && instance.attributes.length > 0) {
            return instance.attributes;
        }
        // Check if attributes are within enrollments
        if (instance.enrollments && instance.enrollments.length > 0) {
            return instance.enrollments[0].attributes;
        }
        return [];
    };

    console.log("Data", data);

    return (
        <div style={{ position: 'float', top: '20%', width: '95%' }}>
            

            {loading && 'Loading...'}
            {error && error.message}
            {data?.instances?.trackedEntityInstances && (
                
                <div>
                
                <p onClick={() => setSearchTableExpanded(!isSearchTableExpanded)} style={{ backgroundColor: isSearchTableExpanded ? 'lightblue' : 'lightgrey', width: '100%', height: '40px' }}>
        
        <span style={{ float: 'left', border: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', paddingTop: '5px' }}>
    <div style={{ width: '20px', textAlign: 'center' }}>
        <strong>{isSearchTableExpanded ? <IconSubtractCircle24 /> : <IconAddCircle24 />}</strong>
    </div>
    <strong style={{ paddingLeft: '10px' }}>
        Course Selection                 
        {isSearchTableExpanded ? '' : courseSelectionLabel}
    </strong>
</div>
        </span>
    </p>          
                {isSearchTableExpanded && data?.instances?.trackedEntityInstances && (
                    <>
                    <h3>Select Subject Area </h3>
                    <input type="text" value={searchTerm} onChange={handleSearchTermChange} />
                    
                    <Table>
                    <TableHead>
                        <TableRowHead>
                            <TableCellHead>Course Name</TableCellHead>
                            <TableCellHead>View</TableCellHead>
                        </TableRowHead>
                    </TableHead>
                    <TableBody>
                    
                    {data.instances.trackedEntityInstances
    .slice(0, 10)
    .map(instance => {
        const attributes = getAttributes(instance);
        const attributesObj = attributes.reduce((obj, item) => {
            obj[item.displayName] = item.value;
            return obj;
        }, {});

        return (
            <TableRow key={instance.trackedEntityInstance}>
                <TableCell>{attributesObj['Course Name']}</TableCell>
                <TableCell>
                    <div onClick={() => {
                        setSelectedCourse({
                            trackedEntityInstance: instance.trackedEntityInstance,
                            courseName: attributesObj['Course Name'],
                            startDateVar: defCourseStartDate,
                            endDateVar: defCourseEndDate
                        });
                        setCourseSelectionLabel(' : ' + attributesObj['Course Name'] + " - ");
                        setRefreshKey(prevKey => prevKey + 1);
                    }}><IconView24 /></div>
                </TableCell>
            </TableRow>
        );
    })}
                    </TableBody>
                    </Table>
                    </>
                )}
                
                </div>
            )}
            <div style={{ verticalAlign: 'top' }}>
                {selectedCourse && <CourseDetails key={refreshKey} course={selectedCourse} updateHeadings={updateHeadings} />}
            </div>
        </div>
    )
}












