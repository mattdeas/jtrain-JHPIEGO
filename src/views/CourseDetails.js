import { useDataQuery } from '@dhis2/app-runtime';
import {
    Table,
    TableBody,
    TableCell,
    TableCellHead,
    TableHead,
    TableRow,
    TableRowHead,
} from '@dhis2/ui';
import React, { useState } from 'react';
import { CourseDateAttendees } from './CourseDateAttendees'

const eventQuery = {
    events: {
        resource: 'events',
        params: ({ trackedEntityInstance }) => ({
            program: 'P59PhQsB6tb',
            orgUnit: 'VgrqnQEtyOP',
            trackedEntityInstance,
            fields: 'event,eventDate,dataValues[dataElement,value]'
        })
    }
};

const qryConstants = {
    // One query object in the whole query
    attributes: {
        // The `attributes` endpoint should be used
        resource: 'constants',
        params: {
            // Paging is disabled
            paging: false,
            // Only the attribute properties that are required should be loaded
            fields: 'id, displayName, code, value',
        },
    },
}

export const CourseDetails = ({ course }) => {
    const { loading, error, data } = useDataQuery(eventQuery, {
        variables: {
            trackedEntityInstance: course.trackedEntityInstance
        }
    });
    const [showCourseDetails, setShowCourseDetails] = useState(false);
    const [selectedCourseDate, setSelectedCourseDate] = useState(''); 


    const dSysConstants = useDataQuery(qryConstants);
    console.log(dSysConstants);

    // Check if data is loaded
    if (loading) return 'Loading...';
    if (error) return error.message;
    if (!data || !data.events) return 'No data';
        // Transform the data into an array of objects where each object represents a row in the table
    const rows = data.events.events.map(({ event, eventDate, dataValues }) => {
        const row = { event, eventDate };
        dataValues.forEach(({ dataElement, value }) => {
            row[dataElement] = value;
        });
        return row;
    });

    const dataElements = [...new Set(data.events.events.flatMap(({ dataValues }) => dataValues.map(({ dataElement }) => dataElement)))];

    // Check if dSysConstants data is loaded
    if (dSysConstants.loading) return 'Loading...';
    if (dSysConstants.error) return dSysConstants.error.message;
    if (!dSysConstants.data.attributes || !dSysConstants.data.attributes.constants) return 'No constants data';

    // Create a mapping of code to displayName from dSysConstants
    const codeToDisplayName = dSysConstants.data.attributes.constants.reduce((map, constant) => {
        map[constant.code] = constant.displayName;
        return map;
    }, {});
    
    return (
        <div>
        <table style={{width: '100%'}} >
        <tr>
            <td >
                <div style={{ width: '100%' }}>
            <h3>Course Details</h3>
            {/* <p>Tracked Entity Instance: {course.trackedEntityInstance}</p> */}
            <p>Thematic Area: {course.thematicArea}</p>
            <p>Course Name: {course.courseName}</p>

            {loading && 'Loading...'}
            {error && error.message}
            {data?.events && (
                
            <Table>
                <TableHead>
                    <TableRowHead>
                        {dataElements.map(dataElement => <TableCellHead key={dataElement}>{codeToDisplayName[dataElement]}</TableCellHead>)}
                    </TableRowHead>
                </TableHead>
                <TableBody>
                    {rows.map(({ event, eventDate, ...values }) => (
                        <TableRow key={event}>
                            {dataElements.map(dataElement => <TableCell key={dataElement}>{values[dataElement]}</TableCell>)}
                            <TableCell>
                            <button onClick={() => {
                                const selectedCourseData = {
                                    event: event,
                                    ...values
                                };
                                setSelectedCourseDate(selectedCourseData);
                                setShowCourseDetails(true);
                            }}>Select</button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            )}
                </div>
            </td>
            <td style={{ rowspan: 2 }}>
                <div >
                    <CourseDateAttendees eventID={selectedCourseDate.event} />
                </div>
            </td>
        </tr>
        <tr>
            <td>
            <div style={{ width: '100%' }}>
                {showCourseDetails && selectedCourseDate && (
                    <Table>
                        <TableBody>
                            {dataElements.map(dataElement => (
                                <TableRow key={dataElement}>
                                    <TableCell>{dataElement}</TableCell>
                                    <TableCell>{selectedCourseDate[dataElement]}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
        </div>
            </td>
            
        </tr>
        </table>
        
        </div>
    );
};