import { useDataQuery } from '@dhis2/app-runtime'
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
import { CourseAdd} from './Course-Add'

const query = {
    instances: {
        resource: 'trackedEntityInstances',
        params: ({ ou, program }) => ({
            ou,
            program,
        }),
    },
}

export const CourseSearch = () => {
    const { id } = useParams(); // Get the ID from the URL
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

    const sysConstants =  JSON.parse(sessionStorage.getItem('constants'));

    const getConstantValueByName = (name) => {
        const sysConstants = JSON.parse(sessionStorage.getItem('constants'));
        const constant = sysConstants.find(constant => constant.name === name);
        if (constant) {
            return constant.code.substring(name.length + 1);
        }
        return null;
    }

    const defCourseOrgUnitId = getConstantValueByName('jtrain-defaultcourseorgunit')
    const defCourseProgramId = getConstantValueByName('jtrain-courseprogram')
    const defThemAreaId = getConstantValueByName('jtrain-thematicarea-optionset')

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
        // Perform the search here
    }

    return (
        <div>
            <h1>Search Courses </h1>

            <select placeholder="Thematic Area" value={selectedThematicArea} onChange={handleThematicAreaChange}>
            <option value="">Select Thematic Area</option>
            {dThematicAreas && dThematicAreas.thematicAreas.options.map((option, index) => (
                <option key={index} value={option.code}>{option.name}</option>
            ))}
        </select>

            <input type="text" value={searchTerm} onChange={handleSearchTermChange} placeholder="Course Name" />


            {loading && 'Loading...'}
            {error && error.message}
            {data?.instances?.trackedEntityInstances && (
                <Table>
                    <TableHead>
                        <TableRowHead>
                            <TableCellHead>Thematic Area</TableCellHead>
                            <TableCellHead>Course Name</TableCellHead>
                            <TableCellHead>Course Dates</TableCellHead>
                            <TableCellHead>Open</TableCellHead>
                        </TableRowHead>
                    </TableHead>
                    <TableBody>
                    {data.instances.trackedEntityInstances
                        .filter(item => 
                        item.attributes.some(attr => attr.displayName === 'Course Name' && attr.value.toLowerCase().includes(searchTerm.toLowerCase())) &&
                        (selectedThematicArea === '' || item.attributes.some(attr => attr.displayName === 'Course Thematic Area' && attr.value === selectedThematicArea))
                    )
                    .slice(0, 10)
                    .map(
                        ({ trackedEntityInstance, attributes }) => {
                            const attributesObj = attributes.reduce((obj, item) => {
                                obj[item.displayName] = item.value;
                                return obj;
                            }, {});

                            return (
                                <TableRow key={trackedEntityInstance}>
                                    <TableCell>{attributesObj['Course Thematic Area']}</TableCell>
                                    <TableCell>{attributesObj['Course Name']}</TableCell>
                                    <TableCell>{attributesObj['']}</TableCell>
                                    <TableCell>
                                        <Link to={`/courseview/${trackedEntityInstance}`}>View Details</Link>
                                    </TableCell>
                                </TableRow>
                            );
                        }
                    )}
                    </TableBody>
                    
                </Table>
            )}
            <button onClick={() => { setShowAddCourse(true); setMessage(''); }}>Add New Course</button>
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