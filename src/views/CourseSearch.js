import { useDataQuery, useDataEngine } from '@dhis2/app-runtime'

import { CalendarInput } from '@dhis2-ui/calendar'
import {
    Table,
    TableBody,
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
    
    
    const [showAddCourse, setShowAddCourse] = useState(false);
    const [message, setMessage] = useState(localStorage.getItem('message') || '');
    const [selectedThematicArea, setSelectedThematicArea] = useState('');

    useEffect(() => {
        localStorage.removeItem('message');
    }, []);

    const reload = () => {
        setMessage('Course added successfully');
        setShowAddCourse(false);
        refetch();
    };

    const { loading, error, data, refetch } = useDataQuery(query, {
        variables: {
            ou: defCourseOrgUnitId,
            program: defCourseProgramId,
        },
    })

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

    if (loading) return <p>Loading...</p>;
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



            {loading && 'Loading...'}
            {error && error.message}
            {data?.instances?.trackedEntityInstances && (
                <Table>
                    <TableHead>
                        <TableRowHead>
                            {/* <TableCellHead>Thematic Area</TableCellHead> */}
                            <TableCellHead>Course Name</TableCellHead>
                            <TableCellHead>View</TableCellHead>
                        </TableRowHead>
                    </TableHead>
                    <TableBody>
                    {data.instances.trackedEntityInstances
                        
            .filter(instance => {
                                    const attributes = getAttributes(instance);
                                    return attributes.some(attr => attr.displayName === 'Course Name' && attr.value.toLowerCase().includes(searchTerm.toLowerCase())) &&
                                        (selectedThematicArea === '' || attributes.some(attr => attr.displayName === 'Course Thematic Area' && attr.value === selectedThematicArea));
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