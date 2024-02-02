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
        params: ({ ou, program }) => ({
            ou,
            program,
        }),
    },
}

const qryConstants = {
    attributes: {
        resource: 'constants',
        params: {
            paging: false,
            fields: 'id, displayName, code, ',
        },
    },
}

export const TrainingCapture = () => {
    const { id } = useParams(); // Get the ID from the URL
    const [isSearchTableExpanded, setSearchTableExpanded] = useState(true);

    const { loading, error, data } = useDataQuery(query, {
        variables: {
            ou: 'VgrqnQEtyOP',
            program: 'P59PhQsB6tb',
        },
    })
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearchTermChange = (event) => {
        setSearchTerm(event.target.value);
    }

    

    return (
        <div>
            

            {loading && 'Loading...'}
            {error && error.message}
            {data?.instances?.trackedEntityInstances && (
                
                <div onClick={() => setSearchTableExpanded(!isSearchTableExpanded)}>
                
                <p style={{ backgroundColor: isSearchTableExpanded ? 'lightblue' : 'lightgrey', width: '100%', height: '50px' }}>
        <strong>Course Type Selection</strong>
        <span style={{ float: 'left', border: '1px solid black' }}>
            {isSearchTableExpanded ? '-' : '+'}
        </span>
    </p>          
                {isSearchTableExpanded && data?.instances?.trackedEntityInstances && (
                    <>
                    <h3>Select Subject Area </h3>
                    <input type="text" value={searchTerm} onChange={handleSearchTermChange} />
                    
                    <Table>
                    <TableHead>
                        <TableRowHead>
                            <TableCellHead>Thematic Area</TableCellHead>
                            <TableCellHead>Course Name</TableCellHead>
                            <TableCellHead>Select</TableCellHead>
                        </TableRowHead>
                    </TableHead>
                    <TableBody>
                        {data.instances.trackedEntityInstances
                            .filter(item => item.attributes.some(attr => attr.displayName === 'Course Thematic Area' && attr.value.toLowerCase().includes(searchTerm.toLowerCase())))
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
                                            {/* <TableCell>{attributesObj['']}</TableCell> */}
                                            <TableCell>
                                            <button onClick={() => {
                                                setSelectedCourse({
                                                    trackedEntityInstance: trackedEntityInstance,
                                                    thematicArea: attributesObj['Course Thematic Area'],
                                                    courseName: attributesObj['Course Name'],
                                                    startDateVar: 'I3k1jlogV15',
                                                    endDateVar: 'ahGuEZrtqR5'
                                                });
                                                setSearchTableExpanded(!isSearchTableExpanded);
                                            }}>Select</button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                }
                            )}
                    </TableBody>
                    </Table>
                    </>
                )}
                
                </div>
            )}
            <div style={{ verticalAlign: 'top' }}>
                {selectedCourse && <CourseDetails course={selectedCourse} />}
            </div>
        </div>
    )
}












