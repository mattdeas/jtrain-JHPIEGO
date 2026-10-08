import { useDataQuery, useDataEngine } from '@dhis2/app-runtime'

import { CalendarInput } from '@dhis2-ui/calendar'
import {
    Table,
    TableBody,
    CircularLoader,
    TableCell,
    TableCellHead,
    TableHead,
    TableRow,
    TableRowHead,
} from '@dhis2/ui'
import React, { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CourseAdd} from './CourseAdd'
import { utilgetCodeByName } from '../utils/utils'
import { IconAdd24, IconView24 } from '@dhis2/ui'
import { utilConfigConstantValueByName } from '../utils/utils'



// const query = {
//     instances: {
//         resource: 'trackedEntityInstances',
//         params: ({ ou, program }) => ({
//             ou,
//             program,
//             fields: '*',
//         }),
//     },
// }


/**
 * CourseSearch (/coursesearch - "Course" tab)
 * Search courses by name (and course type when configured), open a course, or add a new one.
 */

// All course TEIs in the Course program, sorted by Course Name (Vnm7OVecUi1).
// Filtering happens client-side below.
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


export const CourseSearch = () => {

    const defCourseOrgUnitId = utilConfigConstantValueByName('DefaultCourseOrgUnit')
    const defCourseProgramId = utilConfigConstantValueByName('CourseProgram')
    const defThemAreaId = utilConfigConstantValueByName('ThematicAreaOptionset')
    // Course type features are hidden if CourseTypeTEA isn't configured in appSettings
    const defCourseTypeTEA = utilConfigConstantValueByName('CourseTypeTEA')

    
    
    const [showAddCourse, setShowAddCourse] = useState(false);
    const [message, setMessage] = useState(localStorage.getItem('message') || '');
    const [selectedThematicArea, setSelectedThematicArea] = useState('');
    const [selectedCourseType, setSelectedCourseType] = useState('all');

    // One-time flash message: shown once from localStorage, then cleared (nothing currently writes it)
    useEffect(() => {
        localStorage.removeItem('message');
    }, []);

    // After a new course is saved: show confirmation, close the form, reload the list
    const reload = () => {
        setMessage('Course added successfully');
        setShowAddCourse(false);
        refetch();
    };

    console.log('OU:', defCourseOrgUnitId);
    console.log('PROGRAM:', defCourseProgramId);
    const { loading, error, data, refetch } = useDataQuery(query, {
        variables: {
            ou: defCourseOrgUnitId,
            program: defCourseProgramId,
        },
    })

    // Thematic area options (the filter dropdown that uses this is currently commented out)
    const thematicAreasQuery = {
        thematicAreas: {
            resource: `optionSets/${defThemAreaId}`,
            params: {
                fields: 'options[name,code]',
            },
        },
    };
    
    const { loading: loadingThematicAreas, error: errorThematicAreas, data: dThematicAreas } = useDataQuery(thematicAreasQuery);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearchTermChange = (event) => {
        setSearchTerm(event.target.value);
    }

    const handleThematicAreaChange = (event) => {
        setSelectedThematicArea(event.target.value);
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

    if (loading) return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <CircularLoader small />
            <p>Loading...</p>
        </div>
    );
    if (error) return <p>Error: {error.message}</p>;

    console.log('Data:', data);
    return (
        <div>
            <h1>Search Courses </h1>

            {/* <select placeholder="Thematic Area" value={selectedThematicArea} onChange={handleThematicAreaChange}>
            <option value="">Select Thematic Area</option>
            {dThematicAreas && dThematicAreas.thematicAreas.options.map((option, index) => (
                <option key={index} value={option.code}>{option.name}</option>
            ))}
        </select> */}

            <input type="text" value={searchTerm} onChange={handleSearchTermChange} placeholder="Course Name" />

            {defCourseTypeTEA && (
                <select value={selectedCourseType} onChange={(e) => setSelectedCourseType(e.target.value)}>
                    <option value="all">All</option>
                    <option value="mentorship">Mentorship</option>
                    <option value="training">Training</option>
                </select>
            )}



            {loading && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <CircularLoader small />
                    <span>Loading...</span>
                </div>
            )}
            {error && error.message}
            {data?.instances?.trackedEntityInstances && (
                <Table>
                    <TableHead>
                        <TableRowHead>
                            {/* <TableCellHead>Thematic Area</TableCellHead> */}
                            <TableCellHead>Course Name</TableCellHead>
                            {defCourseTypeTEA && <TableCellHead>Course Type</TableCellHead>}
                            <TableCellHead>View</TableCellHead>
                        </TableRowHead>
                    </TableHead>
                    <TableBody>
                    {data.instances.trackedEntityInstances
                        
            // Match on course name (contains), thematic area and course type; then show the first 10
            .filter(instance => {
                                    const attributes = getAttributes(instance);
                                    const courseType = attributes.find(attr => attr.attribute === defCourseTypeTEA)?.value || '';
                                    return attributes.some(attr => attr.displayName === 'Course Name' && attr.value.toLowerCase().includes(searchTerm.toLowerCase())) &&
                                        (selectedThematicArea === '' || attributes.some(attr => attr.displayName === 'Course Thematic Area' && attr.value === selectedThematicArea)) &&
                                        (!defCourseTypeTEA || selectedCourseType === 'all' || courseType.toLowerCase() === selectedCourseType);
                                })
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
                                            {defCourseTypeTEA && <TableCell>{attributes.find(attr => attr.attribute === defCourseTypeTEA)?.value || ''}</TableCell>}
                                            <TableCell>
                                                <Link to={`/courseview/${instance.trackedEntityInstance}`}><IconView24/></Link>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                    </TableBody>
                    
                </Table>
            )}
            <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => { setShowAddCourse(true); setMessage(''); }}><IconAdd24 /> New Course</button>
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                

            {showAddCourse ? (
                <CourseAdd onCancel={() => setShowAddCourse(false)} onSaved={reload} />
            ) : (
                <p>{message}</p>
            )}
            </div>
        </div>
    )
}