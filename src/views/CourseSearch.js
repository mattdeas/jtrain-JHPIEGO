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
            ou: 'VgrqnQEtyOP',
            program: 'P59PhQsB6tb',
        },
    })
    console.log(Intl.DateTimeFormat().resolvedOptions().timeZone)
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearchTermChange = (event) => {
        setSearchTerm(event.target.value);
    }

    return (
        <div>
            <h1>Search Courses </h1>

            <select placeholder="Thematic Area">
                <option value="">Select Thematic Area</option>
                <option value="">QI</option>
                <option value="">CI</option>
            </select>

            <input type="text" value={searchTerm} onChange={handleSearchTermChange} placeholder="Course Name" />


            {/* <CalendarInput
    date="2021-10-13"
    dir="ltr"
    locale="en-CA"
    timeZone="Africa/Johannesburg"
    weekDayFormat="short"
/> */}
            <label >
                Start Date:
                <input type="date" />
            </label>

            <label>
                End Date:
                <input type="date" />
            </label>

            <button>Search</button>
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
                            .filter(item => item.attributes.some(attr => attr.displayName === 'Course Name' && attr.value.toLowerCase().includes(searchTerm.toLowerCase())))
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